<?php

namespace Livriko\Controllers;

use Livriko\Config\Database;
use PDO;

class OrderController
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Database::getInstance();
    }

    public function create(): void
    {
        $userId = $this->authenticatedUserId();
        if ($userId === null) {
            $this->json(['success' => false, 'message' => 'Non authentifié.'], 401);
            return;
        }

        $payload = $_POST ?: json_decode(file_get_contents('php://input'), true) ?: [];
        $items = $payload['items'] ?? [];
        if (is_string($items)) {
            $items = json_decode($items, true) ?: [];
        }
        if (!is_array($items)) $items = [];
        if ($items === []) {
            $this->json(['success' => false, 'message' => 'La commande ne contient aucun produit.'], 400);
            return;
        }

        $productIds = array_values(array_filter(array_map('intval', array_column($items, 'productId'))));
        if ($productIds === []) {
            $this->json(['success' => false, 'message' => 'Produits invalides.'], 400);
            return;
        }

        try {
            $placeholders = implode(',', array_fill(0, count($productIds), '?'));
            $stmt = $this->db->prepare("SELECT p.*, r.id AS restaurant_id FROM produits p JOIN restaurants r ON r.id = p.restaurant_id WHERE p.id IN ($placeholders) AND p.en_stock = 1");
            $stmt->execute($productIds);
            $products = $stmt->fetchAll();
            $byId = [];
            foreach ($products as $product) {
                $byId[(int)$product['id']] = $product;
            }

            if (count($byId) !== count(array_unique($productIds))) {
                $this->json(['success' => false, 'message' => 'Un produit est indisponible.'], 409);
                return;
            }

            $restaurantId = (int)$products[0]['restaurant_id'];
            $subtotal = 0.0;
            $normalizedItems = [];
            foreach ($items as $item) {
                $productId = (int)($item['productId'] ?? 0);
                $product = $byId[$productId] ?? null;
                $quantity = max(1, (int)($item['quantity'] ?? 1));
                if (!$product || (int)$product['restaurant_id'] !== $restaurantId) {
                    $this->json(['success' => false, 'message' => 'Tous les produits doivent provenir de la même entreprise.'], 409);
                    return;
                }
                $lineTotal = (float)$product['prix'] * $quantity;
                $subtotal += $lineTotal;
                $normalizedItems[] = [$productId, $quantity, (float)$product['prix'], $lineTotal];
            }

            $deliveryFee = max(0, (float)($payload['deliveryFee'] ?? 0));
            $total = $subtotal + $deliveryFee;
            $paymentMethod = $payload['paymentMethod'] ?? 'cash';
            $allowedPayments = ['cash', 'momo_mtn', 'momo_moov', 'orange_money', 'celtis_cash'];
            if (!in_array($paymentMethod, $allowedPayments, true)) $paymentMethod = 'cash';
            $paymentStatus = 'pending';
            $address = trim((string)($payload['clientAddress'] ?? ''));
            if ($address === '') {
                $this->json(['success' => false, 'message' => 'Adresse de livraison requise.'], 400);
                return;
            }

            $this->db->beginTransaction();
            $code = '#LVK-' . random_int(1000, 9999) . '-' . random_int(10, 99);
            $stmt = $this->db->prepare('INSERT INTO commandes (code_commande, client_id, restaurant_id, sous_total, frais_livraison, total, mode_paiement, source_paiement, statut_paiement, adresse_livraison) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
            $source = $paymentMethod === 'cash' ? 'cash' : 'direct_momo';
            $stmt->execute([$code, $userId, $restaurantId, $subtotal, $deliveryFee, $total, $paymentMethod, $source, $paymentStatus, $address]);
            $orderId = (int)$this->db->lastInsertId();

            $itemStmt = $this->db->prepare('INSERT INTO commande_produits (commande_id, produit_id, quantite, prix_unitaire, sous_total) VALUES (?, ?, ?, ?, ?)');
            foreach ($normalizedItems as [$productId, $quantity, $unitPrice, $lineTotal]) {
                $itemStmt->execute([$orderId, $productId, $quantity, $unitPrice, $lineTotal]);
            }
            $this->db->prepare('INSERT INTO livraisons (commande_id, distance_km, frais_livraison) VALUES (?, ?, ?)')->execute([$orderId, $payload['distanceKm'] ?? null, $deliveryFee]);
            $this->db->prepare('INSERT INTO historique_commandes (commande_id, statut) VALUES (?, ?)')->execute([$orderId, 'pending']);
            $this->db->commit();

            $this->json(['success' => true, 'order' => $this->findOrder($orderId)], 201);
        } catch (\Throwable $exception) {
            if ($this->db->inTransaction()) $this->db->rollBack();
            error_log('Order creation error: ' . $exception->getMessage());
            $this->json(['success' => false, 'message' => 'Impossible d’enregistrer la commande.'], 500);
        }
    }

    public function list(): void
    {
        $userId = $this->authenticatedUserId();
        if ($userId === null) {
            $this->json(['success' => false, 'message' => 'Non authentifié.'], 401);
            return;
        }
        $role = $_SESSION['utilisateur']['role'] ?? 'client';
        if ($role === 'vendeur' || $role === 'restaurant') {
            $sql = 'SELECT c.id FROM commandes c JOIN restaurants r ON r.id = c.restaurant_id WHERE r.proprietaire_id = ? ORDER BY c.date_creation DESC';
            $stmt = $this->db->prepare($sql);
            $stmt->execute([$userId]);
        } elseif ($role === 'livreur') {
            $sql = 'SELECT c.id FROM commandes c LEFT JOIN livraisons l ON l.commande_id = c.id WHERE c.statut IN (\'rider_requested\', \'rider_assigned\', \'picked_up\', \'delivering\') OR l.livreur_id = (SELECT id FROM livreurs WHERE utilisateur_id = ? LIMIT 1) ORDER BY c.date_creation DESC';
            $stmt = $this->db->prepare($sql);
            $stmt->execute([$userId]);
        } else {
            $stmt = $this->db->prepare('SELECT id FROM commandes WHERE client_id = ? ORDER BY date_creation DESC');
            $stmt->execute([$userId]);
        }
        $orders = [];
        foreach ($stmt->fetchAll(PDO::FETCH_COLUMN) as $orderId) $orders[] = $this->findOrder((int)$orderId);
        $this->json(['success' => true, 'orders' => $orders]);
    }

    public function updateStatus(): void
    {
        $userId = $this->authenticatedUserId();
        if ($userId === null) {
            $this->json(['success' => false, 'message' => 'Non authentifié.'], 401);
            return;
        }
        $payload = $_POST ?: json_decode(file_get_contents('php://input'), true) ?: [];
        $orderId = (int)($payload['orderId'] ?? 0);
        $status = (string)($payload['status'] ?? '');
        $allowed = ['confirmed', 'rider_requested', 'rider_assigned', 'picked_up', 'delivering', 'delivered', 'cancelled'];
        if ($orderId <= 0 || !in_array($status, $allowed, true)) {
            $this->json(['success' => false, 'message' => 'Commande ou statut invalide.'], 400);
            return;
        }
        $role = $_SESSION['utilisateur']['role'] ?? 'client';
        $order = $this->findOrder($orderId);
        if (!$order || ($role === 'client' && (string)$order['clientId'] !== (string)$userId)) {
            $this->json(['success' => false, 'message' => 'Accès refusé.'], 403);
            return;
        }
        $sellerStatuses = ['confirmed', 'rider_requested', 'cancelled'];
        $riderStatuses = ['rider_assigned', 'picked_up', 'delivering', 'delivered'];
        $clientStatuses = ['cancelled'];
        $allowedForRole = match ($role) {
            'vendeur', 'restaurant' => $sellerStatuses,
            'livreur' => $riderStatuses,
            'client' => $clientStatuses,
            default => array_merge($sellerStatuses, $riderStatuses, $clientStatuses),
        };
        if (!in_array($status, $allowedForRole, true)) {
            $this->json(['success' => false, 'message' => 'Ce rôle ne peut pas appliquer ce statut.'], 403);
            return;
        }
        if ($role === 'livreur' && $status === 'rider_assigned') {
            $riderStmt = $this->db->prepare('SELECT id FROM livreurs WHERE utilisateur_id = ? AND statut = \'actif\' AND documents_valide = 1 LIMIT 1');
            $riderStmt->execute([$userId]);
            $riderId = $riderStmt->fetchColumn();
            if ($riderId === false) {
                $this->json(['success' => false, 'message' => 'Votre profil livreur doit être actif et validé.'], 403);
                return;
            }
            $this->db->prepare('UPDATE livraisons SET livreur_id = ?, status = \'accepte\' WHERE commande_id = ? AND livreur_id IS NULL')->execute([(int)$riderId, $orderId]);
        }
        $deliveryStatus = match ($status) {
            'rider_requested' => 'recherche',
            'rider_assigned' => 'accepte',
            'picked_up' => 'recupere',
            'delivering' => 'en_route',
            'delivered' => 'livre',
            default => null,
        };
        if ($deliveryStatus !== null) {
            $this->db->prepare('UPDATE livraisons SET status = ?, heure_arrivee = CASE WHEN ? = \'livre\' THEN NOW() ELSE heure_arrivee END, heure_depart = CASE WHEN ? IN (\'en_route\', \'recupere\') AND heure_depart IS NULL THEN NOW() ELSE heure_depart END WHERE commande_id = ?')->execute([$deliveryStatus, $deliveryStatus, $deliveryStatus, $orderId]);
        }
        $this->db->prepare('UPDATE commandes SET statut = ? WHERE id = ?')->execute([$status, $orderId]);
        $this->db->prepare('INSERT INTO historique_commandes (commande_id, statut) VALUES (?, ?)')->execute([$orderId, $status]);
        $this->json(['success' => true, 'order' => $this->findOrder($orderId)]);
    }

    private function findOrder(int $orderId): ?array
    {
        $stmt = $this->db->prepare('SELECT c.*, r.nom AS store_name, r.adresse AS store_address, r.proprietaire_id, u.prenom, u.nom, l.status AS delivery_status, l.livreur_id, lv.utilisateur_id AS livreur_user_id FROM commandes c JOIN restaurants r ON r.id = c.restaurant_id JOIN utilisateurs u ON u.id = c.client_id LEFT JOIN livraisons l ON l.commande_id = c.id LEFT JOIN livreurs lv ON lv.id = l.livreur_id WHERE c.id = ? LIMIT 1');
        $stmt->execute([$orderId]);
        $row = $stmt->fetch();
        if (!$row) return null;
        $itemStmt = $this->db->prepare('SELECT cp.produit_id, cp.quantite, cp.prix_unitaire, cp.sous_total, p.nom FROM commande_produits cp JOIN produits p ON p.id = cp.produit_id WHERE cp.commande_id = ?');
        $itemStmt->execute([$orderId]);
        $items = array_map(static fn(array $item) => [
            'productId' => (string)$item['produit_id'], 'productName' => $item['nom'], 'unitPrice' => (float)$item['prix_unitaire'], 'quantity' => (int)$item['quantite'], 'subtotal' => (float)$item['sous_total'],
        ], $itemStmt->fetchAll());
        return [
            'id' => 'ord-' . $row['id'], 'databaseId' => (int)$row['id'], 'code' => $row['code_commande'], 'clientId' => (string)$row['client_id'],
            'clientName' => trim($row['prenom'] . ' ' . $row['nom']), 'clientAddress' => $row['adresse_livraison'], 'storeId' => 'store-' . $row['proprietaire_id'], 'storeName' => $row['store_name'], 'storeAddress' => $row['store_address'],
            'items' => $items, 'subtotal' => (float)$row['sous_total'], 'deliveryFee' => (float)$row['frais_livraison'], 'totalAmount' => (float)$row['total'], 'status' => $row['statut'], 'paymentMethod' => $row['mode_paiement'], 'paymentStatus' => $row['statut_paiement'], 'createdAt' => $row['date_creation'], 'deliveryStatus' => $row['delivery_status'], 'riderId' => $row['livreur_user_id'] ? (string)$row['livreur_user_id'] : null,
        ];
    }

    private function authenticatedUserId(): ?int
    {
        return isset($_SESSION['utilisateur']['id']) ? (int)$_SESSION['utilisateur']['id'] : null;
    }

    private function json(array $data, int $status = 200): void
    {
        http_response_code($status);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode($data);
        exit();
    }
}