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
    <title>Inscription - Livriko</title>
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
        <h1>Inscription</h1>
        <?php if ($error): ?>
            <div class="alert alert-error"><?= htmlspecialchars($error) ?></div>
        <?php endif; ?>

        <form action="/register" method="post">
            <label for="prenom">Prénom</label>
            <input type="text" name="prenom" id="prenom" required>

            <label for="nom">Nom</label>
            <input type="text" name="nom" id="nom" required>

            <label for="nom_utilisateur">Nom d'utilisateur</label>
            <input type="text" name="nom_utilisateur" id="nom_utilisateur" required>

            <label for="email">E-mail</label>
            <input type="email" name="email" id="email" required>

            <label for="telephone">Téléphone</label>
            <input type="text" name="telephone" id="telephone" required>

            <label for="mot_de_passe">Mot de passe</label>
            <input type="password" name="mot_de_passe" id="mot_de_passe" required>

            <label for="role">Rôle</label>
            <select name="role" id="role" required>
                <option value="client">Client</option>
                <option value="restaurant">Restaurant</option>
                <option value="livreur">Livreur</option>
            </select>

            <button type="submit">Créer mon compte</button>
        </form>

        <p>Vous avez déjà un compte ? <a href="/login">Connectez-vous</a></p>
    </main>
</body>
</html>
