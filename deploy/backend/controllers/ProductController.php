<?php

namespace Livriko\Controllers;

use Livriko\Models\ProductModel;
use Livriko\Models\RestaurantModel;
use Livriko\Models\UserModel;

class ProductController
{
    private ProductModel $productModel;
    private RestaurantModel $restaurantModel;
    private UserModel $userModel;

    public function __construct()
    {
        $this->productModel = new ProductModel();
        $this->restaurantModel = new RestaurantModel();
        $this->userModel = new UserModel();
    }

    public function listProducts(): void
    {
        $ownerId = $this->getAuthenticatedUserId();
        if ($ownerId === null) {
            $this->respondJson(['error' => 'Non authentifié'], 401);
            return;
        }

        $restaurant = $this->restaurantModel->findByOwnerId($ownerId);
        if (!$restaurant) {
            $this->respondJson(['error' => 'Restaurant introuvable'], 404);
            return;
        }

        $products = $this->productModel->findByRestaurantId((int)$restaurant['id']);
        $this->respondJson(['products' => $products]);
    }

    public function listAllProducts(): void
    {
        $products = $this->productModel->findAll();
        $restaurants = $this->restaurantModel->findAll();
        $restaurantMap = [];
        foreach ($restaurants as $restaurant) {
            $restaurantMap[(int)$restaurant['id']] = $restaurant;
        }

        $mapped = array_map(function ($product) use ($restaurantMap) {
            $restaurant = $restaurantMap[(int)$product['restaurant_id']] ?? null;
            return array_merge($product, [
                'store_id' => $restaurant ? 'store-' . $restaurant['proprietaire_id'] : null,
                'store_name' => $restaurant ? $restaurant['nom'] : 'Restaurant',
            ]);
        }, $products);

        $this->respondJson(['products' => $mapped]);
    }

    public function createProduct(): void
    {
        $ownerId = $this->getAuthenticatedUserId();
        if ($ownerId === null) {
            $this->respondJson(['error' => 'Non authentifié'], 401);
            return;
        }

        $restaurant = $this->restaurantModel->findByOwnerId($ownerId);
        if (!$restaurant) {
            $this->respondJson(['error' => 'Restaurant introuvable'], 404);
            return;
        }

        $data = [
            'restaurant_id' => (int)$restaurant['id'],
                'category' => trim($_POST['category'] ?? ''),
                'category_id' => isset($_POST['category_id']) && is_numeric($_POST['category_id']) ? (int)$_POST['category_id'] : null,
            'nom' => trim($_POST['nom'] ?? ''),
            'description' => trim($_POST['description'] ?? ''),
            'prix' => isset($_POST['prix']) ? floatval($_POST['prix']) : 0.0,
            'image' => trim($_POST['image'] ?? ''),
                'en_stock' => !isset($_POST['en_stock']) || filter_var($_POST['en_stock'], FILTER_VALIDATE_BOOLEAN),
        ];

        if (empty($data['nom']) || $data['prix'] <= 0) {
            $this->respondJson(['error' => 'Nom du produit et prix valides requis.'], 400);
            return;
        }

        $productId = $this->productModel->create($data);
        $product = $this->productModel->findById($productId);

        $this->respondJson(['success' => true, 'product' => $product], 201);
    }

    public function updateProduct(): void
    {
        $ownerId = $this->getAuthenticatedUserId();
        if ($ownerId === null) {
            $this->respondJson(['error' => 'Non authentifié'], 401);
            return;
        }

        $productId = isset($_POST['id']) ? (int)$_POST['id'] : 0;
        if ($productId <= 0) {
            $this->respondJson(['error' => 'ID produit invalide'], 400);
            return;
        }

        $product = $this->productModel->findById($productId);
        if (!$product) {
            $this->respondJson(['error' => 'Produit introuvable'], 404);
            return;
        }

        $restaurant = $this->restaurantModel->findByOwnerId($ownerId);
        if (!$restaurant || (int)$restaurant['id'] !== (int)$product['restaurant_id']) {
            $this->respondJson(['error' => 'Accès refusé'], 403);
            return;
        }

        $data = [
            'category' => trim($_POST['category'] ?? ''),
            'category_id' => isset($_POST['category_id']) && is_numeric($_POST['category_id']) ? (int)$_POST['category_id'] : null,
            'nom' => trim($_POST['nom'] ?? ''),
            'description' => trim($_POST['description'] ?? ''),
            'prix' => isset($_POST['prix']) ? floatval($_POST['prix']) : 0.0,
            'image' => trim($_POST['image'] ?? ''),
            'en_stock' => !isset($_POST['en_stock']) || filter_var($_POST['en_stock'], FILTER_VALIDATE_BOOLEAN),
        ];

        if (empty($data['nom']) || $data['prix'] <= 0) {
            $this->respondJson(['error' => 'Nom du produit et prix valides requis.'], 400);
            return;
        }

        $this->productModel->update($productId, $data);
        $updatedProduct = $this->productModel->findById($productId);

        $this->respondJson(['success' => true, 'product' => $updatedProduct]);
    }

