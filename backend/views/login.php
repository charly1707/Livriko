<?php
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}
$error = $_SESSION['erreur'] ?? null;
unset($_SESSION['erreur']);
?>
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Connexion - Livriko</title>
    <link rel="stylesheet" href="/assets/styles.css">
</head>
<body>
    <nav class="navbar">
        <a href="/">Accueil</a>
        <a href="/restaurants">Restaurants</a>
        <a href="/a-propos">À propos</a>
        <a href="/contact">Contact</a>
        <a href="/login">Connexion</a>
        <a href="/register">Inscription</a>
    </nav>

    <main class="container">
        <h1>Connexion</h1>
        <?php if ($error): ?>
            <div class="alert alert-error"><?= htmlspecialchars($error) ?></div>
        <?php endif; ?>

        <form action="/login" method="post">
            <label for="identifiant">E-mail ou nom d'utilisateur</label>
            <input type="text" name="identifiant" id="identifiant" required>

            <label for="mot_de_passe">Mot de passe</label>
            <input type="password" name="mot_de_passe" id="mot_de_passe" required>

            <button type="submit">Se connecter</button>
        </form>

        <p>Pas encore de compte ? <a href="/register">Inscrivez-vous</a></p>
    </main>
</body>
</html>
