# QUANTUM-ARES v7.75

**The CIBIL Score for IT Architecture** — pre-deployment infrastructure security validation.

Upload your infrastructure blueprint (JSON/YAML/Terraform). Get a Security Index (0-100),
28+ findings with AI reasoning, downloadable Terraform patches, and a blockchain-anchored PDF report.

---

## Quick Start (Local)
```bash
# 1. Clone
git clone https://github.com/YOUR_USERNAME/Quantum_Ares.git
cd Quantum_Ares

# 2. Backend
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1   # Windows
pip install -r requirements.txt

$env:SQLITE_PATH = "app/data/quantum_ares.db"
$env:SECRET_KEY  = "dev-change-in-prod"
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000

# 3. Frontend (new terminal)
cd frontend
npm install
npm run dev
```

Open http://localhost:5173

**Login:** admin@demo.com / Admin@1234

---

## Demo Scenarios

| Scenario | File | Expected Index | Story |
|---|---|---|---|
| Hospital | `demo/hospital.json` | 28 | Patient data, nginx CVE, no encryption |
| Bank | `demo/bank.json` | 35-45 | Wildcard IAM, admin in PUBLIC zone |
| Government | `demo/government.json` | 30-42 | Citizen records, 20yr retention, QVI critical |

---

## Architecture
React + TypeScript (port 5173)
↓ Vite proxy
FastAPI (port 8000)
↓ BackgroundTask
8-Stage Pipeline (3-8 seconds)
↓ Atomic write
SQLite WAL (app/data/quantum_ares.db)

**Security Engines (parallel):**
- Zero Trust — 10 rules (NIST SP 800-207)
- Quantum — QVI formula, HNDL risk_year (NIST FIPS 203)
- Attack Path — BFS + CVE-driven MITRE ATT&CK
- Supply Chain — NVD snapshot CVE lookup

**Security Index Formula:**
`ZT×0.35 + (100-QVI)×0.20 + AP×0.25 + SC×0.10 + Compliance×0.10`

---

## API

Swagger docs: http://localhost:8000/docs

| Method | Endpoint | Description |
|---|---|---|
| POST | /api/v1/auth/login | Get JWT token |
| POST | /api/v1/validate | Upload architecture file |
| GET | /api/v1/scans/{id}/status | Poll pipeline status |
| GET | /api/v1/scans/{id} | Get full results |
| GET | /api/v1/scans/{id}/patches | Get auto-fix patches |
| POST | /api/v1/chat | AI advisory (2-tier) |
| POST | /api/v1/reports/{id}/generate | Generate signed PDF |
| GET | /api/v1/reports/{id} | Download PDF |

---

## Tests
```bash
cd backend
.\venv\Scripts\python.exe -m pytest ../tests/ -v
```

Expected: 104 passed

---

## Deploy

See the deployment guide for Render.com configuration.
Required env vars: `SQLITE_PATH`, `SECRET_KEY`, `ALLOWED_ORIGINS`, `BLOCKCHAIN_MODE`
