/* Updated schema aligned with fields & statuses used in app.py
   - Use stricter types (DECIMAL for money, INT for quantities)
   - Add status columns to requests, add timestamps, and reasonable lengths
   - Add basic foreign keys where appropriate (ON DELETE SET NULL)
*/

/*!40101 SET NAMES utf8 */;
/*!40101 SET SQL_MODE='NO_AUTO_VALUE_ON_ZERO'*/;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE */;

CREATE DATABASE IF NOT EXISTS `baby_db` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE `baby_db`;

-- admin activity logs
DROP TABLE IF EXISTS `admin_activity_logs`;
CREATE TABLE `admin_activity_logs` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `admin_id` INT NULL,
  `action_type` VARCHAR(100) NULL,
  `details` TEXT NULL,
  `affected_user_id` INT NULL,
  `timestamp` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- users
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `first_name` VARCHAR(120) NOT NULL,
  `last_name` VARCHAR(120) NOT NULL,
  `password` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `phone_number` VARCHAR(32) NULL,
  `address` TEXT NULL,
  `user_type` ENUM('Admin','Seller','Buyer','Rider') NOT NULL DEFAULT 'Buyer',
  `document_id` VARCHAR(255) NULL,
  `bir` VARCHAR(255) NULL,
  `profile_pic` VARCHAR(255) NULL,
  `banner_image` VARCHAR(255) NULL,
  `status` ENUM('active','banned') NOT NULL DEFAULT 'active',
  `ban_reason` TEXT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_users_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- seller requests
DROP TABLE IF EXISTS `seller_requests`;
CREATE TABLE `seller_requests` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `first_name` VARCHAR(120) NOT NULL,
  `last_name` VARCHAR(120) NOT NULL,
  `password` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `phone_number` VARCHAR(32) NOT NULL,
  `address` TEXT NOT NULL,
  `user_type` VARCHAR(50) NOT NULL DEFAULT 'Seller',
  `document_id` VARCHAR(255) NULL,
  `bir` VARCHAR(255) NULL,
  `status` ENUM('Pending','Approved','Rejected') NOT NULL DEFAULT 'Pending',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_seller_requests_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- rider requests
DROP TABLE IF EXISTS `rider_requests`;
CREATE TABLE `rider_requests` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `first_name` VARCHAR(120) NOT NULL,
  `last_name` VARCHAR(120) NOT NULL,
  `password` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `phone_number` VARCHAR(32) NOT NULL,
  `address` TEXT NOT NULL,
  `user_type` VARCHAR(50) NOT NULL DEFAULT 'Rider',
  `document_id` VARCHAR(255) NULL,
  `status` ENUM('Pending','Approved','Rejected') NOT NULL DEFAULT 'Pending',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_rider_requests_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- buyer requests
DROP TABLE IF EXISTS `buyer_requests`;
CREATE TABLE `buyer_requests` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `first_name` VARCHAR(120) NOT NULL,
  `last_name` VARCHAR(120) NOT NULL,
  `password` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `phone_number` VARCHAR(32) NOT NULL,
  `address` TEXT NOT NULL,
  `user_type` VARCHAR(50) NOT NULL DEFAULT 'Buyer',
  `document_id` VARCHAR(255) NULL,
  `status` ENUM('Pending','Approved','Rejected') NOT NULL DEFAULT 'Pending',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_buyer_requests_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- products
DROP TABLE IF EXISTS `products`;
CREATE TABLE `products` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `product_id` VARCHAR(100) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `category` ENUM('Men','Women','Kids','Baby Clothes & Accessories','Toys & Games','Educational Materials','Strollers & Gear','Nursery Furniture','Safety and Health') NOT NULL,
  `description` TEXT NULL,
  `price` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `image` VARCHAR(255) NULL,
  `images` TEXT NULL,
  `sales` INT NOT NULL DEFAULT 0,
  `seller_email` VARCHAR(255) NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_products_product_id` (`product_id`),
  KEY `idx_products_seller` (`seller_email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- product variants (color + size combinations with individual stock levels)
DROP TABLE IF EXISTS `product_variants`;
CREATE TABLE `product_variants` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `product_id` INT NOT NULL,
  `color` VARCHAR(64) NOT NULL,
  `size` VARCHAR(64) NOT NULL,
  `stock` INT NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_variant` (`product_id`, `color`, `size`),
  KEY `idx_variant_product` (`product_id`),
  CONSTRAINT `fk_variant_product` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- cart
DROP TABLE IF EXISTS `cart`;
CREATE TABLE `cart` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `product_id` INT NULL,
  `name` VARCHAR(255) NOT NULL,
  `price` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `quantity` INT NOT NULL DEFAULT 1,
  `color` VARCHAR(64) NULL,
  `image` VARCHAR(255) NULL,
  `size` VARCHAR(64) NULL,
  `email` VARCHAR(255) NOT NULL,
  `seller_email` VARCHAR(255) NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_cart_email` (`email`),
  CONSTRAINT `fk_cart_product` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- checkout (items moved from cart awaiting payment)
