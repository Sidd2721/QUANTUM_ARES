# QUANTUM SECURITY ANALYSIS PLATFORM - DETAILED ARCHITECTURE REPORT

**Generated:** March 22, 2026  
**Project:** Quantum Security Analysis & Compliance Engine  
**Version:** 1.0

---

## TABLE OF CONTENTS
1. [Executive Summary](#executive-summary)
2. [Project Overview](#project-overview)
3. [Backend Architecture](#backend-architecture)
4. [Frontend Architecture](#frontend-architecture)
5. [Data Flow Pipelines](#data-flow-pipelines)
6. [Configuration & Scoring](#configuration--scoring)
7. [Database Integration Points](#database-integration-points)
8. [Component Dependencies](#component-dependencies)
9. [API Specifications](#api-specifications)
10. [Integration Guide](#integration-guide)

---

## EXECUTIVE SUMMARY

This is a **multi-engine security analysis platform** that:
- Analyzes infrastructure topology as graphs (nodes & edges)
- Runs 5 independent security analysis engines
- Generates security findings with CVSS scores
- Maps findings to compliance frameworks (NIST, DPDP)
- Supports multiple input formats (JSON, YAML, Terraform HCL)

**Key Features:**
- Zero Trust Architecture Analysis (5 rules)
- Quantum Computing Threat Assessment (QVI scoring)
- Attack Path Discovery & Risk Calculation
- Supply Chain Vulnerability Detection
- Compliance Framework Mapping

---

## PROJECT OVERVIEW

### Directory Structure

```
Quantum/
├── backend/
│   ├── requirements.txt              # Python dependencies
│   ├── run_engines.py               # Main orchestrator & entry point
│   ├── sample.json                  # Example infrastructure graph
│   ├── engines/
│   │   ├── __init__.py              # Engine exports
│   │   ├── zero_trust.py            # ZT security rules engine
│   │   ├── quantum.py               # Quantum computing threat engine
│   │   ├── attack_path.py           # Attack surface discovery
│   │   ├── supply_chain.py          # Dependency vulnerability scanner
│   │   ├── compliance.py            # Compliance framework enrichment
│   │   └── rules.py                 # Core rule definitions & evaluation
│   └── parsers/
│       ├── __init__.py              # Parser router
│       ├── json_parser.py           # JSON topology parser
│       ├── yaml_parser.py           # YAML/Kubernetes parser
│       └── tf_parser.py             # Terraform HCL parser
└── frontend/
    ├── package.json                 # npm dependencies
    ├── vite.config.js              # Vite build config
    ├── index.html                  # Entry HTML
    ├── src/
    │   ├── main.jsx                # React entry point
    │   ├── App.jsx                 # Main component
    │   ├── App.css                 # Styling
    │   └── assets/                 # Static assets
    └── public/                     # Static files
```

---

## BACKEND ARCHITECTURE

### 1. ENTRY POINT: `run_engines.py`

**Purpose:** Main orchestrator that coordinates all analysis engines

**Key Functions:**
```python
- main()                    # Orchestrates entire pipeline
- build_graph(data)        # Creates NetworkX directed graph from JSON
```

**Workflow:**
1. Loads `sample.json` (infrastructure topology)
2. Parses input via autodetection
3. Builds directed graph (nodes = infrastructure components, edges = connections)
4. Runs all 5 engines sequentially
5. Enriches findings with compliance data
6. Outputs aggregated results with scores

**Input Data Structure:**
```json
{
  "nodes": [
    {
      "id": "unique_identifier",
      "type": "server|database|gateway|admin",
      "zone": "PUBLIC|DMZ|INTERNAL|PRIVATE|RESTRICTED",
      "data_sensitivity": "LOW|MEDIUM|HIGH|CRITICAL",
      "encryption_type": "AES-256|RSA-2048|ML-KEM-768|none",
      "container_image": "nginx:1.20.1",
      "retention_years": 10,
      "iam_roles": ["role1", "role2"]
    }
  ],
  "edges": [
    {
      "source": "node_id",
      "target": "node_id",
      "auth_required": true|false,
      "tls_enforced": true|false,
      "mfa_required": true|false
    }
  ]
}
```

**Output Structure:**
```python
{
  "findings": [
    {
      "rule_id": "ZT-001|Q-001|AP-001|SC-001",
      "severity": "CRITICAL|HIGH|MEDIUM|LOW",
      "mitre_id": "T1046|T1195|...",
      "cvss": 7.5,
      "affected_nodes": ["node1", "node2"],
      "description": "Security issue description",
      "remediation": "How to fix",
      "compliance_clauses": [{"framework": "NIST", "clause_id": "AC-3"}],
      "business_impact": "...",
      "business_risk": "..."
    }
  ],
  "scores": {
    "zero_trust": 75.5,
    "quantum": 45.2,
    "attack_path": 82.1,
    "supply_chain": 91.0,
    "compliance": 88.0
  }
}
```

---

### 2. PARSER LAYER: `parsers/`

**Purpose:** Multi-format infrastructure topology ingestion

#### `parsers/__init__.py` - Router

**Function:** `parse_input(raw_text, filename)`
- Auto-detects input format by file extension
- Routes to appropriate parser
- Returns normalized node/edge structure

**Routing Logic:**
```
.tf/.hcl         → parse_terraform()
.yaml/.yml       → parse_yaml()
.json OR default → parse_json() → fallback to parse_yaml()
```

#### `parsers/json_parser.py` - JSON Input

**Function:** `parse_json(raw_text)`

**Validations:**
- ✓ JSON syntax validation
- ✓ Node ID uniqueness
- ✓ No self-loops
- ✓ Zone validation: PUBLIC|DMZ|INTERNAL|PRIVATE|RESTRICTED
- ✓ Data sensitivity validation: LOW|MEDIUM|HIGH|CRITICAL
- ✓ Maximum 200 nodes (limit check)
- ✓ All edge sources/targets exist

**Returns:** Normalized dict with nodes, edges, evidence_source

#### `parsers/yaml_parser.py` - Kubernetes/YAML Input

**Function:** `parse_yaml(raw_text)`

**Conversion Logic:**
- Kubernetes manifests → Node objects
- Extracts: kind, metadata, container images, spec details
- Maps to internal schema

**Kubernetes Field Mapping:**
```yaml
Kubernetes Kind        → type
metadata.name         → id/name
metadata.namespace    → namespace
container[0].image    → container_image
Default values:
  zone: INTERNAL
  data_sensitivity: LOW
  encryption_type: unknown
```

#### `parsers/tf_parser.py` - Terraform/HCL Input

**Function:** `parse_terraform(raw_text)`

**3-Tier Parsing Strategy:**
1. **Tier 1:** python-hcl2 library (native HCL parsing)
2. **Tier 2:** Regex fallback (resource pattern matching)
3. **Tier 3:** Fail with helpful error message

**Terraform Resource Mapping:**
```
resource "type" "name" { ... }
  ↓
node {
  id: "name",
  type: "type",
  zone: "PRIVATE" (default),
  encryption_type: "AES-256" if storage_encrypted else "unknown"
}
```

---

### 3. ENGINES LAYER: `engines/`

#### Engine Architecture Pattern

All engines follow this signature:
```python
def engine_name(G: nx.DiGraph) -> Tuple[List[Dict], float]:
    """
    Input: NetworkX DirectedGraph
    Output: (findings[], score: 0-100)
    """
```

---

#### **Engine 1: `zero_trust.py` - Zero Trust Security Rules**

**Purpose:** Validates Zero Trust architecture principles

**Rule Registry:** 5 Rules (defined in rules.py)

| Rule ID | Severity | MITRE ID | Description | Check |
|---------|----------|----------|-------------|-------|
| ZT-001 | CRITICAL | T1046 | Public→Private DB without auth | Direct unauth connection to sensitive DB |
| ZT-002 | HIGH | T1133 | Admin exposed to internet | Admin node in PUBLIC zone |
| ZT-003 | CRITICAL | T1530 | No encryption on sensitive data | HIGH/CRITICAL data without encryption |
| ZT-004 | HIGH | T1078 | No MFA on sensitive access | Edge to sensitive data without MFA |
| ZT-005 | CRITICAL | T1098 | Wildcard IAM permissions | Any IAM role containing '*' |

**Scoring Formula:**
```
score = 100 - (CRITICAL_count × 15 + HIGH_count × 8 + MEDIUM_count × 3 + LOW_count × 1)
Minimum: 0, Maximum: 100
```

**Output Example:**
```python
{
  "rule_id": "ZT-001",
  "severity": "CRITICAL",
  "cvss": 8.2,
  "affected_nodes": ["internet", "database"],
  "description": "Public node directly accessing private DB without auth",
  "remediation": "Add authentication layer",
  "business_impact": "Public access to private database.",
  "business_risk": "Severe regulatory + breach risk"
}
```

---

#### **Engine 2: `quantum.py` - Quantum Threat Assessment**

**Purpose:** Evaluates quantum computing threat to encryption

**Quantum Vulnerability Index (QVI) Calculation:**

```
QVI = weight × vulnerability_score × (1 + retention_years / 10)
      (capped at 100)

Where:
- weight = data_sensitivity_weight (LOW: 0.2 → CRITICAL: 1.0)
- vulnerability_score = VULN_SCORES[encryption_type]
```

**Vulnerability Scores by Encryption Type:**
```python
RSA-1024:    95 (highest risk)
RSA-2048:    85
RSA-4096:    70
ECC-256:     80
ECC-384:     75
DH-1024:     90
DH-2048:     85
AES-128:     40
AES-256:     15 (acceptable)
ML-KEM-768:   5 (post-quantum safe)
Kyber-768:    5 (post-quantum safe)
none:       100 (no encryption)
unknown:     50 (uncertified)
```

**Sensitivity Weights:**
```python
LOW:      0.2
MEDIUM:   0.5
HIGH:     0.8
CRITICAL: 1.0
```

**Risk Prediction:**
```
risk_year = 2025 + (100 - QVI) / 10
```

Example:
- Node: database with CRITICAL data, RSA-1024, 10 years retention
- QVI = 1.0 × 95 × (1 + 10/10) = 190 → capped to 100
- Severity: CRITICAL
- Risk year: 2025 + 0 = 2025 (immediate risk)

**Aggregation:**
```
Aggregate QVI = Σ(node_QVI × node_weight) / Σ(node_weight)
```

**Output Triggered When QVI > 40:**
```python
{
  "rule_id": "Q-001",
  "severity": "CRITICAL" (if QVI > 80) else "HIGH",
  "mitre_id": "T1600",
  "cvss": 8.5 (if QVI > 80) else 6.5,
  "affected_nodes": ["database"],
  "description": 'Node "database" uses RSA-1024 (QVI 100.0). Data at risk by 2025.',
  "remediation": "Migrate to ML-KEM-768 (post-quantum encryption).",
  "qvi": 100.0,
  "risk_year": 2025,
  "business_impact": "Data stored 10y at quantum risk.",
  "business_risk": "Future cryptographic break risk."
}
```

---

#### **Engine 3: `attack_path.py` - Attack Surface & Path Discovery**

**Purpose:** Finds exploitable paths from public to sensitive resources

**Path Discovery Algorithm:**

```
1. Identify PUBLIC nodes (zone == 'PUBLIC')
2. Identify TARGET nodes (data_sensitivity in HIGH|CRITICAL)
3. For each (public→target): find all simple paths (max length 6)
4. Calculate risk for each path
5. Sort by risk (descending)
6. Report top 10 paths
```

**Path Risk Calculation:**

```
risk = 1.0

For each edge in path:
    If auth NOT required:     risk × 3.0 (unprotected)
    If source has exploit:    risk × 2.0 (leverageable)
    Add target CVSS impact:   risk × (1 + target_cvss/10)

Add path length penalty:      risk += log₁₀(path_length + 1)
```

**Severity Classification:**
```
risk > 100     → CRITICAL
risk > 50      → HIGH
risk ≤ 50      → MEDIUM
```

**Score Calculation:**
```
score = 100 - (CRITICAL_count × 20 + HIGH_count × 10 + MEDIUM_count × 4)
Minimum: 0, Maximum: 100
```

**Example Output:**
```python
{
  "rule_id": "AP-001",
  "severity": "CRITICAL",
  "cvss": 10.0,  # min(10, risk/10)
  "affected_nodes": ["internet", "web_server", "app_server", "database"],
  "description": 'Attack path from "internet" to "database" (risk 87.3)',
  "path_risk": 87.3,
  "remediation": "Add auth, firewall, segmentation.",
  "business_impact": "Attacker reaches database",
  "business_risk": "System compromise risk"
}
```

---

#### **Engine 4: `supply_chain.py` - Dependency Vulnerability Scanning**

**Purpose:** Identifies vulnerable container images and dependencies

**Vulnerability Database (NVD Snapshot):**
```python
{
  'nginx:1.20.1': [('CVE-2021-23017', 9.8, 'nginx:1.25.3')],
  'log4j:2.14.1': [('CVE-2021-44228', 10.0, 'log4j:2.17.1')],
  'openssl:1.0.2': [('CVE-2016-0800', 5.9, 'openssl:1.1.1')]
}
```

**Severity Classification (by CVSS):**
```
CVSS ≥ 9.0  → CRITICAL
CVSS ≥ 7.0  → HIGH
CVSS ≥ 4.0  → MEDIUM
CVSS < 4.0  → LOW
```

**Score Calculation:**
```
score = 100 - (
  CRITICAL_count × 25 +
  HIGH_count × 12 +
  MEDIUM_count × 4 +
  LOW_count × 1
)
```

**Output Example:**
```python
{
  "rule_id": "SC-001",
  "severity": "CRITICAL",
  "cvss": 9.8,
  "affected_nodes": ["web_server"],
  "description": "nginx:1.20.1 has CVE-2021-23017",
  "remediation": "Upgrade to nginx:1.25.3",
  "cve_id": "CVE-2021-23017",
  "fix_version": "nginx:1.25.3",
  "business_impact": "Vulnerable dependency",
  "business_risk": "Supply chain attack risk"
}
```

---

#### **Engine 5: `compliance.py` - Compliance Framework Enrichment**

**Purpose:** Maps findings to compliance frameworks and standards

**Compliance Map:**
```python
COMPLIANCE_MAP = {
  'ZT-001': [{'framework': 'NIST', 'clause_id': 'AC-3'}],      # Access Control
  'ZT-003': [{'framework': 'DPDP', 'clause_id': '8(3)'}],      # Data Protection
  'Q-001':  [{'framework': 'NIST', 'clause_id': 'SC-28'}],     # Cryptography
  'AP-001': [{'framework': 'NIST', 'clause_id': 'CA-7'}],      # Continuous Monitoring
  'SC-001': [{'framework': 'DPDP', 'clause_id': '8(3)'}]       # Supply Chain Security
}
```

**Frameworks Supported:**
- **NIST:** National Institute of Standards (US)
- **DPDP:** Digital Personal Data Protection (India)

**Processing:**
```python
For each finding:
  1. Look up rule_id in COMPLIANCE_MAP
  2. Attach compliance_clauses to finding
  3. Count mapped findings

score = (mapped_findings / total_findings) × 100
```

**Output Enhancement:**
```python
# Before enrichment:
{"rule_id": "ZT-001", "compliance_clauses": []}

# After enrichment:
{"rule_id": "ZT-001", "compliance_clauses": [{"framework": "NIST", "clause_id": "AC-3"}]}
```

---

#### **Engine Integration: `rules.py`**

**Purpose:** Core rule definitions and evaluation engine

**Rule Factory Pattern:**
```python
def create_rule(rule_id, severity, mitre_id, cvss, 
                description, remediation,
                check_fn, affected_fn):
    """
    rule_id:        Unique identifier (ZT-001, etc)
    check_fn:       Lambda that returns bool (trigger rule?)
    affected_fn:    Lambda that returns list of affected pairs
    """
```

**Rule Evaluation:**
```python
def evaluate_rules(G, registry):
    For each rule in RULE_REGISTRY:
        1. Execute check_fn(G) → True/False
        2. If True, get affected_fn(G) → list of node pairs
        3. Create finding for each affected pair
        4. Calculate severity counts
        5. Return (findings[], score)
```

---

### 4. ENGINE ORCHESTRATION

**Execution Order (in `run_engines.py`):**

```
1. Parse input             → load sample.json
2. Build graph             → nx.DiGraph
3. Run zero_trust_engine   → findings, zt_score
4. Run quantum_engine      → findings, q_score
5. Run attack_path_engine  → findings, ap_score
6. Run supply_chain_engine → findings, sc_score
7. Enrich_with_compliance  → findings, comp_score
8. Aggregate results       → print findings & scores
```

**Combined Findings List:**
```python
findings = zt_findings + q_findings + ap_findings + sc_findings
           ↓
enrich_with_compliance(findings)
           ↓
Final: findings with compliance clauses
```

---

## FRONTEND ARCHITECTURE

### Tech Stack
- **Framework:** React 19.2.4
- **Build Tool:** Vite 8.0.0
- **Package Manager:** npm
- **Linting:** ESLint 9.39.4

### Files & Responsibilities

| File | Purpose |
|------|---------|
| `package.json` | Dependencies & scripts |
| `vite.config.js` | Vite build configuration |
| `index.html` | HTML entry point |
| `src/main.jsx` | React app mounting |
| `src/App.jsx` | Main React component (boilerplate) |
| `src/App.css` | Component styling |
| `src/index.css` | Global styling |

### Current State
**Status:** Boilerplate/Template  
**Features:** 
- React + Vite setup complete
- Sample counter component
- Hero image with framework logos
- Navigation to docs

### Build & Dev Scripts
```json
{
  "dev": "vite",           # Start dev server
  "build": "vite build",   # Production build
  "lint": "eslint .",      # Lint check
  "preview": "vite preview" # Preview production build
}
```

---

## DATA FLOW PIPELINES

### Pipeline 1: Single Analysis Run

```
INPUT FILES
    ↓
sample.json
    ↓
Parser Router (parsers/__init__.py)
    ├─→ Detect format (.json)
    └─→ parse_json()
    ↓
JSON Parser (parsers/json_parser.py)
    ├─→ Validate syntax
    ├─→ Check constraints (nodes, zones, sensitivity)
    ├─→ Validate edges (references, loops)
    └─→ Return normalized {nodes, edges}
    ↓
Graph Builder (run_engines.py)
    ├─→ Create nx.DiGraph()
    ├─→ Add all nodes with attributes
    ├─→ Add all edges with attributes
    └─→ Return Graph
    ↓
Engine Pipeline
    ├─→ zero_trust_engine(G) → findings[], zt_score
    ├─→ quantum_engine(G) → findings[], q_score
    ├─→ attack_path_engine(G) → findings[], ap_score
    └─→ supply_chain_engine(G) → findings[], sc_score
    ↓
Compliance Enrichment
    └─→ enrich_with_compliance() → final_findings[], comp_score
    ↓
OUTPUT
    ├── findings (aggregated list)
    └── scores {zt, q, ap, sc, comp}
```

### Pipeline 2: Multi-Format Ingestion

```
INPUT (JSON/YAML/Terraform)
    ↓
parse_input(raw_text, filename)
    ├─ Extract extension
    ├─ Route by extension
    │   ├─→ .tf/.hcl → parse_terraform()
    │   │             ├─ Try: hcl2 library
    │   │             ├─ Fallback: regex parsing
    │   │             └─ Return nodes[] (edges empty)
    │   │
    │   ├─→ .yaml/.yml → parse_yaml()
    │   │              ├─ Parse YAML
    │   │              ├─ Extract K8s kind/image
    │   │              └─ Convert to canonical format
    │   │
    │   └─→ .json/default → parse_json()
    │                      ├─ Parse JSON
    │                      ├─ Validate structure
    │                      ├─ Check constraints
    │                      └─ Return normalized
    └─ Normalize to {nodes[], edges[]}
        └─ Return {nodes, edges, evidence_source}
```

### Pipeline 3: Risk Aggregation

```
Individual Engine Scores (0-100)
    ├─ Zero Trust:   75.5
    ├─ Quantum:      45.2
    ├─ Attack Path:  82.1
    ├─ Supply Chain: 91.0
    └─ Compliance:   88.0
    ↓
Weighted Aggregation (Suggested)
    ├─→ Overall Risk = 0.25×ZT + 0.20×Q + 0.20×AP + 0.20×SC + 0.15×Compliance
    ├─→ Example: 0.25(75.5) + 0.20(45.2) + 0.20(82.1) + 0.20(91.0) + 0.15(88.0)
    ├─→ = 18.875 + 9.04 + 16.42 + 18.2 + 13.2
    └─→ = 75.735 (overall risk score)
    ↓
Priority Matrix
    ├─ CRITICAL findings  → Immediate action
    ├─ HIGH findings      → Urgent (1-7 days)
    ├─ MEDIUM findings    → Plan (2-4 weeks)
    └─ LOW findings       → Track (backlog)
```

---

## CONFIGURATION & SCORING

### Configuration Parameters

#### Node Configuration (Infrastructure Assets)

```json
{
  "id": "string",                              // Unique identifier
  "type": "server|database|gateway|admin|...", // Component type
  "zone": "PUBLIC|DMZ|INTERNAL|PRIVATE|RESTRICTED", // Network zone
  "data_sensitivity": "LOW|MEDIUM|HIGH|CRITICAL",   // Data classification
  "encryption_type": "AES-256|RSA-2048|...",       // Encryption algorithm
  "container_image": "nginx:1.20.1|...",           // Container image (optional)
  "retention_years": 10,                           // Data retention period
  "iam_roles": ["role1", "role2"],                 // IAM permissions
  "known_exploit": false,                          // Exploit availability
  "cvss": 5.0                                      // Base CVSS score
}
```

#### Edge Configuration (Connections/Relationships)

```json
{
  "source": "node_id",         // Source node
  "target": "node_id",         // Target node
  "auth_required": true,       // Authentication enforced
  "tls_enforced": false,       // TLS/SSL enforcement
  "mfa_required": true,        // Multi-factor auth required
  "cvss": 7.5                  // Path CVSS (optional)
}
```

### Scoring Models

#### 1. Zero Trust Score (0-100)

```
Penalty System:
- Each CRITICAL finding: -15 points
- Each HIGH finding:     -8 points
- Each MEDIUM finding:   -3 points
- Each LOW finding:      -1 point

score = max(0, 100 - total_penalties)

Example:
  2 CRITICAL + 1 HIGH = 100 - (30 + 8) = 62
```

#### 2. Quantum Score (0-100)

```
Linear Aggregation:
  aggregate_qvi = Σ(node_QVI × weight) / Σ(weight)
  
Where QVI per node:
  qvi = weight × vuln_score × (1 + retention_years/10)
  
Capped at 100

Example:
  CRITICAL data (weight=1.0) + RSA-1024 (vuln=95) + 10 years retention
  = 1.0 × 95 × (1 + 10/10) = 190 → capped to 100
```

#### 3. Attack Path Score (0-100)

```
Based on path count by severity:
  score = 100 - (CRITICAL×20 + HIGH×10 + MEDIUM×4)
  
Path Risk = function(auth_gaps, exploits, target_cvss, path_length)

Example:
  3 CRITICAL paths, 2 HIGH paths
  = 100 - (60 + 20) = 20
```

#### 4. Supply Chain Score (0-100)

```
Based on vulnerability count by severity:
  score = 100 - (CRITICAL×25 + HIGH×12 + MEDIUM×4 + LOW×1)
  
Example:
  1 CRITICAL CVE, 2 HIGH CVEs
  = 100 - (25 + 24) = 51
```

#### 5. Compliance Score (0-100)

```
Mapping ratio:
  score = (mapped_findings / total_findings) × 100
  
If all findings map to compliance clauses: 100
If 50% map: 50
If no mappings: 0
```

### Overall Risk Assessment (Recommended Formula)

```
Overall Risk = 100 - (
  0.25 × zero_trust_score +
  0.20 × quantum_score +
  0.20 × attack_path_score +
  0.20 × supply_chain_score +
  0.15 × compliance_score
)

Risk Interpretation:
  0-25:   LOW RISK     (Green)
  26-50:  MEDIUM RISK  (Yellow)
  51-75:  HIGH RISK    (Orange)
  76-100: CRITICAL     (Red)
```

---

## DATABASE INTEGRATION POINTS

### Recommended Database Schema

#### Table 1: `infrastructure_nodes`
```sql
CREATE TABLE infrastructure_nodes (
  id UUID PRIMARY KEY,
  node_id VARCHAR(255) UNIQUE NOT NULL,
  node_type VARCHAR(50),           -- server, database, gateway, etc.
  zone VARCHAR(50),                -- PUBLIC, DMZ, INTERNAL, PRIVATE, RESTRICTED
  data_sensitivity VARCHAR(50),    -- LOW, MEDIUM, HIGH, CRITICAL
  encryption_type VARCHAR(100),    -- AES-256, RSA-2048, etc.
  container_image VARCHAR(255),    -- Container image if applicable
  retention_years INT,
  iam_roles JSON,                  -- Array of roles
  known_exploit BOOLEAN,
  base_cvss DECIMAL(3,1),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  metadata JSON                    -- For extended attributes
);
```

#### Table 2: `infrastructure_edges`
```sql
CREATE TABLE infrastructure_edges (
  id UUID PRIMARY KEY,
  source_node_id VARCHAR(255) NOT NULL,
  target_node_id VARCHAR(255) NOT NULL,
  auth_required BOOLEAN DEFAULT FALSE,
  tls_enforced BOOLEAN DEFAULT FALSE,
  mfa_required BOOLEAN DEFAULT FALSE,
  edge_cvss DECIMAL(3,1),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (source_node_id) REFERENCES infrastructure_nodes(node_id),
  FOREIGN KEY (target_node_id) REFERENCES infrastructure_nodes(node_id)
);
```

#### Table 3: `analysis_findings`
```sql
CREATE TABLE analysis_findings (
  id UUID PRIMARY KEY,
  analysis_id UUID NOT NULL,
  rule_id VARCHAR(50),            -- ZT-001, Q-001, AP-001, SC-001
  severity VARCHAR(20),           -- CRITICAL, HIGH, MEDIUM, LOW
  mitre_id VARCHAR(50),           -- MITRE ATT&CK ID
  cvss DECIMAL(3,1),
  description TEXT,
  remediation TEXT,
  business_impact TEXT,
  business_risk TEXT,
  affected_nodes JSON,            -- Array of node IDs
  plugin VARCHAR(50),             -- Engine that generated finding
  qvi DECIMAL(5,1),              -- Quantum Vulnerability Index (if applicable)
  risk_year INT,                  -- Year of expected risk (if applicable)
  path_risk DECIMAL(5,1),        -- Path risk score (if applicable)
  cve_id VARCHAR(50),             -- CVE ID (if applicable)
  fix_version VARCHAR(100),       -- Recommended fix version
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (analysis_id) REFERENCES analyses(id)
);
```

#### Table 4: `analysis_compliance_mapping`
```sql
CREATE TABLE analysis_compliance_mapping (
  id UUID PRIMARY KEY,
  finding_id UUID NOT NULL,
  framework VARCHAR(50),          -- NIST, DPDP, ISO27001, etc.
  clause_id VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (finding_id) REFERENCES analysis_findings(id)
);
```

#### Table 5: `analyses` (Analysis Results)
```sql
CREATE TABLE analyses (
  id UUID PRIMARY KEY,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  evidence_source VARCHAR(50),    -- json, yaml, terraform
  zero_trust_score DECIMAL(5,1),
  quantum_score DECIMAL(5,1),
  attack_path_score DECIMAL(5,1),
  supply_chain_score DECIMAL(5,1),
  compliance_score DECIMAL(5,1),
  overall_risk_score DECIMAL(5,1),
  total_findings INT,
  critical_count INT,
  high_count INT,
  medium_count INT,
  low_count INT,
  input_data JSON,               -- Store raw input for audit
  metadata JSON
);
```

### Integration API (Backend to Database)

```python
# Pseudocode for database integration

class AnalysisDB:
    def __init__(self, connection_string):
        self.db = connect(connection_string)
    
    def store_infrastructure(self, nodes, edges):
        """Store infrastructure topology"""
        for node in nodes:
            self.db.insert('infrastructure_nodes', node)
        for edge in edges:
            self.db.insert('infrastructure_edges', edge)
    
    def store_analysis(self, findings, scores):
        """Store analysis results"""
        analysis_id = self.db.insert('analyses', {
            'zero_trust_score': scores['zero_trust'],
            'quantum_score': scores['quantum'],
            'attack_path_score': scores['attack_path'],
            'supply_chain_score': scores['supply_chain'],
            'compliance_score': scores['compliance']
        })
        
        for finding in findings:
            self.db.insert('analysis_findings', {
                'analysis_id': analysis_id,
                'rule_id': finding['rule_id'],
                'severity': finding['severity'],
                'cvss': finding['cvss'],
                # ... more fields
            })
            
            # Map compliance clauses
            for clause in finding['compliance_clauses']:
                self.db.insert('analysis_compliance_mapping', {
                    'finding_id': finding_id,
                    'framework': clause['framework'],
                    'clause_id': clause['clause_id']
                })
    
    def get_analysis_history(self, limit=10):
        """Retrieve past analyses"""
        return self.db.query('SELECT * FROM analyses ORDER BY timestamp DESC LIMIT ?', limit)
    
    def get_findings_by_severity(self, severity):
        """Retrieve findings by severity level"""
        return self.db.query('SELECT * FROM analysis_findings WHERE severity = ?', severity)
```

---

## COMPONENT DEPENDENCIES

### Dependency Map

```
┌─────────────────────────────────────────────────────────────┐
│                       run_engines.py                         │
│                    (Main Orchestrator)                       │
└──────┬──────────────────────┬───────────────────────┬────────┘
       │                      │                       │
       ▼                      ▼                       ▼
   parsers/              engines/                  nx (NetworkX)
   __init__.py          __init__.py                Graph Library
       │                    │
       ├─ json_parser.py    ├─ zero_trust.py
       ├─ yaml_parser.py    ├─ quantum.py
       ├─ tf_parser.py      ├─ attack_path.py
       │                    ├─ supply_chain.py
       │                    ├─ compliance.py
       │                    └─ rules.py
       │
       ├─ hcl2 (optional)
       ├─ yaml
       └─ json (stdlib)
```

### External Dependencies

```
requirements.txt:
├── fastapi          # Web framework (for future API)
├── uvicorn          # ASGI server
├── python-multipart # Form data handling
├── passlib[bcrypt]  # Password hashing
├── python-jose      # JWT handling
├── pymongo          # MongoDB integration
├── pyyaml           # YAML parsing
├── networkx         # Graph analysis
└── openai           # Optional: AI integration
```

### Frontend Dependencies

```
package.json:
├── react             # UI framework
├── react-dom         # React DOM rendering
├── @vitejs/*         # Build plugins
├── eslint            # Code linting
└── vite              # Build tool
```

---

## API SPECIFICATIONS

### Recommended REST API Endpoints (Future Implementation)

#### 1. Analysis Endpoints

```http
POST /api/v1/analyze
Content-Type: application/json
Body: {
  "input_data": {...topology...},
  "format": "json|yaml|terraform"
}
Response: {
  "analysis_id": "uuid",
  "findings": [...],
  "scores": {...}
}

GET /api/v1/analyses/{analysis_id}
Response: {
  "id": "uuid",
  "timestamp": "ISO8601",
  "findings": [...],
  "scores": {...}
}

GET /api/v1/analyses?limit=10&offset=0
Response: {
  "total": 100,
  "analyses": [...]
}
```

#### 2. Finding Endpoints

```http
GET /api/v1/findings/severity/{severity}
Response: [
  {"rule_id": "ZT-001", "severity": "CRITICAL", ...},
  ...
]

GET /api/v1/findings/cve/{cve_id}
Response: [
  {"cve_id": "CVE-2021-23017", "affected_nodes": [...], ...}
]

GET /api/v1/compliance/mapping/{rule_id}
Response: {
  "rule_id": "ZT-001",
  "frameworks": [
    {"framework": "NIST", "clause_id": "AC-3"}
  ]
}
```

### Request/Response Examples

**Upload Infrastructure & Run Analysis:**
```http
POST /api/v1/analyze

{
  "input_data": {
    "nodes": [
      {
        "id": "database",
        "type": "database",
        "zone": "PRIVATE",
        "data_sensitivity": "CRITICAL",
        "encryption_type": "none"
      }
    ],
    "edges": [
      {
        "source": "internet",
        "target": "database",
        "auth_required": false
      }
    ]
  },
  "format": "json"
}

Response 200:
{
  "analysis_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "completed",
  "findings": [
    {
      "rule_id": "ZT-001",
      "severity": "CRITICAL",
      "cvss": 8.2,
      "description": "Public node directly accessing private DB without auth",
      "affected_nodes": ["internet", "database"]
    },
    {
      "rule_id": "Q-001",
      "severity": "CRITICAL",
      "cvss": 8.5,
      "description": "Node \"database\" uses none (QVI 100.0). Data at risk by 2025.",
      "qvi": 100.0
    }
  ],
  "scores": {
    "zero_trust": 75.0,
    "quantum": 100.0,
    "attack_path": 80.0,
    "supply_chain": 90.0,
    "compliance": 85.0
  }
}
```

---

## INTEGRATION GUIDE

### Step 1: Backend API Integration

**Setup FastAPI Server:**

```python
# main.py (new file to create)

from fastapi import FastAPI, HTTPException, UploadFile, File
from typing import Optional
import json
from run_engines import main as run_analysis
from parsers import parse_input
from engines import *

app = FastAPI(title="Quantum Security Analysis")

@app.post("/api/v1/analyze")
async def analyze_infrastructure(data: dict):
    """
    Main analysis endpoint
    Input: infrastructure topology
    Output: findings & scores
    """
    try:
        # Parse input
        parsed = parse_input(json.dumps(data['input_data']), data.get('format', 'json'))
        
        # Build graph
        G = build_graph(parsed)
        
        # Run engines
        findings = []
        zt, zt_score = zero_trust_engine(G)
        findings.extend(zt)
        
        # ... (run other engines)
        
        # Store in database
        # db.store_analysis(findings, scores)
        
        return {
            "status": "success",
            "findings": findings,
            "scores": scores
        }
    
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/v1/analyses")
async def get_analyses(limit: int = 10, offset: int = 0):
    """Retrieve analysis history"""
    # return db.get_analysis_history(limit, offset)
    pass

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

### Step 2: Database Connection

```python
# db.py (new file to create)

import pymongo
from datetime import datetime

class AnalysisDatabase:
    def __init__(self, connection_string):
        self.client = pymongo.MongoClient(connection_string)
        self.db = self.client['quantum_analysis']
    
    def store_analysis(self, findings, scores, input_data):
        """Store analysis results in MongoDB"""
        analysis_doc = {
            'timestamp': datetime.utcnow(),
            'findings': findings,
            'scores': scores,
            'input_data': input_data
        }
        result = self.db['analyses'].insert_one(analysis_doc)
        return str(result.inserted_id)
    
    def get_critical_findings(self):
        """Retrieve all critical findings"""
        return list(self.db['findings'].find({'severity': 'CRITICAL'}))
    
    def get_compliance_report(self, framework):
        """Generate compliance report for specific framework"""
        pipeline = [
            {'$match': {'compliance_clauses.framework': framework}},
            {'$group': {'_id': '$compliance_clauses.clause_id', 'count': {'$sum': 1}}}
        ]
        return list(self.db['findings'].aggregate(pipeline))

# Usage:
# db = AnalysisDatabase("mongodb://localhost:27017")
# analysis_id = db.store_analysis(findings, scores, input_data)
```

### Step 3: Frontend Integration

```jsx
// src/api/analysisService.js (new file to create)

const API_BASE = 'http://localhost:8000/api/v1';

export const runAnalysis = async (infrastructureData) => {
  const response = await fetch(`${API_BASE}/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      input_data: infrastructureData,
      format: 'json'
    })
  });
  
  if (!response.ok) throw new Error('Analysis failed');
  return response.json();
};

export const getAnalyses = async (limit = 10) => {
  const response = await fetch(`${API_BASE}/analyses?limit=${limit}`);
  return response.json();
};

export const getFindings = async (severity) => {
  const response = await fetch(`${API_BASE}/findings/severity/${severity}`);
  return response.json();
};
```

### Step 4: Deployment Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    DEPLOYMENT ARCHITECTURE                   │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Frontend (React + Vite)                             │   │
│  │  - Port: 3000                                       │   │
│  │  - Built assets served by Vite dev server          │   │
│  └──────────────┬───────────────────────────────────────┘   │
│                 │ HTTP/REST calls                             │
│                 ▼                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Backend (FastAPI + Uvicorn)                         │   │
│  │  - Port: 8000                                       │   │
│  │  - API endpoints: /api/v1/...                      │   │
│  │  - Engine orchestration                            │   │
│  └──────────────┬───────────────────────────────────────┘   │
│                 │ SQL/Network queries                        │
│                 ▼                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Database (MongoDB/PostgreSQL)                       │   │
│  │  - Store: analyses, findings, infrastructure        │   │
│  │  - Index: rule_id, severity, timestamp              │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## SUMMARY TABLE

| Component | Type | Purpose | Input | Output | Dependencies |
|-----------|------|---------|-------|--------|--------------|
| `run_engines.py` | Orchestrator | Main entry point | JSON topology | Findings + scores | parsers, engines |
| `json_parser.py` | Parser | Parse JSON topology | JSON string | Normalized nodes/edges | json (stdlib) |
| `yaml_parser.py` | Parser | Parse YAML/K8s | YAML string | Normalized nodes/edges | pyyaml, json_parser |
| `tf_parser.py` | Parser | Parse Terraform | HCL string | Normalized nodes/edges | hcl2 (optional), regex |
| `zero_trust.py` | Engine | Security rules validation | DiGraph | Findings + score | networkx, rules |
| `quantum.py` | Engine | Quantum threat assessment | DiGraph | Findings + QVI score | networkx, math |
| `attack_path.py` | Engine | Attack surface discovery | DiGraph | Findings + path-risk | networkx, math |
| `supply_chain.py` | Engine | Vulnerability scanning | DiGraph | Findings + cve-score | networkx |
| `compliance.py` | Engine | Compliance mapping | Findings | Enriched findings | None |
| `rules.py` | Config | Rule definitions | Rule factory | Rule registry | networkx |
| Frontend | UI | User interface | API calls | Visual reports | react, vite |

---

## RECOMMENDED NEXT STEPS FOR FULL INTEGRATION

1. **Implement REST API** with FastAPI
2. **Add Database Layer** with MongoDB/PostgreSQL
3. **Build Frontend UI** for visualization
4. **Add Authentication** (JWT via python-jose)
5. **Configure CI/CD** Pipeline
6. **Add Logging & Monitoring**
7. **Create Admin Dashboard** for compliance reporting
8. **Implement Real-time Notifications** for critical findings
9. **Add Webhook Support** for external integrations
10. **Create Data Export** (CSV, PDF reports)

---

**Report Generated:** March 22, 2026  
**Total Components:** 10 files + 2 folders  
**Lines of Code:** ~1,800 (backend) + ~300 (frontend boilerplate)  
**Supported Input Formats:** 3 (JSON, YAML, Terraform)  
**Analysis Engines:** 5 (Zero Trust, Quantum, Attack Path, Supply Chain, Compliance)  
**Compliance Frameworks:** 2 (NIST, DPDP)
