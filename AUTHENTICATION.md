# FXTRADER — Real Authentication & Security Architecture

This document describes the real authentication and authorization architecture implemented in the FXTRADER MT5 platform across the React frontend, PHP REST API, and MySQL/MariaDB database.

---

## 1. Authentication Flow

```
+----------------------------------------------------------------+
|                        React Frontend                          |
|  (User inputs Email + Password into Login form in Login.jsx)   |
+----------------------------------------------------------------+
                               |
                               | POST /api/auth/login
                               v
+----------------------------------------------------------------+
|                   PHP Backend (AuthController)                 |
|  1. Sanitizes inputs (filter_var)                              |
|  2. Fetches user record + role + customer profile from MySQL   |
|  3. Verifies password hash via password_verify() (Bcrypt)     |
|  4. Checks user `is_active` status (blocks suspended accounts) |
|  5. Generates HMAC-SHA256 JWT Token (valid for 7 days)         |
|  6. Records USER_LOGIN event in `audit_logs` table             |
+----------------------------------------------------------------+
                               |
                               | JSON Response: { token, user }
                               v
+----------------------------------------------------------------+
|                   React Auth State (AuthContext)               |
|  1. Stores token in localStorage ('tf_token')                  |
|  2. Sets user in React context ('tf_user')                     |
|  3. Validates token against GET /api/auth/me on app load       |
|  4. Redirects based on role:                                   |
|     - Role: ADMIN    --> Admin Command Center Dashboard        |
|     - Role: CUSTOMER --> Trader Operations Dashboard           |
+----------------------------------------------------------------+
```

---

## 2. API Endpoints & Request / Response Formats

### A. User Login (`POST /api/auth/login`)
- **Headers**: `Content-Type: application/json`
- **Request Body**:
```json
{
  "email": "customer@techforex.com",
  "password": "Customer@123456"
}
```
- **Success Response (HTTP 200)**:
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
    "user": {
      "id": 2,
      "email": "customer@techforex.com",
      "full_name": "Shivam Gangele (Customer)",
      "role": "CUSTOMER",
      "customer_id": 1
    }
  },
  "timestamp": 1725062400
}
```
- **Error Responses**:
  - `401 Unauthorized`: `{"success":false,"message":"Invalid email or password credentials."}`
  - `403 Forbidden`: `{"success":false,"message":"Account is deactivated. Please contact administrator."}`

---

### B. Verify Current User Session (`GET /api/auth/me`)
- **Headers**: `Authorization: Bearer <token>`
- **Success Response (HTTP 200)**:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 2,
      "email": "customer@techforex.com",
      "full_name": "Shivam Gangele (Customer)",
      "is_active": 1,
      "role": "CUSTOMER",
      "customer_id": 1,
      "phone": "+91 9876543210",
      "country": "India"
    }
  }
}
```

---

### C. User Logout (`POST /api/auth/logout`)
- **Headers**: `Authorization: Bearer <token>`
- **Action**: Clears client token and records `USER_LOGOUT` in database audit trail.

---

### D. Change Password (`POST /api/auth/password`)
- **Headers**: `Authorization: Bearer <token>`
- **Request Body**:
```json
{
  "current_password": "Customer@123456",
  "new_password": "NewStrongPassword789!"
}
```

---

## 3. Role-Based Access Control (RBAC)

| Role | Access Scope | Protected Middleware |
| :--- | :--- | :--- |
| **ADMIN** | Global fleet monitoring, customer lifecycle management, strategy CRUD & versioning, license issuance, global trade audits, system logs | `Middleware::requireAdmin()` |
| **CUSTOMER** | Personal MT5 terminal telemetry, live positions, closed trade history, risk settings customization, kill switch, EA connection setup | `Middleware::requireAuth()` |
| **GUEST** | Public landing page, product information, official website link, Telegram support channel | Unauthenticated |

---

## 4. Password Hashing & Security Safeguards

- **Algorithm**: `PASSWORD_BCRYPT` with cost parameter `12` (`password_hash($pass, PASSWORD_BCRYPT, ['cost' => 12])`).
- **Timing Attack Defense**: `hash_equals()` is used for HMAC token signature comparisons.
- **SQL Injection Prevention**: All queries use **PDO Prepared Statements** with bound parameters (`:email`, `:id`, etc.).
- **Zero Mock Policy**: The React API connector ([`api.js`](file:///Users/coder/Downloads/trading%20bot/frontend/src/services/api.js)) does not contain mock fallbacks; all requests connect directly to the real PHP backend.
- **Token Auto-Invalidation**: If a token is tampered with or expired, `AuthContext` clears local storage and forces the user back to the login screen.
