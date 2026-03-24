# engines/supply_chain.py

import networkx as nx
from typing import List, Dict, Tuple

NVD_SNAPSHOT = {
    'nginx:1.20.1': [('CVE-2021-23017', 9.8, 'nginx:1.25.3')],
    'log4j:2.14.1': [('CVE-2021-44228', 10.0, 'log4j:2.17.1')],
    'openssl:1.0.2': [('CVE-2016-0800', 5.9, 'openssl:1.1.1')],
}


def supply_chain_engine(G: nx.DiGraph) -> Tuple[List[Dict], float]:
    findings = []
    counts = {'CRITICAL': 0, 'HIGH': 0, 'MEDIUM': 0, 'LOW': 0}

    for node, attrs in G.nodes(data=True):
        img = attrs.get('container_image')

        if not img or img not in NVD_SNAPSHOT:
            continue

        for cve_id, cvss, fix in NVD_SNAPSHOT[img]:
            if cvss >= 9:
                severity = 'CRITICAL'
            elif cvss >= 7:
                severity = 'HIGH'
            elif cvss >= 4:
                severity = 'MEDIUM'
            else:
                severity = 'LOW'

            counts[severity] += 1

            findings.append({
                'rule_id': 'SC-001',
                'severity': severity,
                'mitre_id': 'T1195',
                'cvss': cvss,
                'affected_nodes': [node],
                'description': f'{img} has {cve_id}',
                'remediation': f'Upgrade to {fix}',
                'plugin': 'supply_chain',
                'cve_id': cve_id,
                'fix_version': fix,
                'business_impact': 'Vulnerable dependency',
                'business_risk': 'Supply chain attack risk',
                'compliance_clauses': []
            })

    score = max(0, 100 - (
        counts['CRITICAL'] * 25 +
        counts['HIGH'] * 12 +
        counts['MEDIUM'] * 4 +
        counts['LOW'] * 1
    ))

    return findings, score