DROP TABLE IF EXISTS `checkout`;
CREATE TABLE `checkout` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `product_id` INT NULL,
  `name` VARCHAR(255) NOT NULL,
  `price` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `quantity` INT NOT NULL DEFAULT 1,
  `color` VARCHAR(64) NULL,
  `image` VARCHAR(255) NULL,
  `size` VARCHAR(64) NULL,
  `email` VARCHAR(255) NOT NULL,
  `seller_email` VARCHAR(255) NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_checkout_email` (`email`),
  CONSTRAINT `fk_checkout_product` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- orders
DROP TABLE IF EXISTS `orders`;
CREATE TABLE `orders` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `product_id` INT NULL,
  `name` VARCHAR(255) NOT NULL,
  `quantity` INT NOT NULL DEFAULT 1,
  `color` VARCHAR(64) NULL,
  `size` VARCHAR(64) NULL,
  `date` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `total_price` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `subtotal` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `shipping_fee` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `tax` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `transaction_id` VARCHAR(150) NULL,
  `payment_method` VARCHAR(100) NULL,
  `action_history` TEXT NULL,
  `status` ENUM('Pending','Preparing','Prepared','Shipping','Delivered','Received','Shipped','Cancelled') NOT NULL DEFAULT 'Pending',
  `email` VARCHAR(255) NOT NULL,
  `seller_email` VARCHAR(255) NULL,
  `rider_email` VARCHAR(255) NULL,
  `image` VARCHAR(255) NULL,
  `delivery_address` TEXT NULL,
  `commission_amount` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `commission_rate` DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_orders_email` (`email`),
  KEY `idx_orders_date` (`date`),
  KEY `idx_orders_status` (`status`),
  CONSTRAINT `fk_orders_product` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- wishlist
DROP TABLE IF EXISTS `wishlist`;
CREATE TABLE `wishlist` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `email` VARCHAR(255) NOT NULL,
  `product_id` INT NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `price` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `image` VARCHAR(255) NULL,
  `seller_email` VARCHAR(255) NULL,
  `date_added` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_wishlist_email` (`email`),
  KEY `idx_wishlist_seller` (`seller_email`),
  CONSTRAINT `fk_wishlist_product` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- chat messages
DROP TABLE IF EXISTS `chat_messages`;
CREATE TABLE `chat_messages` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `thread_id` VARCHAR(500) NOT NULL,
  `sender` VARCHAR(255) NOT NULL,
  `sender_email` VARCHAR(255) NULL,
  `sender_role` ENUM('Admin','Seller','Buyer','Rider') NULL,
  `message` LONGTEXT NOT NULL,
  `timestamp` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `is_read` TINYINT(1) DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `idx_chat_thread` (`thread_id`),
  KEY `idx_chat_sender` (`sender_email`),
  KEY `idx_chat_timestamp` (`timestamp`),
  KEY `idx_chat_thread_time` (`thread_id`, `timestamp`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- seller reports
DROP TABLE IF EXISTS `seller_reports`;
CREATE TABLE `seller_reports` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `reporter_email` VARCHAR(255) NOT NULL,
  `reporter_name` VARCHAR(255) NULL,
  `reported_seller_email` VARCHAR(255) NOT NULL,
  `reported_seller_name` VARCHAR(255) NULL,
  `report_reason` ENUM('Fraudulent Activity','Poor Product Quality','Unprofessional Behavior','Spam or Scam','Inappropriate Content','Other') NOT NULL,
  `report_description` TEXT NOT NULL,
  `status` ENUM('Pending','Reviewed','Resolved','Dismissed') NOT NULL DEFAULT 'Pending',
  `admin_action` VARCHAR(255) NULL,
  `admin_notes` TEXT NULL,
  `reviewed_by` INT NULL,
  `reviewed_at` TIMESTAMP NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_reports_reporter` (`reporter_email`),
  KEY `idx_reports_seller` (`reported_seller_email`),
  KEY `idx_reports_status` (`status`),
  KEY `idx_reports_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Create seller_commissions table for tracking seller earnings
CREATE TABLE IF NOT EXISTS `seller_commissions` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `seller_email` VARCHAR(255) NOT NULL,
  `order_id` INT NOT NULL,
  `commission_amount` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `commission_rate` DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  `product_subtotal` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `date` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `status` ENUM('Pending','Completed','Withdrawn') NOT NULL DEFAULT 'Completed',
  PRIMARY KEY (`id`),
  KEY `idx_seller_commissions_email` (`seller_email`),
  KEY `idx_seller_commissions_order` (`order_id`),
  KEY `idx_seller_commissions_date` (`date`),
  CONSTRAINT `fk_seller_commissions_order` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_seller_commissions_user` FOREIGN KEY (`seller_email`) REFERENCES `users`(`email`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Create rider_earnings table for tracking delivery commissions
CREATE TABLE IF NOT EXISTS `rider_earnings` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `rider_email` VARCHAR(255) NOT NULL,
  `order_id` INT NOT NULL,
  `amount` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `date` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `status` ENUM('Pending','Completed','Withdrawn') NOT NULL DEFAULT 'Completed',
  PRIMARY KEY (`id`),
  KEY `idx_rider_earnings_email` (`rider_email`),
  KEY `idx_rider_earnings_order` (`order_id`),
  KEY `idx_rider_earnings_date` (`date`),
  CONSTRAINT `fk_rider_earnings_order` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_rider_earnings_user` FOREIGN KEY (`rider_email`) REFERENCES `users`(`email`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;

-- Add cancellation_reason column to orders table if it doesn't exist
ALTER TABLE `orders` ADD COLUMN `cancellation_reason` VARCHAR(500) NULL;

-- Insert default admin account
INSERT IGNORE INTO `users` 
(`first_name`, `last_name`, `password`, `email`, `phone_number`, `address`, `user_type`, `created_at`) 
VALUES 
('Admin', 'User', 'admin', 'admin@gmail.com', '9123456789', 'Admin Office', 'Admin', NOW());
