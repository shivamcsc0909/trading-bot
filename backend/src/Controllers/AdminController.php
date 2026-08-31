<?php

class AdminController {
    public static function dashboard(): void {
        Middleware::requireAdmin();

        $totalCustomers = (int)Database::fetch("SELECT COUNT(*) as c FROM customers WHERE is_archived = 0")['c'];
        $activeCustomers = (int)Database::fetch("SELECT COUNT(*) as c FROM customers c JOIN users u ON c.user_id = u.id WHERE u.is_active = 1 AND c.is_archived = 0")['c'];
        $suspendedCustomers = (int)Database::fetch("SELECT COUNT(*) as c FROM customers c JOIN users u ON c.user_id = u.id WHERE u.is_active = 0 AND c.is_archived = 0")['c'];
        $archivedCustomers = (int)Database::fetch("SELECT COUNT(*) as c FROM customers WHERE is_archived = 1")['c'];

        $totalLicenses = (int)Database::fetch("SELECT COUNT(*) as c FROM licenses")['c'];
        $activeLicenses = (int)Database::fetch("SELECT COUNT(*) as c FROM licenses WHERE status = 'ACTIVE'")['c'];
        $expiredLicenses = (int)Database::fetch("SELECT COUNT(*) as c FROM licenses WHERE status = 'EXPIRED' OR expires_at < CURRENT_DATE")['c'];

        $activeBots = (int)Database::fetch("SELECT COUNT(*) as c FROM bot_instances WHERE status = 'RUNNING'")['c'];
        $demoBots = (int)Database::fetch("SELECT COUNT(*) as c FROM bot_instances WHERE mode = 'DEMO'")['c'];
        $liveBots = (int)Database::fetch("SELECT COUNT(*) as c FROM bot_instances WHERE mode = 'LIVE'")['c'];

        $connectedAccounts = (int)Database::fetch("SELECT COUNT(*) as c FROM mt5_accounts WHERE is_connected = 1")['c'];
        
        $totalProfit = (float)(Database::fetch("SELECT SUM(profit) as p FROM trades")['p'] ?? 0.0);
        $totalTrades = (int)Database::fetch("SELECT COUNT(*) as c FROM trades")['c'];
        $todayTrades = (int)Database::fetch("SELECT COUNT(*) as c FROM trades WHERE DATE(closed_at) = CURRENT_DATE")['c'];
        
        $recentCustomers = Database::fetchAll(
            "SELECT c.id, u.full_name, u.email, u.is_active, c.country, c.is_archived, c.created_at, l.license_key, l.status as license_status
             FROM customers c
             JOIN users u ON c.user_id = u.id
             LEFT JOIN licenses l ON l.customer_id = c.id
             WHERE c.is_archived = 0
             ORDER BY c.id DESC LIMIT 5"
        );

        $recentLogs = Database::fetchAll(
            "SELECT * FROM bot_logs ORDER BY created_at DESC LIMIT 10"
        );

        Middleware::jsonSuccess([
            'stats' => [
                'total_customers' => $totalCustomers,
                'active_customers' => $activeCustomers,
                'suspended_customers' => $suspendedCustomers,
                'archived_customers' => $archivedCustomers,
                'total_licenses' => $totalLicenses,
                'active_licenses' => $activeLicenses,
                'expired_licenses' => $expiredLicenses,
                'active_bots' => $activeBots,
                'demo_bots' => $demoBots,
                'live_bots' => $liveBots,
                'connected_accounts' => $connectedAccounts,
                'total_profit' => round($totalProfit, 2),
                'total_trades' => $totalTrades,
                'today_trades' => $todayTrades
            ],
            'recent_customers' => $recentCustomers,
            'recent_logs' => $recentLogs
        ]);
    }

