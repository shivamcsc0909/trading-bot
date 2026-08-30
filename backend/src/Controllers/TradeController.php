<?php

class TradeController {
    public static function index(): void {
        $user = Middleware::requireAuth();

        if ($user['role'] === 'ADMIN') {
            $trades = Database::fetchAll("SELECT * FROM trades ORDER BY closed_at DESC LIMIT 100");
        } else {
            $cust = Database::fetch("SELECT id FROM customers WHERE user_id = :uid", [':uid' => $user['id']]);
            $trades = Database::fetchAll(
                "SELECT t.* FROM trades t
                 JOIN mt5_accounts m ON t.mt5_account_id = m.id
                 WHERE m.customer_id = :cid ORDER BY t.closed_at DESC LIMIT 100",
                [':cid' => $cust['id'] ?? 0]
            );
        }

        Middleware::jsonSuccess(['trades' => $trades]);
    }
}
