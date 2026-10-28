CREATE TABLE IF NOT EXISTS crm_import_previews (
  id CHAR(36) CHARACTER SET ascii PRIMARY KEY,
  org_id CHAR(36) CHARACTER SET ascii NOT NULL,
  user_id CHAR(36) CHARACTER SET ascii NOT NULL,
  branch_id CHAR(36) CHARACTER SET ascii NOT NULL,
  payload JSON NOT NULL,
  result JSON NULL,
  expires_at DATETIME(3) NOT NULL,
  confirmed_at DATETIME(3) NULL,
  INDEX import_owner (org_id,user_id),
  FOREIGN KEY (org_id) REFERENCES crm_organizations(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
