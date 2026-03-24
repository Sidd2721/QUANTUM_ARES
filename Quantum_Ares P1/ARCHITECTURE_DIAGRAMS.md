# QUANTUM SECURITY ANALYSIS - VISUAL ARCHITECTURE DIAGRAMS

---

## DIAGRAM 1: SYSTEM ARCHITECTURE OVERVIEW

```
╔════════════════════════════════════════════════════════════════════════════════╗
║                      QUANTUM SECURITY ANALYSIS PLATFORM                        ║
║                            End-to-End Pipeline                                 ║
╚════════════════════════════════════════════════════════════════════════════════╝

┌─────────────────────────────────────────────────────────────────────────────┐
│ INPUT LAYER                                                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Input Files (Multiple Formats)                                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │   JSON       │  │   YAML       │  │ Terraform    │  │   Raw Text   │ │
│  │  Topology    │  │ Kubernetes   │  │     HCL      │  │  (K8s YAML)  │ │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘ │
│         │                  │                   │                │         │
└─────────┼──────────────────┼───────────────────┼────────────────┼─────────┘
          │                  │                   │                │
          └──────────────────┴───────────────────┴────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ PARSER LAYER (parsers/__init__.py)                                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  parse_input(raw_text, filename)                                           │
│  ├─ Detect file extension                                                  │
│  ├─ Route to appropriate parser:                                           │
│  │  ├─→ parers/json_parser.py ({"nodes": [], "edges": []})               │
│  │  ├─→ parsers/yaml_parser.py (Kind, metadata, spec)                     │
│  │  └─→ parsers/tf_parser.py (resource "type" "name" {})                 │
│  └─ Validate & normalize                                                  │
│     └─→ {nodes[], edges[], evidence_source}                               │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ GRAPH CONSTRUCTION (run_engines.py::build_graph)                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  NetworkX DiGraph Creation:                                                │
│  ├─ nx.DiGraph() initialization                                            │
│  ├─ Add all nodes with attributes                                          │
│  │  └─→ node[id]: {type, zone, sensitivity, encryption, ...}             │
│  ├─ Add all edges with attributes                                          │
│  │  └─→ edge[source→target]: {auth_required, tls_enforced, mfa_required}│
│  └─ Return: G (NetworkX DiGraph)                                           │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
                             │
                             ▼ G: Infrastructure Graph
┌──────────────────────────────────────────────────────────────────────────────┐
│ ENGINE EXECUTION LAYER (engines/)                                            │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  Five Independent Analysis Engines (Parallel Execution)                      │
│                                                                               │
│  ┌────────────────────────┐  ┌────────────────────────┐  ┌────────────────┐│
│  │ zero_trust_engine(G)   │  │ quantum_engine(G)      │  │attack_path...  ││
│  ├────────────────────────┤  ├────────────────────────┤  ├────────────────┤│
│  │ • 5 security rules     │  │ • QVI calculation      │  │• Path discovery││
│  │ • Auth validation      │  │ • Encryption scoring   │  │• Risk ranking  ││
│  │ • Zero Trust checks    │  │ • Quantum threats      │  │• Attack vectors││
│  │                        │  │                        │  │                ││
│  │ Output:                │  │ Output:                │  │ Output:        ││
│  │ • Findings[] (5 rules) │  │ • Findings[(QVI > 40)] │  │ • Findings[top 10]
│  │ • Score: 0-100        │  │ • Score: 0-100        │  │ • Score: 0-100  ││
│  └────────────────────────┘  └────────────────────────┘  └────────────────┘│
│                                                                               │
│  ┌────────────────────────┐  ┌────────────────────────┐                     │
│  │supply_chain_engine(G)  │  │  rules.py (Supporting) │                     │
│  ├────────────────────────┤  ├────────────────────────┤                     │
│  │ • CVE scanning         │  │ • Rule registry (5)    │                     │
│  │ • Container images     │  │ • Evaluation logic     │                     │
│  │ • Dependency check     │  │ • Risk calculation     │                     │
│  │                        │  │                        │                     │
│  │ Output:                │  │ Input: G, RULE_REG     │                     │
│  │ • Findings[CVEs]       │  │ Output: (findings[],   │                     │
│  │ • Score: 0-100        │  │         score)          │                     │
│  └────────────────────────┘  └────────────────────────┘                     │
│                                                                               │
│  Findings[] aggregation:                                                     │
│  finding_list = zt + quantum + ap + sc (all combined)                        │
│                                                                               │
└──────────────────────────────────────────────────────────────────────────────┘
                             │
                             ▼ findings[], individual_scores
┌────────────────────────────────────────────────────────────────────────────┐
│ COMPLIANCE ENRICHMENT (compliance.py)                                      │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ For each finding in findings[]:                                            │
│   Look up rule_id in COMPLIANCE_MAP                                        │
│   Attach: compliance_clauses = [{framework, clause_id}, ...]              │
│                                                                             │
│ Compliance Frameworks Supported:                                           │
│  • NIST (US Federal Standards)    - AC-3, SC-28, CA-7, ...               │
│  • DPDP (India Data Protection)   - 8(3), ...                            │
│                                                                             │
│ Output:                                                                     │
│ • Enriched findings with compliance_clauses[]                             │
│ • Compliance score: (mapped_findings / total) × 100                        │
│                                                                             │
└────────────────────────────────────────────────────────────────────────────┘
                             │
                             ▼ Final enriched findings + all_scores
┌────────────────────────────────────────────────────────────────────────────┐
│ OUTPUT LAYER                                                               │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Results Structure:                                                         │
│  {                                                                          │
│    "findings": [                                                           │
│      {                                                                      │
│        "rule_id": "ZT-001|Q-001|AP-001|SC-001",                            │
│        "severity": "CRITICAL|HIGH|MEDIUM|LOW",                             │
│        "cvss": 8.5,                                                        │
│        "affected_nodes": ["node1", "node2"],                               │
│        "description": "...",                                               │
│        "remediation": "...",                                               │
│        "compliance_clauses": [{"framework": "NIST", "clause_id": "AC-3"}]│
│        // ... other fields depending on engine                             │
│      },                                                                    │
│      ...                                                                   │
│    ],                                                                      │
│    "scores": {                                                             │
│      "zero_trust": 75,                                                     │
│      "quantum": 45,                                                        │
│      "attack_path": 82,                                                    │
│      "supply_chain": 91,                                                   │
│      "compliance": 88                                                      │
│    }                                                                       │
│  }                                                                         │
│                                                                             │
│  ▼ Store in database / Send to frontend / Export to files                  │
│                                                                             │
└────────────────────────────────────────────────────────────────────────────┘
```

