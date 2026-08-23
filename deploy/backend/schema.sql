-- ==========================================================
-- LIVRIKO - SCHEMA MYSQL COMPLET
-- ==========================================================



CREATE TABLE IF NOT EXISTS `roles` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `code` VARCHAR(50) NOT NULL UNIQUE,
  `libelle` VARCHAR(100) NOT NULL,
  `description` TEXT NULL
) ENGINE=InnoDB;

INSERT IGNORE INTO `roles` (`code`, `libelle`, `description`) VALUES
('client', 'Client Acheteur', 'Passe des commandes et suit la livraison'),
('restaurant', 'Restaurant / Boutique', 'Gère son catalogue et prépare les commandes'),
('vendeur', 'Vendeur / Boutique', 'Gère son catalogue, prépare et vend des produits'),
('livreur', 'Livreur / Coursier', 'Effectue le ramassage et la livraison à destination'),
('administrateur', 'Administrateur', 'Supervision globale et gestion des utilisateurs');

-- Utilisateurs
CREATE TABLE IF NOT EXISTS `utilisateurs` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `role_id` INT NOT NULL,
  `nom` VARCHAR(100) NOT NULL,
  `prenom` VARCHAR(100) NOT NULL,
  `nom_utilisateur` VARCHAR(100) NOT NULL UNIQUE,
  `email` VARCHAR(191) NOT NULL UNIQUE,
  `mot_de_passe` VARCHAR(255) NOT NULL,
  `telephone` VARCHAR(30) NOT NULL,
  `avatar` VARCHAR(255) NULL,
  `statut` ENUM('actif', 'inactif', 'suspendu', 'bloque') DEFAULT 'actif',
  `email_verifie_at` DATETIME NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- Permissions
CREATE TABLE IF NOT EXISTS `permissions` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `code` VARCHAR(100) NOT NULL UNIQUE,
  `nom` VARCHAR(150) NOT NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `role_permissions` (
  `role_id` INT NOT NULL,
  `permission_id` INT NOT NULL,
  PRIMARY KEY (`role_id`, `permission_id`),
  FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`permission_id`) REFERENCES `permissions`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Sessions et journaux de connexion
CREATE TABLE IF NOT EXISTS `sessions` (
  `id` VARCHAR(191) PRIMARY KEY,
  `utilisateur_id` INT NOT NULL,
  `ip_address` VARCHAR(45) NULL,
  `user_agent` TEXT NULL,
  `derniere_activite` INT NOT NULL,
  FOREIGN KEY (`utilisateur_id`) REFERENCES `utilisateurs`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `connexions` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `utilisateur_id` INT NULL,
  `email_tente` VARCHAR(191) NOT NULL,
  `statut` ENUM('succes', 'echec') NOT NULL,
  `ip_address` VARCHAR(45) NOT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`utilisateur_id`) REFERENCES `utilisateurs`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `connexion_pannes` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `ip_address` VARCHAR(45) NOT NULL,
  `tentative_date` DATETIME NOT NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `password_resets` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `email` VARCHAR(191) NOT NULL,
  `token` VARCHAR(255) NOT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `expires_at` DATETIME NOT NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `activity_logs` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `utilisateur_id` INT NULL,
  `action` VARCHAR(255) NOT NULL,
  `details` TEXT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`utilisateur_id`) REFERENCES `utilisateurs`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB;

-- Restaurants
CREATE TABLE IF NOT EXISTS `categories_restaurants` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `nom` VARCHAR(100) NOT NULL,
  `slug` VARCHAR(100) NOT NULL UNIQUE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `restaurants` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `proprietaire_id` INT NOT NULL,
  `category_id` INT NULL,
  `nom` VARCHAR(150) NOT NULL,
  `description` TEXT NULL,
  `adresse` VARCHAR(255) NOT NULL,
  `ville` VARCHAR(100) DEFAULT 'Lokossa',
  `quartier` VARCHAR(100) DEFAULT 'Agamé',
  `telephone` VARCHAR(30) NOT NULL,
  `momo_phone` VARCHAR(30) NULL,
  `logo` VARCHAR(255) NULL,
  `statut` ENUM('approuve', 'en_attente', 'suspendu') DEFAULT 'en_attente',
  `est_certifie` TINYINT(1) DEFAULT 0,
  FOREIGN KEY (`proprietaire_id`) REFERENCES `utilisateurs`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`category_id`) REFERENCES `categories_restaurants`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `horaires_ouverture` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `restaurant_id` INT NOT NULL,
  `jour_semaine` ENUM('lundi','mardi','mercredi','jeudi','vendredi','samedi','dimanche') NOT NULL,
  `heure_ouverture` TIME NOT NULL,
  `heure_fermeture` TIME NOT NULL,
  FOREIGN KEY (`restaurant_id`) REFERENCES `restaurants`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `verification_documents` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `restaurant_id` INT NOT NULL,
  `type_document` VARCHAR(100) NOT NULL,
  `fichier` VARCHAR(255) NOT NULL,
  `statut` ENUM('soumis','valide','rejete') DEFAULT 'soumis',
  `date_soumission` DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`restaurant_id`) REFERENCES `restaurants`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `bank_details` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `restaurant_id` INT NOT NULL UNIQUE,
  `provider` VARCHAR(100) NOT NULL,
  `account_number` VARCHAR(100) NOT NULL,
  `account_name` VARCHAR(150) NOT NULL,
  FOREIGN KEY (`restaurant_id`) REFERENCES `restaurants`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Produits
