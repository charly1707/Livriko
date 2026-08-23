<?php

namespace Livriko\Controllers;

use Livriko\Config\Database;
use PDO;

class ChatController
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Database::getInstance();
        if (session_status() === PHP_SESSION_NONE) session_start();
    }

    private function requireAuth(): ?array
    {
        if (!isset($_SESSION['utilisateur'])) {
            http_response_code(401);
            header('Content-Type: application/json; charset=utf-8');
            echo json_encode(['error' => 'Unauthorized']);
            return null;
        }
        return $_SESSION['utilisateur'];
    }

    private function respondJson(array $data, int $status = 200): void
    {
        http_response_code($status);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode($data);
    }

    private function isConversationParticipant(int $conversationId, int $userId): bool
    {
        $stmt = $this->db->prepare('SELECT 1 FROM conversation_participants WHERE conversation_id = :conv AND user_id = :user LIMIT 1');
        $stmt->execute(['conv' => $conversationId, 'user' => $userId]);
        return (bool)$stmt->fetchColumn();
    }

    public function getOrCreateConversationForOrder(int $orderId)
    {
        $user = $this->requireAuth(); if (!$user) return;

        if ($orderId <= 0) {
            $this->respondJson(['error' => 'Missing order_id'], 400);
            return;
        }

        $orderStmt = $this->db->prepare(
            'SELECT c.client_id, c.restaurant_id, c.statut, u.id AS livreur_user_id
             FROM commandes c
             LEFT JOIN livraisons l ON l.commande_id = c.id
             LEFT JOIN livreurs lr ON lr.id = l.livreur_id
             LEFT JOIN utilisateurs u ON u.id = lr.utilisateur_id
             WHERE c.id = :id'
        );
        $orderStmt->execute(['id' => $orderId]);
        $order = $orderStmt->fetch();

        if (!$order) {
            $this->respondJson(['error' => 'Order not found'], 404);
            return;
        }

        $currentUserId = (int)$user['id'];
        $participants = [
            (int)$order['client_id'],
            (int)$order['restaurant_id'],
        ];
        if (!empty($order['livreur_user_id'])) {
            $participants[] = (int)$order['livreur_user_id'];
        }

        if (!in_array($currentUserId, $participants, true)) {
            $this->respondJson(['error' => 'Access denied'], 403);
            return;
        }

        $stmt = $this->db->prepare('SELECT * FROM order_conversations WHERE order_id = :order_id');
        $stmt->execute(['order_id' => $orderId]);
        $conv = $stmt->fetch();
        if ($conv) {
            if (!$this->isConversationActive((int)$conv['id'])) {
                $this->respondJson(['error' => 'Chat unavailable for current order status'], 403);
                return;
            }
            $this->syncConversationParticipants((int)$conv['id'], $order);
            $this->respondJson($conv);
            return;
        }

        if (!$this->isActiveOrderStatus($order['statut'])) {
            $this->respondJson(['error' => 'Chat unavailable for current order status'], 403);
            return;
        }

        $insert = $this->db->prepare('INSERT INTO order_conversations (order_id) VALUES (:order_id)');
        $insert->execute(['order_id' => $orderId]);
        $convId = (int)$this->db->lastInsertId();

        $this->syncConversationParticipants($convId, $order);

        $this->respondJson(['id' => $convId, 'order_id' => $orderId]);
    }

    private function addParticipantByRole(int $convId, int $userId, string $role)
    {
        $stmt = $this->db->prepare('INSERT IGNORE INTO conversation_participants (conversation_id, user_id, role) VALUES (:conv, :user, :role)');
        $stmt->execute(['conv' => $convId, 'user' => $userId, 'role' => $role]);
    }

    private function getUserRole(int $userId): ?string
    {
        $stmt = $this->db->prepare('SELECT r.code FROM utilisateurs u JOIN roles r ON u.role_id = r.id WHERE u.id = :id');
        $stmt->execute(['id' => $userId]);
        $row = $stmt->fetch();
        return $row['code'] ?? null;
    }

    private function isActiveOrderStatus(string $status): bool
    {
        return in_array($status, ['rider_assigned', 'picked_up', 'delivering'], true);
    }

    private function isConversationActive(int $conversationId): bool
    {
        $stmt = $this->db->prepare(
            'SELECT c.statut
             FROM commandes c
             JOIN order_conversations oc ON oc.order_id = c.id
             WHERE oc.id = :conv'
        );
        $stmt->execute(['conv' => $conversationId]);
        $status = $stmt->fetchColumn();
        return $status !== false && $this->isActiveOrderStatus($status);
    }

    private function syncConversationParticipants(int $convId, array $order): void
    {
        $this->addParticipantByRole($convId, (int)$order['client_id'], 'client');
        $this->addParticipantByRole($convId, (int)$order['restaurant_id'], 'restaurant');
        if (!empty($order['livreur_user_id'])) {
            $this->addParticipantByRole($convId, (int)$order['livreur_user_id'], 'livreur');
        }
    }

    public function addParticipant()
    {
        $user = $this->requireAuth(); if (!$user) return;
        $data = $_POST;
        $convId = (int)($data['conversation_id'] ?? 0);
        $userId = (int)($data['user_id'] ?? 0);
        $role = $data['role'] ?? 'livreur';
        $allowedRoles = ['client', 'restaurant', 'vendeur', 'livreur'];

        if (!$convId || !$userId) {
            $this->respondJson(['error' => 'Missing parameters'], 400);
            return;
        }

        if (!in_array($role, $allowedRoles, true)) {
            $this->respondJson(['error' => 'Role invalide'], 400);
            return;
        }

        if (!$this->isConversationParticipant($convId, (int)$user['id'])) {
            $this->respondJson(['error' => 'Access denied'], 403);
            return;
        }

        $actualRole = $this->getUserRole($userId);
        if ($actualRole === null) {
            $this->respondJson(['error' => 'User not found'], 404);
            return;
        }

        if ($actualRole !== $role) {
            $this->respondJson(['error' => 'Le rôle de l’utilisateur ne correspond pas'], 400);
            return;
        }

        $this->addParticipantByRole($convId, $userId, $role);
        $this->respondJson(['ok' => true]);
    }

    public function sendMessage()
    {
        $user = $this->requireAuth(); if (!$user) return;
        $input = $_POST;
        $convId = (int)($input['conversation_id'] ?? 0);
        $message = trim($input['message'] ?? '');
        $type = $input['message_type'] ?? 'text';
        if (!$convId || ($type !== 'image' && $message === '')) {
            $this->respondJson(['error' => 'Missing data'], 400);
            return;
        }

        if (!$this->isConversationParticipant($convId, (int)$user['id'])) {
            $this->respondJson(['error' => 'Access denied'], 403);
            return;
        }

        if (!$this->isConversationActive($convId)) {
            $this->respondJson(['error' => 'Cannot send messages for inactive order'], 403);
            return;
        }

        $stmt = $this->db->prepare('INSERT INTO conversation_messages (conversation_id, sender_id, message, message_type) VALUES (:conv, :sender, :msg, :type)');
        $stmt->execute(['conv' => $convId, 'sender' => $user['id'], 'msg' => $message, 'type' => $type]);
        $msgId = (int)$this->db->lastInsertId();

        $this->respondJson(['id' => $msgId, 'conversation_id' => $convId, 'sender_id' => $user['id'], 'message' => $message, 'message_type' => $type, 'created_at' => date('Y-m-d H:i:s')]);
    }

    public function getMessages()
    {
        $user = $this->requireAuth(); if (!$user) return;
        $convId = (int)($_GET['conversation_id'] ?? 0);
        $orderId = (int)($_GET['order_id'] ?? 0);

        if ($orderId && !$convId) {
            $stmt = $this->db->prepare('SELECT * FROM order_conversations WHERE order_id = :order_id');
            $stmt->execute(['order_id' => $orderId]);
            $conv = $stmt->fetch();
            if ($conv) {
                $convId = (int)$conv['id'];
            } else {
                $this->respondJson(['messages' => []]);
                return;
            }
        }

        if (!$convId) {
            $this->respondJson(['messages' => []]);
            return;
        }

        if (!$this->isConversationParticipant($convId, (int)$user['id'])) {
            $this->respondJson(['messages' => []], 403);
            return;
        }

        if (!$this->isConversationActive($convId)) {
            $this->respondJson(['messages' => []], 403);
            return;
        }

        $stmt = $this->db->prepare('SELECT m.*, u.nom, u.prenom, u.avatar, p.role FROM conversation_messages m JOIN utilisateurs u ON m.sender_id = u.id LEFT JOIN conversation_participants p ON p.conversation_id = m.conversation_id AND p.user_id = m.sender_id WHERE m.conversation_id = :conv ORDER BY m.created_at ASC');
        $stmt->execute(['conv' => $convId]);
        $messages = $stmt->fetchAll();
        $this->respondJson(['messages' => $messages]);
    }

    public function markRead()
    {
        $user = $this->requireAuth(); if (!$user) return;
        $convId = (int)($_POST['conversation_id'] ?? 0);
        if (!$convId) {
            $this->respondJson(['error'=>'Missing'], 400);
            return;
        }

        if (!$this->isConversationParticipant($convId, (int)$user['id'])) {
            $this->respondJson(['error'=>'Access denied'], 403);
            return;
        }

        if (!$this->isConversationActive($convId)) {
            $this->respondJson(['error'=>'Cannot mark messages for inactive order'], 403);
            return;
        }

        $stmt = $this->db->prepare('UPDATE conversation_messages SET is_read = 1 WHERE conversation_id = :conv');
        $stmt->execute(['conv' => $convId]);
        $this->respondJson(['ok' => true]);
    }

    public function uploadImage()
    {
        $user = $this->requireAuth(); if (!$user) return;
        $convId = (int)($_POST['conversation_id'] ?? 0);
        if (!$convId) {
            $this->respondJson(['error' => 'Missing conversation_id'], 400);
            return;
        }

        if (!$this->isConversationParticipant($convId, (int)$user['id'])) {
            $this->respondJson(['error' => 'Access denied'], 403);
            return;
        }

        if (!$this->isConversationActive($convId)) {
            $this->respondJson(['error' => 'Cannot upload image for inactive order'], 403);
            return;
        }

        if (empty($_FILES['image']) || $_FILES['image']['error'] !== UPLOAD_ERR_OK) {
            $this->respondJson(['error' => 'No file'], 400);
            return;
        }

        $maxSize = 5 * 1024 * 1024;
        if ($_FILES['image']['size'] > $maxSize) {
            $this->respondJson(['error' => 'File too large'], 400);
            return;
        }

        $finfo = new \finfo(FILEINFO_MIME_TYPE);
        $type = $finfo->file($_FILES['image']['tmp_name']);
        $allowed = ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp'];
        if (!isset($allowed[$type])) {
            $this->respondJson(['error' => 'Invalid type'], 400);
            return;
        }

        $dir = __DIR__ . '/../uploads/chat';
        if (!is_dir($dir)) mkdir($dir, 0755, true);
        $ext = $allowed[$type];
        $name = 'chat_' . time() . '_' . bin2hex(random_bytes(6)) . '.' . $ext;
        $dest = $dir . '/' . $name;
        if (!move_uploaded_file($_FILES['image']['tmp_name'], $dest)) {
            $this->respondJson(['error' => 'Move failed'], 500);
            return;
        }

        $url = '/backend/uploads/chat/' . $name;
        $this->respondJson(['url' => $url]);
    }
}
