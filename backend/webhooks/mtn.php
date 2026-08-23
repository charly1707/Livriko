<?php

require_once __DIR__ . '/../config/Database.php';

use Livriko\Config\Database;

header('Content-Type: application/json; charset=utf-8');

function webhookResponse(array $data, int $status = 200): never
{
    http_response_code($status);
    echo json_encode($data);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    webhookResponse(['success' => false, 'message' => 'Méthode non autorisée.'], 405);
}

$config = require __DIR__ . '/../config/production.php';
$raw = file_get_contents('php://input');
$payload = json_decode($raw, true);
if (!is_array($payload)) {
    webhookResponse(['success' => false, 'message' => 'Payload invalide.'], 400);
}

$eventId = trim((string)($_SERVER['HTTP_X_EVENT_ID'] ?? $payload['eventId'] ?? $payload['referenceId'] ?? ''));
$signature = (string)($_SERVER['HTTP_X_WEBHOOK_SIGNATURE'] ?? '');
$secret = (string)($config['payment']['mtn']['callback_secret'] ?? '');

if ($eventId === '') {
    webhookResponse(['success' => false, 'message' => 'Identifiant événement requis.'], 400);
}

if ($secret !== '' && ($signature === '' || !hash_equals(hash_hmac('sha256', $raw, $secret), $signature))) {
    webhookResponse(['success' => false, 'message' => 'Webhook invalide.'], 401);
}

$db = Database::getInstance();

try {
    $db->beginTransaction();

    $eventStmt = $db->prepare('INSERT INTO webhook_events (provider, event_id, signature_valid, payload) VALUES (?, ?, 1, ?)');
    try {
        $eventStmt->execute(['mtn_momo', $eventId, $raw]);
    } catch (PDOException $exception) {
        if ($exception->errorInfo[1] === 1062) {
            $db->rollBack();
            webhookResponse(['success' => true, 'duplicate' => true]);
        }
        throw $exception;
    }

    $providerTransactionId = (string)($payload['referenceId'] ?? $payload['financialTransactionId'] ?? $eventId);
    $providerStatus = strtolower((string)($payload['status'] ?? 'pending'));
    $status = match ($providerStatus) {
        'successful' => 'successful',
        'failed' => 'failed',
        'rejected', 'cancelled' => 'cancelled',
        default => 'pending',
    };

    $transactionStmt = $db->prepare('SELECT id, order_id FROM payment_transactions WHERE provider = ? AND provider_transaction_id = ? LIMIT 1');
    $transactionStmt->execute(['mtn_momo', $providerTransactionId]);
    $payment = $transactionStmt->fetch();

    if ($payment) {
        $db->prepare('UPDATE payment_transactions SET status = ?, provider_payload = ?, failure_reason = CASE WHEN ? IN (\'failed\', \'cancelled\') THEN ? ELSE failure_reason END, updated_at = NOW() WHERE id = ?')
            ->execute([$status, $raw, $status, $payload['reason'] ?? null, $payment['id']]);

        if ($status === 'successful') {
            $db->prepare('UPDATE commandes SET statut_paiement = \'paid\' WHERE id = ? AND statut_paiement <> \'paid\'')
                ->execute([$payment['order_id']]);
        }
    }

    $db->prepare('UPDATE webhook_events SET processed_at = NOW() WHERE provider = ? AND event_id = ?')->execute(['mtn_momo', $eventId]);
    $db->commit();

    webhookResponse(['success' => true]);
} catch (Throwable $exception) {
    if ($db->inTransaction()) {
        $db->rollBack();
    }
    error_log('MTN webhook error: ' . $exception->getMessage());
    webhookResponse(['success' => false, 'message' => 'Webhook non traité.'], 500);
}
