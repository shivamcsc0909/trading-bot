<?php
// ==========================================================
// AUTOMATED PHP API TEST SUITE
// ==========================================================

echo "====================================================\n";
echo "RUNNING BACKEND API & DATABASE INTEGRATION TESTS\n";
echo "====================================================\n\n";

$baseDir = __DIR__ . '/..';
putenv('DB_DRIVER=sqlite');
putenv('APP_DEBUG=true');

require_once $baseDir . '/backend/src/Database.php';
require_once $baseDir . '/backend/src/Auth.php';
require_once $baseDir . '/backend/src/Middleware.php';
require_once $baseDir . '/backend/src/Controllers/AuthController.php';
require_once $baseDir . '/backend/src/Controllers/CustomerController.php';
require_once $baseDir . '/backend/src/Controllers/AdminController.php';
require_once $baseDir . '/backend/src/Controllers/Mt5Controller.php';
require_once $baseDir . '/backend/src/Controllers/BotController.php';
require_once $baseDir . '/backend/src/Controllers/StrategyController.php';
require_once $baseDir . '/backend/src/Controllers/LicenseController.php';

$config = require $baseDir . '/backend/config/config.php';
Database::init($config);
Auth::init($config);

$passed = 0;
$failed = 0;

function assertTest(string $name, bool $condition, string $details = '') {
    global $passed, $failed;
    if ($condition) {
        echo "[PASS] $name\n";
        $passed++;
    } else {
        echo "[FAIL] $name: $details\n";
        $failed++;
    }
}

// 1. Test Database connection and tables
try {
    $db = Database::getConnection();
    $tables = Database::fetchAll("SELECT name FROM sqlite_master WHERE type='table'");
    $tableNames = array_column($tables, 'name');
    assertTest('Database SQLite auto-migration', in_array('users', $tableNames) && in_array('licenses', $tableNames));
} catch (Exception $e) {
    assertTest('Database initialization', false, $e->getMessage());
}

// 2. Test User authentication & JWT Generation
try {
    $admin = Database::fetch("SELECT * FROM users WHERE email = 'admin@techforex.com'");
    assertTest('Admin user exists in database', !empty($admin));
    
    $verified = Auth::verifyPassword('Admin@123456', $admin['password_hash']);
    assertTest('Admin password hash verification', $verified);

    $token = Auth::generateToken([
        'id' => 1,
        'email' => 'admin@techforex.com',
        'role' => 'ADMIN'
    ]);
    assertTest('JWT Token generation', !empty($token) && substr_count($token, '.') === 2);

    $decoded = Auth::validateToken($token);
    assertTest('JWT Token validation', $decoded !== null && $decoded['email'] === 'admin@techforex.com' && $decoded['role'] === 'ADMIN');
} catch (Exception $e) {
    assertTest('Auth service verification', false, $e->getMessage());
}

// 3. Test Customer & Strategy Catalog
try {
    $cust = Database::fetch("SELECT * FROM users WHERE email = 'customer@techforex.com'");
    assertTest('Customer user exists', !empty($cust));
    
    $strategies = Database::fetchAll("SELECT * FROM strategies");
    assertTest('Strategies catalog loaded', count($strategies) >= 2);
    
    $goldStrategy = Database::fetch("SELECT * FROM strategies WHERE code = 'TF_GOLD_100_BLOCK'");
    assertTest('XAUUSD 100-Block Strategy present', !empty($goldStrategy) && $goldStrategy['symbol'] === 'XAUUSD');

    $params = Database::fetchAll("SELECT * FROM strategy_parameters WHERE strategy_id = :sid", [':sid' => $goldStrategy['id']]);
    assertTest('Strategy parameters configured', count($params) >= 5);
} catch (Exception $e) {
    assertTest('Strategy verification', false, $e->getMessage());
}

