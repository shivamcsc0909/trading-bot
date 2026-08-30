//+------------------------------------------------------------------+
//|                                           TechForexGoldBot.mq5   |
//|                                  Tech Forex MT5 Automated Bot    |
//|               Copyright 2026, Tech Forex Trading Platform        |
//+------------------------------------------------------------------+
#property copyright   "Tech Forex Platform"
#property link        "https://techforex.in"
#property version     "1.00"
#property description "Commercial MT5 Trading Bot implementing XAUUSD 100-Block Strategy and Web API Sync"

//--- Included Modules
#include "Include/ApiClient.mqh"
#include "Include/LicenseGuard.mqh"
#include "Include/AccountSync.mqh"
#include "Include/RiskManager.mqh"
#include "Include/GoldStrategy.mqh"
#include "Include/OrderManager.mqh"

//--- Inputs
input group "=== COMMERCIAL LICENSE & API ==="
input string   InpLicenseKey         = "TF-GOLD-8829-9401-K9X2"; // Commercial License Key
input string   InpApiUrl             = "https://yourdomain.com"; // API Base URL (Allowed in WebRequest)
input int      InpHeartbeatInterval  = 15;                       // Heartbeat Interval (Seconds)

input group "=== BOT & EXECUTION SETTINGS ==="
input ulong    InpMagicNumber        = 108801;                   // Expert Advisor Magic Number
input string   InpTradeSymbol        = "XAUUSD";                 // Trading Symbol (Gold)
input ENUM_TIMEFRAMES InpTimeframe   = PERIOD_M5;                // Strategy Timeframe (M5 as per PDF)
input int      InpSlippagePoints     = 30;                       // Maximum Slippage (Points)

input group "=== RISK MANAGEMENT (PDF RULES) ==="
input double   InpRiskPercent        = 2.0;                      // Risk % per trade (PDF 1-2% max)
input double   InpMaxLotSize         = 1.00;                     // Maximum Lot Size Ceiling
input double   InpMinLotSize         = 0.01;                     // Minimum Lot Size Floor
input int      InpMaxOpenPositions   = 2;                        // Maximum Concurrent Positions
input int      InpMaxDailySlHits     = 3;                        // Daily SL Limit (3 SL hits = Stop trading)
input int      InpMaxSpreadPoints    = 35;                       // Maximum Allowed Spread Points

input group "=== STRATEGY & FILTERS ==="
input bool     InpCandleConfirmation = true;                     // Require Pin Bar / Engulfing Confirmation
input bool     InpFilterF1TimeWindow = true;                     // Enable Filter F1 (9:00 AM - 2:00 PM IST No-Trade)

//--- Global Objects
CApiClient     g_api;
CLicenseGuard  g_license;
CAccountSync   g_account;
CRiskManager   g_risk;
CGoldStrategy  g_strategy;
COrderManager  g_orders;

datetime       g_lastHeartbeatTime = 0;
datetime       g_lastPositionSync  = 0;

//+------------------------------------------------------------------+
//| Expert initialization function                                   |
//+------------------------------------------------------------------+
int OnInit()
{
   Print("=================================================");
   Print("Initializing Tech Forex Gold Automated Trading Bot...");
   Print("=================================================");

   // Initialize API Client
   g_api.Init(InpApiUrl, InpLicenseKey);

   // Initialize License Guard
   g_license.Init(&g_api, 60);

   // Initialize Account Sync
   g_account.Init(&g_api, InpMagicNumber, InpHeartbeatInterval);

   // Initialize Risk Manager
   g_risk.Init(InpRiskPercent, InpMaxLotSize, InpMinLotSize, InpMaxOpenPositions, InpMaxDailySlHits);

   // Initialize Strategy
   g_strategy.Init(InpTradeSymbol, InpTimeframe, InpCandleConfirmation);

   // Initialize Order Manager
   g_orders.Init(&g_api, InpMagicNumber, InpSlippagePoints);

   // Initial License Validation Handshake
   if(!g_license.ValidateLicense())
   {
      Print("[WARNING] License validation failed on startup. Bot will operate in restricted mode until validated.");
   }

   // Enable 1-second timer for heartbeats & sync
   EventSetTimer(1);

   // Initial Sync
   g_account.SyncOpenPositions();

   return(INIT_SUCCEEDED);
}

//+------------------------------------------------------------------+
//| Expert deinitialization function                                 |
//+------------------------------------------------------------------+
void OnDeinit(const int reason)
{
   EventKillTimer();
   PrintFormat("Tech Forex Gold Bot Deinitialized. Reason: %d", reason);
}

