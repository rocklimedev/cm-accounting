ALTER TABLE sales_reports
  ADD COLUMN remarks_key_version VARCHAR(50) NULL AFTER remarks_tag;

ALTER TABLE expense_items
  ADD COLUMN remarks_key_version VARCHAR(50) NULL AFTER remarks_tag;

ALTER TABLE debtor_reports
  ADD COLUMN remarks_key_version VARCHAR(50) NULL AFTER remarks_tag;

ALTER TABLE encryption_keys
  ADD COLUMN key_fingerprint VARCHAR(64) NULL AFTER key_version,
  ADD COLUMN status VARCHAR(30) DEFAULT 'active' AFTER key_fingerprint,
  ADD COLUMN algorithm VARCHAR(50) DEFAULT 'aes-256-gcm' AFTER status,
  ADD COLUMN activated_at TIMESTAMP NULL AFTER encrypted_key,
  ADD COLUMN retired_at TIMESTAMP NULL AFTER activated_at,
  ADD COLUMN notes TEXT NULL AFTER retired_at;

CREATE UNIQUE INDEX uk_encryption_keys_key_version
  ON encryption_keys (key_version);
