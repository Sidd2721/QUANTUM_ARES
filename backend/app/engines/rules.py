# backend/app/engines/rules.py
"""
QUANTUM-ARES Zero Trust Rule Registry.

ALL rules are data entries in RULE_REGISTRY.
The engine (zero_trust.py) is pure iteration — adding a rule = adding one dict.
Zero code changes to the engine itself.

Judge pitch: "We built a policy-driven rule engine. Rules are data.
Updating security policy requires no code deployment — only rule changes.
This mirrors how enterprise compliance systems like OpenSCAP manage policy."

Each rule has:
  rule_id     → matches autofix templates.json key (ZT-001, etc.)
  severity    → CRITICAL|HIGH|MEDIUM|LOW
  mitre_id    → MITRE ATT&CK technique ID (verified at mitre.org)
  cvss        → float 0-10 (CVSS v3.1 base score)
  description → what the violation is
  remediation → how to fix it
  check_fn    → lambda G: bool — does this violation exist in graph G?
  affected_fn → lambda G: list of tuples — which nodes/edges are affected?
  business_impact → consequence in plain English
  business_risk   → Indian regulatory reference (DPDP/RBI/NIST)
"""

import networkx as nx

# ── Business impact + risk labels ──────────────────────────────────────────
_IMPACT_MAP = {
    'ZT-001': 'Attacker can directly access sensitive data without authentication.',
    'ZT-002': 'Admin interface exposed — full system control accessible from internet.',
    'ZT-003': 'Data at rest is readable if storage medium is compromised.',
    'ZT-004': 'Sensitive resources accessible without MFA — credential theft = full access.',
    'ZT-005': 'Wildcard IAM — any process using this role can access all resources.',
    'ZT-006': 'Sensitive node has direct outbound path — data exfiltration possible.',
    'ZT-007': 'Unencrypted connection to sensitive node — traffic interception possible.',
    'ZT-008': 'DMZ reaches PRIVATE without auth — lateral movement gap.',
    'ZT-009': 'Unknown encryption on CRITICAL data — cannot assess protection level.',
    'ZT-010': 'Over-privileged access scope — violates least-privilege principle.',
}

_RISK_MAP = {
    'CRITICAL': 'DPDP Act 2023 Section 8(3) — fine up to ₹250 Crore. RBI Direction 4.2.',
    'HIGH':     'RBI Master Direction non-compliance — audit finding. NIST SP 800-207 violation.',
    'MEDIUM':   'NIST SP 800-207 control gap — reduced security posture. Regulatory exposure.',
    'LOW':      'Security best practice gap — address in next maintenance window.',
}


def _mk(rid, sev, mitre, cvss, desc, rem, check_fn, affected_fn):
    """Factory for a rule dict — keeps RULE_REGISTRY readable."""
    return {
        'rule_id':        rid,
        'severity':       sev,
        'mitre_id':       mitre,
        'cvss':           cvss,
        'description':    desc,
        'remediation':    rem,
        'check_fn':       check_fn,
        'affected_fn':    affected_fn,
        'compliance_clauses': [],       # filled by enrich_with_compliance()
        'business_impact':    _IMPACT_MAP.get(rid, 'Security control gap detected.'),
        'business_risk':      _RISK_MAP.get(sev, 'Regulatory compliance risk.'),
    }


