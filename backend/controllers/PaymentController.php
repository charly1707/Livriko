<?php

namespace Livriko\Controllers;

use Livriko\Config\Database;
use Livriko\Services\MtnMomoProvider;
use PDO;
use RuntimeException;

class PaymentController
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Database::getInstance();
    }

    public function createTransaction(): void
    {
        $userId = $this->userId();
        if ($userId === null) {
            $this->json(['success' => false, 'message' => 'Non authentifié.'], 401);
            return;
        }

        $payload = $_POST ?: json_decode(file_get_contents('php://input'), true) ?: [];
        $orderId = (int)($payload['orderId'] ?? 0);
        $phone = trim((string)($payload['phone'] ?? ''));
        $providerName = strtolower(trim((string)($payload['provider'] ?? '')));
        $idempotencyKey = trim((string)($payload['idempotencyKey'] ?? ''));

        if ($orderId <= 0 || $phone === '' || $idempotencyKey === '') {
            $this->json(['success' => false, 'message' => 'Commande, téléphone et clé d’idempotence requis.'], 400);
            return;
        }

        $orderStmt = $this->db->prepare('SELECT id, total, client_id, statut_paiement FROM commandes WHERE id = ? LIMIT 1');
        $orderStmt->execute([$orderId]);
        $order = $orderStmt->fetch();

        if (!$order || (int)$order['client_id'] !== $userId) {
            $this->json(['success' => false, 'message' => 'Commande introuvable ou accès refusé.'], 403);
            return;
        }

        if ($order['statut_paiement'] === 'paid' || $order['statut_paiement'] === 'successful') {
            $this->json(['success' => false, 'message' => 'Cette commande est déjà payée.'], 409);
            return;
        }

        try {
            $config = require __DIR__ . '/../config/production.php';
            $providerName = $providerName ?: strtolower((string)$config['payment']['provider']);
            if ($providerName !== 'mtn_momo') {
                throw new RuntimeException('Aucun fournisseur Mobile Money officiellement configuré pour ce canal.');
            }

            $existing = $this->db->prepare('SELECT * FROM payment_transactions WHERE idempotency_key = ? LIMIT 1');
            $existing->execute([$idempotencyKey]);
            if ($transaction = $existing->fetch()) {
                $this->json(['success' => true, 'transaction' => $this->publicTransaction($transaction)]);
                return;
            }

            $reference = $this->uuid();
            $provider = new MtnMomoProvider($config['payment']['mtn']);
            $result = $provider->requestPayment($reference, (float)$order['total'], $config['payment']['currency'], $phone);

            $stmt = $this->db->prepare('INSERT INTO payment_transactions (order_id, user_id, provider, provider_transaction_id, idempotency_key, customer_phone, amount, currency, status, provider_payload) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
            $stmt->execute([
                $orderId,
                $userId,
                $providerName,
                $result['providerTransactionId'],
                $idempotencyKey,
                $phone,
                $order['total'],
                $config['payment']['currency'],
                $result['status'],
                json_encode($result['raw'])
            ]);

            $this->json([
                'success' => true,
                'transaction' => $this->publicTransaction([
                    'id' => (int)$this->db->lastInsertId(),
                    'provider' => $providerName,
                    'provider_transaction_id' => $reference,
                    'amount' => $order['total'],
                    'currency' => $config['payment']['currency'],
                    'status' => 'pending',
                ]),
            ], 201);
        } catch (\Throwable $exception) {
            $this->json(['success' => false, 'message' => $exception->getMessage()], 503);
        }
    }

    public function status(): void
    {
        $userId = $this->userId();
        if ($userId === null) {
            $this->json(['success' => false, 'message' => 'Non authentifié.'], 401);
            return;
        }

        $transactionId = (int)($_GET['transactionId'] ?? 0);
        $stmt = $this->db->prepare('SELECT * FROM payment_transactions WHERE id = ? AND user_id = ? LIMIT 1');
        $stmt->execute([$transactionId, $userId]);
        $transaction = $stmt->fetch();

        if (!$transaction) {
            $this->json(['success' => false, 'message' => 'Transaction introuvable.'], 404);
            return;
        }

        $this->json(['success' => true, 'transaction' => $this->publicTransaction($transaction)]);
    }

    private function publicTransaction(array $transaction): array
    {
        return [
            'id' => (int)($transaction['id'] ?? 0),
            'provider' => $transaction['provider'] ?? null,
            'providerTransactionId' => $transaction['provider_transaction_id'] ?? null,
            'amount' => (float)($transaction['amount'] ?? 0),
            'currency' => $transaction['currency'] ?? 'XOF',
            'status' => $transaction['status'] ?? 'pending',
        ];
    }

    private function userId(): ?int
    {
        return isset($_SESSION['utilisateur']['id']) ? (int)$_SESSION['utilisateur']['id'] : null;
    }

    private function uuid(): string
    {
        return bin2hex(random_bytes(16));
    }

    private function json(array $data, int $status = 200): void
    {
        http_response_code($status);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode($data);
        exit();
    }
}
