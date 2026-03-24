# QUANTUM SECURITY ANALYSIS - QUICK REFERENCE GUIDE

## DATABASE INTEGRATION QUICK START

### 1. recommended Database Setup

```sql
-- PostgreSQL Schema Creation

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Core Tables
CREATE TABLE analyses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    evidence_source VARCHAR(50),
    zero_trust_score DECIMAL(5,2),
    quantum_score DECIMAL(5,2),
    attack_path_score DECIMAL(5,2),
    supply_chain_score DECIMAL(5,2),
    compliance_score DECIMAL(5,2),
    overall_risk_score DECIMAL(5,2),
    total_findings INT,
    critical_count INT DEFAULT 0,
    high_count INT DEFAULT 0,
    medium_count INT DEFAULT 0,
    low_count INT DEFAULT 0,
    input_data JSONB,
    metadata JSONB,
    created_by VARCHAR(255),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE analysis_findings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    analysis_id UUID NOT NULL REFERENCES analyses(id) ON DELETE CASCADE,
    rule_id VARCHAR(50),
    severity VARCHAR(20),
    mitre_id VARCHAR(50),
    cvss DECIMAL(3,1),
    description TEXT,
    remediation TEXT,
    business_impact TEXT,
    business_risk TEXT,
    affected_nodes TEXT[],
    plugin VARCHAR(50),
    qvi DECIMAL(5,1),
    risk_year INT,
    path_risk DECIMAL(5,1),
    cve_id VARCHAR(50),
    fix_version VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE infrastructure_nodes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    node_id VARCHAR(255) NOT NULL UNIQUE,
    node_type VARCHAR(50),
    zone VARCHAR(50),
    data_sensitivity VARCHAR(50),
    encryption_type VARCHAR(100),
    container_image VARCHAR(255),
    retention_years INT,
    iam_roles TEXT[],
    known_exploit BOOLEAN DEFAULT FALSE,
    base_cvss DECIMAL(3,1),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB
);

CREATE TABLE infrastructure_edges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_node_id VARCHAR(255) NOT NULL REFERENCES infrastructure_nodes(node_id),
    target_node_id VARCHAR(255) NOT NULL REFERENCES infrastructure_nodes(node_id),
    auth_required BOOLEAN DEFAULT FALSE,
    tls_enforced BOOLEAN DEFAULT FALSE,
    mfa_required BOOLEAN DEFAULT FALSE,
    edge_cvss DECIMAL(3,1),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE analysis_compliance_mapping (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    finding_id UUID NOT NULL REFERENCES analysis_findings(id) ON DELETE CASCADE,
    framework VARCHAR(50),
    clause_id VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for Performance
CREATE INDEX idx_analyses_timestamp ON analyses(timestamp DESC);
CREATE INDEX idx_analyses_overall_risk ON analyses(overall_risk_score DESC);
CREATE INDEX idx_findings_analysis ON analysis_findings(analysis_id);
CREATE INDEX idx_findings_severity ON analysis_findings(severity);
CREATE INDEX idx_findings_rule ON analysis_findings(rule_id);
CREATE INDEX idx_findings_cve ON analysis_findings(cve_id);
CREATE INDEX idx_node_zone ON infrastructure_nodes(zone);
CREATE INDEX idx_node_sensitivity ON infrastructure_nodes(data_sensitivity);
CREATE INDEX idx_compliance_framework ON analysis_compliance_mapping(framework);
```

### 2. Python Database Wrapper

