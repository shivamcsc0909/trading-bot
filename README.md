# Tech Forex — MT5 Automated Trading Platform (Commercial MVP)

A commercially structured automated trading platform connecting **MetaTrader 5 (MT5)** with a lightweight **PHP REST API**, **MySQL database**, **React + Vite Web Dashboard**, and a modular **MQL5 Expert Advisor** implementing the PDF-defined XAUUSD 100-Block Strategy and Risk Guard.

---

## Key Highlights

- **Sourced from PDFs**:
  - 100-Block repeating price action level theory for **XAUUSD (Gold)** on M5 candles.
  - Candlestick confirmations (Pin Bar / Hammer wick &ge; 2x body, Bullish/Bearish Engulfing).
  - Time filter: 9:00 AM – 2:00 PM IST (Filter F1) = No trade.
  - High-impact news filter: NFP / CPI / FOMC / Unemployment releases.
  - Attempt rule: Filter F9 (1st = Best, 2nd = Ok, 3rd = Skip due to breakout risk).
  - Risk management: 1–2% dynamic risk lot sizing, 3 SL daily kill switch, 1:4 R:R.
- **Architectural Simplicity**:
  - Zero heavy microservices; works on standard **shared hosting** (cPanel/Apache/PHP/MySQL).
  - Clean separation: React Frontend &rarr; PHP REST API &rarr; MySQL Database &rarr; MQL5 EA on MT5.
- **Dual Interface**:
  - **Customer Panel** (10 views): Overview, Bot Controller, MT5 Account, Strategy & PDF Rules, Live Positions, Trade History, Risk Settings, Profile, Logs.
  - **Admin Panel** (11 views): Metrics Dashboard, Customer Onboarding & Management, Bot Fleet Monitoring, License System, Strategy Parameters, Platform Trades, Audit Trail.
- **Fail-Safe & Demo First**:
  - Defaults to **DEMO / Paper Trading**.
  - Master Bot Kill Switch for both Admins and Traders.

---

## Quick Start (Local Development)

### 1. Backend & Database
```bash
# Start PHP built-in server (from project root)
php -S localhost:8000 -t backend/
```
Run backend tests:
```bash
php tests/api_test.php
php tests/strategy_backtest.php
```

### 2. Frontend (React + Vite)
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:5173`. Default logins:
- **Demo Customer**: `customer@techforex.com` / `Customer@123456`
- **Admin**: `admin@techforex.com` / `Admin@123456`

### 3. MT5 Expert Advisor
1. Copy `mql5/` folder to your MT5 terminal's `MQL5/Experts/` directory.
2. Compile `TechForexGoldBot.mq5` in MetaEditor (`F7`).
3. Add `http://localhost:8000` (or your live domain) in MT5 **Tools &rarr; Options &rarr; Expert Advisors &rarr; WebRequest**.
4. Attach EA to an **XAUUSD M5** chart, enter your license key, and enable Algo Trading.

---

## Documentation
- [Shared Hosting Deployment Guide](deployment/shared_hosting_guide.md)
- [Windows VPS & MT5 EA Setup Guide](deployment/vps_mt5_guide.md)
- [Commercial Operations & Cost Runbook](deployment/runbook.md)