CREATE TABLE IF NOT EXISTS `categories_produits` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `restaurant_id` INT NOT NULL,
  `nom` VARCHAR(100) NOT NULL,
  FOREIGN KEY (`restaurant_id`) REFERENCES `restaurants`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `produits` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `restaurant_id` INT NOT NULL,
  `category` VARCHAR(50) NULL,
  `category_id` INT NULL,
  `nom` VARCHAR(150) NOT NULL,
  `description` TEXT NULL,
  `prix` DECIMAL(10,2) NOT NULL,
  `image` VARCHAR(255) NULL,
  `en_stock` TINYINT(1) DEFAULT 1,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`restaurant_id`) REFERENCES `restaurants`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`category_id`) REFERENCES `categories_produits`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `stock_produits` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `produit_id` INT NOT NULL,
  `quantite` INT NOT NULL,
  `mise_a_jour` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`produit_id`) REFERENCES `produits`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `promotions` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `produit_id` INT NOT NULL,
  `pourcentage` INT NOT NULL,
  `date_debut` DATETIME NOT NULL,
  `date_fin` DATETIME NOT NULL,
  FOREIGN KEY (`produit_id`) REFERENCES `produits`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `favoris` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `utilisateur_id` INT NOT NULL,
  `produit_id` INT NOT NULL,
  `date_ajout` DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`utilisateur_id`) REFERENCES `utilisateurs`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`produit_id`) REFERENCES `produits`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Commandes
CREATE TABLE IF NOT EXISTS `paniers` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `client_id` INT NOT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`client_id`) REFERENCES `utilisateurs`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `panier_produits` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `panier_id` INT NOT NULL,
  `produit_id` INT NOT NULL,
  `quantite` INT NOT NULL,
  FOREIGN KEY (`panier_id`) REFERENCES `paniers`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`produit_id`) REFERENCES `produits`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `commandes` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `code_commande` VARCHAR(30) NOT NULL UNIQUE,
  `client_id` INT NOT NULL,
  `restaurant_id` INT NOT NULL,
  `sous_total` DECIMAL(10,2) NOT NULL,
  `frais_livraison` DECIMAL(10,2) NOT NULL,
  `total` DECIMAL(10,2) NOT NULL,
  `statut` ENUM('pending','confirmed','rider_requested','rider_assigned','picked_up','delivering','delivered','cancelled') DEFAULT 'pending',
  `mode_paiement` ENUM('cash','momo_mtn','momo_moov','orange_money','celtis_cash') NOT NULL,
  `source_paiement` ENUM('direct_momo','wallet','cash') DEFAULT 'direct_momo',
  `statut_paiement` ENUM('pending','paid') DEFAULT 'pending',
  `adresse_livraison` TEXT NOT NULL,
  `date_creation` DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`client_id`) REFERENCES `utilisateurs`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`restaurant_id`) REFERENCES `restaurants`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `commande_produits` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `commande_id` INT NOT NULL,
  `produit_id` INT NOT NULL,
  `quantite` INT NOT NULL,
  `prix_unitaire` DECIMAL(10,2) NOT NULL,
  `sous_total` DECIMAL(10,2) NOT NULL,
  FOREIGN KEY (`commande_id`) REFERENCES `commandes`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`produit_id`) REFERENCES `produits`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `statuts_commandes` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `code` VARCHAR(50) NOT NULL UNIQUE,
  `libelle` VARCHAR(150) NOT NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `historique_commandes` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `commande_id` INT NOT NULL,
  `statut` VARCHAR(150) NOT NULL,
  `mise_a_jour` DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`commande_id`) REFERENCES `commandes`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Livraison
