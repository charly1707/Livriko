<?php
namespace Livriko\Models;

use Livriko\Config\Database;
use PDO;

class ReviewModel
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Database::getInstance();
    }

    public function existsForOrder(int $orderId): bool
    {
        $stmt = $this->db->prepare('SELECT COUNT(*) as c FROM reviews WHERE order_id = :oid');
        $stmt->execute([':oid' => $orderId]);
        $row = $stmt->fetch();
        return intval($row['c']) > 0;
    }

    public function create(array $data): array
    {
        $stmt = $this->db->prepare('INSERT INTO reviews (order_id, client_id, delivery_person_id, rating, comment, reasons) VALUES (:order_id, :client_id, :delivery_person_id, :rating, :comment, :reasons)');
        $stmt->execute([
            ':order_id' => $data['order_id'],
            ':client_id' => $data['client_id'],
            ':delivery_person_id' => $data['delivery_person_id'],
            ':rating' => $data['rating'],
            ':comment' => $data['comment'] ?? null,
            ':reasons' => isset($data['reasons']) ? json_encode($data['reasons'], JSON_UNESCAPED_UNICODE) : null,
        ]);
        $id = (int)$this->db->lastInsertId();
        return $this->findById($id);
    }

    public function findById(int $id): array
    {
        $stmt = $this->db->prepare('SELECT * FROM reviews WHERE id = :id');
        $stmt->execute([':id' => $id]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return $row ?: [];
    }

    public function getByDriver(int $deliveryUserId): array
    {
        $stmt = $this->db->prepare('SELECT r.*, u.nom AS client_nom, u.prenom AS client_prenom FROM reviews r JOIN utilisateurs u ON u.id = r.client_id WHERE r.delivery_person_id = :did ORDER BY r.created_at DESC');
        $stmt->execute([':did' => $deliveryUserId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function getStatsForDriver(int $deliveryUserId): array
    {
        $stmt = $this->db->prepare('SELECT COUNT(*) AS total, AVG(rating) AS average, SUM(CASE WHEN rating<=2 THEN 1 ELSE 0 END) AS negative_count FROM reviews WHERE delivery_person_id = :did');
        $stmt->execute([':did' => $deliveryUserId]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return [
            'total' => intval($row['total'] ?? 0),
            'average' => $row['average'] !== null ? round(floatval($row['average']), 2) : 0,
            'negative_count' => intval($row['negative_count'] ?? 0),
        ];
    }

    public function listAll(array $filters = []): array
    {
        $sql = 'SELECT r.*, c.code_commande, cu.nom AS client_nom, cu.prenom AS client_prenom, du.nom AS driver_nom, du.prenom AS driver_prenom FROM reviews r JOIN commandes c ON c.id = r.order_id JOIN utilisateurs cu ON cu.id = r.client_id JOIN utilisateurs du ON du.id = r.delivery_person_id';
        $conds = [];
        $params = [];
        if (!empty($filters['driver_id'])) {
            $conds[] = 'r.delivery_person_id = :driver_id';
            $params[':driver_id'] = $filters['driver_id'];
        }
        if (!empty($filters['rating'])) {
            $conds[] = 'r.rating = :rating';
            $params[':rating'] = $filters['rating'];
        }
        if (!empty($filters['order_id'])) {
            $conds[] = 'r.order_id = :order_id';
            $params[':order_id'] = $filters['order_id'];
        }
        if (!empty($filters['reported'])) {
            // join with delivery_reports
            $sql .= ' LEFT JOIN delivery_reports dr ON dr.order_id = r.order_id';
            $conds[] = 'dr.id IS NOT NULL';
        }
        if (!empty($conds)) {
            $sql .= ' WHERE ' . implode(' AND ', $conds);
        }
        $sql .= ' ORDER BY r.created_at DESC';
        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
}
