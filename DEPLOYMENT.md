# FXTRADER Production Deployment & Local Setup Guide

This document contains the exact setup procedures for running FXTRADER locally and deploying to **Shared Hosting (cPanel / Apache / MySQL)** and a **Windows VPS (MetaTrader 5 Terminal)**.

---

## A. System Requirements

### 1. Web & API Server
- **PHP**: 7.4, 8.0, 8.1, 8.2, 8.3, or 8.4
- **Required PHP Extensions**: `pdo`, `pdo_mysql`, `json`, `openssl`, `filter`
- **Database**: MySQL 5.7+ / 8.0+ or MariaDB 10.3+
- **Web Server**: Apache with `mod_rewrite` enabled (or Nginx)
- **SSL**: HTTPS is required for MT5 WebRequest security

### 2. Trading Execution Server
- **OS**: Windows 10/11 or Windows Server 2016/2019/2022
- **Software**: MetaTrader 5 (MT5) Desktop Terminal

---

## B. Local MySQL Database Setup

1. Start your local MySQL server (via Homebrew, XAMPP, or native MySQL service).
2. Create the database:
```sql
CREATE DATABASE IF NOT EXISTS `trading_bot` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```
3. Import the initial database schema and seed data:
```bash
mysql -u root -p trading_bot < database/schema.sql
mysql -u root -p trading_bot < database/seed.sql
```

---

## C. PHP Backend Configuration

Create or update your `.env` file in the project root or in `backend/.env`:
```ini
APP_NAME="FXTRADER MT5 Platform"
APP_ENV=development
APP_DEBUG=true
APP_URL=http://localhost:8000

# Database Credentials
DB_DRIVER=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=trading_bot
DB_USER=root
DB_PASSWORD=your_mysql_password

# Security Secrets
JWT_SECRET=super_secure_64_char_secret_key_889213459123
JWT_EXPIRY=604800
EA_API_SECRET=EA_COMMUNICATION_SECRET_KEY_99214

# CORS Allowed Origins
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000,*
```

---

## D. Backend Run Command

Start the PHP built-in server from the project root:
```bash
php -S localhost:8000 backend/index.php
```
Verify the API is running by visiting `http://localhost:8000/health` in your browser:
```json
{"success":true,"message":"API Gateway Healthy","data":{"status":"OK","environment":"development"}}
```

---

## E. React Frontend Run Command

In a second terminal window:
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:5173`. The frontend will automatically proxy `/api` requests to `http://localhost:8000`.

---

## F. Environment Variables

| Variable | Default (Local) | Production Example | Description |
| :--- | :--- | :--- | :--- |
| `APP_NAME` | `FXTRADER MT5 Platform` | `FXTRADER MT5 Platform` | Application Title |
| `APP_ENV` | `development` | `production` | Environment mode |
| `APP_URL` | `http://localhost:8000` | `https://fxtraderinfo.com` | Base platform URL |
| `DB_DRIVER`| `mysql` | `mysql` | Database driver (`mysql` or `sqlite`) |
| `DB_HOST` | `127.0.0.1` | `localhost` | MySQL Host |
| `DB_NAME` | `trading_bot` | `u12345_fxtrader` | Database Name |
| `DB_USER` | `root` | `u12345_dbuser` | Database Username |
| `DB_PASSWORD` | *(blank)* | *(strong password)* | Database Password |
| `JWT_SECRET` | *(dev secret)* | *(64-char random)* | JWT HMAC Secret |
| `CORS_ALLOWED_ORIGINS` | `http://localhost:5173` | `https://fxtraderinfo.com` | Allowed CORS origins |

---

## G. First Admin Creation / Reset

To create or reset the administrator password via CLI:
```bash
php backend/setup_admin.php admin@techforex.com Admin@123456
```
This hashes the password with **Bcrypt cost 12** and updates the database.

---

## H. Real Login Testing

