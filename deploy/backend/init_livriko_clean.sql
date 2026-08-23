DROP DATABASE IF EXISTS livriko_db;
CREATE DATABASE livriko_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE USER IF NOT EXISTS 'livriko_user'@'localhost' IDENTIFIED BY 'livriko_password';
GRANT ALL PRIVILEGES ON livriko_db.* TO 'livriko_user'@'localhost';
FLUSH PRIVILEGES;

USE livriko_db;

-- ==========================================================
-- Roles
-- ==========================================================
CREATE TABLE IF NOT EXISTS `roles` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `code` VARCHAR(50) NOT NULL UNIQUE,
  `libelle` VARCHAR(100) NOT NULL,
  `description` TEXT NULL
) ENGINE=InnoDB;

INSERT INTO `roles` (`code`, `libelle`, `description`) VALUES
('client', 'Client Acheteur', 'Passe des commandes et suit la livraison'),
('restaurant', 'Restaurant / Boutique', 'Gère son catalogue et prépare les commandes'),
('vendeur', 'Vendeur / Boutique', 'Gère son catalogue, prépare et vend des produits'),
('livreur', 'Livreur / Coursier', 'Effectue le ramassage et la livraison à destination'),
('administrateur', 'Administrateur', 'Supervision globale et gestion des utilisateurs')
ON DUPLICATE KEY UPDATE
  `libelle` = VALUES(`libelle`),
  `description` = VALUES(`description`);

-- ==========================================================
-- Utilisateurs
-- ==========================================================
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

-- ==========================================================
-- Restaurants / boutiques / produits
-- ==========================================================
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

-- ==========================================================
-- Commandes et livraison
-- ==========================================================
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

CREATE TABLE IF NOT EXISTS `livreurs` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `utilisateur_id` INT NOT NULL,
  `vehicule` VARCHAR(100) NULL,
  `statut` ENUM('actif','inactif','suspendu') DEFAULT 'actif',
  `documents_valide` TINYINT(1) DEFAULT 0,
  FOREIGN KEY (`utilisateur_id`) REFERENCES `utilisateurs`(`id`) ON DELETE CASCADE
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

INSERT INTO `tarifs_livraison` (`distance_min`, `distance_max`, `prix`) VALUES
(0.00, 2.00, 300.00),
(2.00, 5.00, 500.00),
(5.00, 10.00, 800.00),
(10.00, 20.00, 1200.00)
ON DUPLICATE KEY UPDATE `prix` = VALUES(`prix`);

-- ==========================================================
-- Paiements / notifications / avis
-- ==========================================================
CREATE TABLE IF NOT EXISTS `methodes_paiement` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `code` VARCHAR(100) NOT NULL UNIQUE,
  `nom` VARCHAR(150) NOT NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `notifications` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `utilisateur_id` INT NOT NULL,
  `titre` VARCHAR(150) NOT NULL,
  `message` TEXT NOT NULL,
  `est_lu` TINYINT(1) DEFAULT 0,
  `date_creation` DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`utilisateur_id`) REFERENCES `utilisateurs`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `reviews` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `order_id` INT NOT NULL,
  `client_id` INT NOT NULL,
  `delivery_person_id` INT NOT NULL,
  `rating` TINYINT NOT NULL,
  `comment` TEXT NULL,
  `reasons` TEXT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `unique_order_review` (`order_id`),
  FOREIGN KEY (`order_id`) REFERENCES `commandes`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`client_id`) REFERENCES `utilisateurs`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`delivery_person_id`) REFERENCES `utilisateurs`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `delivery_reports` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `order_id` INT NOT NULL,
  `client_id` INT NOT NULL,
  `delivery_person_id` INT NOT NULL,
  `reason` VARCHAR(150) NOT NULL,
  `description` TEXT NULL,
  `status` ENUM('new','in_review','resolved') DEFAULT 'new',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`order_id`) REFERENCES `commandes`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`client_id`) REFERENCES `utilisateurs`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`delivery_person_id`) REFERENCES `utilisateurs`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ==========================================================
-- Super admin réel
-- ==========================================================
INSERT INTO `utilisateurs` (
  `role_id`, `nom`, `prenom`, `nom_utilisateur`, `email`, `mot_de_passe`, `telephone`, `avatar`, `statut`
) VALUES (
  (SELECT `id` FROM `roles` WHERE `code` = 'administrateur' LIMIT 1),
  'Super',
  'Admin',
  'superadmin',
  'admin@livriko.com',
  '$2y$10$3seay5HnLs93uQoSyBzx0OndRyD71NK0PPdBAw7kb3plil17N5V6S',
  '+22901000000',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=300&q=80',
  'actif'
) ON DUPLICATE KEY UPDATE
  `mot_de_passe` = VALUES(`mot_de_passe`),
  `email` = VALUES(`email`),
  `telephone` = VALUES(`telephone`),
  `statut` = 'actif';

SELECT 'Livriko database initialized successfully.' AS status;
