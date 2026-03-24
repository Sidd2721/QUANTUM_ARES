# QUANTUM-ARES v7.75 — Local Startup Guide

## Prerequisites
- Python 3.11+ with `venv`
- Node.js 18+
- Both terminals open in the project root

## Terminal 1 — Backend (FastAPI)

```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate
pip install -r requirements.txt
python -m app.scripts.seed          # Creates admin@demo.com org
uvicorn app.main:app --reload --port 8000
```

## Terminal 2 — Frontend (Vite + React)

```powershell
cd frontend
npm install
npm run dev -- --host
```

## Access

| Page | URL |
|------|-----|
| Landing Page | http://localhost:5173 |
| Login | http://localhost:5173/login |
| Dashboard | http://localhost:5173/dashboard |

**Test credentials:** `admin@demo.com` / `Admin@1234`

## Quick Smoke Test

1. Open http://localhost:5173 → Landing page with hero, features, stats
2. Click "Sign In" → Login form appears
3. Enter `admin@demo.com` / `Admin@1234` → Redirects to `/dashboard/risk-overview`
4. Drop `demo/demo_hospital.json` in upload zone → Pipeline runs → Data populates
5. Click through all 5 tabs to verify
