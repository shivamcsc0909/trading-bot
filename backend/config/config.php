<?php
// ==========================================================
// MT5 TRADING BOT — CONFIGURATION
// ==========================================================

// Load .env if exists
$envFile = __DIR__ . '/../.env';
if (file_exists($envFile)) {
    $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos(trim($line), '#') === 0) continue;
        list($name, $value) = explode('=', $line, 2) + [NULL, NULL];
        if ($name !== NULL && $value !== NULL) {
            $_ENV[trim($name)] = trim($value);
            putenv(trim($name) . '=' . trim($value));
        }
    }
}

return [
    'app' => [
        'name' => getenv('APP_NAME') ?: 'FXTRADER MT5 Platform',
        'env'  => getenv('APP_ENV') ?: 'development', // 'development' or 'production'
        'url'  => getenv('APP_URL') ?: 'http://localhost:8000',
        'debug'=> getenv('APP_DEBUG') === 'true' || getenv('APP_ENV') !== 'production',
    ],
    'db' => [
        'driver'   => getenv('DB_DRIVER') ?: 'mysql', // 'mysql' or 'sqlite'
        'host'     => getenv('DB_HOST') ?: '127.0.0.1',
        'port'     => getenv('DB_PORT') ?: '3306',
        'database' => getenv('DB_NAME') ?: 'trading_bot',
        'username' => getenv('DB_USER') ?: 'root',
        'password' => getenv('DB_PASSWORD') ?: '',
        'charset'  => 'utf8mb4',
        'sqlite_path' => __DIR__ . '/../../database/dev_database.sqlite'
    ],
    'jwt' => [
        'secret'     => getenv('JWT_SECRET') ?: 'tf_secret_key_change_in_production_8891238912093847091283',
        'expiry_sec' => (int)(getenv('JWT_EXPIRY') ?: 86400 * 7), // 7 days
    ],
    'cors' => [
        'allowed_origins' => explode(',', getenv('CORS_ALLOWED_ORIGINS') ?: 'http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173,http://127.0.0.1:3000,*'),
    ],
    'ea' => [
        'secret' => getenv('EA_API_SECRET') ?: 'EA_COMMUNICATION_SECRET_KEY_99214'
    ]
];
