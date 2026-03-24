# backend/app/engines/compliance.py
"""
Compliance Enrichment — maps rule_ids to NIST/DPDP/RBI regulatory clauses.
Called at Stage 5 (sequential, after all 4 engines complete).
Adds compliance_clauses list to each finding.
Returns (enriched_findings, compliance_score).
"""
import logging
from typing import List, Dict, Tuple

logger = logging.getLogger(__name__)

# Maps rule_id → list of regulatory clause dicts
COMPLIANCE_MAP = {
    'ZT-001': [
        {'framework': 'NIST SP 800-207', 'clause_id': 'AC-3',  'clause_text': 'Access Enforcement'},
        {'framework': 'RBI Master Direction', 'clause_id': 'Dir 4.2', 'clause_text': 'Network Access Control'},
    ],
    'ZT-002': [
        {'framework': 'NIST SP 800-207', 'clause_id': 'AC-17', 'clause_text': 'Remote Access'},
    ],
    'ZT-003': [
        {'framework': 'NIST SP 800-207',     'clause_id': 'SC-28',       'clause_text': 'Protection at Rest'},
        {'framework': 'DPDP Act 2023',        'clause_id': 'Section 8(3)','clause_text': 'Technical protection measures'},
        {'framework': 'RBI Master Direction', 'clause_id': 'Dir 4.2',     'clause_text': 'Data Encryption Standards'},
    ],
    'ZT-004': [
        {'framework': 'NIST SP 800-207', 'clause_id': 'IA-2',  'clause_text': 'Multi-Factor Authentication'},
    ],
    'ZT-005': [
        {'framework': 'NIST SP 800-207', 'clause_id': 'AC-6',  'clause_text': 'Least Privilege'},
    ],
    'ZT-006': [
        {'framework': 'NIST SP 800-207', 'clause_id': 'SC-7',  'clause_text': 'Boundary Protection'},
    ],
    'ZT-007': [
        {'framework': 'NIST SP 800-207', 'clause_id': 'SC-8',  'clause_text': 'Transmission Confidentiality'},
        {'framework': 'DPDP Act 2023',   'clause_id': 'Section 8(3)', 'clause_text': 'Technical measures in transit'},
    ],
    'ZT-008': [
        {'framework': 'NIST SP 800-207', 'clause_id': 'IA-3',  'clause_text': 'Device Identification'},
        {'framework': 'RBI Master Direction', 'clause_id': 'Dir 4.2', 'clause_text': 'Network Segmentation'},
    ],
    'ZT-009': [
        {'framework': 'NIST SP 800-207', 'clause_id': 'SC-28', 'clause_text': 'Protection at Rest'},
        {'framework': 'DPDP Act 2023',   'clause_id': 'Section 8(3)', 'clause_text': 'Encryption requirements'},
    ],
    'ZT-010': [
        {'framework': 'NIST SP 800-207', 'clause_id': 'AC-6',  'clause_text': 'Least Privilege'},
    ],
    'Q-001': [
        {'framework': 'NIST SP 800-207', 'clause_id': 'SC-28',       'clause_text': 'Protection at Rest'},
        {'framework': 'DPDP Act 2023',   'clause_id': 'Section 8(3)','clause_text': 'Encryption requirements'},
    ],
    'AP-001': [
        {'framework': 'NIST SP 800-207', 'clause_id': 'CA-7', 'clause_text': 'Continuous Monitoring'},
    ],
    'SC-001': [
        {'framework': 'DPDP Act 2023',   'clause_id': 'Section 8(3)', 'clause_text': 'Technical measures'},
        {'framework': 'NIST SP 800-207', 'clause_id': 'SA-9',         'clause_text': 'External Information System Services'},
    ],
}


def enrich_with_compliance(findings: List[Dict]) -> Tuple[List[Dict], float]:
    """
    Adds compliance_clauses to each finding based on rule_id.
    compliance_score = (findings with clauses / total findings) × 100
    """
    if not findings:
        return findings, 100.0

    mapped = 0
    for f in findings:
        clauses = COMPLIANCE_MAP.get(f.get('rule_id', ''), [])
        f['compliance_clauses'] = clauses
        if clauses:
            mapped += 1

    compliance_score = (mapped / len(findings)) * 100
    logger.info(f'[COMPLIANCE] {mapped}/{len(findings)} findings mapped | score:{compliance_score:.1f}')
    return findings, compliance_score
