<?php

class CustomerController {
    private static function getCustomerId(array $user): int {
        if (!empty($user['customer_id'])) {
            return (int)$user['customer_id'];
        }
        $cust = Database::fetch("SELECT id FROM customers WHERE user_id = :uid", [':uid' => $user['id']]);
        if (!$cust) {
            Middleware::jsonError('Customer profile not found for this account.', 404);
        }
        return (int)$cust['id'];
    }

    public static function dashboard(): void {
        $user = Middleware::requireAuth();
        $customerId = self::getCustomerId($user);

        // MT5 Account
        $mt5 = Database::fetch(
            "SELECT * FROM mt5_accounts WHERE customer_id = :cid ORDER BY id DESC LIMIT 1",
            [':cid' => $customerId]
        );

        // License & Strategy
        $license = Database::fetch(
            "SELECT l.*, s.name as strategy_name, s.code as strategy_code, s.symbol as strategy_symbol, s.timeframe
             FROM licenses l
             JOIN strategies s ON l.strategy_id = s.id
             WHERE l.customer_id = :cid ORDER BY l.id DESC LIMIT 1",
            [':cid' => $customerId]
        );

        // Bot Instance
        $bot = null;
        if ($mt5) {
            $bot = Database::fetch(
                "SELECT * FROM bot_instances WHERE mt5_account_id = :aid",
                [':aid' => $mt5['id']]
            );
        }

        // Open Positions
        $positions = [];
        $floatingPl = 0.0;
        if ($mt5) {
            $positions = Database::fetchAll(
                "SELECT * FROM positions WHERE mt5_account_id = :aid ORDER BY opened_at DESC",
                [':aid' => $mt5['id']]
            );
            foreach ($positions as $p) {
                $floatingPl += (float)$p['profit'];
            }
        }

        // Today's closed P/L & Overall closed P/L
        $todayPl = 0.0;
        $overallPl = 0.0;
        $totalTrades = 0;
        $winTrades = 0;
        $lastTrade = null;

        if ($mt5) {
            $todayTrades = Database::fetchAll(
                "SELECT profit FROM trades WHERE mt5_account_id = :aid AND DATE(closed_at) = CURRENT_DATE",
                [':aid' => $mt5['id']]
            );
            foreach ($todayTrades as $t) {
                $todayPl += (float)$t['profit'];
            }

            $allTrades = Database::fetchAll(
                "SELECT * FROM trades WHERE mt5_account_id = :aid ORDER BY closed_at DESC",
                [':aid' => $mt5['id']]
            );
            $totalTrades = count($allTrades);
            foreach ($allTrades as $t) {
                $overallPl += (float)$t['profit'];
                if ((float)$t['profit'] > 0) {
                    $winTrades++;
                }
            }
            $lastTrade = $allTrades[0] ?? null;
        }

        // Last Signal
        $lastSignal = null;
        if ($mt5) {
            $lastSignal = Database::fetch(
                "SELECT * FROM signals WHERE mt5_account_id = :aid ORDER BY created_at DESC LIMIT 1",
                [':aid' => $mt5['id']]
            );
        }

        // Risk Settings
        $risk = null;
        if ($license) {
            $risk = Database::fetch(
                "SELECT * FROM risk_settings WHERE license_id = :lid",
                [':lid' => $license['id']]
            );
        }

        // Drawdown calculation
        $balance = (float)($mt5['balance'] ?? 10000.0);
        $equity = (float)($mt5['equity'] ?? 10000.0);
        $drawdown = $balance > 0 ? max(0.0, round((($balance - $equity) / $balance) * 100, 2)) : 0.0;
        $winRate = $totalTrades > 0 ? round(($winTrades / $totalTrades) * 100, 1) : 0.0;

        Middleware::jsonSuccess([
            'mt5' => $mt5,
            'bot' => $bot,
            'license' => $license,
            'risk_settings' => $risk,
            'stats' => [
                'balance' => $balance,
                'equity' => $equity,
                'margin' => (float)($mt5['margin'] ?? 0.0),
                'free_margin' => (float)($mt5['free_margin'] ?? $balance),
                'floating_pl' => round($floatingPl, 2),
                'today_pl' => round($todayPl, 2),
                'overall_pl' => round($overallPl, 2),
                'drawdown_percent' => $drawdown,
                'open_positions_count' => count($positions),
                'total_trades' => $totalTrades,
                'win_rate' => $winRate,
                'is_connected' => (bool)($mt5['is_connected'] ?? false),
                'last_heartbeat' => $mt5['last_heartbeat_at'] ?? null,
            ],
            'open_positions' => $positions,
            'last_trade' => $lastTrade,
            'last_signal' => $lastSignal
        ]);
    }

