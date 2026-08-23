<?php
namespace Livriko\Controllers;

use Livriko\Config\Database;
use Livriko\Models\ReviewModel;

class ReviewController
{
    private $db;
    private $model;

    public function __construct()
    {
        $this->db = Database::getInstance();
        $this->model = new ReviewModel();
        if (session_status() === PHP_SESSION_NONE) session_start();
    }

    public function create(): void
    {
        header('Content-Type: application/json; charset=utf-8');
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
            return;
        }

        $user = $_SESSION['utilisateur'] ?? null;
        if (!$user) {
            http_response_code(401);
            echo json_encode(['error' => 'Authentification requise']);
            return;
        }

        $orderId = intval($_POST['order_id'] ?? 0);
        $rating = intval($_POST['rating'] ?? 0);
        $comment = trim($_POST['comment'] ?? '');
        $reasons = isset($_POST['reasons']) ? json_decode($_POST['reasons'], true) : [];

        if ($rating < 1 || $rating > 5) {
            http_response_code(400);
            echo json_encode(['error' => 'Rating must be between 1 and 5']);
            return;
        }

        // Verify order exists and belongs to this client and is delivered
        $stmt = $this->db->prepare('SELECT c.*, l.livreur_id AS livraison_livreur_id, lv.utilisateur_id AS livreur_user_id FROM commandes c LEFT JOIN livraisons l ON l.commande_id = c.id LEFT JOIN livreurs lv ON lv.id = l.livreur_id WHERE c.id = :oid');
        $stmt->execute([':oid' => $orderId]);
        $order = $stmt->fetch();
        if (!$order) {
            http_response_code(404);
            echo json_encode(['error' => 'Commande introuvable']);
            return;
        }
        if (intval($order['client_id']) !== intval($user['id'])) {
            http_response_code(403);
            echo json_encode(['error' => 'Vous ne pouvez évaluer que vos propres commandes']);
            return;
        }
        if (($order['statut'] ?? '') !== 'delivered') {
            http_response_code(400);
            echo json_encode(['error' => 'La commande n\'est pas marquée comme livrée']);
            return;
        }

        if ($this->model->existsForOrder($orderId)) {
            http_response_code(409);
            echo json_encode(['error' => 'Cette commande a déjà été évaluée']);
            return;
        }

        $deliveryUserId = $order['livreur_user_id'] ?? null;
        if (!$deliveryUserId) {
            http_response_code(400);
            echo json_encode(['error' => 'Aucun livreur associé à cette commande']);
            return;
        }

        $data = [
            'order_id' => $orderId,
            'client_id' => intval($user['id']),
            'delivery_person_id' => intval($deliveryUserId),
            'rating' => $rating,
            'comment' => $comment ?: null,
            'reasons' => $reasons,
        ];

