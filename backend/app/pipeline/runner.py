# backend/app/pipeline/runner.py
"""
QUANTUM-ARES 8-Stage Pipeline Orchestrator.

Called as a FastAPI BackgroundTask after POST /validate.
Single entry point: run_pipeline(scan_id, org_id)

Day 2: Stages 1-3 REAL, Stages 4-8 stub (correct shapes).
ALL P1/P2 imports inside function body with try/except fallbacks.
"""

import time
import logging
from concurrent.futures import ThreadPoolExecutor, as_completed

logger = logging.getLogger(__name__)


def run_pipeline(scan_id: str, org_id: str):
    start = time.monotonic()
    logger.info(f'[PIPELINE] ═══ Starting scan {scan_id} ═══')

    # ── Own imports ─────────────────────────────────────────────────────────
    from app.db.repository import (
        get_scan, update_scan_running, update_scan_result, update_scan_failed
    )
    from app.confidence.model import ConfidenceResolver
    from app.pipeline.scoring import calculate_security_index

    # ── P1 imports (with fallbacks) ─────────────────────────────────────────
    try:
        from app.parsers import parse_input
    except ImportError:
        import json as _json
        def parse_input(raw_text, filename=''):
            data = _json.loads(raw_text)
            return {'nodes': data.get('nodes', []), 'edges': data.get('edges', []),
                    'evidence_source': data.get('evidence_source', 'json')}

    try:
        from app.engines.zero_trust import zero_trust_engine
    except ImportError:
        zero_trust_engine = lambda G: ([], 50.0)

    try:
        from app.engines.quantum import quantum_engine
    except ImportError:
        quantum_engine = lambda G: ([], 0.0)

    try:
        from app.engines.attack_path import attack_path_engine
    except ImportError:
        attack_path_engine = lambda G: ([], 50.0)

    try:
        from app.engines.supply_chain import supply_chain_engine
    except ImportError:
        supply_chain_engine = lambda G: ([], 50.0)

    try:
        from app.engines.compliance import enrich_with_compliance
    except ImportError:
        enrich_with_compliance = lambda findings: (findings, 100.0)

    try:
        from app.ai.opinion import generate_ai_opinion
    except ImportError:
        def generate_ai_opinion(findings, G, confidence):
            for f in findings:
                f['ai_opinion'] = {'impact': 'UNKNOWN', 'likelihood': 'UNKNOWN',
                                   'priority': 'MEDIUM', 'reason': 'AI stub'}
            return findings

    try:
        from app.ai.summarizer import executive_summary
    except ImportError:
        def executive_summary(findings, index, breakdown):
            return {'security_index': index, 'risk_level': 'UNKNOWN',
                    'critical_count': 0, 'high_count': 0, 'attack_paths': 0,
                    'main_risk': 'Stub', 'primary_action': 'Review findings',
                    'score_breakdown': breakdown}

    # ── P2 imports (with fallbacks) ─────────────────────────────────────────
    try:
        from app.graph.builder import build_graph
    except ImportError:
        import networkx as _nx
        def build_graph(data):
            G = _nx.DiGraph()
            for n in data.get('nodes', []):
                G.add_node(n['id'], **{k: v for k, v in n.items() if k != 'id'})
            for e in data.get('edges', []):
                G.add_edge(e['source'], e['target'],
                           **{k: v for k, v in e.items() if k not in ('source', 'target')})
            return G

    try:
        from app.graph.enrich import enrich_graph
    except ImportError:
        enrich_graph = lambda G: G

    try:
        from app.graph.serializer import graph_to_json
    except ImportError:
        def graph_to_json(G):
            return {
                'nodes': [{'id': n, **a} for n, a in G.nodes(data=True)],
                'edges': [{'source': u, 'target': v, **d} for u, v, d in G.edges(data=True)]
            }

    # ── Autofix (stub until Day 5) ──────────────────────────────────────────
    try:
        from app.autofix.engine import generate_auto_fixes
    except ImportError:
        generate_auto_fixes = lambda findings, G: []

    # ════════════════════════════════════════════════════════════════════════
    # PIPELINE EXECUTION
    # ════════════════════════════════════════════════════════════════════════
    try:
        update_scan_running(scan_id)

        # ── STAGE 1: Load scan from DB ────────────────────────────────────
        scan = get_scan(scan_id, org_id)
        if not scan:
            raise ValueError(f'Scan {scan_id} not found in DB for org {org_id}')

        raw_text = scan['input_raw']
        filename = scan.get('name', 'upload.json')
        evidence = scan.get('evidence_source', 'manual')
        logger.info(f'[STAGE 1] Loaded {len(raw_text)} chars | evidence: {evidence}')

        # ── STAGE 2: Parse + Confidence Resolution ────────────────────────
        resolver      = ConfidenceResolver(evidence)
        raw_data      = parse_input(raw_text, filename)
        resolved      = resolver.resolve(raw_data)
        confidence    = resolver.confidence
        conf_warnings = resolver.warnings
        logger.info(
            f'[STAGE 2] Confidence: {confidence:.2f} | '
            f'Trusted: {resolver.is_trusted} | Warnings: {len(conf_warnings)}'
        )

        # ── STAGE 3: Graph Construction + CVE Enrichment ─────────────────
        G = build_graph(resolved)
        G = enrich_graph(G)
        logger.info(
            f'[STAGE 3] Graph: {G.number_of_nodes()} nodes, '
            f'{G.number_of_edges()} edges'
        )

        # ── STAGE 4: Engine Execution (parallel) ─────────────────────────
        engine_fns = {
            'zt':      zero_trust_engine,
            'quantum': quantum_engine,
            'ap':      attack_path_engine,
            'sc':      supply_chain_engine,
        }

        all_findings: list = []
        scores: dict       = {}
        engine_status: dict = {}

        with ThreadPoolExecutor(max_workers=4) as executor:
            futures = {
                executor.submit(fn, G): name
                for name, fn in engine_fns.items()
            }
            for future in as_completed(futures):
                name = futures[future]
                try:
                    findings, score = future.result(timeout=30)
                    all_findings.extend(findings)
                    scores[name] = score
                    engine_status[name] = 'ok'
                    logger.info(f'[STAGE 4] Engine {name}: {len(findings)} findings | score {score:.1f}')
                except Exception as e:
                    logger.error(f'[STAGE 4] Engine {name} FAILED: {e}')
                    scores[name] = 50.0
                    engine_status[name] = 'failed'

        # ── STAGE 5: Compliance Enrichment ───────────────────────────────
        all_findings, compliance_score = enrich_with_compliance(all_findings)
        scores['compliance'] = compliance_score
        logger.info(f'[STAGE 5] Compliance score: {compliance_score:.1f}')

        # ── STAGE 5b: AI Opinion Model ────────────────────────────────────
        all_findings = generate_ai_opinion(all_findings, G, confidence)
        logger.info(f'[STAGE 5b] AI opinions attached to {len(all_findings)} findings')

        # ── STAGE 6: Security Index ───────────────────────────────────────
        agg_qvi = _aggregate_qvi(all_findings)
        security_index, score_breakdown = calculate_security_index(
            scores, agg_qvi, all_findings
        )
        exec_summary = executive_summary(all_findings, security_index, score_breakdown)
        logger.info(f'[STAGE 6] Security Index: {security_index}')

        # ── STAGE 7: Auto-Fix Patches ─────────────────────────────────────
        try:
            patches = generate_auto_fixes(all_findings, G)
            engine_status["autofix"] = "ok"
        except Exception as e:
            patches = []
            engine_status["autofix"] = f"failed: {str(e)[:80]}"
            logger.error(f'[PIPELINE] Stage 7 autofix failed: {e}')
        logger.info(f'[STAGE 7] Generated {len(patches)} auto-fix patches')

        # ── STAGE 8: Atomic DB Write ──────────────────────────────────────
        risk_summary = {
            severity: sum(1 for f in all_findings if f.get('severity') == severity)
            for severity in ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW')
        }
        duration_ms = int((time.monotonic() - start) * 1000)

        update_scan_result(scan_id, {
            'graph_json':          graph_to_json(G),
            'node_count':          G.number_of_nodes(),
            'security_index':      security_index,
            'score_breakdown':     score_breakdown,
            'risk_summary':        risk_summary,
            'findings':            all_findings,
            'ai_opinions':         [f.get('ai_opinion', {}) for f in all_findings if 'ai_opinion' in f],
            'executive_summary':   exec_summary,
            'auto_fix_patches':    patches,
            'confidence_warnings': conf_warnings,
            'engine_status':       engine_status,
            'duration_ms':         duration_ms
        })

        logger.info(
            f'[PIPELINE] ═══ Scan {scan_id} COMPLETE in {duration_ms}ms | '
            f'Index: {security_index} | Findings: {len(all_findings)} ═══'
        )

    except Exception as e:
        logger.exception(f'[PIPELINE] ═══ Scan {scan_id} FAILED: {e} ═══')
        update_scan_failed(scan_id)


def _aggregate_qvi(findings: list) -> float:
    qvi_values = [f['qvi'] for f in findings if 'qvi' in f]
    return sum(qvi_values) / len(qvi_values) if qvi_values else 0.0
