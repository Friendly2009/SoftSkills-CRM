CREATE TABLE IF NOT EXISTS crm_announcements (
 id CHAR(36) CHARACTER SET ascii NOT NULL,
 org_id CHAR(36) CHARACTER SET ascii NOT NULL,
 branch_id CHAR(36) CHARACTER SET ascii NOT NULL,
 name VARCHAR(255) NOT NULL,
 description TEXT NOT NULL,
 active BOOLEAN NOT NULL DEFAULT TRUE,
 created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
 PRIMARY KEY(id), UNIQUE KEY(org_id,id),
 FOREIGN KEY(org_id,branch_id) REFERENCES crm_branches(org_id,id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
CREATE TABLE IF NOT EXISTS crm_comments (
 id CHAR(36) CHARACTER SET ascii NOT NULL,
 org_id CHAR(36) CHARACTER SET ascii NOT NULL,
 author_id CHAR(36) CHARACTER SET ascii NOT NULL,
 resource VARCHAR(40) NOT NULL,
 resource_id CHAR(36) CHARACTER SET ascii NOT NULL,
 text TEXT NOT NULL,
 created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
 PRIMARY KEY(id), UNIQUE KEY(org_id,id),
 KEY(org_id,resource,resource_id,created_at),
 FOREIGN KEY(org_id,author_id) REFERENCES crm_users(org_id,id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
CREATE TABLE IF NOT EXISTS crm_notifications (
 id CHAR(36) CHARACTER SET ascii NOT NULL,
 org_id CHAR(36) CHARACTER SET ascii NOT NULL,
 user_id CHAR(36) CHARACTER SET ascii NOT NULL,
 message VARCHAR(255) NOT NULL,
 read_at DATETIME(3) NULL,
 created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
 PRIMARY KEY(id), UNIQUE KEY(org_id,id),
 KEY(org_id,user_id,created_at),
 FOREIGN KEY(org_id,user_id) REFERENCES crm_users(org_id,id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