CREATE TABLE IF NOT EXISTS `livreurs` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `utilisateur_id` INT NOT NULL,
  `vehicule` VARCHAR(100) NULL,
  `statut` ENUM('actif','inactif','suspendu') DEFAULT 'actif',
  `documents_valide` TINYINT(1) DEFAULT 0,
  FOREIGN KEY (`utilisateur_id`) REFERENCES `utilisateurs`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `vehicules` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `livreur_id` INT NOT NULL,
  `marque` VARCHAR(100) NOT NULL,
  `modele` VARCHAR(100) NOT NULL,
  `immatriculation` VARCHAR(100) NOT NULL,
  FOREIGN KEY (`livreur_id`) REFERENCES `livreurs`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `disponibilites_livreurs` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `livreur_id` INT NOT NULL,
  `jour_semaine` ENUM('lundi','mardi','mercredi','jeudi','vendredi','samedi','dimanche') NOT NULL,
  `est_disponible` TINYINT(1) DEFAULT 1,
  FOREIGN KEY (`livreur_id`) REFERENCES `livreurs`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `livraisons` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `commande_id` INT NOT NULL UNIQUE,
  `livreur_id` INT NULL,
  `status` ENUM('recherche','accepte','recupere','en_route','livre') DEFAULT 'recherche',
  `distance_km` DECIMAL(8,2) NULL,
  `frais_livraison` DECIMAL(10,2) NULL,
  `depart_lat` DECIMAL(10,7) NULL,
  `depart_lng` DECIMAL(10,7) NULL,
  `arrivee_lat` DECIMAL(10,7) NULL,
  `arrivee_lng` DECIMAL(10,7) NULL,
  `heure_depart` DATETIME NULL,
  `heure_arrivee` DATETIME NULL,
  `duree_minutes` INT NULL,
  FOREIGN KEY (`commande_id`) REFERENCES `commandes`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`livreur_id`) REFERENCES `livreurs`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB;

-- Missions Service Express, indépendantes des commandes de restaurants
CREATE TABLE IF NOT EXISTS `service_express_missions` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `client_id` INT NOT NULL,
  `livreur_id` INT NULL,
  `type_service` VARCHAR(50) NOT NULL,
  `description` TEXT NOT NULL,
  `depart_nom` VARCHAR(150) NULL,
  `depart_adresse` TEXT NOT NULL,
  `depart_telephone` VARCHAR(30) NULL,
  `depart_notes` TEXT NULL,
  `destination_nom` VARCHAR(150) NULL,
  `destination_adresse` TEXT NOT NULL,
  `destination_telephone` VARCHAR(30) NULL,
  `destination_notes` TEXT NULL,
  `details_json` JSON NULL,
  `distance_km` DECIMAL(8,2) NOT NULL,
  `frais_service` DECIMAL(10,2) NOT NULL,
  `statut` ENUM('pending','searching','assigned','to_pickup','picked_up','delivering','delivered','completed','cancelled') DEFAULT 'searching',
  `date_creation` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `date_completion` DATETIME NULL,
  FOREIGN KEY (`client_id`) REFERENCES `utilisateurs`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`livreur_id`) REFERENCES `livreurs`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `historique_service_express` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `mission_id` INT NOT NULL,
  `statut` VARCHAR(50) NOT NULL,
  `date_creation` DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`mission_id`) REFERENCES `service_express_missions`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `historique_livraisons` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `livraison_id` INT NOT NULL,
  `evenement` VARCHAR(255) NOT NULL,
  `date_evenement` DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`livraison_id`) REFERENCES `livraisons`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `positions_gps` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `livraison_id` INT NOT NULL,
  `latitude` DECIMAL(10,7) NOT NULL,
  `longitude` DECIMAL(10,7) NOT NULL,
  `date_position` DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`livraison_id`) REFERENCES `livraisons`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `tarifs_livraison` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `distance_min` DECIMAL(8,2) NOT NULL,
  `distance_max` DECIMAL(8,2) NOT NULL,
  `prix` DECIMAL(10,2) NOT NULL
) ENGINE=InnoDB;