---

## DIAGRAM 2: DATA MODEL & GRAPH STRUCTURE

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  INFRASTRUCTURE TOPOLOGY AS DIRECTED GRAPH                                   │
│  (NetworkX DiGraph - Nodes and Edges)                                       │
└─────────────────────────────────────────────────────────────────────────────┘

Example Network Topology:

                    ┌──────────────┐
                    │   Internet   │ (PUBLIC zone)
                    │  Node ID:    │
                    │ "internet"   │
                    └──────┬───────┘
                           │ Edge 1 (auth_required: false)
                           ▼
                    ┌──────────────────┐
                    │   Web Server     │ (DMZ zone)
                    │  Node ID:        │
                    │  "web_server"    │
                    │  Image:          │
                    │  nginx:1.20.1    │
                    └──────┬───────────┘
                           │ Edge 2 (auth_required: false)
                           ▼
                    ┌──────────────────┐
                    │  App Server      │ (INTERNAL zone)
                    │  Node ID:        │
                    │  "app_server"    │
                    └──────┬───────────┘
                           │ Edge 3 (auth_required: false, mfa_required: false)
                           ▼
                    ┌──────────────────────────────┐
                    │      Database                │ (PRIVATE zone)
                    │  Node ID: "database"         │
                    │  Sensitivity: CRITICAL       │
                    │  Encryption: none            │ ◄─── VULNERABILITIES
                    │  Retention: 10 years         │
                    └──────────────────────────────┘


NODE STRUCTURE (Graph Attributes):

{
  "id": "web_server",
  "type": "server",
  "zone": "DMZ",
  "data_sensitivity": "LOW",
  "encryption_type": "none",
  "container_image": "nginx:1.20.1",
  "retention_years": 0,
  "iam_roles": ["web-viewer"],
  "known_exploit": false,
  "cvss": 5.0
}

EDGE STRUCTURE (Connection Attributes):

{
  "source": "internet",
  "target": "web_server",
  "auth_required": false,        ◄─── Security Gap!
  "tls_enforced": false,         ◄─── Security Gap!
  "mfa_required": false
}


VULNERABILITY DETECTION FLOW:

┌─ Graph traversal (all nodes)
│
├─ Check 1: encryption_type == "none" AND data_sensitivity == "CRITICAL"
│           └─→ Finding: ZT-003 (No encryption)
│
├─ Check 2: Zone == "PUBLIC" AND can_reach(DATABASE) WITHOUT auth
│           └─→ Finding: ZT-001 (Public to Private DB)
│               └─→ Finding: AP-001 (Attack Path)
│
├─ Check 3: Container image in NVD_SNAPSHOT with CVE
│           └─→ Finding: SC-001 (Supply Chain: nginx:1.20.1 CVE-2021-23017)
│
└─ Check 4: Encryption type in VULN_SCORES AND retention > 0
            └─→ Finding: Q-001 (Quantum threat)
```

---

## DIAGRAM 3: ENGINE SCORING MODEL

```
┌────────────────────────────────────────────────────────────────────────────┐
│  SCORE CALCULATION ACROSS ALL ENGINES                                      │
└────────────────────────────────────────────────────────────────────────────┘

SCORING METHODOLOGY:
Each engine generates:
  • Individual findings[] with severity levels
  • Aggregate score (0-100) based on findings

ENGINE 1: ZERO TRUST
────────────────────────────────────────────────────────────────

FINDING SEVERITY PENALTIES:
  CRITICAL   → -15 per finding
  HIGH       → -8  per finding
  MEDIUM     → -3  per finding
  LOW        → -1  per finding

