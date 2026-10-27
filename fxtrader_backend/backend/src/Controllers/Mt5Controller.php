<?php

class Mt5Controller {
    /**
     * EA Initial Registration & Handshake
     * POST /api/mt5/register
     */
    public static function register(): void {
        $val = Middleware::validateEaRequest();
        $lic = $val['license'];
        $body = $val['body'];

        $accountNumber = (int)($body['account_number'] ?? 0);
        $broker = trim($body['broker'] ?? 'Unknown-Broker');
        $server = trim($body['server'] ?? 'Unknown-Server');
        $currency = trim($body['currency'] ?? 'USD');
        $leverage = (int)($body['leverage'] ?? 100);
        $eaVersion = trim($body['ea_version'] ?? '1.0.0');

        if (!$accountNumber) {
            Middleware::jsonError('MT5 Account number is required.');
        }

        // Check if account already exists
        $existing = Database::fetch(
            "SELECT * FROM mt5_accounts WHERE account_number = :acc AND broker = :brk",
            [':acc' => $accountNumber, ':brk' => $broker]
        );

        if ($existing) {
            $accountId = (int)$existing['id'];
            Database::query(
                "UPDATE mt5_accounts SET 
                    license_id = :lid, server = :srv, currency = :cur, leverage = :lev,
                    ea_version = :ver, is_connected = 1, last_heartbeat_at = NOW() 
                 WHERE id = :id",
                [
                    ':lid' => $lic['id'],
                    ':srv' => $server,
                    ':cur' => $currency,
                    ':lev' => $leverage,
                    ':ver' => $eaVersion,
                    ':id'  => $accountId
                ]
            );
        } else {
            // Count registered accounts under this license
            $accCount = (int)Database::fetch(
                "SELECT COUNT(*) as c FROM mt5_accounts WHERE license_id = :lid",
                [':lid' => $lic['id']]
            )['c'];

            if ($accCount >= (int)$lic['max_accounts']) {
                Middleware::jsonError("License account limit ({$lic['max_accounts']}) reached.", 403);
            }

            $accountId = Database::insert(
                "INSERT INTO mt5_accounts 
                 (customer_id, license_id, account_number, broker, server, currency, leverage, ea_version, is_connected, last_heartbeat_at)
                 VALUES (:cid, :lid, :acc, :brk, :srv, :cur, :lev, :ver, 1, NOW())",
                [
                    ':cid' => $lic['customer_id'],
                    ':lid' => $lic['id'],
                    ':acc' => $accountNumber,
                    ':brk' => $broker,
                    ':srv' => $server,
                    ':cur' => $currency,
                    ':lev' => $leverage,
                    ':ver' => $eaVersion
                ]
            );

            // Create bot instance record
            Database::insert(
                "INSERT INTO bot_instances (mt5_account_id, license_id, mode, status, magic_number)
                 VALUES (:aid, :lid, 'DEMO', 'RUNNING', 108801)",
                [':aid' => $accountId, ':lid' => $lic['id']]
            );
        }

        Database::logBotEvent($accountId, $lic['id'], 'INFO', 'MT5_CONNECTED', "EA connected successfully from account #{$accountNumber}");

        Middleware::jsonSuccess([
            'mt5_account_id' => $accountId,
            'license_status' => $lic['status'],
            'bot_enabled' => (bool)$lic['bot_enabled'],
            'strategy_code' => $lic['strategy_code'],
            'risk_percent' => (float)($lic['risk_percent'] ?? 2.0),
            'max_lot_size' => (float)($lic['max_lot_size'] ?? 1.0),
            'min_lot_size' => (float)($lic['min_lot_size'] ?? 0.01),
        ], 'EA registered successfully');
    }

