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

create or replace view state_clients_balance as
select
	c.id as company_id,
    c.name as company_name,
    sum(case when cl.balance > 0 then 1 else 0 end) as client_with_positive_account,
    sum(case when cl.balance <= 0 then 1 else 0 end) as client_wth_negative_account,
    count(cl.id) as total_clients
from company c
left join clients cl on c.id = cl.company_id
group by c.id, c.name;

create or replace view view_company_finance as 
select 
	c.id as company_id,
    c.name as company_name,
    count(cl.id) as total_clients,
    sum(cl.balance) as total_balance,
    round(avg(cl.balance), 2) as average_client_balance
from company c
left join clients cl on c.id = cl.company_id
group by c.id, c.name

create or replace view `cheapcrm`.`accupancy_rate` as 
SELECT 
	u.company_id AS company_id,
    g.id AS group_id,
    g.name AS group_name,
    g.status AS group_status,
    g.max_students AS max_capacity,
    u.full_name AS teacher_name,
    COUNT(gm.client_id) AS current_students,
    IF(g.max_students > 0, ROUND((COUNT(gm.client_id) / g.max_students) * 100, 1), 0) AS occupancy_rate
FROM `groups` g
LEFT JOIN `users` u ON g.users_id = u.id
LEFT JOIN `group_members` gm ON g.id = gm.group_id
GROUP BY g.id, u.id, u.company_id;