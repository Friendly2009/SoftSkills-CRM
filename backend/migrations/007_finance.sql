-- Refund links use the original payer ledger entry, organization-scoped FK.
CREATE TABLE IF NOT EXISTS crm_refunds (
 id CHAR(36) CHARACTER SET ascii NOT NULL,
 org_id CHAR(36) CHARACTER SET ascii NOT NULL,
 original_entry_id CHAR(36) CHARACTER SET ascii NOT NULL,
 refund_entry_id CHAR(36) CHARACTER SET ascii NOT NULL,
 PRIMARY KEY(id), UNIQUE KEY(org_id,refund_entry_id),
 FOREIGN KEY(org_id,original_entry_id) REFERENCES crm_ledger(org_id,id),
 FOREIGN KEY(org_id,refund_entry_id) REFERENCES crm_ledger(org_id,id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
CREATE TABLE IF NOT EXISTS crm_lesson_versions (
 id CHAR(36) CHARACTER SET ascii NOT NULL,
 org_id CHAR(36) CHARACTER SET ascii NOT NULL,
 lesson_id CHAR(36) CHARACTER SET ascii NOT NULL,
 revision INT NOT NULL,
 snapshot JSON NOT NULL,
 PRIMARY KEY(id), UNIQUE KEY(org_id,lesson_id,revision),
 FOREIGN KEY(org_id,lesson_id) REFERENCES crm_lessons(org_id,id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
