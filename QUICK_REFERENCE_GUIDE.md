# QUANTUM-ARES: Quick Reference Guide

## 📊 System Overview at a Glance

**What it does:** Uploads infrastructure blueprints → Analyzes security → Returns risk score + remediation patches

**Key Stats:**
- Security Index: 0-100 aggregate score
- 5 threat engines: Zero Trust (35%), Quantum (20%), Attack Path (25%), Supply Chain (10%), Compliance (10%)
- 8-stage async pipeline: ~2-5 seconds for typical input
- Multi-tenant: Complete org-based isolation
- Database: SQLite with WAL mode (concurrent reads)

---

## 🏗️ Core Architecture Layers

```
┌─────────────────────────────────────────────────┐
│  FastAPI Web Server (port 8000)                 │
│  Authentication → JWT + Argon2id hashing       │
└─────────────────────┬───────────────────────────┘
                      │
                      ├─ HTTP 202 Accepted
                      │  (non-blocking upload)
                      │
┌─────────────────────────────────────────────────┐
│  Background Pipeline (8 stages)                 │
│  ├─ Parse → Confidence → Graph                │
│  ├─ Engines (parallel) → Enrich                │
│  └─ Patches → Summary → Score → Save          │
└─────────────────────┬───────────────────────────┘
                      │
                      └─ SQLite WAL Database
                         ├─ orgs, users, scans
                         ├─ All JSON outputs
                         └─ FTS5 regulatory docs
```

---

## 📁 File Organization by Function

### Authentication & Entry Point
| File | Function |
|------|----------|
| `main.py` | FastAPI app, CORS, lifespan hooks |
| `api/auth.py` | JWT login, get_current_org dependency |
| `config.py` | Centralized environment variables |

### HTTP API
| File | Function |
|------|----------|
| `api/routes.py` | POST /validate, GET /status endpoints |

### Database
| File | Function |
|------|----------|
| `db/database.py` | SQLite connection manager, schema init |
| `db/schema.sql` | Table definitions, indexes, FTS5 |
| `db/queries.py` | CRUD operations with org isolation |

### Pipeline Orchestration
| File | Function |
|------|----------|
| `pipeline/runner.py` | 8-stage orchestrator, imports all engines |
| `pipeline/scoring.py` | Security Index formula (35-20-25-10-10) |

### Stage 1: Input Parsing
| File | Function |
|------|----------|
| `parsers/json_parser.py` | JSON → graph format |
| `parsers/yaml_parser.py` | YAML → graph format |
| `parsers/tf_parser.py` | Terraform → graph format |

### Stage 2: Trust Evaluation
| File | Function |
|------|----------|
| `confidence/model.py` | Evidence confidence scoring (manual:0.30, terraform:0.95) |

### Stage 3: Graph Building
| File | Function |
|------|----------|
| `graph/builder.py` | Creates NetworkX DiGraph |

### Stage 4: Threat Engines (Parallel)
| File | Function |
|------|----------|
| `engines/zero_trust.py` | NIST 800-207 alignment checks (35% weight) |
| `engines/rules.py` | Rule registry for ZT engine |
| `engines/quantum.py` | HNDL attack detection (20% weight) |
| `engines/attack_path.py` | Graph traversal for attack vectors (25% weight) |
| `engines/supply_chain.py` | Dependency/SBOM analysis (10% weight) |
| `engines/compliance.py` | Regulatory framework mapping (10% weight) |

### Stage 5: Enrichment & AI
| File | Function |
|------|----------|
| `graph/enrich.py` | Add blast_radius, CVSS, CVE data |
| `ai/opinion.py` | Generate reasoning (impact, likelihood, priority) |

### Stage 6: Remediation
| File | Function |
|------|----------|
| `autofix/engine.py` | Match findings to patches |
| `autofix/templates.json` | Expert-verified Terraform/IAM patches |

### Stage 7-8: Summary & Reports
| File | Function |
|------|----------|
| `ai/summarizer.py` | CISO-level executive summary |
| `report/pdf_builder.py` | Generate PDF reports |
| `report/signer.py` | RSA-2048 sign PDFs |
| `report/blockchain.py` | Optional Polygon blockchain storage |

