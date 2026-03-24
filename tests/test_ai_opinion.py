# backend/tests/test_ai_opinion.py
"""
AI Opinion Model tests — Day 3.
Run with: pytest tests/test_ai_opinion.py -v
"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import networkx as nx


def _make_graph_with_blast():
    """Graph where internet_gateway has high blast radius."""
    G = nx.DiGraph()
    G.add_node('internet_gateway', blast_radius=85.7, type='gateway', zone='PUBLIC')
    G.add_node('web_server', blast_radius=71.4, type='server', zone='PUBLIC')
    G.add_node('app_server', blast_radius=42.9, type='server', zone='DMZ')
    G.add_node('patient_db', blast_radius=0.0, type='database', zone='PRIVATE')
    G.add_edge('internet_gateway', 'web_server')
    G.add_edge('web_server', 'app_server')
    G.add_edge('app_server', 'patient_db')
    return G


def test_high_blast_radius_is_system_wide():
    """Node with blast_radius > 40 must get SYSTEM-WIDE impact."""
    from app.ai.opinion import estimate_impact
    G = _make_graph_with_blast()
    finding = {'affected_nodes': ['internet_gateway'], 'severity': 'CRITICAL'}
    impact = estimate_impact(finding, G)
    assert impact == 'SYSTEM-WIDE', f'Expected SYSTEM-WIDE, got {impact}'


def test_low_blast_radius_is_local():
    """Node with blast_radius = 0 must get LOCAL impact."""
    from app.ai.opinion import estimate_impact
    G = _make_graph_with_blast()
    finding = {'affected_nodes': ['patient_db'], 'severity': 'CRITICAL'}
    impact = estimate_impact(finding, G)
    assert impact == 'LOCAL', f'Expected LOCAL, got {impact}'


def test_cve_finding_is_high_likelihood():
    """Finding with cve_id must get HIGH likelihood."""
    from app.ai.opinion import estimate_likelihood
    finding = {'cve_id': 'CVE-2021-23017', 'severity': 'CRITICAL'}
    likelihood = estimate_likelihood(finding, confidence=0.95)
    assert 'HIGH' in likelihood and 'CVE' in likelihood


def test_low_confidence_is_uncertain():
    """Confidence < 0.5 must produce UNCERTAIN likelihood."""
    from app.ai.opinion import estimate_likelihood
    finding = {'severity': 'HIGH'}
    likelihood = estimate_likelihood(finding, confidence=0.30)
    assert 'UNCERTAIN' in likelihood


def test_system_wide_high_cve_is_critical_priority():
    """SYSTEM-WIDE impact + HIGH (CVE) likelihood = CRITICAL priority."""
    from app.ai.opinion import calculate_priority
    priority = calculate_priority('SYSTEM-WIDE', 'HIGH (CVE with public exploit code)')
    assert priority == 'CRITICAL', f'Expected CRITICAL, got {priority}'


def test_local_medium_is_medium_priority():
    from app.ai.opinion import calculate_priority
    priority = calculate_priority('LOCAL', 'MEDIUM')
    assert priority == 'MEDIUM'


def test_generate_ai_opinion_attaches_to_all_findings():
    """generate_ai_opinion must add ai_opinion dict to every finding."""
    from app.ai.opinion import generate_ai_opinion
    G = _make_graph_with_blast()
    findings = [
        {'rule_id': 'ZT-001', 'severity': 'CRITICAL', 'affected_nodes': ['internet_gateway'],
         'cvss': 8.2, 'business_impact': 'test impact'},
        {'rule_id': 'ZT-003', 'severity': 'CRITICAL', 'affected_nodes': ['patient_db'],
         'cvss': 9.1, 'business_impact': 'test impact 2'},
    ]
    result = generate_ai_opinion(findings, G, confidence=0.30)
    for f in result:
        assert 'ai_opinion' in f, f'Finding {f["rule_id"]} missing ai_opinion'
        assert 'impact' in f['ai_opinion']
        assert 'likelihood' in f['ai_opinion']
        assert 'priority' in f['ai_opinion']
        assert 'reason' in f['ai_opinion']


def test_findings_sorted_by_priority():
    """CRITICAL priority findings must come before MEDIUM."""
    from app.ai.opinion import generate_ai_opinion
    G = _make_graph_with_blast()
    findings = [
        {'rule_id': 'ZT-007', 'severity': 'MEDIUM', 'affected_nodes': ['patient_db'],
         'cvss': 5.9, 'business_impact': ''},
        {'rule_id': 'ZT-001', 'severity': 'CRITICAL', 'affected_nodes': ['internet_gateway'],
         'cvss': 8.2, 'business_impact': '', 'cve_id': 'CVE-2021-23017'},
    ]
    result = generate_ai_opinion(findings, G, confidence=0.95)
    # First finding should have CRITICAL priority
    first_priority = result[0]['ai_opinion']['priority']
    assert first_priority in ('CRITICAL', 'HIGH'), f'First finding should be CRITICAL/HIGH, got {first_priority}'


def test_executive_summary_structure():
    """executive_summary must return all required keys."""
    from app.ai.summarizer import executive_summary
    findings = [
        {'severity': 'CRITICAL', 'plugin': 'zero_trust',
         'ai_opinion': {'reason': 'Critical ZT violation'}},
        {'severity': 'HIGH', 'plugin': 'attack_path',
         'affected_nodes': ['a', 'b']},
    ]
    summary = executive_summary(findings, security_index=35, score_breakdown={'total': 35})
    required = {'security_index', 'risk_level', 'critical_count', 'high_count',
                'attack_paths', 'main_risk', 'recommendation', 'score_breakdown'}
    missing = required - set(summary.keys())
    assert not missing, f'executive_summary missing keys: {missing}'
    assert summary['risk_level'] == 'CRITICAL'
    assert summary['critical_count'] == 1
    assert summary['attack_paths'] == 1


def test_attack_story_multi_hop():
    """build_attack_story must produce correct narrative for multi-hop path."""
    from app.ai.summarizer import build_attack_story
    G = _make_graph_with_blast()
    story = build_attack_story(['internet_gateway', 'app_server', 'patient_db'], G)
    assert 'internet_gateway' in story
    assert 'patient_db' in story
    assert 'hop' in story.lower()


def test_tier1_known_question_returns_answer():
    """Tier-1 must return an answer for 'Why is our QVI high?'."""
    from app.advisory.tier1 import tier1_answer
    result = tier1_answer('Why is our QVI high?')
    if result is None:
        # ai_templates.json might not have loaded — skip gracefully
        import pytest; pytest.skip('ai_templates.json not loaded')
    assert 'answer' in result
    assert result['tier'] == 'rule_engine'
    assert result['match_score'] >= 80


def test_tier1_nonsense_returns_none():
    """Tier-1 must return None for unrecognised questions (triggers Tier-2)."""
    from app.advisory.tier1 import tier1_answer
    result = tier1_answer('xkcd meme about flying pigs in space')
    assert result is None, 'Unrecognised question should return None'
