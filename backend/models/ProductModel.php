<?php

namespace Livriko\Models;

use Livriko\Config\Database;
use PDO;

class ProductModel
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Database::getInstance();
    }

    public function findByRestaurantId(int $restaurantId): array
    {
        $stmt = $this->db->prepare('SELECT * FROM produits WHERE restaurant_id = :restaurant_id ORDER BY created_at DESC');
        $stmt->execute(['restaurant_id' => $restaurantId]);
        return $stmt->fetchAll();
    }

    public function findById(int $id): ?array
    {
        $stmt = $this->db->prepare('SELECT * FROM produits WHERE id = :id LIMIT 1');
        $stmt->execute(['id' => $id]);
        $product = $stmt->fetch();
        return $product ?: null;
    }

    public function findAll(): array
    {
        $stmt = $this->db->query('SELECT * FROM produits ORDER BY created_at DESC');
        return $stmt->fetchAll();
    }

    public function create(array $data): int
    {
        $stmt = $this->db->prepare(
            'INSERT INTO produits (restaurant_id, category, category_id, nom, description, prix, image, en_stock)
             VALUES (:restaurant_id, :category, :category_id, :nom, :description, :prix, :image, :en_stock)'
        );

        $stmt->execute([
            'restaurant_id' => $data['restaurant_id'],
            'category' => $data['category'] ?? null,
            'category_id' => $data['category_id'] ?? null,
            'nom' => $data['nom'],
            'description' => $data['description'] ?? null,
            'prix' => $data['prix'],
            'image' => $data['image'] ?? null,
            'en_stock' => $data['en_stock'] ? 1 : 0,
        ]);

        return (int)$this->db->lastInsertId();
    }

    public function update(int $id, array $data): bool
    {
        $stmt = $this->db->prepare(
            'UPDATE produits SET category = :category, category_id = :category_id, nom = :nom, description = :description, prix = :prix, image = :image, en_stock = :en_stock WHERE id = :id'
        );

        return $stmt->execute([
            'category' => $data['category'] ?? null,
            'category_id' => $data['category_id'] ?? null,
            'nom' => $data['nom'],
            'description' => $data['description'] ?? null,
            'prix' => $data['prix'],
            'image' => $data['image'] ?? null,
            'en_stock' => $data['en_stock'] ? 1 : 0,
            'id' => $id,
        ]);
    }

    public function delete(int $id): bool
    {
        $stmt = $this->db->prepare('DELETE FROM produits WHERE id = :id');
        return $stmt->execute(['id' => $id]);
    }
}
