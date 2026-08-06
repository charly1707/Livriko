<?php
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}
if (empty($_SESSION['utilisateur']) || $_SESSION['utilisateur']['role'] !== 'client') {
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
    <title>Dashboard Client - Livriko</title>
    <link rel="stylesheet" href="/assets/styles.css">
</head>
<body>
    <?php include __DIR__ . '/header.php'; ?>
    <main class="container">
        <h1>Bienvenue <?= htmlspecialchars($user['prenom'] ?: $user['nom_utilisateur']) ?></h1>
        <p>Vous êtes connecté en tant que client.</p>
        <section>
            <h2>Mes commandes</h2>
            <p>Accédez à votre historique et au suivi en temps réel.</p>
        </section>
    </main>
</body>
</html>