CALCULATION:
  score = max(0, 100 - total_penalties)

EXAMPLE:
  2 CRITICAL + 1 HIGH = 100 - (2×15 + 1×8) = 100 - 38 = 62

CONDITION TRIGGERING CRITICAL FINDING:
  ├─ Public access to private DB without auth (ZT-001)
  ├─ Sensitive data without encryption (ZT-003)
  └─ Wildcard IAM permissions (ZT-005)


ENGINE 2: QUANTUM
────────────────────────────────────────────────────────────────

QUANTUM VULNERABILITY INDEX (QVI) PER NODE:
  QVI = data_sensitivity_weight × encryption_vulnerability × (1 + retention_years/10)
  
  Capped at 100

DATA SENSITIVITY WEIGHTS:
  LOW        0.2
  MEDIUM     0.5
  HIGH       0.8
  CRITICAL   1.0

ENCRYPTION VULNERABILITY SCORES:
  none              100 (no protection)
  unknown           50  (uncertified)
  RSA-1024          95  (classical cryptography)
  RSA-2048          85
  AES-128           40
  AES-256           15  (acceptable)
  ML-KEM-768        5   (post-quantum safe)
  Kyber-768         5   (post-quantum safe)

QVI EXAMPLES:
  1. CRITICAL data, no encryption, 10-year retention
     QVI = 1.0 × 100 × (1 + 10/10) = 200 → capped to 100
     Risk Year = 2025 (IMMEDIATE)
     Severity = CRITICAL

  2. HIGH data, RSA-2048, 5-year retention
     QVI = 0.8 × 85 × (1 + 5/10) = 0.8 × 85 × 1.5 = 102 → capped to 100
     Risk Year = 2025
     Severity = CRITICAL

  3. MEDIUM data, AES-256, 2-year retention
     QVI = 0.5 × 15 × (1 + 2/10) = 0.5 × 15 × 1.2 = 9
     Risk Year = 2033
     Severity = LOW

AGGREGATE QUANTUM SCORE:
  Overall QVI = (Σ(node_QVI × weight)) / (Σ(weight))


ENGINE 3: ATTACK PATH
────────────────────────────────────────────────────────────────

PATH DISCOVERY:
  From: PUBLIC nodes → To: HIGH/CRITICAL data nodes
  Max path length: 6 hops

RISK CALCULATION PER PATH:
  risk = 1.0
  
  For each edge in path:
    if not auth_required:     risk *= 3.0
    if source has exploit:    risk *= 2.0
    target_cvss impact:       risk *= (1 + target_cvss/10)
  
  Length penalty:             risk += log₁₀(path_length + 1)

SEVERITY:
  risk > 100  → CRITICAL
  risk > 50   → HIGH
  risk ≤ 50   → MEDIUM

SCORE:
  top_critical = count of paths with risk > 100
  top_high = count of paths with risk > 50
  top_medium = count of paths with risk ≤ 50
  
  score = max(0, 100 - (critical×20 + high×10 + medium×4))

EXAMPLE PATH:
  internet → web_server → app_server → database
  
  Edge 1 (internet→web): no auth (×3), no exploit (×1)
  Edge 2 (web→app): no auth (×3), no exploit (×1)
  Edge 3 (app→db): no auth (×3), no exploit (×1), target_cvss=10
  Path penalty: log₁₀(4+1) = 0.7
  
  risk = 1.0 × 3 × 3 × 3 × (1 + 10/10) × 3 × (1 + 10/10) × 0.7
       ≈ 567 → CRITICAL


ENGINE 4: SUPPLY CHAIN
────────────────────────────────────────────────────────────────

VULNERABILITY LOOKUP:
  Extract: container_image from each node
  Query NVD_SNAPSHOT for CVEs
  
  NVD_SNAPSHOT = {
    'nginx:1.20.1': [('CVE-2021-23017', 9.8, 'nginx:1.25.3')],
    ...
  }

SEVERITY BY CVSS:
  CVSS ≥ 9.0  → CRITICAL
  CVSS ≥ 7.0  → HIGH
  CVSS ≥ 4.0  → MEDIUM
  CVSS < 4.0  → LOW

SCORE:
  score = max(0, 100 - (
    critical_count × 25 +
    high_count × 12 +
    medium_count × 4 +
    low_count × 1
  ))

EXAMPLE:
  nginx:1.20.1 → CVE-2021-23017 (CVSS 9.8) → CRITICAL
  
  findings.append({
    'cve_id': 'CVE-2021-23017',
    'remediation': 'Upgrade to nginx:1.25.3',
    'severity': 'CRITICAL'
  })


ENGINE 5: COMPLIANCE
────────────────────────────────────────────────────────────────

COMPLIANCE MAPPING:
  rule_id → compliance_clauses

  'ZT-001': [{'framework': 'NIST', 'clause_id': 'AC-3'}]
  'Q-001':  [{'framework': 'NIST', 'clause_id': 'SC-28'}]
  'SC-001': [{'framework': 'DPDP', 'clause_id': '8(3)'}]

