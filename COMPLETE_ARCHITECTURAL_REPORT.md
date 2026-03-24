# QUANTUM-ARES: Complete Architectural Report
## Infrastructure Security Validation & Remediation Platform

**Version:** 7.75.0  
**Created:** March 22, 2026  
**Purpose:** Pre-deployment infrastructure security validation with AI-driven insights and automatic remediation  
**Slogan:** "The CIBIL score for IT architecture"

---

## TABLE OF CONTENTS
1. [System Overview](#system-overview)
2. [Core Architecture](#core-architecture)
3. [File Structure & Responsibilities](#file-structure--responsibilities)
4. [API Routing & Endpoints](#api-routing--endpoints)
5. [8-Stage Pipeline Architecture](#8-stage-pipeline-architecture)
6. [Configuration Management](#configuration-management)
7. [Database Schema & Integration](#database-schema--integration)
8. [Security & Authentication Flow](#security--authentication-flow)
9. [Data Flow Diagrams](#data-flow-diagrams)
10. [Component Integration Points](#component-integration-points)

---

## SYSTEM OVERVIEW

### What is QUANTUM-ARES?
A FastAPI-based security validation engine that analyzes infrastructure blueprints (JSON, YAML, Terraform, AWS Config, Kubernetes manifests, Nmap scans) and produces:
- **Security Index Score** (0-100): Weighted aggregate across 5 security engines
- **Risk Assessment**: CRITICAL/HIGH/MEDIUM/LOW findings with CVSS scores
- **AI-Driven Opinions**: Reasoning layer (impact, likelihood, priority) without LLM hallucination
- **Auto-Fix Patches**: Expert-verified Terraform/IAM/Kubernetes remediation templates
- **Blockchain-Signed Reports**: RSA or Polygon-verified PDF reports

### Key Differentiators
- **Multi-Source Evidence**: Accepts manual, IaC, API-scanned, and network-scanned data
- **Confidence Resolution**: Automatically downgrades trust in self-reported claims vs. machine-verified sources
- **Quantum-Ready**: Detects HNDL attacks (Harvest-Now-Decrypt-Later) pre-deployment
- **Multi-Tenant**: Organization-based isolation with RBAC (admin/analyst/viewer roles)
- **Async Pipeline**: Non-blocking background processing with HTTP 202 (Accepted) response

---

## CORE ARCHITECTURE

### Technology Stack
```
Framework:        FastAPI (Python async web framework)
Database:         SQLite 3 with WAL mode (concurrent read/write safe)
Authentication:   JWT (HS256) + Argon2id password hashing
Cryptography:     RSA-2048 + SHA256 signing, optional Polygon blockchain
Graph Engine:     NetworkX (directed graphs for infrastructure topology)
FTS:              SQLite FTS5 (full-text search for compliance docs)
Frontend:         React with Vite (port 5173 dev, 80 prod)
Deployment:       Docker + docker-compose + Nginx
```

### Execution Model
- **Startup Lifespan**: Database schema initialization + FTS5 indexing
- **Request Handling**: FastAPI routes return 202 immediately, queue background task
- **Pipeline Execution**: ThreadPoolExecutor runs stages in parallel where independent
- **Health Monitoring**: Docker healthcheck polls `/health` every 15 seconds

---

## FILE STRUCTURE & RESPONSIBILITIES

### Root-Level Files
```
docker-compose.yml          → Orchestrates backend (FastAPI:8000) + frontend (Nginx:80)
token.json                  → Demo JWT tokens for testing
requirements.txt            → Python dependencies (pip install -r)
```

---

### backend/app/main.py
**Purpose:** FastAPI application entry point and lifespan management  
**Responsibilities:**
- Initialize FastAPI app with metadata (title, version, description)
- Configure CORS middleware for frontend origins (localhost:5173, localhost:80, Render.com)
- Setup lifespan context manager for startup/shutdown hooks
- Mount authentication router (`/api/v1/auth/*`) and main router (`/api/v1/*`)
- Provide `/health` endpoint for Docker healthcheck

**Key Functions:**
```python
lifespan(app)               → Creates tables, indexes, FTS5 data on startup
                             Auto-seeds DemoOrg if DB is empty
@app.get('/health')         → Returns {"status": "ok", "db": "ok", "fts5": "ok", "version": "7.75.0"}
```

**Startup Sequence:**
1. Database schema created (idempotent, uses CREATE IF NOT EXISTS)
2. FTS5 index built from regulatory documents (dpdp_act_2023.txt, nist_sp_800_207.txt, etc.)
3. Demo org "demoorg001" auto-created if DB fresh (email: admin@demo.com, password: Admin@1234)
4. Server ready to accept requests

---

### backend/app/config.py
**Purpose:** Centralized configuration from environment variables  
**Responsibilities:**
- Define all hardcoded vs. environment-driven settings
- Prevent os.getenv() calls scattered throughout codebase
- Provide defaults for development environment

**Configuration Variables:**
```python
SQLITE_PATH         = os.getenv('SQLITE_PATH', 'backend/app/data/quantum_ares.db')
SECRET_KEY          = os.getenv('SECRET_KEY', 'dev-secret-key...')  # Change in production!
ALGORITHM           = 'HS256'                                       # JWT signing algorithm
TOKEN_EXPIRE_HOURS  = 24                                            # JWT lifetime
ALLOWED_ORIGINS     = 'http://localhost:5173,http://localhost:80'  # CORS allowlist
BLOCKCHAIN_MODE     = os.getenv('BLOCKCHAIN_MODE', 'rsa')          # 'rsa' or 'polygon'
APP_VERSION         = '7.75.0'
APP_TITLE           = 'QUANTUM-ARES'
```

**Integration Points:**
- Imported by main.py for CORS configuration
- Imported by auth.py for JWT token signing
- Imported by database.py for SQLite path resolution

---

### backend/app/api/routes.py
**Purpose:** Main API endpoint definitions for scan operations  
**Responsibilities:**
- Accept infrastructure blueprint uploads
- Queue background pipeline tasks
- Provide status polling endpoints
- Handle authentication/authorization per endpoint

**API Endpoints:**

#### POST /api/v1/validate (202 Accepted)
```python
@router.post('/validate', status_code=202)
async def validate(
    bg: BackgroundTasks,
    file: UploadFile = File(...),
    name: str = Form('unnamed'),
    evidence_source: str = Form('json'),
    auth=Depends(get_current_org)
)
```
**Input:**
- `file`: Upload raw infrastructure file (JSON, YAML, Terraform, etc.)
- `name`: Human-readable scan name (optional, defaults to 'unnamed')
- `evidence_source`: One of {manual, json, yaml, terraform, aws_config, k8s, nmap}
- `auth`: JWT token from Authorization header (automatic validation via get_current_org)

**Output:** HTTP 202 with scan_id
```json
{
  "scan_id": "a7f3e2c1d4b9...",
  "status": "pending",
  "message": "Scan queued. Poll /scans/{id}/status for updates."
}
```

**Internal Flow:**
1. File uploaded and decoded to UTF-8 text
2. Input validation (file size minimum, evidence_source enumeration)
3. Scan record created in DB (status='pending')
4. Background task queued via bg.add_task(run_pipeline, scan_id, org_id)
5. HTTP 202 returned immediately (non-blocking)

#### GET /api/v1/scans/{scan_id}/status (200 OK)
```python
@router.get('/scans/{scan_id}/status')
def scan_status(scan_id: str, auth=Depends(get_current_org))
```
**Purpose:** Lightweight polling endpoint for frontend ScanPoller.tsx (polls every 2 seconds)

**Output:**
```json
{
  "scan_id": "a7f3e2c1...",
  "status": "running|complete|failed|pending",
  "progress_percent": 45,
  "engine_status": {"zt": "running", "quantum": "complete", "ap": "pending", "sc": "pending"},
  "completion_time": "2026-03-22T14:30:00Z"
}
```

**Security:**
- Org_id from JWT token enforced → users cannot access other orgs' scans
- Response kept minimal (high-frequency polling)

#### Additional Endpoints (Stubbed, implementing Day 2+)
- `GET /api/v1/scans/{scan_id}/report` → Full findings + patches JSON
- `POST /api/v1/patches/{patch_id}/apply` → Apply auto-fix patches
- `POST /api/v1/chat` → AI chat interface over findings

---

### backend/app/api/auth.py
**Purpose:** JWT authentication middleware and login endpoint  
**Responsibilities:**
- Validate email/password against database
- Issue JWT tokens with org_id embedded
- Enforce token validation on all protected routes

**Authentication Flow:**

#### POST /api/v1/auth/login
```python
@router.post('/auth/login')
def login(req: LoginRequest)
```
**Input:**
```python
class LoginRequest(BaseModel):
    email: str
    password: str
```

**Output:**
```json
{
  "access_token": "eyJhbGc...",
  "token_type": "bearer",
  "expires_in": 86400,
  "org_id": "demoorg001",
  "role": "admin"
}
```

**Internal Process:**
1. Email looked up in users table (case-insensitive)
2. Argon2id password hash verified (timing-attack resistant)
3. JWT token created with payload:
   ```python
   {
     'sub':    user_id,
     'org_id': org_id,
     'role':   role,
     'exp':    datetime.utcnow() + timedelta(hours=24)
   }
   ```
4. Token signed with SECRET_KEY using HS256

#### def get_current_org(authorization: str = Header(...))
**Purpose:** FastAPI dependency for protected routes  
**Input:** Authorization header (format: "Bearer <token>")  
**Output:** {"user_id": str, "org_id": str, "role": str}  
**Raises:** HTTPException 401 on invalid/expired/missing token

**Usage in Routes:**
```python
@router.get('/scans/{scan_id}/status')
def scan_status(scan_id: str, auth=Depends(get_current_org)):
    # auth['org_id'] automatically used to filter queries
    scan = get_scan(scan_id, auth['org_id'])
```

---

### backend/app/db/database.py
**Purpose:** SQLite connection manager and schema initialization  
**Responsibilities:**
- Provide threadsafe database connections
- Apply schema on startup
- Build FTS5 index for regulatory documents

**Key Functions:**

#### get_db() → sqlite3.Connection
**Purpose:** Get a new database connection  
**Features:**
```python
def get_db() -> sqlite3.Connection:
    conn = sqlite3.connect(db_path, check_same_thread=False)
    conn.row_factory = sqlite3.Row      # Access columns by name (row['column'])
    conn.execute('PRAGMA foreign_keys=ON')
    conn.execute('PRAGMA journal_mode=WAL')  # Write-Ahead Logging (concurrent reads + one writer)
    conn.execute('PRAGMA synchronous=NORMAL')  # Crash-safe, faster
    return conn
```

**Why check_same_thread=False?**
FastAPI background tasks run in separate threads. SQLite connections must not be shared between threads, but opening a new connection per thread is safe with proper mutex protection (SQLite handles this).

**Why WAL mode?**
- Normal mode: Lock entire DB during write, blocking all reads
- WAL mode: Readers use snapshot before write begins, writers don't block readers
- Critical for this app: frontend polls /status every 2s while pipeline writes findings

#### init_schema() → None
**Purpose:** Create all tables, indexes, and FTS5 virtual table on startup  
**Behavior:** Idempotent (all statements use CREATE IF NOT EXISTS)  
**Called:** Once during FastAPI lifespan startup

#### build_fts5_index() → None
**Purpose:** Populate FTS5 table with regulatory documents  
**Process:**
1. Load text files from backend/app/data/:
   - dpdp_act_2023.txt (India data protection)
   - nist_sp_800_207.txt (NIST Zero Trust)
   - rbi_master_direction.txt (India banking)
   - nvd_snapshot.json (National Vulnerability Database)
2. Chunk each document into 500-word passages
3. Insert into docs_fts (FTS5 virtual table)
4. Build full-text index for P1's tier2 advisory AI

**FTS5 Schema:**
```sql
CREATE VIRTUAL TABLE docs_fts USING fts5(
    doc_id,         -- Source document identifier
    title,          -- Regulation/standard name
    content,        -- 500-word passage text
    source,         -- 'nist'|'dpdp'|'rbi'|'nvd'
    tokenize='porter unicode61'  -- Porter stemming + Unicode tokenization
)
```

---

### backend/app/db/schema.sql
**Purpose:** Complete database schema with all tables, constraints, and indexes  

**Tables:**

#### TABLE: orgs
```sql
CREATE TABLE orgs (
    id           TEXT PRIMARY KEY,          -- UUID (16 random bytes, hex)
    name         TEXT NOT NULL,             -- Organization name (e.g., "ICICI Bank")
    tier         TEXT DEFAULT 'free',       -- Pricing tier: free|sme|enterprise|government
    api_key_hash TEXT,                      -- SHA256 hash of API key (if using API mode)
    node_limit   INTEGER DEFAULT 20,        -- Max infrastructure nodes allowed
    created_at   TIMESTAMP DEFAULT NOW      -- Registration timestamp
)
```

#### TABLE: users
```sql
CREATE TABLE users (
    id            TEXT PRIMARY KEY,         -- UUID
    org_id        TEXT NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
    email         TEXT UNIQUE NOT NULL,     -- Unique per system
    password_hash TEXT NOT NULL,            -- Argon2id (NEVER plaintext)
    role          TEXT DEFAULT 'analyst',   -- admin|analyst|viewer
    created_at    TIMESTAMP DEFAULT NOW
)
```

#### TABLE: scans
```sql
CREATE TABLE scans (
    id              TEXT PRIMARY KEY,
    org_id          TEXT NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
    name            TEXT NOT NULL DEFAULT 'unnamed',
    input_raw       TEXT NOT NULL,          -- Original uploaded file (stored as-is)
    evidence_source TEXT NOT NULL,          -- manual|json|yaml|terraform|aws_config|k8s|nmap
    
    -- Graph & Topology
    graph_json      JSON NOT NULL DEFAULT '{}',  -- {"nodes": [...], "edges": [...]}
    node_count      INTEGER DEFAULT 0,
    
    -- Pipeline Status
    status          TEXT NOT NULL DEFAULT 'pending',  -- pending|running|complete|failed
    
    -- Security Scoring (populated by Stage 8)
    security_index  INTEGER CHECK (0-100),           -- 0-100 aggregate score
    score_breakdown JSON NOT NULL DEFAULT '{}',      -- {zero_trust: 35.0, quantum: 20.0, ...}
    risk_summary    JSON NOT NULL DEFAULT '{}',      -- {CRITICAL: 2, HIGH: 5, MEDIUM: 12, LOW: 3}
    
    -- Pipeline Outputs (populated by Stage 8)
    findings        JSON NOT NULL DEFAULT '[]',      -- List of security findings
    ai_opinions     JSON NOT NULL DEFAULT '{}',      -- AI reasoning per finding
    executive_summary JSON NOT NULL DEFAULT '{}',    -- CISO summary (risk_level, counts, actions)
    auto_fix_patches JSON NOT NULL DEFAULT '[]',     -- List of Terraform/IAM/K8s patches
    confidence_warnings JSON NOT NULL DEFAULT '[]',  -- Warnings about input confidence
    engine_status   JSON NOT NULL DEFAULT '{}',      -- {zt:'ok'|'failed', quantum:'ok', ...}
    
    -- Timing
    created_at      TIMESTAMP DEFAULT NOW,
    completed_at    TIMESTAMP,
    duration_ms     INTEGER DEFAULT 0              -- Pipeline execution time
)
```

#### TABLE: reports
```sql
CREATE TABLE reports (
    id              TEXT PRIMARY KEY,
    scan_id         TEXT NOT NULL REFERENCES scans(id) ON DELETE CASCADE,
    org_id          TEXT REFERENCES orgs(id) ON DELETE CASCADE,
    status          TEXT NOT NULL DEFAULT 'pending',      -- pending|ready|signed
    sha256_hash     TEXT,                                 -- SHA256(PDF)
    rsa_signature   TEXT,                                 -- base64(RSA-2048 signature)
    polygon_tx_hash TEXT,                                 -- Blockchain tx hash (if BLOCKCHAIN_MODE=polygon)
    pdf_base64      TEXT,                                 -- base64-encoded PDF
    created_at      TIMESTAMP DEFAULT NOW
)
```

#### VIRTUAL TABLE: docs_fts
```sql
CREATE VIRTUAL TABLE docs_fts USING fts5(
    doc_id,         -- Document identifier
    title,          -- Regulation name
    content,        -- Passage text
    source,         -- Source type
    tokenize='porter unicode61'
)
```

**Indexes:**
```sql
CREATE INDEX idx_scans_org_id   ON scans(org_id);
CREATE INDEX idx_scans_status   ON scans(status);
CREATE INDEX idx_scans_score    ON scans(security_index DESC);  -- For sorting by risk
CREATE INDEX idx_scans_created  ON scans(created_at DESC);
```

**Constraints:**
- Foreign key cascades: deleting an org deletes all its users and scans
- Org tier enumeration: only valid tiers stored
- User roles enumeration: only valid roles stored
- Security index range: 0-100 enforced at DB level

---

### backend/app/db/queries.py
**Purpose:** Type-safe database query functions for core operations  
**Design Rules:**
1. Every function opens/closes own connection (no thread-sharing)
2. All JSON serialization/deserialization handled here
3. Org_id isolation enforced on every read
4. update_scan_result() is ATOMIC (one UPDATE writes all findings)

**Key Functions:**

#### create_scan(org_id: str, name: str, input_raw: str, evidence_source: str) → str
**Purpose:** Create new scan record  
**Returns:** scan_id (32-char hex UUID)  
**DB Operation:**
```sql
INSERT INTO scans (id, org_id, name, input_raw, evidence_source, status)
VALUES (?, ?, ?, ?, ?, 'pending')
```

#### update_scan_running(scan_id: str) → None
**Purpose:** Transition scan to 'running' when pipeline starts

#### update_scan_result(scan_id: str, result: dict) → None
**Purpose:** ATOMIC final update with all pipeline results  
**Input Dict Keys Required:**
```python
{
    'graph_json': {...},
    'node_count': 5,
    'security_index': 67,
    'score_breakdown': {
        'zero_trust': 35.0,
        'quantum': 20.0,
        'attack_path': 25.0,
        'supply_chain': 10.0,
        'compliance': 10.0,
        'per_finding_deltas': {'rule_001': -2.5}
    },
    'risk_summary': {'CRITICAL': 2, 'HIGH': 5, 'MEDIUM': 0, 'LOW': 0},
    'findings': [...],
    'ai_opinions': {...},
    'executive_summary': {...},
    'auto_fix_patches': [...],
    'confidence_warnings': [...],
    'engine_status': {'zt': 'ok', 'quantum': 'ok', 'ap': 'ok', 'sc': 'ok'},
    'duration_ms': 2450
}
```

#### get_scan(scan_id: str, org_id: str) → dict | None
**Purpose:** Fetch single scan with org_id boundary enforcement  
**Output:** Dictionary with all JSON columns deserialized  
**Returns:** None if scan not found OR belongs to different org

#### list_scans(org_id: str, limit: int = 50, offset: int = 0) → list[dict]
**Purpose:** List all scans for an organization  
**Sorting:** By created_at DESC (newest first)

---

### backend/app/pipeline/runner.py
**Purpose:** 8-stage orchestrator for security analysis pipeline  
**Entry Point:** `run_pipeline(scan_id: str, org_id: str)`  
**Execution Model:** Background task (FastAPI BackgroundTasks)

**8-Stage Pipeline:**

```
┌─────────────────────────────────────────────────────────────────────────┐
│ STAGE 1: INPUT PARSING                                                  │
├─────────────────────────────────────────────────────────────────────────┤
│ Input:  input_raw (text from uploaded file)                             │
│ Parser: app.parsers.parse_input() with fallback to JSON parsing         │
│ Output: data = {nodes: [...], edges: [...], evidence_source: '...'}    │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│ STAGE 2: CONFIDENCE RESOLUTION                                          │
├─────────────────────────────────────────────────────────────────────────┤
│ Input:  data, evidence_source                                           │
│ Logic:  ConfidenceResolver scores trust (terraform:0.95, manual:0.30)   │
│         If confidence < 0.70, flip positive security claims to False    │
│         Example: "auth_required: true" becomes False for manual source  │
│ Output: resolved_data, confidence_score, warnings                       │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│ STAGE 3: GRAPH BUILDING                                                 │
├─────────────────────────────────────────────────────────────────────────┤
│ Input:  resolved_data                                                   │
│ Logic:  app.graph.builder.build_graph() creates NetworkX DiGraph       │
│         Nodes: {id, name, type, zone, data_sensitivity, encryption...} │
│         Edges: {source, target, auth_required, mfa_required, tls...}  │
│ Output: G (NetworkX DiGraph)                                            │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│ STAGE 4: THREAT ENGINES (Parallel Execution)                            │
├─────────────────────────────────────────────────────────────────────────┤
│ 4a. Zero Trust Engine (35% weight)                                      │
│     Rules: eval_rules(G, RULE_REGISTRY) from app.engines.rules          │
│     Checks: Implicit trust detected, MFA missing, unencrypted channels  │
│     Output: (findings_zt, score_zt)                                     │
│                                                                          │
│ 4b. Quantum Engine (20% weight)                                         │
│     Detection: HNDL attacks, post-quantum encryption gaps, key lengths  │
│     Output: (findings_quantum, score_quantum)                           │
│                                                                          │
│ 4c. Attack Path Engine (25% weight)                                     │
│     Logic: Traverse graph from external nodes, identify attack vectors  │
│     Outputs: (findings_ap, score_ap, blast_radius_map)                  │
│                                                                          │
│ 4d. Supply Chain Engine (10% weight)                                    │
│     Checks: Container image provenance, dependency versions, SBOM       │
│     Output: (findings_sc, score_sc)                                     │
│                                                                          │
│ Execution: ThreadPoolExecutor.map() for parallel processing             │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│ STAGE 5: ENRICHMENT                                                     │
├─────────────────────────────────────────────────────────────────────────┤
│ 5a. Graph Enrichment: app.graph.enrich.enrich_graph()                  │
│     Adds: blast_radius, cve_id, known_exploit, cvss_live to nodes      │
│                                                                          │
│ 5b. Compliance Scoring: app.engines.compliance.enrich_with_compliance() │
│     Maps findings to: NIST 800-207, DPDP Act 2023, RBI requirements     │
│     Output: (findings + compliance_tags, compliance_score)              │
│                                                                          │
│ 5c. AI Opinion Generation: app.ai.opinion.generate_ai_opinion()        │
│     For each finding:                                                    │
│       - impact: SYSTEM-WIDE|HIGH|LOCAL (from blast_radius)              │
│       - likelihood: HIGH|MEDIUM (from CVE + severity)                   │
│       - priority: CRITICAL|HIGH|MEDIUM (impact × likelihood)            │
│       - reason: Plain English explanation                              │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│ STAGE 6: AUTO-FIX PATCH GENERATION                                      │
├─────────────────────────────────────────────────────────────────────────┤
│ Input:  findings, G                                                     │
│ Logic:  app.autofix.engine.generate_auto_fixes()                        │
│         For each finding, load template from templates.json             │
│         Fill {node_id} and {fix_version} placeholders                   │
│         Sort patches by score_impact (biggest wins first)               │
│ Output: patches = [                                                     │
│           {                                                              │
│             rule_id: 'zt_001',                                          │
│             affected_node: 'database_01',                               │
│             language: 'terraform',                                      │
│             template_code: 'resource "aws_rds_instance"...',            │
│             score_impact: '+15',                                        │
│             description: 'Enable encryption at rest'                    │
│           },                                                             │
│           ...                                                            │
│         ]                                                                │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│ STAGE 7: EXECUTIVE SUMMARY GENERATION                                   │
├─────────────────────────────────────────────────────────────────────────┤
│ Input:  findings, security_index, score_breakdown                       │
│ Logic:  app.ai.summarizer.executive_summary()                          │
│         Generate risk_level (CRITICAL|HIGH|MEDIUM|LOW)                 │
│         Identify primary_action and main_risk                          │
│ Output: executive_summary = {                                           │
│           security_index: 67,                                           │
│           risk_level: 'HIGH',                                           │
│           critical_count: 2,                                            │
│           high_count: 5,                                                │
│           attack_paths: 3,                                              │
│           main_risk: 'Unencrypted database in DMZ',                     │
│           primary_action: 'Enable TLS on db-01, restrict network ACLs' │
│         }                                                                │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│ STAGE 8: SCORING & PERSISTENCE                                          │
├─────────────────────────────────────────────────────────────────────────┤
│ Scoring Formula:                                                        │
│   Security Index = ZT×0.35 + (100-QVI)×0.20 + AP×0.25 + SC×0.10 + C×0.10 │
│                                                                          │
│ Weights:                                                                 │
│   - Zero Trust (35%):  NIST SP 800-207 alignment                       │
│   - Quantum (20%):     HNDL threat prevention                          │
│   - Attack Path (25%): CVSS v3.1 exploitability                        │
│   - Supply Chain (10%): SBOM verification                              │
│   - Compliance (10%):  DPDP/RBI/NIST alignment                         │
│                                                                          │
│ Severity Deductions:                                                    │
│   - CRITICAL: -15 points per finding                                   │
│   - HIGH:     -8 points per finding                                    │
│   - MEDIUM:   -3 points per finding                                    │
│   - LOW:      -1 point per finding                                     │
│                                                                          │
│ Output: Atomic DB write via update_scan_result()                       │
│         Scan status: 'pending' → 'running' → 'complete'                │
└─────────────────────────────────────────────────────────────────────────┘
```

**Fallback Imports:**
All P1/P2 imports use try/except to gracefully degrade:
```python
try:
    from app.engines.zero_trust import zero_trust_engine
except ImportError:
    zero_trust_engine = lambda G: ([], 50.0)  # Stub: no findings, neutral score
```

---

### backend/app/pipeline/scoring.py
**Purpose:** Security Index calculation with weighted scoring  

**Scoring Formula:**
```
Security Index = 
  ZT×0.35 + (100-QVI)×0.20 + AP×0.25 + SC×0.10 + C×0.10

Where:
  ZT   = Zero Trust engine score (0-100)
  QVI  = Quantum Vulnerability Index (0-100) — higher = worse
  AP   = Attack Path score (0-100)
  SC   = Supply Chain score (0-100)
  C    = Compliance score (0-100)
```

**Weight Justifications:**
- **Zero Trust (35%)**: NIST SP 800-207 framework is primary control
- **Quantum (20%)**: HNDL threat detection is critical for cryptographic hedging
- **Attack Path (25%)**: Exploitability directly impacts business risk
- **Supply Chain (10%)**: SBOM/dependency risks are secondary to direct exposure
- **Compliance (10%)**: Regulatory alignment separate from technical security

**Severity Deductions:**
```python
SEVERITY_DEDUCTIONS = {
    'CRITICAL': 15,  # -15 from index per finding
    'HIGH':      8,  # -8 from index per finding
    'MEDIUM':    3,  # -3 from index per finding
    'LOW':       1   # -1 from index per finding
}
```

**Calculation Flow:**
```python
def calculate_security_index(scores: dict, agg_qvi: float, findings: list):
    # Apply formula
    raw_index = (
        zt * 0.35 +
        (100 - min(100.0, agg_qvi)) * 0.20 +
        ap * 0.25 +
        sc * 0.10 +
        c * 0.10
    )
    
    # Clamp to 0-100
    security_index = max(0, min(100, round(raw_index)))
    
    # Build breakdown for UI
    breakdown = {
        'zero_trust': round(zt * 0.35, 1),
        'quantum': round((100 - min(100.0, agg_qvi)) * 0.20, 1),
        'attack_path': round(ap * 0.25, 1),
        'supply_chain': round(sc * 0.10, 1),
        'compliance': round(c * 0.10, 1),
        'total': security_index,
        'per_finding_deltas': {...}  # For granular tracking
    }
    
    return security_index, breakdown
```

---

### backend/app/graph/builder.py
**Purpose:** Construct NetworkX directed graph from parsed infrastructure data  

**Input Format:**
```python
data = {
    'nodes': [
        {
            'id': 'web_01',
            'name': 'Web Server',
            'type': 'container',
            'zone': 'DMZ',
            'data_sensitivity': 'HIGH',
            'encryption_type': 'AES-256-GCM',
            'retention_years': 7,
            'container_image': 'nginx:1.21.6',
            'iam_roles': ['s3:GetObject', 'secrets:GetSecret'],
            'known_exploit': False
        },
        ...
    ],
    'edges': [
        {
            'source': 'web_01',
            'target': 'api_01',
            'auth_required': True,
            'mfa_required': False,
            'tls_enforced': True,
            'access_scope': 'SCOPED',
            'protocol': 'TLS1.3',
            'trust_level': 'HIGH',
            'per_session_auth': False,
            'explicit_auth': True,
            'least_privilege': False
        },
        ...
    ]
}
```

**Graph Construction:**
```python
def build_graph(data: dict) -> nx.DiGraph:
    G = nx.DiGraph()
    
    # Add nodes with attributes
    for node in data.get('nodes', []):
        G.add_node(
            node['id'],
            name=node.get('name', id),
            type=node.get('type', 'unknown'),
            zone=node.get('zone', 'INTERNAL'),
            data_sensitivity=node.get('data_sensitivity', 'LOW'),
            encryption_type=node.get('encryption_type', 'unknown'),
            retention_years=int(node.get('retention_years', 0)),
            container_image=node.get('container_image'),
            iam_roles=node.get('iam_roles', []),
            cvss_live=0.0,              # Filled by enrich stage
            blast_radius=0.0,           # Filled by enrich stage
            cve_id=None,                # Filled by enrich stage
            known_exploit=node.get('known_exploit', False)
        )
    
    # Add edges with attributes
    for edge in data.get('edges', []):
        G.add_edge(
            edge['source'],
            edge['target'],
            auth_required=edge.get('auth_required', False),
            mfa_required=edge.get('mfa_required', False),
            tls_enforced=edge.get('tls_enforced', False),
            access_scope=edge.get('access_scope', 'SCOPED'),
            protocol=edge.get('protocol', 'unknown'),
            trust_level=edge.get('trust_level', 'LOW'),
            per_session_auth=edge.get('per_session_auth', False),
            explicit_auth=edge.get('explicit_auth', False),
            least_privilege=edge.get('least_privilege', False)
        )
    
    return G
```

**Node Attributes:**
- `name`: Human-readable identifier
- `type`: container|database|service|load_balancer|firewall
- `zone`: DMZ|INTERNAL|EXTERNAL|PRIVATE
- `data_sensitivity`: LOW|MEDIUM|HIGH|CRITICAL
- `encryption_type`: None|AES-256-GCM|RSA-2048|...
- `retention_years`: Data retention policy (years)
- `container_image`: Docker image URI (if container)
- `iam_roles`: List of IAM permissions
- `cvss_live`: CVSS score from NVD (filled later)
- `blast_radius`: Count of downstream nodes at risk
- `cve_id`: Vulnerability identifier (if known)
- `known_exploit`: Boolean, public exploit available

**Edge Attributes:**
- `auth_required`: Boolean, authentication enforced
- `mfa_required`: Boolean, multi-factor authentication required
- `tls_enforced`: Boolean, encrypted channel
- `access_scope`: SCOPED|UNSCOPED (least-privilege principle)
- `protocol`: TLS1.3|TLS1.2|HTTP|SSH|...
- `trust_level`: LOW|MEDIUM|HIGH (implicit trust evaluation)
- `per_session_auth`: Boolean, re-auth per interaction
- `explicit_auth`: Boolean, no default-allow
- `least_privilege`: Boolean, minimum necessary permissions

---

### backend/app/graph/enrich.py
**Purpose:** Add computed attributes to graph (blast radius, CVSS scores, CVE data)  

**Enrichment Operations:**
1. **Blast Radius Calculation**: BFS from each node → count reachable nodes
   - Node with 15+ reachable nodes = SYSTEM-WIDE impact
   - Node with 5-14 reachable nodes = HIGH impact
   - Node with <5 reachable nodes = LOCAL impact

2. **CVE Lookups**: Query NVD snapshot for known vulnerabilities
   - Match by container_image version
   - Set node.cve_id, node.cvss_live, node.known_exploit

3. **Implicit Trust Detection**: Traverse graph for default-allow edges
   - Edge with trust_level='LOW' + no auth = FINDING

**Output:** Same DiGraph with enriched attributes

---

### backend/app/confidence/model.py
**Purpose:** Trust model for input evidence sources  

**Evidence Confidence Scores:**
```python
EVIDENCE_CONFIDENCE = {
    'terraform':  0.95,    # Code-generated → high trust
    'aws_config': 0.90,    # API-verified from AWS
    'k8s':        0.85,    # From K8s API
    'nmap':       0.80,    # Network-verified
    'json':       0.60,    # User-written blueprint
    'yaml':       0.60,    # User-written blueprint
    'manual':     0.30,    # Self-reported in web form
    'none':       0.10     # No evidence
}
```

**Confidence-Based Downgrading:**
If confidence < 0.70 (low-confidence source), flip all positive security claims to False:

```python
SECURITY_POSITIVE_CLAIMS = [
    'auth_required',
    'mfa_required',
    'tls_enforced',
    'per_session_auth',
    'explicit_auth',
    'least_privilege',
]
```

**Example:**
```
User uploads manual JSON with:
  edge: {
    "source": "client",
    "target": "api",
    "auth_required": true,
    "mfa_required": true,
    "tls_enforced": true
  }

Confidence Resolver with evidence_source='manual':
  - Score: 0.30 (low confidence)
  - Action: Flip all positive claims to false
  - Result edge: {
    "auth_required": false,
    "mfa_required": false,
    "tls_enforced": false
  }

Demo moment:
  "You claimed your infrastructure is secure. We don't trust that.
   Confidence: 0.30 (manual entry). We found you have CRITICAL
   vulnerabilities that you didn't notice."
```

**Integration:** Used at Stage 2 of pipeline to resolve input quality

---

### backend/app/engines/zero_trust.py
**Purpose:** NIST SP 800-207 Zero Trust framework evaluation  

**Architecture:**
```python
def zero_trust_engine(G: nx.DiGraph) -> Tuple[List[Dict], float]:
    """
    Single-line wrapper: delegates all logic to rules.evaluate_rules()
    Design principle: This function NEVER changes. To add rules, edit rules.py only.
    """
    return evaluate_rules(G, RULE_REGISTRY)
```

**Rule Registry Location:** `app/engines/rules.py` (contains all ZT rules)  
**Call Site:** Stage 4a of pipeline/runner.py

**Key Rules (from RULE_REGISTRY):**
- `zt_001`: Detect implicit trust (edges with trust_level='LOW')
- `zt_002`: MFA required but missing
- `zt_003`: Unencrypted channels (tls_enforced=false)
- `zt_004`: Over-privileged service accounts
- `zt_005`: Cross-zone access without MFA
- etc.

**Output:**
```python
(
    findings=[
        {
            'rule_id': 'zt_001',
            'title': 'Implicit Trust Detected',
            'severity': 'HIGH',
            'cvss': 7.5,
            'affected_nodes': ['web_01', 'db_01'],
            'description': 'Edge client→api has trust_level=LOW without auth_required',
            'remediation': 'Set auth_required=true and add MFA',
            'engine': 'zero_trust'
        },
        ...
    ],
    zt_score=62.5  # 0-100 score
)
```

---

### backend/app/engines/quantum.py
**Purpose:** Quantum threat detection (HNDL attacks, post-quantum gap analysis)  

**Key Detections:**
- **HNDL Attacks**: Harvest-Now-Decrypt-Later → identify long-term sensitive data on unencrypted channels
- **Post-Quantum Gaps**: RSA-2048 or smaller keys without migration plan
- **Cryptographic Agility**: Can the system swap algorithms without redeployment?
- **Key Rotation**: Policies for key lifecycle management

**Output Format:** Same as zero_trust_engine (findings, score)

---

### backend/app/engines/attack_path.py
**Purpose:** Graph traversal to identify attack vectors and blast radius  

**Algorithm:**
1. Identify external entry points (nodes with no inbound edges or public exposure)
2. BFS/DFS to find paths to high-value targets (databases, API gateways)
3. For each path, calculate:
   - Hop count (attack distance)
   - Required compromises (how many nodes must be breached)
   - Blast radius (nodes at risk if this node compromised)
4. Generate findings for high-risk paths

**Output:**
```python
findings=[
    {
        'rule_id': 'ap_001',
        'title': 'Critical Attack Path',
        'severity': 'CRITICAL',
        'path': ['internet', 'web_01', 'api_01', 'database'],
        'hop_count': 3,
        'blast_radius': 8,  # If web_01 compromised, 8 nodes at risk
        'affected_nodes': ['web_01', 'api_01', 'database'],
        'description': 'Direct network path from internet to database with 3 hops, no MFA'
    },
    ...
],
ap_score=45.0  # 0-100 score
```

---

### backend/app/engines/supply_chain.py
**Purpose:** Software composition and dependency security analysis  

**Checks:**
- Container image provenance (signed images vs. unsigned)
- Dependency version analysis (known vulnerable versions)
- SBOM (Software Bill of Materials) verification
- License compliance (copyleft licenses, GPL violations)
- Build reproducibility (deterministic builds)

**Output:** findings + score

---

### backend/app/engines/compliance.py
**Purpose:** Map infrastructure to regulatory requirements  

**Compliance Frameworks:**
- NIST SP 800-207 (Zero Trust)
- DPDP Act 2023 (India data protection)
- RBI Master Direction (India banking regulation)
- NIST 800-53 (General security controls)

**Operation:**
```python
def enrich_with_compliance(findings: list) -> Tuple[list, float]:
    """
    For each finding, map to compliance control:
    - Finding: "Unencrypted database"
    - Maps to: DPDP Act 2023 §5(c) (data protection measures)
    - Maps to: NIST 800-207 CA-2 (configuration assessment)
    
    Returns enriched findings + compliance_score
    """
```

---

### backend/app/ai/opinion.py
**Purpose:** Deterministic reasoning layer (no LLM) for findings  

**Core Functions:**

#### estimate_impact(finding, G) → str
**Logic:**
```python
max_blast_radius = max(G.nodes[n]['blast_radius'] for n in affected_nodes)
if max_blast_radius > 40:    return 'SYSTEM-WIDE'
elif max_blast_radius > 15:  return 'HIGH'
else:                        return 'LOCAL'
```

#### estimate_likelihood(finding, confidence) → str
**Logic:**
- If confidence < 0.5: return 'UNCERTAIN (low-confidence input)'
- If CVE with public exploit: return 'HIGH (CVE with exploit)'
- If CRITICAL severity: return 'HIGH (critical misconfiguration)'
- Default: return 'MEDIUM'

#### calculate_priority(impact, likelihood) → str
**Scoring:**
```python
impact_weight = {'SYSTEM-WIDE': 3, 'HIGH': 2, 'LOCAL': 1}
likelihood_weight = {'HIGH': 3, 'MEDIUM': 2, 'UNCERTAIN': 2, 'LOW': 1}

score = impact_weight × likelihood_weight
if score >= 6:     return 'CRITICAL'
elif score >= 3:   return 'HIGH'
else:              return 'MEDIUM'
```

#### generate_ai_opinion(findings, G, confidence) → list
**Output:**
```python
for finding in findings:
    finding['ai_opinion'] = {
        'impact':      'SYSTEM-WIDE',       # From blast_radius
        'likelihood':  'HIGH',              # From CVE + severity
        'priority':    'CRITICAL',          # impact × likelihood
        'reason':      '''This database node (db_01) stores customer PII.
                         Blast radius = 8 downstream services depend on it.
                         Unencrypted network path creates intercept risk.
                         CVSS 8.9, CVE-2024-1234 has public exploit.'''
    }
```

---

### backend/app/ai/summarizer.py
**Purpose:** Executive summary generation for CISO-level decision making  

**Input:**
- findings: List of all security findings
- security_index: 0-100 aggregate score
- score_breakdown: {zero_trust, quantum, attack_path, supply_chain, compliance}

**Output:**
```python
executive_summary = {
    'security_index': 67,
    'risk_level': 'HIGH',                    # CRITICAL|HIGH|MEDIUM|LOW
    'critical_count': 2,                     # Number of CRITICAL findings
    'high_count': 5,                         # Number of HIGH findings
    'attack_paths': 3,                       # Number of critical paths
    'main_risk': 'Unencrypted database in DMZ accessible from internet',
    'primary_action': 'Implement TLS 1.3 on db-01, restrict network ACLs to API tier only',
    'compliance_gaps': 3,                    # DPDP Act 2023, NIST 800-207
    'estimated_fix_time': '4 hours',
    'estimated_score_improvement': '+25'
}
```

---

### backend/app/autofix/engine.py
**Purpose:** Generate expert-verified remediation patches  

**Patch Template System:**
Templates stored in `autofix/templates.json`:
```json
{
    "zt_001": {
        "title": "Enable Authentication",
        "description": "Add auth_required to edge",
        "language": "terraform",
        "template_code": "auth_required = true",
        "affected_service": "network_policy",
        "score_impact": "+8",
        "estimated_effort": "15 minutes",
        "risk_if_not_applied": "HIGH"
    },
    "db_encryption": {
        "title": "Enable RDS Encryption",
        "description": "Enable encryption at rest for RDS instance",
        "language": "terraform",
        "template_code": "resource \"aws_db_instance\" \"{node_id}\" { storage_encrypted = true }",
        "score_impact": "+15",
        "estimated_effort": "1 hour"
    },
    ...
}
```

**Patch Generation Algorithm:**
```python
def generate_auto_fixes(findings: list, G=None) -> list:
    patches = []
    seen = set()  # Avoid duplicates
    
    # Sort findings by CVSS descending (critical first)
    for finding in sorted(findings, key=lambda x: -x['cvss']):
        rule_id = finding['rule_id']
        
        # Check if template exists
        if rule_id not in templates:
            continue
        
        affected_nodes = finding['affected_nodes']
        node_id = affected_nodes[0]
        
        # Avoid duplicate patches for same (rule, node) pair
        if (rule_id, node_id) in seen:
            continue
        seen.add((rule_id, node_id))
        
        # Create patch from template
        patch = deepcopy(templates[rule_id])
        patch = _fill_placeholders(patch, node_id, finding.get('fix_version', 'latest'))
        patch['affected_node'] = node_id
        patch['rule_id'] = rule_id
        patch['severity'] = finding['severity']
        
        patches.append(patch)
    
    # Sort by score_impact descending (biggest wins first)
    patches.sort(key=lambda p: int(str(p['score_impact']).strip('+').replace('+', '')), reverse=True)
    
    return patches
```

**Output Example:**
```python
[
    {
        'rule_id': 'db_encryption',
        'affected_node': 'db_01',
        'title': 'Enable RDS Encryption',
        'language': 'terraform',
        'template_code': 'resource "aws_db_instance" "db_01" { storage_encrypted = true }',
        'score_impact': '+15',
        'severity': 'CRITICAL',
        'estimated_effort': '1 hour'
    },
    {
        'rule_id': 'zt_001',
        'affected_node': 'web_01',
        'title': 'Enable Authentication',
        'language': 'terraform',
        'template_code': 'auth_required = true',
        'score_impact': '+8',
        'severity': 'HIGH',
        'estimated_effort': '15 minutes'
    }
]
```

---

### backend/app/parsers/ (json_parser.py, yaml_parser.py, tf_parser.py)
**Purpose:** Convert various infrastructure formats to normalized graph format  

**Output Normalization (all parsers):**
```python
{
    'nodes': [
        {'id': '...', 'name': '...', 'type': '...', 'zone': '...', ...},
        ...
    ],
    'edges': [
        {'source': '...', 'target': '...', 'auth_required': bool, ...},
        ...
    ],
    'evidence_source': 'json'|'yaml'|'terraform'
}
```

**json_parser.py:** Direct parsing of JSON schemas matching the above format

**yaml_parser.py:** Parse YAML infrastructure definitions, convert to normalized format

**tf_parser.py:** Parse Terraform .tf files, extract resource dependencies, convert to graph

---

### backend/app/report/ (pdf_builder.py, signer.py, blockchain.py)
**Purpose:** Generate signed reports and optional blockchain verification  

**PDF Generation:**
```python
def build_pdf(scan: dict, executive_summary: dict) -> bytes:
    """
    Generates professional PDF report with:
    - Executive Summary (CISO-facing)
    - Security Index visualization
    - Risk heatmap
    - Detailed findings with remediation
    - Auto-fix patches
    - Compliance mapping
    """
```

**RSA Signing:**
```python
def sign_pdf(pdf_bytes: bytes, private_key_pem: str) -> dict:
    """
    RSA-2048 sign PDF (SHA256 hash)
    Returns:
        {
            'pdf_base64': base64(pdf_bytes),
            'sha256': sha256(pdf_bytes),
            'rsa_signature': base64(rsa_signature),
            'public_key_pem': public_key
        }
    """
```

**Blockchain Storage (optional):**
```python
def store_on_polygon(pdf_hash: str, rsa_signature: str) -> str:
    """
    Posts to Polygon Mumbai testnet (if BLOCKCHAIN_MODE='polygon')
    Returns transaction hash for audit trail
    """
```

---

### backend/app/advisory/ (tier1.py, tier2.py)
**Purpose:** Regulatory advisory engine  

**Tier 1: Framework Matching**
```python
def tier1_advise(findings: list) -> dict:
    """
    For each finding, return applicable regulatory framework:
    - DPDP Act 2023 (India data protection)
    - NIST 800-207 (Zero Trust)
    - RBI Master Direction (banking)
    """
```

**Tier 2: Semantic Search**
```python
def tier2_advise(findings: list) -> dict:
    """
    FTS5 search on docs_fts table for regulatory guidance
    Example:
      Finding: "database@encryption_missing"
      Search: "encryption database requirements"
      Result: "DPDP Act 2023 §5(c): Organizations must implement data
               protection measures including encryption. RBI Direction
               specifies AES-256 or equivalent for payments infrastructure."
    """
```

---

## API ROUTING & ENDPOINTS

### Authentication Endpoints

**POST /api/v1/auth/login** — User login
```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@demo.com","password":"Admin@1234"}'
```
Response (HTTP 200):
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "expires_in": 86400,
  "org_id": "demoorg001",
  "role": "admin"
}
```

### Scan Endpoints

**POST /api/v1/validate** — Start infrastructure scan
```bash
curl -X POST http://localhost:8000/api/v1/validate \
  -H "Authorization: Bearer <token>" \
  -F "file=@infrastructure.json" \
  -F "name=Production Network" \
  -F "evidence_source=json"
```
Response (HTTP 202):
```json
{
  "scan_id": "a7f3e2c1d4b9e8f0...",
  "status": "pending",
  "message": "Scan queued. Poll /scans/{id}/status for updates."
}
```

**GET /api/v1/scans/{scan_id}/status** — Poll scan progress
```bash
curl -X GET http://localhost:8000/api/v1/scans/a7f3e2c1d4b9e8f0/status \
  -H "Authorization: Bearer <token>"
```
Response (HTTP 200):
```json
{
  "scan_id": "a7f3e2c1d4b9e8f0",
  "status": "running",
  "progress_percent": 65,
  "stage": 5,
  "engine_status": {
    "zt": "complete",
    "quantum": "complete",
    "ap": "running",
    "sc": "pending"
  }
}
```

**GET /api/v1/scans/{scan_id}/report** — Get detailed findings
```bash
curl -X GET http://localhost:8000/api/v1/scans/a7f3e2c1d4b9e8f0/report \
  -H "Authorization: Bearer <token>"
```
Response (HTTP 200):
```json
{
  "scan_id": "a7f3e2c1d4b9e8f0",
  "status": "complete",
  "security_index": 67,
  "risk_summary": {
    "CRITICAL": 2,
    "HIGH": 5,
    "MEDIUM": 8,
    "LOW": 3
  },
  "findings": [...],
  "auto_fix_patches": [...],
  "executive_summary": {...}
}
```

---

## CONFIGURATION MANAGEMENT

### Environment Variables (Applied via config.py)

| Variable | Purpose | Default | Example |
|----------|---------|---------|---------|
| `SQLITE_PATH` | Database file location | `backend/app/data/quantum_ares.db` | `/var/lib/ares/db.sqlite` |
| `SECRET_KEY` | JWT signing key | `dev-secret-key...` | Rotate in production! |
| `ALLOWED_ORIGINS` | CORS allowlist | `http://localhost:5173,http://localhost:80` | `https://prod.example.com` |
| `BLOCKCHAIN_MODE` | Report signing mode | `rsa` | `polygon` (use testnet) |
| `TOKEN_EXPIRE_HOURS` | JWT lifetime | `24` | `8` (for CISOs) |

### Docker Environment (docker-compose.yml)
```yaml
services:
  backend:
    environment:
      - SQLITE_PATH=/app/data/quantum_ares.db
      - SECRET_KEY=${SECRET_KEY}  # Read from .env file
      - ALLOWED_ORIGINS=http://localhost:80
  
  frontend:
    ports:
      - "80:80"
    depends_on:
      - backend
```

### Production Deployment

**Render.com Configuration:**
```
Environment Variables:
  - SECRET_KEY: Use Render Secrets for sensitive values
  - ALLOWED_ORIGINS: https://yourdomain.com
  - BLOCKCHAIN_MODE: polygon (for blockchain verification)
  - SQLITE_PATH: /var/data/quantum_ares.db (persistent volume)
```

---

## DATABASE SCHEMA & INTEGRATION

### Data Model Relationships

```
orgs (1) ──────────────────────── (many) users
  ├─ Multiple users per org
  └─ Org auto-deleted with CASCADE → deletes all users

orgs (1) ──────────────────────── (many) scans
  ├─ Each scan belongs to one org
  └─ Org auto-deleted → cascade deletes all scans

scans (1) ──────────────────────── (1) reports
  ├─ One PDF report per scan
  └─ Scan deletion cascades to reports
```

### JSON Storage Strategy

All dynamic pipeline outputs stored as JSON columns, allowing:
- **Schema-free storage**: No new tables needed when adding findings types
- **Flexible evolution**: Can change finding structure without migrations
- **Atomicity**: All results written in one UPDATE (no partial writes)

**JSON Columns:**
```sql
scans.graph_json          -- Full infrastructure topology
scans.score_breakdown     -- {zero_trust, quantum, attack_path, ...}
scans.risk_summary        -- {CRITICAL, HIGH, MEDIUM, LOW} counts
scans.findings            -- Array of finding objects
scans.ai_opinions         -- AI reasoning per finding
scans.executive_summary   -- CISO summary
scans.auto_fix_patches    -- Remediation templates
scans.confidence_warnings -- Input quality warnings
scans.engine_status       -- Status of each analysis engine
```

### Indexing Strategy

```sql
CREATE INDEX idx_scans_org_id   ON scans(org_id);   -- Fast org isolation
CREATE INDEX idx_scans_status   ON scans(status);   -- Fast status filtering
CREATE INDEX idx_scans_score    ON scans(security_index DESC);  -- Leaderboard queries
CREATE INDEX idx_scans_created  ON scans(created_at DESC);       -- Chronological listing
```

### Query Patterns

**1. Get latest scan for organization:**
```python
get_scan(scan_id, org_id)  # O(log n) via idx_scans_org_id
```

**2. List all pending scans:**
```python
conn.execute(
    'SELECT * FROM scans WHERE org_id=? AND status=? ORDER BY created_at DESC',
    (org_id, 'pending')
)
# Uses: idx_scans_org_id, idx_scans_status
```

**3. Get highest-risk scans (leaderboard):**
```python
conn.execute(
    'SELECT * FROM scans WHERE org_id=? ORDER BY security_index ASC LIMIT 10',
    (org_id,)
)
# Uses: idx_scans_score
```

---

## SECURITY & AUTHENTICATION FLOW

### User Authentication

**Login Flow:**
```
1. User submits email + password to POST /api/v1/auth/login
2. Backend queries: SELECT password_hash FROM users WHERE email=?
3. Argon2id verify(stored_hash, provided_password)
   - Timing-safe comparison (resistant to timing attacks)
   - Returns True/False
4. On success: Generate JWT with org_id embedded
   payload = {sub: user_id, org_id, role, exp: now+24h}
   token = jwt.encode(payload, SECRET_KEY, algorithm='HS256')
5. Return access_token to client
```

**Token Format:**
```
Header: {"alg": "HS256", "typ": "JWT"}
Payload: {
  "sub": "user_uuid",
  "org_id": "org_uuid",
  "role": "admin",
  "exp": 1704067200
}
Signature: HMAC-SHA256(header.payload, SECRET_KEY)
```

**Client Usage:**
```bash
Authorization: Bearer eyJhbGc...
```

### Protected Route Authorization

**Every protected endpoint injects get_current_org dependency:**
```python
@router.get('/scans/{scan_id}/status')
def scan_status(scan_id: str, auth=Depends(get_current_org)):
    # auth = {'user_id': '...', 'org_id': '...', 'role': '...'}
    scan = get_scan(scan_id, auth['org_id'])  # ← org_id boundary enforced
```

**Multi-Tenant Isolation:**
- Every query filters by `org_id` from JWT
- Even if user guesses another org's scan_id, DB query returns None
- Prevents cross-org data leakage

### Password Security

**Argon2id Hashing:**
```
✓ Memory-hard (65 MB)
✓ Time-hard (3 iterations)
✓ Resistant to GPU/ASIC attacks
✓ Timing-safe comparison
✗ Do NOT store plaintext passwords
```

**Initial Credentials:**
- Auto-seeded on fresh DB: admin@demo.com / Admin@1234
- Must be changed immediately in production
- Rotate SECRET_KEY before production deployment

---

## DATA FLOW DIAGRAMS

### End-to-End Scan Flow

```
Frontend (React)
    ↓
[1] POST /validate (multipart/form-data)
    ├─ file: infrastructure.json
    ├─ name: "Production"
    └─ evidence_source: "json"
    ↓
Backend (FastAPI)
    ├─ Validate evidence_source enum
    ├─ Create scan record (status='pending')
    ├─ Queue BackgroundTask(run_pipeline, scan_id, org_id)
    └─ Return HTTP 202: {"scan_id": "..."}
    ↓
Frontend (ScanPoller.tsx)
    ├─ Poll GET /scans/{scan_id}/status every 2 seconds
    ├─ Display progress: "Processing stage 4/8..."
    └─ Repeat until status='complete' or 'failed'
    ↓
Background Task (run_pipeline)
    ├─ STAGE 1: Parse input (JSON → graph format)
    ├─ STAGE 2: Resolve confidence (downgrade claims if manual)
    ├─ STAGE 3: Build NetworkX DiGraph
    ├─ STAGE 4: Run threat engines in parallel
    │           ├─ Zero Trust Engine
    │           ├─ Quantum Engine
    │           ├─ Attack Path Engine
    │           └─ Supply Chain Engine
    ├─ STAGE 5: Enrich graph + generate AI opinions
    ├─ STAGE 6: Generate auto-fix patches
    ├─ STAGE 7: Create executive summary
    ├─ STAGE 8: Calculate security index + save to DB
    └─ Update scan (status='complete', all findings stored)
    ↓
Frontend (ReportView.tsx)
    ├─ GET /scans/{scan_id}/report
    ├─ Display security index, findings, patches
    └─ Option: Download signed PDF report
```

### Pipeline Stage Details

```
run_pipeline(scan_id, org_id)
│
├─ update_scan_running(scan_id)  # Mark as 'running'
│
├─ STAGE 1: INPUT PARSING
│  ├─ input = get_scan(scan_id, org_id)['input_raw']
│  ├─ data = parse_input(input, filename)  # JSON/YAML/TF/AWS/K8s
│  └─ result['graph_json'] = data
│
├─ STAGE 2: CONFIDENCE RESOLUTION
│  ├─ resolver = ConfidenceResolver(evidence_source)
│  ├─ resolved_data = resolver.resolve(data)
│  ├─ result['confidence_warnings'] = resolver.warnings
│  └─ result['confidence_score'] = resolver.confidence
│
├─ STAGE 3: GRAPH BUILDING
│  ├─ G = build_graph(resolved_data)
│  └─ result['graph_json']['nodes'] = G.nodes, G.edges
│
├─ STAGE 4: THREAT ENGINES (Parallel with ThreadPoolExecutor)
│  ├─ (findings_zt, score_zt) = zero_trust_engine(G)
│  ├─ (findings_quantum, score_quantum) = quantum_engine(G)
│  ├─ (findings_ap, score_ap, blast_map) = attack_path_engine(G)
│  ├─ (findings_sc, score_sc) = supply_chain_engine(G)
│  ├─ all_findings = [findings_zt + findings_quantum + ...]
│  ├─ scores = {zt: score_zt, quantum: score_quantum, ...}
│  └─ result['engine_status'] = {zt: 'ok', quantum: 'ok', ...}
│
├─ STAGE 5: ENRICHMENT
│  ├─ G = enrich_graph(G, blast_map)  # Add blast_radius, CVSS
│  ├─ all_findings = enrich_with_compliance(all_findings)
│  ├─ all_findings = generate_ai_opinion(all_findings, G, confidence)
│  └─ result['findings'] = all_findings
│
├─ STAGE 6: AUTO-FIX GENERATION
│  ├─ patches = generate_auto_fixes(all_findings, G)
│  ├─ patches.sort(by score_impact descending)
│  └─ result['auto_fix_patches'] = patches
│
├─ STAGE 7: EXECUTIVE SUMMARY
│  ├─ summary = executive_summary(all_findings, security_index, scores)
│  └─ result['executive_summary'] = summary
│
├─ STAGE 8: SCORING & PERSISTENCE
│  ├─ security_index, breakdown = calculate_security_index(scores, qvi, findings)
│  ├─ risk_summary = {CRITICAL: count, HIGH: count, ...}
│  ├─ result['security_index'] = security_index
│  ├─ result['score_breakdown'] = breakdown
│  ├─ result['risk_summary'] = risk_summary
│  ├─ update_scan_result(scan_id, result)  # ATOMIC: all-or-nothing
│  └─ scan status: 'running' → 'complete'
│
└─ Exception handling:
   └─ update_scan_failed(scan_id)  # Mark as 'failed'
```

---

## COMPONENT INTEGRATION POINTS

### How Components Work Together

**Scenario: "User uploads infrastructure and generates report"**

```python
# 1. Authentication
auth.login('admin@demo.com', 'password')
→ Returns JWT with org_id embedded

# 2. File Upload & Scan Creation
routes.validate(
    file=BytesIO(b'{"nodes":[...], "edges":[...]}'),
    evidence_source='json',
    auth={'org_id': 'demoorg001'}
)
→ db.queries.create_scan('demoorg001', 'unnamed', raw_text, 'json')
→ BackgroundTask: runner.run_pipeline(scan_id, 'demoorg001')
→ Returns HTTP 202 with scan_id

# 3. Pipeline Execution (in background)
run_pipeline(scan_id, 'demoorg001'):
    
    # Get scan details
    scan = get_scan(scan_id, 'demoorg001')
    
    # Stage 1: Parse
    data = parsers.parse_input(scan['input_raw'])  ← calls json_parser
    
    # Stage 2: Confidence
    resolver = ConfidenceResolver(scan['evidence_source'])
    resolved_data = resolver.resolve(data)
    
    # Stage 3: Graph
    G = graph.builder.build_graph(resolved_data)
    
    # Stage 4: Engines
    (findings_zt, score_zt) = engines.zero_trust.zero_trust_engine(G)
    (findings_quantum, score_quantum) = engines.quantum.quantum_engine(G)
    (findings_ap, score_ap) = engines.attack_path.attack_path_engine(G)
    (findings_sc, score_sc) = engines.supply_chain.supply_chain_engine(G)
    
    all_findings = [findings_zt + findings_quantum + findings_ap + findings_sc]
    
    # Stage 5: Enrichment
    G = graph.enrich.enrich_graph(G)  ← adds blast_radius, CVSS
    all_findings = engines.compliance.enrich_with_compliance(all_findings)
    all_findings = ai.opinion.generate_ai_opinion(all_findings, G, confidence)
    
    # Stage 6: Patches
    patches = autofix.engine.generate_auto_fixes(all_findings, G)
    
    # Stage 7: Summary
    summary = ai.summarizer.executive_summary(all_findings, index, breakdown)
    
    # Stage 8: Save results
    result = {
        'graph_json': G structure,
        'security_index': 67,
        'findings': all_findings,
        'auto_fix_patches': patches,
        'executive_summary': summary,
        ...
    }
    db.queries.update_scan_result(scan_id, result)  ← ATOMIC write

# 4. Retrieve Results
routes.scan_status(scan_id, auth={'org_id': 'demoorg001'})
→ db.queries.get_scan(scan_id, 'demoorg001')
→ Returns: {status: 'complete', security_index: 67, ...}

# 5. Generate Report
routes.get_report(scan_id, auth={'org_id': 'demoorg001'})
→ db.queries.get_scan(scan_id, 'demoorg001')
→ report.pdf_builder.build_pdf(scan, executive_summary)
→ report.signer.sign_pdf(pdf_bytes, private_key)
→ (optional) report.blockchain.store_on_polygon(pdf_hash)
→ Returns: PDF with RSA signature + blockchain proof
```

### Module Dependencies

```
main.py
├─ FastAPI app initialization
├─ Imports: config, database, api.routes, api.auth
└─ Mounts: auth_router, main_router

api/routes.py
├─ POST /validate → db.queries.create_scan() + bg.add_task(pipeline.runner.run_pipeline)
├─ GET /scans/{id}/status → db.queries.get_scan()
└─ Depends: api.auth.get_current_org

api/auth.py
├─ POST /auth/login → validates from users table
└─ get_current_org() → JWT validation for Depends()

db/database.py
├─ get_db() → SQLite connection manager
├─ init_schema() → runs schema.sql
└─ build_fts5_index() → populates docs_fts table

db/queries.py
├─ CRUD operations on scans/orgs/users tables
├─ JSON serialization/deserialization
└─ Org_id isolation enforcement

pipeline/runner.py (8-stage orchestrator)
├─ Imports: parsers, engines, graph, ai, autofix, confidence, db.queries
├─ Calls each stage in sequence
└─ Atomic final write via db.queries.update_scan_result()

parsers/*.py
├─ parse_input() → converts JSON/YAML/TF to graph format

graph/builder.py
├─ build_graph() → creates NetworkX DiGraph

graph/enrich.py
├─ enrich_graph() → adds computed attributes

engines/zero_trust.py
├─ zero_trust_engine() → calls engines.rules

engines/rules.py
├─ evaluate_rules() → all ZT rule implementations

engines/quantum.py, attack_path.py, supply_chain.py, compliance.py
├─ Individual threat engines

ai/opinion.py
├─ generate_ai_opinion() → attaches reasoning to findings

ai/summarizer.py
├─ executive_summary() → CISO-level summary

autofix/engine.py
├─ generate_auto_fixes() → reads autofix/templates.json

confidence/model.py
├─ ConfidenceResolver → evaluates input trustworthiness

advisory/tier1.py, tier2.py
├─ Regulatory framework mapping + FTS5 semantic search
```

### Data Flow Through Components

```
User Input File (infrastructure.json)
    ↓ [routes.validate]
    ↓ Store as input_raw in DB
    ↓ Queue pipeline task
    ↓
    ├─ [parsers.json_parser] → normalized graph format
    ├─ [confidence.ConfidenceResolver] → verify trust level
    ├─ [graph.builder] → NetworkX DiGraph
    ├─ [engines.*] (parallel) → threats + scores
    ├─ [graph.enrich] → blast_radius calculation
    ├─ [engines.compliance] → regulatory mapping
    ├─ [ai.opinion] → reasoning layer
    ├─ [autofix.engine] → remediation patches
    ├─ [ai.summarizer] → CISO summary
    ├─ [pipeline.scoring] → security index calculation
    ↓ [db.queries.update_scan_result]
    ↓
Database (scans table)
    ├─ graph_json
    ├─ findings
    ├─ auto_fix_patches
    ├─ executive_summary
    ├─ security_index
    └─ All metadata
    ↓ [report.pdf_builder]
    ↓
PDF Report
    ├─ [report.signer] → RSA-2048 signature
    ├─ (optional) [report.blockchain] → Polygon proof
    ↓
Signed PDF with proof of integrity
```

---

## PRODUCTION DEPLOYMENT CHECKLIST

- [ ] Change SQLITE_PATH to production database location
- [ ] Generate new SECRET_KEY (cryptographically random, 256-bit minimum)
- [ ] Set ALLOWED_ORIGINS to production domain
- [ ] Configure DATABASE_URL for PostgreSQL (if scaling beyond SQLite)
- [ ] Set up HTTPS/TLS certificates
- [ ] Configure backup strategy for database
- [ ] Set BLOCKCHAIN_MODE='polygon' for blockchain verification
- [ ] Remove auto-seeding of demo org
- [ ] Enable rate limiting on /validate endpoint
- [ ] Configure logging aggregation (CloudWatch, DataDog)
- [ ] Set up monitoring for pipeline execution times
- [ ] Enable audit logging for policy changes

---

## CONCLUSION

**QUANTUM-ARES** is a sophisticated, multi-tenant infrastructure security validation platform designed for:
- **Rapid deployment**: 8-stage pipeline processes infrastructure in seconds
- **Regulatory compliance**: Maps to NIST, DPDP Act, RBI requirements
- **Actionable insights**: AI-driven reasoning layer + expert-verified patches
- **Enterprise scalability**: Multi-tenant architecture with JWT isolation
- **Quantum readiness**: Detects HNDL attacks and post-quantum gaps

Each component is designed to integrate seamlessly with the database and other services, using centralized authentication, org_id isolation, and atomic database writes for consistency.

---

**Document Version:** 1.0  
**Last Updated:** March 22, 2026  
**Maintainer:** QUANTUM-ARES Development Team
