# engines/quantum.py

import networkx as nx
from typing import List, Dict, Tuple

VULN_SCORES = {
    'RSA-1024': 95, 'RSA-2048': 85, 'RSA-4096': 70,
    'ECC-256': 80, 'ECC-384': 75,
    'DH-1024': 90, 'DH-2048': 85,
    'AES-128': 40, 'AES-256': 15,
    'ML-KEM-768': 5, 'Kyber-768': 5,
    'none': 100, 'unknown': 50
}

SENSITIVITY_WEIGHT = {
    'LOW': 0.2, 'MEDIUM': 0.5,
    'HIGH': 0.8, 'CRITICAL': 1.0
}


def quantum_engine(G: nx.DiGraph) -> Tuple[List[Dict], float]:
    findings = []
    qvi_list = []

    for node, attrs in G.nodes(data=True):
        enc = attrs.get('encryption_type', 'unknown')
        vuln = VULN_SCORES.get(enc, 50)
        weight = SENSITIVITY_WEIGHT.get(attrs.get('data_sensitivity', 'LOW'), 0.2)
        years = attrs.get('retention_years', 0)

        qvi = min(100, weight * vuln * (1 + years / 10))
        qvi_list.append((qvi, weight))

        if qvi > 40:
            risk_year = int(2025 + (100 - qvi) / 10)

            findings.append({
                'rule_id': 'Q-001',
                'severity': 'CRITICAL' if qvi > 80 else 'HIGH',
                'mitre_id': 'T1600',
                'cvss': 8.5 if qvi > 80 else 6.5,
                'affected_nodes': [node],
                'description': f'Node "{node}" uses {enc} (QVI {qvi:.1f}). Data at risk by {risk_year}.',
                'remediation': 'Migrate to ML-KEM-768 (post-quantum encryption).',
                'plugin': 'quantum',
                'qvi': round(qvi, 1),
                'risk_year': risk_year,
                'business_impact': f'Data stored {years}y at quantum risk.',
                'business_risk': 'Future cryptographic break risk.',
                'compliance_clauses': []
            })

    total_weight = sum(w for _, w in qvi_list)
    agg_qvi = sum(q * w for q, w in qvi_list) / total_weight if total_weight else 0

    return findings, agg_qvi