-- Paiement
CREATE TABLE IF NOT EXISTS `methodes_paiement` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `code` VARCHAR(100) NOT NULL UNIQUE,
  `nom` VARCHAR(150) NOT NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `paiements` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `commande_id` INT NOT NULL,
  `utilisateur_id` INT NOT NULL,
  `methode_id` INT NOT NULL,
  `montant` DECIMAL(10,2) NOT NULL,
  `statut` ENUM('pending','paid','failed') DEFAULT 'pending',
  `reference` VARCHAR(255) NULL,
  `date_paiement` DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`commande_id`) REFERENCES `commandes`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`utilisateur_id`) REFERENCES `utilisateurs`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`methode_id`) REFERENCES `methodes_paiement`(`id`) ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `commissions` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `commande_id` INT NOT NULL,
  `pourcentage` DECIMAL(5,2) NOT NULL,
  `montant` DECIMAL(10,2) NOT NULL,
  FOREIGN KEY (`commande_id`) REFERENCES `commandes`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Communication
CREATE TABLE IF NOT EXISTS `notifications` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `utilisateur_id` INT NOT NULL,
  `titre` VARCHAR(150) NOT NULL,
  `message` TEXT NOT NULL,
  `est_lu` TINYINT(1) DEFAULT 0,
  `date_creation` DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`utilisateur_id`) REFERENCES `utilisateurs`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `conversations` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `utilisateur_1_id` INT NOT NULL,
  `utilisateur_2_id` INT NOT NULL,
  `dernier_message` TEXT NULL,
  `date_mise_a_jour` DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`utilisateur_1_id`) REFERENCES `utilisateurs`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`utilisateur_2_id`) REFERENCES `utilisateurs`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `messages` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `conversation_id` INT NOT NULL,
  `expediteur_id` INT NOT NULL,
  `contenu` TEXT NOT NULL,
  `lu` TINYINT(1) DEFAULT 0,
  `date_envoi` DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`conversation_id`) REFERENCES `conversations`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`expediteur_id`) REFERENCES `utilisateurs`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- New order-based conversation tables (one conversation per order)
CREATE TABLE IF NOT EXISTS `order_conversations` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `order_id` INT NOT NULL UNIQUE,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`order_id`) REFERENCES `commandes`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `conversation_participants` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `conversation_id` INT NOT NULL,
  `user_id` INT NOT NULL,
  `role` ENUM('client','restaurant','livreur') NOT NULL,
  `added_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `conversation_user` (`conversation_id`,`user_id`),
  FOREIGN KEY (`conversation_id`) REFERENCES `order_conversations`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`user_id`) REFERENCES `utilisateurs`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `conversation_messages` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `conversation_id` INT NOT NULL,
  `sender_id` INT NOT NULL,
  `message` TEXT NULL,
  `message_type` ENUM('text','image','emoji') DEFAULT 'text',
  `is_read` TINYINT(1) DEFAULT 0,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`conversation_id`) REFERENCES `order_conversations`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`sender_id`) REFERENCES `utilisateurs`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `avis` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `utilisateur_id` INT NOT NULL,
  `restaurant_id` INT NOT NULL,
  `note` TINYINT NOT NULL,
  `commentaire` TEXT NULL,
  `date_creation` DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`utilisateur_id`) REFERENCES `utilisateurs`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`restaurant_id`) REFERENCES `restaurants`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `notes` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `utilisateur_id` INT NOT NULL,
  `objet` VARCHAR(255) NOT NULL,
  `contenu` TEXT NULL,
  `date_creation` DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`utilisateur_id`) REFERENCES `utilisateurs`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Administration
CREATE TABLE IF NOT EXISTS `villes` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `nom` VARCHAR(100) NOT NULL UNIQUE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `quartiers` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `ville_id` INT NOT NULL,
  `nom` VARCHAR(100) NOT NULL,
  FOREIGN KEY (`ville_id`) REFERENCES `villes`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `publicites` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `titre` VARCHAR(150) NOT NULL,
  `contenu` TEXT NOT NULL,
  `image` VARCHAR(255) NULL,
  `date_debut` DATETIME NOT NULL,
  `date_fin` DATETIME NOT NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `newsletter_subscribers` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `contact` VARCHAR(191) NOT NULL UNIQUE,
  `contact_type` ENUM('email','whatsapp') NOT NULL,
  `status` ENUM('active','unsubscribed') NOT NULL DEFAULT 'active',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NULL ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `signalements` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `utilisateur_id` INT NOT NULL,
  `type` VARCHAR(150) NOT NULL,
  `description` TEXT NOT NULL,
  `statut` ENUM('nouveau','en_traitement','resolu') DEFAULT 'nouveau',
  `date_creation` DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`utilisateur_id`) REFERENCES `utilisateurs`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `statistiques` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `cle` VARCHAR(100) NOT NULL,
  `valeur` BIGINT NOT NULL,
  `mise_a_jour` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;