    public function uploadImage(): void
    {
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            $this->respondJson(['error' => 'Méthode non autorisée'], 405);
            return;
        }

        $ownerId = $this->getAuthenticatedUserId();
        if ($ownerId === null) {
            $this->respondJson(['error' => 'Non authentifié'], 401);
            return;
        }

        $role = $_SESSION['utilisateur']['role'] ?? '';
        if (!in_array($role, ['restaurant', 'vendeur'], true) || !$this->restaurantModel->findByOwnerId($ownerId)) {
            $this->respondJson(['error' => 'Accès réservé aux vendeurs authentifiés'], 403);
            return;
        }

        if (empty($_FILES['image']) || $_FILES['image']['error'] !== UPLOAD_ERR_OK) {
            $this->respondJson(['error' => 'Aucune image sélectionnée ou upload interrompu'], 400);
            return;
        }

        $maxSize = 2 * 1024 * 1024;
        if ($_FILES['image']['size'] > $maxSize) {
            $this->respondJson(['error' => 'L’image dépasse la taille maximale de 2 Mo'], 400);
            return;
        }

        $finfo = new \finfo(FILEINFO_MIME_TYPE);
        $type = $finfo->file($_FILES['image']['tmp_name']);
        $allowed = ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp'];

        if (!isset($allowed[$type])) {
            $this->respondJson(['error' => 'Format d’image non pris en charge'], 400);
            return;
        }

        $uploadDir = __DIR__ . '/../uploads/products';
        if (!is_dir($uploadDir) && !mkdir($uploadDir, 0755, true) && !is_dir($uploadDir)) {
            $this->respondJson(['error' => 'Impossible de créer le dossier de destination'], 500);
            return;
        }

        $fileName = 'prod_' . bin2hex(random_bytes(12)) . '.' . $allowed[$type];
        $destination = $uploadDir . '/' . $fileName;

        if (!move_uploaded_file($_FILES['image']['tmp_name'], $destination)) {
            $this->respondJson(['error' => 'Échec de l’enregistrement de l’image'], 500);
            return;
        }

        $url = '/backend/uploads/products/' . $fileName;
        $this->respondJson(['success' => true, 'url' => $url]);
    }

    public function deleteProduct(): void
    {
        $ownerId = $this->getAuthenticatedUserId();
        if ($ownerId === null) {
            $this->respondJson(['error' => 'Non authentifié'], 401);
            return;
        }

        $productId = isset($_POST['id']) ? (int)$_POST['id'] : 0;
        if ($productId <= 0) {
            $this->respondJson(['error' => 'ID produit invalide'], 400);
            return;
        }

        $product = $this->productModel->findById($productId);
        if (!$product) {
            $this->respondJson(['error' => 'Produit introuvable'], 404);
            return;
        }

        $restaurant = $this->restaurantModel->findByOwnerId($ownerId);
        if (!$restaurant || (int)$restaurant['id'] !== (int)$product['restaurant_id']) {
            $this->respondJson(['error' => 'Accès refusé'], 403);
            return;
        }

        $this->productModel->delete($productId);
        $this->respondJson(['success' => true]);
    }

    private function getAuthenticatedUserId(): ?int
    {
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }

        return isset($_SESSION['utilisateur']['id']) ? (int)$_SESSION['utilisateur']['id'] : null;
    }

    private function respondJson(array $data, int $status = 200): void
    {
        http_response_code($status);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode($data);
        exit();
    }
}
