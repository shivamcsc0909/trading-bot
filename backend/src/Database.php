<?php

class Database {
    private static ?PDO $instance = null;
    private static array $config = [];

    public static function init(array $config): void {
        self::$config = $config;
    }

    public static function getConnection(): PDO {
        if (self::$instance === null) {
            $dbConf = self::$config['db'] ?? [];
            $driver = $dbConf['driver'] ?? 'mysql';

            if ($driver === 'sqlite') {
                $path = $dbConf['sqlite_path'] ?? __DIR__ . '/../../database/dev_database.sqlite';
                $dir = dirname($path);
                if (!is_dir($dir)) {
                    mkdir($dir, 0755, true);
                }
                self::$instance = new PDO('sqlite:' . $path);
                self::$instance->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
                self::$instance->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
                self::$instance->exec("PRAGMA foreign_keys = ON;");
                self::autoMigrateSqlite(self::$instance);
            } else {
                $dsn = sprintf(
                    'mysql:host=%s;port=%s;dbname=%s;charset=%s',
                    $dbConf['host'] ?? '127.0.0.1',
                    $dbConf['port'] ?? '3306',
                    $dbConf['database'] ?? 'trading_bot',
                    $dbConf['charset'] ?? 'utf8mb4'
                );

                $options = [
                    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::ATTR_EMULATE_PREPARES   => false,
                ];

                try {
                    self::$instance = new PDO($dsn, $dbConf['username'] ?? 'root', $dbConf['password'] ?? '', $options);
                } catch (PDOException $e) {
                    // If MySQL fails in development mode, fallback to SQLite for test resilience
                    if (($selfConfig['app']['env'] ?? '') !== 'production') {
                        $sqlitePath = $dbConf['sqlite_path'] ?? __DIR__ . '/../../database/dev_database.sqlite';
                        $dir = dirname($sqlitePath);
                        if (!is_dir($dir)) {
                            mkdir($dir, 0755, true);
                        }
                        self::$instance = new PDO('sqlite:' . $sqlitePath);
                        self::$instance->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
                        self::$instance->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
                        self::$instance->exec("PRAGMA foreign_keys = ON;");
                        self::autoMigrateSqlite(self::$instance);
                    } else {
                        throw $e;
                    }
                }
            }
        }

        return self::$instance;
    }

    public static function query(string $sql, array $params = []): PDOStatement {
        $stmt = self::getConnection()->prepare($sql);
        $stmt->execute($params);
        return $stmt;
    }

    public static function fetch(string $sql, array $params = []): ?array {
        $stmt = self::query($sql, $params);
        $result = $stmt->fetch();
        return $result ?: null;
    }

    public static function fetchAll(string $sql, array $params = []): array {
        $stmt = self::query($sql, $params);
        return $stmt->fetchAll();
    }

    public static function insert(string $sql, array $params = []): int {
        $db = self::getConnection();
        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        return (int)$db->lastInsertId();
    }

    public static function execute(string $sql, array $params = []): int {
        $stmt = self::query($sql, $params);
        return $stmt->rowCount();
    }

    public static function logAudit(?int $userId, string $action, string $entityType, ?int $entityId, array $details = []): void {
        try {
            $ip = $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1';
            self::query(
                "INSERT INTO audit_logs (user_id, action, entity_type, entity_id, ip_address, details_json) 
                 VALUES (:uid, :act, :etype, :eid, :ip, :details)",
                [
                    ':uid' => $userId,
                    ':act' => $action,
                    ':etype' => $entityType,
                    ':eid' => $entityId,
                    ':ip' => $ip,
                    ':details' => json_encode($details)
                ]
            );
        } catch (Exception $e) {
            // Non-blocking for audit failure
        }
    }

