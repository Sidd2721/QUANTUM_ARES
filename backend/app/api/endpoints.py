# backend/app/api/routes.py
"""
QUANTUM-ARES API endpoints.

Day 1 (today): 4 endpoints + stub pipeline (immediate complete, no real engines)
Day 2: Replace stub pipeline with real pipeline.runner.run_pipeline()
Day 5: Add /patches, /reports, /chat endpoints

All protected endpoints use Depends(get_current_org) for JWT auth.
The org_id from the JWT token is ALWAYS used — users cannot access
other orgs' data even if they guess a scan_id.
"""

import time
import logging
from fastapi import APIRouter, BackgroundTasks, UploadFile, File, Form, Depends, HTTPException
from fastapi.responses import Response

from .auth import get_current_org
from app.db.repository import (
    create_scan, get_scan, list_scans,
    update_scan_result, update_scan_running, update_scan_failed
)
from app.db.database import get_db
from app.pipeline.runner import run_pipeline

router = APIRouter()
logger = logging.getLogger(__name__)


# ── STUB PIPELINE (Day 1 only) ─────────────────────────────────────────────
# This stub lets Gate 1 tests pass without P1/P2 code.
# On Day 2, you will replace the line:
#   bg.add_task(_stub_pipeline, scan_id, auth['org_id'])
# with:
#   bg.add_task(run_pipeline, scan_id, auth['org_id'])
# after importing run_pipeline from app.pipeline.runner

def _stub_pipeline(scan_id: str, org_id: str):
    """
    Temporary stub pipeline for Day 1.
    Immediately completes with placeholder values so Gate 1 tests pass.
    Replace with real pipeline on Day 2.
    """
    try:
        update_scan_running(scan_id)
        time.sleep(0.3)  # small delay simulates processing
        update_scan_result(scan_id, {
            'graph_json':         {'nodes': [], 'edges': [], 'stub': True},
            'node_count':         0,
            'security_index':     42,
            'score_breakdown':    {
                'zero_trust':    14.7,
                'quantum':        8.4,
                'attack_path':   10.5,
                'supply_chain':   5.0,
                'compliance':     3.4,
                'total':         42,
                'per_finding_deltas': {}
            },
            'risk_summary':       {'CRITICAL': 0, 'HIGH': 0, 'MEDIUM': 0, 'LOW': 0},
            'findings':           [],
            'ai_opinions':        {},
            'executive_summary':  {
                'security_index': 42,
                'risk_level':     'HIGH',
                'critical_count': 0,
                'high_count':     0,
                'attack_paths':   0,
                'main_risk':      'Stub pipeline — real analysis from Day 2',
                'primary_action': 'Replace stub with real pipeline runner'
            },
            'auto_fix_patches':   [],
            'confidence_warnings':[],
            'engine_status':      {
                'zt':      'stub',
                'quantum': 'stub',
                'ap':      'stub',
                'sc':      'stub'
            },
            'duration_ms':        300
        })
        logger.info(f'[STUB_PIPELINE] Completed scan {scan_id}')
    except Exception as e:
        logger.error(f'[STUB_PIPELINE] Failed scan {scan_id}: {e}')
        update_scan_failed(scan_id)