SCORE CALCULATION:
  mapped_findings = count of findings with compliance_clauses
  
  score = (mapped_findings / total_findings) × 100
  
  If all findings map: 100
  If 50% map: 50
  If none map: 0


OVERALL RISK ASSESSMENT (AGGREGATED):
════════════════════════════════════════════════════════════════

overall_risk = 100 - (
  0.25 × zero_trust_score +
  0.20 × quantum_score +
  0.20 × attack_path_score +
  0.20 × supply_chain_score +
  0.15 × compliance_score
)

EXAMPLE CALCULATION:
  ZT: 75
  Q:  45
  AP: 82
  SC: 91
  Compliance: 88

  overall_risk = 100 - (0.25×75 + 0.20×45 + 0.20×82 + 0.20×91 + 0.15×88)
               = 100 - (18.75 + 9 + 16.4 + 18.2 + 13.2)
               = 100 - 75.55
               = 24.45 (LOW RISK)

RISK LEVEL INTERPRETATION:
  0-25    → GREEN   (Low Risk)
  26-50   → YELLOW  (Medium Risk)
  51-75   → ORANGE  (High Risk)
  76-100  → RED     (Critical Risk)
```

---

## DIAGRAM 4: FINDING STRUCTURE & ENRICHMENT

```
┌────────────────────────────────────────────────────────────────────────────┐
│  FINDING GENERATION & ENRICHMENT PIPELINE                                  │
└────────────────────────────────────────────────────────────────────────────┘

FINDING STRUCTURE (Generated by each engine):

{
  // Core fields (all findings)
  "rule_id": "ZT-001",                 // Unique rule identifier
  "severity": "CRITICAL",              // CRITICAL | HIGH | MEDIUM | LOW
  "mitre_id": "T1046",                 // MITRE ATT&CK technique ID
  "cvss": 8.2,                         // CVSS v3.1 score (0-10)
  "affected_nodes": ["node1", "node2"],// Infrastructure components
  "description": "...",                // Human readable description
  "remediation": "...",                // How to fix
  "plugin": "zero_trust",              // Which engine generated
  
  // Business context
  "business_impact": "...",            // What could go wrong
  "business_risk": "...",              // Risk category
  
  // Engine-specific fields (added by relevant engine)
  "qvi": 100.0,                        // Quantum: QVI score
  "risk_year": 2025,                   // Quantum: Year of risk
  "path_risk": 87.3,                   // Attack Path: Risk value
  "cve_id": "CVE-2021-23017",         // Supply Chain: CVE ID
  "fix_version": "nginx:1.25.3",      // Supply Chain: Fix version
  
  // Added by compliance enrichment
  "compliance_clauses": [
    {"framework": "NIST", "clause_id": "AC-3"},
    {"framework": "DPDP", "clause_id": "8(3)"}
  ]
}

ENRICHMENT PIPELINE:

Step 1: Engine Execution
┌───────────────────────────────────────────────────────────────────┐
│ BEFORE Compliance Enrichment:                                    │
│ {                                                                 │
│   "rule_id": "ZT-001",                                           │
│   "severity": "CRITICAL",                                        │
│   "compliance_clauses": []     ◄── EMPTY                         │
│ }                                                                 │
└───────────────────────────────────────────────────────────────────┘

Step 2: Compliance Enrichment (compliance.py)
┌───────────────────────────────────────────────────────────────────┐
│ COMPLIANCE_MAP Lookup:                                            │
│   'ZT-001' → [{'framework': 'NIST', 'clause_id': 'AC-3'}]       │
│                                                                   │
│ AFTER Enrichment:                                                │
│ {                                                                 │
│   "rule_id": "ZT-001",                                           │
│   "severity": "CRITICAL",                                        │
│   "compliance_clauses": [                                        │
│     {"framework": "NIST", "clause_id": "AC-3"}  ◄── ENRICHED    │
│   ]                                                               │
│ }                                                                 │
└───────────────────────────────────────────────────────────────────┘

Step 3: Database Storage (Future)
┌───────────────────────────────────────────────────────────────────┐
│ Store in: analysis_findings table                                █
│ Index by: rule_id, severity, affected_nodes[], timestamp         │
└───────────────────────────────────────────────────────────────────┘

Step 4: Reporting & Export
┌───────────────────────────────────────────────────────────────────┐
│ Generate Reports:                                                 │
│ • Executive Summary (by severity)                                 │
│ • Compliance Report (by framework)                                │
│ • Remediation Plan (by priority)                                  │
│ • Risk Timeline (Risk Year assessment)                            │
└───────────────────────────────────────────────────────────────────┘
```

---

## DIAGRAM 5: PARSER ROUTING LOGIC

```
┌────────────────────────────────────────────────────────────────────────────┐
│  MULTI-FORMAT PARSER ROUTING                                               │
│  (parsers/__init__.py)                                                     │
└────────────────────────────────────────────────────────────────────────────┘

INPUT: raw_text (infrastructure definition), filename

                            ▼
                    parse_input(raw_text, filename)
                            │
                            ├─ Extract file extension
                            │
    ┌───────────────────────┼───────────────────────┐
    │                       │                       │
    ▼                       ▼                       ▼
