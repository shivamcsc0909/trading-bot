# Windows VPS & MetaTrader 5 (MT5) EA Deployment Guide

This guide details how to install and run the **Tech Forex Gold MQL5 Expert Advisor** on a Windows PC or Windows VPS for 24/7 automated trade execution.

---

## 1. Development vs. Production Execution

- **Local Development**: Run MT5 directly on your Windows PC (Free / ₹0 cost).
- **Production MVP (1–10 Customers)**: Low-cost Windows VPS (1-2 vCPU, 2-4GB RAM, approx. ₹500 – ₹1,200 / month from providers like Contabo, Hostinger, FXVM, or Kamatera).

---

## 2. Step-by-Step MT5 Terminal Setup

### Step 2.1: Install MetaTrader 5
1. Download and install MT5 from your broker (Exness, IC Markets, Pepperstone, FP Markets, etc.) or from [MetaQuotes](https://www.metatrader5.com).
2. Log into your Demo or Live trading account.

### Step 2.2: Enable Algo Trading & WebRequest
1. Open MT5 and navigate to **Tools → Options** (or press `Ctrl+O`).
2. Select the **Expert Advisors** tab:
   - Check **"Allow Algo Trading"**.
   - Check **"Allow WebRequest for listed URL"**.
   - Click the green **+** icon and add your exact API domain:
     - Local Dev: `http://localhost:8000` (or `http://127.0.0.1:8000`)
     - Production: `https://yourdomain.com`
3. Click **OK**.

### Step 2.3: Install the Expert Advisor
1. In MT5, click **File → Open Data Folder**.
2. Navigate to `MQL5/Experts/`.
3. Copy the entire `mql5/` project directory:
   - `TechForexGoldBot.mq5`
   - `Include/ApiClient.mqh`
   - `Include/LicenseGuard.mqh`
   - `Include/AccountSync.mqh`
   - `Include/RiskManager.mqh`
   - `Include/GoldStrategy.mqh`
   - `Include/OrderManager.mqh`
4. Press `F4` to open **MetaEditor**, open `TechForexGoldBot.mq5`, and click **Compile** (`F7`).
5. Ensure there are **0 errors**.

### Step 2.4: Attach EA to Chart
1. In MT5, open an **XAUUSD** chart.
2. Set timeframe to **M5** (5-Minute chart).
3. From the **Navigator** window (`Ctrl+N`), expand **Expert Advisors** and drag **TechForexGoldBot** onto the chart.
4. Under the **Inputs** tab:
   - `InpLicenseKey`: Paste customer license key (e.g. `TF-GOLD-8829-9401-K9X2`).
   - `InpApiUrl`: `https://yourdomain.com` (or `http://localhost:8000`).
   - `InpRiskPercent`: Default `2.0%` (PDF recommended 1-2%).
   - `InpCandleConfirmation`: `true` (Pin Bar / Engulfing trigger).
   - `InpFilterF1TimeWindow`: `true` (9 AM - 2 PM IST No-Trade filter).
5. Click **OK**.

### Step 2.5: Verify Live Operations
1. Check the **Experts** tab in MT5 terminal:
   - You should see: `[LICENSE VALIDATED] Status: ACTIVE | Bot Enabled: YES`.
2. Open your React Dashboard:
   - MT5 Terminal status should switch to **"MT5 Connected"**.
   - Balance, Equity, and Margins will update within 15 seconds.
