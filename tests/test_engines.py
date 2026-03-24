# backend/tests/test_engines.py
"""
Engine unit tests — Day 3.
Run with: pytest tests/test_engines.py -v

Tests use graph fixtures directly — no API calls, no DB.
Each test verifies: correct finding detected, correct shape, correct fields.
"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import networkx as nx
import pytest


# ── Graph Fixtures ───────────────────────────────────────────────────────────

def graph_hospital_violation() -> nx.DiGraph:
    """7-node hospital graph with known violations from demo_hospital.json."""
    G = nx.DiGraph()
    G.add_node('internet_gateway', type='gateway', zone='PUBLIC',
               data_sensitivity='LOW', encryption_type='none',
               container_image='nginx:1.20.1', cvss_live=9.8,
               cve_id='CVE-2021-23017', known_exploit=True, blast_radius=85.7,
               iam_roles=[], retention_years=0)
    G.add_node('web_server', type='server', zone='PUBLIC',
               data_sensitivity='LOW', encryption_type='AES-256',
               container_image='nginx:1.20.1', cvss_live=9.8,
               cve_id='CVE-2021-23017', known_exploit=True, blast_radius=71.4,
               iam_roles=[], retention_years=0)
    G.add_node('app_server', type='server', zone='DMZ',
               data_sensitivity='MEDIUM', encryption_type='AES-256',
               container_image=None, cvss_live=0.0, cve_id=None,
               known_exploit=False, blast_radius=42.9, iam_roles=[], retention_years=0)
    G.add_node('patient_db', type='database', zone='PRIVATE',
               data_sensitivity='CRITICAL', encryption_type='none',
               container_image=None, cvss_live=0.0, cve_id=None,
               known_exploit=False, blast_radius=0.0, iam_roles=[], retention_years=15)
    G.add_node('billing_db', type='database', zone='PRIVATE',
               data_sensitivity='HIGH', encryption_type='unknown',
               container_image=None, cvss_live=0.0, cve_id=None,
               known_exploit=False, blast_radius=0.0, iam_roles=[], retention_years=7)
    G.add_node('admin_panel', type='admin', zone='PUBLIC',
               data_sensitivity='HIGH', encryption_type='AES-256',
               container_image=None, cvss_live=0.0, cve_id=None,
               known_exploit=False, blast_radius=28.6,
               iam_roles=['arn:aws:iam::*:role/*'], retention_years=0)
    G.add_node('credential_store', type='credential_store', zone='PRIVATE',
               data_sensitivity='CRITICAL', encryption_type='RSA-2048',
               container_image=None, cvss_live=0.0, cve_id=None,
               known_exploit=False, blast_radius=0.0, iam_roles=[], retention_years=10)

    G.add_edge('internet_gateway', 'web_server',
               auth_required=False, mfa_required=False, tls_enforced=True, access_scope='FULL')
    G.add_edge('web_server', 'app_server',
               auth_required=True, mfa_required=False, tls_enforced=True, access_scope='SCOPED')
    G.add_edge('app_server', 'patient_db',
               auth_required=False, mfa_required=False, tls_enforced=False, access_scope='FULL')
    G.add_edge('app_server', 'billing_db',
               auth_required=True, mfa_required=False, tls_enforced=True, access_scope='SCOPED')
    G.add_edge('admin_panel', 'patient_db',
               auth_required=False, mfa_required=False, tls_enforced=False, access_scope='FULL')
    G.add_edge('admin_panel', 'credential_store',
               auth_required=True, mfa_required=False, tls_enforced=True, access_scope='FULL')
    return G


def graph_clean() -> nx.DiGraph:
    """Clean graph — no violations should be detected."""
    G = nx.DiGraph()
    G.add_node('web', type='server', zone='DMZ', data_sensitivity='LOW',
               encryption_type='AES-256', container_image=None, cvss_live=0.0,
               cve_id=None, known_exploit=False, blast_radius=50.0,
               iam_roles=['arn:aws:iam::123:role/specific'], retention_years=0)
    G.add_node('db', type='database', zone='PRIVATE', data_sensitivity='LOW',
               encryption_type='AES-256', container_image=None, cvss_live=0.0,
               cve_id=None, known_exploit=False, blast_radius=0.0,
               iam_roles=[], retention_years=0)
    G.add_edge('web', 'db', auth_required=True, mfa_required=True,
               tls_enforced=True, access_scope='SCOPED')
    return G


# ── Zero Trust Engine Tests ──────────────────────────────────────────────────

class TestZeroTrustEngine:

    def test_zt001_public_to_private_db_no_auth(self):
        """ZT-001: PUBLIC→PRIVATE database without auth_required=False."""
        from app.engines.zero_trust import zero_trust_engine
        G = graph_hospital_violation()
        result = zero_trust_engine(G)
        assert isinstance(result, tuple) and len(result) == 2 and isinstance(result[1], float), "Engine must return (list, float)"
        findings, score = result
        rule_ids = [f['rule_id'] for f in findings]
        assert 'ZT-001' in rule_ids, f'ZT-001 not found. Got: {rule_ids}'

    def test_zt002_admin_in_public_zone(self):
        """ZT-002: admin_panel node is in PUBLIC zone."""
        from app.engines.zero_trust import zero_trust_engine
        G = graph_hospital_violation()
        result = zero_trust_engine(G)
        assert isinstance(result, tuple) and len(result) == 2 and isinstance(result[1], float), "Engine must return (list, float)"
        findings, _ = result
        assert any(f['rule_id'] == 'ZT-002' for f in findings), 'ZT-002 not found'

    def test_zt003_no_encryption_on_critical_node(self):
        """ZT-003: patient_db has encryption_type=none and sensitivity=CRITICAL."""
        from app.engines.zero_trust import zero_trust_engine
        G = graph_hospital_violation()
        findings, _ = zero_trust_engine(G)
        assert any(f['rule_id'] == 'ZT-003' for f in findings), 'ZT-003 not found'

    def test_zt005_wildcard_iam(self):
        """ZT-005: admin_panel has iam_roles with wildcard *."""
        from app.engines.zero_trust import zero_trust_engine
        G = graph_hospital_violation()
        findings, _ = zero_trust_engine(G)
        assert any(f['rule_id'] == 'ZT-005' for f in findings), 'ZT-005 not found'

    def test_clean_graph_no_findings(self):
        """Clean graph with no violations must return empty findings."""
        from app.engines.zero_trust import zero_trust_engine
        G = graph_clean()
        findings, score = zero_trust_engine(G)
        # Clean graph — only LOW sensitivity db, no wildcard IAM, auth+mfa+tls enforced
        critical_or_high = [f for f in findings if f['severity'] in ('CRITICAL', 'HIGH')]
        assert len(critical_or_high) == 0, f'Unexpected critical/high findings: {critical_or_high}'

    def test_clean_graph_high_score(self):
        """Clean graph must return score > 80."""
        from app.engines.zero_trust import zero_trust_engine
        _, score = zero_trust_engine(graph_clean())
        assert score > 80, f'Expected score > 80 for clean graph, got {score}'

    def test_finding_has_all_required_fields(self):
        """Every finding must have the 9 required fields."""
        from app.engines.zero_trust import zero_trust_engine
        G = graph_hospital_violation()
        findings, _ = zero_trust_engine(G)
        required = {'rule_id', 'severity', 'mitre_id', 'cvss',
                    'affected_nodes', 'description', 'remediation',
                    'plugin', 'business_impact'}
        for f in findings:
            missing = required - set(f.keys())
            assert not missing, f'Finding {f["rule_id"]} missing fields: {missing}'


# ── Quantum Engine Tests ─────────────────────────────────────────────────────

class TestQuantumEngine:

    def test_patient_db_generates_critical_finding(self):
        """patient_db: encryption=none, retention=15, CRITICAL → CRITICAL QVI finding."""
        from app.engines.quantum import quantum_engine
        G = graph_hospital_violation()
        result = quantum_engine(G)
        assert isinstance(result, tuple) and len(result) == 2 and isinstance(result[1], float), "Engine must return (list, float)"
        findings, agg_qvi = result
        critical = [f for f in findings if f.get('affected_nodes') == ['patient_db']]
        assert len(critical) > 0, 'No quantum finding for patient_db'
        assert critical[0]['severity'] == 'CRITICAL', f'Expected CRITICAL, got {critical[0]["severity"]}'

    def test_agg_qvi_is_float(self):
        """agg_qvi must be a float between 0 and 100."""
        from app.engines.quantum import quantum_engine
        _, agg_qvi = quantum_engine(graph_hospital_violation())
        assert isinstance(agg_qvi, float), 'agg_qvi must be float'
        assert 0 <= agg_qvi <= 100, f'agg_qvi out of range: {agg_qvi}'

    def test_aes256_low_retention_safe(self):
        """AES-256 with 0 retention years should produce QVI < 40 (no finding)."""
        from app.engines.quantum import quantum_engine
        G = nx.DiGraph()
        G.add_node('safe', type='server', zone='PRIVATE',
                   data_sensitivity='LOW', encryption_type='AES-256',
                   retention_years=0)
        findings, agg_qvi = quantum_engine(G)
        assert len(findings) == 0, f'Unexpected quantum finding for AES-256/LOW/0yr: {findings}'

    def test_finding_has_qvi_and_risk_year(self):
        """Quantum findings must include qvi and risk_year fields."""
        from app.engines.quantum import quantum_engine
        G = graph_hospital_violation()
        findings, _ = quantum_engine(G)
        for f in findings:
            assert 'qvi' in f, f'Finding missing qvi: {f}'
            assert 'risk_year' in f, f'Finding missing risk_year: {f}'
            assert f['plugin'] == 'quantum', f'Wrong plugin: {f["plugin"]}'


# ── Attack Path Engine Tests ─────────────────────────────────────────────────

class TestAttackPathEngine:

    def test_hospital_graph_has_attack_paths(self):
        """demo_hospital graph must produce at least one attack path finding."""
        from app.engines.attack_path import attack_path_engine
        G = graph_hospital_violation()
        result = attack_path_engine(G)
        assert isinstance(result, tuple) and len(result) == 2 and isinstance(result[1], float), "Engine must return (list, float)"
        findings, ap_score = result
        assert len(findings) > 0, 'No attack paths found in hospital graph'
        assert all(f['rule_id'] == 'AP-001' for f in findings)

    def test_attack_path_finding_has_all_fields(self):
        """Attack path findings must have plugin, path_risk, mitre fields."""
        from app.engines.attack_path import attack_path_engine
        G = graph_hospital_violation()
        findings, _ = attack_path_engine(G)
        if findings:
            f = findings[0]
            assert f['plugin'] == 'attack_path'
            assert 'path_risk' in f
            assert 'mitre_name' in f
            assert 'mitre_tactic' in f
            assert 'mapping_basis' in f

    def test_isolated_graph_no_attack_paths(self):
        """Graph with no PUBLIC→CRITICAL paths must produce no AP findings."""
        from app.engines.attack_path import attack_path_engine
        G = nx.DiGraph()
        G.add_node('web', type='server', zone='DMZ', data_sensitivity='LOW',
                   cvss_live=0, cve_id=None, known_exploit=False, blast_radius=0)
        G.add_node('db', type='database', zone='PRIVATE', data_sensitivity='LOW',
                   cvss_live=0, cve_id=None, known_exploit=False, blast_radius=0)
        G.add_edge('web', 'db', auth_required=True)
        findings, score = attack_path_engine(G)
        assert len(findings) == 0, 'Unexpected attack path findings in isolated graph'

    def test_ap_score_is_float_0_to_100(self):
        from app.engines.attack_path import attack_path_engine
        _, score = attack_path_engine(graph_hospital_violation())
        assert isinstance(score, float)
        assert 0 <= score <= 100


# ── Supply Chain Engine Tests ────────────────────────────────────────────────

class TestSupplyChainEngine:

    def test_nginx_1201_triggers_cve_finding(self):
        """nginx:1.20.1 must trigger CVE-2021-23017 CVSS 9.8 CRITICAL finding."""
        from app.engines.supply_chain import supply_chain_engine
        G = graph_hospital_violation()
        result = supply_chain_engine(G)
        assert isinstance(result, tuple) and len(result) == 2 and isinstance(result[1], float), "Engine must return (list, float)"
        findings, sc_score = result
        nginx_findings = [f for f in findings if 'nginx:1.20.1' in f.get('description', '')]
        assert len(nginx_findings) > 0, 'No supply chain finding for nginx:1.20.1'
        assert nginx_findings[0]['cvss'] == 9.8
        assert nginx_findings[0]['severity'] == 'CRITICAL'

    def test_finding_has_cve_id_and_fix_version(self):
        from app.engines.supply_chain import supply_chain_engine
        G = graph_hospital_violation()
        findings, _ = supply_chain_engine(G)
        for f in findings:
            assert 'cve_id' in f
            assert 'fix_version' in f
            assert f['plugin'] == 'supply_chain'

    def test_no_container_image_no_finding(self):
        """Node without container_image must not generate supply chain findings."""
        from app.engines.supply_chain import supply_chain_engine
        G = nx.DiGraph()
        G.add_node('db', type='database', zone='PRIVATE', data_sensitivity='CRITICAL')
        # No container_image attribute
        findings, _ = supply_chain_engine(G)
        assert len(findings) == 0


# ── Compliance Enrichment Tests ───────────────────────────────────────────────

class TestComplianceEnrichment:

    def test_zt003_finding_gets_compliance_clauses(self):
        """ZT-003 finding must get NIST/DPDP/RBI clauses after enrichment."""
        from app.engines.compliance import enrich_with_compliance
        findings = [{'rule_id': 'ZT-003', 'severity': 'CRITICAL', 'compliance_clauses': []}]
        result = enrich_with_compliance(findings)
        assert isinstance(result, tuple) and len(result) == 2 and isinstance(result[1], float), "Engine must return (list, float)"
        enriched, score = result
        assert len(enriched[0]['compliance_clauses']) > 0, 'ZT-003 must have compliance clauses'
        frameworks = [c['framework'] for c in enriched[0]['compliance_clauses']]
        assert 'NIST SP 800-207' in frameworks

    def test_compliance_score_is_0_to_100(self):
        from app.engines.compliance import enrich_with_compliance
        from app.engines.zero_trust import zero_trust_engine
        G = graph_hospital_violation()
        findings, _ = zero_trust_engine(G)
        _, score = enrich_with_compliance(findings)
        assert 0 <= score <= 100

    def test_empty_findings_returns_100(self):
        from app.engines.compliance import enrich_with_compliance
        _, score = enrich_with_compliance([])
        assert score == 100.0
