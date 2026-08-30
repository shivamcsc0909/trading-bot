<?php

class StrategyController {
    public static function index(): void {
        Middleware::requireAuth();

        $strategies = Database::fetchAll("SELECT * FROM strategies WHERE is_active = 1 ORDER BY id ASC");
        foreach ($strategies as &$s) {
            $s['parameters'] = Database::fetchAll(
                "SELECT param_key, param_value, param_type, description FROM strategy_parameters WHERE strategy_id = :sid",
                [':sid' => $s['id']]
            );
        }

        Middleware::jsonSuccess(['strategies' => $strategies]);
    }

    public static function details(): void {
        Middleware::requireAuth();
        $strategyId = (int)($_GET['id'] ?? 1);

        $strategy = Database::fetch("SELECT * FROM strategies WHERE id = :id", [':id' => $strategyId]);
        if (!$strategy) {
            Middleware::jsonError('Strategy not found.', 404);
        }

        $params = Database::fetchAll("SELECT * FROM strategy_parameters WHERE strategy_id = :id", [':id' => $strategyId]);

        // PDF Trading Rule Catalog embedded directly from the 3 Source PDFs
        $pdfRuleMatrix = [
            'macro_context' => [
                'symbol' => 'XAUUSD (Gold)',
                'timeframe' => 'M5 (5-minute candles)',
                'concept' => '100-Block repeating level theory (e.g. 4000-4100 block)',
                'source' => 'Tech Forex Gold Strategy (Shivam Gangele)'
            ],
            'key_levels' => [
                ['level' => '00 Breakout / Pivot', 'action' => 'Retest Buy Stop @05 (SL 95, TP 21) or Breakdown watch', 'class' => 'A (Deterministic)'],
                ['level' => '04 - 07 Base', 'action' => 'Discount Buy on bounce (SL 41/95, TP 15-19)', 'class' => 'A (Deterministic)'],
                ['level' => '19 - 21 Pivot', 'action' => 'Support on fall / Resistance on rise (TP 25-34 / SL 14)', 'class' => 'A (Deterministic)'],
                ['level' => '29 - 35 Resistance', 'action' => 'Sell exhaustion cluster (TP 21, SL 38)', 'class' => 'A (Deterministic)'],
                ['level' => '38 - 44 Crash Zone', 'action' => 'Major Top Sell on 1st attempt (TP 38 then 150-200 pts drop)', 'class' => 'A (Deterministic)'],
                ['level' => '54 - 64 Liquidation Zone', 'action' => 'Deep discount Buy entry post retail trap (SL 55/50, TP 74-81)', 'class' => 'A (Deterministic)'],
                ['level' => '78 - 83 Mid-Supply', 'action' => 'Repeatable 50-pip Sell trades (SL 85, TP 72-73)', 'class' => 'A (Deterministic)'],
                ['level' => '84 Scalp Support', 'action' => 'Reliable quick Buy bounce (SL 82, TP 91/96)', 'class' => 'A (Deterministic)'],
                ['level' => '92 - 96 Top Resistance', 'action' => 'Primary operator profit book Sell level (SL 98, TP 84)', 'class' => 'A (Deterministic)']
            ],
            'filters' => [
                ['filter' => 'F1: Time Window', 'rule' => '9:00 AM - 2:00 PM IST = NO TRADE', 'class' => 'A'],
                ['filter' => 'F4: High-Impact News', 'rule' => 'No pending orders or entries around NFP / CPI / FOMC / Unemployment releases', 'class' => 'A'],
                ['filter' => 'F9: Attempt Rule', 'rule' => '1st attempt = BEST; 2nd = Acceptable; 3rd attempt = SKIP (Breakout Risk)', 'class' => 'A'],
                ['filter' => 'Risk & Lot Size', 'rule' => '1-2% account risk per trade; 3 SL daily max limit; 1:2 to 1:4 R/R target', 'class' => 'A']
            ],
            'candlestick_confirmations' => [
                ['pattern' => 'Pin Bar / Hammer', 'condition' => 'Wick >= 2x Real Body at S/R level', 'source' => 'Candlestick E-Book'],
                ['pattern' => 'Engulfing (Bullish/Bearish)', 'condition' => 'Body completely engulfs previous candle body at level', 'source' => 'Candlestick E-Book'],
                ['pattern' => 'Inside Bar Breakout', 'condition' => 'Mother bar range breakout in trend direction', 'source' => 'Price Action 2.0']
            ]
        ];

        Middleware::jsonSuccess([
            'strategy' => $strategy,
            'parameters' => $params,
            'pdf_rule_matrix' => $pdfRuleMatrix
        ]);
    }

    public static function updateParameter(): void {
        Middleware::requireAdmin();
        $body = Middleware::getJsonBody();

        $strategyId = (int)($body['strategy_id'] ?? 0);
        $key = trim($body['param_key'] ?? '');
        $val = trim($body['param_value'] ?? '');

        if (!$strategyId || empty($key)) {
            Middleware::jsonError('Strategy ID and param_key required.');
        }

        Database::query(
            "UPDATE strategy_parameters SET param_value = :v WHERE strategy_id = :sid AND param_key = :k",
            [':v' => $val, ':sid' => $strategyId, ':k' => $key]
        );

        Middleware::jsonSuccess([], "Parameter {$key} updated");
    }
}
