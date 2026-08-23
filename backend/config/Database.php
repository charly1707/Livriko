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
            $configFile = getenv('APP_ENV') === 'local' ? __DIR__ . '/db.local.php' : __DIR__ . '/db.php';
            $config = require $configFile;

            try {
                $port = !empty($config['port']) ? ';port=' . (string)$config['port'] : '';
                self::$instance = new PDO(
                    sprintf('mysql:host=%s;dbname=%s%s;charset=utf8mb4', $config['host'], $config['database'], $port),
                    $config['username'],
                    $config['password'],
                    [
                        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                        PDO::ATTR_EMULATE_PREPARES => false,
                    ]
                );
            } catch (PDOException $exception) {
                error_log('Livriko database connection failed: ' . $exception->getMessage());
                throw new \RuntimeException('Connexion à la base de données indisponible.');
            }
        }

        return self::$instance;
    }
}
