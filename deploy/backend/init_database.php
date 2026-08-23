<?php

$rootDsn = 'mysql:host=127.0.0.1;port=3306;charset=utf8mb4';
$rootUser = 'root';
$rootPass = '';

try {
    $pdo = new PDO($rootDsn, $rootUser, $rootPass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);

    $pdo->exec("DROP DATABASE IF EXISTS livriko_db");
    $pdo->exec("CREATE DATABASE livriko_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
    $pdo->exec("DROP USER IF EXISTS 'livriko_user'@'localhost'");
    $pdo->exec("CREATE USER 'livriko_user'@'localhost' IDENTIFIED BY 'livriko_password'");
    $pdo->exec("GRANT ALL PRIVILEGES ON livriko_db.* TO 'livriko_user'@'localhost'");
    $pdo->exec("FLUSH PRIVILEGES");

    $db = new PDO('mysql:host=127.0.0.1;port=3306;dbname=livriko_db;charset=utf8mb4', 'livriko_user', 'livriko_password', [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);

    $sql = file_get_contents(__DIR__ . '/init_livriko_clean.sql');
    if ($sql === false) {
        throw new RuntimeException('Impossible de lire le fichier SQL init_livriko_clean.sql');
    }

    $statements = preg_split('/;\s*(?:\r?\n|$)/', $sql);
    foreach ($statements as $statement) {
        $trimmed = trim($statement);
        if ($trimmed === '') {
            continue;
        }

        if (stripos($trimmed, 'SELECT ') === 0) {
            $db->query($trimmed)->fetchAll();
            continue;
        }

        $db->exec($trimmed . ';');
    }

    echo "OK: Base livriko_db recréée et initialisée avec le compte admin réel.\n";
} catch (Throwable $e) {
    echo 'ERROR: ' . $e->getMessage() . "\n";
    exit(1);
}