```python
# db.py - Database Integration Layer

import psycopg2
from psycopg2.extras import RealDictCursor
from datetime import datetime
from typing import List, Dict, Optional
import json

class AnalysisDatabase:
    def __init__(self, connection_string: str):
        """
        connection_string format:
        postgresql://user:password@localhost:5432/quantum_analysis
        """
        self.conn_string = connection_string
        self.connect()
    
    def connect(self):
        self.conn = psycopg2.connect(self.conn_string)
        self.cursor = self.conn.cursor(cursor_factory=RealDictCursor)
    
    def store_analysis(self, findings: List[Dict], scores: Dict, input_data: Dict) -> str:
        """Store analysis results in database"""
        analysis_id = None
        
        try:
            # Insert analysis metadata
            self.cursor.execute("""
                INSERT INTO analyses 
                (timestamp, evidence_source, zero_trust_score, quantum_score,
                 attack_path_score, supply_chain_score, compliance_score, 
                 overall_risk_score, total_findings, critical_count, 
                 high_count, medium_count, low_count, input_data)
                VALUES 
                (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING id
            """, (
                datetime.now(),
                input_data.get('evidence_source', 'json'),
                scores.get('zero_trust', 0),
                scores.get('quantum', 0),
                scores.get('attack_path', 0),
                scores.get('supply_chain', 0),
                scores.get('compliance', 0),
                scores.get('overall_risk', 0),
                len(findings),
                sum(1 for f in findings if f.get('severity') == 'CRITICAL'),
                sum(1 for f in findings if f.get('severity') == 'HIGH'),
                sum(1 for f in findings if f.get('severity') == 'MEDIUM'),
                sum(1 for f in findings if f.get('severity') == 'LOW'),
                json.dumps(input_data)
            ))
            
            analysis_id = self.cursor.fetchone()['id']
            
            # Insert findings
            for finding in findings:
                self.cursor.execute("""
                    INSERT INTO analysis_findings
                    (analysis_id, rule_id, severity, mitre_id, cvss, 
                     description, remediation, business_impact, business_risk,
                     affected_nodes, plugin, qvi, risk_year, path_risk, 
                     cve_id, fix_version)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    RETURNING id
                """, (
                    str(analysis_id),
                    finding.get('rule_id'),
                    finding.get('severity'),
                    finding.get('mitre_id'),
                    finding.get('cvss'),
                    finding.get('description'),
                    finding.get('remediation'),
                    finding.get('business_impact'),
                    finding.get('business_risk'),
                    finding.get('affected_nodes'),
                    finding.get('plugin'),
                    finding.get('qvi'),
                    finding.get('risk_year'),
                    finding.get('path_risk'),
                    finding.get('cve_id'),
                    finding.get('fix_version')
                ))
                
                finding_id = self.cursor.fetchone()['id']
                
                # Insert compliance mappings
                for clause in finding.get('compliance_clauses', []):
                    self.cursor.execute("""
                        INSERT INTO analysis_compliance_mapping
                        (finding_id, framework, clause_id)
                        VALUES (%s, %s, %s)
                    """, (str(finding_id), clause['framework'], clause['clause_id']))
            
            self.conn.commit()
            return str(analysis_id)
        
        except Exception as e:
            self.conn.rollback()
            print(f"Database error: {e}")
            raise
    
    def get_analyses(self, limit: int = 10, offset: int = 0) -> List[Dict]:
        """Retrieve analysis history"""
        self.cursor.execute("""
            SELECT * FROM analyses
            ORDER BY timestamp DESC
            LIMIT %s OFFSET %s
        """, (limit, offset))
        return self.cursor.fetchall()
    
    def get_findings_by_severity(self, severity: str, limit: int = 50) -> List[Dict]:
        """Get findings by severity"""
        self.cursor.execute("""
            SELECT * FROM analysis_findings
            WHERE severity = %s
            ORDER BY created_at DESC
            LIMIT %s
        """, (severity, limit))
        return self.cursor.fetchall()
    
    def get_compliance_report(self, framework: str) -> Dict:
        """Generate compliance report"""
        self.cursor.execute("""
            SELECT clause_id, COUNT(*) as count
            FROM analysis_compliance_mapping
            WHERE framework = %s
            GROUP BY clause_id
            ORDER BY count DESC
        """, (framework,))
        
        results = self.cursor.fetchall()
        return {
            'framework': framework,
            'clauses': results,
            'total_findings': sum(r['count'] for r in results)
        }
    
    def get_risk_timeline(self) -> Dict:
        """Get risk timeline for quantum threats"""
        self.cursor.execute("""
            SELECT risk_year, COUNT(*) as count, 
                   MAX(qvi) as max_qvi, AVG(qvi) as avg_qvi
            FROM analysis_findings
            WHERE plugin = 'quantum' AND risk_year IS NOT NULL
            GROUP BY risk_year
            ORDER BY risk_year ASC
        """)
        return self.cursor.fetchall()
    
    def close(self):
        self.cursor.close()
        self.conn.close()
```

---

## API ENDPOINTS REFERENCE

### REST API Endpoint Map

```
BASE_URL: http://localhost:8000/api/v1

POST   /analyze                          Run analysis on infrastructure
GET    /analyses                         Get analysis history
GET    /analyses/{analysis_id}           Get specific analysis
GET    /findings/severity/{severity}     Filter findings by severity
GET    /findings/rule/{rule_id}          Filter findings by rule
GET    /findings/cve/{cve_id}           Find CVE-related findings
GET    /compliance/mapping/{rule_id}     Get compliance clauses
GET    /compliance/report/{framework}    Generate compliance report
GET    /infrastructure/nodes             List infrastructure nodes
GET    /infrastructure/edges             List infrastructure connections
GET    /health                           Health check
```

### API Request/Response Examples