.tf/.hcl                .yaml/.yml              .json or other
    │                       │                       │
    ▼                       ▼                       ▼
parse_terraform()     parse_yaml()             parse_json()
    │                       │                       │
    ├─ Tier 1:             ├─ yaml.safe_load()    ├─ json.loads()
    │  hcl2 library        │                       ├─ Validate syntax
    │                      ├─ Check format:        ├─ Verify nodes
    ├─ Tier 2:             │  Has "nodes"?        ├─ Verify edges
    │  Regex fallback      │  │                   ├─ Check constraints
    │  pattern: r'\        │  ├─→ parse_json()    │  ├─ Max 200 nodes
    │  resource\s+"(\     │  │   (convert)       │  ├─ Unique IDs
    │  w+)"\s+"(\w+)"'    │  │                   │  ├─ No self-loops
    │                      │  └─→ parse_yaml()    │  └─ Valid zones
    ├─ Tier 3:             │     (K8s format)      │
    │  Fail with helpful   │                       └─→ Return normalized
    │  error message       ├─ Extract metadata:   {nodes, edges}
    │                      │  ├─ kind → type
    └─ Return nodes[]      │  ├─ name → id
       edges[] (empty)     │  ├─ container→
    {nodes, edges,         │    image
     evidence_source}      │  └─ namespace
                           │
                           └─→ Return normalized
                              {nodes, edges}
                                   │
                                   │
                        ┌──────────┴──────────┐
                        │                     │
                        ▼                     ▼
                  normalized format    ┌─ VALIDATION ─┐
                  {                    │               │
                    nodes: [           │ ✓ JSON syntax │
                      {               │ ✓ Node IDs    │
                        id,           │ ✓ Zones       │
                        type,         │ ✓ Edges       │
                        zone,         │ ✓ References  │
                        ...           │               │
                      }               └───────────────┘
                    ],                      │
                    edges: [                ▼
                      {                 Success
                        source,
                        target,
                        ...
                      }
                    ],
                    evidence_source
                  }

ERROR HANDLING:

parse_json() throws ParseError:
  • Invalid JSON: json.JSONDecodeError
  • No nodes: "At least one node is required"
  • Too many nodes: "Graph exceeds 200-node limit"
  • Duplicate IDs: "Duplicate node id: {id}"
  • Invalid zone: "Invalid zone '{zone}' in node '{id}'"
  • Invalid sensitivity: "Invalid sensitivity in node '{id}'"
  • Edge errors: "Edge source/target not found"
  • Self-loops: "Self-loop detected on node '{src}'"

parse_yaml() throws ParseError:
  • Invalid YAML: yaml.YAMLError
  • No resources found: "No valid resources found in YAML"
  • Falls through to parse_json() if structure matches

parse_terraform() throws ParseError:
  • All tiers fail: "Terraform parsing failed"
  • Helpful suggestion: "Convert to JSON using: terraform show -json"
```

---

## DIAGRAM 6: DATABASE SCHEMA RELATIONSHIPS

```
┌────────────────────────────────────────────────────────────────────────────┐
│  DATABASE ENTITY RELATIONSHIP DIAGRAM (PostgreSQL/MongoDB Collections)     │
└────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────┐
│      analyses                    │
├──────────────────────────────────┤
│ id (UUID, PK)                   │
│ timestamp (TIMESTAMP)            │
│ evidence_source (VARCHAR)        │
│ zero_trust_score (DECIMAL)       │
│ quantum_score (DECIMAL)          │
│ attack_path_score (DECIMAL)      │
│ supply_chain_score (DECIMAL)     │
│ compliance_score (DECIMAL)       │
│ overall_risk_score (DECIMAL)     │
│ total_findings (INT)             │
│ critical_count (INT)             │
│ high_count (INT)                 │
│ medium_count (INT)               │
│ low_count (INT)                  │
│ input_data (JSON)                │
│ metadata (JSON)                  │
└──────────────────────────────────┘
         │ (1:N)
         ├─────────────────────────────────────┐
         │                                     │
         ▼                                     ▼
┌─────────────────────────────┐    ┌──────────────────────────┐
│ analysis_findings           │    │infrastructure_nodes     │
├─────────────────────────────┤    ├──────────────────────────┤
│ id (UUID, PK)              │    │ id (UUID, PK)           │
│ analysis_id (UUID, FK) ────┼──→ │ node_id (VARCHAR)       │
│ rule_id (VARCHAR)          │    │ node_type (VARCHAR)     │
│ severity (VARCHAR)         │    │ zone (VARCHAR)          │
│ mitre_id (VARCHAR)         │    │ data_sensitivity(VAR)   │
│ cvss (DECIMAL)             │    │ encryption_type (VAR)   │
│ description (TEXT)         │    │ container_image (VAR)   │
│ remediation (TEXT)         │    │ retention_years (INT)   │
│ business_impact (TEXT)     │    │ iam_roles (JSON)        │
│ business_risk (TEXT)       │    │ known_exploit (BOOL)    │
│ affected_nodes (JSON)      │    │ created_at (TIMESTAMP)  │
│ plugin (VARCHAR)           │    │ updated_at (TIMESTAMP)  │
│ qvi (DECIMAL) [optional]   │    │ metadata (JSON)         │
│ risk_year (INT) [optional] │    └──────────────────────────┘
│ path_risk (DECIMAL) [opt]  │           (1:N)
│ cve_id (VARCHAR) [optional]│            │
│ fix_version (VARCHAR)      │            ▼
│ created_at (TIMESTAMP)     │    ┌──────────────────────────┐
└─────────────────────────────┘    │infrastructure_edges     │
         │ (1:N)                   ├──────────────────────────┤
         │                         │ id (UUID, PK)           │
         ▼                         │ source_node_id (FK)     │
