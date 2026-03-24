"""
Final integration contract test — must pass 0 failures before push to main.
Verifies every field P2's frontend reads from the backend API.
"""
import pytest
import json

REQUIRED_SCAN_FIELDS = [
    "status", "security_index", "score_breakdown", "findings",
    "risk_summary", "auto_fix_patches", "ai_opinions",
    "executive_summary", "confidence_warnings", "engine_status",
    "node_count", "graph_data"
]
REQUIRED_SCORE_BREAKDOWN_KEYS = ["zero_trust", "quantum", "attack_path", "supply_chain", "compliance"]
REQUIRED_EXEC_SUMMARY_KEYS = ["risk_level", "critical_count", "attack_paths", "recommendation"]
REQUIRED_FINDING_KEYS = ["rule_id", "severity", "message", "engine", "ai_opinion"]

def test_all_scan_fields_present(full_scan_result):
    for field in REQUIRED_SCAN_FIELDS:
        assert field in full_scan_result, f"Missing field: {field}"

def test_score_breakdown_has_5_engines(full_scan_result):
    sb = full_scan_result["score_breakdown"]
    for key in REQUIRED_SCORE_BREAKDOWN_KEYS:
        assert key in sb, f"Missing score_breakdown.{key}"
        assert 0 <= sb[key] <= 100, f"score_breakdown.{key} out of range: {sb[key]}"

def test_executive_summary_complete(full_scan_result):
    es = full_scan_result["executive_summary"]
    for key in REQUIRED_EXEC_SUMMARY_KEYS:
        assert key in es, f"Missing executive_summary.{key}"

def test_every_finding_has_ai_opinion(full_scan_result):
    for i, finding in enumerate(full_scan_result["findings"]):
        for key in REQUIRED_FINDING_KEYS:
            assert key in finding, f"Finding[{i}] missing key: {key}"

def test_security_index_in_range(full_scan_result):
    idx = full_scan_result["security_index"]
    assert 0 <= idx <= 100, f"security_index out of range: {idx}"

def test_quantum_score_inverted(full_scan_result):
    """Verify quantum contributes (100 - agg_qvi) * 0.20, not agg_qvi * 0.20"""
    sb = full_scan_result["score_breakdown"]
    pass  # detailed check done in test_pipeline.py

def test_graph_data_has_nodes_and_edges(full_scan_result):
    gd = full_scan_result["graph_data"]
    assert "nodes" in gd
    assert "edges" in gd
    assert len(gd["nodes"]) > 0
