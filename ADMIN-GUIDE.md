# Administrator Operations Guide — Tech Forex MT5 Platform

This guide outlines administrative procedures for customer onboarding, strategy management, license lifecycle, fleet monitoring, and security controls.

---

## 1. Accessing the Admin Command Center

1. Log into the dashboard with your administrator credentials (`admin@techforex.com`).
2. The sidebar will display the **Administration Panel** with 7 management modules:
   - **Admin Metrics** (High-level system stats)
   - **Customer Management** (CRUD, lifecycle, search, strategy assignment)
   - **Bot Fleet Monitoring** (Real-time connection states and kill switch)
   - **Strategy Engine** (Strategy catalog, parameter tuning, versioning)
   - **License System** (Issue, suspend, and renew licenses)
   - **Platform Trades** (Global trade execution audit)
   - **Audit & System Logs** (Security trace of admin events)

---

## 2. Customer Management & Lifecycle

### 2.1 Onboard a New Customer
1. Go to **Customer Management** and click **+ Onboard New Customer**.
2. Enter Full Name, Email, Phone, Country, Initial Password, and select a Strategy.
3. Click **Create & Issue License**.
4. The system will automatically:
   - Create the customer profile.
   - Generate a unique 16-character commercial license key (e.g. `TF-XXXX-XXXX-XXXX`).
   - Create default risk settings (2% risk, max 3 SL limit).

### 2.2 Suspend / Activate Customer
- Click **Suspend** to temporarily disable customer access and freeze bot execution.
- Click **Activate** to re-enable the account.

### 2.3 Assign or Change Strategy
1. Click the **Layers icon** next to any customer.
2. Select the new strategy and confirm.
3. If the customer is running in **LIVE TRADING mode**, a safety confirmation alert will prompt you before applying the change.

### 2.4 Soft-Delete (Archive) and Restore
- Click the **Archive (folder icon)** to safely soft-delete a customer.
- **Data Protection**: Trade records, deal tickets, balance snapshots, and audit logs are **never permanently deleted**.
- To restore an archived customer, navigate to the **ARCHIVED** tab and click **Restore**.

---

## 3. Strategy Management & Versioning

Under **Strategy Engine**, administrators can:
- **Create Strategy**: Define code, symbol (e.g. `XAUUSD`), timeframe (`M5`), and version number (`1.0`).
- **Duplicate Strategy**: Clone an existing strategy to test parameter variations without modifying the original.
- **Tune Parameters**: Edit block size, attempt limits, risk %, or time filters inline and click **Save**. The MQL5 EA adopts the new parameters on its next heartbeat.

---

## 4. Bot Fleet Monitoring

The **Bot Fleet Monitoring** page polls every 15 seconds:
- **ONLINE**: Terminal connected with heartbeat received in the last 90 seconds.
- **STALE PING**: Heartbeat delayed (90 to 300 seconds).
- **OFFLINE**: No heartbeat for over 5 minutes.
- **ERROR**: Terminal reported an execution or broker error.
- **Master Kill Switch**: Administrators can stop any client bot remotely with a single click.

---

## 5. Security Best Practices

- Change the default administrator password immediately upon production deployment.
- Never share the `JWT_SECRET` or database credentials.
- Periodically review the **Audit & System Logs** for unauthorized access attempts.