    public static function customers(): void {
        Middleware::requireAdmin();

        if ($_SERVER['REQUEST_METHOD'] === 'GET') {
            $includeArchived = isset($_GET['archived']) && $_GET['archived'] === '1';
            $condition = $includeArchived ? "1=1" : "c.is_archived = 0";

            $customers = Database::fetchAll(
                "SELECT c.id, c.user_id, u.full_name, u.email, u.is_active, c.phone, c.country, c.notes, c.is_archived, c.created_at,
                        l.id as license_id, l.license_key, l.status as license_status, l.expires_at, l.bot_enabled, l.strategy_id,
                        s.name as strategy_name, s.code as strategy_code, s.version as strategy_version,
                        m.account_number, m.broker, m.server, m.balance, m.equity, m.is_connected, m.last_heartbeat_at,
                        b.mode as bot_mode, b.status as bot_status
                 FROM customers c
                 JOIN users u ON c.user_id = u.id
                 LEFT JOIN licenses l ON l.customer_id = c.id
                 LEFT JOIN strategies s ON l.strategy_id = s.id
                 LEFT JOIN mt5_accounts m ON m.customer_id = c.id
                 LEFT JOIN bot_instances b ON b.mt5_account_id = m.id
                 WHERE $condition
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
                "INSERT INTO customers (user_id, phone, country, notes, is_archived) VALUES (:uid, :ph, :co, :no, 0)",
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

    public static function archiveCustomer(): void {
        $admin = Middleware::requireAdmin();
        $body = Middleware::getJsonBody();

        $customerId = (int)($body['customer_id'] ?? 0);
        $cust = Database::fetch("SELECT user_id FROM customers WHERE id = :id", [':id' => $customerId]);
        if (!$cust) {
            Middleware::jsonError('Customer not found.', 404);
        }

        // Soft delete: Deactivate user and mark customer as archived
        Database::query("UPDATE users SET is_active = 0 WHERE id = :uid", [':uid' => $cust['user_id']]);
        Database::query("UPDATE customers SET is_archived = 1, archived_at = NOW() WHERE id = :id", [':id' => $customerId]);
        Database::query("UPDATE licenses SET bot_enabled = 0, status = 'SUSPENDED' WHERE customer_id = :cid", [':cid' => $customerId]);

        Database::logAudit($admin['id'], 'CUSTOMER_ARCHIVED', 'CUSTOMER', $customerId, ['note' => 'Customer soft-deleted; trade history and records preserved']);

        Middleware::jsonSuccess([], 'Customer safely archived (soft deleted). Trade history preserved.');
    }

    public static function restoreCustomer(): void {
        $admin = Middleware::requireAdmin();
        $body = Middleware::getJsonBody();

        $customerId = (int)($body['customer_id'] ?? 0);
        $cust = Database::fetch("SELECT user_id FROM customers WHERE id = :id", [':id' => $customerId]);
        if (!$cust) {
            Middleware::jsonError('Customer not found.', 404);
        }

        Database::query("UPDATE users SET is_active = 1 WHERE id = :uid", [':uid' => $cust['user_id']]);
        Database::query("UPDATE customers SET is_archived = 0, archived_at = NULL WHERE id = :id", [':id' => $customerId]);
        Database::query("UPDATE licenses SET status = 'ACTIVE' WHERE customer_id = :cid", [':cid' => $customerId]);

        Database::logAudit($admin['id'], 'CUSTOMER_RESTORED', 'CUSTOMER', $customerId);

        Middleware::jsonSuccess([], 'Customer account restored successfully');
    }

    public static function assignStrategy(): void {
        $admin = Middleware::requireAdmin();
        $body = Middleware::getJsonBody();

        $customerId = (int)($body['customer_id'] ?? 0);
        $strategyId = (int)($body['strategy_id'] ?? 0);

        $cust = Database::fetch("SELECT id FROM customers WHERE id = :id", [':id' => $customerId]);
        $strat = Database::fetch("SELECT * FROM strategies WHERE id = :id", [':id' => $strategyId]);

        if (!$cust || !$strat) {
            Middleware::jsonError('Invalid customer or strategy ID.', 404);
        }

        Database::query("UPDATE licenses SET strategy_id = :sid WHERE customer_id = :cid", [
            ':sid' => $strategyId,
            ':cid' => $customerId
        ]);

        Database::logAudit($admin['id'], 'STRATEGY_ASSIGNED', 'CUSTOMER', $customerId, [
            'strategy_id' => $strategyId,
            'strategy_name' => $strat['name'],
            'version' => $strat['version'] ?? '1.0'
        ]);

        Middleware::jsonSuccess([], "Strategy '{$strat['name']}' assigned to customer");
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
                "SELECT l.*, c.id as customer_id, u.full_name as customer_name, u.email, s.name as strategy_name, s.code as strategy_code, s.version as strategy_version
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
                $status = $body['status'] ?? 'ACTIVE';
                $expiresAt = $body['expires_at'] ?? date('Y-m-d', strtotime('+1 year'));
                $botEnabled = !empty($body['bot_enabled']) ? 1 : 0;
                $maxAccounts = (int)($body['max_accounts'] ?? 1);
                $strategyId = !empty($body['strategy_id']) ? (int)$body['strategy_id'] : null;

                $sql = "UPDATE licenses SET status = :st, expires_at = :exp, bot_enabled = :be, max_accounts = :ma";
                $params = [':st' => $status, ':exp' => $expiresAt, ':be' => $botEnabled, ':ma' => $maxAccounts, ':id' => $licenseId];

                if ($strategyId) {
                    $sql .= ", strategy_id = :sid";
                    $params[':sid'] = $strategyId;
                }
                $sql .= " WHERE id = :id";

                Database::query($sql, $params);

                Database::logAudit($admin['id'], 'LICENSE_UPDATED', 'LICENSE', $licenseId, $body);
                Middleware::jsonSuccess([], 'License updated successfully');
            } else {
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
            "SELECT b.*, m.account_number, m.broker, m.server, m.balance, m.equity, m.margin, m.free_margin, m.is_connected, m.last_heartbeat_at, m.ea_version,
                    u.full_name as customer_name, u.email as customer_email, l.license_key, l.status as license_status,
                    s.name as strategy_name, s.version as strategy_version
             FROM bot_instances b
             JOIN mt5_accounts m ON b.mt5_account_id = m.id
             JOIN licenses l ON b.license_id = l.id
             JOIN customers c ON l.customer_id = c.id
             JOIN users u ON c.user_id = u.id
             JOIN strategies s ON l.strategy_id = s.id
             ORDER BY b.id DESC"
        );

        $now = time();
        foreach ($bots as &$bot) {
            $lastHb = !empty($bot['last_heartbeat_at']) ? strtotime($bot['last_heartbeat_at']) : 0;
            $diff = $now - $lastHb;

            if (!empty($bot['last_error'])) {
                $bot['connection_state'] = 'ERROR';
            } elseif ($bot['is_connected'] == 1 && $diff <= 90) {
                $bot['connection_state'] = 'ONLINE';
            } elseif ($bot['is_connected'] == 1 && $diff <= 300) {
                $bot['connection_state'] = 'STALE';
            } else {
                $bot['connection_state'] = 'OFFLINE';
            }
            $bot['heartbeat_seconds_ago'] = $diff;
        }

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