### Advisory/Compliance
| File | Function |
|------|----------|
| `advisory/tier1.py` | Framework matching (DPDP, NIST, RBI) |
| `advisory/tier2.py` | FTS5 semantic search on docs_fts |

---

## 🔄 Request Flow Summary

```
1. USER UPLOADS FILE
   curl -X POST /api/v1/validate \
     -H "Authorization: Bearer <token>" \
     -F "file=@infra.json" \
     -F "evidence_source=json"

2. BACKEND VALIDATION
   ✓ Decode UTF-8
   ✓ Validate evidence_source enum
   ✓ Create scan record (status='pending')

3. QUEUE BACKGROUND TASK
   bg.add_task(run_pipeline, scan_id, org_id)

4. HTTP 202 RESPONSE
   {"scan_id": "abc123...", "status": "pending"}

5. FRONTEND POLLING (every 2 seconds)
   GET /api/v1/scans/{scan_id}/status
   → status: pending|running|complete|failed
   → progress_percent: 0-100
   → engine_status: {zt: running, ap: complete, ...}

6. PIPELINE EXECUTION (background)
   Stage 1: Parse input → normalized graph
   Stage 2: Resolve confidence → downgrade if manual
   Stage 3: Build graph → NetworkX DiGraph
   Stage 4: Run engines → parallel threat analysis
   Stage 5: Enrich + AI → add reasoning layer
   Stage 6: Auto-fix → generate patches
   Stage 7: Summary → CISO summary
   Stage 8: Score & Save → atomic DB write

7. FRONTEND GETS COMPLETE STATUS
   status='complete' → Fetch GET /scans/{id}/report

8. DISPLAY RESULTS
   ├─ Security Index: 67/100
   ├─ Risk Heatmap: CRITICAL (2) | HIGH (5) | MEDIUM (8)
   ├─ Findings: Detailed list with AI opinions
   ├─ Auto-Fix Patches: Sorted by impact
   └─ Executive Summary: One-page CISO brief
```

---

## 🗄️ Database Schema At a Glance

```sql
-- 4 main tables + 1 virtual FTS5 table

orgs
├─ id TEXT (PK)
├─ name TEXT
├─ tier TEXT (free|sme|enterprise|government)
└─ created_at TIMESTAMP

users
├─ id TEXT (PK)
├─ org_id FK → orgs
├─ email TEXT UNIQUE
├─ password_hash TEXT (Argon2id)
├─ role TEXT (admin|analyst|viewer)
└─ created_at TIMESTAMP

scans (primary table, all results stored here)
├─ id TEXT (PK)
├─ org_id FK → orgs (org isolation enforced)
├─ name, input_raw, evidence_source
├─ graph_json JSON → {nodes: [...], edges: [...]}
├─ status TEXT (pending|running|complete|failed)
├─ security_index INT (0-100)
├─ score_breakdown JSON → {zero_trust: 35.0, quantum: 20.0, ...}
├─ risk_summary JSON → {CRITICAL: 2, HIGH: 5, ...}
├─ findings JSON → array of security findings
├─ ai_opinions JSON → reasoning per finding
├─ executive_summary JSON → CISO summary
├─ auto_fix_patches JSON → remediation templates
├─ confidence_warnings JSON → input quality warnings
├─ engine_status JSON → {zt: ok, quantum: ok, ...}
├─ created_at, completed_at, duration_ms
└─ Indexes: org_id, status, security_index DESC, created_at DESC

reports
├─ id TEXT (PK)
├─ scan_id FK → scans
├─ org_id FK → orgs
├─ sha256_hash, rsa_signature
├─ polygon_tx_hash (optional)
└─ pdf_base64 (full report)

docs_fts (VIRTUAL TABLE - FTS5)
├─ doc_id TEXT
├─ title TEXT
├─ content TEXT (500-word chunks)
├─ source TEXT (nist|dpdp|rbi|nvd)
└─ Tokenizer: Porter stemming + Unicode61
```

---

## 🔐 Security Architecture

### Multi-Tenant Isolation
```python
Every protected endpoint:
  @router.get('/scans/{id}')
  def handler(scan_id, auth=Depends(get_current_org)):
      scan = get_scan(scan_id, auth['org_id'])  # ← org_id from JWT
      # Even if user guesses another org's scan_id:
      # Query: SELECT * FROM scans WHERE id=? AND org_id=?
      # Result: None (org_id mismatch)
```

