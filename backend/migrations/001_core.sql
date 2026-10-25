CREATE TABLE IF NOT EXISTS crm_organizations (
 id CHAR(36) CHARACTER SET ascii PRIMARY KEY,
 name VARCHAR(255) NOT NULL,
 timezone VARCHAR(80) NOT NULL DEFAULT 'Europe/Moscow',
 settings JSON NOT NULL,
 created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE IF NOT EXISTS crm_branches (
 id CHAR(36) CHARACTER SET ascii NOT NULL,
 org_id CHAR(36) CHARACTER SET ascii NOT NULL,
 name VARCHAR(255) NOT NULL,
 address VARCHAR(255) NOT NULL DEFAULT '',
 active BOOLEAN NOT NULL DEFAULT TRUE,
 PRIMARY KEY(id),
 UNIQUE KEY(org_id,id),
 FOREIGN KEY(org_id) REFERENCES crm_organizations(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE IF NOT EXISTS crm_people (
 id CHAR(36) CHARACTER SET ascii NOT NULL,
 org_id CHAR(36) CHARACTER SET ascii NOT NULL,
 branch_id CHAR(36) CHARACTER SET ascii NOT NULL,
 name VARCHAR(255) NOT NULL,
 birthday DATE NULL,
 comment TEXT NOT NULL,
 active BOOLEAN NOT NULL DEFAULT TRUE,
 PRIMARY KEY(id),
 UNIQUE KEY(org_id,id),
 FOREIGN KEY(org_id) REFERENCES crm_organizations(id),
 FOREIGN KEY(org_id,branch_id) REFERENCES crm_branches(org_id,id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE IF NOT EXISTS crm_contacts (
 id CHAR(36) CHARACTER SET ascii NOT NULL,
 org_id CHAR(36) CHARACTER SET ascii NOT NULL,
 person_id CHAR(36) CHARACTER SET ascii NOT NULL,
 kind ENUM('email','phone') NOT NULL,
 value VARCHAR(254) NOT NULL,
 PRIMARY KEY(id),
 UNIQUE KEY(org_id,id),
 FOREIGN KEY(org_id) REFERENCES crm_organizations(id),
 FOREIGN KEY(org_id,person_id) REFERENCES crm_people(org_id,id),
 UNIQUE KEY(org_id,kind,value)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE IF NOT EXISTS crm_users (
 id CHAR(36) CHARACTER SET ascii NOT NULL,
 org_id CHAR(36) CHARACTER SET ascii NOT NULL,
 person_id CHAR(36) CHARACTER SET ascii NOT NULL,
 login VARCHAR(100) NOT NULL,
 password_hash VARCHAR(200) NOT NULL,
 roles JSON NOT NULL,
 branches JSON NOT NULL,
 active BOOLEAN NOT NULL DEFAULT TRUE,
 PRIMARY KEY(id),
 UNIQUE KEY(org_id,id),
 FOREIGN KEY(org_id) REFERENCES crm_organizations(id),
 FOREIGN KEY(org_id,person_id) REFERENCES crm_people(org_id,id),
 UNIQUE KEY(login),
 UNIQUE KEY(org_id,person_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE IF NOT EXISTS crm_payers (
 id CHAR(36) CHARACTER SET ascii NOT NULL,
 org_id CHAR(36) CHARACTER SET ascii NOT NULL,
 person_id CHAR(36) CHARACTER SET ascii NOT NULL,
 branch_id CHAR(36) CHARACTER SET ascii NOT NULL,
 PRIMARY KEY(id),
 UNIQUE KEY(org_id,id),
 FOREIGN KEY(org_id) REFERENCES crm_organizations(id),
 FOREIGN KEY(org_id,person_id) REFERENCES crm_people(org_id,id),
 FOREIGN KEY(org_id,branch_id) REFERENCES crm_branches(org_id,id),
 UNIQUE KEY(org_id,person_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE IF NOT EXISTS crm_students (
 id CHAR(36) CHARACTER SET ascii NOT NULL,
 org_id CHAR(36) CHARACTER SET ascii NOT NULL,
 person_id CHAR(36) CHARACTER SET ascii NOT NULL,
 branch_id CHAR(36) CHARACTER SET ascii NOT NULL,
 payer_id CHAR(36) CHARACTER SET ascii NOT NULL,
 active BOOLEAN NOT NULL DEFAULT TRUE,
 PRIMARY KEY(id),
 UNIQUE KEY(org_id,id),
 FOREIGN KEY(org_id) REFERENCES crm_organizations(id),
 FOREIGN KEY(org_id,person_id) REFERENCES crm_people(org_id,id),
 FOREIGN KEY(org_id,branch_id) REFERENCES crm_branches(org_id,id),
 FOREIGN KEY(org_id,payer_id) REFERENCES crm_payers(org_id,id),
 UNIQUE KEY(org_id,person_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE IF NOT EXISTS crm_staff (
 id CHAR(36) CHARACTER SET ascii NOT NULL,
 org_id CHAR(36) CHARACTER SET ascii NOT NULL,
 person_id CHAR(36) CHARACTER SET ascii NOT NULL,
 branch_id CHAR(36) CHARACTER SET ascii NOT NULL,
 name VARCHAR(255) NOT NULL,
 subject VARCHAR(255) NOT NULL,
 status VARCHAR(60) NOT NULL DEFAULT 'Работает',
 rate BIGINT NOT NULL DEFAULT 0,
 PRIMARY KEY(id),
 UNIQUE KEY(org_id,id),
 FOREIGN KEY(org_id) REFERENCES crm_organizations(id),
 FOREIGN KEY(org_id,person_id) REFERENCES crm_people(org_id,id),
 FOREIGN KEY(org_id,branch_id) REFERENCES crm_branches(org_id,id),
 UNIQUE KEY(org_id,person_id),
 CHECK(rate>=0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE IF NOT EXISTS crm_rooms (
 id CHAR(36) CHARACTER SET ascii NOT NULL,
 org_id CHAR(36) CHARACTER SET ascii NOT NULL,
 branch_id CHAR(36) CHARACTER SET ascii NOT NULL,
 name VARCHAR(255) NOT NULL,
 capacity INT NOT NULL,
 PRIMARY KEY(id),
 UNIQUE KEY(org_id,id),
 FOREIGN KEY(org_id) REFERENCES crm_organizations(id),
 FOREIGN KEY(org_id,branch_id) REFERENCES crm_branches(org_id,id),
 CHECK(capacity>0),
 UNIQUE KEY(org_id,branch_id,name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE IF NOT EXISTS crm_groups (
 id CHAR(36) CHARACTER SET ascii NOT NULL,
 org_id CHAR(36) CHARACTER SET ascii NOT NULL,
 branch_id CHAR(36) CHARACTER SET ascii NOT NULL,
 teacher_id CHAR(36) CHARACTER SET ascii NOT NULL,
 name VARCHAR(255) NOT NULL,
 subject VARCHAR(255) NOT NULL,
 capacity INT NOT NULL,
 status VARCHAR(60) NOT NULL,
 start_date DATE NULL,
 end_date DATE NULL,
 PRIMARY KEY(id),
 UNIQUE KEY(org_id,id),
 FOREIGN KEY(org_id) REFERENCES crm_organizations(id),
 FOREIGN KEY(org_id,branch_id) REFERENCES crm_branches(org_id,id),
 FOREIGN KEY(org_id,teacher_id) REFERENCES crm_staff(org_id,id),
 CHECK(capacity>0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE IF NOT EXISTS crm_members (
 id CHAR(36) CHARACTER SET ascii NOT NULL,
 org_id CHAR(36) CHARACTER SET ascii NOT NULL,
 group_id CHAR(36) CHARACTER SET ascii NOT NULL,
 student_id CHAR(36) CHARACTER SET ascii NOT NULL,
 PRIMARY KEY(id),
 UNIQUE KEY(org_id,id),
 FOREIGN KEY(org_id) REFERENCES crm_organizations(id),
 FOREIGN KEY(org_id,group_id) REFERENCES crm_groups(org_id,id),
 FOREIGN KEY(org_id,student_id) REFERENCES crm_students(org_id,id),
 UNIQUE KEY(org_id,group_id,student_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE IF NOT EXISTS crm_leads (
 id CHAR(36) CHARACTER SET ascii NOT NULL,
 org_id CHAR(36) CHARACTER SET ascii NOT NULL,
 person_id CHAR(36) CHARACTER SET ascii NOT NULL,
 branch_id CHAR(36) CHARACTER SET ascii NOT NULL,
 name VARCHAR(255) NOT NULL,
 source VARCHAR(255) NOT NULL,
 comment TEXT NOT NULL,
 status VARCHAR(60) NOT NULL DEFAULT 'Не разобран',
 responsible_id CHAR(36) CHARACTER SET ascii NULL,
 student_id CHAR(36) CHARACTER SET ascii NULL,
 PRIMARY KEY(id),
 UNIQUE KEY(org_id,id),
 FOREIGN KEY(org_id) REFERENCES crm_organizations(id),
 FOREIGN KEY(org_id,person_id) REFERENCES crm_people(org_id,id),
 FOREIGN KEY(org_id,branch_id) REFERENCES crm_branches(org_id,id),
 FOREIGN KEY(org_id,responsible_id) REFERENCES crm_staff(org_id,id),
 FOREIGN KEY(org_id,student_id) REFERENCES crm_students(org_id,id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE IF NOT EXISTS crm_accounts (
 id CHAR(36) CHARACTER SET ascii NOT NULL,
 org_id CHAR(36) CHARACTER SET ascii NOT NULL,
 kind ENUM('payer','cash','payroll') NOT NULL,
 branch_id CHAR(36) CHARACTER SET ascii NOT NULL,
 person_id CHAR(36) CHARACTER SET ascii NULL,
 name VARCHAR(255) NOT NULL,
 PRIMARY KEY(id),
 UNIQUE KEY(org_id,id),
 FOREIGN KEY(org_id) REFERENCES crm_organizations(id),
 FOREIGN KEY(org_id,branch_id) REFERENCES crm_branches(org_id,id),
 FOREIGN KEY(org_id,person_id) REFERENCES crm_people(org_id,id),
 UNIQUE KEY(org_id,kind,person_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE IF NOT EXISTS crm_lessons (
 id CHAR(36) CHARACTER SET ascii NOT NULL,
 org_id CHAR(36) CHARACTER SET ascii NOT NULL,
 branch_id CHAR(36) CHARACTER SET ascii NOT NULL,
 name VARCHAR(255) NOT NULL,
 group_id CHAR(36) CHARACTER SET ascii NULL,
 teacher_id CHAR(36) CHARACTER SET ascii NOT NULL,
 room_id CHAR(36) CHARACTER SET ascii NOT NULL,
 starts_at DATETIME(3) NOT NULL,
 ends_at DATETIME(3) NOT NULL,
 status ENUM('scheduled','completed','cancelled') NOT NULL DEFAULT 'scheduled',
 salary BIGINT NOT NULL,
 revision INT NOT NULL DEFAULT 0,
 comment TEXT NOT NULL,
 PRIMARY KEY(id),
 UNIQUE KEY(org_id,id),
 FOREIGN KEY(org_id) REFERENCES crm_organizations(id),
 FOREIGN KEY(org_id,branch_id) REFERENCES crm_branches(org_id,id),
 FOREIGN KEY(org_id,group_id) REFERENCES crm_groups(org_id,id),
 FOREIGN KEY(org_id,teacher_id) REFERENCES crm_staff(org_id,id),
 FOREIGN KEY(org_id,room_id) REFERENCES crm_rooms(org_id,id),
 CHECK(ends_at>starts_at),
 CHECK(salary>=0),
 KEY(org_id,teacher_id,starts_at,ends_at),
 KEY(org_id,room_id,starts_at,ends_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE IF NOT EXISTS crm_subscription_templates (
 id CHAR(36) CHARACTER SET ascii NOT NULL,
 org_id CHAR(36) CHARACTER SET ascii NOT NULL,
 branch_id CHAR(36) CHARACTER SET ascii NOT NULL,
 name VARCHAR(255) NOT NULL,
 subject VARCHAR(255) NOT NULL,
 lessons INT NOT NULL,
 days INT NOT NULL,
 price BIGINT NOT NULL,
 active BOOLEAN NOT NULL DEFAULT TRUE,
 PRIMARY KEY(id),
 UNIQUE KEY(org_id,id),
 FOREIGN KEY(org_id) REFERENCES crm_organizations(id),
 FOREIGN KEY(org_id,branch_id) REFERENCES crm_branches(org_id,id),
 CHECK(lessons>0 AND days>0 AND price>=0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE IF NOT EXISTS crm_subscriptions (
 id CHAR(36) CHARACTER SET ascii NOT NULL,
 org_id CHAR(36) CHARACTER SET ascii NOT NULL,
 branch_id CHAR(36) CHARACTER SET ascii NOT NULL,
 student_id CHAR(36) CHARACTER SET ascii NOT NULL,
 template_id CHAR(36) CHARACTER SET ascii NOT NULL,
 starts_at DATETIME(3) NOT NULL,
 ends_at DATETIME(3) NOT NULL,
 allowance INT NOT NULL,
 frozen_at DATETIME(3) NULL,
 PRIMARY KEY(id),
 UNIQUE KEY(org_id,id),
 FOREIGN KEY(org_id) REFERENCES crm_organizations(id),
 FOREIGN KEY(org_id,branch_id) REFERENCES crm_branches(org_id,id),
 FOREIGN KEY(org_id,student_id) REFERENCES crm_students(org_id,id),
 FOREIGN KEY(org_id,template_id) REFERENCES crm_subscription_templates(org_id,id),
 CHECK(ends_at>starts_at AND allowance>0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE IF NOT EXISTS crm_freezes (
 id CHAR(36) CHARACTER SET ascii NOT NULL,
 org_id CHAR(36) CHARACTER SET ascii NOT NULL,
 subscription_id CHAR(36) CHARACTER SET ascii NOT NULL,
 starts_at DATETIME(3) NOT NULL,
 ends_at DATETIME(3) NULL,
 PRIMARY KEY(id),
 UNIQUE KEY(org_id,id),
 FOREIGN KEY(org_id) REFERENCES crm_organizations(id),
 FOREIGN KEY(org_id,subscription_id) REFERENCES crm_subscriptions(org_id,id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE IF NOT EXISTS crm_attendees (
 id CHAR(36) CHARACTER SET ascii NOT NULL,
 org_id CHAR(36) CHARACTER SET ascii NOT NULL,
 lesson_id CHAR(36) CHARACTER SET ascii NOT NULL,
 student_id CHAR(36) CHARACTER SET ascii NOT NULL,
 payer_id CHAR(36) CHARACTER SET ascii NOT NULL,
 subscription_id CHAR(36) CHARACTER SET ascii NULL,
 price BIGINT NOT NULL,
 discount BIGINT NOT NULL,
 attendance ENUM('present','absent','excused') NULL,
 PRIMARY KEY(id),
 UNIQUE KEY(org_id,id),
 FOREIGN KEY(org_id) REFERENCES crm_organizations(id),
 FOREIGN KEY(org_id,lesson_id) REFERENCES crm_lessons(org_id,id),
 FOREIGN KEY(org_id,student_id) REFERENCES crm_students(org_id,id),
 FOREIGN KEY(org_id,payer_id) REFERENCES crm_payers(org_id,id),
 FOREIGN KEY(org_id,subscription_id) REFERENCES crm_subscriptions(org_id,id),
 UNIQUE KEY(org_id,lesson_id,student_id),
 CHECK(price>=0 AND discount>=0 AND discount<=price)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE IF NOT EXISTS crm_ledger (
 id CHAR(36) CHARACTER SET ascii NOT NULL,
 org_id CHAR(36) CHARACTER SET ascii NOT NULL,
 account_id CHAR(36) CHARACTER SET ascii NOT NULL,
 amount BIGINT NOT NULL,
 kind VARCHAR(40) NOT NULL,
 lesson_id CHAR(36) CHARACTER SET ascii NULL,
 revision INT NULL,
 reversal_of CHAR(36) CHARACTER SET ascii NULL,
 operation_id CHAR(36) CHARACTER SET ascii NOT NULL,
 reason VARCHAR(1000) NOT NULL,
 created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
 PRIMARY KEY(id),
 UNIQUE KEY(org_id,id),
 FOREIGN KEY(org_id) REFERENCES crm_organizations(id),
 FOREIGN KEY(org_id,account_id) REFERENCES crm_accounts(org_id,id),
 FOREIGN KEY(org_id,lesson_id) REFERENCES crm_lessons(org_id,id),
 FOREIGN KEY(org_id,reversal_of) REFERENCES crm_ledger(org_id,id),
 UNIQUE KEY(org_id,reversal_of),
 KEY(org_id,account_id,created_at),
 KEY(org_id,lesson_id,revision)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE IF NOT EXISTS crm_subscription_usage (
 id CHAR(36) CHARACTER SET ascii NOT NULL,
 org_id CHAR(36) CHARACTER SET ascii NOT NULL,
 subscription_id CHAR(36) CHARACTER SET ascii NOT NULL,
 lesson_id CHAR(36) CHARACTER SET ascii NOT NULL,
 revision INT NOT NULL,
 delta INT NOT NULL,
 created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
 PRIMARY KEY(id),
 UNIQUE KEY(org_id,id),
 FOREIGN KEY(org_id) REFERENCES crm_organizations(id),
 FOREIGN KEY(org_id,subscription_id) REFERENCES crm_subscriptions(org_id,id),
 FOREIGN KEY(org_id,lesson_id) REFERENCES crm_lessons(org_id,id),
 CHECK(delta IN (-1,1))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE IF NOT EXISTS crm_tasks (
 id CHAR(36) CHARACTER SET ascii NOT NULL,
 org_id CHAR(36) CHARACTER SET ascii NOT NULL,
 branch_id CHAR(36) CHARACTER SET ascii NOT NULL,
 name VARCHAR(255) NOT NULL,
 date DATE NOT NULL,
 responsible_id CHAR(36) CHARACTER SET ascii NULL,
 person_id CHAR(36) CHARACTER SET ascii NULL,
 priority VARCHAR(60) NOT NULL,
 status VARCHAR(60) NOT NULL,
 comment TEXT NOT NULL,
 PRIMARY KEY(id),
 UNIQUE KEY(org_id,id),
 FOREIGN KEY(org_id) REFERENCES crm_organizations(id),
 FOREIGN KEY(org_id,branch_id) REFERENCES crm_branches(org_id,id),
 FOREIGN KEY(org_id,responsible_id) REFERENCES crm_staff(org_id,id),
 FOREIGN KEY(org_id,person_id) REFERENCES crm_people(org_id,id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE IF NOT EXISTS crm_companies (
 id CHAR(36) CHARACTER SET ascii NOT NULL,
 org_id CHAR(36) CHARACTER SET ascii NOT NULL,
 branch_id CHAR(36) CHARACTER SET ascii NOT NULL,
 name VARCHAR(255) NOT NULL,
 inn VARCHAR(12) NOT NULL,
 kpp VARCHAR(9) NOT NULL,
 address VARCHAR(255) NOT NULL,
 contact VARCHAR(255) NOT NULL,
 phone VARCHAR(40) NOT NULL,
 account VARCHAR(40) NOT NULL,
 bank VARCHAR(255) NOT NULL,
 status VARCHAR(60) NOT NULL,
 PRIMARY KEY(id),
 UNIQUE KEY(org_id,id),
 FOREIGN KEY(org_id) REFERENCES crm_organizations(id),
 FOREIGN KEY(org_id,branch_id) REFERENCES crm_branches(org_id,id),
 UNIQUE KEY(org_id,inn)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE IF NOT EXISTS crm_dictionaries (
 id CHAR(36) CHARACTER SET ascii NOT NULL,
 org_id CHAR(36) CHARACTER SET ascii NOT NULL,
 branch_id CHAR(36) CHARACTER SET ascii NOT NULL,
 category VARCHAR(60) NOT NULL,
 name VARCHAR(255) NOT NULL,
 value JSON NOT NULL,
 active BOOLEAN NOT NULL DEFAULT TRUE,
 PRIMARY KEY(id),
 UNIQUE KEY(org_id,id),
 FOREIGN KEY(org_id) REFERENCES crm_organizations(id),
 FOREIGN KEY(org_id,branch_id) REFERENCES crm_branches(org_id,id),
 UNIQUE KEY(org_id,branch_id,category,name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE IF NOT EXISTS crm_audit (
 id CHAR(36) CHARACTER SET ascii NOT NULL,
 org_id CHAR(36) CHARACTER SET ascii NOT NULL,
 actor_id CHAR(36) CHARACTER SET ascii NOT NULL,
 action VARCHAR(80) NOT NULL,
 resource VARCHAR(80) NOT NULL,
 resource_id VARCHAR(100) NOT NULL,
 request_id CHAR(36) NOT NULL,
 details JSON NOT NULL,
 created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
 PRIMARY KEY(id),
 UNIQUE KEY(org_id,id),
 FOREIGN KEY(org_id) REFERENCES crm_organizations(id),
 KEY(org_id,created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE IF NOT EXISTS crm_idempotency (
 id CHAR(36) CHARACTER SET ascii NOT NULL,
 org_id CHAR(36) CHARACTER SET ascii NOT NULL,
 key_value VARCHAR(128) NOT NULL,
 request_hash CHAR(64) NOT NULL,
 response JSON NOT NULL,
 created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
 PRIMARY KEY(id),
 UNIQUE KEY(org_id,id),
 FOREIGN KEY(org_id) REFERENCES crm_organizations(id),
 UNIQUE KEY(org_id,key_value)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE IF NOT EXISTS crm_sessions (
 token_hash CHAR(64) PRIMARY KEY, user_id CHAR(36) CHARACTER SET ascii NOT NULL,
 csrf VARCHAR(64) NOT NULL, expires_at DATETIME(3) NOT NULL,
 FOREIGN KEY(user_id) REFERENCES crm_users(id), KEY(expires_at)
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS crm_auth_limits (
 bucket CHAR(64) PRIMARY KEY, attempts INT NOT NULL, expires_at DATETIME(3) NOT NULL
) ENGINE=InnoDB;
