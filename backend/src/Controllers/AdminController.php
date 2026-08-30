<?php

class AdminController {
    public static function dashboard(): void {
        Middleware::requireAdmin();

        $totalCustomers = (int)Database::fetch("SELECT COUNT(*) as c FROM customers")['c'];
        $totalLicenses = (int)Database::fetch("SELECT COUNT(*) as c FROM licenses")['c'];
        $activeBots = (int)Database::fetch("SELECT COUNT(*) as c FROM bot_instances WHERE status = 'RUNNING'")['c'];
        $connectedAccounts = (int)Database::fetch("SELECT COUNT(*) as c FROM mt5_accounts WHERE is_connected = 1")['c'];
        
        $totalProfit = (float)(Database::fetch("SELECT SUM(profit) as p FROM trades")['p'] ?? 0.0);
        $totalTrades = (int)Database::fetch("SELECT COUNT(*) as c FROM trades")['c'];
        
        $recentCustomers = Database::fetchAll(
            "SELECT c.id, u.full_name, u.email, u.is_active, c.country, c.created_at, l.license_key, l.status as license_status
             FROM customers c
             JOIN users u ON c.user_id = u.id
             LEFT JOIN licenses l ON l.customer_id = c.id
             ORDER BY c.id DESC LIMIT 5"
        );

        $recentLogs = Database::fetchAll(
            "SELECT * FROM bot_logs ORDER BY created_at DESC LIMIT 10"
        );

        Middleware::jsonSuccess([
            'stats' => [
                'total_customers' => $totalCustomers,
                'total_licenses' => $totalLicenses,
                'active_bots' => $activeBots,
                'connected_accounts' => $connectedAccounts,
                'total_profit' => round($totalProfit, 2),
                'total_trades' => $totalTrades
            ],
            'recent_customers' => $recentCustomers,
            'recent_logs' => $recentLogs
        ]);
    }

    public static function customers(): void {
        Middleware::requireAdmin();

        if ($_SERVER['REQUEST_METHOD'] === 'GET') {
            $customers = Database::fetchAll(
                "SELECT c.id, c.user_id, u.full_name, u.email, u.is_active, c.phone, c.country, c.notes, c.created_at,
                        l.id as license_id, l.license_key, l.status as license_status, l.expires_at, l.bot_enabled,
                        m.account_number, m.balance, m.equity, m.is_connected,
                        b.mode as bot_mode, b.status as bot_status
                 FROM customers c
                 JOIN users u ON c.user_id = u.id
                 LEFT JOIN licenses l ON l.customer_id = c.id
                 LEFT JOIN mt5_accounts m ON m.customer_id = c.id
                 LEFT JOIN bot_instances b ON b.mt5_account_id = m.id
                 ORDER BY c.id DESC"
            );
            Middleware::jsonSuccess(['customers' => $customers]);
        } else {
            // POST: Create Customer
            $admin = Auth::getCurrentUser();
            $body = Middleware::getJsonBody();

            $email = filter_var($body['email'] ?? '', FILTER_SANITIZE_EMAIL);
            $fullName = trim($body['full_name'] ?? '');
            $password = $body['password'] ?? 'Trader@123456';
            $phone = trim($body['phone'] ?? '');
            $country = trim($body['country'] ?? 'India');
            $strategyId = (int)($body['strategy_id'] ?? 1);

            if (empty($email) || empty($fullName)) {
                Middleware::jsonError('Email and full name are required.');
            }

            // Check if email exists
            $existing = Database::fetch("SELECT id FROM users WHERE email = :e", [':e' => $email]);
            if ($existing) {
                Middleware::jsonError('A user with this email already exists.');
            }

            $passHash = Auth::hashPassword($password);
            
            // Create user (Role 2 = CUSTOMER)
            $userId = Database::insert(
                "INSERT INTO users (role_id, email, password_hash, full_name, is_active) VALUES (2, :e, :p, :n, 1)",
                [':e' => $email, ':p' => $passHash, ':n' => $fullName]
            );

            // Create customer profile
            $customerId = Database::insert(
                "INSERT INTO customers (user_id, phone, country, notes) VALUES (:uid, :ph, :co, :no)",
                [':uid' => $userId, ':ph' => $phone, ':co' => $country, ':no' => $body['notes'] ?? '']
            );

            // Generate License Key
            $licenseKey = 'TF-' . strtoupper(substr(md5(uniqid(mt_rand(), true)), 0, 4)) . '-' . 
                          strtoupper(substr(md5(uniqid(mt_rand(), true)), 4, 4)) . '-' . 
                          strtoupper(substr(md5(uniqid(mt_rand(), true)), 8, 4));

            $startDate = date('Y-m-d');
            $expiresAt = date('Y-m-d', strtotime('+1 year'));

            $licenseId = Database::insert(
                "INSERT INTO licenses (customer_id, strategy_id, license_key, status, bot_enabled, max_accounts, start_date, expires_at)
                 VALUES (:cid, :sid, :key, 'ACTIVE', 1, 1, :sdate, :edate)",
                [
                    ':cid' => $customerId,
                    ':sid' => $strategyId,
                    ':key' => $licenseKey,
                    ':sdate' => $startDate,
                    ':edate' => $expiresAt
                ]
            );

            // Create default Risk Settings
            Database::insert(
                "INSERT INTO risk_settings (customer_id, license_id, risk_percent, max_lot_size, min_lot_size, max_open_positions, max_daily_sl_hits, max_drawdown_percent, news_filter_enabled)
                 VALUES (:cid, :lid, 2.00, 1.00, 0.01, 2, 3, 5.00, 1)",
                [':cid' => $customerId, ':lid' => $licenseId]
            );

            Database::logAudit($admin['id'], 'CUSTOMER_CREATED', 'CUSTOMER', $customerId, ['email' => $email, 'license_key' => $licenseKey]);

            Middleware::jsonSuccess([
                'customer_id' => $customerId,
                'user_id' => $userId,
                'license_key' => $licenseKey
            ], 'Customer created successfully with active license');
        }
    }

