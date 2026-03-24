# QUANTUM-ARES: Component Integration & File Structure Guide

## 📊 Component Interaction Matrix

### Cross-Component Dependencies

```
┌──────────────────────────────────────────────────────────────────────────┐
│                          COMPONENT INTERACTION MATRIX                    │
├──────────────────────────────────────────────────────────────────────────┤
│
│ main.py (FastAPI App)
│ ├─ Imports: config, database.{get_db, init_schema, build_fts5_index}
│ ├─ Imports: api.{routes, auth}
│ ├─ Creates: CORS middleware (config.ALLOWED_ORIGINS)
│ └─ Hooks: lifespan → database initialization
│
│ config.py (Settings)
│ ├─ Used by: main, auth, database
│ ├─ Provides: SECRET_KEY, ALLOWED_ORIGINS, SQLITE_PATH, ALGORITHM, etc.
│ └─ Loaded from: Environment variables
│
│ api/auth.py (Authentication)
│ ├─ POST /auth/login → queries users table, generates JWT
│ ├─ get_current_org() → dependency injection on protected routes
│ ├─ Uses: config.{SECRET_KEY, ALGORITHM, TOKEN_EXPIRE_HOURS}
│ └─ Verifies: Argon2id password hashes
│
│ api/routes.py (HTTP Endpoints)
│ ├─ POST /validate
│ │  ├─ Calls: db.queries.create_scan()
│ │  ├─ Queues: pipeline.runner.run_pipeline()
│ │  └─ Depends: get_current_org()
│ ├─ GET /scans/{id}/status
│ │  ├─ Calls: db.queries.get_scan()
│ │  └─ Depends: get_current_org()
│ └─ GET /scans/{id}/report
│    └─ Calls: db.queries.get_scan()
│
│ db/database.py (Connection Manager)
│ ├─ get_db() → returns sqlite3.Connection
│ ├─ init_schema() → executes db/schema.sql
│ ├─ build_fts5_index() → populates docs_fts table
│ └─ Configuration: Uses config.SQLITE_PATH
│
│ db/schema.sql (Database Schema)
│ ├─ Defines: orgs, users, scans, reports, docs_fts tables
│ ├─ Constraints: Foreign keys, enums, CHECK clauses
│ └─ Indexes: org_id, status, security_index, created_at
│
│ db/queries.py (CRUD Operations)
│ ├─ get_db() → opens connections, automatically closes
│ ├─ create_scan() → INSERT into scans table
│ ├─ update_scan_running() → UPDATE status='running'
│ ├─ update_scan_result() → ATOMIC UPDATE all findings (Stage 8)
│ ├─ update_scan_failed() → UPDATE status='failed'
│ ├─ get_scan() → SELECT with org_id isolation
│ ├─ list_scans() → SELECT all for org
│ └─ JSON serialization: Automatic on write/read
│
│ pipeline/runner.py (8-Stage Orchestrator)
│ ├─ Entry: run_pipeline(scan_id, org_id)
│ ├─ Stage 1: parsers.parse_input() → normalized graph
│ ├─ Stage 2: confidence.ConfidenceResolver.resolve() → trust eval
│ ├─ Stage 3: graph.builder.build_graph() → NetworkX DiGraph
│ ├─ Stage 4: engines.{zero_trust, quantum, attack_path, supply_chain}()
│ │           (Parallel with ThreadPoolExecutor)
│ ├─ Stage 5: graph.enrich.enrich_graph()
│ │           → engines.compliance.enrich_with_compliance()
│ │           → ai.opinion.generate_ai_opinion()
│ ├─ Stage 6: autofix.engine.generate_auto_fixes()
│ ├─ Stage 7: ai.summarizer.executive_summary()
│ ├─ Stage 8: pipeline.scoring.calculate_security_index()
│ └─ Final: db.queries.update_scan_result() → ATOMIC write
│
│ parsers/ (Input Normalization)
│ ├─ json_parser.parse_input() → dict to normalized format
│ ├─ yaml_parser.parse_input() → YAML to normalized format
│ └─ tf_parser.parse_input() → Terraform to normalized format
│
│ confidence/model.py (Trust Evaluation)
│ ├─ ConfidenceResolver(evidence_source).resolve(data)
│ ├─ Returns: (resolved_data, confidence_score, warnings)
│ ├─ Logic: Downgrade positive claims if low confidence
│ └─ Used at: Stage 2 of pipeline
│
│ graph/builder.py (Graph Construction)
│ ├─ build_graph(data) → NetworkX DiGraph
│ ├─ Adds attributes: node properties, edge properties
│ └─ Used at: Stage 3 of pipeline
│
│ graph/enrich.py (Graph Enrichment)
│ ├─ enrich_graph(G) → adds computed attributes
│ ├─ Calculates: blast_radius via BFS
│ ├─ Enriches: CVE lookups, CVSS scores
│ └─ Used at: Stage 5 of pipeline
│
│ engines/zero_trust.py (ZT Engine)
│ ├─ zero_trust_engine(G) → (findings, score)
│ ├─ Calls: engines.rules.evaluate_rules(G, RULE_REGISTRY)
│ └─ Used at: Stage 4 parallel execution
│
│ engines/rules.py (Rule Registry)
│ ├─ RULE_REGISTRY = {...}  # All ZT rules
│ ├─ evaluate_rules(G, rules) → applies each rule to graph
│ └─ Centralized: To add rule, only edit rules.py
│
│ engines/{quantum,attack_path,supply_chain,compliance}.py
│ ├─ Each returns: (findings, score)
│ ├─ Profit margin check: All used at Stage 4 (parallel)
│ └─ Compliance: Also used at Stage 5
│
│ ai/opinion.py (AI Reasoning)
│ ├─ generate_ai_opinion(findings, G, confidence) → findings with opinions
│ ├─ Per finding adds: impact, likelihood, priority, reason
│ └─ Used at: Stage 5 of pipeline
│
│ ai/summarizer.py (Executive Summary)
│ ├─ executive_summary(findings, index, breakdown) → CISO summary
│ ├─ Output: {security_index, risk_level, critical_count, main_risk, ...}
│ └─ Used at: Stage 7 of pipeline
│
│ autofix/engine.py (Patch Generation)
│ ├─ generate_auto_fixes(findings, G) → list of patches
│ ├─ Reads: autofix/templates.json (cached)
│ ├─ Fills: {node_id}, {fix_version} placeholders
│ └─ Used at: Stage 6 of pipeline
│
│ autofix/templates.json (Patch Templates)
│ ├─ Format: {rule_id: {title, language, template_code, score_impact, ...}}
│ └─ Read by: autofix/engine.py at module import time
│
│ pipeline/scoring.py (Security Index Calculation)
│ ├─ calculate_security_index(scores, qvi, findings) → (index, breakdown)
│ ├─ Formula: ZT×0.35 + (100-QVI)×0.20 + AP×0.25 + SC×0.10 + C×0.10
│ └─ Used at: Stage 8 of pipeline
│
│ report/{pdf_builder, signer, blockchain}.py (Reporting)
│ ├─ pdf_builder.build_pdf() → PDF from scan results
│ ├─ signer.sign_pdf() → RSA-2048 sign PDF
│ ├─ blockchain.store_on_polygon() → Optional blockchain proof
│ └─ Used at: POST /reports/{scan_id} endpoint (not yet implemented)
│
│ advisory/{tier1, tier2}.py (Regulatory Advisory)
│ ├─ tier1_advise() → Framework matching (NIST, DPDP, RBI)
│ ├─ tier2_advise() → FTS5 semantic search on docs_fts
│ └─ Called by: (Optional) findings enrichment stage
│
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 📂 Complete File-by-File Structure

```
quantum_ares/
│
├── backend/
│   ├── __init__.py
│   ├── requirements.txt                    # pip dependencies
│   │
│   └── app/
│       ├── __init__.py
│       ├── main.py                         ★ ENTRY POINT
│       │   └─ FastAPI app initialization, lifespan hooks
│       │
│       ├── config.py                       ★ CONFIGURATION
│       │   └─ Env variables: SQLITE_PATH, SECRET_KEY, etc.
│       │
│       ├── api/
│       │   ├── __init__.py
│       │   ├── auth.py                     ★ AUTHENTICATION
│       │   │   └─ POST /auth/login, get_current_org()
│       │   │
│       │   └── routes.py                   ★ API ENDPOINTS
│       │       └─ POST /validate, GET /status, GET /report
│       │
│       ├── db/
│       │   ├── __init__.py
│       │   ├── database.py                 ★ CONNECTION MANAGER
│       │   │   └─ get_db(), init_schema(), build_fts5_index()
│       │   │
│       │   ├── schema.sql                  ★ DATABASE SCHEMA
│       │   │   └─ orgs, users, scans, reports, docs_fts tables
│       │   │
│       │   └── queries.py                  ★ CRUD OPERATIONS
│       │       └─ create_scan(), get_scan(), update_scan_result()
│       │
│       ├── pipeline/
│       │   ├── __init__.py
│       │   ├── runner.py                   ★ 8-STAGE ORCHESTRATOR
│       │   │   └─ run_pipeline(scan_id, org_id)
│       │   │
│       │   └── scoring.py                  ★ CALCULATION
│       │       └─ calculate_security_index()
│       │
│       ├── parsers/
│       │   ├── __init__.py
│       │   ├── json_parser.py              ★ JSON PARSING
│       │   ├── yaml_parser.py              ★ YAML PARSING
│       │   └── tf_parser.py                ★ TERRAFORM PARSING
│       │
│       ├── confidence/
│       │   ├── __init__.py
│       │   └── model.py                    ★ TRUST EVALUATION
│       │       └─ ConfidenceResolver
│       │
│       ├── graph/
│       │   ├── __init__.py
│       │   ├── builder.py                  ★ GRAPH BUILDING
│       │   │   └─ build_graph()
│       │   │
│       │   ├── enrich.py                   ★ GRAPH ENRICHMENT
│       │   │   └─ enrich_graph()
│       │   │
│       │   └── serializer.py               ✓ Graph serialization
│       │
│       ├── engines/
│       │   ├── __init__.py
│       │   ├── zero_trust.py               ★ ZT ENGINE (35% weight)
│       │   │   └─ zero_trust_engine()
│       │   │
│       │   ├── rules.py                    ★ RULE REGISTRY
│       │   │   └─ RULE_REGISTRY, evaluate_rules()
│       │   │
│       │   ├── quantum.py                  ★ QUANTUM ENGINE (20% weight)
│       │   │   └─ quantum_engine()
│       │   │
│       │   ├── attack_path.py              ★ ATTACK PATH ENGINE (25% weight)
│       │   │   └─ attack_path_engine()
│       │   │
│       │   ├── supply_chain.py             ★ SUPPLY CHAIN ENGINE (10% weight)
│       │   │   └─ supply_chain_engine()
│       │   │
│       │   └── compliance.py               ★ COMPLIANCE ENGINE (10% weight)
│       │       └─ enrich_with_compliance()
│       │
│       ├── ai/
│       │   ├── __init__.py
│       │   ├── opinion.py                  ★ AI OPINION MODEL
│       │   │   └─ generate_ai_opinion()
│       │   │
│       │   └── summarizer.py               ★ EXECUTIVE SUMMARY
│       │       └─ executive_summary()
│       │
│       ├── autofix/
│       │   ├── __init__.py
│       │   ├── engine.py                   ★ PATCH GENERATION
│       │   │   └─ generate_auto_fixes()
│       │   │
│       │   └── templates.json              ★ PATCH TEMPLATES
│       │
│       ├── report/
│       │   ├── __init__.py
│       │   ├── pdf_builder.py              ✓ PDF generation
│       │   ├── signer.py                   ✓ RSA signing
│       │   └── blockchain.py               ✓ Polygon storage
│       │
│       ├── advisory/
│       │   ├── __init__.py
│       │   ├── tier1.py                    ✓ Framework matching
│       │   └── tier2.py                    ✓ FTS5 search
│       │
│       ├── data/
│       │   ├── quantum_ares.db             ← SQLite database (generated)
│       │   ├── ai_templates.json           ✓ AI templates
│       │   ├── nvd_snapshot.json           ✓ CVE data
│       │   ├── dpdp_act_2023.txt          ✓ DPDP regulation
│       │   ├── nist_sp_800_207.txt        ✓ NIST Zero Trust
│       │   └── rbi_master_direction.txt   ✓ RBI banking
│       │
│       └── tests/
│           ├── __init__.py
│           ├── fixtures.py                 ✓ Test fixtures
│           ├── test_api.py                 ✓ API tests
│           ├── test_db.py                  ✓ Database tests
│           ├── test_engines.py             ✓ Engine tests
│           ├── test_pipeline.py            ✓ Pipeline tests
│           ├── test_ai_opinion.py          ✓ AI opinion tests
│           └── ... (other test files)
│
├── frontend/
│   ├── Dockerfile
│   └── nginx.conf
│
├── docker-compose.yml                      ★ ORCHESTRATION
├── token.json                              ✓ Demo tokens
│
└── README.md (this file)
```

**Legend:**
- `★` = Critical for database/component integration
- `✓` = Optional/supporting files

---

## 🔌 Integration Points by Component

### For Database Integration

#### Connection Pattern
```python
# backend/app/db/database.py
def get_db() -> sqlite3.Connection:
    conn = sqlite3.connect(SQLITE_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row  # ← Access columns by name
    conn.execute('PRAGMA foreign_keys=ON')
    conn.execute('PRAGMA journal_mode=WAL')  # ← Concurrent reads
    return conn
```

**Why check_same_thread=False?**
- FastAPI background tasks run in ThreadPoolExecutor
- Each thread needs its own connection
- SQLite requires separate connection per thread (not shared)
- PRAGMA foreign_keys=ON ensures referential integrity

**Why WAL mode?**
- Write-Ahead Logging: readers use snapshots
- Prevents lock contention during pipeline writes
- Critical for polling frontend (/status every 2s)

#### Query Pattern
```python
# All queries in db/queries.py follow this pattern:
def get_scan(scan_id: str, org_id: str) -> dict | None:
    conn = get_db()
    try:
        row = conn.execute(
            'SELECT * FROM scans WHERE id=? AND org_id=?',
            (scan_id, org_id)
        ).fetchone()
        if row:
            d = dict(row)
            # Deserialize JSON columns
            for col in ['graph_json', 'findings', ...]:
                d[col] = json.loads(d[col]) if isinstance(d[col], str) else d[col]
            return d
    finally:
        conn.close()  # ← Always close, even on exception
```

**Key patterns:**
1. Open connection
2. Execute query with ? placeholders (no SQL injection)
3. Deserialize JSON columns on read
4. Close connection in finally block
5. Return typed Python objects

#### Atomic Operations
```python
# update_scan_result is ATOMIC — all-or-nothing
def update_scan_result(scan_id: str, result: dict):
    conn = get_db()
    try:
        conn.execute(
            '''UPDATE scans SET
                 graph_json = ?,
                 security_index = ?,
                 findings = ?,
                 ... (all 12 JSON columns)
               WHERE id = ?''',
            (
                json.dumps(result['graph_json']),
                result['security_index'],
                json.dumps(result['findings']),
                ... (all values),
                scan_id
            )
        )
        conn.commit()  # ← Atomic: all or nothing
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()
```

**Why atomic?**
- Status polling frontend gets consistent view
- No partial writes (findings without score, etc.)
- ACID compliance for multi-stage pipeline

### For API Integration

#### Request Flow
```
POST /api/v1/validate
├─ Input validation (file size, evidence_source enum)
├─ db.queries.create_scan() → INSERT pending scan
├─ bg.add_task(run_pipeline, scan_id, org_id) → queue background job
└─ return HTTP 202: {"scan_id": "...", "status": "pending"}

Polling loop (frontend):
└─ GET /api/v1/scans/{scan_id}/status every 2 seconds
   ├─ db.queries.get_scan(scan_id, org_id) → fetch current state
   └─ return: {"status": "running|complete", "progress": 65}
```

#### Authentication Dependency
```python
# All protected routes use this dependency
@router.get('/scans/{scan_id}/status')
def handler(scan_id: str, auth=Depends(get_current_org)):
    # auth = {'user_id': 'xyz', 'org_id': 'abc', 'role': 'admin'}
    scan = get_scan(scan_id, auth['org_id'])  # ← org_id from JWT
```

**Security guarantee:**
- User cannot access another org's scan even with guessed scan_id
- Every query enforces org_id filter
- Multi-tenant isolation by design

### For Pipeline Integration

#### 8-Stage Flow
```python
def run_pipeline(scan_id: str, org_id: str):
    
    # Stage 1: Parse
    data = parsers.parse_input(raw_text)
    
    # Stage 2: Confidence
    resolver = confidence.ConfidenceResolver(evidence_source)
    resolved_data = resolver.resolve(data)
    
    # Stage 3: Graph
    G = graph.builder.build_graph(resolved_data)
    
    # Stage 4: Engines (parallel)
    with ThreadPoolExecutor() as executor:
        futures = [
            executor.submit(engines.zero_trust.zero_trust_engine, G),
            executor.submit(engines.quantum.quantum_engine, G),
            executor.submit(engines.attack_path.attack_path_engine, G),
            executor.submit(engines.supply_chain.supply_chain_engine, G),
        ]
        results = [f.result() for f in as_completed(futures)]
    
    # Stage 5: Enrich
    G = graph.enrich.enrich_graph(G)
    findings = engines.compliance.enrich_with_compliance(findings)
    findings = ai.opinion.generate_ai_opinion(findings, G, confidence)
    
    # Stage 6: Patches
    patches = autofix.engine.generate_auto_fixes(findings, G)
    
    # Stage 7: Summary
    summary = ai.summarizer.executive_summary(findings, index, breakdown)
    
    # Stage 8: Save (ATOMIC)
    result = {
        'graph_json': {...},
        'security_index': 67,
        'findings': findings,
        'auto_fix_patches': patches,
        'executive_summary': summary,
        ... (12 total keys)
    }
    db.queries.update_scan_result(scan_id, result)
```

**Parallelization strategy:**
- Stages 1-3: Sequential (dependencies)
- Stage 4: Parallel (all engines independent)
- Stages 5-8: Sequential (dependencies)

### For External Tool Integration

#### To Add New Engine
1. Create `app/engines/new_engine.py`
2. Implement function: `def new_engine(G: nx.DiGraph) -> Tuple[List[Dict], float]`
3. In pipeline/runner.py, add to Stage 4 and Stage 8:
```python
try:
    from app.engines.new_engine import new_engine
except ImportError:
    new_engine = lambda G: ([], 50.0)  # Stub fallback
```

#### To Add New Rule
1. Edit `app/engines/rules.py`
2. Add to `RULE_REGISTRY`:
```python
RULE_REGISTRY = {
    'zt_123': {
        'name': 'New Rule',
        'evaluate': lambda G: [...findings...]
    }
}
```
3. Zero-touch: zero_trust_engine calls evaluate_rules() → automatically includes new rule

#### To Add New Finding Type
1. Create finding dict with schema:
```python
{
    'rule_id': str,
    'severity': 'CRITICAL|HIGH|MEDIUM|LOW',
    'cvss': float,
    'affected_nodes': [str],
    'description': str,
    'remediation': str,
    'engine': str
}
```
2. Engine returns in (findings, score) tuple
3. Auto-flows through pipeline → JSON storage → no schema migration needed

---

## 🗂️ Data Flow Through Components

### Example: User Uploads Terraform and Gets Score

```
Timeline:
T+0s: User clicks "Upload"
     POST /validate
     ├─ File: infrastructure.tf (1KB)
     ├─ evidence_source: terraform
     └─ Headers: Authorization: Bearer <JWT>

T+0.1s: Backend processes request
       ├─ get_current_org() validates JWT → org_id='company_x'
       ├─ create_scan() → INSERT → scan_id='abc123...'
       │  (status='pending', input_raw=raw_text, evidence_source='terraform')
       ├─ bg.add_task(run_pipeline, 'abc123', 'company_x')
       └─ return HTTP 202: {"scan_id": "abc123"}

T+0.2s: Frontend receives 202, starts polling
       GET /scans/abc123/status
       ├─ get_scan('abc123', 'company_x') → db query
       └─ return: {status: 'pending', progress: 0}

T+0.5s: Pipeline starts executing (background thread)
       ├─ update_scan_running('abc123') → status='running'
       ├─ STAGE 1: tf_parser.parse_input(raw_text)
       │  Parse Terraform HCL:
       │    resource "aws_rds_instance" "db" { ... }
       │    resource "aws_security_group" "app" { ... }
       │  → normalized: {nodes: [db, app], edges: [app→db]}
       │
       ├─ STAGE 2: ConfidenceResolver('terraform')
       │  confidence = 0.95 (high trust)
       │  All positive claims kept (tls_enforced: true remains true)
       │
       ├─ STAGE 3: build_graph(resolved_data)
       │  Create DiGraph with node/edge attributes
       │
       ├─ STAGE 4: Parallel engines
       │  ├─ zero_trust_engine(G) → checks:
       │  │  - MFA missing on app→db? → Finding
       │  │  - Implicit trust? → Finding
       │  │  → (findings=2, score=65.0)
       │  │
       │  ├─ quantum_engine(G) → checks:
       │  │  - HNDL: long-term data on unencrypted? → No findings
       │  │  → (findings=0, score=100.0)
       │  │
       │  ├─ attack_path_engine(G) → traces:
       │  │  - Entry: app (public)
       │  │  - Path: app → db (sensitive)
       │  │  - Hops: 1, Blast radius: 2
       │  │  → (findings=1 [high risk path], score=70.0)
       │  │
       │  └─ supply_chain_engine(G) → checks:
       │     - App image: ubuntu:20.04 (outdated)
       │     - DB: aws_rds (trusted)
       │     → (findings=1, score=85.0)
       │
       ├─ STAGE 5: Enrichment
       │  ├─ enrich_graph() adds:
       │  │  - blast_radius: app=2, db=0
       │  │  - cvss_live: app=6.5 (from NVD ubuntu image)
       │  │  - known_exploit: true
       │  │
       │  ├─ enrich_with_compliance() maps findings to:
       │  │  - NIST 800-207 (zero trust violation)
       │  │  - DPDP Act 2023 (data at risk)
       │  │
       │  └─ generate_ai_opinion() adds reasoning:
       │     Finding: "MFA missing"
       │     impact: "SYSTEM-WIDE" (blast_radius=2)
       │     likelihood: "HIGH" (no CVE, but CRITICAL severity)
       │     priority: "CRITICAL" (impact×likelihood)
       │     reason: "Database stores customer data. Two services depend..."
       │
       ├─ STAGE 6: Auto-fix generation
       │  For each finding, match template:
       │  ├─ Finding: "MFA missing on app→db"
       │    ├─ Template: "enable_mfa_for_rds"
       │    ├─ Fill: {node_id: "db", fix_version: "latest"}
       │    ├─ Result:
       │    │  {
       │    │    rule_id: "zt_002",
       │    │    affected_node: "db",
       │    │    language: "terraform",
       │    │    template_code: "require_mfa = true",
       │    │    score_impact: "+12",
       │    │    severity: "HIGH"
       │    │  }
       │    └─ [1 more patch for db encryption]
       │
       ├─ STAGE 7: Executive summary
       │  Generate for CISO:
       │  {
       │    security_index: 71,
       │    risk_level: "HIGH",
       │    critical_count: 0,
       │    high_count: 2,
       │    main_risk: "Outdated Linux image + missing MFA on database",
       │    primary_action: "Upgrade ubuntu image + enable RDS MFA",
       │    compliance_gaps: 2
       │  }
       │
       ├─ STAGE 8: Calculate score & save
       │  Formula:
       │  Index = ZT×0.35 + (100-QVI)×0.20 + AP×0.25 + SC×0.10 + C×0.10
       │        = 65×0.35 + (100-0)×0.20 + 70×0.25 + 85×0.10 + 80×0.10
       │        = 22.75 + 20 + 17.5 + 8.5 + 8
       │        = 76.75 → rounds to 77
       │
       │  ATOMIC UPDATE scans table:
       │  UPDATE scans SET
       │    score_breakdown = '{"zero_trust":22.8,...}',
       │    security_index = 77,
       │    findings = '[{...}, {...}]',
       │    auto_fix_patches = '[{...}]',
       │    executive_summary = '{...}',
       │    status = 'complete'
       │  WHERE id = 'abc123'

T+2.5s: Pipeline completes (2 seconds elapsed)
       ├─ Status stored in DB
       └─ Frontend gets complete status on next poll

T+2.6s: Frontend polls and receives complete
       GET /scans/abc123/status
       └─ return: {status: 'complete', security_index: 77}

T+2.7s: Frontend fetches full report
       GET /scans/abc123/report
       └─ get_scan() deserializes all JSON → returns full report

T+2.8s: Frontend displays results
       ├─ Security Index: 77/100
       ├─ Risk Heatmap: HIGH
       ├─ Findings: 4 total (0 CRITICAL, 2 HIGH, 2 MEDIUM)
       ├─ Auto-Fix Patches: 2 patches available
       └─ Executive Summary: [displayed to CISO]
```

---

## 🔍 Tracing a Request Through Components

### Login → Scan → Results Flow

**Step 1: User logs in**
```
POST /api/v1/auth/login
{
  "email": "analyst@company.com",
  "password": "SecurePass123!"
}
          ↓
api/auth.py:login()
  ├─ Query: SELECT * FROM users WHERE email='analyst@company.com'
  ├─ Verify: ph.verify(stored_hash, 'SecurePass123!')
  ├─ Generate JWT: {sub: user_uuid, org_id: 'company_abc', exp: now+24h}
  ├─ Sign: HMAC-SHA256(jwt_payload, SECRET_KEY)
  └─ Return: {"access_token": "eyJ...", "org_id": "company_abc"}
```

**Step 2: Upload infrastructure**
```
POST /api/v1/validate
Headers: Authorization: Bearer eyJ...
Multipart:
  file: (infrastructure.json)
  name: Production Network
  evidence_source: json
          ↓
api/routes.py:validate()
  ├─ get_current_org() → validates JWT header
  │  ├─ Parse: "Bearer eyJ..."
  │  ├─ Verify: JWT signature with SECRET_KEY
  │  ├─ Extract: {user_id, org_id: 'company_abc', role}
  │  └─ Return auth dict
  │
  ├─ read() file → UTF-8 decode → raw_text
  │
  ├─ validate input:
  │  ├─ File not empty? Yes
  │  ├─ evidence_source in valid set? Yes (json ∈ {json, yaml, ...})
  │  └─ Pass ✓
  │
  ├─ db.queries.create_scan()
  │  ├─ scan_id = uuid.uuid4() → 'a5f2e1c3...'
  │  ├─ Query: INSERT INTO scans (id, org_id, name, input_raw, evidence_source, status)
  │  │         VALUES (?, ?, ?, ?, ?, 'pending')
  │  ├─ Params: ('a5f2e1c3', 'company_abc', 'Production Network', raw_text, 'json')
  │  ├─ Commit ✓
  │  └─ Return scan_id
  │
  ├─ bg.add_task(pipeline.runner.run_pipeline, 'a5f2e1c3', 'company_abc')
  │  └─ Queue task (does not wait)
  │
  └─ Return HTTP 202: {scan_id: 'a5f2e1c3', status: 'pending'}
```

**Step 3: Frontend polls status**
```
GET /api/v1/scans/a5f2e1c3/status
Headers: Authorization: Bearer eyJ...
          ↓
api/routes.py:scan_status()
  ├─ get_current_org() → extract org_id='company_abc'
  │
  ├─ db.queries.get_scan('a5f2e1c3', 'company_abc')
  │  ├─ Query: SELECT * FROM scans WHERE id=? AND org_id=?
  │  ├─ Params: ('a5f2e1c3', 'company_abc')
  │  └─ Return {id, org_id, status: 'running', ...}
  │
  └─ Return HTTP 200: {status: 'running', progress: 35}
```

**Step 4: Pipeline executes (background)**
```
pipeline.runner.run_pipeline('a5f2e1c3', 'company_abc')
  │
  ├─ get_scan('a5f2e1c3', 'company_abc')
  │  └─ Fetch from DB: input_raw + metadata
  │
  ├─ STAGE 1-8 (as detailed above)
  │  ├─ Parse, confidence, graph, engines, enrich, patches, summary, score
  │  └─ Accumulate all findings + results
  │
  └─ db.queries.update_scan_result('a5f2e1c3', {all_results})
     ├─ ATOMIC UPDATE: all JSON columns at once
     ├─ Commit ✓
     └─ Scan now in 'complete' status
```

**Step 5: Frontend retrieves results**
```
GET /api/v1/scans/a5f2e1c3/report
Headers: Authorization: Bearer eyJ...
          ↓
api/routes.py:get_report()
  ├─ get_current_org() → extract org_id='company_abc'
  │
  ├─ db.queries.get_scan('a5f2e1c3', 'company_abc')
  │  ├─ Query: SELECT * FROM scans WHERE id=? AND org_id=?
  │  ├─ Deserialize JSON columns:
  │  │  - graph_json → dict
  │  │  - findings → list of dicts
  │  │  - auto_fix_patches → list of dicts
  │  │  - executive_summary → dict
  │  │  - score_breakdown → dict
  │  └─ Return: {all_fields_deserialized}
  │
  └─ Return HTTP 200: {security_index: 77, findings: [...], ...}
```

---

## ✅ Integration Verification Checklist

For each component integration, verify:

### Database Integration
- [ ] SQLite database file created at SQLITE_PATH
- [ ] All tables initialized (orgs, users, scans, reports, docs_fts)
- [ ] Foreign key constraints enforced (PRAGMA foreign_keys=ON)
- [ ] WAL mode enabled (PRAGMA journal_mode=WAL)
- [ ] Org_id isolation verified (no cross-org data leakage)
- [ ] JSON deserialization working (all columns properly typed)
- [ ] Indexes created and being used (EXPLAIN QUERY PLAN)

### Authentication Integration
- [ ] Users table has Argon2id hashes (not plaintext)
- [ ] JWT tokens generated with org_id embedded
- [ ] Token expiration enforced (24 hours default)
- [ ] get_current_org() dependency injection working
- [ ] Protected routes reject missing/invalid tokens

### API Integration
- [ ] POST /validate accepts multipart file + metadata
- [ ] HTTP 202 returned immediately (non-blocking)
- [ ] Background task queued (bg.add_task)
- [ ] GET /status returns progress updates
- [ ] GET /report returns full results after completion

### Pipeline Integration
- [ ] All 8 stages execute in sequence
- [ ] Stage 4 parallelizes engines (ThreadPoolExecutor)
- [ ] Findings accumulate across stages
- [ ] update_scan_result atomic write succeeds
- [ ] Scan status transitions: pending → running → complete

### Engine Integration
- [ ] Each engine returns (findings: list, score: float)
- [ ] Findings conform to schema (rule_id, severity, affected_nodes, etc.)
- [ ] Scores normalized 0-100
- [ ] Fallback stubs work if engine missing (try/except)

---

**Document Version:** 1.0 | **Last Updated:** March 22, 2026
