# backend/app/db/database.py
"""
SQLite connection manager.

Functions:
  get_db()          → opens a connection with WAL + row_factory
  init_schema()     → runs schema.sql on startup (idempotent)
  build_fts5_index()→ populates docs_fts from data/ text files (once)
"""

import sqlite3
import os
import logging
from pathlib import Path

logger = logging.getLogger(__name__)

SCHEMA_PATH = Path(__file__).parent / 'schema.sql'
DATA_DIR = Path(__file__).parent.parent / 'data'

# Default DB path (used when env var not set)
_DEFAULT_DB_PATH = str(Path(__file__).parent.parent / 'data' / 'quantum_ares.db')


def _get_sqlite_path() -> str:
    """Read SQLITE_PATH from env at call time — allows tests to override."""
    return os.environ.get('SQLITE_PATH', _DEFAULT_DB_PATH)


# Module-level SQLITE_PATH for backward-compat imports by other modules
SQLITE_PATH = _get_sqlite_path()


def get_db() -> sqlite3.Connection:
    """
    Opens a SQLite connection.

    - check_same_thread=False: required because FastAPI background tasks
      run in threads separate from the main thread.
    - row_factory=sqlite3.Row: lets you access columns by name (row['column'])
      instead of index (row[0]). Much safer.
    - WAL mode: allows multiple concurrent reads while one writer is active.
      Critical for demo stability when the frontend polls /status every 2s
      while the pipeline is writing.
    - For :memory: databases, uses file::memory:?cache=shared URI so all
      connections share the same in-memory database (critical for tests).
    """
    db_path = _get_sqlite_path()
    if db_path == ':memory:':
        conn = sqlite3.connect('file::memory:?cache=shared', uri=True, check_same_thread=False)
    else:
        Path(db_path).parent.mkdir(parents=True, exist_ok=True)
        conn = sqlite3.connect(db_path, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute('PRAGMA foreign_keys=ON')
    if db_path != ':memory:':
        conn.execute('PRAGMA journal_mode=WAL')
        conn.execute('PRAGMA synchronous=NORMAL')
    return conn


def init_schema():
    """
    Creates all tables, indexes, and the FTS5 virtual table.
    Called once at FastAPI startup via lifespan context manager.
    Safe to call every time — all statements are CREATE IF NOT EXISTS.
    """
    db_path = _get_sqlite_path()
    if db_path != ':memory:':
        Path(db_path).parent.mkdir(parents=True, exist_ok=True)
    conn = get_db()
    schema_sql = SCHEMA_PATH.read_text(encoding='utf-8')
    conn.executescript(schema_sql)
    conn.commit()
    conn.close()
    logger.info(f'[DB] Schema initialised: {db_path}')


def build_fts5_index():
    """
    Populates the docs_fts FTS5 table with regulatory documents.
    Skips if already populated (idempotent).

    Each document is chunked into 500-word passages for better FTS5
    precision. The chunk_id format is '{doc_id}_{chunk_number}'.

    P1's tier2.py advisory AI reads this table for semantic search.
    """
    conn = get_db()

    # Ensure the FTS5 table exists (handles :memory: and fresh DBs)
    try:
        conn.execute('''
            CREATE VIRTUAL TABLE IF NOT EXISTS docs_fts USING fts5(
                doc_id, title, content, source
            )
        ''')
        conn.commit()
    except Exception:
        pass  # FTS5 table already exists or not supported

    try:
        count = conn.execute('SELECT COUNT(*) FROM docs_fts').fetchone()[0]
    except Exception:
        count = 0

    if count > 0:
        conn.close()
        logger.info(f'[DB] FTS5 index already has {count} entries — skipping')
        return

    docs = [
        ('nist_zt', 'NIST SP 800-207 Zero Trust Architecture',
         'nist_sp_800_207.txt', 'NIST SP 800-207'),
        ('dpdp', 'Digital Personal Data Protection Act 2023',
         'dpdp_act_2023.txt', 'DPDP Act 2023'),
        ('rbi', 'RBI Master Direction on IT Risk Framework',
         'rbi_master_direction.txt', 'RBI Master Direction'),
    ]

    total_chunks = 0
    for doc_id, title, filename, source in docs:
        fpath = DATA_DIR / filename
        if not fpath.exists():
            logger.warning(f'[DB] FTS5: {filename} not found — skipping')
            continue

        content = fpath.read_text(encoding='utf-8')
        words = content.split()

        for i in range(0, len(words), 500):
            chunk = ' '.join(words[i:i + 500])
            chunk_id = f'{doc_id}_{i // 500}'
            conn.execute(
                'INSERT INTO docs_fts (doc_id, title, content, source) VALUES (?, ?, ?, ?)',
                (chunk_id, title, chunk, source)
            )
            total_chunks += 1

    conn.commit()
    conn.close()
    logger.info(f'[DB] FTS5 index built: {total_chunks} chunks across 3 documents')
