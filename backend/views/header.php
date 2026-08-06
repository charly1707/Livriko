<?php
$user = $_SESSION['utilisateur'] ?? null;
?>
<nav class="navbar">
    <a href="/">Accueil</a>
    <a href="/restaurants">Restaurants</a>
    <a href="/a-propos">À propos</a>
    <a href="/contact">Contact</a>

    <?php if ($user): ?>
        <div class="navbar-user">
            <?php if (!empty($user['avatar'])): ?>
                <img src="<?= htmlspecialchars($user['avatar']) ?>" alt="Avatar" class="avatar">
            <?php endif; ?>
            <span><?= htmlspecialchars($user['prenom'] ?: $user['nom_utilisateur']) ?></span>
            <button class="dropdown-toggle">▼</button>
            <div class="dropdown-menu">
                <a href="/profil">Mon profil</a>
                <a href="/dashboard">Tableau de bord</a>
                <a href="/parametres">Paramètres</a>
                <a href="/notifications">Notifications</a>
                <a href="/logout">Déconnexion</a>
            </div>
        </div>
    <?php else: ?>
        <a href="/login">Connexion</a>
        <a href="/register">Inscription</a>
    <?php endif; ?>
</nav>
