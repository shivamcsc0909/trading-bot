<?php

class LicenseController {
    public static function validate(): void {
        $body = Middleware::getJsonBody();
        $licenseKey = $body['license_key'] ?? $_GET['license_key'] ?? '';

        if (empty($licenseKey)) {
            Middleware::jsonError('License key is required.');
        }

        $lic = Database::fetch(
            "SELECT l.*, s.name as strategy_name, s.code as strategy_code, c.user_id, u.full_name as customer_name
             FROM licenses l
             JOIN strategies s ON l.strategy_id = s.id
             JOIN customers c ON l.customer_id = c.id
             JOIN users u ON c.user_id = u.id
             WHERE l.license_key = :key",
            [':key' => $licenseKey]
        );

        if (!$lic) {
            Middleware::jsonError('License key not found.', 404);
        }

        $isExpired = strtotime($lic['expires_at']) < time();
        $isValid = ($lic['status'] === 'ACTIVE') && !$isExpired;

        Middleware::jsonSuccess([
            'license_key' => $lic['license_key'],
            'is_valid' => $isValid,
            'status' => $isExpired ? 'EXPIRED' : $lic['status'],
            'bot_enabled' => (bool)$lic['bot_enabled'],
            'strategy' => $lic['strategy_name'],
            'expires_at' => $lic['expires_at'],
            'customer_name' => $lic['customer_name']
        ]);
    }
}
