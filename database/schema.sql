-- ==========================================================
-- MT5 AUTOMATED TRADING BOT — RELATIONAL DATABASE SCHEMA
-- Compatible with MySQL 5.7+ / 8.0+ / MariaDB 10.3+
-- ==========================================================

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS `audit_logs`;
DROP TABLE IF EXISTS `bot_logs`;
DROP TABLE IF EXISTS `heartbeats`;
DROP TABLE IF EXISTS `account_snapshots`;
DROP TABLE IF EXISTS `risk_settings`;
DROP TABLE IF EXISTS `trades`;
DROP TABLE IF EXISTS `positions`;
DROP TABLE IF EXISTS `orders`;
DROP TABLE IF EXISTS `signals`;
DROP TABLE IF EXISTS `bot_instances`;
DROP TABLE IF EXISTS `mt5_accounts`;
DROP TABLE IF EXISTS `licenses`;
DROP TABLE IF EXISTS `strategy_parameters`;
DROP TABLE IF EXISTS `strategies`;
DROP TABLE IF EXISTS `customers`;
DROP TABLE IF EXISTS `users`;
DROP TABLE IF EXISTS `roles`;

SET FOREIGN_KEY_CHECKS = 1;

-- 1. Roles Table
CREATE TABLE `roles` (
    `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(50) NOT NULL UNIQUE,
    `description` VARCHAR(255) NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Users Table
CREATE TABLE `users` (
    `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `role_id` INT UNSIGNED NOT NULL,
    `email` VARCHAR(191) NOT NULL UNIQUE,
    `password_hash` VARCHAR(255) NOT NULL,
    `full_name` VARCHAR(120) NOT NULL,
    `is_active` TINYINT(1) DEFAULT 1,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `fk_users_role` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Customers Profile Table
CREATE TABLE `customers` (
    `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT UNSIGNED NOT NULL UNIQUE,
    `phone` VARCHAR(30) NULL,
    `country` VARCHAR(60) DEFAULT 'India',
    `notes` TEXT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_customers_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Strategies Catalog
CREATE TABLE `strategies` (
    `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `code` VARCHAR(50) NOT NULL UNIQUE,
    `name` VARCHAR(120) NOT NULL,
    `description` TEXT NULL,
    `symbol` VARCHAR(30) NOT NULL DEFAULT 'XAUUSD',
    `timeframe` VARCHAR(10) NOT NULL DEFAULT 'M5',
    `is_active` TINYINT(1) DEFAULT 1,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Strategy Parameters Table
CREATE TABLE `strategy_parameters` (
    `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `strategy_id` INT UNSIGNED NOT NULL,
    `param_key` VARCHAR(60) NOT NULL,
    `param_value` VARCHAR(255) NOT NULL,
    `param_type` ENUM('string', 'number', 'boolean', 'json') DEFAULT 'string',
    `description` VARCHAR(255) NULL,
    UNIQUE KEY `uk_strategy_param` (`strategy_id`, `param_key`),
    CONSTRAINT `fk_strategy_params_strategy` FOREIGN KEY (`strategy_id`) REFERENCES `strategies` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Commercial License System
CREATE TABLE `licenses` (
    `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `customer_id` INT UNSIGNED NOT NULL,
    `strategy_id` INT UNSIGNED NOT NULL,
    `license_key` VARCHAR(64) NOT NULL UNIQUE,
    `status` ENUM('ACTIVE', 'SUSPENDED', 'EXPIRED', 'REVOKED') DEFAULT 'ACTIVE',
    `bot_enabled` TINYINT(1) DEFAULT 0,
    `max_accounts` INT UNSIGNED DEFAULT 1,
    `start_date` DATE NOT NULL,
    `expires_at` DATE NOT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `fk_licenses_customer` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_licenses_strategy` FOREIGN KEY (`strategy_id`) REFERENCES `strategies` (`id`) ON DELETE RESTRICT,
    INDEX `idx_license_key_status` (`license_key`, `status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. MT5 Accounts Table
CREATE TABLE `mt5_accounts` (
    `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `customer_id` INT UNSIGNED NOT NULL,
    `license_id` INT UNSIGNED NOT NULL,
    `account_number` BIGINT NOT NULL,
    `broker` VARCHAR(100) NOT NULL DEFAULT 'MetaQuotes-Demo',
    `server` VARCHAR(100) NOT NULL DEFAULT 'MetaQuotes-Server',
    `currency` VARCHAR(10) NOT NULL DEFAULT 'USD',
    `balance` DECIMAL(15, 2) DEFAULT 0.00,
    `equity` DECIMAL(15, 2) DEFAULT 0.00,
    `margin` DECIMAL(15, 2) DEFAULT 0.00,
    `free_margin` DECIMAL(15, 2) DEFAULT 0.00,
    `leverage` INT DEFAULT 100,
    `ea_version` VARCHAR(20) DEFAULT '1.0.0',
    `is_connected` TINYINT(1) DEFAULT 0,
    `last_heartbeat_at` DATETIME NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY `uk_account_broker` (`account_number`, `broker`),
    CONSTRAINT `fk_mt5_customer` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_mt5_license` FOREIGN KEY (`license_id`) REFERENCES `licenses` (`id`) ON DELETE CASCADE,
    INDEX `idx_mt5_heartbeat` (`is_connected`, `last_heartbeat_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Bot Instances & Runtime State
CREATE TABLE `bot_instances` (
    `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `mt5_account_id` INT UNSIGNED NOT NULL UNIQUE,
    `license_id` INT UNSIGNED NOT NULL,
    `mode` ENUM('DEMO', 'LIVE') DEFAULT 'DEMO',
    `status` ENUM('RUNNING', 'STOPPED', 'ERROR', 'PAUSED') DEFAULT 'STOPPED',
    `magic_number` INT UNSIGNED DEFAULT 108801,
    `last_error` VARCHAR(255) NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `fk_bot_mt5` FOREIGN KEY (`mt5_account_id`) REFERENCES `mt5_accounts` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_bot_license` FOREIGN KEY (`license_id`) REFERENCES `licenses` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. Risk Settings Table
CREATE TABLE `risk_settings` (
    `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `customer_id` INT UNSIGNED NOT NULL,
    `license_id` INT UNSIGNED NOT NULL UNIQUE,
    `risk_percent` DECIMAL(5, 2) DEFAULT 2.00,
    `max_lot_size` DECIMAL(6, 2) DEFAULT 1.00,
    `min_lot_size` DECIMAL(6, 2) DEFAULT 0.01,
    `max_open_positions` INT UNSIGNED DEFAULT 2,
    `max_daily_sl_hits` INT UNSIGNED DEFAULT 3,
    `max_daily_loss_currency` DECIMAL(10, 2) DEFAULT 300.00,
    `max_drawdown_percent` DECIMAL(5, 2) DEFAULT 5.00,
    `max_spread_points` INT UNSIGNED DEFAULT 35,
    `trading_session_start` TIME DEFAULT '14:00:00',
    `trading_session_end` TIME DEFAULT '23:30:00',
    `news_filter_enabled` TINYINT(1) DEFAULT 1,
    `emergency_stop_enabled` TINYINT(1) DEFAULT 0,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `fk_risk_customer` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_risk_license` FOREIGN KEY (`license_id`) REFERENCES `licenses` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. Signals Table
CREATE TABLE `signals` (
    `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `strategy_id` INT UNSIGNED NOT NULL,
    `mt5_account_id` INT UNSIGNED NOT NULL,
    `signal_uid` VARCHAR(64) NOT NULL UNIQUE,
    `symbol` VARCHAR(20) NOT NULL,
    `direction` ENUM('BUY', 'SELL') NOT NULL,
    `order_type` VARCHAR(20) NOT NULL DEFAULT 'MARKET',
    `price` DECIMAL(15, 5) NOT NULL,
    `stop_loss` DECIMAL(15, 5) NOT NULL,
    `take_profit` DECIMAL(15, 5) NOT NULL,
    `reason` VARCHAR(255) NULL,
    `timeframe` VARCHAR(10) DEFAULT 'M5',
    `status` ENUM('GENERATED', 'EXECUTED', 'CANCELLED', 'REJECTED') DEFAULT 'GENERATED',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_signals_strategy` FOREIGN KEY (`strategy_id`) REFERENCES `strategies` (`id`) ON DELETE RESTRICT,
    CONSTRAINT `fk_signals_mt5` FOREIGN KEY (`mt5_account_id`) REFERENCES `mt5_accounts` (`id`) ON DELETE CASCADE,
    INDEX `idx_signals_uid` (`signal_uid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11. Orders Table
CREATE TABLE `orders` (
    `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `mt5_account_id` INT UNSIGNED NOT NULL,
    `signal_id` INT UNSIGNED NULL,
    `order_ticket` BIGINT NOT NULL,
    `symbol` VARCHAR(20) NOT NULL,
    `order_type` ENUM('BUY', 'SELL', 'BUY_LIMIT', 'SELL_LIMIT', 'BUY_STOP', 'SELL_STOP') NOT NULL,
    `lot_size` DECIMAL(8, 2) NOT NULL,
    `price` DECIMAL(15, 5) NOT NULL,
    `stop_loss` DECIMAL(15, 5) DEFAULT 0.00000,
    `take_profit` DECIMAL(15, 5) DEFAULT 0.00000,
    `magic_number` INT UNSIGNED DEFAULT 108801,
    `status` ENUM('PENDING', 'EXECUTED', 'REJECTED', 'CANCELLED') DEFAULT 'EXECUTED',
    `broker_comment` VARCHAR(120) NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `fk_orders_mt5` FOREIGN KEY (`mt5_account_id`) REFERENCES `mt5_accounts` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_orders_signal` FOREIGN KEY (`signal_id`) REFERENCES `signals` (`id`) ON DELETE SET NULL,
    INDEX `idx_orders_ticket` (`order_ticket`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 12. Open Positions Table
CREATE TABLE `positions` (
    `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `mt5_account_id` INT UNSIGNED NOT NULL,
    `position_ticket` BIGINT NOT NULL,
    `symbol` VARCHAR(20) NOT NULL,
    `position_type` ENUM('BUY', 'SELL') NOT NULL,
    `volume` DECIMAL(8, 2) NOT NULL,
    `open_price` DECIMAL(15, 5) NOT NULL,
    `current_price` DECIMAL(15, 5) NOT NULL,
    `stop_loss` DECIMAL(15, 5) DEFAULT 0.00000,
    `take_profit` DECIMAL(15, 5) DEFAULT 0.00000,
    `profit` DECIMAL(12, 2) DEFAULT 0.00,
    `swap` DECIMAL(10, 2) DEFAULT 0.00,
    `comment` VARCHAR(100) NULL,
    `magic_number` INT UNSIGNED DEFAULT 108801,
    `opened_at` DATETIME NOT NULL,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY `uk_account_position` (`mt5_account_id`, `position_ticket`),
    CONSTRAINT `fk_positions_mt5` FOREIGN KEY (`mt5_account_id`) REFERENCES `mt5_accounts` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 13. Historical Closed Trades
CREATE TABLE `trades` (
    `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `mt5_account_id` INT UNSIGNED NOT NULL,
    `deal_ticket` BIGINT NOT NULL,
    `position_ticket` BIGINT NOT NULL,
    `symbol` VARCHAR(20) NOT NULL,
    `trade_type` ENUM('BUY', 'SELL') NOT NULL,
    `volume` DECIMAL(8, 2) NOT NULL,
    `open_price` DECIMAL(15, 5) NOT NULL,
    `close_price` DECIMAL(15, 5) NOT NULL,
    `stop_loss` DECIMAL(15, 5) DEFAULT 0.00000,
    `take_profit` DECIMAL(15, 5) DEFAULT 0.00000,
    `profit` DECIMAL(12, 2) NOT NULL,
    `commission` DECIMAL(10, 2) DEFAULT 0.00,
    `swap` DECIMAL(10, 2) DEFAULT 0.00,
    `magic_number` INT UNSIGNED DEFAULT 108801,
    `opened_at` DATETIME NOT NULL,
    `closed_at` DATETIME NOT NULL,
    `comment` VARCHAR(100) NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY `uk_account_deal` (`mt5_account_id`, `deal_ticket`),
    CONSTRAINT `fk_trades_mt5` FOREIGN KEY (`mt5_account_id`) REFERENCES `mt5_accounts` (`id`) ON DELETE CASCADE,
    INDEX `idx_trades_closed_at` (`closed_at`),
    INDEX `idx_trades_profit` (`profit`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 14. Periodic Account Snapshots
CREATE TABLE `account_snapshots` (
    `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `mt5_account_id` INT UNSIGNED NOT NULL,
    `balance` DECIMAL(15, 2) NOT NULL,
    `equity` DECIMAL(15, 2) NOT NULL,
    `margin` DECIMAL(15, 2) NOT NULL,
    `free_margin` DECIMAL(15, 2) NOT NULL,
    `floating_pl` DECIMAL(12, 2) DEFAULT 0.00,
    `open_positions_count` INT UNSIGNED DEFAULT 0,
    `recorded_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_snapshots_mt5` FOREIGN KEY (`mt5_account_id`) REFERENCES `mt5_accounts` (`id`) ON DELETE CASCADE,
    INDEX `idx_snapshots_time` (`mt5_account_id`, `recorded_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 15. Heartbeats Table
CREATE TABLE `heartbeats` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `mt5_account_id` INT UNSIGNED NOT NULL,
    `license_id` INT UNSIGNED NOT NULL,
    `ea_version` VARCHAR(20) NOT NULL,
    `ping_ip` VARCHAR(45) NULL,
    `payload_json` TEXT NULL,
    `recorded_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_heartbeats_mt5` FOREIGN KEY (`mt5_account_id`) REFERENCES `mt5_accounts` (`id`) ON DELETE CASCADE,
    INDEX `idx_hb_recorded` (`mt5_account_id`, `recorded_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 16. Bot Event & Execution Logs
CREATE TABLE `bot_logs` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `mt5_account_id` INT UNSIGNED NULL,
    `license_id` INT UNSIGNED NULL,
    `log_level` ENUM('INFO', 'WARN', 'ERROR', 'CRITICAL') DEFAULT 'INFO',
    `event_type` VARCHAR(50) NOT NULL,
    `message` TEXT NOT NULL,
    `context_json` JSON NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_bot_logs_level` (`log_level`),
    INDEX `idx_bot_logs_event` (`event_type`),
    INDEX `idx_bot_logs_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 17. Security & Admin Audit Logs
CREATE TABLE `audit_logs` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT UNSIGNED NULL,
    `action` VARCHAR(80) NOT NULL,
    `entity_type` VARCHAR(50) NOT NULL,
    `entity_id` INT UNSIGNED NULL,
    `ip_address` VARCHAR(45) NULL,
    `details_json` JSON NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_audit_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
    INDEX `idx_audit_action` (`action`),
    INDEX `idx_audit_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
