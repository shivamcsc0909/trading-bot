<?php

class AuthController {
    public static function login(): void {
        $body = Middleware::getJsonBody();
        $email = filter_var($body['email'] ?? '', FILTER_SANITIZE_EMAIL);
        $password = $body['password'] ?? '';

        if (empty($email) || empty($password)) {
            Middleware::jsonError('Email and password are required.');
        }

        $user = Database::fetch(
            "SELECT u.*, r.name as role_name, c.id as customer_id 
             FROM users u
             JOIN roles r ON u.role_id = r.id
             LEFT JOIN customers c ON c.user_id = u.id
             WHERE u.email = :email",
            [':email' => $email]
        );

        if (!$user || !Auth::verifyPassword($password, $user['password_hash'])) {
            Middleware::jsonError('Invalid email or password credentials.', 401);
        }

        if (!$user['is_active']) {
            Middleware::jsonError('Account is deactivated. Please contact administrator.', 403);
        }

        $tokenPayload = [
            'id' => (int)$user['id'],
            'email' => $user['email'],
            'full_name' => $user['full_name'],
            'role' => $user['role_name'],
            'customer_id' => $user['customer_id'] ? (int)$user['customer_id'] : null
        ];

        $token = Auth::generateToken($tokenPayload);

        Database::logAudit($user['id'], 'USER_LOGIN', 'USER', $user['id'], [
            'email' => $user['email'],
            'role' => $user['role_name']
        ]);

        Middleware::jsonSuccess([
            'token' => $token,
            'user' => $tokenPayload
        ], 'Login successful');
    }

    public static function me(): void {
        $user = Middleware::requireAuth();
        
        $userData = Database::fetch(
            "SELECT u.id, u.email, u.full_name, u.is_active, r.name as role, c.id as customer_id, c.phone, c.country, c.notes
             FROM users u
             JOIN roles r ON u.role_id = r.id
             LEFT JOIN customers c ON c.user_id = u.id
             WHERE u.id = :id",
            [':id' => $user['id']]
        );

        if (!$userData) {
            Middleware::jsonError('User not found.', 404);
        }

        Middleware::jsonSuccess(['user' => $userData]);
    }

    public static function logout(): void {
        $user = Auth::getCurrentUser();
        if ($user) {
            Database::logAudit($user['id'], 'USER_LOGOUT', 'USER', $user['id']);
        }
        Middleware::jsonSuccess([], 'Logged out successfully');
    }

    public static function updatePassword(): void {
        $user = Middleware::requireAuth();
        $body = Middleware::getJsonBody();
        
        $currentPassword = $body['current_password'] ?? '';
        $newPassword = $body['new_password'] ?? '';

        if (strlen($newPassword) < 6) {
            Middleware::jsonError('New password must be at least 6 characters.');
        }

        $userData = Database::fetch("SELECT password_hash FROM users WHERE id = :id", [':id' => $user['id']]);
        if (!Auth::verifyPassword($currentPassword, $userData['password_hash'])) {
            Middleware::jsonError('Current password is incorrect.', 400);
        }

        $newHash = Auth::hashPassword($newPassword);
        Database::query("UPDATE users SET password_hash = :h WHERE id = :id", [
            ':h' => $newHash,
            ':id' => $user['id']
        ]);

        Database::logAudit($user['id'], 'PASSWORD_UPDATED', 'USER', $user['id']);

        Middleware::jsonSuccess([], 'Password changed successfully');
    }
}
