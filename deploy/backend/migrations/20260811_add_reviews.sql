-- Migration: Add reviews and delivery_reports tables
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
