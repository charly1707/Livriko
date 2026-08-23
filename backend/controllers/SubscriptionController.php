<?php

namespace Livriko\Controllers;

use Livriko\Config\Database;
use PDO;

class SubscriptionController
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Database::getInstance();
    }

    public function subscribe(): void
    {
        $payload = $_POST ?: json_decode(file_get_contents('php://input'), true) ?: [];
        $contact = trim((string)($payload['contact'] ?? ''));

        if ($contact === '') {
            $this->respond(['success' => false, 'message' => 'Un e-mail ou un numéro WhatsApp est requis.'], 400);
            return;
        }

        $normalizedContact = $this->normalizeContact($contact);
        $contactType = filter_var($normalizedContact, FILTER_VALIDATE_EMAIL) ? 'email' : 'whatsapp';

        if ($contactType === 'whatsapp' && !preg_match('/^\+?[0-9][0-9\s().-]{7,24}$/', $normalizedContact)) {
            $this->respond(['success' => false, 'message' => 'Indiquez un e-mail ou un numéro WhatsApp valide.'], 422);
            return;
        }

        try {
            $stmt = $this->db->prepare(
                'INSERT INTO newsletter_subscribers (contact, contact_type, status) VALUES (:contact, :contact_type, \'active\')
                 ON DUPLICATE KEY UPDATE status = \'active\', updated_at = CURRENT_TIMESTAMP'
            );
            $stmt->execute([
                'contact' => $normalizedContact,
                'contact_type' => $contactType,
            ]);

            $this->respond(['success' => true, 'message' => 'Inscription enregistrée.']);
        } catch (\Throwable $exception) {
            error_log('Subscription error: ' . $exception->getMessage());
            $this->respond(['success' => false, 'message' => 'Inscription indisponible pour le moment.'], 503);
        }
    }

    private function normalizeContact(string $contact): string
    {
        if (filter_var($contact, FILTER_VALIDATE_EMAIL)) {
            return strtolower($contact);
        }

        return preg_replace('/\s+/', ' ', $contact) ?? $contact;
    }

    private function respond(array $payload, int $status = 200): void
    {
        http_response_code($status);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode($payload);
    }
}