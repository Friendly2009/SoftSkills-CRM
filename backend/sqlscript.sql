SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0;
SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0;
SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';
CREATE SCHEMA IF NOT EXISTS `CheapCRM` DEFAULT CHARACTER SET utf8mb3;
USE `CheapCRM` ;
CREATE TABLE IF NOT EXISTS `company` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(255) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb3;
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `company_id` INT NOT NULL,
  `full_name` VARCHAR(255) NOT NULL,
  `role` VARCHAR(255) NOT NULL,
  `rank` INT NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `birthday` DATE DEFAULT NULL,
  `contact` VARCHAR(45) DEFAULT NULL,
  `gender` VARCHAR(3) DEFAULT NULL,
  `avatar` VARCHAR(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_user_company` (`id`, `company_id`),
  KEY `fk_users_company_idx` (`company_id`),
  CONSTRAINT `fk_users_company` FOREIGN KEY (`company_id`) REFERENCES `company` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb3;
CREATE TABLE IF NOT EXISTS `clients` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(255) NOT NULL,
  `avatar` TEXT NULL,
  `balance` DECIMAL(10,2) NOT NULL,
  `skills` INT NOT NULL,
  `status` TINYINT NOT NULL,
  `contact` VARCHAR(45) NOT NULL,
  `company_id` INT NOT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_clients_company_idx` (`company_id`),
  CONSTRAINT `fk_clients_company` FOREIGN KEY (`company_id`) REFERENCES `company` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb3;
CREATE TABLE IF NOT EXISTS `groups` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `users_id` INT NOT NULL,
  `name` VARCHAR(45) NOT NULL,
  `status` TINYINT NOT NULL,
  `start_date` DATE NOT NULL DEFAULT (CURRENT_DATE()),
  `end_date` DATE DEFAULT NULL,
  `max_students` INT NOT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_groups_users_idx` (`users_id`),
  CONSTRAINT `fk_groups_users` FOREIGN KEY (`users_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb3;
CREATE TABLE IF NOT EXISTS `group_members` (
  `group_id` INT NOT NULL,
  `client_id` INT NOT NULL,
  PRIMARY KEY (`group_id`, `client_id`),
  KEY `fk_group_members_clients_idx` (`client_id`),
  KEY `fk_group_members_groups_idx` (`group_id`),
  CONSTRAINT `fk_group_members_clients` FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_group_members_groups` FOREIGN KEY (`group_id`) REFERENCES `groups` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;
CREATE TABLE IF NOT EXISTS `group_schedules` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `day_of_week` VARCHAR(15) NOT NULL,
  `start_time` TIME NOT NULL,
  `end_time` TIME NOT NULL,
  `group_id` INT NOT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_group_schedules_groups_idx` (`group_id`),
  CONSTRAINT `fk_group_schedules_groups` FOREIGN KEY (`group_id`) REFERENCES `groups` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb3;
CREATE TABLE IF NOT EXISTS `lessons` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `lesson_date` DATE NOT NULL,
  `start_time` TIME NOT NULL,
  `end_time` TIME NOT NULL,
  `status` TINYINT NOT NULL,
  `group_id` INT NOT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_lessons_groups_idx` (`group_id`),
  CONSTRAINT `fk_lessons_groups` FOREIGN KEY (`group_id`) REFERENCES `groups` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;
SET SQL_MODE=@OLD_SQL_MODE;
SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS;
SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS;
ALTER TABLE users ADD COLUMN balance DECIMAL(10,2) NOT NULL DEFAULT 0.00 AFTER avatar;
ALTER TABLE lessons 
  ADD COLUMN user_id INT NOT NULL AFTER group_id,
  ADD COLUMN teacher_pay DECIMAL(10,2) NOT NULL DEFAULT 0.00 AFTER user_id,
  ADD KEY fk_lessons_users_idx (user_id),
  ADD CONSTRAINT fk_lessons_users FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE RESTRICT ON UPDATE CASCADE;
CREATE TABLE IF NOT EXISTS lesson_attendance (
  lesson_id INT NOT NULL,
  client_id INT NOT NULL,
  attendance_status TINYINT NOT NULL DEFAULT 1, 
  amount_charged DECIMAL(10,2) NOT NULL DEFAULT 0.00, 
  PRIMARY KEY (lesson_id, client_id),
  KEY fk_attendance_clients_idx (client_id),
  CONSTRAINT fk_attendance_lessons FOREIGN KEY (lesson_id) REFERENCES lessons (id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_attendance_clients FOREIGN KEY (client_id) REFERENCES clients (id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;
CREATE TABLE financial_transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_id INT NOT NULL,
    lesson_id INT NULL,
    description VARCHAR(255) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_tx_main_company FOREIGN KEY (company_id) REFERENCES company(id) ON DELETE CASCADE,
    CONSTRAINT fk_tx_main_lesson FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;
CREATE TABLE transaction_participants (
    id INT AUTO_INCREMENT PRIMARY KEY,
    transaction_id INT NOT NULL,
    client_id INT NULL,
    user_id INT NULL,  
    `role` ENUM('payer', 'recipient') NOT NULL, 
    amount DECIMAL(10, 2) NOT NULL, 
    CONSTRAINT fk_part_tx FOREIGN KEY (transaction_id) REFERENCES financial_transactions(id) ON DELETE CASCADE,
    CONSTRAINT fk_part_client FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL,
    CONSTRAINT fk_part_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT chk_participant CHECK (client_id IS NOT NULL OR user_id IS NOT NULL)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;
CREATE OR REPLACE VIEW select_schedules_of_groups AS
SELECT 
    gs.id AS schedule_id,
    gs.day_of_week,
    gs.start_time,
    gs.end_time,
    g.name AS group_name,
    u.full_name AS user_name,
    u.company_id
FROM group_schedules gs
JOIN `groups` g ON gs.group_id = g.id
JOIN users u ON g.users_id = u.id;