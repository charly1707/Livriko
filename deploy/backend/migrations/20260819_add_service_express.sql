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
