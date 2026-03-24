# QUANTUM SECURITY ANALYSIS - FILE DEPENDENCY & INTEGRATION MAP

## 1. FILE TREE WITH DESCRIPTIONS

```
Quantum/
│
├── backend/
│   ├── requirements.txt                 [DEPENDENCY MANIFEST]
│   │   └─ Lists all Python packages needed
│   │   └─ Dependencies: FastAPI, Uvicorn, PyYAML, NetworkX, etc.
│   │
│   ├── run_engines.py                   [MAIN ORCHESTRATOR]
│   │   Location: Entry point for entire backend
│   │   Dependencies:
│   │     ├─ Imports: json, networkx
│   │     ├─ Uses: parsers.parse_input()
│   │     └─ Uses: engines (all 5 engines)
│   │   Functions:
│   │     ├─ main()            - Orchestrates entire pipeline
│   │     └─ build_graph()     - Converts JSON to NetworkX graph
│   │   Output: findings[], scores{}
│   │
│   ├── sample.json                      [SAMPLE DATA]
│   │   Location: Example infrastructure topology
│   │   Purpose: Test input for analysis pipeline
│   │   Format: JSON with nodes[] and edges[]
│   │
│   ├── engines/                         [ANALYSIS ENGINE PACKAGE]
│   │   ├── __init__.py                  [PACKAGE EXPORTS]
│   │   │   └─ Exports: All 5 engine functions
│   │   │
│   │   ├── rules.py                     [RULE DEFINITIONS & EVALUATION]
│   │   │   Purpose: Core rule engine for Zero Trust analysis
│   │   │   Contains:
│   │   │     ├─ IMPACT_MAP            - Business impact descriptions
│   │   │     ├─ RISK_MAP              - Risk level descriptions
│   │   │     ├─ create_rule()         - Rule factory function
│   │   │     ├─ RULE_REGISTRY         - Array of 5 Zero Trust rules
│   │   │     │  └─ ZT-001: Public→Private DB without auth
│   │   │     │  └─ ZT-002: Admin exposed
│   │   │     │  └─ ZT-003: No encryption on sensitive data
│   │   │     │  └─ ZT-004: No MFA on sensitive access
│   │   │     │  └─ ZT-005: Wildcard IAM permissions
│   │   │     └─ evaluate_rules()      - Rule evaluation engine
│   │   │   Output: findings[], score
│   │   │
│   │   ├── zero_trust.py               [ZERO TRUST ENGINE]
│   │   │   Purpose: Validate Zero Trust architecture (5 rules)
│   │   │   Function: zero_trust_engine(G: DiGraph) → (findings[], score)
│   │   │   Uses: rules.evaluate_rules() + RULE_REGISTRY
│   │   │   Scoring: 100 - (CRITICAL×15 + HIGH×8 + MEDIUM×3 + LOW×1)
│   │   │   Output: ZT-specific findings
│   │   │
│   │   ├── quantum.py                  [QUANTUM ENGINE]
│   │   │   Purpose: Assess quantum computing threat to encryption
│   │   │   Function: quantum_engine(G: DiGraph) → (findings[], score)
│   │   │   Contains:
│   │   │     ├─ VULN_SCORES            - Encryption vulnerability scores
│   │   │     ├─ SENSITIVITY_WEIGHT     - Data sensitivity factors
│   │   │     ├─ QVI calculation        - Quantum Vulnerability Index
│   │   │     └─ risk_year computation  - When data becomes at risk
│   │   │   Triggers: When QVI > 40
│   │   │   Output: Q-001 findings with QVI scores
│   │   │
│   │   ├── attack_path.py              [ATTACK PATH ENGINE]
│   │   │   Purpose: Discover exploitable attack paths
│   │   │   Function: attack_path_engine(G: DiGraph) → (findings[], score)
│   │   │   Contains:
│   │   │     ├─ calculate_path_risk()  - Path risk scoring
│   │   │     ├─ PUBLIC node detection  - Find entry points
│   │   │     ├─ Target discovery       - Find sensitive resources
│   │   │     └─ Top 10 paths ranking   - Query all paths, sort by risk
│   │   │   Scoring: 100 - (CRITICAL×20 + HIGH×10 + MEDIUM×4)
│   │   │   Output: AP-001 findings with path_risk
│   │   │
│   │   ├── supply_chain.py             [SUPPLY CHAIN ENGINE]
│   │   │   Purpose: Identify vulnerable dependencies
│   │   │   Function: supply_chain_engine(G: DiGraph) → (findings[], score)
│   │   │   Contains:
│   │   │     ├─ NVD_SNAPSHOT           - CVE/dependency database
│   │   │     ├─ Container image lookup - Extract from nodes
│   │   │     └─ CVE severity mapping   - CVSS to severity conversion
│   │   │   Scoring: 100 - (CRITICAL×25 + HIGH×12 + MEDIUM×4 + LOW×1)
│   │   │   Output: SC-001 findings with CVE details
│   │   │
│   │   └── compliance.py               [COMPLIANCE ENRICHMENT]
│   │       Purpose: Map findings to compliance frameworks
│   │       Function: enrich_with_compliance(findings[]) → (findings[], score)
│   │       Contains:
│   │         ├─ COMPLIANCE_MAP         - Rule ID → Framework clauses
│   │         └─ Enrichment logic       - Add compliance_clauses to findings
│   │       Frameworks: NIST, DPDP
│   │       Scoring: (mapped_findings / total) × 100
│   │       Output: Enriched findings with compliance_clauses
│   │
│   └── parsers/                         [PARSER PACKAGE]
│       ├── __init__.py                  [PARSER ROUTER]
│       │   Function: parse_input(raw_text, filename)
│       │   Purpose: Auto-detect format and route to parser
│       │   Routing:
│       │     ├─ .tf/.hcl  → parse_terraform()
│       │     ├─ .yaml/.yml → parse_yaml()
│       │     └─ .json/.default → parse_json()
│       │   Output: Normalized {nodes, edges, evidence_source}
│       │
│       ├── json_parser.py              [JSON PARSER]
│       │   Function: parse_json(raw_text)
│       │   Purpose: Parse and validate JSON infrastructure
│       │   Contains:
│       │     ├─ ParseError             - Custom exception
│       │     ├─ ALLOWED_ZONES          - Valid zone values
│       │     ├─ ALLOWED_SENSITIVITY    - Valid sensitivity values
│       │     └─ Validation logic       - Node and edge validation
│       │   Constraints:
│       │     ├─ Max 200 nodes
│       │     ├─ Unique node IDs
│       │     ├─ No self-loops
│       │     └─ Valid zones/sensitivity
│       │   Output: {nodes, edges, evidence_source}
│       │
│       ├── yaml_parser.py              [YAML/KUBERNETES PARSER]
│       │   Function: parse_yaml(raw_text)
│       │   Purpose: Parse Kubernetes manifests & YAML
│       │   Conversion:
│       │     ├─ Kubernetes kind → node type
│       │     ├─ metadata.name → node ID
│       │     ├─ container image extraction
│       │     └─ Default assignments (zone, sensitivity)
│       │   Fallback: Calls parse_json() if standard format detected
│       │   Output: {nodes, edges, evidence_source}
│       │
│       └── tf_parser.py                [TERRAFORM PARSER]
│           Function: parse_terraform(raw_text)
│           Purpose: Parse Terraform HCL configurations
│           Strategy: 3-tier fallback
│             Tier 1: hcl2 library (native parsing)
│             Tier 2: Regex pattern matching
│             Tier 3: Error with helpful message
│           Extraction:
│             ├─ Resource type → node type
│             ├─ Resource name → node ID
│             ├─ Storage encryption status
│             └─ Default assignments
│           Output: {nodes, edges, evidence_source}
│
├── frontend/                            [FRONTEND APPLICATION]
│   ├── package.json                     [NPM MANIFEST]
│   │   └─ Lists npm dependencies & build scripts
│   │
│   ├── vite.config.js                   [VITE BUILD CONFIGURATION]
│   │   └─ Specifies React plugin and build options
│   │
│   ├── index.html                       [HTML ENTRY POINT]
│   │   └─ Root HTML; loads main.jsx
│   │
│   ├── src/
│   │   ├── main.jsx                     [REACT ENTRY POINT]
│   │   │   └─ Mounts React app to DOM
│   │   │
│   │   ├── App.jsx                      [MAIN COMPONENT]
│   │   │   Purpose: Root React component (currently boilerplate)
│   │   │   Future: Dashboard, findings display, compliance reports
│   │   │
│   │   ├── App.css                      [COMPONENT STYLES]
│   │   │   └─ Styling for App component
│   │   │
│   │   └── index.css                    [GLOBAL STYLES]
│   │       └─ Global stylesheet
│   │
│   └── public/                          [STATIC ASSETS]
│       └─ Favicon, icons, etc.
│
├── PROJECT_ARCHITECTURE_REPORT.md       [THIS FILE - DETAILED DOCUMENTATION]
├── ARCHITECTURE_DIAGRAMS.md             [VISUAL DIAGRAMS]
└── DATABASE_INTEGRATION_GUIDE.md        [DB & API SETUP]
```

