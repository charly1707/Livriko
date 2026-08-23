CREATE TABLE IF NOT EXISTS `newsletter_subscribers` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `contact` VARCHAR(191) NOT NULL UNIQUE,
  `contact_type` ENUM('email','whatsapp') NOT NULL,
  `status` ENUM('active','unsubscribed') NOT NULL DEFAULT 'active',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NULL ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;