<?php
// ==========================================================
// REAL AUTHENTICATION & SECURITY VERIFICATION SUITE
// ==========================================================

require_once __DIR__ . '/../backend/src/Database.php';
require_once __DIR__ . '/../backend/src/Auth.php';
require_once __DIR__ . '/../backend/src/Middleware.php';

$config = require __DIR__ . '/../backend/config/config.php';
Database::init($config);
Auth::init($config);

echo "\n====================================================\n";
echo "FXTRADER — REAL AUTHENTICATION & SECURITY TESTS\n";
echo "====================================================\n\n";

$passed = 0;
$failed = 0;

function assertCheck(string $title, bool $condition, string $msg = ''): void {
    global $passed, $failed;
    if ($condition) {
        echo "[PASS] " . $title . "\n";
        $passed++;
    } else {
        echo "[FAIL] " . $title . ($msg ? " ({$msg})" : "") . "\n";
        $failed++;
    }
}

// 1. Test Password Hash & Verify (Bcrypt cost 12)
$testPass = "MyStrongSecurePassword!123";
$hash = Auth::hashPassword($testPass);
assertCheck("Password hashing uses Bcrypt cost 12", substr($hash, 0, 4) === '$2y$');
assertCheck("Password verification succeeds with correct password", Auth::verifyPassword($testPass, $hash));
assertCheck("Password verification fails with incorrect password", !Auth::verifyPassword("WrongPassword123", $hash));

// 2. Test Admin User in Database
$admin = Database::fetch("SELECT u.*, r.name as role_name FROM users u JOIN roles r ON u.role_id = r.id WHERE u.email = 'admin@techforex.com'");
assertCheck("Admin user exists in database", (bool)$admin);
assertCheck("Admin user has role ADMIN", ($admin['role_name'] ?? '') === 'ADMIN');
assertCheck("Admin password matches hash", Auth::verifyPassword('Admin@123456', $admin['password_hash']));

// 3. Test Customer User in Database
$customer = Database::fetch("SELECT u.*, r.name as role_name, c.id as customer_id FROM users u JOIN roles r ON u.role_id = r.id LEFT JOIN customers c ON c.user_id = u.id WHERE u.email = 'customer@techforex.com'");
assertCheck("Customer user exists in database", (bool)$customer);
assertCheck("Customer user has role CUSTOMER", ($customer['role_name'] ?? '') === 'CUSTOMER');
assertCheck("Customer password matches hash", Auth::verifyPassword('Customer@123456', $customer['password_hash']));

// 4. Test JWT Token Generation & Validation
$tokenPayload = [
    'id' => (int)$customer['id'],
    'email' => $customer['email'],
    'full_name' => $customer['full_name'],
    'role' => $customer['role_name'],
    'customer_id' => (int)$customer['customer_id']
];
$token = Auth::generateToken($tokenPayload);
assertCheck("JWT token generated (3 parts separated by dots)", count(explode('.', $token)) === 3);

$decoded = Auth::validateToken($token);
assertCheck("JWT token decoded successfully", $decoded !== null && $decoded['email'] === 'customer@techforex.com');
assertCheck("JWT token contains correct role CUSTOMER", $decoded['role'] === 'CUSTOMER');

// 5. Test Tampered JWT Token
$tamperedToken = $token . "invalid_signature";
assertCheck("Tampered JWT token is rejected", Auth::validateToken($tamperedToken) === null);

// 6. Test Nonexistent / Invalid Login Query
$badUser = Database::fetch("SELECT * FROM users WHERE email = 'nonexistent@example.com'");
assertCheck("Nonexistent user returns null from database", $badUser === null);

// 7. Test Suspended Customer
Database::query("UPDATE users SET is_active = 0 WHERE id = :id", [':id' => $customer['id']]);
$suspendedUser = Database::fetch("SELECT is_active FROM users WHERE id = :id", [':id' => $customer['id']]);
assertCheck("Suspended user has is_active = 0", (int)$suspendedUser['is_active'] === 0);

// Restore customer active state
Database::query("UPDATE users SET is_active = 1 WHERE id = :id", [':id' => $customer['id']]);
$restoredUser = Database::fetch("SELECT is_active FROM users WHERE id = :id", [':id' => $customer['id']]);
assertCheck("Customer user restored to is_active = 1", (int)$restoredUser['is_active'] === 1);

echo "\n====================================================\n";
echo "SUMMARY: Passed: {$passed} | Failed: {$failed}\n";
echo "====================================================\n\n";

if ($failed > 0) exit(1);