# ── POST /validate ──────────────────────────────────────────────────────────
@router.post('/validate', status_code=202)
async def validate(
    bg: BackgroundTasks,
    file: UploadFile = File(...),
    name: str = Form('unnamed'),
    evidence_source: str = Form('json'),
    auth=Depends(get_current_org)
):
    """
    Accept infrastructure blueprint file for security validation.

    Supported formats: JSON (today), YAML/Terraform (Day 2 with P1 parsers)
    Supported evidence sources: manual, json, yaml, terraform, aws_config, k8s

    Returns 202 immediately with scan_id.
    Client must poll GET /scans/{id}/status for completion.

    Pipeline runs as FastAPI BackgroundTask — never blocks the HTTP response.
    """
    try:
        raw_bytes = await file.read()
        raw_text = raw_bytes.decode('utf-8')
    except UnicodeDecodeError:
        raise HTTPException(status_code=400, detail='File must be UTF-8 encoded text')

    if len(raw_text.strip()) < 10:
        raise HTTPException(status_code=400, detail='Uploaded file is too small or empty')

    logger.info(f"[API] Validate received raw_text head: {raw_text[:100]}")

    # Validate evidence_source
    valid_sources = {'manual', 'json', 'yaml', 'terraform', 'aws_config', 'k8s', 'nmap'}
    if evidence_source not in valid_sources:
        raise HTTPException(
            status_code=400,
            detail=f'Invalid evidence_source. Must be one of: {valid_sources}'
        )

    scan_id = create_scan(auth['org_id'], name, raw_text, evidence_source)

    # Day 2: Real pipeline (Stages 1-3 live, 4-8 stub engines)
    bg.add_task(run_pipeline, scan_id, auth['org_id'])

    logger.info(f'[API] Scan queued: {scan_id} | name: {name} | source: {evidence_source}')
    return {
        'scan_id':  scan_id,
        'status':   'pending',
        'message':  'Scan queued. Poll /scans/{id}/status for updates.'
    }


# ── GET /scans/{id}/status ──────────────────────────────────────────────────
@router.get('/scans/{scan_id}/status')
def scan_status(scan_id: str, auth=Depends(get_current_org)):
    """
    Lightweight status polling endpoint.
    P2's frontend ScanPoller.tsx polls this every 2 seconds until status='complete'.

    Returns minimal data — NOT the full findings/patches JSON.
    Keep this response small so polling is fast.
    """
    scan = get_scan(scan_id, auth['org_id'])
    if not scan:
        raise HTTPException(status_code=404, detail='Scan not found')

    return {
        'scan_id':        scan_id,
        'status':         scan['status'],
        'security_index': scan['security_index'],
        'engine_status':  scan['engine_status'],
        'duration_ms':    scan['duration_ms'],
        'node_count':     scan['node_count']
    }


# ── GET /scans/{id} ─────────────────────────────────────────────────────────
@router.get('/scans/{scan_id}')
def get_scan_result(scan_id: str, auth=Depends(get_current_org)):
    """
    Full scan result — all pipeline outputs.
    Only returns complete data when status='complete'.
    If still running or failed, returns just the status.
    """
    scan = get_scan(scan_id, auth['org_id'])
    if not scan:
        raise HTTPException(status_code=404, detail='Scan not found')

    if scan['status'] not in ('complete', 'completed'):
        return {
            'scan_id': scan_id,
            'status':  scan['status'],
            'message': 'Scan not yet complete. Poll /scans/{id}/status.'
        }

    # Alias graph_json to graph_data for frontend compatibility
    scan['graph_data'] = scan.get('graph_json', {})

    return scan


# ── GET /scans ──────────────────────────────────────────────────────────────
@router.get('/scans')
def list_all_scans(
    page: int = 1,
    limit: int = 20,
    auth=Depends(get_current_org)
):
    """
    Paginated list of scans for the authenticated org.
    Summary fields only — not full findings/patches blobs.
    P2 frontend uses this for the scan history list view.
    """
    if page < 1:
        page = 1
    scans = list_scans(auth['org_id'], page, limit)
    return {
        'scans': scans,
        'page':  page,
        'limit': limit,
        'count': len(scans)
    }