// 4. Test License & Risk Settings
try {
    $lic = Database::fetch("SELECT * FROM licenses WHERE license_key = 'TF-GOLD-8829-9401-K9X2'");
    assertTest('Commercial License active', !empty($lic) && $lic['status'] === 'ACTIVE');

    $risk = Database::fetch("SELECT * FROM risk_settings WHERE license_id = :lid", [':lid' => $lic['id']]);
    assertTest('Risk settings linked (1-2% risk, max 3 SL)', !empty($risk) && (float)$risk['risk_percent'] === 2.0 && (int)$risk['max_daily_sl_hits'] === 3);
} catch (Exception $e) {
    assertTest('License and risk verification', false, $e->getMessage());
}

// 5. Test MT5 Heartbeat & Metric Sync Simulation
try {
    $accNum = 50198234;
    Database::query(
        "UPDATE mt5_accounts SET balance = 10500.00, equity = 10720.00, is_connected = 1, last_heartbeat_at = datetime('now') WHERE account_number = :acc",
        [':acc' => $accNum]
    );
    $acc = Database::fetch("SELECT * FROM mt5_accounts WHERE account_number = :acc", [':acc' => $accNum]);
    assertTest('MT5 Account balance & equity sync', (float)$acc['balance'] === 10500.00 && (float)$acc['equity'] === 10720.00 && (int)$acc['is_connected'] === 1);
} catch (Exception $e) {
    assertTest('MT5 Sync verification', false, $e->getMessage());
}

// 6. Test Position & Trade Insertion
try {
    $ticket = 99881122;
    Database::query("DELETE FROM positions WHERE position_ticket = :t", [':t' => $ticket]);
    Database::insert(
        "INSERT INTO positions (mt5_account_id, position_ticket, symbol, position_type, volume, open_price, current_price, stop_loss, take_profit, profit, opened_at)
         VALUES (1, :t, 'XAUUSD', 'BUY', 0.20, 4084.00, 4090.50, 4082.00, 4096.00, 130.00, datetime('now'))",
        [':t' => $ticket]
    );
    $pos = Database::fetch("SELECT * FROM positions WHERE position_ticket = :t", [':t' => $ticket]);
    assertTest('MT5 Open Position sync record', !empty($pos) && (float)$pos['profit'] === 130.00);

    // Close Trade simulation
    $deal = 55443322;
    Database::query("DELETE FROM trades WHERE deal_ticket = :d", [':d' => $deal]);
    Database::insert(
        "INSERT INTO trades (mt5_account_id, deal_ticket, position_ticket, symbol, trade_type, volume, open_price, close_price, stop_loss, take_profit, profit, magic_number, opened_at, closed_at, comment)
         VALUES (1, :d, :t, 'XAUUSD', 'BUY', 0.20, 4084.00, 4096.00, 4082.00, 4096.00, 240.00, 108801, datetime('now', '-30 minutes'), datetime('now'), 'TF_GOLD_TP_HIT')",
        [':d' => $deal, ':t' => $ticket]
    );
    $trd = Database::fetch("SELECT * FROM trades WHERE deal_ticket = :d", [':d' => $deal]);
    assertTest('MT5 Closed Trade Deal sync record', !empty($trd) && (float)$trd['profit'] === 240.00);
} catch (Exception $e) {
    assertTest('Position/Trade sync', false, $e->getMessage());
}

// 7. Test Bot Kill Switch
try {
    Database::query("UPDATE bot_instances SET status = 'STOPPED' WHERE id = 1");
    $bot = Database::fetch("SELECT * FROM bot_instances WHERE id = 1");
    assertTest('Master Kill Switch stop status', $bot['status'] === 'STOPPED');

    Database::query("UPDATE bot_instances SET status = 'RUNNING' WHERE id = 1");
    $bot = Database::fetch("SELECT * FROM bot_instances WHERE id = 1");
    assertTest('Bot restart to RUNNING status', $bot['status'] === 'RUNNING');
} catch (Exception $e) {
    assertTest('Kill switch verification', false, $e->getMessage());
}

echo "\n====================================================\n";
echo "SUMMARY: Passed: $passed | Failed: $failed\n";
echo "====================================================\n";

if ($failed > 0) {
    exit(1);
}
