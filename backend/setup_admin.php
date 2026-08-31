<?php
// ==========================================================
// FXTRADER — LOCAL DATABASE & ADMIN SETUP SCRIPT
// CLI Command: php backend/setup_admin.php [admin_email] [admin_password]
// ==========================================================

require_once __DIR__ . '/src/Database.php';
require_once __DIR__ . '/src/Auth.php';

$config = require __DIR__ . '/config/config.php';

echo "\n====================================================\n";
echo "FXTRADER — DATABASE & ADMIN INITIALIZATION\n";
echo "====================================================\n\n";

try {
    Database::init($config);
    Auth::init($config);
    echo "[OK] Database driver initialized: " . $config['db']['driver'] . "\n";
} catch (Exception $e) {
    echo "[ERROR] Database connection failed: " . $e->getMessage() . "\n";
    exit(1);
}

// 1. Check or create Roles
try {
    Database::query("INSERT INTO roles (id, name, description) VALUES (1, 'ADMIN', 'Full platform administrator') ON DUPLICATE KEY UPDATE name=name");
    Database::query("INSERT INTO roles (id, name, description) VALUES (2, 'CUSTOMER', 'Trader customer account') ON DUPLICATE KEY UPDATE name=name");
    echo "[OK] Roles verified (ADMIN, CUSTOMER)\n";
} catch (Exception $e) {
    // For SQLite
    try {
        Database::query("INSERT OR IGNORE INTO roles (id, name, description) VALUES (1, 'ADMIN', 'Full platform administrator')");
        Database::query("INSERT OR IGNORE INTO roles (id, name, description) VALUES (2, 'CUSTOMER', 'Trader customer account')");
        echo "[OK] Roles verified (SQLite)\n";
    } catch (Exception $e2) {
        echo "[WARN] Roles table initialization: " . $e2->getMessage() . "\n";
    }
}

// 2. Extract or prompt Admin Credentials
$adminEmail = $argv[1] ?? 'admin@techforex.com';
$adminPass  = $argv[2] ?? 'Admin@123456';
$adminName  = 'Platform Administrator';

$passHash = Auth::hashPassword($adminPass);

// Check if user exists
$existing = Database::fetch("SELECT id FROM users WHERE email = :e", [':e' => $adminEmail]);

if ($existing) {
    Database::query(
        "UPDATE users SET password_hash = :p, is_active = 1, full_name = :n, role_id = 1 WHERE id = :id",
        [':p' => $passHash, ':n' => $adminName, ':id' => $existing['id']]
    );
    echo "[OK] Updated existing Admin user (ID: {$existing['id']})\n";
} else {
    $newId = Database::insert(
        "INSERT INTO users (role_id, email, password_hash, full_name, is_active) VALUES (1, :e, :p, :n, 1)",
        [':e' => $adminEmail, ':p' => $passHash, ':n' => $adminName]
    );
    echo "[OK] Created new Admin user (ID: {$newId})\n";
}

// 3. Create or update default demo customer
$custEmail = 'customer@techforex.com';
$custPass  = 'Customer@123456';
$custHash  = Auth::hashPassword($custPass);

$existingCust = Database::fetch("SELECT id FROM users WHERE email = :e", [':e' => $custEmail]);
if ($existingCust) {
    Database::query(
        "UPDATE users SET password_hash = :p, is_active = 1 WHERE id = :id",
        [':p' => $custHash, ':id' => $existingCust['id']]
    );
    echo "[OK] Demo Customer credentials updated\n";
} else {
    $custUserId = Database::insert(
        "INSERT INTO users (role_id, email, password_hash, full_name, is_active) VALUES (2, :e, :p, 'Shivam Gangele (Customer)', 1)",
        [':e' => $custEmail, ':p' => $custHash]
    );
    $customerId = Database::insert(
        "INSERT INTO customers (user_id, phone, country, notes) VALUES (:u, '+91 9876543210', 'India', 'Primary Demo Customer')",
        [':u' => $custUserId]
    );
    echo "[OK] Created Demo Customer (User ID: {$custUserId})\n";
}

echo "\n----------------------------------------------------\n";
echo "AUTHENTICATION SETUP COMPLETE\n";
echo "----------------------------------------------------\n";
echo "Admin Login:\n";
echo "  Email:    {$adminEmail}\n";
echo "  Password: {$adminPass}\n";
echo "  Role:     ADMIN\n\n";
echo "Customer Login:\n";
echo "  Email:    customer@techforex.com\n";
echo "  Password: Customer@123456\n";
echo "  Role:     CUSTOMER\n";
echo "----------------------------------------------------\n\n";
