//+------------------------------------------------------------------+
//|                                                 OrderManager.mqh |
//|                                  Tech Forex MT5 Automated Bot    |
//+------------------------------------------------------------------+
#property copyright "Tech Forex MT5 Platform"
#property strict

#include <Trade\Trade.mqh>
#include "ApiClient.mqh"
#include "GoldStrategy.mqh"

class COrderManager
{
private:
   CTrade      m_trade;
   CApiClient* m_api;
   ulong       m_magic;
   int         m_slippage;

public:
   COrderManager() : m_api(NULL), m_magic(108801), m_slippage(30) {}

   void Init(CApiClient* api, ulong magic = 108801, int slippage = 30)
   {
      m_api      = api;
      m_magic    = magic;
      m_slippage = slippage;
      
      m_trade.SetExpertMagicNumber(m_magic);
      m_trade.SetDeviationInPoints(m_slippage);
      m_trade.SetTypeFilling(ORDER_FILLING_FOK);
   }

   bool ExecuteSignal(const TradeSignal &signal, double lotSize)
   {
      if(signal.type == SIGNAL_NONE) return false;

      ResetLastError();
      bool success = false;
      string typeStr = (signal.type == SIGNAL_BUY) ? "BUY" : "SELL";

      // Report signal to API first
      ReportSignalToApi(signal);

      if(signal.type == SIGNAL_BUY)
      {
         double ask = SymbolInfoDouble(signal.symbol, SYMBOL_ASK);
         success = m_trade.Buy(lotSize, signal.symbol, ask, signal.sl, signal.tp, signal.reason);
      }
      else if(signal.type == SIGNAL_SELL)
      {
         double bid = SymbolInfoDouble(signal.symbol, SYMBOL_BID);
         success = m_trade.Sell(lotSize, signal.symbol, bid, signal.sl, signal.tp, signal.reason);
      }

      if(success)
      {
         ulong dealTicket = m_trade.ResultDeal();
         ulong orderTicket = m_trade.ResultOrder();
         PrintFormat("[ORDER FILLED] %s %.2f lots %s @ %.5f | SL: %.5f | TP: %.5f | Ticket: %I64d",
                     typeStr, lotSize, signal.symbol, m_trade.ResultPrice(), signal.sl, signal.tp, dealTicket);
         return true;
      }
      else
      {
         int err = GetLastError();
         PrintFormat("[ORDER REJECTED] %s %.2f lots %s. Error: %d | RetCode: %d (%s)",
                     typeStr, lotSize, signal.symbol, err, m_trade.ResultRetcode(), m_trade.ResultRetcodeDescription());
         return false;
      }
   }

   int CountOpenPositions(string symbol)
   {
      int count = 0;
      int total = PositionsTotal();
      for(int i = 0; i < total; i++)
      {
         ulong ticket = PositionGetTicket(i);
         if(ticket <= 0) continue;
         if(PositionGetString(POSITION_SYMBOL) == symbol && 
            (PositionGetInteger(POSITION_MAGIC) == m_magic || m_magic == 0))
         {
            count++;
         }
      }
      return count;
   }

   void CloseAllPositions(string symbol, string reason = "EMERGENCY_STOP")
   {
      int total = PositionsTotal();
      for(int i = total - 1; i >= 0; i--)
      {
         ulong ticket = PositionGetTicket(i);
         if(ticket <= 0) continue;
         if(PositionGetString(POSITION_SYMBOL) == symbol && 
            (PositionGetInteger(POSITION_MAGIC) == m_magic || m_magic == 0))
         {
            m_trade.PositionClose(ticket);
            PrintFormat("[POSITION CLOSED EMERGENCY] Ticket: %I64d | Reason: %s", ticket, reason);
         }
      }
   }

private:
   void ReportSignalToApi(const TradeSignal &signal)
   {
      if(m_api == NULL) return;

      string dir = (signal.type == SIGNAL_BUY) ? "BUY" : "SELL";
      string payload = StringFormat(
         "{\"account_number\":%I64d,\"signal_uid\":\"%s\",\"symbol\":\"%s\",\"direction\":\"%s\",\"order_type\":\"MARKET\",\"price\":%.5f,\"stop_loss\":%.5f,\"take_profit\":%.5f,\"reason\":\"%s\",\"timeframe\":\"M5\",\"status\":\"EXECUTED\"}",
         AccountInfoInteger(ACCOUNT_LOGIN),
         signal.signalUid,
         signal.symbol,
         dir,
         signal.price,
         signal.sl,
         signal.tp,
         signal.reason
      );

      string response;
      int httpCode;
      m_api->Post("/api/mt5/signal-log", payload, response, httpCode);
   }
};
