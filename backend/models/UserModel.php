<?php

namespace Livriko\Models;

use Livriko\Config\Database;
use PDO;

class UserModel
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Database::getInstance();
    }

    public function findByEmailOrUsername(string $identifier): ?array
    {
        $stmt = $this->db->prepare(
            'SELECT u.*, r.code AS role_code, r.libelle AS role_name
             FROM utilisateurs u
             JOIN roles r ON u.role_id = r.id
             WHERE u.email = :identifier OR u.nom_utilisateur = :identifier'
        );
        $stmt->execute(['identifier' => $identifier]);
        $user = $stmt->fetch();
        return $user ?: null;
    }

    public function logConnectionAttempt(?int $userId, string $email, string $status, string $ipAddress): void
    {
        $stmt = $this->db->prepare(
            'INSERT INTO connexions (utilisateur_id, email_tente, statut, ip_address)
             VALUES (:user_id, :email, :statut, :ip_address)'
        );
        $stmt->execute([
            'user_id' => $userId,
            'email' => $email,
            'statut' => $status,
            'ip_address' => $ipAddress,
        ]);
    }

    public function incrementFailedAttempts(string $ipAddress): void
    {
        $stmt = $this->db->prepare(
            'INSERT INTO connexion_pannes (ip_address, tentative_date)
             VALUES (:ip_address, NOW())'
        );
        $stmt->execute(['ip_address' => $ipAddress]);
    }

    public function countRecentFailedAttempts(string $ipAddress, int $minutes = 15): int
    {
        $stmt = $this->db->prepare(
            'SELECT COUNT(*) FROM connexion_pannes WHERE ip_address = :ip_address AND tentative_date > NOW() - INTERVAL :minutes MINUTE'
        );
        $stmt->bindValue('ip_address', $ipAddress, PDO::PARAM_STR);
        $stmt->bindValue('minutes', $minutes, PDO::PARAM_INT);
        $stmt->execute();
        return (int) $stmt->fetchColumn();
    }

    public function createSession(string $sessionId, int $userId, string $ipAddress, string $userAgent): void
    {
        $stmt = $this->db->prepare(
            'REPLACE INTO sessions (id, utilisateur_id, ip_address, user_agent, derniere_activite)
             VALUES (:id, :utilisateur_id, :ip_address, :user_agent, UNIX_TIMESTAMP())'
        );
        $stmt->execute([
            'id' => $sessionId,
            'utilisateur_id' => $userId,
            'ip_address' => $ipAddress,
            'user_agent' => $userAgent,
        ]);
    }

    public function getSession(string $sessionId): ?array
    {
        $stmt = $this->db->prepare('SELECT * FROM sessions WHERE id = :id');
        $stmt->execute(['id' => $sessionId]);
        $session = $stmt->fetch();
        return $session ?: null;
    }

    public function deleteSession(string $sessionId): void
    {
        $stmt = $this->db->prepare('DELETE FROM sessions WHERE id = :id');
        $stmt->execute(['id' => $sessionId]);
    }
}
