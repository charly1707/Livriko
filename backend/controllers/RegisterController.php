<?php

namespace Livriko\Controllers;

use Livriko\Config\Database;
use PDO;

class RegisterController
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Database::getInstance();
    }

    public function register(): void
    {
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            header('Location: /register');
            exit();
        }

        $this->startSecureSession();
        session_regenerate_id(true);
        $prenom = trim($_POST['prenom'] ?? '');
        $nom = trim($_POST['nom'] ?? '');
        $nomUtilisateur = trim($_POST['nom_utilisateur'] ?? '');
        $email = trim($_POST['email'] ?? '');
        $telephone = trim($_POST['telephone'] ?? '');
        $motDePasse = $_POST['mot_de_passe'] ?? '';
        $requestedRole = trim($_POST['role'] ?? 'client');
        $allowedRoles = ['client', 'restaurant', 'vendeur', 'livreur'];
        $role = in_array($requestedRole, $allowedRoles, true) ? $requestedRole : 'client';

        if (empty($prenom) || empty($nom) || empty($nomUtilisateur) || empty($email) || empty($telephone) || empty($motDePasse)) {
            $_SESSION['erreur'] = 'Tous les champs sont obligatoires.';
            header('Location: /register');
            exit();
        }

        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $_SESSION['erreur'] = 'L\'adresse e-mail n\'est pas valide.';
            header('Location: /register');
            exit();
        }

        if (mb_strlen($motDePasse) < 8) {
            $_SESSION['erreur'] = 'Le mot de passe doit contenir au moins 8 caractères.';
            header('Location: /register');
            exit();
        }

        $existing = $this->db->prepare('SELECT id FROM utilisateurs WHERE email = :email OR nom_utilisateur = :nom_utilisateur');
        $existing->execute(['email' => $email, 'nom_utilisateur' => $nomUtilisateur]);
        if ($existing->fetch()) {
            $_SESSION['erreur'] = 'Un compte existe déjà avec cet e-mail ou nom d\'utilisateur.';
            header('Location: /register');
            exit();
        }

        $roleStmt = $this->db->prepare('SELECT id FROM roles WHERE code = :code');
        $roleStmt->execute(['code' => $role]);
        $roleRow = $roleStmt->fetch();
        $roleId = $roleRow ? (int) $roleRow['id'] : 1;

        $hashedPassword = password_hash($motDePasse, PASSWORD_DEFAULT);

        $stmt = $this->db->prepare(
            'INSERT INTO utilisateurs (role_id, nom, prenom, nom_utilisateur, email, mot_de_passe, telephone, statut)
             VALUES (:role_id, :nom, :prenom, :nom_utilisateur, :email, :mot_de_passe, :telephone, :statut)'
        );

        $stmt->execute([
            'role_id' => $roleId,
            'nom' => $nom,
            'prenom' => $prenom,
            'nom_utilisateur' => $nomUtilisateur,
            'email' => $email,
            'mot_de_passe' => $hashedPassword,
            'telephone' => $telephone,
            'statut' => 'actif',
        ]);

        $userId = (int) $this->db->lastInsertId();

        $_SESSION['utilisateur'] = [
            'id' => $userId,
            'prenom' => $prenom,
            'nom' => $nom,
            'nom_utilisateur' => $nomUtilisateur,
            'email' => $email,
            'role' => $role,
            'avatar' => null,
        ];

        $route = $this->getRedirectRouteByRole($role);
        header('Location: ' . $route);
        exit();
    }

    private function getRedirectRouteByRole(string $role): string
    {
        return match ($role) {
            'client' => '/dashboard/client',
            'restaurant', 'vendeur' => '/dashboard/restaurant',
            'livreur' => '/dashboard/livreur',
            default => '/dashboard/admin',
        };
    }

    private function startSecureSession(): void
    {
        if (session_status() === PHP_SESSION_NONE) {
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

        ini_set('session.use_strict_mode', '1');
        ini_set('session.use_only_cookies', '1');
    }
}