        try {
            $created = $this->model->create($data);

            // After creating, check stats and alert admins if necessary
            $stats = $this->model->getStatsForDriver($data['delivery_person_id']);
            if (($stats['average'] ?? 0) < 3) {
                // find admin role id
                $rstmt = $this->db->prepare('SELECT id FROM roles WHERE code = :code LIMIT 1');
                $rstmt->execute([':code' => 'administrateur']);
                $roleRow = $rstmt->fetch();
                if ($roleRow) {
                    $roleId = intval($roleRow['id']);
                    $ustmt = $this->db->prepare('SELECT id FROM utilisateurs WHERE role_id = :rid');
                    $ustmt->execute([':rid' => $roleId]);
                    $admins = $ustmt->fetchAll();
                    foreach ($admins as $a) {
                        $nstmt = $this->db->prepare('INSERT INTO notifications (utilisateur_id, titre, message) VALUES (:uid, :titre, :message)');
                        $nstmt->execute([
                            ':uid' => intval($a['id']),
                            ':titre' => 'Attention : livreur mal noté',
                            ':message' => sprintf('Le livreur ID %d a une note moyenne de %s (<3). Veuillez examiner les évaluations.', $data['delivery_person_id'], $stats['average']),
                        ]);
                    }
                }
            }

            // Check reports count
            $rps = $this->db->prepare('SELECT COUNT(*) AS c FROM delivery_reports WHERE delivery_person_id = :did');
            $rps->execute([':did' => $data['delivery_person_id']]);
            $rc = $rps->fetch();
            if (intval($rc['c'] ?? 0) >= 3) {
                // notify admins about multiple reports
                $rstmt = $this->db->prepare('SELECT id FROM roles WHERE code = :code LIMIT 1');
                $rstmt->execute([':code' => 'administrateur']);
                $roleRow = $rstmt->fetch();
                if ($roleRow) {
                    $roleId = intval($roleRow['id']);
                    $ustmt = $this->db->prepare('SELECT id FROM utilisateurs WHERE role_id = :rid');
                    $ustmt->execute([':rid' => $roleId]);
                    $admins = $ustmt->fetchAll();
                    foreach ($admins as $a) {
                        $nstmt = $this->db->prepare('INSERT INTO notifications (utilisateur_id, titre, message) VALUES (:uid, :titre, :message)');
                        $nstmt->execute([
                            ':uid' => intval($a['id']),
                            ':titre' => 'Alerte : plusieurs signalements',
                            ':message' => sprintf('Plusieurs signalements (%d) ont été enregistrés pour le livreur ID %d.', intval($rc['c'] ?? 0), $data['delivery_person_id']),
                        ]);
                    }
                }
            }

            echo json_encode(['success' => true, 'review' => $created]);
        } catch (\Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Impossible de créer l\'évaluation']);
        }
    }

    public function listForDriver(): void
    {
        header('Content-Type: application/json; charset=utf-8');
        $driverId = intval($_GET['driver_id'] ?? 0);
        if (!$driverId) {
            http_response_code(400);
            echo json_encode(['error' => 'driver_id requis']);
            return;
        }
        $results = $this->model->getByDriver($driverId);
        $stats = $this->model->getStatsForDriver($driverId);
        echo json_encode(['success' => true, 'reviews' => $results, 'stats' => $stats]);
    }

    public function adminList(): void
    {
        header('Content-Type: application/json; charset=utf-8');
        $user = $_SESSION['utilisateur'] ?? null;
        if (!$user || ($user['role'] ?? '') !== 'administrateur') {
            http_response_code(403);
            echo json_encode(['error' => 'Accès admin requis']);
            return;
        }
        $filters = [];
        if (!empty($_GET['driver_id'])) $filters['driver_id'] = intval($_GET['driver_id']);
        if (!empty($_GET['rating'])) $filters['rating'] = intval($_GET['rating']);
        if (!empty($_GET['order_id'])) $filters['order_id'] = intval($_GET['order_id']);
        if (!empty($_GET['reported'])) $filters['reported'] = boolval($_GET['reported']);

        $list = $this->model->listAll($filters);
        echo json_encode(['success' => true, 'reviews' => $list]);
    }

    public function createReport(): void
    {
        header('Content-Type: application/json; charset=utf-8');
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') { http_response_code(405); echo json_encode(['error'=>'Method not allowed']); return; }
        $user = $_SESSION['utilisateur'] ?? null;
        if (!$user) { http_response_code(401); echo json_encode(['error'=>'Authentification requise']); return; }

        $orderId = intval($_POST['order_id'] ?? 0);
        $reason = trim($_POST['reason'] ?? '');
        $description = trim($_POST['description'] ?? '');

        if (!$orderId || !$reason) { http_response_code(400); echo json_encode(['error'=>'order_id et reason requis']); return; }

        $stmt = $this->db->prepare('SELECT c.*, l.livreur_id AS livraison_livreur_id, lv.utilisateur_id AS livreur_user_id FROM commandes c LEFT JOIN livraisons l ON l.commande_id = c.id LEFT JOIN livreurs lv ON lv.id = l.livreur_id WHERE c.id = :oid');
        $stmt->execute([':oid' => $orderId]);
        $order = $stmt->fetch();
        if (!$order) { http_response_code(404); echo json_encode(['error'=>'Commande introuvable']); return; }
        if (intval($order['client_id']) !== intval($user['id'])) { http_response_code(403); echo json_encode(['error'=>'Vous ne pouvez signaler que vos propres commandes']); return; }

        $deliveryUserId = $order['livreur_user_id'] ?? null;
        if (!$deliveryUserId) { http_response_code(400); echo json_encode(['error'=>'Aucun livreur associé à cette commande']); return; }

        $stmt = $this->db->prepare('INSERT INTO delivery_reports (order_id, client_id, delivery_person_id, reason, description) VALUES (:order_id, :client_id, :delivery_person_id, :reason, :description)');
        $stmt->execute([
            ':order_id' => $orderId,
            ':client_id' => intval($user['id']),
            ':delivery_person_id' => intval($deliveryUserId),
            ':reason' => $reason,
            ':description' => $description ?: null,
        ]);

        echo json_encode(['success' => true, 'report_id' => intval($this->db->lastInsertId())]);
    }
}
