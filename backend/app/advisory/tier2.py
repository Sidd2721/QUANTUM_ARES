# backend/app/advisory/tier2.py
"""
Tier-2 AI Advisory — FTS5 BM25 full-text search over regulatory documents.

Searches the docs_fts table (populated by P3's startup handler).
Returns actual document passages — NOT generated text. Zero hallucination.
Response time: < 300ms.

The docs_fts table is READ-ONLY from this module.
P3 owns the write side (build_fts5_index() in db/database.py).
"""
import sqlite3
import logging
from typing import Optional
from app.config import SQLITE_PATH

logger = logging.getLogger(__name__)


def tier2_answer(question: str, db_path: Optional[str] = None) -> dict:
    """
    BM25 keyword search over NIST/DPDP/RBI documents in docs_fts table.
    Returns the top 3 matching passages.

    db_path: optional override (used in tests). Default: SQLITE_PATH from config.
    """
    path = db_path or SQLITE_PATH

    try:
        conn = sqlite3.connect(path)
        rows = conn.execute('''
            SELECT doc_id, title, content, source, bm25(docs_fts) AS rank
            FROM docs_fts
            WHERE docs_fts MATCH ?
            ORDER BY rank
            LIMIT 3
        ''', (question,)).fetchall()
        conn.close()
    except Exception as e:
        logger.error(f'[TIER2] FTS5 query failed: {e}')
        return {
            'answer':  'Regulatory document search temporarily unavailable.',
            'tier':    'semantic',
            'sources': []
        }

    if not rows:
        return {
            'answer':  'No relevant compliance guidance found for this question.',
            'tier':    'semantic',
            'sources': []
        }

    primary = rows[0]
    return {
        'answer':  primary[2],      # content passage
        'tier':    'semantic',
        'source':  primary[3],      # source framework name
        'sources': [
            {'doc_id': r[0], 'title': r[1], 'passage': r[2], 'source': r[3]}
            for r in rows
        ]
    }


def route_ai(question: str, db_path: Optional[str] = None) -> dict:
    """
    Routes question: Tier-1 first (< 50ms), falls back to Tier-2 (< 300ms).
    """
    from .tier1 import tier1_answer
    result = tier1_answer(question)
    return result if result else tier2_answer(question, db_path)
