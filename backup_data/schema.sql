-- Hostinger MySQL Database Schema for BNBG Real Estate Platform
-- Character set: utf8mb4 (supports emoji, accents, special symbols)

SET FOREIGN_KEY_CHECKS = 0;

CREATE TABLE IF NOT EXISTS `users` (
  `id` VARCHAR(64) NOT NULL,
  `email` VARCHAR(191) NOT NULL,
  `username` VARCHAR(100) NOT NULL,
  `role` VARCHAR(20) NOT NULL DEFAULT 'user',
  `password` VARCHAR(255) NOT NULL DEFAULT '',
  `avatar` LONGTEXT,
  `createdAt` VARCHAR(64) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `properties` (
  `id` VARCHAR(64) NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `description` LONGTEXT,
  `status` VARCHAR(20) NOT NULL,
  `price` BIGINT NOT NULL DEFAULT 0,
  `address` VARCHAR(255) DEFAULT '',
  `city` VARCHAR(100) NOT NULL,
  `neighborhood` VARCHAR(100) DEFAULT '',
  `latitude` DOUBLE DEFAULT 0,
  `longitude` DOUBLE DEFAULT 0,
  `bedrooms` INT DEFAULT 0,
  `bathrooms` INT DEFAULT 0,
  `area` INT DEFAULT 0,
  `propertyType` VARCHAR(50) NOT NULL,
  `amenities` LONGTEXT,
  `images` LONGTEXT,
  `featured` TINYINT(1) DEFAULT 0,
  `available` TINYINT(1) DEFAULT 1,
  `googleMapsUrl` VARCHAR(500) DEFAULT '',
  `blueprintUrl` VARCHAR(500) DEFAULT '',
  `createdAt` VARCHAR(64) NOT NULL,
  `updatedAt` VARCHAR(64) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_city` (`city`),
  KEY `idx_status` (`status`),
  KEY `idx_property_type` (`propertyType`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `inquiries` (
  `id` VARCHAR(64) NOT NULL,
  `propertyId` VARCHAR(64) NOT NULL,
  `propertyTitle` VARCHAR(255) NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `email` VARCHAR(191) NOT NULL,
  `phone` VARCHAR(50) DEFAULT '',
  `message` TEXT,
  `status` VARCHAR(20) DEFAULT 'new',
  `createdAt` VARCHAR(64) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_inq_property` (`propertyId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `favorites` (
  `id` VARCHAR(64) NOT NULL,
  `userEmail` VARCHAR(191) NOT NULL,
  `propertyId` VARCHAR(64) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_fav_user` (`userEmail`),
  UNIQUE KEY `uniq_fav` (`userEmail`, `propertyId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `metadata` (
  `key` VARCHAR(100) NOT NULL,
  `value` LONGTEXT,
  PRIMARY KEY (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
