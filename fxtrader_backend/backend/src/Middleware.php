<?php

class Middleware {
    public static function handleCors(array $config): void {
        $origin = $_SERVER['HTTP_ORIGIN'] ?? '*';
        $allowedOrigins = $config['cors']['allowed_origins'] ?? ['*'];

        if (in_array('*', $allowedOrigins) || in_array($origin, $allowedOrigins)) {
            header("Access-Control-Allow-Origin: $origin");
        } else {
            header("Access-Control-Allow-Origin: " . ($allowedOrigins[0] ?? '*'));
        }

        header("Access-Control-Allow-Credentials: true");
        header("Access-Control-Max-Age: 86400");
        header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
        header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, X-License-Key, X-EA-Secret");

        if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
            http_response_code(200);
            exit;
        }
    }

    public static function requireAuth(): array {
        $user = Auth::getCurrentUser();
        if (!$user) {
            self::jsonError('Unauthorized. Valid Bearer token required.', 401);
            exit;
        }
        return $user;
    }

    public static function requireAdmin(): array {
        $user = self::requireAuth();
        if (($user['role'] ?? '') !== 'ADMIN') {
            self::jsonError('Forbidden. Administrator privileges required.', 403);
            exit;
        }
        return $user;
    }

    public static function validateEaRequest(): array {
        // Headers or Query/Body parameters
        $headers = function_exists('getallheaders') ? getallheaders() : [];
        $licenseKey = $headers['X-License-Key'] ?? $headers['x-license-key'] ?? $_SERVER['HTTP_X_LICENSE_KEY'] ?? null;
        
        $raw = file_get_contents('php://input');
        $body = json_decode($raw, true) ?: [];

        if (!$licenseKey && isset($body['license_key'])) {
            $licenseKey = $body['license_key'];
        }

        if (!$licenseKey) {
            self::jsonError('Missing license key for EA request.', 401);
            exit;
        }

        $lic = Database::fetch(
            "SELECT l.*, c.user_id, s.code as strategy_code, r.risk_percent, r.max_lot_size, r.min_lot_size, 
                    r.max_daily_sl_hits, r.max_drawdown_percent, r.news_filter_enabled, r.emergency_stop_enabled
             FROM licenses l
             JOIN customers c ON l.customer_id = c.id
             JOIN strategies s ON l.strategy_id = s.id
             LEFT JOIN risk_settings r ON r.license_id = l.id
             WHERE l.license_key = :key",
            [':key' => $licenseKey]
        );

        if (!$lic) {
            self::jsonError('Invalid license key.', 401);
            exit;
        }

        if ($lic['status'] !== 'ACTIVE') {
            self::jsonError("License is currently {$lic['status']}.", 403);
            exit;
        }

        if (strtotime($lic['expires_at']) < time()) {
            self::jsonError('License has expired.', 403);
            exit;
        }

        return ['license' => $lic, 'body' => $body];
    }

    public static function jsonSuccess(array $data = [], string $message = 'Success', int $statusCode = 200): void {
        http_response_code($statusCode);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode([
            'success' => true,
            'message' => $message,
            'data'    => $data,
            'timestamp' => time()
        ]);
        exit;
    }

    public static function jsonError(string $message = 'An error occurred', int $statusCode = 400, array $errors = []): void {
        http_response_code($statusCode);
        header('Content-Type: application/json; charset=utf-8');
        $payload = [
            'success' => false,
            'message' => $message,
            'timestamp' => time()
        ];
        if (!empty($errors)) {
            $payload['errors'] = $errors;
        }
        echo json_encode($payload);
        exit;
    }

    public static function getJsonBody(): array {
        $raw = file_get_contents('php://input');
        if (empty($raw)) {
            return [];
        }
        $data = json_decode($raw, true);
        return is_array($data) ? $data : [];
    }
}
