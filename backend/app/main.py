# backend/app/main.py
"""
QUANTUM-ARES FastAPI application.

Startup sequence (lifespan):
  1. init_schema()     → create SQLite tables (idempotent)
  2. build_fts5_index()→ index regulatory docs for P1's advisory AI (once)

CORS: configured for P2's React frontend
  - Dev: http://localhost:5173 (Vite default)
  - Docker: http://localhost:80 (nginx)
  - Prod: Render.com URL (set ALLOWED_ORIGINS env var)
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging

from app.config import ALLOWED_ORIGINS, APP_VERSION, APP_TITLE
from app.db.database import init_schema, build_fts5_index, get_db, SQLITE_PATH
from app.api.endpoints import router
from app.api.auth import router as auth_router

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(name)s — %(message)s'
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """FastAPI lifespan: code before yield = startup, after yield = shutdown."""
    logger.info('═' * 60)
    logger.info(f'[STARTUP] {APP_TITLE} v{APP_VERSION} starting...')
    logger.info('[STARTUP] Initialising database schema...')
    init_schema()
    logger.info('[STARTUP] Building FTS5 regulatory document index...')
    build_fts5_index()
    logger.info(f'[STARTUP] Database ready at: {SQLITE_PATH}')

    # Auto-seed on fresh DB (handles Render free-tier resets)
    conn = get_db()
    existing_orgs = conn.execute("SELECT COUNT(*) FROM orgs").fetchone()[0]
    if existing_orgs == 0:
        import uuid as _uuid
        from argon2 import PasswordHasher as _PH
        _ph = _PH()
        conn.execute(
            "INSERT OR IGNORE INTO orgs (id, name) VALUES (?, ?)",
            ("demoorg001", "DemoOrg")
        )
        conn.execute(
            "INSERT OR IGNORE INTO users (id, org_id, email, password_hash) VALUES (?, ?, ?, ?)",
            (str(_uuid.uuid4()), "demoorg001", "admin@demo.com", _ph.hash("Admin@1234"))
        )
        conn.commit()
        logger.info("[STARTUP] Auto-seeded DemoOrg and admin@demo.com")

    logger.info('[STARTUP] QUANTUM-ARES is live. Ready to validate infrastructure.')
    logger.info('═' * 60)
    yield
    logger.info('[SHUTDOWN] QUANTUM-ARES shutting down gracefully.')


app = FastAPI(
    title=APP_TITLE,
    version=APP_VERSION,
    description='Pre-deployment infrastructure security validation. The CIBIL score for IT architecture.',
    lifespan=lifespan,
    docs_url='/docs',      # Swagger UI — visit http://localhost:8000/docs
    redoc_url='/redoc'     # ReDoc — visit http://localhost:8000/redoc
)

# CORS middleware — must be added BEFORE routers
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allow_headers=['*']
)

# Mount routers
app.include_router(auth_router, prefix='/api/v1', tags=['auth'])
app.include_router(router,      prefix='/api/v1', tags=['scans', 'reports'])


# ── Health endpoint ──────────────────────────────────────────────────────────
@app.get('/health', tags=['system'])
def health():
    """
    System health check.
    Checked by Docker healthcheck every 15s.
    Gate 1 verification: must return {"status": "ok", "db": "ok"}
    """
    try:
        conn = get_db()
        conn.execute('SELECT 1')
        # Also verify FTS5 table exists
        fts_count = conn.execute('SELECT COUNT(*) FROM docs_fts').fetchone()[0]
        conn.close()
        db_status = 'ok'
        fts_status = f'ok ({fts_count} chunks)'
    except Exception as e:
        db_status = f'error: {str(e)}'
        fts_status = 'unknown'

    return {
        'status':  'ok' if db_status == 'ok' else 'degraded',
        'db':      db_status,
        'fts5':    fts_status,
        'version': APP_VERSION,
        'service': APP_TITLE
    }
