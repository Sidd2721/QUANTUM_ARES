# engines/compliance.py

from typing import List, Dict, Tuple

COMPLIANCE_MAP = {
    'ZT-001': [{'framework': 'NIST', 'clause_id': 'AC-3'}],
    'ZT-003': [{'framework': 'DPDP', 'clause_id': '8(3)'}],
    'Q-001': [{'framework': 'NIST', 'clause_id': 'SC-28'}],
    'AP-001': [{'framework': 'NIST', 'clause_id': 'CA-7'}],
    'SC-001': [{'framework': 'DPDP', 'clause_id': '8(3)'}],
}


def enrich_with_compliance(findings: List[Dict]) -> Tuple[List[Dict], float]:
    mapped = 0

    for f in findings:
        clauses = COMPLIANCE_MAP.get(f.get('rule_id'), [])
        f['compliance_clauses'] = clauses

        if clauses:
            mapped += 1

    score = (mapped / len(findings) * 100) if findings else 100
    return findings, score