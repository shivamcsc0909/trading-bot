# Shared Hosting Deployment Guide (cPanel / DirectAdmin / Apache)

This guide explains how to deploy the **Tech Forex MT5 Automated Bot Platform** on standard, low-cost shared hosting (e.g. Hostinger, Bluehost, Namecheap, cPanel).

---

## 1. Prerequisites
- Standard Linux Shared Hosting with PHP 7.4 or 8.x
- MySQL 5.7+ or MariaDB 10.3+
- Free SSL Certificate (Let's Encrypt / AutoSSL enabled for HTTPS)
- File Manager or FTP/SFTP access

---

## 2. Directory Structure on Shared Hosting

```
/home/username/
├── public_html/                <-- Public Web Root
│   ├── index.html              <-- From frontend/dist/index.html
│   ├── assets/                 <-- From frontend/dist/assets/
│   ├── api/                    <-- Symlink or rewrite to backend/
│   │   ├── index.php           <-- From backend/index.php
│   │   └── .htaccess           <-- From backend/.htaccess
│   └── .htaccess
├── trading_backend/            <-- SECURE: Outside public_html
│   ├── config/
│   │   └── config.php
│   ├── src/
│   │   ├── Database.php
│   │   ├── Auth.php
│   │   ├── Middleware.php
│   │   └── Controllers/
│   └── .env                    <-- Production environment variables
```

---

## 3. Step-by-Step Deployment Steps

### Step 3.1: Build the React Frontend
On your local machine:
```bash
cd frontend
npm install
npm run build
```
This produces optimized static assets in `frontend/dist/`.

### Step 3.2: Upload Frontend to `public_html`
1. Upload all contents of `frontend/dist/` into your hosting's `public_html/` folder.

### Step 3.3: Upload PHP Backend
1. Create a folder named `trading_backend` in your home directory (outside `public_html`).
2. Upload `backend/src/`, `backend/config/`, and `backend/index.php`.
3. In `public_html/`, create an `api/` folder with `index.php` pointing to `/home/username/trading_backend/index.php` and copy `backend/.htaccess`.

### Step 3.4: Create MySQL Database & Import Schema
1. Log in to your cPanel → **MySQL Databases**.
2. Create database `u12345_trading_bot` and a user with a strong password.
3. Open **phpMyAdmin**, select the new database, and import:
   - `database/schema.sql`
   - `database/seed.sql`

### Step 3.5: Configure Environment Variables
In `trading_backend/.env` (or via cPanel Environment settings):
```ini
APP_NAME="TechForex MT5 Platform"
APP_ENV=production
APP_DEBUG=false
APP_URL=https://yourdomain.com

DB_DRIVER=mysql
DB_HOST=localhost
DB_NAME=u12345_trading_bot
DB_USER=u12345_botuser
DB_PASSWORD=YourStrongDatabasePassword123!

JWT_SECRET=generate_a_64_character_random_secret_string_here
JWT_EXPIRY=604800
CORS_ALLOWED_ORIGINS=https://yourdomain.com
```

### Step 3.6: Verify HTTPS
Ensure your domain has an active SSL certificate. MT5 WebRequest requires HTTPS in production.
Test your API health:
```bash
curl -i https://yourdomain.com/api/health
```
Expected output: `{"success":true,"message":"API Gateway Healthy"}`.
