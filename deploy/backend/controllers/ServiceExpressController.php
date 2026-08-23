<?php

namespace Livriko\Controllers;

use Livriko\Config\Database;
use PDO;

class ServiceExpressController
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Database::getInstance();
    }

    public function create(): void
    {
        $clientId = $this->userId();
        if ($clientId === null) {
            $this->json(['success' => false, 'message' => 'Non authentifié.'], 401);
            return;
        }
        $payload = $_POST ?: json_decode(file_get_contents('php://input'), true) ?: [];
        $required = ['type', 'description', 'fromAddress', 'toAddress', 'distanceKm', 'fee'];
        foreach ($required as $field) {
            if (trim((string)($payload[$field] ?? '')) === '') {
                $this->json(['success' => false, 'message' => 'Informations de mission incomplètes.'], 400);
                return;
            }
        }
        $distance = (float)$payload['distanceKm'];
        $fee = (float)$payload['fee'];
        if ($distance <= 0 || $fee < 300) {
            $this->json(['success' => false, 'message' => 'Distance ou tarif invalide.'], 400);
            return;
        }

        try {
            $this->db->beginTransaction();
            $stmt = $this->db->prepare('INSERT INTO service_express_missions (client_id, type_service, description, depart_nom, depart_adresse, depart_telephone, depart_notes, destination_nom, destination_adresse, destination_telephone, destination_notes, details_json, distance_km, frais_service, statut) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
            $details = $payload['details'] ?? [];
            if (is_string($details)) $details = json_decode($details, true) ?: [];
            $stmt->execute([
                $clientId, $payload['type'], $payload['description'], $payload['fromName'] ?? null, $payload['fromAddress'], $payload['fromPhone'] ?? null, $payload['fromNotes'] ?? null,
                $payload['toName'] ?? null, $payload['toAddress'], $payload['toPhone'] ?? null, $payload['toNotes'] ?? null, json_encode($details), $distance, $fee, 'searching',
            ]);
            $missionId = (int)$this->db->lastInsertId();
            $this->db->prepare('INSERT INTO historique_service_express (mission_id, statut) VALUES (?, ?)')->execute([$missionId, 'searching']);
            $this->db->commit();
            $this->json(['success' => true, 'mission' => $this->find($missionId)], 201);
        } catch (\Throwable $exception) {
            if ($this->db->inTransaction()) $this->db->rollBack();
            error_log('Service Express creation error: ' . $exception->getMessage());
            $this->json(['success' => false, 'message' => 'Impossible d’enregistrer la mission.'], 500);
        }
    }

    public function list(): void
    {
        $userId = $this->userId();
        if ($userId === null) {
            $this->json(['success' => false, 'message' => 'Non authentifié.'], 401);
            return;
        }
        $role = $_SESSION['utilisateur']['role'] ?? 'client';
        if ($role === 'livreur') {
            $stmt = $this->db->query("SELECT id FROM service_express_missions WHERE statut IN ('searching','assigned','to_pickup','picked_up','delivering') ORDER BY date_creation DESC");
        } else {
            $stmt = $this->db->prepare('SELECT id FROM service_express_missions WHERE client_id = ? ORDER BY date_creation DESC');
            $stmt->execute([$userId]);
        }
        $missions = array_map(fn($id) => $this->find((int)$id), $stmt->fetchAll(PDO::FETCH_COLUMN));
        $this->json(['success' => true, 'missions' => $missions]);
    }

    public function updateStatus(): void
    {
        $userId = $this->userId();
        if ($userId === null) {
            $this->json(['success' => false, 'message' => 'Non authentifié.'], 401);
            return;
        }
        $payload = $_POST ?: json_decode(file_get_contents('php://input'), true) ?: [];
        $missionId = (int)($payload['missionId'] ?? 0);
        $status = (string)($payload['status'] ?? '');
        $allowed = ['assigned', 'to_pickup', 'picked_up', 'delivering', 'delivered', 'completed', 'cancelled'];
        if ($missionId <= 0 || !in_array($status, $allowed, true)) {
            $this->json(['success' => false, 'message' => 'Mission ou statut invalide.'], 400);
            return;
        }
        $mission = $this->find($missionId);
        $role = $_SESSION['utilisateur']['role'] ?? 'client';
        if (!$mission || ($role === 'client' && (string)$mission['clientId'] !== (string)$userId)) {
            $this->json(['success' => false, 'message' => 'Accès refusé.'], 403);
            return;
        }
        if ($role !== 'livreur' && !($role === 'client' && $status === 'cancelled')) {
            $this->json(['success' => false, 'message' => 'Seul un livreur peut faire avancer cette mission.'], 403);
            return;
        }
        if ($role === 'livreur' && $status === 'assigned') {
            $this->db->prepare('UPDATE service_express_missions SET livreur_id = (SELECT id FROM livreurs WHERE utilisateur_id = ? LIMIT 1) WHERE id = ?')->execute([$userId, $missionId]);
        }
        $this->db->prepare('UPDATE service_express_missions SET statut = ?, date_completion = CASE WHEN ? = \'completed\' THEN NOW() ELSE date_completion END WHERE id = ?')->execute([$status, $status, $missionId]);
        $this->db->prepare('INSERT INTO historique_service_express (mission_id, statut) VALUES (?, ?)')->execute([$missionId, $status]);
        $this->json(['success' => true, 'mission' => $this->find($missionId)]);
    }

    private function find(int $id): ?array
    {
        $stmt = $this->db->prepare('SELECT m.*, u.prenom, u.nom, u.telephone, l.vehicule FROM service_express_missions m JOIN utilisateurs u ON u.id = m.client_id LEFT JOIN livreurs l ON l.id = m.livreur_id WHERE m.id = ? LIMIT 1');
        $stmt->execute([$id]);
        $row = $stmt->fetch();
        if (!$row) return null;
        return [
            'id' => (int)$row['id'], 'clientId' => (int)$row['client_id'], 'livreurId' => $row['livreur_id'] ? (int)$row['livreur_id'] : null,
            'type' => $row['type_service'], 'description' => $row['description'], 'fromName' => $row['depart_nom'], 'fromAddress' => $row['depart_adresse'], 'fromPhone' => $row['depart_telephone'], 'fromNotes' => $row['depart_notes'],
            'toName' => $row['destination_nom'], 'toAddress' => $row['destination_adresse'], 'toPhone' => $row['destination_telephone'], 'toNotes' => $row['destination_notes'], 'details' => json_decode($row['details_json'] ?: '{}', true),
            'distanceKm' => (float)$row['distance_km'], 'fee' => (float)$row['frais_service'], 'status' => $row['statut'], 'createdAt' => $row['date_creation'], 'completedAt' => $row['date_completion'], 'clientName' => trim($row['prenom'] . ' ' . $row['nom']), 'clientPhone' => $row['telephone'], 'vehicle' => $row['vehicule'],
        ];
    }

    private function userId(): ?int { return isset($_SESSION['utilisateur']['id']) ? (int)$_SESSION['utilisateur']['id'] : null; }
    private function json(array $data, int $status = 200): void { http_response_code($status); header('Content-Type: application/json; charset=utf-8'); echo json_encode($data); exit(); }
}