#### 1. Run Analysis
```http
POST /api/v1/analyze
Content-Type: application/json

{
  "input_data": {
    "nodes": [
      {
        "id": "database",
        "type": "database",
        "zone": "PRIVATE",
        "data_sensitivity": "CRITICAL",
        "encryption_type": "none",
        "retention_years": 10
      },
      {
        "id": "internet",
        "type": "gateway",
        "zone": "PUBLIC"
      }
    ],
    "edges": [
      {
        "source": "internet",
        "target": "database",
        "auth_required": false,
        "mfa_required": false
      }
    ]
  },
  "format": "json"
}

Response 200:
{
  "status": "success",
  "analysis_id": "550e8400-e29b-41d4-a716-446655440000",
  "node_count": 2,
  "edge_count": 1,
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
      "qvi": 100.0,
      "risk_year": 2025
    }
  ],
  "scores": {
    "zero_trust": 75,
    "quantum": 100,
    "attack_path": 82,
    "supply_chain": 90,
    "compliance": 85
  }
}
```

#### 2. Get Analysis History
```http
GET /api/v1/analyses?limit=10&offset=0

Response 200:
{
  "status": "success",
  "total": 42,
  "limit": 10,
  "offset": 0,
  "analyses": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "timestamp": "2026-03-22T10:30:00Z",
      "zero_trust_score": 75,
      "quantum_score": 100,
      "attack_path_score": 82,
      "supply_chain_score": 90,
      "compliance_score": 85,
      "overall_risk_score": 75.55,
      "total_findings": 12,
      "critical_count": 3,
      "high_count": 5
    }
  ]
}
```

#### 3. Get Critical Findings
```http
GET /api/v1/findings/severity/CRITICAL?limit=50

Response 200:
{
  "status": "success",
  "severity": "CRITICAL",
  "count": 45,
  "findings": [
    {
      "id": "finding-uuid",
      "analysis_id": "analysis-uuid",
      "rule_id": "ZT-001",
      "severity": "CRITICAL",
      "cvss": 8.2,
      "description": "...",
      "remediation": "...",
      "affected_nodes": ["node1", "node2"],
      "compliance_clauses": [
        {"framework": "NIST", "clause_id": "AC-3"}
      ]
    }
  ]
}
```

#### 4. Compliance Report
```http
GET /api/v1/compliance/report/NIST

Response 200:
{
  "framework": "NIST",
  "total_findings_mapped": 23,
  "clauses": [
    {"clause_id": "AC-3", "count": 8, "satisfied": true},
    {"clause_id": "SC-28", "count": 5, "satisfied": false},
    {"clause_id": "CA-7", "count": 10, "satisfied": true}
  ],
  "compliance_percentage": 75.5
}
```

---

## FASTAPI IMPLEMENTATION TEMPLATE

```python
# main.py - FastAPI Server

from fastapi import FastAPI, HTTPException, UploadFile, File, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
import json
from datetime import datetime

# Import existing modules
from backend.parsers import parse_input
from backend.engines import (
    zero_trust_engine, quantum_engine, attack_path_engine,
    supply_chain_engine, enrich_with_compliance
)
from backend.run_engines import build_graph
from db import AnalysisDatabase

app = FastAPI(title="Quantum Security Analysis", version="1.0.0")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database connection
db = AnalysisDatabase("postgresql://user:password@localhost:5432/quantum_analysis")

# Pydantic Models
class NodeModel(BaseModel):
    id: str
    type: str
    zone: str
    data_sensitivity: str
    encryption_type: str
    container_image: Optional[str] = None
    retention_years: int = 0
    iam_roles: List[str] = []

class EdgeModel(BaseModel):
    source: str
    target: str
    auth_required: bool = False
    tls_enforced: bool = False
    mfa_required: bool = False

class AnalysisRequest(BaseModel):
    input_data: dict
    format: str = "json"

class AnalysisResponse(BaseModel):
    status: str
    analysis_id: str
    findings: List[dict]
    scores: dict

# API Endpoints

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}

@app.post("/api/v1/analyze", response_model=AnalysisResponse)
async def analyze_infrastructure(request: AnalysisRequest):
    """
    Main analysis endpoint
    Accepts infrastructure topology and returns security findings
    """
    try:
        # Parse input
        parsed = parse_input(
            json.dumps(request.input_data),
            f"input.{request.format}"
        )
        
        # Build graph
        G = build_graph(parsed)
        
        # Run engines
        findings = []
        scores = {}
        
        zt_findings, zt_score = zero_trust_engine(G)
        findings.extend(zt_findings)
        scores['zero_trust'] = round(zt_score, 2)
        
        q_findings, q_score = quantum_engine(G)
        findings.extend(q_findings)
        scores['quantum'] = round(q_score, 2)
        
        ap_findings, ap_score = attack_path_engine(G)
        findings.extend(ap_findings)
        scores['attack_path'] = round(ap_score, 2)
        
        sc_findings, sc_score = supply_chain_engine(G)
        findings.extend(sc_findings)
        scores['supply_chain'] = round(sc_score, 2)
        
        # Enrich with compliance
        findings, comp_score = enrich_with_compliance(findings)
        scores['compliance'] = round(comp_score, 2)
        
        # Calculate overall risk (weighted average)
        overall_risk = 100 - (
            0.25 * scores['zero_trust'] +
            0.20 * scores['quantum'] +
            0.20 * scores['attack_path'] +
            0.20 * scores['supply_chain'] +
            0.15 * scores['compliance']
        )
        scores['overall_risk'] = round(overall_risk, 2)
        
        # Store in database
        analysis_id = db.store_analysis(findings, scores, parsed)
        
        return AnalysisResponse(
            status="success",
            analysis_id=analysis_id,
            findings=findings,
            scores=scores
        )
    
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/v1/analyses")
async def get_analyses(limit: int = Query(10, le=100), offset: int = 0):
    """Get analysis history"""
    analyses = db.get_analyses(limit, offset)
    return {"status": "success", "analyses": analyses}

@app.get("/api/v1/analyses/{analysis_id}")
async def get_analysis(analysis_id: str):
    """Get specific analysis by ID"""
    # Query database for analysis and findings
    pass

@app.get("/api/v1/findings/severity/{severity}")
async def get_findings_by_severity(severity: str, limit: int = 50):
    """Get findings filtered by severity"""
    findings = db.get_findings_by_severity(severity, limit)
    return {"status": "success", "severity": severity, "findings": findings}

@app.get("/api/v1/compliance/report/{framework}")
async def get_compliance_report(framework: str):
    """Generate compliance report for framework"""
    report = db.get_compliance_report(framework)
    return {"status": "success", "report": report}

@app.post("/api/v1/upload")
async def upload_infrastructure(file: UploadFile = File(...)):
    """Upload infrastructure file (Terraform, YAML, JSON)"""
    try:
        content = await file.read()
        raw_text = content.decode('utf-8')
        
        return await analyze_infrastructure(AnalysisRequest(
            input_data=json.loads(raw_text),
            format=file.filename.split('.')[-1]
        ))
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
```

