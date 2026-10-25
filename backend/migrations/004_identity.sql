SET @ddl = IF(NOT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='crm_organizations' AND column_name='company_slug'), 'ALTER TABLE crm_organizations ADD company_slug VARCHAR(80) NULL', 'SELECT 1');
PREPARE migration_stmt FROM @ddl;
EXECUTE migration_stmt;
DEALLOCATE PREPARE migration_stmt;
UPDATE crm_organizations SET company_slug=CONCAT('company-',id) WHERE company_slug IS NULL;
SET @ddl = IF(EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='crm_organizations' AND column_name='company_slug' AND is_nullable='YES'), 'ALTER TABLE crm_organizations MODIFY company_slug VARCHAR(80) NOT NULL', 'SELECT 1');
PREPARE migration_stmt FROM @ddl;
EXECUTE migration_stmt;
DEALLOCATE PREPARE migration_stmt;
SET @ddl = IF(NOT EXISTS(SELECT 1 FROM information_schema.statistics WHERE table_schema=DATABASE() AND table_name='crm_organizations' AND index_name='company_slug_unique'), 'ALTER TABLE crm_organizations ADD UNIQUE KEY company_slug_unique(company_slug)', 'SELECT 1');
PREPARE migration_stmt FROM @ddl;
EXECUTE migration_stmt;
DEALLOCATE PREPARE migration_stmt;
SET @ddl = IF(NOT EXISTS(SELECT 1 FROM information_schema.statistics WHERE table_schema=DATABASE() AND table_name='crm_users' AND index_name='org_login_unique'), 'ALTER TABLE crm_users ADD UNIQUE KEY org_login_unique(org_id,login)', 'SELECT 1');
PREPARE migration_stmt FROM @ddl;
EXECUTE migration_stmt;
DEALLOCATE PREPARE migration_stmt;
SET @ddl = IF(EXISTS(SELECT 1 FROM information_schema.statistics WHERE table_schema=DATABASE() AND table_name='crm_users' AND index_name='login'), 'ALTER TABLE crm_users DROP INDEX login', 'SELECT 1');
PREPARE migration_stmt FROM @ddl;
EXECUTE migration_stmt;
DEALLOCATE PREPARE migration_stmt;
CREATE TABLE IF NOT EXISTS crm_memberships (
 user_id CHAR(36) CHARACTER SET ascii PRIMARY KEY,
 org_id CHAR(36) CHARACTER SET ascii NOT NULL,
 created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
 FOREIGN KEY(org_id,user_id) REFERENCES crm_users(org_id,id)
) ENGINE=InnoDB;
INSERT IGNORE INTO crm_memberships(user_id,org_id) SELECT id,org_id FROM crm_users;
CREATE TABLE IF NOT EXISTS crm_invitations (
 id CHAR(36) CHARACTER SET ascii PRIMARY KEY,
 org_id CHAR(36) CHARACTER SET ascii NOT NULL,
 person_id CHAR(36) CHARACTER SET ascii NOT NULL,
 token_hash CHAR(64) NOT NULL UNIQUE,
 roles JSON NOT NULL, branches JSON NOT NULL,
 expires_at DATETIME(3) NOT NULL, used_at DATETIME(3) NULL,
 FOREIGN KEY(org_id,person_id) REFERENCES crm_people(org_id,id),
 KEY(expires_at)
) ENGINE=InnoDB;