    public static function positions(): void {
        $user = Middleware::requireAuth();
        $customerId = self::getCustomerId($user);

        $mt5 = Database::fetch("SELECT id FROM mt5_accounts WHERE customer_id = :cid ORDER BY id DESC LIMIT 1", [':cid' => $customerId]);
        if (!$mt5) {
            Middleware::jsonSuccess(['positions' => []]);
        }

        $positions = Database::fetchAll(
            "SELECT * FROM positions WHERE mt5_account_id = :aid ORDER BY opened_at DESC",
            [':aid' => $mt5['id']]
        );

        Middleware::jsonSuccess(['positions' => $positions]);
    }

    public static function tradeHistory(): void {
        $user = Middleware::requireAuth();
        $customerId = self::getCustomerId($user);

        $mt5 = Database::fetch("SELECT id FROM mt5_accounts WHERE customer_id = :cid ORDER BY id DESC LIMIT 1", [':cid' => $customerId]);
        if (!$mt5) {
            Middleware::jsonSuccess(['trades' => []]);
        }

        $trades = Database::fetchAll(
            "SELECT * FROM trades WHERE mt5_account_id = :aid ORDER BY closed_at DESC LIMIT 100",
            [':aid' => $mt5['id']]
        );

        Middleware::jsonSuccess(['trades' => $trades]);
    }

    public static function riskSettings(): void {
        $user = Middleware::requireAuth();
        $customerId = self::getCustomerId($user);

        if ($_SERVER['REQUEST_METHOD'] === 'GET') {
            $risk = Database::fetch(
                "SELECT r.*, l.license_key FROM risk_settings r 
                 JOIN licenses l ON r.license_id = l.id 
                 WHERE r.customer_id = :cid ORDER BY r.id DESC LIMIT 1",
                [':cid' => $customerId]
            );
            Middleware::jsonSuccess(['risk_settings' => $risk]);
        } else {
            // POST / PUT
            $body = Middleware::getJsonBody();
            $riskPercent = max(0.1, min(10.0, (float)($body['risk_percent'] ?? 2.0)));
            $maxLotSize = max(0.01, min(100.0, (float)($body['max_lot_size'] ?? 1.0)));
            $minLotSize = max(0.01, min($maxLotSize, (float)($body['min_lot_size'] ?? 0.01)));
            $maxOpenPositions = max(1, min(20, (int)($body['max_open_positions'] ?? 2)));
            $maxDailySlHits = max(1, min(10, (int)($body['max_daily_sl_hits'] ?? 3)));
            $maxDrawdownPercent = max(1.0, min(50.0, (float)($body['max_drawdown_percent'] ?? 5.0)));
            $newsFilter = !empty($body['news_filter_enabled']) ? 1 : 0;
            $emergencyStop = !empty($body['emergency_stop_enabled']) ? 1 : 0;

            Database::query(
                "UPDATE risk_settings SET 
                    risk_percent = :rp, 
                    max_lot_size = :mls, 
                    min_lot_size = :mnls, 
                    max_open_positions = :mop, 
                    max_daily_sl_hits = :mdsl, 
                    max_drawdown_percent = :mdd, 
                    news_filter_enabled = :nfe, 
                    emergency_stop_enabled = :ese 
                 WHERE customer_id = :cid",
                [
                    ':rp' => $riskPercent,
                    ':mls' => $maxLotSize,
                    ':mnls' => $minLotSize,
                    ':mop' => $maxOpenPositions,
                    ':mdsl' => $maxDailySlHits,
                    ':mdd' => $maxDrawdownPercent,
                    ':nfe' => $newsFilter,
                    ':ese' => $emergencyStop,
                    ':cid' => $customerId
                ]
            );

            Database::logAudit($user['id'], 'RISK_SETTINGS_UPDATED', 'RISK', $customerId, $body);

            Middleware::jsonSuccess([], 'Risk settings updated successfully');
        }
    }

    public static function botLogs(): void {
        $user = Middleware::requireAuth();
        $customerId = self::getCustomerId($user);

        $mt5 = Database::fetch("SELECT id FROM mt5_accounts WHERE customer_id = :cid ORDER BY id DESC LIMIT 1", [':cid' => $customerId]);
        if (!$mt5) {
            Middleware::jsonSuccess(['logs' => []]);
        }

        $logs = Database::fetchAll(
            "SELECT * FROM bot_logs WHERE mt5_account_id = :aid ORDER BY created_at DESC LIMIT 50",
            [':aid' => $mt5['id']]
        );

        Middleware::jsonSuccess(['logs' => $logs]);
    }
}
