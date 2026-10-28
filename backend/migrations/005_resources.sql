CREATE TABLE IF NOT EXISTS crm_payer_students (
 id CHAR(36) CHARACTER SET ascii PRIMARY KEY,
 org_id CHAR(36) CHARACTER SET ascii NOT NULL,
 branch_id CHAR(36) CHARACTER SET ascii NOT NULL,
 payer_id CHAR(36) CHARACTER SET ascii NOT NULL,
 student_id CHAR(36) CHARACTER SET ascii NOT NULL,
 relationship VARCHAR(100) NOT NULL DEFAULT '',
 UNIQUE KEY(org_id,id), UNIQUE KEY(org_id,payer_id,student_id),
 FOREIGN KEY(org_id,branch_id) REFERENCES crm_branches(org_id,id),
 FOREIGN KEY(org_id,payer_id) REFERENCES crm_payers(org_id,id),
 FOREIGN KEY(org_id,student_id) REFERENCES crm_students(org_id,id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

SET @ddl = IF(NOT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='crm_organizations' AND column_name='version'), 'ALTER TABLE crm_organizations ADD version INT UNSIGNED NOT NULL DEFAULT 1', 'SELECT 1');
PREPARE migration_stmt FROM @ddl;
EXECUTE migration_stmt;
DEALLOCATE PREPARE migration_stmt;

SET @ddl = IF(NOT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='crm_organizations' AND column_name='archived_at'), 'ALTER TABLE crm_organizations ADD archived_at DATETIME(3) NULL', 'SELECT 1');
PREPARE migration_stmt FROM @ddl;
EXECUTE migration_stmt;
DEALLOCATE PREPARE migration_stmt;

SET @ddl = IF(NOT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='crm_branches' AND column_name='version'), 'ALTER TABLE crm_branches ADD version INT UNSIGNED NOT NULL DEFAULT 1', 'SELECT 1');
PREPARE migration_stmt FROM @ddl;
EXECUTE migration_stmt;
DEALLOCATE PREPARE migration_stmt;

SET @ddl = IF(NOT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='crm_branches' AND column_name='archived_at'), 'ALTER TABLE crm_branches ADD archived_at DATETIME(3) NULL', 'SELECT 1');
PREPARE migration_stmt FROM @ddl;
EXECUTE migration_stmt;
DEALLOCATE PREPARE migration_stmt;

SET @ddl = IF(NOT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='crm_rooms' AND column_name='version'), 'ALTER TABLE crm_rooms ADD version INT UNSIGNED NOT NULL DEFAULT 1', 'SELECT 1');
PREPARE migration_stmt FROM @ddl;
EXECUTE migration_stmt;
DEALLOCATE PREPARE migration_stmt;

SET @ddl = IF(NOT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='crm_rooms' AND column_name='archived_at'), 'ALTER TABLE crm_rooms ADD archived_at DATETIME(3) NULL', 'SELECT 1');
PREPARE migration_stmt FROM @ddl;
EXECUTE migration_stmt;
DEALLOCATE PREPARE migration_stmt;

SET @ddl = IF(NOT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='crm_people' AND column_name='version'), 'ALTER TABLE crm_people ADD version INT UNSIGNED NOT NULL DEFAULT 1', 'SELECT 1');
PREPARE migration_stmt FROM @ddl;
EXECUTE migration_stmt;
DEALLOCATE PREPARE migration_stmt;

SET @ddl = IF(NOT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='crm_people' AND column_name='archived_at'), 'ALTER TABLE crm_people ADD archived_at DATETIME(3) NULL', 'SELECT 1');
PREPARE migration_stmt FROM @ddl;
EXECUTE migration_stmt;
DEALLOCATE PREPARE migration_stmt;

SET @ddl = IF(NOT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='crm_payers' AND column_name='version'), 'ALTER TABLE crm_payers ADD version INT UNSIGNED NOT NULL DEFAULT 1', 'SELECT 1');
PREPARE migration_stmt FROM @ddl;
EXECUTE migration_stmt;
DEALLOCATE PREPARE migration_stmt;

SET @ddl = IF(NOT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='crm_payers' AND column_name='archived_at'), 'ALTER TABLE crm_payers ADD archived_at DATETIME(3) NULL', 'SELECT 1');
PREPARE migration_stmt FROM @ddl;
EXECUTE migration_stmt;
DEALLOCATE PREPARE migration_stmt;

