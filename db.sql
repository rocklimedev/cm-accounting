-- --------------------------------------------------------
-- Host:                         116.206.104.225
-- Server version:               5.7.23-23 - Percona Server (GPL), Release 23, Revision 500fcf5
-- Server OS:                    Linux
-- HeidiSQL Version:             12.17.0.7270
-- --------------------------------------------------------

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8 */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

-- Dumping structure for table spsyn8lm_cm_ledger.audit_logs
CREATE TABLE IF NOT EXISTS `audit_logs` (
  `id` char(36) COLLATE utf8_unicode_ci NOT NULL,
  `user_id` char(36) COLLATE utf8_unicode_ci DEFAULT NULL,
  `action` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `table_name` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `record_id` char(36) COLLATE utf8_unicode_ci DEFAULT NULL,
  `old_value` json DEFAULT NULL,
  `new_value` json DEFAULT NULL,
  `ip_address` varchar(100) COLLATE utf8_unicode_ci DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_audit_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- Data exporting was unselected.

-- Dumping structure for table spsyn8lm_cm_ledger.bank_transactions
CREATE TABLE IF NOT EXISTS `bank_transactions` (
  `id` char(36) COLLATE utf8_unicode_ci NOT NULL,
  `bank_name` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `type` enum('IN','OUT') COLLATE utf8_unicode_ci NOT NULL,
  `amount` decimal(18,2) NOT NULL,
  `reference_type` varchar(50) COLLATE utf8_unicode_ci DEFAULT NULL,
  `reference_id` char(36) COLLATE utf8_unicode_ci DEFAULT NULL,
  `description` text COLLATE utf8_unicode_ci,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_bank_date` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- Data exporting was unselected.

-- Dumping structure for table spsyn8lm_cm_ledger.cash_adjustments
CREATE TABLE IF NOT EXISTS `cash_adjustments` (
  `id` char(36) COLLATE utf8_unicode_ci NOT NULL,
  `adjustment_date` date NOT NULL,
  `type` enum('add','reduce') COLLATE utf8_unicode_ci NOT NULL,
  `amount` decimal(18,2) NOT NULL,
  `reason` text COLLATE utf8_unicode_ci NOT NULL,
  `added_by` char(36) COLLATE utf8_unicode_ci DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_cash_adj_user` (`added_by`),
  CONSTRAINT `fk_cash_adj_user` FOREIGN KEY (`added_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- Data exporting was unselected.

-- Dumping structure for table spsyn8lm_cm_ledger.cash_openings
CREATE TABLE IF NOT EXISTS `cash_openings` (
  `id` char(36) COLLATE utf8_unicode_ci NOT NULL,
  `opening_date` date NOT NULL,
  `amount` decimal(18,2) NOT NULL,
  `previous_amount` decimal(18,2) DEFAULT NULL,
  `reason` text COLLATE utf8_unicode_ci,
  `entered_by` char(36) COLLATE utf8_unicode_ci DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_cash_openings_user` (`entered_by`),
  CONSTRAINT `fk_cash_openings_user` FOREIGN KEY (`entered_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- Data exporting was unselected.

-- Dumping structure for table spsyn8lm_cm_ledger.cash_transactions
CREATE TABLE IF NOT EXISTS `cash_transactions` (
  `id` char(36) COLLATE utf8_unicode_ci NOT NULL,
  `type` enum('IN','OUT') COLLATE utf8_unicode_ci NOT NULL,
  `amount` decimal(18,2) NOT NULL,
  `reference_type` varchar(50) COLLATE utf8_unicode_ci DEFAULT NULL,
  `reference_id` char(36) COLLATE utf8_unicode_ci DEFAULT NULL,
  `description` text COLLATE utf8_unicode_ci,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_cash_date` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- Data exporting was unselected.

-- Dumping structure for table spsyn8lm_cm_ledger.daily_closing
CREATE TABLE IF NOT EXISTS `daily_closing` (
  `id` char(36) COLLATE utf8_unicode_ci NOT NULL,
  `report_date` date DEFAULT NULL,
  `sales_total` decimal(18,2) DEFAULT '0.00',
  `expense_total` decimal(18,2) DEFAULT '0.00',
  `cash_total` decimal(18,2) DEFAULT '0.00',
  `debtor_total` decimal(18,2) DEFAULT '0.00',
  `hash` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `report_date` (`report_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- Data exporting was unselected.

-- Dumping structure for table spsyn8lm_cm_ledger.debtor_entries
CREATE TABLE IF NOT EXISTS `debtor_entries` (
  `id` char(36) COLLATE utf8_unicode_ci NOT NULL,
  `debtor_report_id` char(36) COLLATE utf8_unicode_ci DEFAULT NULL,
  `entry_type` enum('new_debtor','debtor_received') COLLATE utf8_unicode_ci NOT NULL,
  `amount` decimal(18,2) NOT NULL,
  `payment_mode_id` char(36) COLLATE utf8_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_debtor_entries_report` (`debtor_report_id`),
  KEY `idx_debtor_entries_payment_mode_id` (`payment_mode_id`),
  CONSTRAINT `fk_debtor_entries_payment_mode` FOREIGN KEY (`payment_mode_id`) REFERENCES `payment_modes` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_debtor_entries_report` FOREIGN KEY (`debtor_report_id`) REFERENCES `debtor_reports` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- Data exporting was unselected.

-- Dumping structure for table spsyn8lm_cm_ledger.debtor_reports
CREATE TABLE IF NOT EXISTS `debtor_reports` (
  `id` char(36) COLLATE utf8_unicode_ci NOT NULL,
  `report_date` date NOT NULL,
  `opening_amount` decimal(18,2) DEFAULT '0.00',
  `new_debtor_total` decimal(18,2) DEFAULT '0.00',
  `received_total` decimal(18,2) DEFAULT '0.00',
  `closing_amount` decimal(18,2) DEFAULT '0.00',
  `remarks_cipher` text COLLATE utf8_unicode_ci,
  `remarks_iv` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `remarks_tag` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `remarks_key_version` varchar(50) COLLATE utf8_unicode_ci DEFAULT NULL,
  `hmac_signature` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `previous_hash` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `status` enum('draft','submitted','posted','void') COLLATE utf8_unicode_ci DEFAULT 'draft',
  `submitted_by` char(36) COLLATE utf8_unicode_ci DEFAULT NULL,
  `edit_reason` text COLLATE utf8_unicode_ci,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `debtor_no` varchar(20) COLLATE utf8_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `debtor_no` (`debtor_no`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- Data exporting was unselected.

-- Dumping structure for table spsyn8lm_cm_ledger.debtor_transactions
CREATE TABLE IF NOT EXISTS `debtor_transactions` (
  `id` char(36) COLLATE utf8_unicode_ci NOT NULL,
  `customer_name` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  `type` enum('NEW','PAYMENT','ADJUSTMENT') COLLATE utf8_unicode_ci NOT NULL,
  `amount` decimal(18,2) NOT NULL,
  `reference_type` varchar(50) COLLATE utf8_unicode_ci DEFAULT NULL,
  `reference_id` char(36) COLLATE utf8_unicode_ci DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_debtor_date` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- Data exporting was unselected.

-- Dumping structure for table spsyn8lm_cm_ledger.encryption_keys
CREATE TABLE IF NOT EXISTS `encryption_keys` (
  `id` char(36) COLLATE utf8_unicode_ci NOT NULL,
  `key_version` varchar(50) COLLATE utf8_unicode_ci DEFAULT NULL,
  `key_fingerprint` varchar(64) COLLATE utf8_unicode_ci DEFAULT NULL,
  `status` varchar(30) COLLATE utf8_unicode_ci DEFAULT 'active',
  `algorithm` varchar(50) COLLATE utf8_unicode_ci DEFAULT 'aes-256-gcm',
  `encrypted_key` text COLLATE utf8_unicode_ci,
  `activated_at` timestamp NULL DEFAULT NULL,
  `retired_at` timestamp NULL DEFAULT NULL,
  `notes` text COLLATE utf8_unicode_ci,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_encryption_keys_key_version` (`key_version`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- Data exporting was unselected.

-- Dumping structure for table spsyn8lm_cm_ledger.expense_items
CREATE TABLE IF NOT EXISTS `expense_items` (
  `id` char(36) COLLATE utf8_unicode_ci NOT NULL,
  `expense_report_id` char(36) COLLATE utf8_unicode_ci DEFAULT NULL,
  `expense_title` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `amount` decimal(18,2) DEFAULT NULL,
  `payment_mode_id` char(36) COLLATE utf8_unicode_ci DEFAULT NULL,
  `remarks_cipher` text COLLATE utf8_unicode_ci,
  `remarks_iv` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `remarks_tag` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `remarks_key_version` varchar(50) COLLATE utf8_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_expense_items_payment_mode_id` (`payment_mode_id`),
  CONSTRAINT `fk_expense_items_payment_mode` FOREIGN KEY (`payment_mode_id`) REFERENCES `payment_modes` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- Data exporting was unselected.

-- Dumping structure for table spsyn8lm_cm_ledger.expense_reports
CREATE TABLE IF NOT EXISTS `expense_reports` (
  `id` char(36) COLLATE utf8_unicode_ci NOT NULL,
  `expense_no` varchar(30) COLLATE utf8_unicode_ci NOT NULL,
  `report_date` date NOT NULL,
  `total_amount` decimal(18,2) DEFAULT '0.00',
  `created_by` char(36) COLLATE utf8_unicode_ci NOT NULL,
  `hmac_signature` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `previous_hash` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `status` enum('DRAFT','POSTED','VOID') COLLATE utf8_unicode_ci DEFAULT 'DRAFT',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_expense_no` (`expense_no`),
  KEY `idx_expense_reports_created_by` (`created_by`),
  CONSTRAINT `fk_expense_reports_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- Data exporting was unselected.

-- Dumping structure for table spsyn8lm_cm_ledger.expense_titles
CREATE TABLE IF NOT EXISTS `expense_titles` (
  `id` char(36) COLLATE utf8_unicode_ci NOT NULL,
  `title` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `title` (`title`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- Data exporting was unselected.

-- Dumping structure for table spsyn8lm_cm_ledger.ledger_entries
CREATE TABLE IF NOT EXISTS `ledger_entries` (
  `id` char(36) COLLATE utf8_unicode_ci NOT NULL,
  `entry_date` date NOT NULL,
  `account_name` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  `entry_type` enum('DEBIT','CREDIT') COLLATE utf8_unicode_ci NOT NULL,
  `amount` decimal(18,2) NOT NULL,
  `reference_type` varchar(50) COLLATE utf8_unicode_ci DEFAULT NULL,
  `reference_id` char(36) COLLATE utf8_unicode_ci DEFAULT NULL,
  `description` text COLLATE utf8_unicode_ci,
  `created_by` char(36) COLLATE utf8_unicode_ci DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_ledger_date` (`entry_date`),
  KEY `idx_ledger_account` (`account_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- Data exporting was unselected.

-- Dumping structure for table spsyn8lm_cm_ledger.payment_modes
CREATE TABLE IF NOT EXISTS `payment_modes` (
  `id` char(36) COLLATE utf8_unicode_ci NOT NULL,
  `name` varchar(100) COLLATE utf8_unicode_ci NOT NULL,
  `code` varchar(50) COLLATE utf8_unicode_ci NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE KEY `uk_payment_mode_code` (`code`),
  UNIQUE KEY `uk_payment_mode_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- Data exporting was unselected.

-- Dumping structure for table spsyn8lm_cm_ledger.role_permissions
CREATE TABLE IF NOT EXISTS `role_permissions` (
  `id` char(36) COLLATE utf8_unicode_ci NOT NULL,
  `role_id` char(36) COLLATE utf8_unicode_ci NOT NULL,
  `module` varchar(100) COLLATE utf8_unicode_ci NOT NULL,
  `can_create` tinyint(1) DEFAULT '0',
  `can_read` tinyint(1) DEFAULT '0',
  `can_update` tinyint(1) DEFAULT '0',
  `can_delete` tinyint(1) DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_role_module` (`role_id`,`module`),
  CONSTRAINT `fk_role_permissions_role` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- Data exporting was unselected.

-- Dumping structure for table spsyn8lm_cm_ledger.roles
CREATE TABLE IF NOT EXISTS `roles` (
  `id` char(36) COLLATE utf8_unicode_ci NOT NULL,
  `name` varchar(100) COLLATE utf8_unicode_ci NOT NULL,
  `description` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- Data exporting was unselected.

-- Dumping structure for table spsyn8lm_cm_ledger.sales_report_items
CREATE TABLE IF NOT EXISTS `sales_report_items` (
  `id` char(36) COLLATE utf8_unicode_ci NOT NULL,
  `sales_report_id` char(36) COLLATE utf8_unicode_ci NOT NULL,
  `payment_mode_id` char(36) COLLATE utf8_unicode_ci NOT NULL,
  `amount` decimal(18,2) NOT NULL DEFAULT '0.00',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE KEY `uk_sales_report_payment_mode` (`sales_report_id`,`payment_mode_id`),
  KEY `idx_sales_report_items_report` (`sales_report_id`) USING BTREE,
  KEY `idx_sales_report_items_payment_mode` (`payment_mode_id`) USING BTREE,
  CONSTRAINT `fk_sales_report_items_payment_mode` FOREIGN KEY (`payment_mode_id`) REFERENCES `payment_modes` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `fk_sales_report_items_report` FOREIGN KEY (`sales_report_id`) REFERENCES `sales_reports` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- Data exporting was unselected.

-- Dumping structure for table spsyn8lm_cm_ledger.sales_reports
CREATE TABLE IF NOT EXISTS `sales_reports` (
  `id` char(36) COLLATE utf8_unicode_ci NOT NULL,
  `sales_no` varchar(30) COLLATE utf8_unicode_ci NOT NULL,
  `report_date` date NOT NULL,
  `gross_amount` decimal(18,2) DEFAULT '0.00',
  `created_by` char(36) COLLATE utf8_unicode_ci NOT NULL,
  `remarks_cipher` text COLLATE utf8_unicode_ci,
  `remarks_iv` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `remarks_tag` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `remarks_key_version` varchar(50) COLLATE utf8_unicode_ci DEFAULT NULL,
  `hmac_signature` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `previous_hash` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `status` enum('DRAFT','POSTED','VOID') COLLATE utf8_unicode_ci DEFAULT 'DRAFT',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_sales_no` (`sales_no`),
  KEY `idx_sales_date` (`report_date`),
  KEY `idx_sales_reports_created_by` (`created_by`),
  CONSTRAINT `fk_sales_reports_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- Data exporting was unselected.

-- Dumping structure for table spsyn8lm_cm_ledger.users
CREATE TABLE IF NOT EXISTS `users` (
  `id` char(36) COLLATE utf8_unicode_ci NOT NULL,
  `name` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  `email` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  `password_hash` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  `role_id` char(36) COLLATE utf8_unicode_ci NOT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  KEY `fk_users_role` (`role_id`),
  CONSTRAINT `fk_users_role` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- Data exporting was unselected.

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;
