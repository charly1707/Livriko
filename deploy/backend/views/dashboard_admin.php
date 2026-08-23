<?php
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}
if (empty($_SESSION['utilisateur']) || $_SESSION['utilisateur']['role'] !== 'administrateur') {
    header('Location: /login');
    exit();
}
$user = $_SESSION['utilisateur'];
?>
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dashboard Administrateur - Livriko</title>
    <link rel="stylesheet" href="/assets/styles.css">
</head>
<body>
    <?php include __DIR__ . '/header.php'; ?>
    <main class="container">
        <h1>Bienvenue <?= htmlspecialchars($user['prenom'] ?: $user['nom_utilisateur']) ?></h1>
        <p>Tableau de bord administrateur pour la supervision globale et la gestion des utilisateurs.</p>
    </main>
</body>
</html>