Run the automated authentication test suite:
```bash
php tests/auth_live_test.php
```
Run the full backend integration test suite:
```bash
php tests/api_test.php
```

Default test credentials:
- **Admin**: `admin@techforex.com` / `Admin@123456`
- **Customer**: `customer@techforex.com` / `Customer@123456`

---

## I. Production React Build

On your local machine:
```bash
cd frontend
npm install
npm run build
```
This generates the optimized production build inside `frontend/dist/` (including compiled CSS with all responsive breakpoints).

---

## J. cPanel Upload (Directory Structure)

Recommended secure layout on shared hosting:
```
/home/username/
├── public_html/                     <-- Web Root (https://fxtraderinfo.com)
│   ├── index.html                   <-- (Upload frontend/dist/index.html)
│   ├── assets/                      <-- (Upload frontend/dist/assets/)
│   ├── api/
│   │   ├── index.php                <-- (Upload backend/index.php)
│   │   └── .htaccess                <-- (Upload backend/.htaccess)
│   └── .htaccess                    <-- (SPA Router Rewrite Rule)
│
└── fxtrader_backend/                <-- SECURE DIRECTORY (Outside public web root)
    ├── config/config.php
    ├── src/
    │   ├── Database.php
    │   ├── Auth.php
    │   ├── Middleware.php
    │   └── Controllers/
    └── .env                         <-- Production database secrets
```

---

## K. PHP Deployment Steps

1. Upload the `backend/` files to `/home/username/fxtrader_backend/`.
2. Ensure `public_html/api/index.php` requires files from `/home/username/fxtrader_backend/`.
3. Create `/home/username/fxtrader_backend/.env` with your cPanel database credentials.

---

## L. MySQL Deployment Steps

1. In cPanel, navigate to **MySQL Databases**.
2. Create a database `u12345_fxtrader`.
3. Create a MySQL user `u12345_dbuser` with a strong password.
4. Assign the user to the database with **ALL PRIVILEGES**.
5. Open **phpMyAdmin**, select `u12345_fxtrader`, and import:
   - `database/schema.sql`
   - `database/seed.sql`

---

## M. CORS Configuration in Production

In `/home/username/fxtrader_backend/.env`:
```ini
CORS_ALLOWED_ORIGINS=https://fxtraderinfo.com,https://www.fxtraderinfo.com
```

---

## N. HTTPS Enforcement

1. In cPanel, verify that **AutoSSL / Let's Encrypt** is active.
2. In `public_html/.htaccess`, enforce HTTPS:
```apache
RewriteEngine On
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
```

---

## O. SPA Routing (`public_html/.htaccess`)

Place this in `public_html/.htaccess` to support direct URLs (e.g. `/login`, `/dashboard`, `/admin`) without 404 errors:
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

---

## P. Production API URL

In production, the frontend connects to:
```
https://fxtraderinfo.com/api
```
Configure in `frontend/.env.production` before building:
```ini
VITE_API_URL=https://fxtraderinfo.com/api
```

---

## Q. Troubleshooting

| Issue | Cause | Solution |
| :--- | :--- | :--- |
| **"Unable to connect to server"** | PHP server is stopped or port is blocked | Verify PHP is running on port 8000 (`php -S localhost:8000 backend/index.php`). |
| **"Invalid email or password"** | Incorrect password or unseeded database | Run `php backend/setup_admin.php` to reset credentials. |
| **"Account is deactivated"** | User has `is_active = 0` | Activate user via Admin Panel or run `UPDATE users SET is_active=1 WHERE email='...';`. |
| **404 on page refresh (Production)** | Missing SPA rewrite rules in Apache | Verify `.htaccess` exists in `public_html/`. |
| **MT5 EA WebRequest Error** | Domain not whitelisted in MT5 | Add `https://fxtraderinfo.com` in MT5 **Tools &rarr; Options &rarr; Expert Advisors &rarr; WebRequest**. |
