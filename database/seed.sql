-- ==========================================================
-- MT5 AUTOMATED TRADING BOT — SEED DATA
-- ==========================================================

-- 1. Roles
INSERT INTO `roles` (`id`, `name`, `description`) VALUES
(1, 'ADMIN', 'Full system and platform administrator'),
(2, 'CUSTOMER', 'Trader / Customer with access to personal bot and dashboard')
ON DUPLICATE KEY UPDATE `description` = VALUES(`description`);

-- 2. Users (Admin & Demo Customer)
-- Admin: admin@techforex.com / Admin@123456
-- Customer: customer@techforex.com / Customer@123456
INSERT INTO `users` (`id`, `role_id`, `email`, `password_hash`, `full_name`, `is_active`) VALUES
(1, 1, 'admin@techforex.com', '$2y$12$wM2pfctAukVQxLJthDDBi.zv48cS8QKuEyirNTeudo6/okclLXC7C', 'Platform Administrator', 1),
(2, 2, 'customer@techforex.com', '$2y$12$AV/iCR0/TjVsJxlElnP.kexgLIliqKpYl70kpBQgtkhxZ63R9Keoy', 'Shivam Gangele (Customer)', 1)
ON DUPLICATE KEY UPDATE `full_name` = VALUES(`full_name`);

-- 3. Customer Profile
INSERT INTO `customers` (`id`, `user_id`, `phone`, `country`, `notes`) VALUES
(1, 2, '+91 9876543210', 'India', 'Primary beta customer running XAUUSD Gold 100-Block strategy')
ON DUPLICATE KEY UPDATE `phone` = VALUES(`phone`);

-- 4. Strategies (Directly from PDFs)
INSERT INTO `strategies` (`id`, `code`, `name`, `description`, `symbol`, `timeframe`, `is_active`) VALUES
(1, 'TF_GOLD_100_BLOCK', 'Tech Forex Gold 100-Block Strategy', 'Deterministic 100-point cycle breakout & retest level strategy with candlestick confirmation, attempt filtering, and session news rules for XAUUSD (M5). Sourced from Tech Forex Gold Strategy PDF.', 'XAUUSD', 'M5', 1),
(2, 'TF_PRICE_ACTION_BREAKOUT', 'Tech Forex Price Action & Pattern Breakout', 'High probability chart pattern breakout (Triangles, Wedges, Rectangles, Double Top/Bottom) with Pin Bar and Engulfing confirmation. Sourced from Price Action Patterns 2.0 & Candlestick E-Book.', 'XAUUSD', 'M5', 1)
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

-- 5. Strategy Parameters for Strategy 1 (Tech Forex Gold 100-Block)
INSERT INTO `strategy_parameters` (`strategy_id`, `param_key`, `param_value`, `param_type`, `description`) VALUES
(1, 'block_size', '100', 'number', 'Range of price block in points/pips (e.g. 4000-4100)'),
(1, 'timeframe', 'M5', 'string', 'Candle timeframe (M5 as per PDF)'),
(1, 'time_filter_start_ist', '09:00', 'string', 'No-trade period start (IST)'),
(1, 'time_filter_end_ist', '14:00', 'string', 'No-trade period end (IST)'),
(1, 'max_level_attempts', '2', 'number', 'Skip trade on 3rd attempt at same level (Breakout risk)'),
(1, 'candlestick_filter', 'true', 'boolean', 'Require Pin Bar, Hammer, or Engulfing confirmation at level'),
(1, 'news_filter_minutes_before', '30', 'number', 'Buffer minutes before major NFP/CPI/FOMC/Unemployment release'),
(1, 'news_filter_minutes_after', '30', 'number', 'Buffer minutes after major news release'),
(1, 'rr_target_ratio', '4.0', 'number', 'Target Risk:Reward ratio (1:4 as defined in PDF lot guide)'),
(1, 'sl_points_default', '300', 'number', 'Default Stop Loss in points (30 pips for Gold = 300 points)'),
-- Strategy 2 Parameters
(2, 'pattern_type', 'TRIANGLE_AND_RECTANGLE', 'string', 'Supported chart patterns for breakout'),
(2, 'pinbar_wick_ratio', '2.0', 'number', 'Minimum wick-to-body ratio for Pin Bar confirmation'),
(2, 'engulfing_body_ratio', '1.2', 'number', 'Engulfing candle size multiplier over prior candle')
ON DUPLICATE KEY UPDATE `param_value` = VALUES(`param_value`);