    /**
     * Periodic EA Heartbeat
     * POST /api/mt5/heartbeat
     */
    public static function heartbeat(): void {
        $val = Middleware::validateEaRequest();
        $lic = $val['license'];
        $body = $val['body'];

        $accountNumber = (int)($body['account_number'] ?? 0);
        $acc = Database::fetch("SELECT * FROM mt5_accounts WHERE account_number = :acc AND license_id = :lid", [
            ':acc' => $accountNumber,
            ':lid' => $lic['id']
        ]);

        if (!$acc) {
            Middleware::jsonError('Account not registered. Run /register first.', 404);
        }

        // Update heartbeat & balance/equity if provided
        $balance = isset($body['balance']) ? (float)$body['balance'] : (float)$acc['balance'];
        $equity = isset($body['equity']) ? (float)$body['equity'] : (float)$acc['equity'];
        $margin = isset($body['margin']) ? (float)$body['margin'] : (float)$acc['margin'];
        $freeMargin = isset($body['free_margin']) ? (float)$body['free_margin'] : (float)$acc['free_margin'];

        Database::query(
            "UPDATE mt5_accounts SET 
                balance = :bal, equity = :eq, margin = :mg, free_margin = :fm,
                is_connected = 1, last_heartbeat_at = NOW() 
             WHERE id = :id",
            [':bal' => $balance, ':eq' => $equity, ':mg' => $margin, ':fm' => $freeMargin, ':id' => $acc['id']]
        );

        // Fetch bot instance state & risk settings
        $bot = Database::fetch("SELECT * FROM bot_instances WHERE mt5_account_id = :aid", [':aid' => $acc['id']]);
        $risk = Database::fetch("SELECT * FROM risk_settings WHERE license_id = :lid", [':lid' => $lic['id']]);

        // Emergency Kill Switch Check
        $isBotActive = ($lic['bot_enabled'] == 1) && ($bot['status'] === 'RUNNING') && (!empty($risk) && $risk['emergency_stop_enabled'] == 0);

        Middleware::jsonSuccess([
            'server_time' => date('Y-m-d H:i:s'),
            'bot_enabled' => (bool)$isBotActive,
            'bot_mode' => $bot['mode'] ?? 'DEMO',
            'bot_status' => $bot['status'] ?? 'STOPPED',
            'risk_settings' => [
                'risk_percent' => (float)($risk['risk_percent'] ?? 2.0),
                'max_lot_size' => (float)($risk['max_lot_size'] ?? 1.0),
                'min_lot_size' => (float)($risk['min_lot_size'] ?? 0.01),
                'max_open_positions' => (int)($risk['max_open_positions'] ?? 2),
                'max_daily_sl_hits' => (int)($risk['max_daily_sl_hits'] ?? 3),
                'max_drawdown_percent' => (float)($risk['max_drawdown_percent'] ?? 5.0),
                'news_filter_enabled' => (bool)($risk['news_filter_enabled'] ?? true),
                'emergency_stop_enabled' => (bool)($risk['emergency_stop_enabled'] ?? false),
            ]
        ], 'Heartbeat acknowledged');
    }

    /**
     * Real-time Account Balance & Equity Synchronization
     * POST /api/mt5/account-sync
     */
    public static function accountSync(): void {
        $val = Middleware::validateEaRequest();
        $lic = $val['license'];
        $body = $val['body'];

        $accountNumber = (int)($body['account_number'] ?? 0);
        $acc = Database::fetch("SELECT id FROM mt5_accounts WHERE account_number = :acc AND license_id = :lid", [
            ':acc' => $accountNumber,
            ':lid' => $lic['id']
        ]);

        if (!$acc) {
            Middleware::jsonError('Account not registered.', 404);
        }

        $balance = (float)($body['balance'] ?? 0.0);
        $equity = (float)($body['equity'] ?? 0.0);
        $margin = (float)($body['margin'] ?? 0.0);
        $freeMargin = (float)($body['free_margin'] ?? 0.0);
        $floatingPl = (float)($body['floating_pl'] ?? 0.0);
        $openCount = (int)($body['open_positions_count'] ?? 0);

        Database::query(
            "UPDATE mt5_accounts SET 
                balance = :bal, equity = :eq, margin = :mg, free_margin = :fm,
                is_connected = 1, last_heartbeat_at = NOW() 
             WHERE id = :id",
            [':bal' => $balance, ':eq' => $equity, ':mg' => $margin, ':fm' => $freeMargin, ':id' => $acc['id']]
        );

        // Store snapshot for analytics
        Database::insert(
            "INSERT INTO account_snapshots (mt5_account_id, balance, equity, margin, free_margin, floating_pl, open_positions_count)
             VALUES (:aid, :b, :e, :m, :fm, :fpl, :opc)",
            [
                ':aid' => $acc['id'],
                ':b' => $balance,
                ':e' => $equity,
                ':m' => $margin,
                ':fm' => $freeMargin,
                ':fpl' => $floatingPl,
                ':opc' => $openCount
            ]
        );

        Middleware::jsonSuccess([], 'Account metrics synchronized');
    }

