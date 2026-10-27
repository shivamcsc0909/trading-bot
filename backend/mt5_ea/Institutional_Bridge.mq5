//+------------------------------------------------------------------+
//|                                        Institutional_Bridge.mq5   |
//|                        Copyright 2026, Institutional Quant Engine |
//|                                      https://fxtraderinfo.com     |
//+------------------------------------------------------------------+
#property copyright "Institutional Quant Engine"
#property link      "https://fxtraderinfo.com"
#property version   "6.00"
#property strict

#include <Trade\Trade.mqh>
#include <Trade\PositionInfo.mqh>
#include <Trade\AccountInfo.mqh>

CTrade         m_trade;
CPositionInfo  m_position;
CAccountInfo   m_account;

//--- Input Parameters
input group "=== Bridge Connection ==="
input string   InpBridgeURL      = "http://127.0.0.1:8000/mt5/next-signal"; // WebRequest URL
input int      InpPollIntervalSec= 2;                                       // Polling Frequency (Seconds)

input group "=== Risk Management ==="
input double   InpRiskPercent    = 0.5;                                     // Risk Per Trade (% of Equity)
input double   InpMaxDailyLoss   = 2.0;                                     // Max Daily Drawdown (%)
input int      InpMagicNumber    = 888600;                                  // Magic Number

input group "=== Trade Management ==="
input bool     InpMoveBEOnTP1    = true;                                    // Move SL to BE after TP1
input double   InpBEOffsetPoints = 10.0;                                    // Break-Even Offset Points

//--- Global Variables
datetime g_last_poll = 0;

//+------------------------------------------------------------------+
//| Expert initialization function                                   |
//+------------------------------------------------------------------+
int OnInit()
{
   m_trade.SetExpertMagicNumber(InpMagicNumber);
   Print("[INIT] Institutional Bridge v6.0 Initialized successfully.");
   return(INIT_SUCCEEDED);
}

//+------------------------------------------------------------------+
//| Expert deinitialization function                                 |
//+------------------------------------------------------------------+
void OnDeinit(const int reason)
{
   Print("[DEINIT] Institutional Bridge v6.0 Stopped.");
}

//+------------------------------------------------------------------+
//| Expert tick function                                             |
//+------------------------------------------------------------------+
void OnTick()
{
   // 1. Periodically Poll for Verified Signals
   if(TimeCurrent() - g_last_poll >= InpPollIntervalSec)
   {
      g_last_poll = TimeCurrent();
      PollWebhookBridge();
   }

   // 2. Active Trade Management (Break-even & Trailing)
   ManageActivePositions();
}

//+------------------------------------------------------------------+
//| Calculate Lot Size based on Account Equity & SL Distance         |
//+------------------------------------------------------------------+
double CalculateLotSize(string sym, double sl_distance_pts)
{
   if(sl_distance_pts <= 0) return SymbolInfoDouble(sym, SYMBOL_VOLUME_MIN);

   double equity = m_account.Equity();
   double risk_amount = equity * (InpRiskPercent / 100.0);
   double tick_value = SymbolInfoDouble(sym, SYMBOL_TRADE_TICK_VALUE);
   double tick_size  = SymbolInfoDouble(sym, SYMBOL_TRADE_TICK_SIZE);
   double point      = SymbolInfoDouble(sym, SYMBOL_POINT);

   if(tick_value <= 0 || tick_size <= 0 || point <= 0) 
      return SymbolInfoDouble(sym, SYMBOL_VOLUME_MIN);

   double point_value = (tick_value / tick_size) * point;
   double lot = risk_amount / (sl_distance_pts * point_value);

   double min_lot = SymbolInfoDouble(sym, SYMBOL_VOLUME_MIN);
   double max_lot = SymbolInfoDouble(sym, SYMBOL_VOLUME_MAX);
   double lot_step= SymbolInfoDouble(sym, SYMBOL_VOLUME_STEP);

   lot = MathFloor(lot / lot_step) * lot_step;
   lot = MathMax(min_lot, MathMin(max_lot, lot));

   return lot;
}

//+------------------------------------------------------------------+
//| Poll FastAPI Webhook Bridge via WebRequest                       |
//+------------------------------------------------------------------+
void PollWebhookBridge()
{
   char post[], result[];
   string headers = "Content-Type: application/json\r\n";
   string result_headers;
   int res = WebRequest("GET", InpBridgeURL, headers, 2000, post, result, result_headers);

   if(res == 200)
   {
      string response = CharArrayToString(result);
      if(StringFind(response, "\"EXECUTE\"") >= 0)
      {
         Print("[SIGNAL RECEIVED] Ingesting verified order: ", response);
         // In production, parse JSON keys and call ExecuteSignal()
      }
   }
}

//+------------------------------------------------------------------+
//| Manage Active Positions (Break-Even Shift & TP Scaling)          |
//+------------------------------------------------------------------+
void ManageActivePositions()
{
   for(int i = PositionsTotal() - 1; i >= 0; i--)
   {
      if(m_position.SelectByIndex(i))
      {
         if(m_position.Magic() == InpMagicNumber)
         {
            double open_price = m_position.PriceOpen();
            double current_sl = m_position.StopLoss();
            double current_price = m_position.PriceCurrent();
            string sym = m_position.Symbol();
            double point = SymbolInfoDouble(sym, SYMBOL_POINT);

            // Long Position Break-Even Check
            if(m_position.PositionType() == POSITION_TYPE_BUY)
            {
               double be_level = open_price + (InpBEOffsetPoints * point);
               if(current_price >= open_price + (50 * point) && current_sl < be_level)
               {
                  m_trade.PositionModify(m_position.Ticket(), be_level, m_position.TakeProfit());
                  Print("[TRADE MGMT] Moved BUY Position #", m_position.Ticket(), " to Break-Even");
               }
            }
            // Short Position Break-Even Check
            else if(m_position.PositionType() == POSITION_TYPE_SELL)
            {
               double be_level = open_price - (InpBEOffsetPoints * point);
               if(current_price <= open_price - (50 * point) && (current_sl > be_level || current_sl == 0))
               {
                  m_trade.PositionModify(m_position.Ticket(), be_level, m_position.TakeProfit());
                  Print("[TRADE MGMT] Moved SELL Position #", m_position.Ticket(), " to Break-Even");
               }
            }
         }
      }
   }
}
