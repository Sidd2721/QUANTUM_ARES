# backend/app/db/queries.py
"""
All typed query functions for the QUANTUM-ARES database.

Design rules:
  1. Every function opens its own connection and closes it when done.
     Never share connections across threads — SQLite connections are
     not thread-safe when shared.
  2. update_scan_result() is ATOMIC: one UPDATE writes all pipeline
     results at once. Never partial writes. Never multiple UPDATEs.
  3. All JSON columns are serialised on write and deserialised on read.
  4. get_scan() enforces org_id boundary — you cannot read another org's scan.
"""

import sqlite3
import json
import uuid
import logging
from .database import get_db

logger = logging.getLogger(__name__)


def create_scan(org_id: str, name: str, input_raw: str, evidence_source: str) -> str:
    """
    Creates a new scan record in 'pending' status.
    Returns the new scan_id (UUID without hyphens, 32 hex chars).
    """
    scan_id = str(uuid.uuid4()).replace('-', '')
    conn = get_db()
    conn.execute(
        '''INSERT INTO scans (id, org_id, name, input_raw, evidence_source, status)
           VALUES (?, ?, ?, ?, ?, 'pending')''',
        (scan_id, org_id, name, input_raw, evidence_source)
    )
    conn.commit()
    conn.close()
    logger.info(f'[QUERY] Scan created: {scan_id} | org: {org_id} | source: {evidence_source}')
    return scan_id


def update_scan_running(scan_id: str):
    """Transition scan to 'running' when pipeline starts."""
    conn = get_db()
    conn.execute("UPDATE scans SET status='running' WHERE id=?", (scan_id,))
    conn.commit()
    conn.close()


def update_scan_result(scan_id: str, result: dict):
    """
    ATOMIC write — all pipeline results in one UPDATE statement.
    Called at Stage 8 (final stage) of the pipeline runner.

    The result dict MUST contain all these keys:
      graph_json, node_count, security_index, score_breakdown,
      risk_summary, findings, ai_opinions, executive_summary,
      auto_fix_patches, confidence_warnings, engine_status, duration_ms

    All JSON fields are serialised here. Caller passes Python objects.
    """
    conn = get_db()
    conn.execute(
        '''UPDATE scans SET
               graph_json          = ?,
               node_count          = ?,
               status              = 'complete',
               security_index      = ?,
               score_breakdown     = ?,
               risk_summary        = ?,
               findings            = ?,
               ai_opinions         = ?,
               executive_summary   = ?,
               auto_fix_patches    = ?,
               confidence_warnings = ?,
               engine_status       = ?,
               completed_at        = CURRENT_TIMESTAMP,
               duration_ms         = ?
           WHERE id = ?''',
        (
            json.dumps(result['graph_json']),
            result['node_count'],
            result['security_index'],
            json.dumps(result['score_breakdown']),
            json.dumps(result['risk_summary']),
            json.dumps(result['findings']),
            json.dumps(result['ai_opinions']),
            json.dumps(result['executive_summary']),
            json.dumps(result['auto_fix_patches']),
            json.dumps(result['confidence_warnings']),
            json.dumps(result['engine_status']),
            result['duration_ms'],
            scan_id
        )
    )
    conn.commit()
    conn.close()
    logger.info(f'[QUERY] Scan result persisted: {scan_id} | index: {result["security_index"]}')


def update_scan_failed(scan_id: str):
    """
    Mark scan as failed. Called when pipeline runner catches an exception.
    Preserves created_at, clears completed_at, records failure timestamp.
    """
    conn = get_db()
    conn.execute(
        "UPDATE scans SET status='failed', completed_at=CURRENT_TIMESTAMP WHERE id=?",
        (scan_id,)
    )
    conn.commit()
    conn.close()
    logger.warning(f'[QUERY] Scan marked failed: {scan_id}')


def get_scan(scan_id: str, org_id: str) -> dict | None:
    """
    Fetch a single scan by id, enforcing org_id boundary.
    Returns None if not found OR if scan belongs to different org.
    Automatically deserialises all JSON columns.
    """
    conn = get_db()
    row = conn.execute(
        'SELECT * FROM scans WHERE id=? AND org_id=?',
        (scan_id, org_id)
    ).fetchone()
    conn.close()

    if not row:
        return None

    d = dict(row)

    # Deserialise all JSON columns — they are stored as strings in SQLite
    json_columns = [
        'graph_json', 'score_breakdown', 'risk_summary', 'findings',
        'ai_opinions', 'executive_summary', 'auto_fix_patches',
        'confidence_warnings', 'engine_status'
    ]
    for col in json_columns:
        val = d.get(col)
        if isinstance(val, str):
            try:
                d[col] = json.loads(val)
            except (json.JSONDecodeError, TypeError):
                d[col] = {} if col not in ('findings', 'auto_fix_patches',
                                            'confidence_warnings') else []

    return d


def list_scans(org_id: str, page: int = 1, limit: int = 20) -> list:
    """
    Paginated scan list for an org.
    Returns summary fields only — NOT the full JSON blobs.
    Keeps response small for the frontend list view.
    """
    if limit > 100:
        limit = 100  # cap to prevent abuse
    offset = (page - 1) * limit
    conn = get_db()
    rows = conn.execute(
        '''SELECT id, name, security_index, status, created_at, node_count, evidence_source
           FROM scans
           WHERE org_id=?
           ORDER BY created_at DESC
           LIMIT ? OFFSET ?''',
        (org_id, limit, offset)
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]


# ── Report queries ────────────────────────────────────────────────────────────

def create_report(conn, scan_id: str, org_id: str) -> str:
    """Create a report row in pending state. Returns report_id."""
    report_id = str(uuid.uuid4())
    conn.execute(
        """INSERT INTO reports (id, org_id, scan_id, status, sha256_hash, rsa_signature, public_key_pem, created_at)
           VALUES (?, ?, ?, 'pending', '', '', '', datetime('now'))""",
        (report_id, org_id, scan_id)
    )
    conn.commit()
    return report_id


def update_report(conn, report_id: str, pdf_bytes: bytes,
                  sha256: str, sig_b64: str, pub_pem: str):
    """Store the signed PDF and mark report as complete."""
    conn.execute(
        """UPDATE reports SET
               pdf_data   = ?,
               sha256     = ?,
               sig_b64    = ?,
               pub_pem    = ?,
               status     = 'complete',
               created_at = datetime('now')
           WHERE id = ?""",
        (pdf_bytes, sha256, sig_b64, pub_pem, report_id)
    )
    conn.commit()


def get_report(conn, report_id: str, org_id: str) -> dict | None:
    """Fetch a report row. Returns None if not found or wrong org."""
    row = conn.execute(
        "SELECT * FROM reports WHERE id = ? AND org_id = ?",
        (report_id, org_id)
    ).fetchone()
    return dict(row) if row else None