---

## 2. DEPENDENCY GRAPH

```
┌─────────────────────────────────────────────────────────────────┐
│                     IMPORT DEPENDENCIES                          │
└─────────────────────────────────────────────────────────────────┘

run_engines.py
    │
    ├─ import json                          (Python stdlib)
    ├─ import networkx as nx                (External: networkx)
    │
    ├─ from parsers import parse_input      ← parsers/__init__.py
    │   ├─ from .json_parser import ...     ← json_parser.py
    │   │   ├─ import json                  (stdlib)
    │   │   └─ from typing import Dict      (stdlib)
    │   │
    │   ├─ from .yaml_parser import ...     ← yaml_parser.py
    │   │   ├─ import yaml                  (External: pyyaml)
    │   │   ├─ import json                  (stdlib)
    │   │   └─ from .json_parser import ... (circular depends on json_parser)
    │   │
    │   └─ from .tf_parser import ...       ← tf_parser.py
    │       ├─ import json                  (stdlib)
    │       ├─ import re                    (stdlib)
    │       ├─ import logging               (stdlib)
    │       ├─ from .json_parser import ... (depends on json_parser)
    │       └─ Optional: import hcl2        (External: python-hcl2)
    │
    └─ from engines import (                ← engines/__init__.py
        │   zero_trust_engine,
        │   quantum_engine,
        │   attack_path_engine,
        │   supply_chain_engine,
        │   enrich_with_compliance
        │)
        │
        ├─ from .zero_trust import ...      ← zero_trust.py
        │   ├─ import networkx as nx        (External: networkx)
        │   └─ from .rules import ...       ← rules.py
        │       └─ import networkx as nx    (External: networkx)
        │
        ├─ from .quantum import ...         ← quantum.py
        │   └─ import networkx as nx        (External: networkx)
        │
        ├─ from .attack_path import ...     ← attack_path.py
        │   ├─ import networkx as nx        (External: networkx)
        │   └─ import math                  (stdlib)
        │
        ├─ from .supply_chain import ...    ← supply_chain.py
        │   └─ import networkx as nx        (External: networkx)
        │
        └─ from .compliance import ...      ← compliance.py
            └─ from typing import ...       (stdlib)
```