┌──────────────────────────────┐   │ target_node_id (FK)     │
│ analysis_compliance_mapping  │   │ auth_required (BOOL)    │
├──────────────────────────────┤   │ tls_enforced (BOOL)     │
│ id (UUID, PK)               │   │ mfa_required (BOOL)     │
│ finding_id (UUID, FK) ──┐   │   │ edge_cvss (DECIMAL)     │
│ framework (VARCHAR)     │   │   │ created_at (TIMESTAMP)  │
│ clause_id (VARCHAR)     │   │   └──────────────────────────┘
│ created_at (TIMESTAMP)  │   │
└──────────────────────────────┘   

INDEXES FOR PERFORMANCE:

analyses:
  • CREATE INDEX idx_analyses_timestamp ON analyses(timestamp DESC)
  • CREATE INDEX idx_analyses_severity ON analyses(critical_count, high_count)

analysis_findings:
  • CREATE INDEX idx_findings_analysis ON analysis_findings(analysis_id)
  • CREATE INDEX idx_findings_rule ON analysis_findings(rule_id)
  • CREATE INDEX idx_findings_severity ON analysis_findings(severity)
  • CREATE INDEX idx_findings_created ON analysis_findings(created_at)

infrastructure_nodes:
  • CREATE UNIQUE INDEX idx_node_id ON infrastructure_nodes(node_id)
  • CREATE INDEX idx_zone ON infrastructure_nodes(zone)
  • CREATE INDEX idx_sensitivity ON infrastructure_nodes(data_sensitivity)

query examples:

-- Get all critical findings from last analysis
SELECT f.* FROM analysis_findings f
JOIN analyses a ON f.analysis_id = a.id
WHERE f.severity = 'CRITICAL'
ORDER BY a.timestamp DESC LIMIT 1;

-- Get compliance mapping for all findings
SELECT f.*, acm.framework, acm.clause_id 
FROM analysis_findings f
LEFT JOIN analysis_compliance_mapping acm ON f.id = acm.finding_id
WHERE f.analysis_id = ?;

-- Find infrastructure components with quantum risk
SELECT n.*, f.qvi, f.risk_year
FROM infrastructure_nodes n
JOIN analysis_findings f ON JSON_CONTAINS(f.affected_nodes, JSON_QUOTE(n.node_id))
WHERE f.plugin = 'quantum' AND f.rule_id = 'Q-001';
```

---

## DIAGRAM 7: DEPLOYMENT & INTEGRATION ARCHITECTURE

```
┌────────────────────────────────────────────────────────────────────────────┐
│  COMPLETE DEPLOYMENT ARCHITECTURE                                          │
└────────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────────┐
│ CLIENT TIER                                                                │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Web Browser / Frontend Application                                        │
│  ┌──────────────────────────────────────────────────────┐               │
│  │  React App (port 3000)                               │               │
│  │  - Vite dev server / build output                    │               │
│  │  - Components: Dashboard, Reports, Alerts            │               │
│  │  - Makes HTTP/REST calls to Backend API              │               │
│  └──────────────────────────────────────────────────────┘               │
│                                                                             │
│  Infrastructure as Code / CLI Tools                                        │
│  ┌──────────────────────────────────────────────────────┐               │
│  │  Terraform / Kubernetes / JSON definitions           │               │
│  │  - Input files (.tf, .yaml, .json)                  │               │
│  │  - Uploaded via API or file drop                     │               │
│  └──────────────────────────────────────────────────────┘               │
│                                                                             │
└────────────────────────────────────────────────────────────────────────────┘
                                 │
                    HTTP/REST (JSON over HTTPS)
                    ├─ POST   /api/v1/analyze
                    ├─ GET    /api/v1/analyses
                    ├─ GET    /api/v1/findings/{severity}
                    └─ GET    /api/v1/compliance/mapping/{rule_id}
                                 │
                                 ▼