# ── GET /scans/{id}/opinion ─────────────────────────────────────────────────
@router.get('/scans/{scan_id}/opinion')
def get_scan_opinion(scan_id: str, auth=Depends(get_current_org)):
    """
    Returns AI opinion data for a scan.
    Includes executive summary + per-finding AI opinions.
    P2 frontend AIOpinionPanel.tsx reads this endpoint.
    Added Day 2 — data populated by Stage 5b.
    """
    scan = get_scan(scan_id, auth['org_id'])
    if not scan:
        raise HTTPException(status_code=404, detail='Scan not found')
    if scan['status'] not in ('complete', 'completed'):
        return {'status': scan['status'], 'message': 'Scan not yet complete'}

    findings_with_opinion = [
        f for f in scan.get('findings', [])
        if 'ai_opinion' in f
    ]

    return {
        'scan_id':          scan_id,
        'executive_summary': scan.get('executive_summary', {}),
        'findings':          findings_with_opinion,
        'confidence_panel':  {
            'warnings':       scan.get('confidence_warnings', []),
            'engine_status':  scan.get('engine_status', {}),
        }
    }


# ── GET /scans/{scan_id}/patches ─────────────────────────────────────────
@router.get('/scans/{scan_id}/patches')
def get_patches(
    scan_id: str,
    format: str = 'json',
    auth=Depends(get_current_org)
):
    """
    Returns auto-fix patches for a completed scan.

    format=json     → JSON array (default) — used by AutoFixPanel.tsx
    format=download → .tf plaintext file download

    Each patch: title, score_impact, difficulty, affected_node, rule_id,
    severity, and one of: terraform{file,instructions,content} | iam | kubernetes | notes.
    """
    scan = get_scan(scan_id, auth['org_id'])
    if not scan:
        raise HTTPException(status_code=404, detail='Scan not found')
    if scan['status'] not in ('complete', 'completed'):
        raise HTTPException(
            status_code=400,
            detail=f'Scan not yet complete — status is "{scan["status"]}". Patches available after completion.'
        )

    patches = scan.get('auto_fix_patches', [])

    if format == 'download':
        lines = []
        for p in patches:
            lines.append(f'# ── {p.get("title", "Fix")} (score impact: {p.get("score_impact", "")}) ──')
            lines.append(f'# Affected node: {p.get("affected_node", "unknown")} | Severity: {p.get("severity", "")}')
            if 'terraform' in p:
                lines.append(p['terraform'].get('content', '# No Terraform content'))
            elif 'iam' in p:
                lines.append(f'# IAM Policy — save as {p["iam"].get("file", "policy.json")}')
                lines.append(p['iam'].get('content', ''))
            elif 'kubernetes' in p:
                lines.append(f'# Kubernetes — update {p["kubernetes"].get("file", "deployment.yaml")}')
                lines.append(p['kubernetes'].get('content', ''))
            elif 'notes' in p:
                lines.append(f'# {p["notes"]}')
            lines.append('')
        content = '\n'.join(lines)
        return Response(
            content=content,
            media_type='text/plain',
            headers={'Content-Disposition': f'attachment; filename="patches_{scan_id[:8]}.tf"'}
        )

    return {
        'scan_id':            scan_id,
        'patches':            patches,
        'count':              len(patches),
        'total_score_impact': _sum_score_impact(patches)
    }


def _sum_score_impact(patches: list) -> int:
    """Sum all score_impact integers for the 'score could improve by X' UI label."""
    total = 0
    for p in patches:
        try:
            total += int(str(p.get('score_impact', '+0')).replace('+', '').strip())
        except (ValueError, TypeError):
            pass
    return total