    /**
     * Synchronize Live Open Positions
     * POST /api/mt5/positions-sync
     */
    public static function positionsSync(): void {
        $val = Middleware::validateEaRequest();
        $lic = $val['license'];
        $body = $val['body'];

        $accountNumber = (int)($body['account_number'] ?? 0);
        $acc = Database::fetch("SELECT id FROM mt5_accounts WHERE account_number = :acc AND license_id = :lid", [
            ':acc' => $accountNumber,
            ':lid' => $lic['id']
        ]);

        if (!$acc) {
            Middleware::jsonError('Account not registered.', 404);
        }

        $incomingPositions = $body['positions'] ?? [];
        $activeTickets = [];

        foreach ($incomingPositions as $pos) {
            $ticket = (int)$pos['ticket'];
            $activeTickets[] = $ticket;

            $existing = Database::fetch(
                "SELECT id FROM positions WHERE mt5_account_id = :aid AND position_ticket = :ticket",
                [':aid' => $acc['id'], ':ticket' => $ticket]
            );

            if ($existing) {
                Database::query(
                    "UPDATE positions SET 
                        current_price = :cp, profit = :p, swap = :sw, stop_loss = :sl, take_profit = :tp, updated_at = NOW()
                     WHERE id = :id",
                    [
                        ':cp' => (float)$pos['current_price'],
                        ':p'  => (float)$pos['profit'],
                        ':sw' => (float)($pos['swap'] ?? 0.0),
                        ':sl' => (float)($pos['stop_loss'] ?? 0.0),
                        ':tp' => (float)($pos['take_profit'] ?? 0.0),
                        ':id' => $existing['id']
                    ]
                );
            } else {
                Database::insert(
                    "INSERT INTO positions (mt5_account_id, position_ticket, symbol, position_type, volume, open_price, current_price, stop_loss, take_profit, profit, swap, comment, magic_number, opened_at)
                     VALUES (:aid, :ticket, :sym, :type, :vol, :op, :cp, :sl, :tp, :p, :sw, :comm, :magic, :otime)",
                    [
                        ':aid' => $acc['id'],
                        ':ticket' => $ticket,
                        ':sym' => $pos['symbol'] ?? 'XAUUSD',
                        ':type' => $pos['type'] ?? 'BUY',
                        ':vol' => (float)$pos['volume'],
                        ':op' => (float)$pos['open_price'],
                        ':cp' => (float)$pos['current_price'],
                        ':sl' => (float)($pos['stop_loss'] ?? 0.0),
                        ':tp' => (float)($pos['take_profit'] ?? 0.0),
                        ':p' => (float)$pos['profit'],
                        ':sw' => (float)($pos['swap'] ?? 0.0),
                        ':comm' => $pos['comment'] ?? '',
                        ':magic' => (int)($pos['magic_number'] ?? 108801),
                        ':otime' => $pos['opened_at'] ?? date('Y-m-d H:i:s')
                    ]
                );
            }
        }

        // Clean up closed positions that are no longer reported
        if (!empty($activeTickets)) {
            $inClause = implode(',', array_map('intval', $activeTickets));
            Database::query(
                "DELETE FROM positions WHERE mt5_account_id = :aid AND position_ticket NOT IN ($inClause)",
                [':aid' => $acc['id']]
            );
        } else {
            Database::query("DELETE FROM positions WHERE mt5_account_id = :aid", [':aid' => $acc['id']]);
        }

        Middleware::jsonSuccess(['synced_count' => count($incomingPositions)], 'Positions synchronized');
    }

