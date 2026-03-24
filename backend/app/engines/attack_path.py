# backend/app/engines/attack_path.py
"""
Attack Path Engine — BFS from PUBLIC nodes to HIGH/CRITICAL targets.
CVE-driven ATT&CK technique mapping (not zone-lookup).

Demo moment (1:20 in 7-minute script):
  "Red lines — attack paths. MITRE T1190. Not because nginx is in a
   PUBLIC zone. Because nginx:1.20.1 has CVE-2021-23017 — a buffer
   overflow enabling remote code execution. Our technique mapping is
   CVE-driven, not a lookup table."

_path_risk() scoring:
  × 3.0 if unauthenticated hop (auth_required=False)
  × 2.0 if source node has known_exploit=True (from CVE enrichment)
  × (1 + cvss_live/10) for each hop's target CVSS
  + log10(blast_radius + 2) bonus for high-impact entry points
"""
import networkx as nx
import math
import logging
from typing import List, Dict, Tuple

logger = logging.getLogger(__name__)

# CVE → MITRE ATT&CK technique mapping (CVE-first, not zone-type lookup)
CVE_TECHNIQUE_MAP = {
    'CVE-2021-23017': {
        'id': 'T1190', 'name': 'Exploit Public-Facing Application',
        'tactic': 'Initial Access',
        'why': 'nginx resolver buffer overflow enables RCE'
    },
    'CVE-2021-44228': {
        'id': 'T1190', 'name': 'Exploit Public-Facing Application',
        'tactic': 'Initial Access',
        'why': 'Log4Shell JNDI injection enables unauthenticated RCE'
    },
    'CVE-2016-0800': {
        'id': 'T1557', 'name': 'Adversary-in-the-Middle',
        'tactic': 'Collection',
        'why': 'SSLv2 DROWN allows TLS session decryption'
    },
    'CVE-2020-1472': {
        'id': 'T1210', 'name': 'Exploitation of Remote Services',
        'tactic': 'Lateral Movement',
        'why': 'Zerologon allows domain admin privilege escalation'
    },
}

# Fallback: node type pair → technique when no CVE is present
TYPE_PAIR_TECHNIQUE = {
    ('server', 'database'):          ('T1078', 'Valid Accounts', 'Lateral Movement'),
    ('gateway', 'server'):           ('T1190', 'Exploit Public-Facing Application', 'Initial Access'),
    ('server', 'credential_store'):  ('T1555', 'Credentials from Password Stores', 'Credential Access'),
    ('admin', 'database'):           ('T1078', 'Valid Accounts', 'Credential Access'),
}


def _get_technique(G: nx.DiGraph, src: str, dst: str) -> tuple:
    """CVE-first technique selection. Falls back to type-pair only if no CVE."""
    cve = G.nodes[src].get('cve_id')
    if cve and cve in CVE_TECHNIQUE_MAP:
        t = CVE_TECHNIQUE_MAP[cve]
        return t['id'], t['name'], t['tactic'], 'CVE-driven', cve, t['why']

    st = G.nodes[src].get('type', 'any')
    dt = G.nodes[dst].get('type', 'any')
    fb = TYPE_PAIR_TECHNIQUE.get(
        (st, dt),
        ('T1046', 'Network Service Scan', 'Discovery')
    )
    return fb[0], fb[1], fb[2], 'node-type-inferred', None, f'Inferred from {st}→{dt}'


def _path_risk(G: nx.DiGraph, path: list) -> float:
    """
    CVSS v3.1 §7.3-inspired path scoring.
    Higher = more dangerous. Used to sort and threshold findings.
    """
    risk = 1.0
    for i in range(len(path) - 1):
        u, v = path[i], path[i + 1]
        edge = G.get_edge_data(u, v) or {}

        # Unauthenticated hop: attacker moves freely
        if not edge.get('auth_required', True):
            risk *= 3.0

        # Source has known CVE exploit: entry is trivial
        if G.nodes[u].get('known_exploit', False):
            risk *= 2.0

        # Target CVSS amplifies risk (unpatched target is easier to exploit)
        target_cvss = G.nodes[v].get('cvss_live', G.nodes[v].get('cvss', 0))
        risk *= (1 + target_cvss / 10)

    # Blast radius log bonus: central nodes amplify overall impact
    blast = len(nx.descendants(G, path[0]))
    risk += math.log(blast + 2, 10)

    return round(risk, 1)


def attack_path_engine(G: nx.DiGraph) -> Tuple[List[Dict], float]:
    """
    Finds all simple paths from PUBLIC nodes to HIGH/CRITICAL targets
    within 6 hops. Scores them by _path_risk(). Reports top 10.
    """
    findings = []

    # Source: any PUBLIC zone node
    public_nodes = [n for n, d in G.nodes(data=True) if d.get('zone') == 'PUBLIC']
    # Target: any HIGH/CRITICAL sensitivity node
    target_nodes = [n for n, d in G.nodes(data=True)
                    if d.get('data_sensitivity') in ('HIGH', 'CRITICAL')]

    all_paths = []
    for src in public_nodes:
        for tgt in target_nodes:
            if src == tgt:
                continue
            try:
                for path in nx.all_simple_paths(G, src, tgt, cutoff=6):
                    all_paths.append((_path_risk(G, path), path))
            except (nx.NetworkXNoPath, nx.NodeNotFound):
                continue

    # Sort by risk descending, take top 10
    all_paths.sort(reverse=True, key=lambda x: x[0])

    crit = high = med = 0
    for risk, path in all_paths[:10]:
        sev = 'CRITICAL' if risk > 100 else ('HIGH' if risk > 50 else 'MEDIUM')
        if sev == 'CRITICAL': crit += 1
        elif sev == 'HIGH':   high += 1
        else:                 med  += 1

        # Get MITRE technique for first hop
        n1 = path[1] if len(path) > 1 else path[0]
        tid, tname, tactic, basis, cve_ev, why = _get_technique(G, path[0], n1)

        findings.append({
            'rule_id':         'AP-001',
            'severity':        sev,
            'mitre_id':        tid,
            'cvss':            min(10.0, risk / 10),
            'affected_nodes':  path,
            'entry_type':      G.nodes[path[0]].get('type', 'node') if path[0] in G.nodes else 'node',
            'target_type':     G.nodes[path[-1]].get('type', 'node') if path[-1] in G.nodes else 'node',
            'target_sens':     G.nodes[path[-1]].get('data_sensitivity', 'UNKNOWN') if path[-1] in G.nodes else 'UNKNOWN',
            'description':     (
                f'Attack path from "{path[0]}" to "{path[-1]}" '
                f'(risk score {risk}).'
            ),
            'remediation':     'Add authentication, firewall rules, or network segmentation on this path.',
            'plugin':          'attack_path',
            'path_risk':       risk,
            'mitre_name':      tname,
            'mitre_tactic':    tactic,
            'mapping_basis':   basis,
            'cve_evidence':    cve_ev,
            'mapping_rationale': why,
            'business_impact': f'Attacker reaches "{path[-1]}" in {len(path)-1} hop(s) from PUBLIC zone.',
            'business_risk':   'NIST CA-7 Continuous Monitoring violation. Perimeter breach.',
            'compliance_clauses': [],
        })

    ap_score = max(0, 100 - (crit * 20 + high * 10 + med * 4))
    logger.info(f'[ATTACK_PATH] {len(findings)} paths | CRITICAL:{crit} HIGH:{high} | score:{ap_score}')
    return findings, float(ap_score)
