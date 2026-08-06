<?php

namespace Livriko\Controllers;

use Livriko\Models\UserModel;

class AuthController
{
    private UserModel $userModel;

    public function __construct()
    {
        $this->userModel = new UserModel();
    }

    public function seConnecter(): void
    {
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            header('Location: /login');
            exit();
        }

        session_start();
        $this->startSecureSession();

        $identifiant = trim($_POST['identifiant'] ?? '');
        $motDePasse = $_POST['mot_de_passe'] ?? '';

        if (empty($identifiant) || empty($motDePasse)) {
            $_SESSION['erreur'] = 'Veuillez renseigner votre adresse e-mail ou nom d\'utilisateur et votre mot de passe.';
            header('Location: /login');
            exit();
        }

        $ipAddress = $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1';
        $userAgent = $_SERVER['HTTP_USER_AGENT'] ?? 'Inconnu';

        if ($this->userModel->countRecentFailedAttempts($ipAddress) >= 5) {
            $_SESSION['erreur'] = 'Trop de tentatives de connexion. Veuillez réessayer dans 15 minutes.';
            header('Location: /login');
            exit();
        }

        $utilisateur = $this->userModel->findByEmailOrUsername($identifiant);
        if ($utilisateur === null) {
            $this->userModel->logConnectionAttempt(null, $identifiant, 'echec', $ipAddress);
            $this->userModel->incrementFailedAttempts($ipAddress);
            $_SESSION['erreur'] = 'Adresse e-mail ou mot de passe incorrect.';
            header('Location: /login');
            exit();
        }

        if (!password_verify($motDePasse, $utilisateur['mot_de_passe'])) {
            $this->userModel->logConnectionAttempt((int) $utilisateur['id'], $utilisateur['email'], 'echec', $ipAddress);
            $this->userModel->incrementFailedAttempts($ipAddress);
            $_SESSION['erreur'] = 'Adresse e-mail ou mot de passe incorrect.';
            header('Location: /login');
            exit();
        }

        if ($utilisateur['statut'] !== 'actif') {
            $this->userModel->logConnectionAttempt((int) $utilisateur['id'], $utilisateur['email'], 'echec', $ipAddress);
            $_SESSION['erreur'] = 'Votre compte est actuellement introuvable ou suspendu. Contactez le support.';
            header('Location: /login');
            exit();
        }

        $this->userModel->logConnectionAttempt((int) $utilisateur['id'], $utilisateur['email'], 'succes', $ipAddress);
        $this->userModel->createSession(session_id(), (int) $utilisateur['id'], $ipAddress, $userAgent);

        session_regenerate_id(true);
        $_SESSION['utilisateur'] = [
            'id' => $utilisateur['id'],
            'prenom' => $utilisateur['prenom'],
            'nom' => $utilisateur['nom'],
            'nom_utilisateur' => $utilisateur['nom_utilisateur'],
            'email' => $utilisateur['email'],
            'role' => $utilisateur['role_code'],
            'avatar' => $utilisateur['avatar'],
        ];

        $route = $this->getRedirectRouteByRole($utilisateur['role_code']);
        header('Location: ' . $route);
        exit();
    }

    private function startSecureSession(): void
    {
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }

        ini_set('session.cookie_httponly', '1');
        ini_set('session.cookie_secure', '1');
        ini_set('session.use_strict_mode', '1');
        ini_set('session.use_only_cookies', '1');
        ini_set('session.cookie_samesite', 'Lax');
    }

    private function getRedirectRouteByRole(string $role): string
    {
        return match ($role) {
            'client' => '/dashboard/client',
            'restaurant' => '/dashboard/restaurant',
            'livreur' => '/dashboard/livreur',
            'administrateur' => '/dashboard/admin',
            default => '/login',
        };
    }
}
