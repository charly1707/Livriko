<?php

namespace Livriko\Config;

use PDO;
use PDOException;

class Database
{
    private static ?PDO $instance = null;

    public static function getInstance(): PDO
    {
        if (self::$instance === null) {
            $config = require __DIR__ . '/db.php';

            try {
                self::$instance = new PDO(
                    sprintf('mysql:host=%s;dbname=%s;charset=utf8mb4', $config['host'], $config['database']),
                    $config['username'],
                    $config['password'],
                    [
                        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                        PDO::ATTR_EMULATE_PREPARES => false,
                    ]
                );
            } catch (PDOException $exception) {
                throw new \RuntimeException('Connexion à la base de données échouée : ' . $exception->getMessage());
            }
        }

        return self::$instance;
    }
}
