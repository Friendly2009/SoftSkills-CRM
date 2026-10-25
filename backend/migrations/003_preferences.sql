CREATE TABLE IF NOT EXISTS crm_preferences (
 id CHAR(36) CHARACTER SET ascii NOT NULL,
 org_id CHAR(36) CHARACTER SET ascii NOT NULL,
 user_id CHAR(36) CHARACTER SET ascii NOT NULL,
 widgets JSON NOT NULL,
 PRIMARY KEY(id), UNIQUE KEY(org_id,user_id),
 FOREIGN KEY(org_id,user_id) REFERENCES crm_users(org_id,id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
