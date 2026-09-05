# SoftSkills CRM
## About this project
A commercial crm system for educational institutions offering extracurricular supplementary activities. 
This project addresses issues regarding the tracking of profit allocation across roles within the class attendance hierarchy, as well as other financial matters concerning the educational institution.
Distributing the code online is discouraged.
##  Getting Started

### 1. Prerequisites

Make sure you have [Node.js](https://nodejs.org) and [MySQL Server](https://mysql.com) installed on your machine.

### 2. Environment Setup

Create a `.env` file in the backend directory and configure the environment variables:

```env
FRONTEND_PORT=5173
FRONTEND_HOST=localhost

SESSION_SECRET='your_session_secret_key'

BACKEND_PORT=3000
BACKEND_HOST=localhost

DB_HOST=localhost
DB_ROLE=your_username
DB_PASSWORD=your_password
DB_NAME='database'
```

_> **Note:** The above configuration is for local development environments only._

### 3. Database Initialization

This project uses MySQL. You can initialize the database using MySQL Workbench or any other database client.

Execute the following script to create the database schema:

```sql
SET @OLD_UNIQUE_CHECKS = @@UNIQUE_CHECKS, UNIQUE_CHECKS = 0;
SET @OLD_FOREIGN_KEY_CHECKS = @@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS = 0;
SET @OLD_SQL_MODE = @@SQL_MODE, SQL_MODE = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';

CREATE SCHEMA IF NOT EXISTS `soft-skills crm` DEFAULT CHARACTER SET utf8mb3; 
USE `soft-skills crm`;

CREATE TABLE IF NOT EXISTS `company` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(255) NOT NULL,
    PRIMARY KEY (`id`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb3;

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
    `balance` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    PRIMARY KEY (`id`),
    UNIQUE KEY `idx_user_company` (`id`, `company_id`),
    KEY `fk_users_company_idx` (`company_id`),
    CONSTRAINT `fk_users_company` FOREIGN KEY (`company_id`) 
        REFERENCES `company` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb3;

CREATE TABLE IF NOT EXISTS `clients` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(255) NOT NULL,
    `avatar` TEXT NULL,
    `balance` DECIMAL(10, 2) NOT NULL,
    `skills` INT,
    `status` TINYINT,
    `contact` VARCHAR(45) NOT NULL,
    `company_id` INT NOT NULL,
    PRIMARY KEY (`id`),
    KEY `fk_clients_company_idx` (`company_id`),
    CONSTRAINT `fk_clients_company` FOREIGN KEY (`company_id`) 
        REFERENCES `company` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb3;

CREATE TABLE IF NOT EXISTS `groups` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `users_id` INT NOT NULL,
    `name` VARCHAR(45) NOT NULL,
    `status` TINYINT NOT NULL DEFAULT 1 COMMENT '1 = активен, 2 = набор, 3 = архив',
    `start_date` DATE DEFAULT NULL,
    `end_date` DATE DEFAULT NULL,
    `max_students` INT NOT NULL,
    PRIMARY KEY (`id`),
    KEY `fk_groups_users_idx` (`users_id`),
    CONSTRAINT `fk_groups_users` FOREIGN KEY (`users_id`) 
        REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb3;

CREATE TABLE IF NOT EXISTS `group_members` (
    `group_id` INT NOT NULL,
    `client_id` INT NOT NULL,
    PRIMARY KEY (`group_id`, `client_id`),
    KEY `fk_group_members_clients_idx` (`client_id`),
    KEY `fk_group_members_groups_idx` (`group_id`),
    CONSTRAINT `fk_group_members_clients` FOREIGN KEY (`client_id`) 
        REFERENCES `clients` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `fk_group_members_groups` FOREIGN KEY (`group_id`) 
        REFERENCES `groups` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb3;

CREATE TABLE IF NOT EXISTS `group_schedules` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `day_of_week` VARCHAR(15) NOT NULL,
    `start_time` TIME NOT NULL,
    `end_time` TIME NOT NULL,
    `group_id` INT NOT NULL,
    PRIMARY KEY (`id`),
    KEY `fk_group_schedules_groups_idx` (`group_id`),
    CONSTRAINT `fk_group_schedules_groups` FOREIGN KEY (`group_id`) 
        REFERENCES `groups` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB AUTO_INCREMENT = 5 DEFAULT CHARSET = utf8mb3;

CREATE TABLE IF NOT EXISTS `lessons` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `group_id` INT NOT NULL,
    `user_id` INT NOT NULL,
    `lesson_date` DATE NOT NULL,
    `start_time` TIME NOT NULL,
    `end_time` TIME NOT NULL,
    `status` TINYINT NOT NULL COMMENT '1 = запланирован, 2 = проведен',
    `teacher_pay` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    PRIMARY KEY (`id`),
    KEY `fk_lessons_groups_idx` (`group_id`),
    KEY `fk_lessons_users_idx` (`user_id`),
    CONSTRAINT `fk_lessons_groups` FOREIGN KEY (`group_id`) 
        REFERENCES `groups` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `fk_lessons_users` FOREIGN KEY (`user_id`) 
        REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb3;

CREATE TABLE IF NOT EXISTS `lesson_attendance` (
    `lesson_id` INT NOT NULL,
    `client_id` INT NOT NULL,
    `attendance_status` TINYINT NOT NULL DEFAULT 1 COMMENT '1 = был, 2 = прогул, 3 = уважительная причина',
    `amount_charged` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    PRIMARY KEY (`lesson_id`, `client_id`),
    KEY `fk_attendance_clients_idx` (`client_id`),
    CONSTRAINT `fk_attendance_lessons` FOREIGN KEY (`lesson_id`) 
        REFERENCES `lessons` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `fk_attendance_clients` FOREIGN KEY (`client_id`) 
        REFERENCES `clients` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb3;

CREATE TABLE IF NOT EXISTS `financial_transactions` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `company_id` INT NOT NULL,
    `lesson_id` INT DEFAULT NULL,
    `client_id` INT DEFAULT NULL,
    `user_id` INT DEFAULT NULL,
    `amount` DECIMAL(10, 2) NOT NULL,
    `type` ENUM('revenue', 'expense', 'wallet_topup', 'correction') NOT NULL,
    `description` VARCHAR(255) DEFAULT NULL,
    `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_tx_company` (`company_id`),
    KEY `idx_tx_lesson` (`lesson_id`),
    KEY `idx_tx_client` (`client_id`),
    KEY `idx_tx_user` (`user_id`),
    KEY `idx_tx_type` (`type`),
    CONSTRAINT `fk_tx_client` FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT `fk_tx_company` FOREIGN KEY (`company_id`) REFERENCES `company` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `fk_tx_lesson` FOREIGN KEY (`lesson_id`) REFERENCES `lessons` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT `fk_tx_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb3;

CREATE TABLE IF NOT EXISTS `lead_loss_reasons` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `reason_text` VARCHAR(255) NOT NULL,
    PRIMARY KEY (`id`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb3;

CREATE TABLE IF NOT EXISTS `leads` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `company_id` INT NOT NULL,
    `user_id` INT DEFAULT NULL,
    `loss_reason_id` INT DEFAULT NULL,
    `name` VARCHAR(255) NOT NULL,
    `contact` VARCHAR(45) NOT NULL,
    `status` ENUM('new', 'in_progress', 'trial_scheduled', 'trial_attended', 'won', 'lost') NOT NULL DEFAULT 'new',
    `source` VARCHAR(100) DEFAULT NULL,
    `description` TEXT DEFAULT NULL,
    `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    CONSTRAINT `fk_leads_loss_reason` FOREIGN KEY (`loss_reason_id`) 
        REFERENCES `lead_loss_reasons` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb3;

CREATE TABLE `feedbacks` (
  `id` int NOT NULL AUTO_INCREMENT,
  `message` longtext NOT NULL,
  `user_id` int NOT NULL,
  `rate` tinyint NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_fedback_user_idx` (`user_id`),
  CONSTRAINT `fk_fedback_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

CREATE TABLE `tg_users` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `username` varchar(45) NOT NULL,
  `first_name` varchar(45) NOT NULL,
  `role` enum('user','admin') NOT NULL DEFAULT 'user',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

CREATE TABLE `tg_messages` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `tg_user_id` bigint NOT NULL,
  `message` longtext NOT NULL,
  `direction` enum('inbound','outbound') NOT NULL,
  `tg_message_id` bigint DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_tg_user_message_idx` (`tg_user_id`),
  CONSTRAINT `fk_tg_user_message` FOREIGN KEY (`tg_user_id`) REFERENCES `tg_users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;
ALTER TABLE `tg_users` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE `tg_messages` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

--<================================================>--
--<======================VIEW======================>--
--<================================================>--
CREATE OR REPLACE ALGORITHM = UNDEFINED DEFINER = `root`@`localhost` SQL SECURITY DEFINER VIEW ` soft-skills crm`.`accupancy_rate` AS
SELECT  
    `u`.`company_id` AS `company_id`,
    `g`.`id` AS `group_id`,
    `g`.`name` AS `group_name`,
    `g`.`status` AS `group_status`,
    `g`.`max_students` AS `max_capacity`,
    `u`.`full_name` AS `teacher_name`,
    COUNT(`gm`.`client_id`) AS `current_students`,
    IF((`g`.`max_students` > 0), ROUND(((COUNT(`gm`.`client_id`) / `g`.`max_students`) * 100), 1), 0) AS `occupancy_rate`
FROM ` soft-skills crm`.`groups` `g`
LEFT JOIN ` soft-skills crm`.`users` `u` ON `g`.`users_id` = `u`.`id`
LEFT JOIN ` soft-skills crm`.`group_members` `gm` ON `g`.`id` = `gm`.`group_id`
GROUP BY `g`.`id`, `u`.`id`, `u`.`company_id`;

CREATE OR REPLACE ALGORITHM = UNDEFINED DEFINER = `root`@`localhost` SQL SECURITY DEFINER VIEW ` soft-skills crm`.`select_schedules_of_groups` AS
SELECT  
    `gs`.`id` AS `schedule_id`,
    `gs`.`day_of_week` AS `day_of_week`,
    `gs`.`start_time` AS `start_time`,
    `gs`.`end_time` AS `end_time`,
    `g`.`name` AS `group_name`,
    `u`.`full_name` AS `user_name`,
    `u`.`company_id` AS `company_id`
FROM ` soft-skills crm`.`group_schedules` `gs`
JOIN ` soft-skills crm`.`groups` `g` ON `gs`.`group_id` = `g`.`id`
JOIN ` soft-skills crm`.`users` `u` ON `g`.`users_id` = `u`.`id`;

CREATE OR REPLACE ALGORITHM = UNDEFINED DEFINER = `root`@`localhost` SQL SECURITY DEFINER VIEW ` soft-skills crm`.`state_clients_balance` AS
SELECT  
    `c`.`id` AS `company_id`,
    `c`.`name` AS `company_name`,
    SUM(CASE WHEN `cl`.`balance` > 0 THEN 1 ELSE 0 END) AS `client_with_positive_account`,
    SUM(CASE WHEN `cl`.`balance` <= 0 THEN 1 ELSE 0 END) AS `client_wth_negative_account`,
    COUNT(`cl`.`id`) AS `total_clients`
FROM ` soft-skills crm`.`company` `c`
LEFT JOIN ` soft-skills crm`.`clients` `cl` ON `c`.`id` = `cl`.`company_id`
GROUP BY `c`.`id`, `c`.`name`;

CREATE OR REPLACE ALGORITHM = UNDEFINED DEFINER = `root`@`localhost` SQL SECURITY DEFINER VIEW ` soft-skills crm`.`v_lesson_details` AS
SELECT  
    `l`.`id` AS `lesson_id`,
    `l`.`lesson_date` AS `lesson_date`,
    `l`.`start_time` AS `start_time`,
    `l`.`end_time` AS `end_time`,
    `l`.`status` AS `lesson_status`,
    `l`.`teacher_pay` AS `teacher_pay`,
    `g`.`id` AS `group_id`,
    `g`.`name` AS `group_name`,
    `g`.`status` AS `group_status`,
    `g`.`max_students` AS `max_students`,
    `u`.`id` AS `teacher_id`,
    `u`.`full_name` AS `teacher_name`,
    `u`.`email` AS `teacher_email`,
    `u`.`balance` AS `teacher_balance`,
    `c`.`id` AS `company_id`,
    `c`.`name` AS `company_name`,
    (SELECT COUNT(0) FROM ` soft-skills crm`.`group_members` `gm` WHERE `gm`.`group_id` = `g`.`id`) AS `current_students_count`, 
    IFNULL(SUM(`la`.`amount_charged`), 0.00) AS `total_revenue_charged`
FROM ` soft-skills crm`.`lessons` `l`
JOIN ` soft-skills crm`.`groups` `g` ON `l`.`group_id` = `g`.`id`
JOIN ` soft-skills crm`.`users` `u` ON `l`.`user_id` = `u`.`id`
JOIN ` soft-skills crm`.`company` `c` ON `u`.`company_id` = `c`.`id`
LEFT JOIN ` soft-skills crm`.`lesson_attendance` `la` ON `l`.`id` = `la`.`lesson_id`
GROUP BY `l`.`id`, `g`.`id`, `u`.`id`, `c`.`id`;

CREATE OR REPLACE ALGORITHM = UNDEFINED DEFINER = `root`@`localhost` SQL SECURITY DEFINER VIEW ` soft-skills crm`.`view_company_finance` AS
SELECT  
    `c`.`id` AS `company_id`,
    `c`.`name` AS `company_name`,
    COUNT(`cl`.`id`) AS `total_clients`,
    SUM(`cl`.`balance`) AS `total_balance`,
    ROUND(AVG(`cl`.`balance`), 2) AS `average_client_balance`
FROM ` soft-skills crm`.`company` `c`
LEFT JOIN ` soft-skills crm`.`clients` `cl` ON `c`.`id` = `cl`.`company_id`
GROUP BY `c`.`id`, `c`.`name`;

CREATE OR REPLACE ALGORITHM = UNDEFINED DEFINER = `root`@`localhost` SQL SECURITY DEFINER VIEW ` soft-skills crm`.`view_groups_analytics` AS
SELECT  
    `g`.`id` AS `group_id`,
    `g`.`name` AS `group_name`,
    `g`.`status` AS `group_status`,
    `u`.`company_id` AS `company_id`,
    `u`.`full_name` AS `teacher_name`,
    `g`.`max_students` AS `max_students`,
    COUNT(DISTINCT `gm`.`client_id`) AS `current_students_count`,
    ROUND(((COUNT(DISTINCT `gm`.`client_id`) / `g`.`max_students`) * 100), 2) AS `occupancy_rate_percent`,
    COUNT(DISTINCT CASE WHEN `l`.`status` = 2 THEN `l`.`id` END) AS `conducted_lessons_count`,
    ROUND(((COUNT(CASE WHEN `la`.`attendance_status` = 1 AND `l`.`status` = 2 THEN 1 END) / NULLIF(COUNT(CASE WHEN `l`.`status` = 2 THEN `la`.`client_id` END), 0)) * 100), 2) AS `attendance_rate_percent`
FROM ` soft-skills crm`.`groups` `g`
JOIN ` soft-skills crm`.`users` `u` ON `g`.`users_id` = `u`.`id`
LEFT JOIN ` soft-skills crm`.`group_members` `gm` ON `g`.`id` = `gm`.`group_id`
LEFT JOIN ` soft-skills crm`.`lessons` `l` ON `g`.`id` = `l`.`group_id`
LEFT JOIN ` soft-skills crm`.`lesson_attendance` `la` ON `l`.`id` = `la`.`lesson_id`
GROUP BY `g`.`id`, `g`.`name`, `g`.`status`, `u`.`company_id`, `u`.`full_name`, `g`.`max_students`;

CREATE OR REPLACE ALGORITHM = UNDEFINED DEFINER = `root`@`localhost` SQL SECURITY DEFINER VIEW ` soft-skills crm`.`view_leads_conversion` AS
SELECT 
    `c`.`id` AS `company_id`,
    `c`.`name` AS `company_name`,
    COUNT(`l`.`id`) AS `total_leads`,
    SUM(CASE WHEN `l`.`status` = 'new' THEN 1 ELSE 0 END) AS `leads_new`,
    SUM(CASE WHEN `l`.`status` = 'in_progress' THEN 1 ELSE 0 END) AS `leads_in_progress`,
    SUM(CASE WHEN `l`.`status` = 'trial_scheduled' THEN 1 ELSE 0 END) AS `leads_trial_scheduled`,
    SUM(CASE WHEN `l`.`status` = 'trial_attended' THEN 1 ELSE 0 END) AS `leads_trial_attended`,
    SUM(CASE WHEN `l`.`status` = 'won' THEN 1 ELSE 0 END) AS `leads_won`,
    SUM(CASE WHEN `l`.`status` = 'lost' THEN 1 ELSE 0 END) AS `leads_lost`,
    ROUND(
        (SUM(CASE WHEN `l`.`status` = 'won' THEN 1 ELSE 0 END) / 
        NULLIF(SUM(CASE WHEN `l`.`status` IN ('won', 'lost') THEN 1 ELSE 0 END), 0)) * 100, 
        2
    ) AS `conversion_rate_percent`
FROM ` soft-skills crm`.`company` `c`
LEFT JOIN ` soft-skills crm`.`leads` `l` ON `c`.`id` = `l`.`company_id`
GROUP BY `c`.`id`, `c`.`name`;

CREATE OR REPLACE ALGORITHM = UNDEFINED DEFINER = `root`@`localhost` SQL SECURITY DEFINER VIEW ` soft-skills crm`.`view_leads_loss_analytics` AS
SELECT 
    `l`.`company_id` AS `company_id`,
    `llr`.`id` AS `reason_id`,
    `llr`.`reason_text` AS `loss_reason`,
    COUNT(`l`.`id`) AS `total_dropped_leads`,
    ROUND(
        (COUNT(`l`.`id`) / 
        NULLIF((SELECT COUNT(1) FROM ` soft-skills crm`.`leads` WHERE `status` = 'lost' AND `company_id` = `l`.`company_id`), 0)) * 100, 
        2
    ) AS `reason_share_percent`
FROM ` soft-skills crm`.`lead_loss_reasons` `llr`
JOIN ` soft-skills crm`.`leads` `l` ON `llr`.`id` = `l`.`loss_reason_id`
WHERE `l`.`status` = 'lost'
GROUP BY `l`.`company_id`, `llr`.`id`, `llr`.`reason_text`
ORDER BY `total_dropped_leads` DESC;

SET SQL_MODE = @OLD_SQL_MODE;
SET FOREIGN_KEY_CHECKS = @OLD_FOREIGN_KEY_CHECKS;
SET UNIQUE_CHECKS = @OLD_UNIQUE_CHECKS;
```
_> This code already exist in:_
```
/backend
    /SqlSchema.sql <== look at this
/frontend
```

### 4. Running the Application

Before starting, navigate to the target directory using the `cd` command.

#### Start Backend

```bash
cd backend
npm install
npm install bcrypt body-parser cors dotenv ejs express express-session mysql2
npm install --save-dev @types/bcrypt @types/cors @types/dotenv @types/express @types/express-session @types/node eslint ts-node tsx typescript
npm run dev
```

#### Start Frontend

```bash
cd frontend
npm install
npm install @hello-pangea/dnd clsx lucide-react react react-dom react-router-dom recharts tailwind-merge
npm install --save-dev @tailwindcss/vite @testing-library/jest-dom @testing-library/react @testing-library/user-event @types/node @types/react @types/react-dom @vitejs/plugin-react @vitest/ui jsdom msw tailwindcss typescript vite vite-plugin-singlefile vitest
npm run dev
```

#### Start Bot
```bash
cd backend/bot
venv\Scripts\activate
source venv/bin/activate
pip install aiogram requests
```

### 5. Deploy guide
This project can be launched in a single command using Docker and Docker Compose. 
### Prerequisites

Ensure you have Docker and Docker Compose installed on your system before proceeding.

### Deployment Steps

1. Download the release archive and extract its contents into a dedicated directory.
2. Verify that the `init.sql` file containing the database schema is present in the root directory alongside `docker-compose.yml`.
3. Open a terminal in the root directory of the extracted project and execute the following command:
   ```bash
   docker-compose up -d --build
   ```
4. The database engine will spin up and automatically execute the `init.sql` script to construct the schema during the initial boot. The application containers will build and start sequentially once the database becomes available.

frontend:
```
FROM node:20-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:stable-alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

backend:
```docker
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "run", "start"]
```

support bot:
```docker
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt* ./
RUN if [ -f requirements.txt ]; then pip install --no-cache-dir -r requirements.txt; else pip install --no-cache-dir aiogram requests python-dotenv aiomysql pymysql cryptography; fi
COPY . .
CMD ["python", "main.py"]
```

.yaml:
```docker
version: '3.8'

services:
  db:
    image: mysql:8.0
    container_name: crm_mysql_db
    restart: always
    environment:
      MYSQL_ROOT_PASSWORD: root_password_here
      MYSQL_DATABASE: softskills_crm
    ports:
      - "3306:3306"
    volumes:
      - mysql_data:/var/lib/mysql
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql:ro

  backend:
    build: ./backend
    container_name: crm_backend_api
    restart: always
    ports:
      - "3000:3000"
    environment:
      - DB_HOST=db
      - DB_USER=root
      - DB_PASSWORD=root_password_here
      - DB_NAME=softskills_crm
      - VITE_PORT=3000
    depends_on:
      - db

  frontend:
    build: ./frontend
    container_name: crm_frontend_ui
    restart: always
    ports:
      - "80:80"
    environment:
      - VITE_HOST=http://localhost
      - VITE_PORT=3000
    depends_on:
      - backend

volumes:
  mysql_data:
```

### Application Access Endpoints

* Frontend Interface: http://localhost (Port 80)
* Backend API: http://localhost:3000

### Stopping the Application

To shut down the active application containers and preserve database volumes, run:
```bash
docker-compose down
```
## Screenshots
| | Screenshots | |
| :---: | :---: | :---: |
| ![alt text](frontend/screenshots/image-1.png) | ![alt text](frontend/screenshots/image-2.png) | ![alt text](frontend/screenshots/image-3.png) |
| ![alt text](frontend/screenshots/image-4.png) | ![alt text](frontend/screenshots/image-5.png) | ![alt text](frontend/screenshots/image-6.png) |
| ![alt text](frontend/screenshots/image-7.png) | ![alt text](frontend/screenshots/image-8.png) | ![alt text](frontend/screenshots/image-9.png) |
| ![alt text](frontend/screenshots/image-10.png) | ![alt text](frontend/screenshots/image-11.png) | ![alt text](frontend/screenshots/image-12.png) |
| ![alt text](frontend/screenshots/image-13.png) | ![alt text](frontend/screenshots/image-14.png) | ![alt text](frontend/screenshots/image-15.png) |
| ![alt text](frontend/screenshots/image-16.png) | ![alt text](frontend/screenshots/image-17.png) | ![alt text](frontend/screenshots/image-18.png) |
| ![alt text](frontend/screenshots/image-19.png) | ![alt text](frontend/screenshots/image-20.png) | ![alt text](frontend/screenshots/image-21.png) |
| ![alt text](frontend/screenshots/image-22.png) | ![alt text](frontend/screenshots/image-23.png) | ![alt text](frontend/screenshots/image-24.png) |
| ![alt text](frontend/screenshots/image-25.png) | ![alt text](frontend/screenshots/image-26.png) | ![alt text](frontend/screenshots/image-27.png) |
| ![alt text](frontend/screenshots/image-28.png) | ![alt text](frontend/screenshots/image-29.png) | ![alt text](frontend/screenshots/image-30.png) |
 | | |