SET @ddl = IF(NOT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='crm_students' AND column_name='version'), 'ALTER TABLE crm_students ADD version INT UNSIGNED NOT NULL DEFAULT 1', 'SELECT 1');
PREPARE migration_stmt FROM @ddl;
EXECUTE migration_stmt;
DEALLOCATE PREPARE migration_stmt;

SET @ddl = IF(NOT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='crm_students' AND column_name='archived_at'), 'ALTER TABLE crm_students ADD archived_at DATETIME(3) NULL', 'SELECT 1');
PREPARE migration_stmt FROM @ddl;
EXECUTE migration_stmt;
DEALLOCATE PREPARE migration_stmt;

SET @ddl = IF(NOT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='crm_staff' AND column_name='version'), 'ALTER TABLE crm_staff ADD version INT UNSIGNED NOT NULL DEFAULT 1', 'SELECT 1');
PREPARE migration_stmt FROM @ddl;
EXECUTE migration_stmt;
DEALLOCATE PREPARE migration_stmt;

SET @ddl = IF(NOT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='crm_staff' AND column_name='archived_at'), 'ALTER TABLE crm_staff ADD archived_at DATETIME(3) NULL', 'SELECT 1');
PREPARE migration_stmt FROM @ddl;
EXECUTE migration_stmt;
DEALLOCATE PREPARE migration_stmt;

SET @ddl = IF(NOT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='crm_companies' AND column_name='version'), 'ALTER TABLE crm_companies ADD version INT UNSIGNED NOT NULL DEFAULT 1', 'SELECT 1');
PREPARE migration_stmt FROM @ddl;
EXECUTE migration_stmt;
DEALLOCATE PREPARE migration_stmt;

SET @ddl = IF(NOT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='crm_companies' AND column_name='archived_at'), 'ALTER TABLE crm_companies ADD archived_at DATETIME(3) NULL', 'SELECT 1');
PREPARE migration_stmt FROM @ddl;
EXECUTE migration_stmt;
DEALLOCATE PREPARE migration_stmt;

SET @ddl = IF(NOT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='crm_tasks' AND column_name='version'), 'ALTER TABLE crm_tasks ADD version INT UNSIGNED NOT NULL DEFAULT 1', 'SELECT 1');
PREPARE migration_stmt FROM @ddl;
EXECUTE migration_stmt;
DEALLOCATE PREPARE migration_stmt;

SET @ddl = IF(NOT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='crm_tasks' AND column_name='archived_at'), 'ALTER TABLE crm_tasks ADD archived_at DATETIME(3) NULL', 'SELECT 1');
PREPARE migration_stmt FROM @ddl;
EXECUTE migration_stmt;
DEALLOCATE PREPARE migration_stmt;

SET @ddl = IF(NOT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='crm_groups' AND column_name='version'), 'ALTER TABLE crm_groups ADD version INT UNSIGNED NOT NULL DEFAULT 1', 'SELECT 1');
PREPARE migration_stmt FROM @ddl;
EXECUTE migration_stmt;
DEALLOCATE PREPARE migration_stmt;

SET @ddl = IF(NOT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='crm_groups' AND column_name='archived_at'), 'ALTER TABLE crm_groups ADD archived_at DATETIME(3) NULL', 'SELECT 1');
PREPARE migration_stmt FROM @ddl;
EXECUTE migration_stmt;
DEALLOCATE PREPARE migration_stmt;

SET @ddl = IF(NOT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='crm_leads' AND column_name='version'), 'ALTER TABLE crm_leads ADD version INT UNSIGNED NOT NULL DEFAULT 1', 'SELECT 1');
PREPARE migration_stmt FROM @ddl;
EXECUTE migration_stmt;
DEALLOCATE PREPARE migration_stmt;

SET @ddl = IF(NOT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='crm_leads' AND column_name='archived_at'), 'ALTER TABLE crm_leads ADD archived_at DATETIME(3) NULL', 'SELECT 1');
PREPARE migration_stmt FROM @ddl;
EXECUTE migration_stmt;
DEALLOCATE PREPARE migration_stmt;

SET @ddl = IF(NOT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='crm_members' AND column_name='version'), 'ALTER TABLE crm_members ADD version INT UNSIGNED NOT NULL DEFAULT 1', 'SELECT 1');
PREPARE migration_stmt FROM @ddl;
EXECUTE migration_stmt;
DEALLOCATE PREPARE migration_stmt;