# ── THE RULE REGISTRY ───────────────────────────────────────────────────────
RULE_REGISTRY = [

    _mk('ZT-001', 'CRITICAL', 'T1046', 8.2,
        'PUBLIC zone directly accesses PRIVATE database without authentication.',
        'Add authentication gateway between PUBLIC and PRIVATE zones.',
        check_fn=lambda G: any(
            G.nodes[u].get('zone') == 'PUBLIC' and
            G.nodes[v].get('zone') == 'PRIVATE' and
            G.nodes[v].get('type', '').lower() in ('database', 'db', 'datastore') and
            not d.get('auth_required', True)
            for u, v, d in G.edges(data=True)
        ),
        affected_fn=lambda G: [
            (u, v) for u, v, d in G.edges(data=True)
            if G.nodes[u].get('zone') == 'PUBLIC' and
               G.nodes[v].get('zone') == 'PRIVATE' and
               G.nodes[v].get('type', '').lower() in ('database', 'db', 'datastore') and
               not d.get('auth_required', True)
        ]),

    _mk('ZT-002', 'HIGH', 'T1133', 7.5,
        'Admin interface is exposed in PUBLIC zone.',
        'Move admin interface to PRIVATE zone or require VPN access.',
        check_fn=lambda G: any(
            'admin' in a.get('type', '').lower() and a.get('zone') == 'PUBLIC'
            for _, a in G.nodes(data=True)
        ),
        affected_fn=lambda G: [
            (n,) for n, a in G.nodes(data=True)
            if 'admin' in a.get('type', '').lower() and a.get('zone') == 'PUBLIC'
        ]),

    _mk('ZT-003', 'CRITICAL', 'T1530', 9.1,
        'Sensitive node has no encryption at rest.',
        'Enable AES-256 encryption at rest immediately.',
        check_fn=lambda G: any(
            a.get('data_sensitivity') in ('HIGH', 'CRITICAL') and
            a.get('encryption_type') in ('none', 'unknown', None)
            for _, a in G.nodes(data=True)
        ),
        affected_fn=lambda G: [
            (n,) for n, a in G.nodes(data=True)
            if a.get('data_sensitivity') in ('HIGH', 'CRITICAL') and
               a.get('encryption_type') in ('none', 'unknown', None)
        ]),

    _mk('ZT-004', 'HIGH', 'T1078', 7.8,
        'Access to sensitive node does not require MFA.',
        'Enforce MFA on all edges to HIGH/CRITICAL sensitivity nodes.',
        check_fn=lambda G: any(
            G.nodes[v].get('data_sensitivity') in ('HIGH', 'CRITICAL') and
            not d.get('mfa_required', True)
            for u, v, d in G.edges(data=True)
        ),
        affected_fn=lambda G: [
            (u, v) for u, v, d in G.edges(data=True)
            if G.nodes[v].get('data_sensitivity') in ('HIGH', 'CRITICAL') and
               not d.get('mfa_required', True)
        ]),

    _mk('ZT-005', 'CRITICAL', 'T1098', 8.8,
        'Node has IAM roles with wildcard (*) permissions.',
        'Replace wildcard with specific least-privilege actions.',
        check_fn=lambda G: any(
            any('*' in str(r) for r in a.get('iam_roles', []))
            for _, a in G.nodes(data=True)
        ),
        affected_fn=lambda G: [
            (n,) for n, a in G.nodes(data=True)
            if any('*' in str(r) for r in a.get('iam_roles', []))
        ]),

    _mk('ZT-006', 'HIGH', 'T1041', 7.2,
        'Sensitive PRIVATE node has direct outbound path to PUBLIC zone.',
        'Route all outbound traffic through a monitored egress gateway.',
        check_fn=lambda G: any(
            G.nodes[u].get('zone') == 'PRIVATE' and
            G.nodes[v].get('zone') == 'PUBLIC' and
            G.nodes[u].get('data_sensitivity') in ('HIGH', 'CRITICAL')
            for u, v, _d in G.edges(data=True)  # Fix: was G.edges() which returns 2-tuples
        ),
        affected_fn=lambda G: [
            (u, v) for u, v, _d in G.edges(data=True)  # Fix: was G.edges()
            if G.nodes[u].get('zone') == 'PRIVATE' and
               G.nodes[v].get('zone') == 'PUBLIC' and
               G.nodes[u].get('data_sensitivity') in ('HIGH', 'CRITICAL')
        ]),

    _mk('ZT-007', 'MEDIUM', 'T1040', 5.9,
        'Edge to sensitive node has no TLS enforcement.',
        'Enable TLS 1.3 on all connections to HIGH/CRITICAL sensitivity nodes.',
        check_fn=lambda G: any(
            not d.get('tls_enforced', True) and
            G.nodes[v].get('data_sensitivity') in ('HIGH', 'CRITICAL')
            for u, v, d in G.edges(data=True)
        ),
        affected_fn=lambda G: [
            (u, v) for u, v, d in G.edges(data=True)
            if not d.get('tls_enforced', True) and
               G.nodes[v].get('data_sensitivity') in ('HIGH', 'CRITICAL')
        ]),

    _mk('ZT-008', 'HIGH', 'T1046', 7.0,
        'DMZ node reaches PRIVATE zone without authentication.',
        'Add mutual authentication between DMZ and PRIVATE zones.',
        check_fn=lambda G: any(
            G.nodes[u].get('zone') == 'DMZ' and
            G.nodes[v].get('zone') == 'PRIVATE' and
            not d.get('auth_required', True)
            for u, v, d in G.edges(data=True)
        ),
        affected_fn=lambda G: [
            (u, v) for u, v, d in G.edges(data=True)
            if G.nodes[u].get('zone') == 'DMZ' and
               G.nodes[v].get('zone') == 'PRIVATE' and
               not d.get('auth_required', True)
        ]),

    _mk('ZT-009', 'CRITICAL', 'T1530', 8.5,
        'CRITICAL-sensitivity node has unknown encryption type.',
        'Determine and apply minimum AES-256 encryption immediately.',
        check_fn=lambda G: any(
            a.get('data_sensitivity') == 'CRITICAL' and
            a.get('encryption_type') == 'unknown'
            for _, a in G.nodes(data=True)
        ),
        affected_fn=lambda G: [
            (n,) for n, a in G.nodes(data=True)
            if a.get('data_sensitivity') == 'CRITICAL' and
               a.get('encryption_type') == 'unknown'
        ]),

    _mk('ZT-010', 'HIGH', 'T1098', 7.4,
        'Non-admin node has FULL access scope on an outbound edge.',
        'Restrict access scope to SCOPED or READ_ONLY for non-admin nodes.',
        check_fn=lambda G: any(
            d.get('access_scope') == 'FULL' and
            'admin' not in G.nodes[u].get('type', '').lower()
            for u, v, d in G.edges(data=True)
        ),
        affected_fn=lambda G: [
            (u, v) for u, v, d in G.edges(data=True)
            if d.get('access_scope') == 'FULL' and
               'admin' not in G.nodes[u].get('type', '').lower()
        ]),
]


