<?php
// Forward all API requests to secure backend
$backendDir = dirname(__DIR__, 2) . '/fxtrader_backend';
if (!file_exists($backendDir . '/backend/index.php')) {
    // Alternate fallback path check
    $backendDir = dirname(__DIR__, 1) . '/fxtrader_backend';
}

require_once $backendDir . '/backend/index.php';