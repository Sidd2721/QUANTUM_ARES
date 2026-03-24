# backend/app/pipeline/scoring.py
"""
Security Index calculation.

Formula:
  Security Index = ZT×0.35 + (100-QVI)×0.20 + AP×0.25 + SC×0.10 + C×0.10

Weight justifications:
  ZT  35% → NIST SP 800-207
  QVI 20% → HNDL threat (harvest-now-decrypt-later)
  AP  25% → CVSS v3.1 §7.3 exploitability
  SC  10% → SBOM per Executive Order 14028
  C   10% → DPDP Act 2023 / RBI / NIST alignment
"""

from typing import List, Dict, Tuple
import logging

logger = logging.getLogger(__name__)

ENGINE_WEIGHTS: Dict[str, float] = {
    'zero_trust':   0.35,
    'quantum':      0.20,
    'attack_path':  0.25,
    'supply_chain': 0.10,
    'compliance':   0.10,
}

SEVERITY_DEDUCTIONS: Dict[str, int] = {
    'CRITICAL': 15,
    'HIGH':     8,
    'MEDIUM':   3,
    'LOW':      1,
}


def calculate_security_index(
    scores: dict,
    agg_qvi: float,
    findings: List[Dict]
) -> Tuple[int, dict]:
    # Score calculation
    zt_raw = scores.get('zt', 50.0)
    zt = max(0.0, zt_raw)
    if zt_raw < 0.0:
        logger.info(f'[SCORING] ZT score clamped from {zt_raw:.1f} to 0')

    ap = scores.get('ap', 50.0)
    sc = scores.get('sc', 50.0)
    c  = scores.get('compliance', 100.0)

    raw_index = (
        zt  * 0.35 +
        (100 - min(100.0, agg_qvi)) * 0.20 +
        ap  * 0.25 +
        sc  * 0.10 +
        c   * 0.10
    )

    security_index = max(0, min(100, round(raw_index)))

    per_finding_deltas: Dict[str, float] = {}
    for f in findings:
        plugin   = f.get('engine', 'unknown')
        severity = f.get('severity', 'LOW')
        rule_id  = f.get('rule_id', '?')

        weight    = ENGINE_WEIGHTS.get(plugin, 0.05)
        deduction = SEVERITY_DEDUCTIONS.get(severity, 0)
        delta     = round(deduction * weight, 2)

        existing = abs(per_finding_deltas.get(rule_id, 0))
        per_finding_deltas[rule_id] = -(existing + delta)

    breakdown = {
        'zero_trust':         round(zt * 0.35, 1),
        'quantum':            round((100 - min(100.0, agg_qvi)) * 0.20, 1),
        'attack_path':        round(ap * 0.25, 1),
        'supply_chain':       round(sc * 0.10, 1),
        'compliance':         round(c * 0.10, 1),
        'total':              security_index,
        'per_finding_deltas': per_finding_deltas
    }

    logger.info(
        f'[SCORING] Index: {security_index} | '
        f'ZT:{breakdown["zero_trust"]} QVI:{breakdown["quantum"]} '
        f'AP:{breakdown["attack_path"]} SC:{breakdown["supply_chain"]} '
        f'C:{breakdown["compliance"]}'
    )

    return security_index, breakdown
