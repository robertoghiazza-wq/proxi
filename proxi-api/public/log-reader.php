<?php
// FILE TEMPORANEO — eliminare dopo il debug
$secret = 'proxi-setup-2026';
if (($_GET['key'] ?? '') !== $secret) {
    http_response_code(403);
    die('Forbidden');
}

header('Content-Type: text/plain; charset=utf-8');

$logFile = dirname(__DIR__) . '/storage/logs/laravel.log';

if (!file_exists($logFile)) {
    echo "Log file non trovato: {$logFile}\n";
    exit;
}

$lines = (int)($_GET['lines'] ?? 100);
$content = file_get_contents($logFile);
$allLines = explode("\n", $content);
$last = array_slice($allLines, -$lines);
echo implode("\n", $last);