//+------------------------------------------------------------------+
//| Expert tick function                                             |
//+------------------------------------------------------------------+
void OnTick()
{
   // Check if Bot is authorized and enabled
   if(!g_license.CanTrade())
   {
      return;
   }

   // Check Risk Barriers
   int openCount = g_orders.CountOpenPositions(InpTradeSymbol);
   if(!g_risk.IsTradeAllowed(InpTradeSymbol, openCount))
   {
      return;
   }

   // Evaluate Strategy Signals (M5 Level Block + Candle Confirmation)
   TradeSignal signal;
   if(g_strategy.EvaluateSignal(signal))
   {
      PrintFormat("[STRATEGY SIGNAL] Found %s setup: %s @ %.5f | SL: %.5f | TP: %.5f",
                  (signal.type == SIGNAL_BUY ? "BUY" : "SELL"), signal.reason, signal.price, signal.sl, signal.tp);

      // Dynamic Lot Sizing
      double slDistPoints = MathAbs(signal.price - signal.sl) / SymbolInfoDouble(InpTradeSymbol, SYMBOL_POINT);
      double lotSize = g_risk.CalculateLotSize(InpTradeSymbol, slDistPoints);

      // Execute Order
      if(g_orders.ExecuteSignal(signal, lotSize))
      {
         // Immediately sync positions
         g_account.SyncOpenPositions();
      }
   }
}

//+------------------------------------------------------------------+
//| Timer function                                                   |
//+------------------------------------------------------------------+
void OnTimer()
{
   datetime now = TimeCurrent();

   // Heartbeat & Remote Kill Switch Check
   if(now - g_lastHeartbeatTime >= InpHeartbeatInterval)
   {
      bool botEnabled = false;
      string botMode  = "DEMO";

      if(g_account.SendHeartbeat(botEnabled, botMode))
      {
         g_license.SetBotEnabled(botEnabled);
      }
      
      g_lastHeartbeatTime = now;
   }

   // Periodic Open Position Sync (every 5 seconds)
   if(now - g_lastPositionSync >= 5)
   {
      g_account.SyncOpenPositions();
      g_lastPositionSync = now;
   }
}

//+------------------------------------------------------------------+
//| Trade transaction callback                                       |
//+------------------------------------------------------------------+
void OnTradeTransaction(const MqlTradeTransaction &trans,
                        const MqlTradeRequest &request,
                        const MqlTradeResult &result)
{
   // Monitor closed deals to sync trade history and track Daily SL hits
   if(trans.type == TRADE_TRANSACTION_DEAL_ADD)
   {
      ulong dealTicket = trans.deal;
      if(dealTicket > 0 && HistoryDealSelect(dealTicket))
      {
         long magic = HistoryDealGetInteger(dealTicket, DEAL_MAGIC);
         if(magic == (long)InpMagicNumber)
         {
            long entryType = HistoryDealGetInteger(dealTicket, DEAL_ENTRY);
            if(entryType == DEAL_ENTRY_OUT) // Position closed
            {
               double profit     = HistoryDealGetDouble(dealTicket, DEAL_PROFIT);
               double volume     = HistoryDealGetDouble(dealTicket, DEAL_VOLUME);
               double price      = HistoryDealGetDouble(dealTicket, DEAL_PRICE);
               double commission = HistoryDealGetDouble(dealTicket, DEAL_COMMISSION);
               double swap       = HistoryDealGetDouble(dealTicket, DEAL_SWAP);
               string symbol     = HistoryDealGetString(dealTicket, DEAL_SYMBOL);
               string comment    = HistoryDealGetString(dealTicket, DEAL_COMMENT);
               datetime closeTime= (datetime)HistoryDealGetInteger(dealTicket, DEAL_TIME);
               ulong posTicket   = HistoryDealGetInteger(dealTicket, DEAL_POSITION_ID);

               string typeStr = (HistoryDealGetInteger(dealTicket, DEAL_TYPE) == DEAL_TYPE_BUY) ? "BUY" : "SELL";

               // Record SL Hit if profit is negative
               if(profit < 0)
               {
                  g_risk.RecordSlHit();
               }

               // Sync closed trade with PHP API
               g_account.SyncClosedTrade(dealTicket, posTicket, symbol, typeStr, volume, price, price, 0, 0, profit, commission, swap, comment, closeTime - 3600, closeTime);
               g_account.SyncOpenPositions();
            }
         }
      }
   }
}