---

## 3. DATA FLOW THROUGH SYSTEM

```
INPUT STAGE
───────────────────────────────────────────────────────────────────

raw_input (JSON/YAML/Terraform file)
    │
    ▼
parse_input(raw_text, filename)          [parsers/__init__.py]
    │
    ├──→ Detect file extension
    │
    ├──→ Route to parser
    │    ├─ json_parser.py
    │    ├─ yaml_parser.py
    │    └─ tf_parser.py
    │
    └──→ Normalize to: {nodes, edges, evidence_source}

PARSING STAGE
───────────────────────────────────────────────────────────────────

parsed_data {nodes, edges, evidence_source}
    │
    ▼
build_graph(parsed_data)                 [run_engines.py]
    │
    └──→ G = nx.DiGraph()
        ├─ Add nodes with attrs
        └─ Add edges with attrs

ANALYSIS STAGE
───────────────────────────────────────────────────────────────────

G (NetworkX DirectedGraph)
    │
    ├─→ zero_trust_engine(G)              [engines/zero_trust.py]
    │    └─→ evaluate_rules(G, RULE_REGISTRY)
    │
    ├─→ quantum_engine(G)                 [engines/quantum.py]
    │
    ├─→ attack_path_engine(G)             [engines/attack_path.py]
    │
    ├─→ supply_chain_engine(G)            [engines/supply_chain.py]
    │
    └─→ All findings aggregated

ENRICHMENT STAGE
───────────────────────────────────────────────────────────────────

findings[] (from all engines)
    │
    ▼
enrich_with_compliance(findings)         [engines/compliance.py]
    │
    └──→ Attach compliance_clauses to each finding

OUTPUT STAGE
───────────────────────────────────────────────────────────────────

enriched_findings[] + scores{}
    │
    ├──→ Print to console                 [run_engines.py]
    ├──→ Store in database                [db.py - future]
    ├──→ Return from API                  [main.py - future]
    └──→ Display in frontend              [React App - future]
```

---

## 4. FILE RESPONSIBILITIES MATRIX

