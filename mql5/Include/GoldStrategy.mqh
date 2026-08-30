//+------------------------------------------------------------------+
//|                                                 GoldStrategy.mqh |
//|                                  Tech Forex MT5 Automated Bot    |
//|               Sourced from Tech Forex Gold Strategy & Candlestick E-Book |
//+------------------------------------------------------------------+
#property copyright "Tech Forex MT5 Platform"
#property strict

enum ENUM_SIGNAL_TYPE
{
   SIGNAL_NONE = 0,
   SIGNAL_BUY  = 1,
   SIGNAL_SELL = 2
};

struct TradeSignal
{
   ENUM_SIGNAL_TYPE type;
   string           symbol;
   double           price;
   double           sl;
   double           tp;
   string           reason;
   string           signalUid;
   int              levelAttempt;
};

class CGoldStrategy
{
private:
   string   m_symbol;
   ENUM_TIMEFRAMES m_timeframe;
   bool     m_requireCandleConfirmation;
   
   // Level attempt tracking
   int      m_levelAttempts[100];
   datetime m_lastAttemptReset;
   datetime m_lastProcessedBarTime;

public:
   CGoldStrategy() :
      m_symbol("XAUUSD"),
      m_timeframe(PERIOD_M5),
      m_requireCandleConfirmation(true),
      m_lastAttemptReset(0),
      m_lastProcessedBarTime(0)
   {
      ArrayInitialize(m_levelAttempts, 0);
   }

   void Init(string symbol = "XAUUSD", ENUM_TIMEFRAMES tf = PERIOD_M5, bool candleConfirm = true)
   {
      m_symbol = symbol;
      m_timeframe = tf;
      m_requireCandleConfirmation = candleConfirm;
      m_lastAttemptReset = TimeCurrent() / 86400;
   }