    public static function updateCustomerStatus(): void {
        $admin = Middleware::requireAdmin();
        $body = Middleware::getJsonBody();

        $customerId = (int)($body['customer_id'] ?? 0);
        $isActive = !empty($body['is_active']) ? 1 : 0;

        $cust = Database::fetch("SELECT user_id FROM customers WHERE id = :id", [':id' => $customerId]);
        if (!$cust) {
            Middleware::jsonError('Customer not found.', 404);
        }

        Database::query("UPDATE users SET is_active = :act WHERE id = :uid", [
            ':act' => $isActive,
            ':uid' => $cust['user_id']
        ]);

        Database::logAudit($admin['id'], 'CUSTOMER_STATUS_TOGGLED', 'CUSTOMER', $customerId, ['is_active' => $isActive]);

        Middleware::jsonSuccess([], 'Customer status updated');
    }

    public static function resetCustomerPassword(): void {
        $admin = Middleware::requireAdmin();
        $body = Middleware::getJsonBody();

        $customerId = (int)($body['customer_id'] ?? 0);
        $newPassword = $body['new_password'] ?? 'Trader@123456';

        $cust = Database::fetch("SELECT user_id FROM customers WHERE id = :id", [':id' => $customerId]);
        if (!$cust) {
            Middleware::jsonError('Customer not found.', 404);
        }

        $hash = Auth::hashPassword($newPassword);
        Database::query("UPDATE users SET password_hash = :h WHERE id = :uid", [
            ':h' => $hash,
            ':uid' => $cust['user_id']
        ]);

        Database::logAudit($admin['id'], 'CUSTOMER_PASSWORD_RESET', 'CUSTOMER', $customerId);

        Middleware::jsonSuccess([], 'Password reset successfully');
    }

