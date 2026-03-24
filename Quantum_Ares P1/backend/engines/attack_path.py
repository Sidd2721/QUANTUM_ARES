# engines/attack_path.py

import networkx as nx
import math
from typing import List, Dict, Tuple


def calculate_path_risk(G, path):
    risk = 1.0

    for i in range(len(path) - 1):
        u, v = path[i], path[i + 1]
        edge = G.get_edge_data(u, v) or {}

        if not edge.get('auth_required', True):
            risk *= 3.0

        if G.nodes[u].get('known_exploit', False):
            risk *= 2.0

        target_cvss = G.nodes[v].get('cvss', 5)
        risk *= (1 + target_cvss / 10)

    risk += math.log(len(path) + 1, 10)
    return round(risk, 1)


def attack_path_engine(G: nx.DiGraph) -> Tuple[List[Dict], float]:
    findings = []
    all_paths = []

    public_nodes = [n for n, d in G.nodes(data=True) if d.get('zone') == 'PUBLIC']
    targets = [n for n, d in G.nodes(data=True) if d.get('data_sensitivity') in ('HIGH', 'CRITICAL')]

    for src in public_nodes:
        for tgt in targets:
            try:
                for path in nx.all_simple_paths(G, src, tgt, cutoff=6):
                    risk = calculate_path_risk(G, path)
                    all_paths.append((risk, path))
            except:
                continue

    all_paths.sort(reverse=True, key=lambda x: x[0])

    critical = high = medium = 0

    for risk, path in all_paths[:10]:
        if risk > 100:
            severity = 'CRITICAL'
            critical += 1
        elif risk > 50:
            severity = 'HIGH'
            high += 1
        else:
            severity = 'MEDIUM'
            medium += 1

        findings.append({
            'rule_id': 'AP-001',
            'severity': severity,
            'mitre_id': 'T1046',
            'cvss': min(10, risk / 10),
            'affected_nodes': path,
            'description': f'Attack path from "{path[0]}" to "{path[-1]}" (risk {risk})',
            'remediation': 'Add auth, firewall, segmentation.',
            'plugin': 'attack_path',
            'path_risk': risk,
            'business_impact': f'Attacker reaches {path[-1]}',
            'business_risk': 'System compromise risk',
            'compliance_clauses': []
        })

    score = max(0, 100 - (critical * 20 + high * 10 + medium * 4))
    return findings, score