### JWT Authentication
```
Flow:
  1. POST /auth/login → email + password
  2. Argon2id verify (timing-attack resistant)
  3. Generate JWT: {sub: user_id, org_id, role, exp: +24h}
  4. Client stores bearer token
  5. All requests: Authorization: Bearer <token>
  6. get_current_org() validates & extracts org_id

Token lifetime: 24 hours (configurable)
Algorithm: HS256 (HMAC-SHA256)
Secret: Must be strong in production!
```

### Password Security
```
✓ Argon2id hashing (memory-hard, time-hard)
✓ Timing-safe comparison (no character-by-character timing leaks)
✓ Random salt per password
✗ Never stored plaintext
✗ Never sent over HTTP (HTTPS required in production)
```

---

## ⚙️ Configuration Quick Reference

```python
# backend/app/config.py

SQLITE_PATH         # Database file location (default: backend/app/data/quantum_ares.db)
SECRET_KEY          # JWT signing key (ROTATE IN PRODUCTION!)
ALGORITHM           # 'HS256' (fixed)
TOKEN_EXPIRE_HOURS  # 24 (default)
ALLOWED_ORIGINS     # CORS: localhost:5173, localhost:80, prod domain
BLOCKCHAIN_MODE     # 'rsa' (default) or 'polygon' (testnet)
APP_VERSION         # '7.75.0'
APP_TITLE           # 'QUANTUM-ARES'
```

**Environment Variables (docker-compose.yml):**
```yaml
environment:
  - SQLITE_PATH=/app/data/quantum_ares.db
  - SECRET_KEY=${SECRET_KEY}  # From .env
  - ALLOWED_ORIGINS=http://localhost:80
  - BLOCKCHAIN_MODE=rsa
```

---

## 📈 Scoring Formula Breakdown

### Security Index = 67/100 (Example)
```
Formula:
  Index = ZT×0.35 + (100-QVI)×0.20 + AP×0.25 + SC×0.10 + C×0.10

Example Calculation:
  Zero Trust:    80 × 0.35 = 28.0
  Quantum:       15 × 0.20 =  3.0  (15 = Quantum Vuln Index)
  Attack Path:   70 × 0.25 = 17.5
  Supply Chain:  50 × 0.10 =  5.0
  Compliance:    60 × 0.10 =  6.0
  ──────────────────────────────
  Total Index              = 59.5 → rounded to 60

Weight Rationale:
  35% ZT    → NIST SP 800-207 (primary control)
  20% QVI   → HNDL threat (cryptographic hedging)
  25% AP    → Attack path exploitability (real damage)
  10% SC    → Supply chain (indirect)
  10% Compliance → Regulatory alignment
```

### Severity Deductions
```
Per finding, reduce index by:
  CRITICAL → -15 points
  HIGH     → -8 points
  MEDIUM   → -3 points
  LOW      → -1 point

Applied scaled by engine weight:
  formula: delta = severity_deduction × engine_weight
  example: CRITICAL finding in ZT (0.35 weight) = -15 × 0.35 = -5.25
```

---

## 🔌 Key Integration Points

### For Database Integration
1. **All queries use org_id filtering** → No cross-org data leakage
2. **update_scan_result() is ATOMIC** → All findings written in one transaction
3. **JSON columns allow schema-free storage** → Add finding types without migrations
4. **WAL mode ensures concurrent reads** → Polls don't block pipeline writes

### For External Component Integration
1. **Pipeline imports are try/except protected** → Graceful degradation if component missing
2. **Standard finding format** → All engines output: `(findings: list, score: float)`
3. **Extensible rules registry** → Add new ZT rules in `engines/rules.py` only
4. **FTS5 docs_fts table** → Semantic search for compliance advisory

### For Frontend Integration
1. **HTTP 202 Accepted** → Non-blocking uploads
2. **Status polling** → Poll /status every 2s until complete
3. **JSON response format** → Standard shape for all endpoints
4. **Org_id from JWT** → Frontend automatically isolated by org

---

## 🚀 Deployment Checklist

