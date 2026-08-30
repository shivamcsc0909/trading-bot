//+------------------------------------------------------------------+
//|                                                    ApiClient.mqh |
//|                                  Tech Forex MT5 Automated Bot    |
//+------------------------------------------------------------------+
#property copyright "Tech Forex MT5 Platform"
#property link      "https://techforex.in"
#property strict

class CApiClient
{
private:
   string   m_baseUrl;
   string   m_licenseKey;
   int      m_timeout;

public:
   CApiClient() : m_baseUrl(""), m_licenseKey(""), m_timeout(5000) {}

   void Init(string baseUrl, string licenseKey, int timeout = 5000)
   {
      m_baseUrl    = baseUrl;
      m_licenseKey = licenseKey;
      m_timeout    = timeout;
      
      // Trim trailing slash
      if(StringSubstr(m_baseUrl, StringLen(m_baseUrl)-1, 1) == "/")
         m_baseUrl = StringSubstr(m_baseUrl, 0, StringLen(m_baseUrl)-1);
   }

   bool Post(string endpoint, string jsonPayload, string &response, int &httpCode)
   {
      string url = m_baseUrl + endpoint;
      string headers = "Content-Type: application/json\r\n" +
                       "X-License-Key: " + m_licenseKey + "\r\n";
      
      char postData[];
      StringToCharArray(jsonPayload, postData, 0, StringLen(jsonPayload));
      
      char resultData[];
      string resultHeaders;
      
      ResetLastError();
      httpCode = WebRequest("POST", url, headers, m_timeout, postData, resultData, resultHeaders);
      
      if(httpCode == -1)
      {
         int err = GetLastError();
         PrintFormat("[API ERROR] WebRequest failed to %s. Error: %d. (Ensure URL is added to Tools -> Options -> Expert Advisors -> WebRequest)", url, err);
         return false;
      }
      
      response = CharArrayToString(resultData);
      return (httpCode >= 200 && httpCode < 300);
   }

   bool Get(string endpoint, string &response, int &httpCode)
   {
      string url = m_baseUrl + endpoint;
      string headers = "X-License-Key: " + m_licenseKey + "\r\n";
      
      char postData[];
      char resultData[];
      string resultHeaders;
      
      ResetLastError();
      httpCode = WebRequest("GET", url, headers, m_timeout, postData, resultData, resultHeaders);
      
      if(httpCode == -1)
      {
         int err = GetLastError();
         PrintFormat("[API ERROR] WebRequest GET failed to %s. Error: %d.", url, err);
         return false;
      }
      
      response = CharArrayToString(resultData);
      return (httpCode >= 200 && httpCode < 300);
   }

   // Helper JSON value parser (Extracts value for string, bool, or number key)
   string JsonExtract(string json, string key)
   {
      string searchKey = "\"" + key + "\":";
      int pos = StringFind(json, searchKey);
      if(pos < 0) return "";
      
      int start = pos + StringLen(searchKey);
      while(start < StringLen(json) && (StringGetCharacter(json, start) == ' ' || StringGetCharacter(json, start) == '\t'))
         start++;
         
      ushort firstChar = StringGetCharacter(json, start);
      if(firstChar == '"')
      {
         start++;
         int end = StringFind(json, "\"", start);
         if(end < 0) return "";
         return StringSubstr(json, start, end - start);
      }
      else
      {
         int endComma = StringFind(json, ",", start);
         int endBrace = StringFind(json, "}", start);
         int end = endComma;
         if(end < 0 || (endBrace >= 0 && endBrace < end)) end = endBrace;
         if(end < 0) end = StringLen(json);
         return StringTrim(StringSubstr(json, start, end - start));
      }
   }

   string StringTrim(string text)
   {
      StringTrimLeft(text);
      StringTrimRight(text);
      return text;
   }
};