| File | Input Type | Output Type | Primary Function | Dependencies |
|------|-----------|------------|------------------|--------------|
| `requirements.txt` | Text | Python Packages | Lists dependencies | - |
| `run_engines.py` | JSON/Dict | Findings[], Scores{} | Orchestrate pipeline | parsers, engines, nx |
| `sample.json` | - | Test Data | Example topology | - |
| `json_parser.py` | JSON String | Dict {nodes[], edges[]} | Parse & validate JSON | json, ParseError |
| `yaml_parser.py` | YAML String | Dict {nodes[], edges[]} | Parse YAML/K8s | yaml, json_parser |
| `tf_parser.py` | HCL String | Dict {nodes[], edges[]} | Parse Terraform | hcl2 (opt), regex, json_parser |
| `__init__.py` (parsers) | Raw Text, Filename | Dict {nodes[], edges[]} | Route to parser | All parsers |
| `zero_trust.py` | DiGraph | Findings[], Score | Zero Trust rules | rules, nx |
| `quantum.py` | DiGraph | Findings[], Score | Quantum threat assess | nx, math |
| `attack_path.py` | DiGraph | Findings[], Score | Attack discovery | nx, math |
| `supply_chain.py` | DiGraph | Findings[], Score | CVE detection | nx |
| `compliance.py` | Findings[] | Findings[], Score | Map to frameworks | - |
| `rules.py` | DiGraph, Registry | Findings[], Score | Rule evaluation | nx |
| `__init__.py` (engines) | - | Module Exports | Export engines | All engines |
| `package.json` | - | npm Packages | Frontend dependencies | - |
| `vite.config.js` | - | Build Config | Vite configuration | - |
| `App.jsx` | - | React UI | Main component | React |
| `main.jsx` | - | DOM Mount | React entry | React |

---

## 5. CRITICAL INTEGRATION POINTS

### Integration Point 1: Parser Output → Graph Builder
```python
# Data contract:
output_from_parser = {
    "nodes": [
        {
            "id": str,
            "type": str,
            "zone": str,
            "data_sensitivity": str,
            "encryption_type": str,
            # ... more attributes
        }
    ],
    "edges": [
        {
            "source": str,
            "target": str,
            "auth_required": bool,
            # ... more attributes
        }
    ],
    "evidence_source": str
}

# Input to build_graph:
G = build_graph(output_from_parser)
# G is: nx.DiGraph with above structure
```

### Integration Point 2: Graph → Engines
```python
# All engines receive DiGraph with same structure
# Signature is consistent:
def engine_name(G: nx.DiGraph) -> Tuple[List[Dict], float]:
    """
    Input: DiGraph
    Output: (findings[], score: 0-100)
    """

# Example finding structure (same for all engines):
{
    "rule_id": str,
    "severity": str,
    "mitre_id": str,
    "cvss": float,
    "affected_nodes": List[str],
    "description": str,
    "remediation": str,
    # Engine-specific fields may be added
}
```

### Integration Point 3: Engines → Compliance
```python
# Compliance engine receives aggregated findings
findings = [
    {
        "rule_id": "ZT-001",  # Used for lookup
        "compliance_clauses": []  # Will be populated
    }
]

# After enrichment:
findings = [
    {
        "rule_id": "ZT-001",
        "compliance_clauses": [
            {"framework": "NIST", "clause_id": "AC-3"}
        ]
    }
]
```

### Integration Point 4: Results → Database (Future)
```python
# Data to store:
{
    "analysis": {
        "id": uuid,
        "timestamp": datetime,
        "scores": scores {},
        "findings_count": int,
        "severity_counts": {}
    },
    "findings": [
        # All enriched findings
    ],
    "infrastructure": {
        "nodes": [],
        "edges": []
    }
}
```

---

## 6. MODULE LOADING SEQUENCE

On first execution of `run_engines.py`:

```
1. STDLIB IMPORTS
   ├─ import json
   ├─ import networkx
   └─ import math (implicitly via engines)

2. LOCAL PACKAGE IMPORTS
   ├─ import parsers (triggers parsers/__init__.py)
   │   ├─ Loads json_parser.py
   │   ├─ Loads yaml_parser.py
   │   └─ Loads tf_parser.py
   │
   └─ import engines (triggers engines/__init__.py)
       ├─ Loads rules.py
       ├─ Loads zero_trust.py
       ├─ Loads quantum.py
       ├─ Loads attack_path.py
       ├─ Loads supply_chain.py
       └─ Loads compliance.py

3. EXTERNAL PACKAGE IMPORTS
   ├─ json (stdlib)
   ├─ yaml (if parse_yaml called)
   ├─ hcl2 (if parse_terraform called, optional)
   ├─ networkx (loaded early)
   └─ math (loaded implicitly)

4. EXECUTION
   ├─ main() called
   ├─ Parsers initialized on demand
   ├─ Engines executed sequentially
   └─ Results aggregated and printed
```

