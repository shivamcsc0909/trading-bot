# 📘 Configuration & Deployment Guide
### Multi-Instrument Profiles • TradingView v6 • FastAPI Bridge • MT5 EA

---

## 1. Symbol-Specific Configuration Profiles

```
┌─────────────────┬──────────────────────┬──────────────────────┬──────────────────────┐
│ Parameter       │ XAUUSD (Gold)        │ EURUSD (Euro/USD)    │ GBPUSD (Cable)       │
├─────────────────┼──────────────────────┼──────────────────────┼──────────────────────┤
│ EMA Ribbon      │ 9, 21, 50            │ 20, 50, 200          │ 20, 50, 200          │
│ Dual RSI        │ Fast 25 / Slow 100   │ Fast 14 / Slow 50    │ Fast 14 / Slow 50    │
│ ATR Multiplier  │ 2.0x (Wide Volatility)│ 1.5x (Tight Spread)  │ 1.8x (Medium Vol)    │
│ Psychological   │ $10.00 Modulo Blocks │ 50.0 Pip Intervals   │ 50.0 Pip Intervals   │
│ Min Score (0-100)│ 75 (High Filter)    │ 70 (Standard)        │ 72 (Standard)        │
│ Session Window  │ London + NY Overlap  │ London Morning + NY  │ London Morning + NY  │
└─────────────────┴──────────────────────┴──────────────────────┴──────────────────────┘
```

---

## 2. End-to-End 3-Step Deployment Workflow

### Step 1: TradingView Setup
1. Open Pine Editor on TradingView.
2. Load `institutional_engine_v6.pine`.
3. Add to Chart on **5m / 15m timeframe**.
4. Set Alert:
   - **Condition**: `Institutional Multi-Factor Engine [v6]` $\rightarrow$ `Any alert() function call`.
   - **Webhook URL**: `https://your-server.com/webhook/signal`.

### Step 2: FastAPI Backend Server
Run the local or production webhook receiver:
```bash
uvicorn backend.server:app --host 0.0.0.0 --port 8000 --reload
```

### Step 3: MetaTrader 5 Expert Advisor
1. Copy `backend/mt5_ea/Institutional_Bridge.mq5` to your MT5 terminal:  
   `MQL5/Experts/Institutional_Bridge.mq5`.
2. Compile in MetaEditor.
3. In MT5: `Tools` $\rightarrow$ `Options` $\rightarrow$ `Expert Advisors` $\rightarrow$ Check **"Allow WebRequest for listed URL"** and add `http://127.0.0.1:8000`.
4. Attach EA to `XAUUSD`, `EURUSD`, or `GBPUSD` chart with AutoTrading enabled.
