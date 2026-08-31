# Customer User Guide — Tech Forex MT5 Trading Platform

Welcome to the **Tech Forex Automated Trading Platform**. This guide explains how to connect and operate your automated bot with MetaTrader 5 in simple, step-by-step language.

---

## 1. Getting Started & Logging In

1. Open your dashboard in any web browser (desktop, tablet, or smartphone).
2. Enter your email and password provided by your administrator.
3. Click **Sign In**.

---

## 2. Connecting Your Bot to MetaTrader 5 (MT5)

Follow the 7-step checklist on your dashboard:

### Step 1: Locate Your License Key
Go to the **MT5 Terminal** tab on your dashboard to view your unique License Key (e.g. `TF-GOLD-8829-9401-K9X2`).

### Step 2: Open MetaTrader 5
Open MT5 on your Windows PC or Windows VPS and log into your broker demo account.

### Step 3: Install the Expert Advisor (EA)
1. In MT5, click **File → Open Data Folder**.
2. Open the `MQL5/Experts` folder and paste the `TechForexGoldBot` files.
3. In MT5 Navigator (`Ctrl+N`), right-click **Expert Advisors** and click **Refresh**.

### Step 4: Allow WebRequest in MT5
1. In MT5, click **Tools → Options** (or press `Ctrl+O`).
2. Go to the **Expert Advisors** tab.
3. Check **"Allow Algo Trading"** and **"Allow WebRequest for listed URL"**.
4. Click the **+** button and add your platform URL (e.g. `https://yourdomain.com`).
5. Click **OK**.

### Step 5: Attach the EA to XAUUSD (Gold)
1. Open an **XAUUSD (Gold)** chart in MT5.
2. Set the timeframe to **M5** (5-minute chart).
3. Drag **TechForexGoldBot** onto the chart.
4. In the **Inputs** tab, paste your License Key and click **OK**.
5. Ensure the **Algo Trading** button at the top of MT5 is green.

### Step 6: Verify Connection
Check your dashboard:
- MT5 status will turn to **MT5 Online / Connected**.
- Your account balance, equity, and margin will display automatically.

---

## 3. Operating the Bot

### Starting and Stopping the Bot (Master Kill Switch)
- **Start Bot**: Click the green **START BOT** button to enable automated scanning and order execution.
- **Stop Bot**: Click the red **STOP BOT (KILL SWITCH)** button.
  > **Important**: Stopping the bot prevents any **new** trades from being opened. Existing open positions remain protected by their stop loss and take profit targets.

### Demo Mode vs. Live Mode (Paper Trading First)
- The bot **always defaults to DEMO MODE** to ensure capital protection.
- Run the bot on a demo account for at least 1–2 weeks to observe trade execution.
- Only switch to **LIVE TRADING** after confirming risk parameters and agreeing to the live confirmation prompt.

---

## 4. Understanding Your Trading Dashboard

- **Account Balance**: Total deposited funds plus closed trade profits.
- **Account Equity**: Real-time balance including floating profit/loss of open trades.
- **Today's P/L**: Net profit or loss from trades closed today.
- **Open Positions**: Live trades currently open on your MT5 terminal.
- **Current Drawdown**: Maximum percentage drop from your peak equity.

---

## 5. Risk Management Settings

Under the **Risk Parameters** tab, you can customize:
- **Risk % per Trade**: Percentage of account equity risked per trade (Recommended: 1.0% to 2.0%).
- **Daily Stop Loss Limit**: If 3 stop losses occur in a single day, the bot automatically stops trading until the next day to preserve capital.
- **High-Impact News Filter**: Pauses trade entries 30 minutes before and after major news releases (NFP, CPI, FOMC, Unemployment).

---

## 6. Troubleshooting Common Questions

| Question / Issue | Solution |
| :--- | :--- |
| **MT5 shows "Offline"** | 1. Ensure MT5 is running on your Windows PC/VPS.<br>2. Check that "Algo Trading" is turned ON.<br>3. Verify that your API URL is added in MT5 WebRequest options. |
| **"License Expired" message** | Contact your platform administrator to renew your commercial license key. |
| **No trades opening during morning** | The bot follows the PDF Strategy Filter F1 rule: No trading between 9:00 AM and 2:00 PM IST to avoid low-liquidity chop. |
| **How do I change my password?** | Go to the **Trader Profile** tab, enter your current password, and choose a new one. |