---

## 7. CONFIGURATION FILES REFERENCE

### requirements.txt Structure
```
# Framework & Server
fastapi              # Web framework
uvicorn              # ASGI server
python-multipart     # Form handling

# Authentication
passlib[bcrypt]      # Password hashing
python-jose          # JWT tokens

# Database
pymongo              # MongoDB driver

# Parsing
pyyaml               # YAML parser
python-hcl2          # Terraform HCL (optional)

# Algorithms
networkx             # Graph algorithms

# Optional
openai               # AI integration (optional)
python-dotenv        # Environment variables (dev)
```

### package.json Structure
```json
{
  "scripts": {
    "dev": "vite",                    // Dev server
    "build": "vite build",            // Production build
    "lint": "eslint .",               // Code quality
    "preview": "vite preview"         // Preview build
  },
  "dependencies": {
    "react": "^19.2.4",
    "react-dom": "^19.2.4"
  }
}
```

---

## 8. ENVIRONMENT SETUP

### Backend Setup
```bash
# 1. Create virtual environment
python -m venv venv
source venv/bin/activate  # or: venv\Scripts\activate on Windows

# 2. Install dependencies
pip install -r requirements.txt

# 3. Run analysis
python run_engines.py

# 4. Start API server (future)
python main.py
```

### Frontend Setup
```bash
# 1. Install dependencies
npm install

# 2. Start dev server
npm run dev

# 3. Build for production
npm run build

# 4. Lint code
npm run lint
```

---

## 9. FUTURE INTEGRATION COMPONENTS

Components needed for complete integration:

```
Development Phase 1: API Server
├─ main.py
│  ├─ FastAPI application
│  ├─ REST endpoints
│  └─ Error handling

Development Phase 2: Database Layer
├─ db.py
│  ├─ Database connection
│  ├─ CRUD operations
│  └─ Query methods

Development Phase 3: Frontend UI
├─ src/pages/
│  ├─ Dashboard.jsx
│  ├─ Analysis.jsx
│  ├─ Reports.jsx
│  └─ Compliance.jsx
├─ src/components/
│  ├─ FindingsTable.jsx
│  ├─ ScoreCard.jsx
│  └─ Charts.jsx
└─ src/hooks/
   ├─ useAnalysis.js
   └─ useDashboard.js

Development Phase 4: Authentication
├─ auth/
│  ├─ jwt_utils.py      (Backend JWT)
│  ├─ authService.js    (Frontend auth)
│  └─ ProtectedRoute.jsx (Route protection)

Development Phase 5: DevOps
├─ Dockerfile
├─ docker-compose.yml
├─ .github/workflows/    (CI/CD)
└─ k8s/                  (Kubernetes manifests)
```

---

## 10. QUICK START COMMAND REFERENCE

### Backend Commands
```bash
# Test pipeline
python run_engines.py

# Start API server
python main.py

# Run specific parser test
python -c "from parsers import parse_input; print(parse_input(open('sample.json').read(), 'sample.json'))"

# Test individual engine
python -c "from engines import quantum_engine; from run_engines import build_graph, parse_input; G = build_graph(parse_input(open('sample.json').read(), 'sample.json')); print(quantum_engine(G))"
```

### Frontend Commands
```bash
# Development
npm run dev

# Production build
npm run build

# Run linter
npm run lint

# Preview production build
npm run preview
```

### Database Commands
```sql
-- Connect to database
psql postgresql://user:password@localhost:5432/quantum_analysis

-- View recent analyses
SELECT * FROM analyses ORDER BY timestamp DESC LIMIT 10;

-- View critical findings
SELECT * FROM analysis_findings WHERE severity = 'CRITICAL';

-- View compliance mappings
SELECT COUNT(*) FROM analysis_compliance_mapping GROUP BY framework;
```

---

## Summary Table

| Component | Purpose | Status | Integration |
|-----------|---------|--------|-------------|
| Backend Engine | Core security analysis | ✓ Complete | CLI executable |
| Parsers | Multi-format input | ✓ Complete | Integrated in run_engines.py |
| Frontend | UI/Dashboard | ⚠ Boilerplate | Needs implementation |
| API Server | REST endpoints | ⚠ Not implemented | Needs: main.py |
| Database | Persistent storage | ⚠ Not implemented | Needs: db.py + schema |
| Authentication | JWT/Security | ⚠ Not implemented | Needs: auth module |
| CI/CD | Deployment pipeline | ⚠ Not implemented | Needs: GitHub Actions |
| Documentation | Reference guide | ✓ Complete | This document |

---

Last Updated: March 22, 2026
