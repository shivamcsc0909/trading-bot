//+------------------------------------------------------------------+
//|                                                  AccountSync.mqh |
//|                                  Tech Forex MT5 Automated Bot    |
//+------------------------------------------------------------------+
#property copyright "Tech Forex MT5 Platform"
#property strict

#include "ApiClient.mqh"

class CAccountSync
{
private:
   CApiClient* m_api;
   ulong       m_magic;
   datetime    m_lastSyncTime;
   int         m_syncIntervalSec;

public:
   CAccountSync() : m_api(NULL), m_magic(108801), m_lastSyncTime(0), m_syncIntervalSec(15) {}

   void Init(CApiClient* api, ulong magic = 108801, int syncIntervalSec = 15)
   {
      m_api             = api;
      m_magic           = magic;
      m_syncIntervalSec = syncIntervalSec;
   }

   bool SendHeartbeat(bool &outBotEnabled, string &outBotMode)
   {
      if(m_api == NULL) return false;

      double balance    = AccountInfoDouble(ACCOUNT_BALANCE);
      double equity     = AccountInfoDouble(ACCOUNT_EQUITY);
      double margin     = AccountInfoDouble(ACCOUNT_MARGIN);
      double freeMargin = AccountInfoDouble(ACCOUNT_MARGIN_FREE);

      string payload = StringFormat(
         "{\"account_number\":%I64d,\"balance\":%.2f,\"equity\":%.2f,\"margin\":%.2f,\"free_margin\":%.2f}",
         AccountInfoInteger(ACCOUNT_LOGIN), balance, equity, margin, freeMargin
      );

      string response;
      int httpCode;
      if(m_api->Post("/api/mt5/heartbeat", payload, response, httpCode))
      {
         string botEnabledStr = m_api->JsonExtract(response, "bot_enabled");
         outBotEnabled = (botEnabledStr == "true" || botEnabledStr == "1");
         outBotMode    = m_api->JsonExtract(response, "bot_mode");
         m_lastSyncTime = TimeCurrent();
         return true;
      }
      return false;
   }

   bool SyncOpenPositions()
   {
      if(m_api == NULL) return false;

      int totalPositions = PositionsTotal();
      string posJsonArray = "[";
      bool first = true;
      int myPositionsCount = 0;

      for(int i = 0; i < totalPositions; i++)
      {
         ulong ticket = PositionGetTicket(i);
         if(ticket <= 0) continue;

         if(PositionGetInteger(POSITION_MAGIC) == m_magic || m_magic == 0)
         {
            if(!first) posJsonArray += ",";
            first = false;
            myPositionsCount++;

            string typeStr = (PositionGetInteger(POSITION_TYPE) == POSITION_TYPE_BUY) ? "BUY" : "SELL";
            datetime opTime = (datetime)PositionGetInteger(POSITION_TIME);
            string opTimeStr = TimeToString(opTime, TIME_DATE|TIME_SECONDS);

            posJsonArray += StringFormat(
               "{\"ticket\":%I64d,\"symbol\":\"%s\",\"type\":\"%s\",\"volume\":%.2f,\"open_price\":%.5f,\"current_price\":%.5f,\"stop_loss\":%.5f,\"take_profit\":%.5f,\"profit\":%.2f,\"swap\":%.2f,\"comment\":\"%s\",\"magic_number\":%I64d,\"opened_at\":\"%s\"}",
               ticket,
               PositionGetString(POSITION_SYMBOL),
               typeStr,
               PositionGetDouble(POSITION_VOLUME),
               PositionGetDouble(POSITION_PRICE_OPEN),
               PositionGetDouble(POSITION_PRICE_CURRENT),
               PositionGetDouble(POSITION_SL),
               PositionGetDouble(POSITION_TP),
               PositionGetDouble(POSITION_PROFIT),
               PositionGetDouble(POSITION_SWAP),
               PositionGetString(POSITION_COMMENT),
               PositionGetInteger(POSITION_MAGIC),
               opTimeStr
            );
         }
      }
      posJsonArray += "]";

      string payload = StringFormat(
         "{\"account_number\":%I64d,\"positions\":%s}",
         AccountInfoInteger(ACCOUNT_LOGIN), posJsonArray
      );

      string response;
      int httpCode;
      return m_api->Post("/api/mt5/positions-sync", payload, response, httpCode);
   }

   bool SyncClosedTrade(ulong dealTicket, ulong posTicket, string symbol, string type, double volume, double openPrice, double closePrice, double sl, double tp, double profit, double commission, double swap, string comment, datetime openTime, datetime closeTime)
   {
      if(m_api == NULL) return false;

      string payload = StringFormat(
         "{\"account_number\":%I64d,\"deal_ticket\":%I64d,\"position_ticket\":%I64d,\"symbol\":\"%s\",\"trade_type\":\"%s\",\"volume\":%.2f,\"open_price\":%.5f,\"close_price\":%.5f,\"stop_loss\":%.5f,\"take_profit\":%.5f,\"profit\":%.2f,\"commission\":%.2f,\"swap\":%.2f,\"magic_number\":%I64d,\"opened_at\":\"%s\",\"closed_at\":\"%s\",\"comment\":\"%s\"}",
         AccountInfoInteger(ACCOUNT_LOGIN),
         dealTicket,
         posTicket,
         symbol,
         type,
         volume,
         openPrice,
         closePrice,
         sl,
         tp,
         profit,
         commission,
         swap,
         m_magic,
         TimeToString(openTime, TIME_DATE|TIME_SECONDS),
         TimeToString(closeTime, TIME_DATE|TIME_SECONDS),
         comment
      );

      string response;
      int httpCode;
      return m_api->Post("/api/mt5/trade-sync", payload, response, httpCode);
   }
};