-- 6. Initial License for Customer 1
INSERT INTO `licenses` (`id`, `customer_id`, `strategy_id`, `license_key`, `status`, `bot_enabled`, `max_accounts`, `start_date`, `expires_at`) VALUES
(1, 1, 1, 'TF-GOLD-8829-9401-K9X2', 'ACTIVE', 1, 2, '2026-01-01', '2027-12-31')
ON DUPLICATE KEY UPDATE `status` = VALUES(`status`);

-- 7. Risk Settings for License 1
INSERT INTO `risk_settings` (`id`, `customer_id`, `license_id`, `risk_percent`, `max_lot_size`, `min_lot_size`, `max_open_positions`, `max_daily_sl_hits`, `max_daily_loss_currency`, `max_drawdown_percent`, `max_spread_points`, `trading_session_start`, `trading_session_end`, `news_filter_enabled`, `emergency_stop_enabled`) VALUES
(1, 1, 1, 2.00, 1.00, 0.01, 2, 3, 300.00, 5.00, 35, '14:00:00', '23:30:00', 1, 0)
ON DUPLICATE KEY UPDATE `risk_percent` = VALUES(`risk_percent`);

-- 8. Demo MT5 Account
INSERT INTO `mt5_accounts` (`id`, `customer_id`, `license_id`, `account_number`, `broker`, `server`, `currency`, `balance`, `equity`, `margin`, `free_margin`, `leverage`, `ea_version`, `is_connected`, `last_heartbeat_at`) VALUES
(1, 1, 1, 50198234, 'MetaQuotes-Demo', 'MetaQuotes-Server', 'USD', 10000.00, 10245.50, 210.00, 10035.50, 100, '1.0.0', 1, NOW())
ON DUPLICATE KEY UPDATE `balance` = VALUES(`balance`);

-- 9. Bot Instance State
INSERT INTO `bot_instances` (`id`, `mt5_account_id`, `license_id`, `mode`, `status`, `magic_number`, `last_error`) VALUES
(1, 1, 1, 'DEMO', 'RUNNING', 108801, NULL)
ON DUPLICATE KEY UPDATE `status` = VALUES(`status`);

-- 10. Sample Recent Signals & Trades for initial verification
INSERT INTO `signals` (`id`, `strategy_id`, `mt5_account_id`, `signal_uid`, `symbol`, `direction`, `order_type`, `price`, `stop_loss`, `take_profit`, `reason`, `timeframe`, `status`, `created_at`) VALUES
(1, 1, 1, 'SIG_20260830_XAUUSD_001', 'XAUUSD', 'BUY', 'MARKET', 4084.00, 4082.00, 4096.00, 'Level 84 Scalp Support + Bullish Pin Bar confirmation', 'M5', 'EXECUTED', NOW() - INTERVAL 4 HOUR),
(2, 1, 1, 'SIG_20260830_XAUUSD_002', 'XAUUSD', 'SELL', 'MARKET', 4094.00, 4098.00, 4084.00, 'Level 92-96 Resistance Rejection + Bearish Engulfing', 'M5', 'EXECUTED', NOW() - INTERVAL 2 HOUR)
ON DUPLICATE KEY UPDATE `reason` = VALUES(`reason`);

INSERT INTO `trades` (`id`, `mt5_account_id`, `deal_ticket`, `position_ticket`, `symbol`, `trade_type`, `volume`, `open_price`, `close_price`, `stop_loss`, `take_profit`, `profit`, `commission`, `swap`, `magic_number`, `opened_at`, `closed_at`, `comment`) VALUES
(1, 1, 9812401, 781201, 'XAUUSD', 'BUY', 0.50, 4084.00, 4096.00, 4082.00, 4096.00, 600.00, -2.50, 0.00, 108801, NOW() - INTERVAL 4 HOUR, NOW() - INTERVAL 3 HOUR, 'TF_GOLD_TP_HIT'),
(2, 1, 9812402, 781202, 'XAUUSD', 'SELL', 0.50, 4094.00, 4084.00, 4098.00, 4084.00, 500.00, -2.50, 0.00, 108801, NOW() - INTERVAL 2 HOUR, NOW() - INTERVAL 1 HOUR, 'TF_GOLD_TP_HIT')
ON DUPLICATE KEY UPDATE `profit` = VALUES(`profit`);

-- 11. Initial Audit Log
INSERT INTO `audit_logs` (`user_id`, `action`, `entity_type`, `entity_id`, `ip_address`, `details_json`) VALUES
(1, 'SYSTEM_INITIALIZED', 'SYSTEM', 1, '127.0.0.1', '{"version":"1.0.0","environment":"development"}');
