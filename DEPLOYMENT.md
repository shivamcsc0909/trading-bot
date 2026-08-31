# Production Deployment Guide — Tech Forex MT5 Automated Platform

This document contains the exact commands and configuration steps to deploy the **Tech Forex MT5 Automated Trading Platform** on standard shared hosting (cPanel / Apache / MySQL) and Windows VPS (MetaTrader 5 Terminal).

---

## A. System Requirements

### 1. Web & API Server (Shared Hosting / VPS)
- **PHP**: 7.4, 8.0, 8.1, 8.2, 8.3, or 8.4
- **PHP Extensions**: `pdo`, `pdo_mysql`, `json`, `openssl`, `filter`
- **Database**: MySQL 5.7+ / 8.0+ or MariaDB 10.3+
- **Web Server**: Apache with `mod_rewrite` enabled (or Nginx)
- **SSL Certificate**: Free Let's Encrypt / AutoSSL (HTTPS is mandatory for MT5 WebRequest)

### 2. Trading Execution Server (Windows PC or Windows VPS)
- **OS**: Windows 10/11 or Windows Server 2016/2019/2022
- **RAM**: Minimum 2 GB (4 GB recommended for multiple charts)
- **Software**: MetaTrader 5 (MT5) Desktop Terminal

---

## B. Local Development & Testing

```bash
# 1. Start the PHP backend (from project root)
php -S localhost:8000 -t backend/

# 2. Run backend and database integration tests
php tests/api_test.php

# 3. Run XAUUSD strategy backtest simulation
php tests/strategy_backtest.php

# 4. Start React frontend
cd frontend
npm install
npm run dev
```
Open `http://localhost:5173`. Default logins:
- **Customer**: `customer@techforex.com` / `Customer@123456`
- **Admin**: `admin@techforex.com` / `Admin@123456`

---

## C. Step-by-Step Production Deployment

### Step 1: Build the React Frontend
On your local machine:
```bash
cd frontend
npm install
npm run build
```
The optimized production build is generated inside `frontend/dist/`.

---

### Step 2: Upload Files to Shared Hosting (cPanel / Apache)

Recommended secure directory structure:
```
/home/username/
├── public_html/                     <-- Web Root
│   ├── index.html                   <-- (From frontend/dist/index.html)
│   ├── assets/                      <-- (From frontend/dist/assets/)
│   ├── api/
│   │   ├── index.php                <-- (From backend/index.php)
│   │   └── .htaccess                <-- (From backend/.htaccess)
│   └── .htaccess                    <-- (SPA Router Rewrite)
│
└── trading_backend/                 <-- SECURE (Outside public_html)
    ├── config/config.php
    ├── src/Database.php
    ├── src/Auth.php
    ├── src/Middleware.php
    ├── src/Controllers/
    └── .env                         <-- Production secrets
```

1. Upload the contents of `frontend/dist/` into your `public_html/` folder.
2. In `public_html/`, create an `.htaccess` file with SPA routing:
```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^api/ - [L]
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
```
3. Upload `backend/` files into `/home/username/trading_backend/` (outside public web root).
4. Put `backend/index.php` and `backend/.htaccess` inside `public_html/api/`.

---

### Step 3: Create Database & Import Schema
1. Log into your cPanel → **MySQL Databases**.
2. Create a database `u12345_trading_bot` and a database user with a strong password.
3. Assign the user to the database with **ALL PRIVILEGES**.
4. Open **phpMyAdmin**, select `u12345_trading_bot`, and import:
   - `database/schema.sql`
   - `database/seed.sql`

---

### Step 4: Configure Environment Secrets
Create `/home/username/trading_backend/.env`:
```ini
APP_NAME="TechForex MT5 Platform"
APP_ENV=production
APP_DEBUG=false
APP_URL=https://yourdomain.com

DB_DRIVER=mysql
DB_HOST=localhost
DB_PORT=3306
DB_NAME=u12345_trading_bot
DB_USER=u12345_botuser
DB_PASSWORD=YourSecureDatabasePassword123!

JWT_SECRET=super_random_64_character_production_jwt_secret_key_889213
JWT_EXPIRY=604800
EA_API_SECRET=EA_COMMUNICATION_SECRET_KEY_99214
CORS_ALLOWED_ORIGINS=https://yourdomain.com
```

---

### Step 5: Test API Connectivity
Verify your live API with curl:
```bash
curl -i https://yourdomain.com/api/health
```
Expected response:
```json
{"success":true,"message":"API Gateway Healthy","data":{"status":"OK","environment":"production"}}
```

---

### Step 6: Install & Configure MQL5 EA on MT5

1. Open MetaTrader 5 on your Windows PC or Windows VPS.
2. Click **File → Open Data Folder**, open `MQL5/Experts/`, and paste:
   - `mql5/TechForexGoldBot.mq5`
   - `mql5/Include/` (all `.mqh` files)
3. Open **MetaEditor** (`F4`), open `TechForexGoldBot.mq5`, and click **Compile** (`F7`). Verify **0 errors**.
4. In MT5, navigate to **Tools → Options → Expert Advisors**:
   - Check **"Allow Algo Trading"**.
   - Check **"Allow WebRequest for listed URL"**.
   - Click the green **+** icon and add: `https://yourdomain.com` (or `http://localhost:8000`).
   - Click **OK**.
5. Enable the **Algo Trading** button in MT5's top toolbar (button should turn green).
6. Open an **XAUUSD** chart and set timeframe to **M5** (5-minute candles).
7. Drag `TechForexGoldBot` onto the chart:
   - `InpLicenseKey`: Enter the customer's license key (e.g. `TF-GOLD-8829-9401-K9X2`).
   - `InpApiUrl`: `https://yourdomain.com`.
   - Click **OK**.
8. Verify in the MT5 **Experts** log: `[LICENSE VALIDATED] Status: ACTIVE | Bot Enabled: YES`.

---

## D. Production Verification Checklist

- [x] Frontend builds cleanly with zero errors (`npm run build`).
- [x] Database schema has foreign keys, indexes, and soft-delete support.
- [x] Backend API responds over HTTPS with JWT authentication.
- [x] MT5 EA transmits periodic heartbeats (15s interval) and updates dashboard.
- [x] Bot starts in **DEMO mode** first; Live mode requires explicit confirmation.
- [x] Master Bot Kill Switch halts new trade entries immediately upon request.