┌────────────────────────────────────────────────────────────────────────────┐
│ APPLICATION TIER (Backend)                                                 │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  FastAPI Server (port 8000)                                                │
│  ┌─ main.py (new - API server)                                            │
│  │  ├─ Route /api/v1/analyze          → orchestrator pipeline            │
│  │  ├─ Route /api/v1/analyses         → fetch from DB                    │
│  │  ├─ Route /api/v1/findings         → query findings                   │
│  │  └─ Route /api/v1/compliance       → compliance reports               │
│  │                                                                        │
│  └─ Uvicorn ASGI Server                                                  │
│     (Async Python server)                                                │
│                                                                             │
│  Core Processing Layer (Existing Python Modules)                          │
│  ├─ run_engines.py        ──┐                                            │
│  │                          ├─→ Orchestrate Analysis                      │
│  ├─ parsers/               │                                             │
│  │  ├─ __init__.py (router)                                              │
│  │  ├─ json_parser.py                                                    │
│  │  ├─ yaml_parser.py                                                    │
│  │  └─ tf_parser.py        ──┐                                           │
│  │                          ├─→ Parse Infrastructure                      │
│  └─ engines/               │                                             │
│     ├─ zero_trust.py       │                                             │
│     ├─ quantum.py          │                                             │
│     ├─ attack_path.py      ├─→ Execute Analysis Engines                  │
│     ├─ supply_chain.py     │                                             │
│     ├─ compliance.py       │                                             │
│     └─ rules.py            ──┘                                           │
│                                                                             │
│  Database Integration Layer (new)                                          │
│  ├─ db.py                                                                 │
│  │  └─ AnalysisDatabase class                                            │
│  │     ├─ store_analysis()                                               │
│  │     ├─ get_analyses()                                                 │
│  │     ├─ get_findings_by_severity()                                     │
│  │     └─ get_compliance_report()                                        │
│  │                                                                        │
│  └─ Pydantic Models (validation)                                          │
│     ├─ NodeModel                                                         │
│     ├─ EdgeModel                                                         │
│     ├─ FindingModel                                                      │
│     └─ AnalysisResultModel                                               │
│                                                                             │
│  External Service Integrations (Optional)                                  │
│  ├─ OpenAI (for AI-powered remediation)                                  │
│  ├─ Slack (for alerts)                                                   │
│  └─ GitHub (for issue creation)                                          │
│                                                                             │
└────────────────────────────────────────────────────────────────────────────┘
                                 │
                    Database Drivers (asyncpg/pymongo)
                                 │
                                 ▼
┌────────────────────────────────────────────────────────────────────────────┐
│ DATA TIER                                                                  │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  PostgreSQL / MongoDB                                                      │
│  ├─ Database: quantum_analysis                                            │
│  │                                                                        │
│  ├─ Tables/Collections:                                                  │
│  │  ├─ analyses                       (Analysis metadata & scores)       │
│  │  ├─ analysis_findings              (Individual findings)              │
│  │  ├─ analysis_compliance_mapping    (Framework mapping)                │
│  │  ├─ infrastructure_nodes           (Infrastructure components)        │
│  │  ├─ infrastructure_edges           (Connections)                      │
│  │  └─ audit_logs                     (Access logging)                   │
│  │                                                                        │
│  └─ Indexes for Performance                                              │
│     ├─ findings by severity, timestamp                                   │
│     ├─ analyses by timestamp                                             │
│     └─ affected_nodes (JSON path indexing)                               │
│                                                                             │
└────────────────────────────────────────────────────────────────────────────┘

SCALING CONSIDERATIONS:

┌─ Horizontal Scaling:
│  ├─ Load Balancer (nginx/haproxy) → multiple FastAPI instances
│  ├─ Database replication for reads
│  ├─ Cache layer (Redis) for frequent queries
│  └─ Queue system (RabbitMQ/Celery) for async analysis jobs
│
├─ Monitoring & Logging:
│  ├─ Prometheus (metrics)
│  ├─ ELK Stack (logs)
│  ├─ Sentry (error tracking)
│  └─ Grafana (dashboards)
│
└─ Security:
   ├─ TLS/SSL encryption
   ├─ API authentication (JWT)
   ├─ Role-based access control (RBAC)
   ├─ Audit logging
   └─ Data encryption at rest
```

---

## DIAGRAM 8: ERROR HANDLING & VALIDATION FLOW

```
┌────────────────────────────────────────────────────────────────────────────┐
│  ERROR HANDLING & DATA VALIDATION PIPELINE                                 │
└────────────────────────────────────────────────────────────────────────────┘

INPUT VALIDATION LAYERS:

Layer 1: Format Detection & Parser Selection
─────────────────────────────────────────────
Input: raw_text, filename
   │
   ├─ Check file extension
   │  ├─ If .tf/.hcl  → parse_terraform()
   │  ├─ If .yaml/.yml → parse_yaml()
   │  └─ If .json or default → parse_json()
   │
   └─→ Passes to appropriate parser