SET @ddl = IF(NOT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='crm_members' AND column_name='archived_at'), 'ALTER TABLE crm_members ADD archived_at DATETIME(3) NULL', 'SELECT 1');
PREPARE migration_stmt FROM @ddl;
EXECUTE migration_stmt;
DEALLOCATE PREPARE migration_stmt;

SET @ddl = IF(NOT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='crm_payer_students' AND column_name='version'), 'ALTER TABLE crm_payer_students ADD version INT UNSIGNED NOT NULL DEFAULT 1', 'SELECT 1');
PREPARE migration_stmt FROM @ddl;
EXECUTE migration_stmt;
DEALLOCATE PREPARE migration_stmt;

SET @ddl = IF(NOT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='crm_payer_students' AND column_name='archived_at'), 'ALTER TABLE crm_payer_students ADD archived_at DATETIME(3) NULL', 'SELECT 1');
PREPARE migration_stmt FROM @ddl;
EXECUTE migration_stmt;
DEALLOCATE PREPARE migration_stmt;

SET @ddl = IF(NOT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='crm_payers' AND column_name='comment'), 'ALTER TABLE crm_payers ADD comment VARCHAR(4000) NOT NULL DEFAULT ''''', 'SELECT 1');
PREPARE migration_stmt FROM @ddl;
EXECUTE migration_stmt;
DEALLOCATE PREPARE migration_stmt;

SET @ddl = IF(NOT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='crm_members' AND column_name='starts_at'), 'ALTER TABLE crm_members ADD starts_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)', 'SELECT 1');
PREPARE migration_stmt FROM @ddl;
EXECUTE migration_stmt;
DEALLOCATE PREPARE migration_stmt;

SET @ddl = IF(NOT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='crm_members' AND column_name='ends_at'), 'ALTER TABLE crm_members ADD ends_at DATETIME(3) NULL', 'SELECT 1');
PREPARE migration_stmt FROM @ddl;
EXECUTE migration_stmt;
DEALLOCATE PREPARE migration_stmt;

SET @ddl = IF(NOT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='crm_members' AND column_name='branch_id'), 'ALTER TABLE crm_members ADD branch_id CHAR(36) CHARACTER SET ascii NULL', 'SELECT 1');
PREPARE migration_stmt FROM @ddl;
EXECUTE migration_stmt;
DEALLOCATE PREPARE migration_stmt;

UPDATE crm_members m JOIN crm_groups g ON g.org_id=m.org_id AND g.id=m.group_id SET m.branch_id=g.branch_id WHERE m.branch_id IS NULL;

SET @ddl = IF(NOT EXISTS(SELECT 1 FROM information_schema.statistics WHERE table_schema=DATABASE() AND table_name='crm_members' AND index_name='member_period_lookup'), 'ALTER TABLE crm_members ADD KEY member_period_lookup(org_id,group_id,starts_at,ends_at)', 'SELECT 1');
PREPARE migration_stmt FROM @ddl;
EXECUTE migration_stmt;
DEALLOCATE PREPARE migration_stmt;

SET @member_unique = (SELECT index_name FROM information_schema.statistics WHERE table_schema=DATABASE() AND table_name='crm_members' AND non_unique=0 GROUP BY index_name HAVING GROUP_CONCAT(column_name ORDER BY seq_in_index)='org_id,group_id,student_id' LIMIT 1);
SET @ddl = IF(@member_unique IS NOT NULL, CONCAT('ALTER TABLE crm_members DROP INDEX `',@member_unique,'`'), 'SELECT 1');
PREPARE migration_stmt FROM @ddl;
EXECUTE migration_stmt;
DEALLOCATE PREPARE migration_stmt;

SET @ddl = IF(NOT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='crm_tasks' AND column_name='student_id'), 'ALTER TABLE crm_tasks ADD student_id CHAR(36) CHARACTER SET ascii NULL', 'SELECT 1');
PREPARE migration_stmt FROM @ddl;
EXECUTE migration_stmt;
DEALLOCATE PREPARE migration_stmt;

SET @ddl = IF(NOT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='crm_tasks' AND column_name='payer_id'), 'ALTER TABLE crm_tasks ADD payer_id CHAR(36) CHARACTER SET ascii NULL', 'SELECT 1');
PREPARE migration_stmt FROM @ddl;
EXECUTE migration_stmt;
DEALLOCATE PREPARE migration_stmt;

SET @ddl = IF(NOT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='crm_leads' AND column_name='payer_id'), 'ALTER TABLE crm_leads ADD payer_id CHAR(36) CHARACTER SET ascii NULL', 'SELECT 1');
PREPARE migration_stmt FROM @ddl;
EXECUTE migration_stmt;
DEALLOCATE PREPARE migration_stmt;

SET @ddl = IF(NOT EXISTS(SELECT 1 FROM information_schema.table_constraints WHERE constraint_schema=DATABASE() AND table_name='crm_tasks' AND constraint_name='fk_tasks_student_id_v5'), 'ALTER TABLE crm_tasks ADD CONSTRAINT fk_tasks_student_id_v5 FOREIGN KEY(org_id,student_id) REFERENCES crm_students(org_id,id)', 'SELECT 1');
PREPARE migration_stmt FROM @ddl;
EXECUTE migration_stmt;
DEALLOCATE PREPARE migration_stmt;

SET @ddl = IF(NOT EXISTS(SELECT 1 FROM information_schema.table_constraints WHERE constraint_schema=DATABASE() AND table_name='crm_tasks' AND constraint_name='fk_tasks_payer_id_v5'), 'ALTER TABLE crm_tasks ADD CONSTRAINT fk_tasks_payer_id_v5 FOREIGN KEY(org_id,payer_id) REFERENCES crm_payers(org_id,id)', 'SELECT 1');
PREPARE migration_stmt FROM @ddl;
EXECUTE migration_stmt;
DEALLOCATE PREPARE migration_stmt;

SET @ddl = IF(NOT EXISTS(SELECT 1 FROM information_schema.table_constraints WHERE constraint_schema=DATABASE() AND table_name='crm_leads' AND constraint_name='fk_leads_payer_id_v5'), 'ALTER TABLE crm_leads ADD CONSTRAINT fk_leads_payer_id_v5 FOREIGN KEY(org_id,payer_id) REFERENCES crm_payers(org_id,id)', 'SELECT 1');
PREPARE migration_stmt FROM @ddl;
EXECUTE migration_stmt;
DEALLOCATE PREPARE migration_stmt;

SET @ddl = IF(NOT EXISTS(SELECT 1 FROM information_schema.table_constraints WHERE constraint_schema=DATABASE() AND table_name='crm_members' AND constraint_name='fk_members_branch_id_v5'), 'ALTER TABLE crm_members ADD CONSTRAINT fk_members_branch_id_v5 FOREIGN KEY(org_id,branch_id) REFERENCES crm_branches(org_id,id)', 'SELECT 1');
PREPARE migration_stmt FROM @ddl;
EXECUTE migration_stmt;
DEALLOCATE PREPARE migration_stmt;

INSERT IGNORE INTO crm_payer_students(id,org_id,branch_id,payer_id,student_id)
 SELECT UUID(),org_id,branch_id,payer_id,id FROM crm_students;
UPDATE crm_leads l JOIN crm_students s ON s.org_id=l.org_id AND s.id=l.student_id SET l.payer_id=s.payer_id WHERE l.payer_id IS NULL;
CREATE TABLE IF NOT EXISTS crm_record_history (
 id CHAR(36) CHARACTER SET ascii PRIMARY KEY,
 org_id CHAR(36) CHARACTER SET ascii NOT NULL,
 resource VARCHAR(40) NOT NULL,
 resource_id CHAR(36) CHARACTER SET ascii NOT NULL,
 author_id CHAR(36) CHARACTER SET ascii NOT NULL,
 action VARCHAR(100) NOT NULL,
 before_data JSON NULL, after_data JSON NOT NULL,
 created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
 FOREIGN KEY(org_id,author_id) REFERENCES crm_users(org_id,id),
 KEY(org_id,resource,resource_id,created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
SET @ddl = IF(NOT EXISTS(SELECT 1 FROM information_schema.statistics WHERE table_schema=DATABASE() AND table_name='crm_members' AND index_name='member_period_unique'), 'ALTER TABLE crm_members ADD UNIQUE KEY member_period_unique(org_id,group_id,student_id,starts_at)', 'SELECT 1');
PREPARE migration_stmt FROM @ddl;
EXECUTE migration_stmt;
DEALLOCATE PREPARE migration_stmt;
