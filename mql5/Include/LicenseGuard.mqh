//+------------------------------------------------------------------+
//|                                                 LicenseGuard.mqh |
//|                                  Tech Forex MT5 Automated Bot    |
//+------------------------------------------------------------------+
#property copyright "Tech Forex MT5 Platform"
#property strict

#include "ApiClient.mqh"

class CLicenseGuard
{
private:
   CApiClient* m_api;
   bool        m_isValid;
   bool        m_botEnabled;
   string      m_status;
   string      m_strategyCode;
   datetime    m_lastCheckTime;
   int         m_checkIntervalSec;

public:
   CLicenseGuard() : m_api(NULL), m_isValid(false), m_botEnabled(false), m_status("UNCHECKED"), m_lastCheckTime(0), m_checkIntervalSec(60) {}

   void Init(CApiClient* api, int checkIntervalSec = 60)
   {
      m_api = api;
      m_checkIntervalSec = checkIntervalSec;
   }

   bool ValidateLicense()
   {
      if(m_api == NULL) return false;
      
      string response;
      int httpCode;
      
      string payload = StringFormat(
         "{\"account_number\":%I64d,\"broker\":\"%s\",\"server\":\"%s\",\"currency\":\"%s\",\"leverage\":%d,\"ea_version\":\"1.0.0\"}",
         AccountInfoInteger(ACCOUNT_LOGIN),
         AccountInfoString(ACCOUNT_COMPANY),
         AccountInfoString(ACCOUNT_SERVER),
         AccountInfoString(ACCOUNT_CURRENCY),
         (int)AccountInfoInteger(ACCOUNT_LEVERAGE)
      );

      if(!m_api->Post("/api/mt5/register", payload, response, httpCode))
      {
         PrintFormat("[LICENSE] Handshake failed. HTTP code: %d", httpCode);
         m_isValid = false;
         return false;
      }

      string success = m_api->JsonExtract(response, "success");
      if(success == "true")
      {
         m_status       = m_api->JsonExtract(response, "license_status");
         m_botEnabled   = (m_api->JsonExtract(response, "bot_enabled") == "true" || m_api->JsonExtract(response, "bot_enabled") == "1");
         m_strategyCode = m_api->JsonExtract(response, "strategy_code");
         m_isValid      = (m_status == "ACTIVE");
         m_lastCheckTime= TimeCurrent();

         PrintFormat("[LICENSE VALIDATED] Status: %s | Bot Enabled: %s | Strategy: %s", 
                     m_status, (m_botEnabled ? "YES" : "NO"), m_strategyCode);
         return m_isValid;
      }

      PrintFormat("[LICENSE REJECTED] %s", response);
      m_isValid = false;
      return false;
   }

   bool CanTrade()
   {
      if(!m_isValid) return false;
      if(!m_botEnabled) return false;
      return true;
   }

   bool IsValid()       const { return m_isValid; }
   bool IsBotEnabled()  const { return m_botEnabled; }
   string GetStatus()   const { return m_status; }
   void SetBotEnabled(bool enabled) { m_botEnabled = enabled; }
};
