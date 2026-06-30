-- =========================
-- ERP LEDGER DATABASE
-- ADMIN + ACCOUNTANT ONLY
-- =========================

CREATE DATABASE IF NOT EXISTS erp_db;
USE erp_db;

-- =========================
-- AUTH MODULE
-- =========================

CREATE TABLE users (
    id CHAR(36) PRIMARY KEY,
    name VARCHAR(255),
    email VARCHAR(255) UNIQUE,
    password_hash VARCHAR(255),
    role ENUM('ADMIN','ACCOUNTANT') NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================
-- CORE LEDGER (MAIN SYSTEM)
-- =========================

CREATE TABLE ledger_entries (
    id CHAR(36) PRIMARY KEY,

    entry_date DATE NOT NULL,

    account_name VARCHAR(255) NOT NULL,

    entry_type ENUM('DEBIT','CREDIT') NOT NULL,

    amount DECIMAL(18,2) NOT NULL,

    reference_type VARCHAR(50),
    reference_id CHAR(36),

    description TEXT,

    created_by CHAR(36),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_ledger_date ON ledger_entries(entry_date);
CREATE INDEX idx_ledger_account ON ledger_entries(account_name);

-- =========================
-- CASH MODULE
-- =========================

CREATE TABLE cash_transactions (
    id CHAR(36) PRIMARY KEY,

    type ENUM('IN','OUT') NOT NULL,

    amount DECIMAL(18,2) NOT NULL,

    reference_type VARCHAR(50),
    reference_id CHAR(36),

    description TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_cash_date ON cash_transactions(created_at);

-- =========================
-- BANK MODULE
-- =========================

CREATE TABLE bank_transactions (
    id CHAR(36) PRIMARY KEY,

    bank_name VARCHAR(255),

    type ENUM('IN','OUT') NOT NULL,

    amount DECIMAL(18,2) NOT NULL,

    reference_type VARCHAR(50),
    reference_id CHAR(36),

    description TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_bank_date ON bank_transactions(created_at);

-- =========================
-- SALES MODULE (FINANCIAL SUMMARY ONLY)
-- =========================

CREATE TABLE sales_reports (
    id CHAR(36) PRIMARY KEY,

    report_date DATE NOT NULL,

    gross_amount DECIMAL(18,2) DEFAULT 0,
    cash_amount DECIMAL(18,2) DEFAULT 0,
    upi_amount DECIMAL(18,2) DEFAULT 0,
    bank_amount DECIMAL(18,2) DEFAULT 0,
    card_amount DECIMAL(18,2) DEFAULT 0,
    debtor_amount DECIMAL(18,2) DEFAULT 0,

    remarks_cipher TEXT,
    remarks_iv VARCHAR(255),
    remarks_tag VARCHAR(255),

    hmac_signature VARCHAR(255),
    previous_hash VARCHAR(255),

    status ENUM('DRAFT','POSTED','VOID') DEFAULT 'DRAFT',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_sales_date ON sales_reports(report_date);

-- =========================
-- EXPENSE MODULE
-- =========================

CREATE TABLE expense_reports (
    id CHAR(36) PRIMARY KEY,

    report_date DATE NOT NULL,

    total_amount DECIMAL(18,2) DEFAULT 0,

    hmac_signature VARCHAR(255),
    previous_hash VARCHAR(255),

    status ENUM('DRAFT','POSTED','VOID') DEFAULT 'DRAFT',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE expense_items (
    id CHAR(36) PRIMARY KEY,

    expense_report_id CHAR(36),

    expense_title VARCHAR(255),
    amount DECIMAL(18,2),
    payment_mode ENUM('CASH','UPI','BANK','CARD'),

    remarks_cipher TEXT,
    remarks_iv VARCHAR(255),
    remarks_tag VARCHAR(255)
);

-- =========================
-- DEBTOR MODULE (CUSTOMER LEDGER)
-- =========================

CREATE TABLE debtor_transactions (
    id CHAR(36) PRIMARY KEY,

    customer_name VARCHAR(255) NOT NULL,

    type ENUM('NEW','PAYMENT','ADJUSTMENT') NOT NULL,

    amount DECIMAL(18,2) NOT NULL,

    reference_type VARCHAR(50),
    reference_id CHAR(36),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_debtor_date ON debtor_transactions(created_at);

-- =========================
-- AUDIT LOGS (VERY IMPORTANT)
-- =========================

CREATE TABLE audit_logs (
    id CHAR(36) PRIMARY KEY,

    user_id CHAR(36),

    action VARCHAR(255),
    table_name VARCHAR(255),
    record_id CHAR(36),

    old_value JSON,
    new_value JSON,

    ip_address VARCHAR(100),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_user ON audit_logs(user_id);

-- =========================
-- DAILY CLOSING (FINANCIAL SNAPSHOT)
-- =========================

CREATE TABLE daily_closing (
    id CHAR(36) PRIMARY KEY,

    report_date DATE UNIQUE,

    sales_total DECIMAL(18,2) DEFAULT 0,
    expense_total DECIMAL(18,2) DEFAULT 0,
    cash_total DECIMAL(18,2) DEFAULT 0,
    debtor_total DECIMAL(18,2) DEFAULT 0,

    hash VARCHAR(255),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================
-- ENCRYPTION KEYS (OPTIONAL)
-- =========================

CREATE TABLE encryption_keys (
    id CHAR(36) PRIMARY KEY,

    key_version VARCHAR(50),

    encrypted_key TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);