    /**
     * Record Closed Deal / Trade
     * POST /api/mt5/trade-sync
     */
    public static function tradeSync(): void {
        $val = Middleware::validateEaRequest();
        $lic = $val['license'];
        $body = $val['body'];

        $accountNumber = (int)($body['account_number'] ?? 0);
        $acc = Database::fetch("SELECT id FROM mt5_accounts WHERE account_number = :acc AND license_id = :lid", [
            ':acc' => $accountNumber,
            ':lid' => $lic['id']
        ]);

        if (!$acc) {
            Middleware::jsonError('Account not registered.', 404);
        }

        $dealTicket = (int)($body['deal_ticket'] ?? 0);
        $posTicket = (int)($body['position_ticket'] ?? 0);

        if (!$dealTicket) {
            Middleware::jsonError('Deal ticket is required.');
        }

        $existing = Database::fetch(
            "SELECT id FROM trades WHERE mt5_account_id = :aid AND deal_ticket = :dt",
            [':aid' => $acc['id'], ':dt' => $dealTicket]
        );

        if (!$existing) {
            Database::insert(
                "INSERT INTO trades (mt5_account_id, deal_ticket, position_ticket, symbol, trade_type, volume, open_price, close_price, stop_loss, take_profit, profit, commission, swap, magic_number, opened_at, closed_at, comment)
                 VALUES (:aid, :dt, :pt, :sym, :type, :vol, :op, :cp, :sl, :tp, :p, :comm, :sw, :magic, :otime, :ctime, :cmnt)",
                [
                    ':aid' => $acc['id'],
                    ':dt' => $dealTicket,
                    ':pt' => $posTicket,
                    ':sym' => $body['symbol'] ?? 'XAUUSD',
                    ':type' => $body['trade_type'] ?? 'BUY',
                    ':vol' => (float)($body['volume'] ?? 0.1),
                    ':op' => (float)($body['open_price'] ?? 0.0),
                    ':cp' => (float)($body['close_price'] ?? 0.0),
                    ':sl' => (float)($body['stop_loss'] ?? 0.0),
                    ':tp' => (float)($body['take_profit'] ?? 0.0),
                    ':p' => (float)($body['profit'] ?? 0.0),
                    ':comm' => (float)($body['commission'] ?? 0.0),
                    ':sw' => (float)($body['swap'] ?? 0.0),
                    ':magic' => (int)($body['magic_number'] ?? 108801),
                    ':otime' => $body['opened_at'] ?? date('Y-m-d H:i:s'),
                    ':ctime' => $body['closed_at'] ?? date('Y-m-d H:i:s'),
                    ':cmnt' => $body['comment'] ?? ''
                ]
            );

            // Log event
            $profit = (float)($body['profit'] ?? 0.0);
            $evt = $profit >= 0 ? 'POSITION_CLOSED_WIN' : 'POSITION_CLOSED_LOSS';
            Database::logBotEvent($acc['id'], $lic['id'], 'INFO', $evt, "Trade closed #{$dealTicket} | Profit: \${$profit}", $body);
        }

        Middleware::jsonSuccess(['deal_ticket' => $dealTicket], 'Trade synchronized successfully');
    }

    /**
     * Record EA Signal Execution
     * POST /api/mt5/signal-log
     */
    public static function signalLog(): void {
        $val = Middleware::validateEaRequest();
        $lic = $val['license'];
        $body = $val['body'];

        $accountNumber = (int)($body['account_number'] ?? 0);
        $acc = Database::fetch("SELECT id FROM mt5_accounts WHERE account_number = :acc AND license_id = :lid", [
            ':acc' => $accountNumber,
            ':lid' => $lic['id']
        ]);

        if (!$acc) {
            Middleware::jsonError('Account not registered.', 404);
        }

        $signalUid = trim($body['signal_uid'] ?? '');
        if (empty($signalUid)) {
            $signalUid = 'SIG_' . date('Ymd_His') . '_' . substr(md5(uniqid()), 0, 6);
        }

        $existing = Database::fetch("SELECT id FROM signals WHERE signal_uid = :uid", [':uid' => $signalUid]);
        if ($existing) {
            Middleware::jsonSuccess(['signal_id' => $existing['id'], 'duplicate' => true], 'Duplicate signal already recorded');
        }

        $sigId = Database::insert(
            "INSERT INTO signals (strategy_id, mt5_account_id, signal_uid, symbol, direction, order_type, price, stop_loss, take_profit, reason, timeframe, status)
             VALUES (:sid, :aid, :uid, :sym, :dir, :ot, :pr, :sl, :tp, :rsn, :tf, :st)",
            [
                ':sid' => $lic['strategy_id'],
                ':aid' => $acc['id'],
                ':uid' => $signalUid,
                ':sym' => $body['symbol'] ?? 'XAUUSD',
                ':dir' => $body['direction'] ?? 'BUY',
                ':ot' => $body['order_type'] ?? 'MARKET',
                ':pr' => (float)($body['price'] ?? 0.0),
                ':sl' => (float)($body['stop_loss'] ?? 0.0),
                ':tp' => (float)($body['take_profit'] ?? 0.0),
                ':rsn' => $body['reason'] ?? '100-Block Rule Entry',
                ':tf' => $body['timeframe'] ?? 'M5',
                ':st' => $body['status'] ?? 'EXECUTED'
            ]
        );

        Database::logBotEvent($acc['id'], $lic['id'], 'INFO', 'SIGNAL_GENERATED', "Signal {$signalUid} recorded: {$body['direction']} @ {$body['price']}");

        Middleware::jsonSuccess(['signal_id' => $sigId, 'signal_uid' => $signalUid], 'Signal recorded');
    }
}