Layer 2: JSON Parsing & Validation
─────────────────────────────────────────────
parse_json(raw_text)
   │
   ├─ Try: json.loads(raw_text)
   │  ├─ Success: Continue
   │  └─ Exception: json.JSONDecodeError
   │      └─→ raise ParseError("Invalid JSON: {error}")
   │
   ├─ Extract nodes
   │  └─ Check: nodes not empty
   │      └── Error: "At least one node is required"
   │
   ├─ Check: len(nodes) ≤ 200
   │  └─ Error: "Graph exceeds 200-node limit"
   │
   ├─ Validate each node:
   │  ├─ Check: "id" exists
   │  │  └─ Error: "Each node must have an 'id'"
   │  ├─ Check: no duplicate IDs
   │  │  └─ Error: "Duplicate node id: {id}"
   │  ├─ Check: zone in ALLOWED_ZONES
   │  │  └─ Error: "Invalid zone '{zone}' in node '{id}'"
   │  └─ Check: sensitivity in ALLOWED_SENSITIVITY
   │     └─ Error: "Invalid sensitivity in node '{id}'"
   │
   ├─ Validate each edge:
   │  ├─ Check: source exists
   │  │  └─ Error: "Edge source '{src}' not found"
   │  ├─ Check: target exists
   │  │  └─ Error: "Edge target '{tgt}' not found"
   │  └─ Check: source ≠ target (no self-loops)
   │     └─ Error: "Self-loop detected on node '{src}'"
   │
   └─ Return: {nodes, edges, evidence_source}

Layer 3: YAML Parsing & Format Conversion
────────────────────────────────────────────
parse_yaml(raw_text)
   │
   ├─ Try: yaml.safe_load(raw_text)
   │  ├─ Success: Continue
   │  └─ Exception: yaml.YAMLError
   │      └─→ raise ParseError("Invalid YAML: {error}")
   │
   ├─ Check format:
   │  ├─ If already {"nodes": [], "edges": []}
   │  │  └─→ parse_json(convert_to_json)
   │  │
   │  ├─ If K8s manifest format (has "kind", "metadata")
   │  │  ├─ Extract: name, namespace, image, containers
   │  │  └─→ Convert to nodes[]
   │  │
   │  └─ If unknown format
   │     └─→ raise ParseError("No valid resources found")
   │
   └─ Return: {nodes, edges, evidence_source}

Layer 4: Terraform Parsing with Multi-Tier Fallback
──────────────────────────────────────────────────────
parse_terraform(raw_text)
   │
   ├─ Tier 1: Try native HCL2 parsing
   │  │   try: import hcl2
   │  │   try: hcl2.load(StringIO(raw_text))
   │  │   Success: Extract resources → nodes
   │  │   Fail: Continue to Tier 2
   │  │
   │  └─→ logger.warning(f"HCL2 parsing failed: {e}")
   │
   ├─ Tier 2: Try Regex fallback
   │  │   pattern = r'resource\s+"(\w+)"\s+"(\w+)"'
   │  │   matches = findall(pattern, raw_text)
   │  │   Success: Create basic nodes
   │  │   Fail: Continue to Tier 3
   │  │
   │  └─→ logger.warning(f"Regex parsing failed: {e}")
   │
   ├─ Tier 3: Fail with helpful error
   │  └─→ raise ParseError(
   │        "Terraform parsing failed. Convert to JSON using: "
   │        "terraform show -json"
   │      )
   │
   └─ Return: {nodes, edges, evidence_source}

Layer 5: Graph Validation
───────────────────────────────
build_graph(parsed_data)
   │
   ├─ Create: nx.DiGraph()
   │
   ├─ Add all nodes:
   │  └─ for node in nodes:
   │      └─ Only add if node has "id"
   │
   ├─ Add all edges:
   │  └─ for edge in edges:
   │      ├─ Check source exists in nodes
   │      └─ Check target exists in nodes
   │         (Skip if validation fails)
   │
   └─ Return: DiGraph or raise error

Layer 6: Engine-Level Error Handling
──────────────────────────────────────
Each engine (evaluate_rules, quantum_engine, etc):
   │
   ├─→ try:
   │    ├─ Process graph data
   │    ├─ Calculate scores
   │    └─ Generate findings
   │
   ├─→ except Exception as e:
   │    ├─ Log: f"Rule error {rule_id}: {e}"
   │    ├─ Continue processing other rules
   │    └─ Return partial results
   │
   └─ Return: (findings[], score) - even if some rules fail


ERROR RESPONSE EXAMPLES:

HTTP 400 Bad Request:
{
  "status": "error",
  "error_code": "INVALID_JSON",
  "message": "Invalid JSON: Expecting property name enclosed in double quotes",
  "details": {
    "line": 15,
    "column": 10
  }
}

HTTP 400 Bad Request:
{
  "status": "error",
  "error_code": "VALIDATION_FAILED",
  "message": "Self-loop detected on node 'database'",
  "affected_node": "database"
}

HTTP 400 Bad Request:
{
  "status": "error",
  "error_code": "SIZE_EXCEEDED",
  "message": "Graph exceeds 200-node limit (got 250)",
  "node_count": 250
}

Success Response:
{
  "status": "success",
  "analysis_id": "550e8400-e29b-41d4-a716-446655440000",
  "node_count": 4,
  "edge_count": 3,
  "findings_count": 5,
  "scores": {...}
}
```

---

This comprehensive visual documentation provides:
✓ System architecture overview
✓ Data model & graph structure
✓ Engine scoring models
✓ Finding generation & enrichment
✓ Parser routing logic
✓ Database schema relationships
✓ Complete deployment architecture
✓ Error handling & validation flows

Perfect for integrating with databases and external systems!
