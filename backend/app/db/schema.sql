-- backend/app/db/schema.sql
-- Idempotent: safe to run every startup (all statements use IF NOT EXISTS)

PRAGMA journal_mode = WAL;      -- concurrent reads + one writer: critical for demo
PRAGMA foreign_keys = ON;
PRAGMA synchronous = NORMAL;    -- faster writes, still crash-safe

-- ─────────────────────────────────────────────────────────────────────────
-- TABLE: orgs
-- One row per organisation (company/hospital/government entity)
-- ─────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS orgs (
    id           TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    name         TEXT NOT NULL,
    tier         TEXT NOT NULL DEFAULT 'free'
                 CHECK (tier IN ('free', 'sme', 'enterprise', 'government')),
    api_key_hash TEXT,
    node_limit   INTEGER NOT NULL DEFAULT 20,
    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ─────────────────────────────────────────────────────────────────────────
-- TABLE: users
-- Belongs to one org. Password is ALWAYS Argon2id. Never plaintext.
-- ─────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    id            TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    org_id        TEXT NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
    email         TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role          TEXT NOT NULL DEFAULT 'analyst'
                  CHECK (role IN ('admin', 'analyst', 'viewer')),
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ─────────────────────────────────────────────────────────────────────────
-- TABLE: scans
-- One scan = one infrastructure validation run.
-- ALL pipeline outputs stored as JSON columns (flexible, no migrations needed).
-- ─────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS scans (
    id              TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    org_id          TEXT NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
    name            TEXT NOT NULL DEFAULT 'unnamed',
    input_raw       TEXT NOT NULL,           -- original user upload, stored as-is
    evidence_source TEXT NOT NULL DEFAULT 'manual',
                                             -- manual|json|yaml|terraform|aws_config|k8s
    graph_json      JSON NOT NULL DEFAULT '{}',
    node_count      INTEGER DEFAULT 0,
    status          TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'running', 'complete', 'failed')),

    -- Security Index (0-100) and per-engine breakdown
    security_index  INTEGER CHECK (security_index BETWEEN 0 AND 100),
    score_breakdown JSON NOT NULL DEFAULT '{}',
                    -- {zero_trust, quantum, attack_path, supply_chain, compliance,
                    --  per_finding_deltas: {rule_id: -delta}}
    risk_summary    JSON NOT NULL DEFAULT '{}',
                    -- {CRITICAL: int, HIGH: int, MEDIUM: int, LOW: int}

    -- ALL pipeline stage outputs stored as JSON
    findings             JSON NOT NULL DEFAULT '[]',
                         -- List[finding] — each finding includes ai_opinion after Stage 5b
    ai_opinions          JSON NOT NULL DEFAULT '{}',
                         -- executive_summary dict from ai/summarizer.py
    executive_summary    JSON NOT NULL DEFAULT '{}',
                         -- CISO-facing summary: risk_level, counts, main_risk, primary_action
    auto_fix_patches     JSON NOT NULL DEFAULT '[]',
                         -- List[patch] from autofix/engine.py
    confidence_warnings  JSON NOT NULL DEFAULT '[]',
                         -- List[warning] from confidence/model.py Stage 2
    engine_status        JSON NOT NULL DEFAULT '{}',
                         -- {zt:'ok'|'failed', quantum:'ok', ap:'ok', sc:'ok'}

    -- Timing
    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    duration_ms  INTEGER DEFAULT 0
);

-- ─────────────────────────────────────────────────────────────────────────
-- TABLE: reports
-- Signed PDF reports, one per scan.
-- ─────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reports (
    id              TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    scan_id         TEXT NOT NULL REFERENCES scans(id) ON DELETE CASCADE,
    org_id          TEXT REFERENCES orgs(id) ON DELETE CASCADE,
    status          TEXT NOT NULL DEFAULT 'pending',
    sha256_hash     TEXT,
    rsa_signature   TEXT,
    public_key_pem  TEXT,
    polygon_tx_hash TEXT,           -- NULL when BLOCKCHAIN_MODE=rsa
    pdf_base64      TEXT,
    pdf_data        BLOB,
    sha256          TEXT,
    sig_b64         TEXT,
    pub_pem         TEXT,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ─────────────────────────────────────────────────────────────────────────
-- VIRTUAL TABLE: docs_fts (FTS5 full-text search)
-- Stores chunked regulatory documents for P1's tier2 advisory AI.
-- Porter stemming + Unicode61 tokeniser for English text.
-- ─────────────────────────────────────────────────────────────────────────
CREATE VIRTUAL TABLE IF NOT EXISTS docs_fts USING fts5(
    doc_id,
    title,
    content,
    source,
    tokenize = 'porter unicode61'
);

-- ─────────────────────────────────────────────────────────────────────────
-- INDEXES
-- ─────────────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_scans_org_id  ON scans(org_id);
CREATE INDEX IF NOT EXISTS idx_scans_status  ON scans(status);
CREATE INDEX IF NOT EXISTS idx_scans_score   ON scans(security_index DESC);
CREATE INDEX IF NOT EXISTS idx_scans_created ON scans(created_at DESC);
