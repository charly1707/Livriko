<?php

namespace Livriko\Controllers;

use Livriko\Models\UserModel;
use Livriko\Models\RestaurantModel;

class ApiAuthController
{
    private UserModel $userModel;
    private RestaurantModel $restaurantModel;

    public function __construct()
    {
        $this->userModel = new UserModel();
        $this->restaurantModel = new RestaurantModel();
    }

    public function login(): void
    {
        try {
            if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
                $this->respondJson(['error' => 'Method not allowed'], 405);
                return;
            }

            $payload = $_POST;
            $identifiant = trim($payload['identifiant'] ?? '');
            $motDePasse = $payload['mot_de_passe'] ?? '';

            if (empty($identifiant) || empty($motDePasse)) {
                $this->respondJson(['success' => false, 'message' => 'Email et mot de passe requis.'], 400);
                return;
            }

            $utilisateur = $this->userModel->findByEmailOrUsername($identifiant);
            if ($utilisateur === null) {
                $this->respondJson(['success' => false, 'message' => 'Informations incorrectes. Vérifiez votre email et votre mot de passe.'], 401);
                return;
            }

            if (!password_verify($motDePasse, $utilisateur['mot_de_passe'])) {
                $this->respondJson(['success' => false, 'message' => 'Informations incorrectes. Vérifiez votre email et votre mot de passe.'], 401);
                return;
            }

            if ($utilisateur['statut'] !== 'actif') {
                $this->respondJson(['success' => false, 'message' => 'Votre compte est inactif ou suspendu.'], 403);
                return;
            }

            $this->startSecureSession();
            $_SESSION['utilisateur'] = [
                'id' => $utilisateur['id'],
                'prenom' => $utilisateur['prenom'] ?? '',
                'nom' => $utilisateur['nom'] ?? '',
                'nom_utilisateur' => $utilisateur['nom_utilisateur'] ?? '',
                'email' => $utilisateur['email'] ?? '',
                'telephone' => $utilisateur['telephone'] ?? '',
                'role' => $utilisateur['role_code'] ?? 'client',
                'avatar' => $utilisateur['avatar'] ?? null,
            ];

            $this->respondJson(['success' => true, 'user' => $_SESSION['utilisateur']]);
        } catch (\Throwable $exception) {
            error_log('Auth login error: ' . $exception->getMessage());
            $this->respondJson(['success' => false, 'message' => 'Une erreur interne est survenue.'], 500);
        }
    }

    public function register(): void
    {
        try {
            if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
                $this->respondJson(['error' => 'Method not allowed'], 405);
                return;
            }

            $payload = $_POST;
            $prenom = trim($payload['prenom'] ?? '');
            $nom = trim($payload['nom'] ?? '');
            $nomUtilisateur = trim($payload['nom_utilisateur'] ?? '');
            $email = trim($payload['email'] ?? '');
            $telephone = trim($payload['telephone'] ?? '');
            $motDePasse = $payload['mot_de_passe'] ?? '';
            $requestedRole = trim($payload['role'] ?? 'client');
            $allowedRoles = ['client', 'restaurant', 'vendeur', 'livreur'];
            $role = in_array($requestedRole, $allowedRoles, true) ? $requestedRole : 'client';

            if (empty($prenom) || empty($nom) || empty($nomUtilisateur) || empty($email) || empty($telephone) || empty($motDePasse)) {
                $this->respondJson(['success' => false, 'message' => 'Tous les champs sont obligatoires.'], 400);
                return;
            }

            if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
                $this->respondJson(['success' => false, 'message' => 'Adresse e-mail invalide.'], 400);
                return;
            }

            if (mb_strlen($motDePasse) < 8) {
                $this->respondJson(['success' => false, 'message' => 'Le mot de passe doit contenir au moins 8 caractères.'], 400);
                return;
            }

            if ($this->userModel->existsByEmailOrUsername($email, $nomUtilisateur)) {
                $this->respondJson(['success' => false, 'message' => 'Un compte existe déjà avec cet e-mail ou ce nom d’utilisateur.'], 409);
                return;
            }

            $roleId = $this->userModel->getRoleIdByCode($role);
            $hashedPassword = password_hash($motDePasse, PASSWORD_DEFAULT);

            $userId = $this->userModel->createUser([
                'role_id' => $roleId,
                'nom' => $nom,
                'prenom' => $prenom,
                'nom_utilisateur' => $nomUtilisateur,
                'email' => $email,
                'mot_de_passe' => $hashedPassword,
                'telephone' => $telephone,
            ]);

            if ($role === 'livreur') {
                $db = \Livriko\Config\Database::getInstance();
                $db->prepare('INSERT INTO livreurs (utilisateur_id, vehicule, documents_valide) VALUES (?, ?, 0)')->execute([$userId, $payload['vehicle'] ?? null]);
            }

            if (in_array($role, ['restaurant', 'vendeur'], true)) {
                $this->restaurantModel->createRestaurant(
                    $userId,
                    $payload['restaurant_name'] ?? $nom . ' Boutique',
                    $payload['adresse'] ?? 'Non renseignée',
                    $payload['ville'] ?? 'Lokossa',
                    $telephone,
                    $payload['logo'] ?? null,
                    null
                );
            }

            $this->startSecureSession();
            $_SESSION['utilisateur'] = [
                'id' => $userId,
                'prenom' => $prenom,
                'nom' => $nom,
                'nom_utilisateur' => $nomUtilisateur,
                'email' => $email,
                'role' => $role,
                'avatar' => null,
            ];

            $this->respondJson(['success' => true, 'user' => $_SESSION['utilisateur']]);
        } catch (\Throwable $exception) {
            error_log('Auth register error: ' . $exception->getMessage());
            $this->respondJson(['success' => false, 'message' => 'Une erreur interne est survenue pendant l’inscription.'], 500);
        }
    }

    public function logout(): void
    {
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
        session_unset();
        session_destroy();
        $this->respondJson(['success' => true]);
    }

    public function me(): void
    {
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }

        $sessionUser = $_SESSION['utilisateur'] ?? null;
        $user = $sessionUser && isset($sessionUser['id'])
            ? $this->userModel->findById((int)$sessionUser['id'])
            : null;

        if (!$user || $user['statut'] !== 'actif') {
            unset($_SESSION['utilisateur']);
            $this->respondJson(['user' => null]);
            return;
        }

        $_SESSION['utilisateur']['telephone'] = $user['telephone'] ?? '';
        $this->respondJson(['user' => $_SESSION['utilisateur']]);
    }

    private function startSecureSession(): void
    {
        if (session_status() === PHP_SESSION_NONE) {
            ini_set('session.use_strict_mode', '1');
            ini_set('session.use_only_cookies', '1');

            $isSecure = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') || $_SERVER['SERVER_PORT'] === '443';
            session_set_cookie_params([
                'lifetime' => 0,
                'path' => '/',
                'domain' => $_SERVER['HTTP_HOST'] ?? '',
                'secure' => $isSecure,
                'httponly' => true,
                'samesite' => 'Lax',
            ]);
            session_start();
        }
    }

    private function respondJson(array $data, int $status = 200): void
    {
        http_response_code($status);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode($data);
        exit();
    }
}