   // Evaluates price action against PDF 100-Block level matrix
   bool EvaluateSignal(TradeSignal &outSignal)
   {
      outSignal.type = SIGNAL_NONE;

      // Ensure we only process on a newly completed M5 bar
      datetime currentBarTime = iTime(m_symbol, m_timeframe, 0);
      if(currentBarTime == m_lastProcessedBarTime) return false;

      // Daily attempt reset
      datetime currentDay = TimeCurrent() / 86400;
      if(currentDay != m_lastAttemptReset)
      {
         ArrayInitialize(m_levelAttempts, 0);
         m_lastAttemptReset = currentDay;
      }

      // Fetch last closed candle (Bar 1) & prior candle (Bar 2)
      MqlRates rates[];
      ArraySetAsSeries(rates, true);
      if(CopyRates(m_symbol, m_timeframe, 1, 3, rates) < 2) return false;

      double close1 = rates[0].close;
      double open1  = rates[0].open;
      double high1  = rates[0].high;
      double low1   = rates[0].low;

      double blockBase = MathFloor(close1 / 100.0) * 100.0;
      double offset    = close1 - blockBase; // 0.00 to 99.99

      int levelKey = (int)MathRound(offset);
      if(levelKey < 0) levelKey = 0;
      if(levelKey > 99) levelKey = 99;

      // Candlestick Confirmation tests
      bool isBullishPinBar   = IsBullishPinBar(open1, close1, high1, low1);
      bool isBearishPinBar   = IsBearishPinBar(open1, close1, high1, low1);
      bool isBullishEngulf   = (close1 > open1 && rates[1].close < rates[1].open && close1 > rates[1].open && open1 <= rates[1].close);
      bool isBearishEngulf   = (close1 < open1 && rates[1].close > rates[1].open && close1 < rates[1].open && open1 >= rates[1].close);

      bool hasBullishConfirm = !m_requireCandleConfirmation || (isBullishPinBar || isBullishEngulf || (close1 > open1));
      bool hasBearishConfirm = !m_requireCandleConfirmation || (isBearishPinBar || isBearishEngulf || (close1 < open1));

      // -------------------------------------------------------------
      // BUY SETUPS (PDF 1 Section 3)
      // -------------------------------------------------------------

      // B2: 84 Scalp Support (Entry @ 84, SL 82, TP 91/96)
      if(offset >= 83.0 && offset <= 85.5 && hasBullishConfirm)
      {
         if(CheckAttemptRule(levelKey, outSignal.levelAttempt))
         {
            outSignal.type      = SIGNAL_BUY;
            outSignal.symbol    = m_symbol;
            outSignal.price     = close1;
            outSignal.sl        = blockBase + 82.0;
            outSignal.tp        = blockBase + 92.0;
            outSignal.reason    = "B2: Level 84 Scalp Support + Bullish Reaction";
            outSignal.signalUid = GenerateSignalUid("B2_84", close1);
            m_lastProcessedBarTime = currentBarTime;
            return true;
         }
      }

      // B5 / B6: 54-64 Liquidation Reclaim Zone (Entry 57-64, SL 55/50, TP 74-81)
      if(offset >= 54.0 && offset <= 64.0 && hasBullishConfirm)
      {
         if(CheckAttemptRule(levelKey, outSignal.levelAttempt))
         {
            outSignal.type      = SIGNAL_BUY;
            outSignal.symbol    = m_symbol;
            outSignal.price     = close1;
            outSignal.sl        = blockBase + 52.0;
            outSignal.tp        = blockBase + 75.0;
            outSignal.reason    = "B5: 54-64 Liquidation Trap Reclaim + Demand Surge";
            outSignal.signalUid = GenerateSignalUid("B5_LIQ", close1);
            m_lastProcessedBarTime = currentBarTime;
            return true;
         }
      }

      // B9: 04-07 Base Discount Buy (Entry 04-07, SL prev block 95, TP 17-21)
      if(offset >= 4.0 && offset <= 7.5 && hasBullishConfirm)
      {
         if(CheckAttemptRule(levelKey, outSignal.levelAttempt))
         {
            outSignal.type      = SIGNAL_BUY;
            outSignal.symbol    = m_symbol;
            outSignal.price     = close1;
            outSignal.sl        = (blockBase - 100.0) + 95.0; // prev block 95
            outSignal.tp        = blockBase + 19.0;
            outSignal.reason    = "B9: 04-07 Range Base Discount Buy";
            outSignal.signalUid = GenerateSignalUid("B9_0407", close1);
            m_lastProcessedBarTime = currentBarTime;
            return true;
         }
      }

      // -------------------------------------------------------------
      // SELL SETUPS (PDF 1 Section 4)
      // -------------------------------------------------------------

      // S1: 92-96 Top Resistance (Sell entry, SL 98, TP 84)
      if(offset >= 92.0 && offset <= 96.5 && hasBearishConfirm)
      {
         if(CheckAttemptRule(levelKey, outSignal.levelAttempt))
         {
            outSignal.type      = SIGNAL_SELL;
            outSignal.symbol    = m_symbol;
            outSignal.price     = close1;
            outSignal.sl        = blockBase + 98.0;
            outSignal.tp        = blockBase + 84.0;
            outSignal.reason    = "S1: 92-96 Primary Resistance Sell";
            outSignal.signalUid = GenerateSignalUid("S1_9296", close1);
            m_lastProcessedBarTime = currentBarTime;
            return true;
         }
      }

      // S2: 78-83 Mid-range Supply (Sell entry, SL 85, TP 72-73)
      if(offset >= 78.0 && offset <= 82.5 && hasBearishConfirm)
      {
         if(CheckAttemptRule(levelKey, outSignal.levelAttempt))
         {
            outSignal.type      = SIGNAL_SELL;
            outSignal.symbol    = m_symbol;
            outSignal.price     = close1;
            outSignal.sl        = blockBase + 85.0;
            outSignal.tp        = blockBase + 72.5;
            outSignal.reason    = "S2: 78-83 Mid-Range Supply Sell";
            outSignal.signalUid = GenerateSignalUid("S2_7883", close1);
            m_lastProcessedBarTime = currentBarTime;
            return true;
         }
      }

      // S5: 38-44 Crash Zone Sell (SL 45, TP 38 / 29)
      if(offset >= 38.0 && offset <= 44.0 && hasBearishConfirm)
      {
         if(CheckAttemptRule(levelKey, outSignal.levelAttempt))
         {
            outSignal.type      = SIGNAL_SELL;
            outSignal.symbol    = m_symbol;
            outSignal.price     = close1;
            outSignal.sl        = blockBase + 45.0;
            outSignal.tp        = blockBase + 29.0;
            outSignal.reason    = "S5: 38-44 Crash Zone Major Top Sell";
            outSignal.signalUid = GenerateSignalUid("S5_3844", close1);
            m_lastProcessedBarTime = currentBarTime;
            return true;
         }
      }

      m_lastProcessedBarTime = currentBarTime;
      return false;
   }

private:
   // PDF 1 Filter F9 Attempt Rule: 1st = Best, 2nd = Ok, 3rd = Skip (Breakout Risk)
   bool CheckAttemptRule(int levelKey, int &attemptNum)
   {
      m_levelAttempts[levelKey]++;
      attemptNum = m_levelAttempts[levelKey];

      if(attemptNum >= 3)
      {
         PrintFormat("[FILTER F9] Skipping trade at level offset %d (3rd attempt breakout risk).", levelKey);
         return false;
      }
      return true;
   }

   bool IsBullishPinBar(double open, double close, double high, double low)
   {
      double body = MathAbs(close - open);
      double lowerWick = (open < close ? open : close) - low;
      double upperWick = high - (open > close ? open : close);
      
      if(body <= 0.001) body = 0.05;
      return (lowerWick >= 2.0 * body && lowerWick > upperWick * 1.5);
   }

   bool IsBearishPinBar(double open, double close, double high, double low)
   {
      double body = MathAbs(close - open);
      double upperWick = high - (open > close ? open : close);
      double lowerWick = (open < close ? open : close) - low;
      
      if(body <= 0.001) body = 0.05;
      return (upperWick >= 2.0 * body && upperWick > lowerWick * 1.5);
   }

   string GenerateSignalUid(string setupCode, double price)
   {
      datetime t = TimeCurrent();
      return StringFormat("SIG_%s_%s_%d_%.1f", m_symbol, setupCode, (int)t, price);
   }
};