    public static function licenses(): void {
        Middleware::requireAdmin();

        if ($_SERVER['REQUEST_METHOD'] === 'GET') {
            $licenses = Database::fetchAll(
                "SELECT l.*, c.id as customer_id, u.full_name as customer_name, u.email, s.name as strategy_name, s.code as strategy_code
                 FROM licenses l
                 JOIN customers c ON l.customer_id = c.id
                 JOIN users u ON c.user_id = u.id
                 JOIN strategies s ON l.strategy_id = s.id
                 ORDER BY l.id DESC"
            );
            Middleware::jsonSuccess(['licenses' => $licenses]);
        } else {
            // POST: Create or Update License
            $admin = Auth::getCurrentUser();
            $body = Middleware::getJsonBody();

            $licenseId = (int)($body['license_id'] ?? 0);
            if ($licenseId > 0) {
                // Update
                $status = $body['status'] ?? 'ACTIVE';
                $expiresAt = $body['expires_at'] ?? date('Y-m-d', strtotime('+1 year'));
                $botEnabled = !empty($body['bot_enabled']) ? 1 : 0;
                $maxAccounts = (int)($body['max_accounts'] ?? 1);

                Database::query(
                    "UPDATE licenses SET status = :st, expires_at = :exp, bot_enabled = :be, max_accounts = :ma WHERE id = :id",
                    [':st' => $status, ':exp' => $expiresAt, ':be' => $botEnabled, ':ma' => $maxAccounts, ':id' => $licenseId]
                );

                Database::logAudit($admin['id'], 'LICENSE_UPDATED', 'LICENSE', $licenseId, $body);
                Middleware::jsonSuccess([], 'License updated successfully');
            } else {
                // New License
                $customerId = (int)($body['customer_id'] ?? 0);
                $strategyId = (int)($body['strategy_id'] ?? 1);
                $licenseKey = 'TF-' . strtoupper(substr(md5(uniqid(mt_rand(), true)), 0, 4)) . '-' . 
                              strtoupper(substr(md5(uniqid(mt_rand(), true)), 4, 4)) . '-' . 
                              strtoupper(substr(md5(uniqid(mt_rand(), true)), 8, 4));

                $newLicId = Database::insert(
                    "INSERT INTO licenses (customer_id, strategy_id, license_key, status, bot_enabled, max_accounts, start_date, expires_at)
                     VALUES (:cid, :sid, :key, 'ACTIVE', 1, 1, :sdate, :edate)",
                    [
                        ':cid' => $customerId,
                        ':sid' => $strategyId,
                        ':key' => $licenseKey,
                        ':sdate' => date('Y-m-d'),
                        ':edate' => date('Y-m-d', strtotime('+1 year'))
                    ]
                );

                Database::logAudit($admin['id'], 'LICENSE_CREATED', 'LICENSE', $newLicId, ['key' => $licenseKey]);
                Middleware::jsonSuccess(['license_id' => $newLicId, 'license_key' => $licenseKey], 'License generated');
            }
        }
    }

    public static function botMonitoring(): void {
        Middleware::requireAdmin();

        $bots = Database::fetchAll(
            "SELECT b.*, m.account_number, m.broker, m.server, m.balance, m.equity, m.is_connected, m.last_heartbeat_at,
                    u.full_name as customer_name, u.email as customer_email, l.license_key, l.status as license_status,
                    s.name as strategy_name
             FROM bot_instances b
             JOIN mt5_accounts m ON b.mt5_account_id = m.id
             JOIN licenses l ON b.license_id = l.id
             JOIN customers c ON l.customer_id = c.id
             JOIN users u ON c.user_id = u.id
             JOIN strategies s ON l.strategy_id = s.id
             ORDER BY b.id DESC"
        );

        Middleware::jsonSuccess(['bots' => $bots]);
    }

    public static function allTrades(): void {
        Middleware::requireAdmin();

        $trades = Database::fetchAll(
            "SELECT t.*, m.account_number, m.broker, u.full_name as customer_name
             FROM trades t
             JOIN mt5_accounts m ON t.mt5_account_id = m.id
             JOIN customers c ON m.customer_id = c.id
             JOIN users u ON c.user_id = u.id
             ORDER BY t.closed_at DESC LIMIT 100"
        );

        Middleware::jsonSuccess(['trades' => $trades]);
    }

    public static function logs(): void {
        Middleware::requireAdmin();

        $botLogs = Database::fetchAll("SELECT * FROM bot_logs ORDER BY created_at DESC LIMIT 100");
        $auditLogs = Database::fetchAll("SELECT a.*, u.full_name, u.email FROM audit_logs a LEFT JOIN users u ON a.user_id = u.id ORDER BY a.created_at DESC LIMIT 100");

        Middleware::jsonSuccess([
            'bot_logs' => $botLogs,
            'audit_logs' => $auditLogs
        ]);
    }
}
