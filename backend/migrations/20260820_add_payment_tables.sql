-- Migration for production-ready payment and webhook tracking.
-- Safe to apply only if the tables do not already exist.

CREATE TABLE IF NOT EXISTS `payment_transactions` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `order_id` INT NOT NULL,
  `user_id` INT NOT NULL,
  `provider` VARCHAR(50) NOT NULL,
  `provider_transaction_id` VARCHAR(255) NULL,
  `idempotency_key` VARCHAR(255) NOT NULL,
  `customer_phone` VARCHAR(30) NULL,
  `amount` DECIMAL(12,2) NOT NULL,
  `currency` VARCHAR(10) NOT NULL DEFAULT 'XOF',
  `status` ENUM('pending','successful','failed','cancelled') NOT NULL DEFAULT 'pending',
  `provider_payload` JSON NULL,
  `failure_reason` VARCHAR(255) NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NULL ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `uniq_idempotency` (`idempotency_key`),
  KEY `idx_order_id` (`order_id`),
  KEY `idx_status` (`status`),
  KEY `idx_provider_transaction` (`provider`, `provider_transaction_id`)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `webhook_events` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `provider` VARCHAR(50) NOT NULL,
  `event_id` VARCHAR(255) NOT NULL,
  `signature_valid` TINYINT(1) NOT NULL DEFAULT 0,
  `payload` JSON NULL,
  `processed_at` DATETIME NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `uniq_event` (`provider`, `event_id`)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `sms_logs` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `phone` VARCHAR(30) NOT NULL,
  `message` TEXT NOT NULL,
  `provider` VARCHAR(50) NOT NULL,
  `status` ENUM('queued','sent','failed') NOT NULL DEFAULT 'queued',
  `response_payload` JSON NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