# ── POST /chat ────────────────────────────────────────────────────────────
@router.post('/chat')
def chat(body: dict, auth=Depends(get_current_org)):
    """
    AI Advisory — 2-tier routing system.

    Tier 1 (rapidfuzz, < 50ms):
      Fuzzy-matches against 20 curated templates.
      Returns: {answer, tier:'rule_engine', source, match_score}

    Tier 2 (FTS5 BM25, < 300ms):
      Searches NIST/DPDP/RBI regulatory documents.
      Returns: {answer, tier:'semantic', source, sources:[...]}

    Never returns 500 — if both tiers fail, returns 200 with error message.

    Body: {question: str}
    """
    question = body.get('question', '').strip()
    if not question:
        raise HTTPException(status_code=400, detail='question field is required and must not be empty')

    # Tier 1: rapidfuzz exact template match (< 50ms)
    try:
        from app.advisory.tier1 import tier1_answer
        result = tier1_answer(question)
        if result:
            return result
    except Exception as e:
        logger.warning(f'[CHAT] Tier 1 error: {e}')

    # Tier 2: FTS5 BM25 document search (< 300ms)
    try:
        from app.advisory.tier2 import tier2_answer
        from app.config import SQLITE_PATH
        return tier2_answer(question, SQLITE_PATH)
    except Exception as e:
        logger.error(f'[CHAT] Tier 2 error: {e}')
        # Never return 500 — always give the frontend something
        return {
            'answer':  'Advisory service is temporarily unavailable. Please try again.',
            'tier':    'error',
            'source':  'system',
            'sources': []
        }


# ── REPORT ENDPOINTS (Day 5) ────────────────────────────────────────────────

@router.post('/reports/{scan_id}/generate')
async def generate_report(scan_id: str, auth=Depends(get_current_org)):
    """
    Generate a signed PDF report for a completed scan.
    Returns report_id + sha256. Use GET /reports/{report_id} to download PDF.
    """
    from app.report.pdf_builder import build_pdf
    from app.report.signer import sign_pdf
    from app.db.repository import create_report, update_report

    scan = get_scan(scan_id, auth['org_id'])
    if not scan:
        raise HTTPException(status_code=404, detail='Scan not found')
    if scan.get('status') != 'complete':
        raise HTTPException(
            status_code=400,
            detail=f'Scan is not complete (status={scan.get("status")})'
        )

    # Pass 1: Build the PDF to get byte representation for signing
    pdf_bytes = build_pdf(scan, org_name=auth.get('name', 'Organisation'))

    # Sign the raw PDF byte stream
    sig_data = sign_pdf(pdf_bytes)

    # Pass 2: Re-build PDF injecting the signature into the footer
    final_pdf_bytes = build_pdf(scan, org_name=auth.get('name', 'Organisation'), signature=sig_data['sig_b64'])

    # Store in DB
    conn = get_db()
    report_id = create_report(conn, scan_id=scan_id, org_id=auth['org_id'])
    update_report(
        conn, report_id,
        pdf_bytes=final_pdf_bytes,
        sha256=sig_data['sha256'],
        sig_b64=sig_data['sig_b64'],
        pub_pem=sig_data['pub_pem'],
    )
    conn.close()

    return {
        'report_id': report_id,
        'scan_id':   scan_id,
        'sha256':    sig_data['sha256'],
        'status':    'complete',
    }


@router.get('/reports/{report_id}')
async def download_report(report_id: str, auth=Depends(get_current_org)):
    """
    Download a generated PDF report as application/pdf.
    Returns raw PDF bytes with Content-Disposition: attachment.
    """
    from app.db.repository import get_report

    conn = get_db()
    report = get_report(conn, report_id=report_id, org_id=auth['org_id'])
    conn.close()

    if not report:
        raise HTTPException(status_code=404, detail='Report not found')
    if report.get('status') != 'complete':
        raise HTTPException(status_code=400, detail='Report is not ready')

    pdf_bytes = report.get('pdf_data')
    if not pdf_bytes or len(pdf_bytes) < 100:
        raise HTTPException(status_code=500, detail='Report data corrupted or empty')

    return Response(
        content=bytes(pdf_bytes),          # sqlite3 returns memoryview — cast to bytes
        media_type='application/pdf',
        headers={
            'Content-Disposition': f'attachment; filename="quantum_ares_report_{report_id[:8]}.pdf"',
            'X-SHA256':  report.get('sha256', ''),
            'X-Sig-B64': (report.get('sig_b64', '') or '')[:32] + '...',
        }
    )