---

## FRONTEND INTEGRATION EXAMPLE

```javascript
// src/api/analysisService.js

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8000/api/v1';

export const analysisService = {
  async runAnalysis(infrastructureData, format = 'json') {
    const response = await fetch(`${API_BASE}/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        input_data: infrastructureData,
        format
      })
    });
    
    if (!response.ok) throw new Error('Analysis failed');
    return response.json();
  },

  async getAnalyses(limit = 10, offset = 0) {
    const response = await fetch(
      `${API_BASE}/analyses?limit=${limit}&offset=${offset}`
    );
    return response.json();
  },

  async getAnalysisById(id) {
    const response = await fetch(`${API_BASE}/analyses/${id}`);
    return response.json();
  },

  async getFindings(severity, limit = 50) {
    const response = await fetch(
      `${API_BASE}/findings/severity/${severity}?limit=${limit}`
    );
    return response.json();
  },

  async getComplianceReport(framework) {
    const response = await fetch(
      `${API_BASE}/compliance/report/${framework}`
    );
    return response.json();
  },

  async uploadFile(file) {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch(`${API_BASE}/upload`, {
      method: 'POST',
      body: formData
    });
    
    return response.json();
  }
};
```

---

## INTEGRATION CHECKLIST

- [ ] Create PostgreSQL database and run schema SQL
- [ ] Install Python dependencies: `pip install -r requirements.txt psycopg2-binary`
- [ ] Update `db.py` with actual database credentials
- [ ] Implement `main.py` with FastAPI server
- [ ] Test `/health` endpoint first
- [ ] Test `/analyze` endpoint with sample.json
- [ ] Implement frontend API service
- [ ] Add authentication/JWT tokens
- [ ] Set up monitoring & logging
- [ ] Configure CI/CD pipeline
- [ ] Deploy to production environment

---

## SECURITY CONSIDERATIONS

```python
# Authentication (JWT)
from fastapi.security import HTTPBearer, HTTPAuthenticationCredentials
from jose import JWTError, jwt

security = HTTPBearer()

async def verify_token(credentials: HTTPAuthenticationCredentials):
    try:
        payload = jwt.decode(
            credentials.credentials,
            "YOUR_SECRET_KEY",
            algorithms=["HS256"]
        )
        return payload
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

# Rate Limiting
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter

@app.post("/api/v1/analyze")
@limiter.limit("10/minute")
async def analyze_infrastructure(request: AnalysisRequest):
    pass

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://yourdomain.com"],  # Specify allowed domains
    allow_credentials=True,
    allow_methods=["POST", "GET"],
    allow_headers=["*"],
)
```

---

Generated: March 22, 2026 | Quantum Security Analysis Platform v1.0
