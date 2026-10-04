<?php
// FILE TEMPORANEO — eliminare dopo l'uso
$secret = 'proxi-setup-2026';
if (($_GET['key'] ?? '') !== $secret) {
    http_response_code(403);
    die('Forbidden');
}

$cmd = $_GET['cmd'] ?? 'migrate:status';
$allowed = ['migrate:status', 'migrate --force', 'db:seed --force', 'migrate --seed --force', 'config:cache', 'route:cache', 'storage:link'];

if (!in_array($cmd, $allowed)) {
    die('Comando non permesso: ' . htmlspecialchars($cmd));
}

$artisan = dirname(__DIR__) . '/artisan';
$php     = '/opt/plesk/php/8.3/bin/php';

header('Content-Type: text/plain; charset=utf-8');
echo "$ php artisan {$cmd}\n\n";
passthru("{$php} {$artisan} {$cmd} 2>&1");
