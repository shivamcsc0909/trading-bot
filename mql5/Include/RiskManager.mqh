//+------------------------------------------------------------------+
//|                                                  RiskManager.mqh |
//|                                  Tech Forex MT5 Automated Bot    |
//+------------------------------------------------------------------+
#property copyright "Tech Forex MT5 Platform"
#property strict

class CRiskManager
{
private:
   double   m_riskPercent;
   double   m_maxLotSize;
   double   m_minLotSize;
   int      m_maxOpenPositions;
   int      m_maxDailySlHits;
   double   m_maxDrawdownPercent;
   int      m_maxSpreadPoints;
   bool     m_newsFilterEnabled;
   bool     m_emergencyStop;
   
   int      m_todaySlHits;
   datetime m_lastResetDay;

public:
   CRiskManager() :
      m_riskPercent(2.0),
      m_maxLotSize(1.0),
      m_minLotSize(0.01),
      m_maxOpenPositions(2),
      m_maxDailySlHits(3),
      m_maxDrawdownPercent(5.0),
      m_maxSpreadPoints(35),
      m_newsFilterEnabled(true),
      m_emergencyStop(false),
      m_todaySlHits(0),
      m_lastResetDay(0)
   {}

   void Init(double riskPercent = 2.0, double maxLot = 1.0, double minLot = 0.01, int maxPositions = 2, int maxSlHits = 3)
   {
      m_riskPercent       = riskPercent;
      m_maxLotSize        = maxLot;
      m_minLotSize        = minLot;
      m_maxOpenPositions  = maxPositions;
      m_maxDailySlHits    = maxSlHits;
      m_lastResetDay      = TimeCurrent() / 86400;
   }

   void UpdateSettings(double riskPercent, double maxLot, double minLot, int maxPositions, int maxSlHits, double maxDd, bool newsFilter, bool emergencyStop)
   {
      m_riskPercent        = riskPercent;
      m_maxLotSize         = maxLot;
      m_minLotSize         = minLot;
      m_maxOpenPositions   = maxPositions;
      m_maxDailySlHits     = maxSlHits;
      m_maxDrawdownPercent = maxDd;
      m_newsFilterEnabled  = newsFilter;
      m_emergencyStop      = emergencyStop;
   }

   // Dynamic Lot Sizing based on Account Equity, Risk % and Stop Loss distance (Points)
   double CalculateLotSize(string symbol, double slPoints)
   {
      if(slPoints <= 0) slPoints = 300.0; // 30 pips default for Gold

      double equity     = AccountInfoDouble(ACCOUNT_EQUITY);
      double riskMoney  = equity * (m_riskPercent / 100.0);

      double tickValue  = SymbolInfoDouble(symbol, SYMBOL_TRADE_TICK_VALUE);
      double tickSize   = SymbolInfoDouble(symbol, SYMBOL_TRADE_TICK_SIZE);
      double point      = SymbolInfoDouble(symbol, SYMBOL_POINT);

      if(tickSize <= 0 || point <= 0 || tickValue <= 0)
      {
         PrintFormat("[RISK WARNING] Could not fetch tick specs for %s. Using safe fallback.", symbol);
         return m_minLotSize;
      }

      // Money risked per 1.0 lot for given SL distance
      double lossPerLot = (slPoints * point / tickSize) * tickValue;
      if(lossPerLot <= 0) lossPerLot = 300.0;

      double calculatedLot = riskMoney / lossPerLot;

      // Align to broker volume constraints
      double minLot   = SymbolInfoDouble(symbol, SYMBOL_VOLUME_MIN);
      double maxLot   = SymbolInfoDouble(symbol, SYMBOL_VOLUME_MAX);
      double stepLot  = SymbolInfoDouble(symbol, SYMBOL_VOLUME_STEP);

      if(minLot < m_minLotSize) minLot = m_minLotSize;
      if(maxLot > m_maxLotSize) maxLot = m_maxLotSize;

      calculatedLot = MathFloor(calculatedLot / stepLot) * stepLot;

      if(calculatedLot < minLot) calculatedLot = minLot;
      if(calculatedLot > maxLot) calculatedLot = maxLot;

      PrintFormat("[RISK LOT CALC] Equity: $%.2f | Risk: %.1f%% ($%.2f) | SL: %.1f pts | Calculated Lot: %.2f", 
                  equity, m_riskPercent, riskMoney, slPoints, calculatedLot);

      return calculatedLot;
   }

   // Checks all risk barriers before opening an order
   bool IsTradeAllowed(string symbol, int currentOpenPositions)
   {
      // 1. Emergency stop
      if(m_emergencyStop)
      {
         Print("[RISK BLOCKED] Emergency stop switch is active.");
         return false;
      }

      // 2. Day reset check
      datetime currentDay = TimeCurrent() / 86400;
      if(currentDay != m_lastResetDay)
      {
         m_todaySlHits = 0;
         m_lastResetDay = currentDay;
      }

      // 3. Daily SL Limit (3 SL Rule from PDF 1 Page 6 & 8)
      if(m_todaySlHits >= m_maxDailySlHits)
      {
         PrintFormat("[RISK BLOCKED] Daily Stop Loss limit reached (%d/%d hits). No more trades today.", 
                     m_todaySlHits, m_maxDailySlHits);
         return false;
      }

      // 4. Max Open Positions
      if(currentOpenPositions >= m_maxOpenPositions)
      {
         PrintFormat("[RISK BLOCKED] Max open positions reached (%d/%d).", 
                     currentOpenPositions, m_maxOpenPositions);
         return false;
      }

      // 5. Max Spread check
      long spread = SymbolInfoInteger(symbol, SYMBOL_SPREAD);
      if(spread > m_maxSpreadPoints)
      {
         PrintFormat("[RISK BLOCKED] Spread too high: %d points (Max allowed: %d).", spread, m_maxSpreadPoints);
         return false;
      }

      // 6. Time Filter (PDF 1 Filter F1: 9:00 AM - 2:00 PM IST = NO TRADE)
      // Convert current GMT time to IST (GMT + 5:30)
      MqlDateTime dt;
      TimeToStruct(TimeGMT() + 19800, dt); // +19800s = +5.5 hours for IST
      
      int currentMinutes = dt.hour * 60 + dt.min;
      int noTradeStart = 9 * 60;   // 9:00 AM
      int noTradeEnd   = 14 * 60;  // 2:00 PM

      if(currentMinutes >= noTradeStart && currentMinutes < noTradeEnd)
      {
         PrintFormat("[RISK BLOCKED] Inside PDF Filter F1 No-Trade Window (9:00 AM - 2:00 PM IST). Current IST: %02d:%02d", 
                     dt.hour, dt.min);
         return false;
      }

      return true;
   }

   void RecordSlHit()
   {
      m_todaySlHits++;
      PrintFormat("[RISK UPDATE] Daily Stop Loss recorded. Total today: %d/%d", m_todaySlHits, m_maxDailySlHits);
   }

   int GetDailySlHits() const { return m_todaySlHits; }
};
