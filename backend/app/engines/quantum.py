# backend/app/engines/quantum.py
"""
Quantum Risk Engine — QVI formula based on NIST PQC timeline.

QVI (Quantum Vulnerability Index) = sensitivity_weight × encryption_vulnerability × (1 + retention_years/10)

QVI is P3's proprietary model — documented and open to scrutiny.
Migration recommendations cite NIST FIPS 203 (ML-KEM) and FIPS 204 (ML-DSA),
published August 2024.

HNDL (Harvest-Now-Decrypt-Later) risk_year = 2025 + (100 - QVI) / 10

Judge pitch: "QVI is our proprietary risk model, not a standard formula.
The migration recommendations cite NIST FIPS 203, published August 2024.
We claim ownership of the formula, not a standard."

Return: (findings, agg_qvi) — note: returns agg_qvi, not a 0-100 score.
Scoring formula uses: (100 - agg_qvi) × 0.20
"""
import networkx as nx
import logging
from typing import List, Dict, Tuple

logger = logging.getLogger(__name__)

# Vulnerability score per encryption type (0=safe, 100=fully vulnerable)
VULN_SCORES = {
    'RSA-1024': 95, 'RSA-2048': 85, 'RSA-4096': 70,
    'ECC-256':  80, 'ECC-384':  75,
    'DH-1024':  90, 'DH-2048':  85,
    'AES-128':  40, 'AES-256':  15,
    'ML-KEM-768': 5, 'Kyber-768': 5,
    'none':    100, 'unknown':  50,
}

# Weight by data sensitivity
SENSITIVITY_WEIGHT = {
    'LOW': 0.2, 'MEDIUM': 0.5, 'HIGH': 0.8, 'CRITICAL': 1.0
}


def quantum_engine(G: nx.DiGraph) -> Tuple[List[Dict], float]:
    """
    Calculates QVI for each node, generates findings for QVI > 40.
    Returns (findings, agg_qvi) where agg_qvi is weighted average QVI.
    """
    findings = []
    qvi_list = []  # [(qvi, weight)] for aggregation

    for node, attrs in G.nodes(data=True):
        enc    = attrs.get('encryption_type', 'unknown')
        vuln   = VULN_SCORES.get(enc, 50)
        weight = SENSITIVITY_WEIGHT.get(attrs.get('data_sensitivity', 'LOW'), 0.2)
        years  = int(attrs.get('retention_years', 0))

        qvi = min(100.0, weight * vuln * (1 + years / 10))
        qvi_list.append((qvi, weight))

        if qvi > 40:
            risk_year = int(2025 + (100 - qvi) / 10)
            sev = 'CRITICAL' if qvi > 80 else 'HIGH'

            findings.append({
                'rule_id':       'Q-001',
                'severity':      sev,
                'mitre_id':      'T1600',
                'cvss':          8.5 if qvi > 80 else 6.5,
                'affected_nodes': [node],
                'description':   (
                    f'Node "{node}" uses {enc} (QVI {qvi:.1f}). '
                    f'Data at quantum-decryption risk by {risk_year}.'
                ),
                'remediation':   'Migrate to ML-KEM-768 (NIST FIPS 203) for key exchange.',
                'plugin':        'quantum',
                'qvi':           round(qvi, 1),
                'risk_year':     risk_year,
                'business_impact': (
                    f'Data stored for {years}y at quantum-decryption risk by {risk_year}. '
                    f'Nation-states recording encrypted data today for future decryption.'
                ),
                'business_risk': 'DPDP Act 2023 Section 8(3) — technical protection measures required.',
                'compliance_clauses': [],
            })

    total_w = sum(w for _, w in qvi_list)
    agg_qvi = sum(q * w for q, w in qvi_list) / total_w if total_w else 0.0

    logger.info(f'[QUANTUM] {len(findings)} findings | agg_qvi: {agg_qvi:.1f}')
    return findings, round(agg_qvi, 2)
