<?php

namespace Livriko\Models;

use Livriko\Config\Database;
use PDO;

class RestaurantModel
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Database::getInstance();
    }

    public function findByOwnerId(int $ownerId): ?array
    {
        $stmt = $this->db->prepare('SELECT * FROM restaurants WHERE proprietaire_id = :owner_id LIMIT 1');
        $stmt->execute(['owner_id' => $ownerId]);
        $restaurant = $stmt->fetch();
        return $restaurant ?: null;
    }

    public function findById(int $id): ?array
    {
        $stmt = $this->db->prepare('SELECT * FROM restaurants WHERE id = :id LIMIT 1');
        $stmt->execute(['id' => $id]);
        $restaurant = $stmt->fetch();
        return $restaurant ?: null;
    }

    public function findAll(): array
    {
        $stmt = $this->db->query('SELECT * FROM restaurants ORDER BY id DESC');
        return $stmt->fetchAll();
    }

    public function createRestaurant(int $ownerId, string $name, string $address, string $city, string $phone, ?string $logo = null, ?int $categoryId = null): int
    {
        $stmt = $this->db->prepare(
            'INSERT INTO restaurants (proprietaire_id, category_id, nom, adresse, ville, telephone, logo, statut, est_certifie)
             VALUES (:owner_id, :category_id, :nom, :adresse, :ville, :telephone, :logo, :statut, :est_certifie)'
        );

        $stmt->execute([
            'owner_id' => $ownerId,
            'category_id' => $categoryId,
            'nom' => $name,
            'adresse' => $address,
            'ville' => $city,
            'telephone' => $phone,
            'logo' => $logo,
            'statut' => 'approuve',
            'est_certifie' => 0,
        ]);

        return (int)$this->db->lastInsertId();
    }
}
