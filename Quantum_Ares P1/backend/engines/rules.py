# engines/rules.py

import networkx as nx

# ===============================
# BUSINESS IMPACT + RISK MAP
# ===============================

IMPACT_MAP = {
    'ZT-001': 'Public access to private database.',
    'ZT-002': 'Admin exposed to internet.',
    'ZT-003': 'Sensitive data without encryption.',
    'ZT-004': 'No MFA on sensitive access.',
    'ZT-005': 'Wildcard IAM access.',
}

RISK_MAP = {
    'CRITICAL': 'Severe regulatory + breach risk',
    'HIGH': 'High security exposure',
    'MEDIUM': 'Moderate risk',
    'LOW': 'Low impact',
}


# ===============================
# RULE FACTORY
# ===============================

def create_rule(rule_id, severity, mitre_id, cvss,
                description, remediation,
                check_fn, affected_fn):

    return {
        'rule_id': rule_id,
        'severity': severity,
        'mitre_id': mitre_id,
        'cvss': cvss,
        'description': description,
        'remediation': remediation,
        'check_fn': check_fn,
        'affected_fn': affected_fn,
        'business_impact': IMPACT_MAP.get(rule_id, 'Security issue'),
        'business_risk': RISK_MAP.get(severity, 'Risk'),
        'compliance_clauses': []
    }


# ===============================
# RULES
# ===============================

RULE_REGISTRY = [

    # ZT-001: Public → Private DB without auth
    create_rule(
        'ZT-001', 'CRITICAL', 'T1046', 8.2,
        'Public node directly accessing private DB without auth',
        'Add authentication layer',
        lambda G: any(
            G.nodes[u].get('zone') == 'PUBLIC' and
            G.nodes[v].get('zone') == 'PRIVATE' and
            'db' in G.nodes[v].get('type', '').lower() and
            not d.get('auth_required', True)
            for u, v, d in G.edges(data=True)
        ),
        lambda G: [
            (u, v) for u, v, d in G.edges(data=True)
            if G.nodes[u].get('zone') == 'PUBLIC'
            and G.nodes[v].get('zone') == 'PRIVATE'
            and 'db' in G.nodes[v].get('type', '').lower()
            and not d.get('auth_required', True)
        ]
    ),

    # ZT-002: Admin exposed
    create_rule(
        'ZT-002', 'HIGH', 'T1133', 7.5,
        'Admin exposed in public zone',
        'Move admin behind VPN',
        lambda G: any(
            'admin' in attrs.get('type', '').lower() and
            attrs.get('zone') == 'PUBLIC'
            for _, attrs in G.nodes(data=True)
        ),
        lambda G: [
            (n,) for n, attrs in G.nodes(data=True)
            if 'admin' in attrs.get('type', '').lower()
            and attrs.get('zone') == 'PUBLIC'
        ]
    ),

    # ZT-003: No encryption
    create_rule(
        'ZT-003', 'CRITICAL', 'T1530', 9.1,
        'Sensitive data without encryption',
        'Enable AES-256 encryption',
        lambda G: any(
            attrs.get('data_sensitivity') in ('HIGH', 'CRITICAL') and
            attrs.get('encryption_type') in ('none', 'unknown', None)
            for _, attrs in G.nodes(data=True)
        ),
        lambda G: [
            (n,) for n, attrs in G.nodes(data=True)
            if attrs.get('data_sensitivity') in ('HIGH', 'CRITICAL')
            and attrs.get('encryption_type') in ('none', 'unknown', None)
        ]
    ),

    # ZT-004: No MFA
    create_rule(
        'ZT-004', 'HIGH', 'T1078', 7.8,
        'Sensitive node without MFA',
        'Enable MFA',
        lambda G: any(
            G.nodes[v].get('data_sensitivity') in ('HIGH', 'CRITICAL')
            and not d.get('mfa_required', True)
            for u, v, d in G.edges(data=True)
        ),
        lambda G: [
            (u, v) for u, v, d in G.edges(data=True)
            if G.nodes[v].get('data_sensitivity') in ('HIGH', 'CRITICAL')
            and not d.get('mfa_required', True)
        ]
    ),

    # ZT-005: Wildcard IAM
    create_rule(
        'ZT-005', 'CRITICAL', 'T1098', 8.8,
        'Wildcard IAM permissions detected',
        'Use least privilege',
        lambda G: any(
            any('*' in str(role) for role in attrs.get('iam_roles', []))
            for _, attrs in G.nodes(data=True)
        ),
        lambda G: [
            (n,) for n, attrs in G.nodes(data=True)
            if any('*' in str(role) for role in attrs.get('iam_roles', []))
        ]
    ),
]


# ===============================
# ENGINE EXECUTION
# ===============================

def evaluate_rules(G: nx.DiGraph, registry=RULE_REGISTRY):
    findings = []
    counts = {'CRITICAL': 0, 'HIGH': 0, 'MEDIUM': 0, 'LOW': 0}

    for rule in registry:
        try:
            if not rule['check_fn'](G):
                continue

            affected = rule['affected_fn'](G)

            for pair in affected:
                findings.append({
                    'rule_id': rule['rule_id'],
                    'severity': rule['severity'],
                    'mitre_id': rule['mitre_id'],
                    'cvss': rule['cvss'],
                    'affected_nodes': list(pair),
                    'description': rule['description'],
                    'remediation': rule['remediation'],
                    'plugin': 'zero_trust',
                    'compliance_clauses': [],
                    'business_impact': rule['business_impact'],
                    'business_risk': rule['business_risk']
                })

                counts[rule['severity']] += 1

        except Exception as e:
            print(f"Rule error {rule['rule_id']}: {e}")

    # Score calculation
    score = max(0, 100 - (
        counts['CRITICAL'] * 15 +
        counts['HIGH'] * 8 +
        counts['MEDIUM'] * 3 +
        counts['LOW'] * 1
    ))

    return findings, score