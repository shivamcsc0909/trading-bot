<?php

class BotController {
    public static function status(): void {
        $user = Middleware::requireAuth();
        
        $condition = ($user['role'] === 'ADMIN') ? "1=1" : "c.user_id = " . (int)$user['id'];
        
        $bots = Database::fetchAll(
            "SELECT b.*, m.account_number, m.broker, m.server, m.balance, m.equity, m.is_connected, m.last_heartbeat_at,
                    l.license_key, l.status as license_status, l.bot_enabled,
                    r.risk_percent, r.max_open_positions, r.emergency_stop_enabled
             FROM bot_instances b
             JOIN mt5_accounts m ON b.mt5_account_id = m.id
             JOIN licenses l ON b.license_id = l.id
             JOIN customers c ON l.customer_id = c.id
             LEFT JOIN risk_settings r ON r.license_id = l.id
             WHERE $condition"
        );

        Middleware::jsonSuccess(['bots' => $bots]);
    }

    public static function start(): void {
        $user = Middleware::requireAuth();
        $body = Middleware::getJsonBody();
        $botId = (int)($body['bot_id'] ?? 0);

        $bot = Database::fetch(
            "SELECT b.*, l.customer_id, c.user_id, l.status as license_status, l.id as license_id
             FROM bot_instances b
             JOIN licenses l ON b.license_id = l.id
             JOIN customers c ON l.customer_id = c.id
             WHERE b.id = :id",
            [':id' => $botId]
        );

        if (!$bot) {
            Middleware::jsonError('Bot instance not found.', 404);
        }

        if ($user['role'] !== 'ADMIN' && (int)$bot['user_id'] !== (int)$user['id']) {
            Middleware::jsonError('Unauthorized to manage this bot.', 403);
        }

        if ($bot['license_status'] !== 'ACTIVE') {
            Middleware::jsonError("Cannot start bot: License is {$bot['license_status']}.", 400);
        }

        Database::query("UPDATE bot_instances SET status = 'RUNNING', last_error = NULL WHERE id = :id", [':id' => $botId]);
        Database::query("UPDATE licenses SET bot_enabled = 1 WHERE id = :lid", [':lid' => $bot['license_id']]);

        Database::logBotEvent($bot['mt5_account_id'], $bot['license_id'], 'INFO', 'BOT_STARTED', "Bot #{$botId} started by {$user['email']}");
        Database::logAudit($user['id'], 'BOT_STARTED', 'BOT', $botId);

        Middleware::jsonSuccess(['status' => 'RUNNING'], 'Bot started successfully');
    }

    public static function stop(): void {
        $user = Middleware::requireAuth();
        $body = Middleware::getJsonBody();
        $botId = (int)($body['bot_id'] ?? 0);

        $bot = Database::fetch(
            "SELECT b.*, l.customer_id, c.user_id, l.id as license_id
             FROM bot_instances b
             JOIN licenses l ON b.license_id = l.id
             JOIN customers c ON l.customer_id = c.id
             WHERE b.id = :id",
            [':id' => $botId]
        );

        if (!$bot) {
            Middleware::jsonError('Bot instance not found.', 404);
        }

        if ($user['role'] !== 'ADMIN' && (int)$bot['user_id'] !== (int)$user['id']) {
            Middleware::jsonError('Unauthorized to manage this bot.', 403);
        }

        Database::query("UPDATE bot_instances SET status = 'STOPPED' WHERE id = :id", [':id' => $botId]);
        Database::query("UPDATE licenses SET bot_enabled = 0 WHERE id = :lid", [':lid' => $bot['license_id']]);

        Database::logBotEvent($bot['mt5_account_id'], $bot['license_id'], 'WARN', 'BOT_STOPPED', "Master kill switch activated for Bot #{$botId} by {$user['email']}");
        Database::logAudit($user['id'], 'BOT_STOPPED', 'BOT', $botId);

        Middleware::jsonSuccess(['status' => 'STOPPED'], 'Bot stopped (Master Kill Switch Activated)');
    }

    public static function setMode(): void {
        $user = Middleware::requireAuth();
        $body = Middleware::getJsonBody();
        $botId = (int)($body['bot_id'] ?? 0);
        $mode = strtoupper($body['mode'] ?? 'DEMO');

        if (!in_array($mode, ['DEMO', 'LIVE'])) {
            Middleware::jsonError('Invalid mode. Must be DEMO or LIVE.');
        }

        $bot = Database::fetch(
            "SELECT b.*, l.customer_id, c.user_id, l.status as license_status
             FROM bot_instances b
             JOIN licenses l ON b.license_id = l.id
             JOIN customers c ON l.customer_id = c.id
             WHERE b.id = :id",
            [':id' => $botId]
        );

        if (!$bot) {
            Middleware::jsonError('Bot instance not found.', 404);
        }

        if ($user['role'] !== 'ADMIN' && (int)$bot['user_id'] !== (int)$user['id']) {
            Middleware::jsonError('Unauthorized to modify this bot.', 403);
        }

        if ($mode === 'LIVE') {
            // Live validation requirements
            if ($bot['license_status'] !== 'ACTIVE') {
                Middleware::jsonError('Cannot switch to LIVE: License is not ACTIVE.', 400);
            }
        }

        Database::query("UPDATE bot_instances SET mode = :m WHERE id = :id", [':m' => $mode, ':id' => $botId]);

        Database::logBotEvent($bot['mt5_account_id'], $bot['license_id'], 'INFO', 'BOT_MODE_CHANGED', "Mode updated to {$mode} by {$user['email']}");
        Database::logAudit($user['id'], 'BOT_MODE_CHANGED', 'BOT', $botId, ['mode' => $mode]);

        Middleware::jsonSuccess(['mode' => $mode], "Bot mode set to {$mode}");
    }
}