    public static function logBotEvent(?int $mt5AccountId, ?int $licenseId, string $level, string $eventType, string $message, array $context = []): void {
        try {
            self::query(
                "INSERT INTO bot_logs (mt5_account_id, license_id, log_level, event_type, message, context_json)
                 VALUES (:acc_id, :lic_id, :lvl, :etype, :msg, :ctx)",
                [
                    ':acc_id' => $mt5AccountId,
                    ':lic_id' => $licenseId,
                    ':lvl' => $level,
                    ':etype' => $eventType,
                    ':msg' => $message,
                    ':ctx' => json_encode($context)
                ]
            );
        } catch (Exception $e) {
            // Non-blocking
        }
    }

    private static function autoMigrateSqlite(PDO $pdo): void {
        // Quick SQLite schema builder for smooth local dev / testing if MySQL is offline
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS roles (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT UNIQUE NOT NULL,
                description TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                role_id INTEGER NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                full_name TEXT NOT NULL,
                is_active INTEGER DEFAULT 1,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS customers (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER UNIQUE NOT NULL,
                phone TEXT,
                country TEXT DEFAULT 'India',
                notes TEXT,
                is_archived INTEGER DEFAULT 0,
                archived_at DATETIME,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS strategies (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                code TEXT UNIQUE NOT NULL,
                name TEXT NOT NULL,
                description TEXT,
                symbol TEXT DEFAULT 'XAUUSD',
                timeframe TEXT DEFAULT 'M5',
                version TEXT DEFAULT '1.0',
                is_active INTEGER DEFAULT 1,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS strategy_parameters (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                strategy_id INTEGER NOT NULL,
                param_key TEXT NOT NULL,
                param_value TEXT NOT NULL,
                param_type TEXT DEFAULT 'string',
                description TEXT,
                UNIQUE(strategy_id, param_key)
            );
            CREATE TABLE IF NOT EXISTS licenses (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                customer_id INTEGER NOT NULL,
                strategy_id INTEGER NOT NULL,
                license_key TEXT UNIQUE NOT NULL,
                status TEXT DEFAULT 'ACTIVE',
                bot_enabled INTEGER DEFAULT 0,
                max_accounts INTEGER DEFAULT 1,
                start_date TEXT NOT NULL,
                expires_at TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS mt5_accounts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                customer_id INTEGER NOT NULL,
                license_id INTEGER NOT NULL,
                account_number INTEGER NOT NULL,
                broker TEXT DEFAULT 'MetaQuotes-Demo',
                server TEXT DEFAULT 'MetaQuotes-Server',
                currency TEXT DEFAULT 'USD',
                balance REAL DEFAULT 0.00,
                equity REAL DEFAULT 0.00,
                margin REAL DEFAULT 0.00,
                free_margin REAL DEFAULT 0.00,
                leverage INTEGER DEFAULT 100,
                ea_version TEXT DEFAULT '1.0.0',
                is_connected INTEGER DEFAULT 0,
                last_heartbeat_at DATETIME,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS bot_instances (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                mt5_account_id INTEGER UNIQUE NOT NULL,
                license_id INTEGER NOT NULL,
                mode TEXT DEFAULT 'DEMO',
                status TEXT DEFAULT 'STOPPED',
                magic_number INTEGER DEFAULT 108801,
                last_error TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS risk_settings (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                customer_id INTEGER NOT NULL,
                license_id INTEGER UNIQUE NOT NULL,
                risk_percent REAL DEFAULT 2.00,
                max_lot_size REAL DEFAULT 1.00,
                min_lot_size REAL DEFAULT 0.01,
                max_open_positions INTEGER DEFAULT 2,
                max_daily_sl_hits INTEGER DEFAULT 3,
                max_daily_loss_currency REAL DEFAULT 300.00,
                max_drawdown_percent REAL DEFAULT 5.00,
                max_spread_points INTEGER DEFAULT 35,
                trading_session_start TEXT DEFAULT '14:00:00',
                trading_session_end TEXT DEFAULT '23:30:00',
                news_filter_enabled INTEGER DEFAULT 1,
                emergency_stop_enabled INTEGER DEFAULT 0,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS signals (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                strategy_id INTEGER NOT NULL,
                mt5_account_id INTEGER NOT NULL,
                signal_uid TEXT UNIQUE NOT NULL,
                symbol TEXT NOT NULL,
                direction TEXT NOT NULL,
                order_type TEXT DEFAULT 'MARKET',
                price REAL NOT NULL,
                stop_loss REAL NOT NULL,
                take_profit REAL NOT NULL,
                reason TEXT,
                timeframe TEXT DEFAULT 'M5',
                status TEXT DEFAULT 'GENERATED',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS orders (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                mt5_account_id INTEGER NOT NULL,
                signal_id INTEGER,
                order_ticket INTEGER NOT NULL,
                symbol TEXT NOT NULL,
                order_type TEXT NOT NULL,
                lot_size REAL NOT NULL,
                price REAL NOT NULL,
                stop_loss REAL DEFAULT 0.0,
                take_profit REAL DEFAULT 0.0,
                magic_number INTEGER DEFAULT 108801,
                status TEXT DEFAULT 'EXECUTED',
                broker_comment TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS positions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                mt5_account_id INTEGER NOT NULL,
                position_ticket INTEGER NOT NULL,
                symbol TEXT NOT NULL,
                position_type TEXT NOT NULL,
                volume REAL NOT NULL,
                open_price REAL NOT NULL,
                current_price REAL NOT NULL,
                stop_loss REAL DEFAULT 0.0,
                take_profit REAL DEFAULT 0.0,
                profit REAL DEFAULT 0.00,
                swap REAL DEFAULT 0.00,
                comment TEXT,
                magic_number INTEGER DEFAULT 108801,
                opened_at DATETIME NOT NULL,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(mt5_account_id, position_ticket)
            );
            CREATE TABLE IF NOT EXISTS trades (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                mt5_account_id INTEGER NOT NULL,
                deal_ticket INTEGER NOT NULL,
                position_ticket INTEGER NOT NULL,
                symbol TEXT NOT NULL,
                trade_type TEXT NOT NULL,
                volume REAL NOT NULL,
                open_price REAL NOT NULL,
                close_price REAL NOT NULL,
                stop_loss REAL DEFAULT 0.0,
                take_profit REAL DEFAULT 0.0,
                profit REAL NOT NULL,
                commission REAL DEFAULT 0.0,
                swap REAL DEFAULT 0.0,
                magic_number INTEGER DEFAULT 108801,
                opened_at DATETIME NOT NULL,
                closed_at DATETIME NOT NULL,
                comment TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(mt5_account_id, deal_ticket)
            );
            CREATE TABLE IF NOT EXISTS account_snapshots (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                mt5_account_id INTEGER NOT NULL,
                balance REAL NOT NULL,
                equity REAL NOT NULL,
                margin REAL NOT NULL,
                free_margin REAL NOT NULL,
                floating_pl REAL DEFAULT 0.00,
                open_positions_count INTEGER DEFAULT 0,
                recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS heartbeats (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                mt5_account_id INTEGER NOT NULL,
                license_id INTEGER NOT NULL,
                ea_version TEXT NOT NULL,
                ping_ip TEXT,
                payload_json TEXT,
                recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS bot_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                mt5_account_id INTEGER,
                license_id INTEGER,
                log_level TEXT DEFAULT 'INFO',
                event_type TEXT NOT NULL,
                message TEXT NOT NULL,
                context_json TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS audit_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                action TEXT NOT NULL,
                entity_type TEXT NOT NULL,
                entity_id INTEGER,
                ip_address TEXT,
                details_json TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
        ");

        // Seed initial data if empty
        $roleCheck = $pdo->query("SELECT COUNT(*) FROM roles")->fetchColumn();
        if ($roleCheck == 0) {
            $pdo->exec("
                INSERT INTO roles (id, name, description) VALUES (1, 'ADMIN', 'Platform Admin'), (2, 'CUSTOMER', 'Trader');
                INSERT INTO users (id, role_id, email, password_hash, full_name, is_active) VALUES 
                (1, 1, 'admin@techforex.com', '$2y$12\$wM2pfctAukVQxLJthDDBi.zv48cS8QKuEyirNTeudo6/okclLXC7C', 'Platform Administrator', 1),
                (2, 2, 'customer@techforex.com', '$2y$12\$AV/iCR0/TjVsJxlElnP.kexgLIliqKpYl70kpBQgtkhxZ63R9Keoy', 'Shivam Gangele (Customer)', 1);
                INSERT INTO customers (id, user_id, phone, country, notes) VALUES (1, 2, '+91 9876543210', 'India', 'XAUUSD Gold Trader');
                INSERT INTO strategies (id, code, name, description, symbol, timeframe, is_active) VALUES 
                (1, 'TF_GOLD_100_BLOCK', 'Tech Forex Gold 100-Block Strategy', 'Deterministic 100-point cycle breakout & retest level strategy with candlestick confirmation for XAUUSD.', 'XAUUSD', 'M5', 1),
                (2, 'TF_PRICE_ACTION_BREAKOUT', 'Tech Forex Price Action Breakout', 'High-probability chart pattern breakout strategy.', 'XAUUSD', 'M5', 1);
                INSERT INTO strategy_parameters (strategy_id, param_key, param_value, param_type, description) VALUES
                (1, 'block_size', '100', 'number', 'Range of price block in points'),
                (1, 'time_filter_start_ist', '09:00', 'string', 'No-trade period start (IST)'),
                (1, 'time_filter_end_ist', '14:00', 'string', 'No-trade period end (IST)'),
                (1, 'max_level_attempts', '2', 'number', 'Skip 3rd attempt'),
                (1, 'candlestick_filter', 'true', 'boolean', 'Require Pin Bar or Engulfing confirmation'),
                (1, 'rr_target_ratio', '4.0', 'number', 'Target Risk:Reward ratio');
                INSERT INTO licenses (id, customer_id, strategy_id, license_key, status, bot_enabled, max_accounts, start_date, expires_at) VALUES
                (1, 1, 1, 'TF-GOLD-8829-9401-K9X2', 'ACTIVE', 1, 2, '2026-01-01', '2027-12-31');
                INSERT INTO risk_settings (id, customer_id, license_id, risk_percent, max_lot_size, min_lot_size, max_open_positions, max_daily_sl_hits, max_daily_loss_currency, max_drawdown_percent, max_spread_points, trading_session_start, trading_session_end, news_filter_enabled, emergency_stop_enabled) VALUES
                (1, 1, 1, 2.00, 1.00, 0.01, 2, 3, 300.00, 5.00, 35, '14:00:00', '23:30:00', 1, 0);
                INSERT INTO mt5_accounts (id, customer_id, license_id, account_number, broker, server, currency, balance, equity, margin, free_margin, leverage, ea_version, is_connected, last_heartbeat_at) VALUES
                (1, 1, 1, 50198234, 'MetaQuotes-Demo', 'MetaQuotes-Server', 'USD', 10000.00, 10245.50, 210.00, 10035.50, 100, '1.0.0', 1, datetime('now'));
                INSERT INTO bot_instances (id, mt5_account_id, license_id, mode, status, magic_number) VALUES
                (1, 1, 1, 'DEMO', 'RUNNING', 108801);
                INSERT INTO trades (id, mt5_account_id, deal_ticket, position_ticket, symbol, trade_type, volume, open_price, close_price, stop_loss, take_profit, profit, commission, swap, magic_number, opened_at, closed_at, comment) VALUES
                (1, 1, 9812401, 781201, 'XAUUSD', 'BUY', 0.50, 4084.00, 4096.00, 4082.00, 4096.00, 600.00, -2.50, 0.00, 108801, datetime('now', '-4 hours'), datetime('now', '-3 hours'), 'TF_GOLD_TP_HIT'),
                (2, 1, 9812402, 781202, 'XAUUSD', 'SELL', 0.50, 4094.00, 4084.00, 4098.00, 4084.00, 500.00, -2.50, 0.00, 108801, datetime('now', '-2 hours'), datetime('now', '-1 hours'), 'TF_GOLD_TP_HIT');
            ");
        }
    }
}