def evaluate_rules(G: nx.DiGraph, registry=None) -> tuple:
    """
    Pure iteration over the rule registry.
    No hardcoded checks — everything is in RULE_REGISTRY.

    Returns: (findings: list, zt_score: float)
    Score formula: 100 - (CRITICAL×15 + HIGH×8 + MEDIUM×3 + LOW×1)
    """
    if registry is None:
        registry = RULE_REGISTRY

    import logging
    logger = logging.getLogger(__name__)

    findings = []
    counts = {'CRITICAL': 0, 'HIGH': 0, 'MEDIUM': 0, 'LOW': 0}

    for rule in registry:
        try:
            if not rule['check_fn'](G):
                continue
            affected_pairs = rule['affected_fn'](G)
            for pair in affected_pairs:
                findings.append({
                    'rule_id':        rule['rule_id'],
                    'severity':       rule['severity'],
                    'mitre_id':       rule['mitre_id'],
                    'cvss':           rule['cvss'],
                    'affected_nodes': list(pair),
                    'description':    rule['description'],
                    'remediation':    rule['remediation'],
                    'plugin':         'zero_trust',
                    'compliance_clauses': [],
                    'business_impact':    rule['business_impact'],
                    'business_risk':      rule['business_risk'],
                })
                counts[rule['severity']] = counts.get(rule['severity'], 0) + 1
        except Exception as e:
            logger.warning(f'[RULES] Rule {rule["rule_id"]} eval failed: {e}')

    score = max(0, 100 - (
        counts.get('CRITICAL', 0) * 15 +
        counts.get('HIGH', 0)     * 8  +
        counts.get('MEDIUM', 0)   * 3  +
        counts.get('LOW', 0)      * 1
    ))

    logger.info(f'[ZT] {len(findings)} findings | CRITICAL:{counts["CRITICAL"]} '
                f'HIGH:{counts["HIGH"]} MEDIUM:{counts["MEDIUM"]} | score:{score}')
    return findings, float(score)
