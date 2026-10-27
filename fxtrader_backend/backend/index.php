<?php
// ==========================================================
// MT5 AUTOMATED TRADING PLATFORM — REST API ROUTER
// ==========================================================

error_reporting(E_ALL & ~E_DEPRECATED);
ini_set('display_errors', '0');

require_once __DIR__ . '/src/Database.php';
require_once __DIR__ . '/src/Auth.php';
require_once __DIR__ . '/src/Middleware.php';
require_once __DIR__ . '/src/Controllers/AuthController.php';
require_once __DIR__ . '/src/Controllers/CustomerController.php';
require_once __DIR__ . '/src/Controllers/AdminController.php';
require_once __DIR__ . '/src/Controllers/Mt5Controller.php';
require_once __DIR__ . '/src/Controllers/BotController.php';
require_once __DIR__ . '/src/Controllers/StrategyController.php';
require_once __DIR__ . '/src/Controllers/TradeController.php';
require_once __DIR__ . '/src/Controllers/LicenseController.php';

$config = require __DIR__ . '/config/config.php';

// Initialize services
Database::init($config);
Auth::init($config);
Middleware::handleCors($config);

// Extract clean request path
$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

// Strip script directory or /api prefix if present
$basePath = dirname($_SERVER['SCRIPT_NAME']);
if ($basePath !== '/' && strpos($uri, $basePath) === 0) {
    $uri = substr($uri, strlen($basePath));
}
$uri = '/' . ltrim($uri, '/');
if (strpos($uri, '/backend/') === 0) {
    $uri = substr($uri, 8);
}
if (strpos($uri, '/api/') === 0) {
    $uri = substr($uri, 4);
}
$uri = '/' . ltrim($uri, '/');

$method = $_SERVER['REQUEST_METHOD'];

try {
    // ----------------- HEALTH & SYSTEM -----------------
    if ($uri === '/' || $uri === '/health') {
        Middleware::jsonSuccess([
            'status' => 'OK',
            'app' => $config['app']['name'],
            'environment' => $config['app']['env'],
            'time' => date('Y-m-d H:i:s')
        ], 'API Gateway Healthy');
    }

    // ----------------- AUTHENTICATION -----------------
    if (($uri === '/auth/login' || $uri === '/login') && $method === 'POST') {
        AuthController::login();
    }
    if (($uri === '/auth/me' || $uri === '/me') && $method === 'GET') {
        AuthController::me();
    }
    if (($uri === '/auth/logout' || $uri === '/logout') && $method === 'POST') {
        AuthController::logout();
    }
    if (($uri === '/auth/password' || $uri === '/password') && $method === 'POST') {
        AuthController::updatePassword();
    }

    // ----------------- CUSTOMER ROUTES -----------------
    if ($uri === '/customer/dashboard' && $method === 'GET') {
        CustomerController::dashboard();
    }
    if ($uri === '/customer/positions' && $method === 'GET') {
        CustomerController::positions();
    }
    if ($uri === '/customer/history' && $method === 'GET') {
        CustomerController::tradeHistory();
    }
    if ($uri === '/customer/risk' && ($method === 'GET' || $method === 'POST' || $method === 'PUT')) {
        CustomerController::riskSettings();
    }
    if ($uri === '/customer/logs' && $method === 'GET') {
        CustomerController::botLogs();
    }

    // ----------------- ADMIN ROUTES -----------------
    if ($uri === '/admin/dashboard' && $method === 'GET') {
        AdminController::dashboard();
    }
    if ($uri === '/admin/customers' && ($method === 'GET' || $method === 'POST')) {
        AdminController::customers();
    }
    if ($uri === '/admin/customer-status' && $method === 'POST') {
        AdminController::updateCustomerStatus();
    }
    if ($uri === '/admin/customer-archive' && $method === 'POST') {
        AdminController::archiveCustomer();
    }
    if ($uri === '/admin/customer-restore' && $method === 'POST') {
        AdminController::restoreCustomer();
    }
    if ($uri === '/admin/customer-strategy' && $method === 'POST') {
        AdminController::assignStrategy();
    }
    if ($uri === '/admin/customer-password' && $method === 'POST') {
        AdminController::resetCustomerPassword();
    }
    if ($uri === '/admin/licenses' && ($method === 'GET' || $method === 'POST')) {
        AdminController::licenses();
    }
    if ($uri === '/admin/bots' && $method === 'GET') {
        AdminController::botMonitoring();
    }
    if ($uri === '/admin/trades' && $method === 'GET') {
        AdminController::allTrades();
    }
    if ($uri === '/admin/logs' && $method === 'GET') {
        AdminController::logs();
    }

    // ----------------- MT5 EA CONNECTOR -----------------
    if ($uri === '/mt5/register' && $method === 'POST') {
        Mt5Controller::register();
    }
    if ($uri === '/mt5/heartbeat' && $method === 'POST') {
        Mt5Controller::heartbeat();
    }
    if ($uri === '/mt5/account-sync' && $method === 'POST') {
        Mt5Controller::accountSync();
    }
    if ($uri === '/mt5/positions-sync' && $method === 'POST') {
        Mt5Controller::positionsSync();
    }
    if ($uri === '/mt5/trade-sync' && $method === 'POST') {
        Mt5Controller::tradeSync();
    }
    if ($uri === '/mt5/signal-log' && $method === 'POST') {
        Mt5Controller::signalLog();
    }

    // ----------------- BOT CONTROL -----------------
    if ($uri === '/bot/status' && $method === 'GET') {
        BotController::status();
    }
    if ($uri === '/bot/start' && $method === 'POST') {
        BotController::start();
    }
    if ($uri === '/bot/stop' && $method === 'POST') {
        BotController::stop();
    }
    if ($uri === '/bot/mode' && $method === 'POST') {
        BotController::setMode();
    }

    // ----------------- STRATEGIES & RULES -----------------
    if ($uri === '/strategy' && $method === 'GET') {
        StrategyController::index();
    }
    if ($uri === '/strategy/details' && $method === 'GET') {
        StrategyController::details();
    }
    if ($uri === '/strategy/create' && $method === 'POST') {
        StrategyController::create();
    }
    if ($uri === '/strategy/update' && $method === 'POST') {
        StrategyController::update();
    }
    if ($uri === '/strategy/duplicate' && $method === 'POST') {
        StrategyController::duplicate();
    }
    if ($uri === '/strategy/status' && $method === 'POST') {
        StrategyController::toggleStatus();
    }
    if ($uri === '/strategy/parameter' && $method === 'POST') {
        StrategyController::updateParameter();
    }

    // ----------------- LICENSES & TRADES -----------------
    if ($uri === '/license/validate' && ($method === 'GET' || $method === 'POST')) {
        LicenseController::validate();
    }
    if ($uri === '/trades' && $method === 'GET') {
        TradeController::index();
    }

    // Route not found
    Middleware::jsonError("Endpoint '$uri' not found with method '$method'.", 404);

} catch (Exception $e) {
    if ($config['app']['debug']) {
        Middleware::jsonError($e->getMessage(), 500, ['trace' => $e->getTraceAsString()]);
    } else {
        Middleware::jsonError('Internal server error.', 500);
    }
}
