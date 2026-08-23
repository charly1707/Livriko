<?php

$config = require __DIR__ . '/config/db.php';

try {
    $port = !empty($config['port'])
        ? ';port=' . (string) $config['port']
        : '';

    $pdo = new PDO(
        sprintf(
            'mysql:host=%s;dbname=%s%s;charset=utf8mb4',
            $config['host'],
            $config['database'],
            $port
        ),
        $config['username'],
        $config['password'],
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]
    );

    echo "CONNEXION MYSQL INFINITYFREE REUSSIE\n";

    $result = $pdo->query(
        "SELECT COUNT(*) AS total
         FROM information_schema.tables
         WHERE table_schema = " . $pdo->quote($config['database'])
    );

    $row = $result->fetch();

    echo "NOMBRE DE TABLES : " . $row['total'] . "\n";
} catch (PDOException $e) {
    echo "ERREUR MYSQL : " . $e->getMessage() . "\n";
}