```
□ Generate new SECRET_KEY (256-bit random)
□ Set SQLITE_PATH to production location (or migrate to PostgreSQL)
□ Configure ALLOWED_ORIGINS for production domain
□ Set up HTTPS/TLS certificates
□ Configure database backups (daily minimum)
□ Remove auto-seeded demo org (security measure)
□ Enable rate limiting on /validate endpoint
□ Configure centralized logging (CloudWatch, DataDog)
□ Set up monitoring for pipeline latency (SLA: <5s)
□ Configure alerts for failed scans
□ Test cross-org isolation (critical!)
□ Load test with concurrent uploads (expected users)
```

---

## 📊 Example Finding Object

```json
{
  "rule_id": "zt_001",
  "title": "Implicit Trust Detected",
  "severity": "HIGH",
  "cvss": 7.5,
  "affected_nodes": ["web_01", "db_01"],
  "description": "Network edge between client and API allows unauthenticated traffic. Zero Trust principle violated.",
  "remediation": "Set auth_required=true, add MFA verification, enable TLS.",
  "engine": "zero_trust",
  "confidence": 0.95,
  "ai_opinion": {
    "impact": "HIGH",
    "likelihood": "HIGH (CVE-2024-1234 has public exploit)",
    "priority": "CRITICAL",
    "reason": "This web server reaches 8 downstream services. If compromised, database and payment systems at risk."
  },
  "compliance_tags": ["NIST 800-207 CA-1", "DPDP Act 2023 §5(c)"]
}
```

---

## 🎯 Common Operations

### Login & Get Token
```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@demo.com","password":"Admin@1234"}'
# Response: {"access_token": "eyJ...", "org_id": "demoorg001"}
```

### Upload Infrastructure
```bash
SCAN_ID=$(curl -X POST http://localhost:8000/api/v1/validate \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@infrastructure.json" \
  -F "evidence_source=json" | jq -r '.scan_id')
echo "Scan created: $SCAN_ID"
```

### Poll Status
```bash
curl -X GET http://localhost:8000/api/v1/scans/$SCAN_ID/status \
  -H "Authorization: Bearer $TOKEN" | jq '.status, .progress_percent'
```

### Get Results
```bash
curl -X GET http://localhost:8000/api/v1/scans/$SCAN_ID/report \
  -H "Authorization: Bearer $TOKEN" | jq '.security_index, .executive_summary'
```

---

## 📋 File Dependency Map

```
main.py
├─ imports: config, database, api.routes, api.auth
└─ mounts: auth_router, main_router

api/routes.py
├─ calls: db.queries.create_scan(), db.queries.get_scan()
├─ queues: pipeline.runner.run_pipeline()
└─ depends: api.auth.get_current_org()

pipeline/runner.py (orchestrator)
├─ imports: parsers, engines.*, graph.*, ai.*, autofix, confidence
├─ calls: all Stage 1-8 components in sequence
└─ saves: db.queries.update_scan_result()

engines/zero_trust.py
└─ calls: engines.rules.evaluate_rules()

autofix/engine.py
└─ reads: autofix/templates.json (at module import time, cached)

graph/enrich.py
├─ reads: backend/app/data/nvd_snapshot.json (CVE database)
└─ adds: blast_radius, cvss_live to nodes

ai/opinion.py
└─ reads: Graph blast_radius (pre-computed by enrich.py)
```

---

## ✅ Next Steps for Integration

1. **Verify database connectivity**
   - Test `get_db()` returns valid connection
   - Verify WAL mode enabled: `PRAGMA journal_mode;` should return 'wal'

2. **Test authentication flow**
   - Login returns valid JWT token
   - Token embedded org_id matches database record

3. **Run sample scan**
   - Upload test infrastructure.json
   - Verify all 8 stages complete
   - Check findings output format

4. **Validate org isolation**
   - Create 2 test users in different orgs
   - Verify User A cannot see Org B's scans
   - Test with guessed scan_id (must return None)

5. **Performance test**
   - Measure end-to-end pipeline time
   - Target: <5 seconds for typical infrastructure
   - Check database indices are used

6. **Security review**
   - Verify no passwords logged
   - Test token expiration
   - Check CORS restrictions

---

**Version:** 1.0 | **Last Updated:** March 22, 2026
