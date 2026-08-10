SET @OLD_UNIQUE_CHECKS = @@UNIQUE_CHECKS, UNIQUE_CHECKS = 0;
SET @OLD_FOREIGN_KEY_CHECKS = @@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS = 0;
SET @OLD_SQL_MODE = @@SQL_MODE, SQL_MODE = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';

CREATE SCHEMA IF NOT EXISTS `CheapCRM` DEFAULT CHARACTER

SET utf8mb3; USE `CheapCRM`
;

CREATE TABLE IF NOT EXISTS `company` ( `id` INT NOT NULL AUTO_INCREMENT, `name` VARCHAR(255) NOT NULL, PRIMARY KEY (`id`) ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb3;

CREATE TABLE IF NOT EXISTS `users` ( `id` INT NOT NULL AUTO_INCREMENT, `company_id` INT NOT NULL, `full_name` VARCHAR(255) NOT NULL, `role` VARCHAR(255) NOT NULL, `rank` INT NOT NULL, `email` VARCHAR(255) NOT NULL, `password_hash` VARCHAR(255) NOT NULL, `birthday` DATE DEFAULT NULL, `contact` VARCHAR(45) DEFAULT NULL, `gender` VARCHAR(3) DEFAULT NULL, `avatar` VARCHAR(255) DEFAULT NULL, PRIMARY KEY (`id`), UNIQUE KEY `idx_user_company` (`id`, `company_id`), KEY `fk_users_company_idx` (`company_id`), CONSTRAINT `fk_users_company` FOREIGN KEY (`company_id`) REFERENCES `company` (`id`)
ON
DELETE CASCADE
ON UPDATE CASCADE ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb3;

CREATE TABLE IF NOT EXISTS `clients` ( `id` INT NOT NULL AUTO_INCREMENT, `name` VARCHAR(255) NOT NULL, `avatar` TEXT NULL, `balance` DECIMAL(10, 2) NOT NULL, `skills` INT NOT NULL, `status` TINYINT NOT NULL, `contact` VARCHAR(45) NOT NULL, `company_id` INT NOT NULL, PRIMARY KEY (`id`), KEY `fk_clients_company_idx` (`company_id`), CONSTRAINT `fk_clients_company` FOREIGN KEY (`company_id`) REFERENCES `company` (`id`)
ON
DELETE CASCADE
ON UPDATE CASCADE ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb3;

CREATE TABLE IF NOT EXISTS `groups` ( `id` INT NOT NULL AUTO_INCREMENT, `users_id` INT NOT NULL, `name` VARCHAR(45) NOT NULL, `status` TINYINT NOT NULL -- 1 активен 2 набор 3 архив 
 , `start_date` DATE NOT NULL DEFAULT (CURRENT_DATE()), `end_date` DATE DEFAULT NULL, `max_students` INT NOT NULL, PRIMARY KEY (`id`), KEY `fk_groups_users_idx` (`users_id`), CONSTRAINT `fk_groups_users` FOREIGN KEY (`users_id`) REFERENCES `users` (`id`)
ON
DELETE RESTRICT
ON UPDATE CASCADE ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb3;

CREATE TABLE IF NOT EXISTS `group_members` ( `group_id` INT NOT NULL, `client_id` INT NOT NULL, PRIMARY KEY (`group_id`, `client_id`), KEY `fk_group_members_clients_idx` (`client_id`), KEY `fk_group_members_groups_idx` (`group_id`), CONSTRAINT `fk_group_members_clients` FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`)
ON
DELETE CASCADE
ON UPDATE CASCADE, CONSTRAINT `fk_group_members_groups` FOREIGN KEY (`group_id`) REFERENCES `groups` (`id`)
ON
DELETE CASCADE
ON UPDATE CASCADE ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb3;

CREATE TABLE IF NOT EXISTS `group_schedules` ( `id` INT NOT NULL AUTO_INCREMENT, `day_of_week` VARCHAR(15) NOT NULL, `start_time` TIME NOT NULL, `end_time` TIME NOT NULL, `group_id` INT NOT NULL, PRIMARY KEY (`id`), KEY `fk_group_schedules_groups_idx` (`group_id`), CONSTRAINT `fk_group_schedules_groups` FOREIGN KEY (`group_id`) REFERENCES `groups` (`id`)
ON
DELETE CASCADE
ON UPDATE CASCADE ) ENGINE = InnoDB AUTO_INCREMENT = 5 DEFAULT CHARSET = utf8mb3;

CREATE TABLE IF NOT EXISTS `lessons` ( `id` INT NOT NULL AUTO_INCREMENT, `lesson_date` DATE NOT NULL, `start_time` TIME NOT NULL, `end_time` TIME NOT NULL, `status` TINYINT NOT NULL -- 1 = запланирован 2 = проведен (если проведен то бекенд при повторной попытке не даст закрыть урок) 
 , `group_id` INT NOT NULL, PRIMARY KEY (`id`), KEY `fk_lessons_groups_idx` (`group_id`), CONSTRAINT `fk_lessons_groups` FOREIGN KEY (`group_id`) REFERENCES `groups` (`id`)
ON
DELETE CASCADE
ON UPDATE CASCADE ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb3;
SET SQL_MODE = @OLD_SQL_MODE;
SET FOREIGN_KEY_CHECKS = @OLD_FOREIGN_KEY_CHECKS;
SET UNIQUE_CHECKS = @OLD_UNIQUE_CHECKS;

ALTER TABLE users ADD COLUMN balance DECIMAL(10, 2) NOT NULL DEFAULT 0.00 AFTER avatar;

ALTER TABLE lessons ADD COLUMN user_id INT NOT NULL AFTER group_id, ADD COLUMN teacher_pay DECIMAL(10, 2) NOT NULL DEFAULT 0.00 AFTER user_id, ADD KEY fk_lessons_users_idx (user_id), ADD CONSTRAINT fk_lessons_users FOREIGN KEY (user_id) REFERENCES users (id)
ON
DELETE RESTRICT
ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS lesson_attendance ( lesson_id INT NOT NULL, client_id INT NOT NULL, attendance_status TINYINT NOT NULL DEFAULT 1 --1 = был 2 = прогул 3 = уважительная причина 
 , amount_charged DECIMAL(10, 2) NOT NULL DEFAULT 0.00, PRIMARY KEY (lesson_id, client_id), KEY fk_attendance_clients_idx (client_id), CONSTRAINT fk_attendance_lessons FOREIGN KEY (lesson_id) REFERENCES lessons (id)
ON
DELETE CASCADE
ON UPDATE CASCADE, CONSTRAINT fk_attendance_clients FOREIGN KEY (client_id) REFERENCES clients (id)
ON
DELETE CASCADE
ON UPDATE CASCADE ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb3;

CREATE TABLE `financial_transactions` ( `id` int NOT NULL AUTO_INCREMENT, `company_id` int NOT NULL, `lesson_id` int DEFAULT NULL, `client_id` int DEFAULT NULL, `user_id` int DEFAULT NULL, `amount` decimal(10, 2) NOT NULL, `type` enum('revenue', 'expense', 'wallet_topup', 'correction') NOT NULL, `description` varchar(255) DEFAULT NULL, `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY (`id`), KEY `idx_tx_company` (`company_id`), KEY `idx_tx_lesson` (`lesson_id`), KEY `idx_tx_client` (`client_id`), KEY `idx_tx_user` (`user_id`), KEY `idx_tx_type` (`type`), CONSTRAINT `fk_tx_client` FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`)
ON DELETE

SET NULL
ON UPDATE CASCADE, CONSTRAINT `fk_tx_company` FOREIGN KEY (`company_id`) REFERENCES `company` (`id`)
ON
DELETE CASCADE
ON UPDATE CASCADE, CONSTRAINT `fk_tx_lesson` FOREIGN KEY (`lesson_id`) REFERENCES `lessons` (`id`)
ON DELETE

SET NULL
ON UPDATE CASCADE, CONSTRAINT `fk_tx_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
ON DELETE

SET NULL
ON UPDATE CASCADE ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb3

CREATE ALGORITHM = UNDEFINED DEFINER = `root`@`localhost` SQL SECURITY DEFINER VIEW `cheapcrm`.`accupancy_rate` AS
SELECT  `u`.`company_id`                                                                               AS `company_id`
       ,`g`.`id`                                                                                       AS `group_id`
       ,`g`.`name`                                                                                     AS `group_name`
       ,`g`.`status`                                                                                   AS `group_status`
       ,`g`.`max_students`                                                                             AS `max_capacity`
       ,`u`.`full_name`                                                                                AS `teacher_name`
       ,COUNT(`gm`.`client_id`)                                                                        AS `current_students`
       ,IF((`g`.`max_students` > 0),ROUND(((COUNT(`gm`.`client_id`) / `g`.`max_students`) * 100),1),0) AS `occupancy_rate`
FROM
((`cheapcrm`.`groups` `g`
	LEFT JOIN `cheapcrm`.`users` `u`
	ON ((`g`.`users_id` = `u`.`id`)))
	LEFT JOIN `cheapcrm`.`group_members` `gm`
	ON ((`g`.`id` = `gm`.`group_id`))
)
GROUP BY  `g`.`id`
         ,`u`.`id`
         ,`u`.`company_id`;

CREATE ALGORITHM = UNDEFINED DEFINER = `root`@`localhost` SQL SECURITY DEFINER VIEW `cheapcrm`.`select_schedules_of_groups` AS
SELECT  `gs`.`id`          AS `schedule_id`
       ,`gs`.`day_of_week` AS `day_of_week`
       ,`gs`.`start_time`  AS `start_time`
       ,`gs`.`end_time`    AS `end_time`
       ,`g`.`name`         AS `group_name`
       ,`u`.`full_name`    AS `user_name`
       ,`u`.`company_id`   AS `company_id`
       ,`l`.`id`           AS `lesson_id`
FROM
(((`cheapcrm`.`group_schedules` `gs`
	JOIN `cheapcrm`.`groups` `g`
	ON ((`gs`.`group_id` = `g`.`id`)))
	JOIN `cheapcrm`.`users` `u`
	ON ((`g`.`users_id` = `u`.`id`)))
	LEFT JOIN `cheapcrm`.`lessons` `l`
	ON ((`l`.`group_id` = `g`.`id`))
);

CREATE OR REPLACE VIEW `view_financial_summary` AS
SELECT  c.id                                                                                                  AS company_id
       ,c.name                                                                                                AS company_name
       ,COALESCE(SUM(CASE WHEN tp.role = 'payer' AND tp.client_id IS NOT NULL THEN tp.amount ELSE 0 END),0)   AS total_revenue
       ,COALESCE(SUM(CASE WHEN tp.role = 'recipient' AND tp.user_id IS NOT NULL THEN tp.amount ELSE 0 END),0) AS total_expenses
       ,(COALESCE(SUM(CASE WHEN tp.role = 'payer' AND tp.client_id IS NOT NULL THEN tp.amount ELSE 0 END),0) - COALESCE(SUM(CASE WHEN tp.role = 'recipient' AND tp.user_id IS NOT NULL THEN tp.amount ELSE 0 END),0)) AS net_profit
       ,COALESCE((
SELECT  SUM(ABS(cl.balance))
FROM clients cl
WHERE cl.company_id = c.id
AND cl.balance < 0), 0) AS total_client_debt
FROM company c
LEFT JOIN financial_transactions ft
ON ft.company_id = c.id
LEFT JOIN transaction_participants tp
ON tp.transaction_id = ft.id
GROUP BY  c.id
         ,c.name;

CREATE ALGORITHM = UNDEFINED DEFINER = `root`@`localhost` SQL SECURITY DEFINER VIEW `cheapcrm`.`state_clients_balance` AS
SELECT  `c`.`id`                                                 AS `company_id`
       ,`c`.`name`                                               AS `company_name`
       ,SUM((CASE WHEN (`cl`.`balance` > 0) THEN 1 ELSE 0 END))  AS `client_with_positive_account`
       ,SUM((CASE WHEN (`cl`.`balance` <= 0) THEN 1 ELSE 0 END)) AS `client_wth_negative_account`
       ,COUNT(`cl`.`id`)                                         AS `total_clients`
FROM
(`cheapcrm`.`company` `c`
	LEFT JOIN `cheapcrm`.`clients` `cl`
	ON ((`c`.`id` = `cl`.`company_id`))
)
GROUP BY  `c`.`id`
         ,`c`.`name`;

CREATE ALGORITHM = UNDEFINED DEFINER = `root`@`localhost` SQL SECURITY DEFINER VIEW `cheapcrm`.`v_lesson_details` AS
SELECT  `l`.`id`           AS `lesson_id`
       ,`l`.`lesson_date`  AS `lesson_date`
       ,`l`.`start_time`   AS `start_time`
       ,`l`.`end_time`     AS `end_time`
       ,`l`.`status`       AS `lesson_status`
       ,`l`.`teacher_pay`  AS `teacher_pay`
       ,`g`.`id`           AS `group_id`
       ,`g`.`name`         AS `group_name`
       ,`g`.`status`       AS `group_status`
       ,`g`.`max_students` AS `max_students`
       ,`u`.`id`           AS `teacher_id`
       ,`u`.`full_name`    AS `teacher_name`
       ,`u`.`email`        AS `teacher_email`
       ,`u`.`balance`      AS `teacher_balance`
       ,`c`.`id`           AS `company_id`
       ,`c`.`name`         AS `company_name`
       ,(
SELECT  COUNT(0)
FROM `cheapcrm`.`group_members` `gm`
WHERE (`gm`.`group_id` = `g`.`id`)) AS `current_students_count`, IFNULL(SUM(`la`.`amount_charged`), 0.00) AS `total_revenue_charged`
FROM
((((`cheapcrm`.`lessons` `l`
	JOIN `cheapcrm`.`groups` `g`
	ON ((`l`.`group_id` = `g`.`id`)))
	JOIN `cheapcrm`.`users` `u`
	ON ((`l`.`user_id` = `u`.`id`)))
	JOIN `cheapcrm`.`company` `c`
	ON ((`u`.`company_id` = `c`.`id`)))
	LEFT JOIN `cheapcrm`.`lesson_attendance` `la`
	ON ((`l`.`id` = `la`.`lesson_id`))
)
GROUP BY  `l`.`id`
         ,`g`.`id`
         ,`u`.`id`
         ,`c`.`id`;

CREATE ALGORITHM = UNDEFINED DEFINER = `root`@`localhost` SQL SECURITY DEFINER VIEW `cheapcrm`.`view_company_finance` AS
SELECT  `c`.`id`                     AS `company_id`
       ,`c`.`name`                   AS `company_name`
       ,COUNT(`cl`.`id`)             AS `total_clients`
       ,SUM(`cl`.`balance`)          AS `total_balance`
       ,ROUND(AVG(`cl`.`balance`),2) AS `average_client_balance`
FROM
(`cheapcrm`.`company` `c`
	LEFT JOIN `cheapcrm`.`clients` `cl`
	ON ((`c`.`id` = `cl`.`company_id`))
)
GROUP BY  `c`.`id`
         ,`c`.`name`;

CREATE ALGORITHM = UNDEFINED DEFINER = `root`@`localhost` SQL SECURITY DEFINER VIEW `cheapcrm`.`view_company_financial_flow` AS
SELECT  `cheapcrm`.`ft`.`id`          AS `transaction_id`
       ,`cheapcrm`.`ft`.`company_id`  AS `company_id`
       ,`cheapcrm`.`ft`.`lessons_id`  AS `lesson_id`
       ,`cheapcrm`.`ft`.`created_at`  AS `date`
       ,`cheapcrm`.`ft`.`description` AS `operation_description`
       ,(case WHEN (`cheapcrm`.`tp`.`role` = 'payer') THEN `cheapcrm`.`c`.`name` WHEN (`cheapcrm`.`tp`.`role` = 'recipient') THEN `cheapcrm`.`u`.`full_name` else 'Неизвестно' end) AS `participant_name`
       ,`cheapcrm`.`tp`.`role`        AS `participant_role`
       ,(case WHEN (`cheapcrm`.`tp`.`role` = 'payer') THEN 'Доход (Списание со студента)' WHEN (`cheapcrm`.`tp`.`role` = 'recipient') THEN 'Расход (Выплата преподавателю)' else 'Другое' end) AS `transaction_type`
       ,`cheapcrm`.`tp`.`amount`      AS `amount`
FROM
(((`cheapcrm`.`financial_transactions` `ft`
	JOIN `cheapcrm`.`transaction_participants` `tp`
	ON ((`cheapcrm`.`ft`.`id` = `cheapcrm`.`tp`.`transaction_id`) ))
	LEFT JOIN `cheapcrm`.`clients` `c`
	ON ((`cheapcrm`.`tp`.`client_id` = `cheapcrm`.`c`.`id`) ))
	LEFT JOIN `cheapcrm`.`users` `u`
	ON ((`cheapcrm`.`tp`.`user_id` = `cheapcrm`.`u`.`id`) )
)
ORDER BY `cheapcrm`.`ft`.`created_at` desc;

CREATE ALGORITHM = UNDEFINED DEFINER = `root`@`localhost` SQL SECURITY DEFINER VIEW `cheapcrm`.`view_financial_summary` AS
SELECT  `cheapcrm`.`c`.`id`   AS `company_id`
       ,`cheapcrm`.`c`.`name` AS `company_name`
       ,COALESCE(SUM((CASE WHEN ((`cheapcrm`.`tp`.`role` = 'payer') AND (`cheapcrm`.`tp`.`client_id` IS NOT NULL)) THEN `cheapcrm`.`tp`.`amount` ELSE 0 END)),0) AS `total_revenue`
       ,COALESCE(SUM((CASE WHEN ((`cheapcrm`.`tp`.`role` = 'recipient') AND (`cheapcrm`.`tp`.`user_id` IS NOT NULL)) THEN `cheapcrm`.`tp`.`amount` ELSE 0 END)),0) AS `total_expenses`
       ,(COALESCE(SUM((CASE WHEN ((`cheapcrm`.`tp`.`role` = 'payer') AND (`cheapcrm`.`tp`.`client_id` IS NOT NULL)) THEN `cheapcrm`.`tp`.`amount` ELSE 0 END)),0) - COALESCE(SUM((CASE WHEN ((`cheapcrm`.`tp`.`role` = 'recipient') AND (`cheapcrm`.`tp`.`user_id` IS NOT NULL)) THEN `cheapcrm`.`tp`.`amount` ELSE 0 END)),0)) AS `net_profit`
       ,COALESCE((
SELECT  SUM(ABS(`cheapcrm`.`cl`.`balance`))
FROM `cheapcrm`.`clients` `cl`
WHERE ((`cheapcrm`.`cl`.`company_id` = `cheapcrm`.`c`.`id`) AND (`cheapcrm`.`cl`.`balance` < 0))), 0) AS `total_client_debt`
FROM
((`cheapcrm`.`company` `c`
	LEFT JOIN `cheapcrm`.`financial_transactions` `ft`
	ON ((`cheapcrm`.`ft`.`company_id` = `cheapcrm`.`c`.`id`)))
	LEFT JOIN `cheapcrm`.`transaction_participants` `tp`
	ON ((`cheapcrm`.`tp`.`transaction_id` = `cheapcrm`.`ft`.`id`))
)
GROUP BY  `cheapcrm`.`c`.`id`
         ,`cheapcrm`.`c`.`name`;

CREATE ALGORITHM = UNDEFINED DEFINER = `root`@`localhost` SQL SECURITY DEFINER VIEW `cheapcrm`.`view_groups_analytics` AS
SELECT  `g`.`id`                                                                 AS `group_id`
       ,`g`.`name`                                                               AS `group_name`
       ,`g`.`status`                                                             AS `group_status`
       ,`u`.`company_id`                                                         AS `company_id`
       ,`u`.`full_name`                                                          AS `teacher_name`
       ,`g`.`max_students`                                                       AS `max_students`
       ,COUNT(DISTINCT `gm`.`client_id`)                                         AS `current_students_count`
       ,ROUND(((COUNT(DISTINCT `gm`.`client_id`) / `g`.`max_students`) * 100),2) AS `occupancy_rate_percent`
       ,COUNT(DISTINCT (CASE WHEN (`l`.`status` = 2) THEN `l`.`id` END))         AS `conducted_lessons_count`
       ,ROUND(((COUNT((CASE WHEN ((`la`.`attendance_status` = 1) AND (`l`.`status` = 2)) THEN 1 END)) / NULLIF(COUNT((CASE WHEN (`l`.`status` = 2) THEN `la`.`client_id` END)),0)) * 100),2) AS `attendance_rate_percent`
FROM
((((`cheapcrm`.`groups` `g`
	JOIN `cheapcrm`.`users` `u`
	ON ((`g`.`users_id` = `u`.`id`)))
	LEFT JOIN `cheapcrm`.`group_members` `gm`
	ON ((`g`.`id` = `gm`.`group_id`)))
	LEFT JOIN `cheapcrm`.`lessons` `l`
	ON ((`g`.`id` = `l`.`group_id`)))
	LEFT JOIN `cheapcrm`.`lesson_attendance` `la`
	ON ((`l`.`id` = `la`.`lesson_id`))
)
GROUP BY  `g`.`id`
         ,`g`.`name`
         ,`g`.`status`
         ,`u`.`company_id`
         ,`u`.`full_name`
         ,`g`.`max_students`;