# backend/tests/test_confidence.py
"""
Confidence Model tests — the most important Day 2 tests.
"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.confidence.model import ConfidenceResolver, EVIDENCE_CONFIDENCE


def test_confidence_scores_by_source():
    assert ConfidenceResolver('terraform').confidence == 0.95
    assert ConfidenceResolver('aws_config').confidence == 0.90
    assert ConfidenceResolver('k8s').confidence == 0.85
    assert ConfidenceResolver('nmap').confidence == 0.80
    assert ConfidenceResolver('json').confidence == 0.60
    assert ConfidenceResolver('yaml').confidence == 0.60
    assert ConfidenceResolver('manual').confidence == 0.30
    assert ConfidenceResolver('none').confidence == 0.10


def test_terraform_claims_not_flipped():
    resolver = ConfidenceResolver('terraform')
    data = {
        'nodes': [{'id': 'web'}],
        'edges': [{'source': 'web', 'target': 'db',
                   'auth_required': True, 'mfa_required': True, 'tls_enforced': True}]
    }
    resolved = resolver.resolve(data)
    edge = resolved['edges'][0]
    assert edge['auth_required'] is True
    assert edge['mfa_required'] is True
    assert edge['tls_enforced'] is True
    assert len(resolver.warnings) == 0


def test_manual_claims_all_flipped():
    resolver = ConfidenceResolver('manual')
    data = {
        'nodes': [{'id': 'web'}, {'id': 'db'}],
        'edges': [{'source': 'web', 'target': 'db',
                   'auth_required': True, 'mfa_required': True, 'tls_enforced': True,
                   'per_session_auth': True, 'explicit_auth': True, 'least_privilege': True}]
    }
    resolved = resolver.resolve(data)
    edge = resolved['edges'][0]
    assert edge['auth_required'] is False
    assert edge['mfa_required'] is False
    assert edge['tls_enforced'] is False
    assert edge['per_session_auth'] is False
    assert edge['explicit_auth'] is False
    assert edge['least_privilege'] is False


def test_warning_generated_for_each_downgraded_edge():
    resolver = ConfidenceResolver('manual')
    data = {
        'nodes': [{'id': 'a'}, {'id': 'b'}, {'id': 'c'}],
        'edges': [
            {'source': 'a', 'target': 'b', 'auth_required': True},
            {'source': 'b', 'target': 'c', 'auth_required': True},
        ]
    }
    resolver.resolve(data)
    assert len(resolver.warnings) == 2


def test_false_claims_not_in_warnings():
    resolver = ConfidenceResolver('manual')
    data = {
        'nodes': [{'id': 'a'}, {'id': 'b'}],
        'edges': [{'source': 'a', 'target': 'b', 'auth_required': False}]
    }
    resolver.resolve(data)
    assert len(resolver.warnings) == 0


def test_original_data_not_mutated():
    resolver = ConfidenceResolver('manual')
    original_edge = {'source': 'a', 'target': 'b', 'auth_required': True}
    data = {'nodes': [{'id': 'a'}, {'id': 'b'}], 'edges': [original_edge]}
    resolver.resolve(data)
    assert original_edge['auth_required'] is True


def test_json_confidence_is_partially_trusted():
    resolver = ConfidenceResolver('json')
    assert resolver.confidence == 0.60
    assert not resolver.is_trusted


def test_unknown_source_gets_minimum_confidence():
    resolver = ConfidenceResolver('unknown_xyz')
    assert resolver.confidence == 0.10
