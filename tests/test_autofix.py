# backend/tests/test_autofix.py
"""
AutoFix Engine unit tests — Day 4.
Run with: pytest tests/test_autofix.py -v
"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


def _make_findings():
    return [
        {'rule_id': 'ZT-003', 'severity': 'CRITICAL', 'cvss': 9.1,
         'affected_nodes': ['patient_db'], 'plugin': 'zero_trust'},
        {'rule_id': 'SC-001', 'severity': 'CRITICAL', 'cvss': 9.8,
         'affected_nodes': ['web_server'], 'fix_version': 'nginx:1.25.3',
         'plugin': 'supply_chain'},
        {'rule_id': 'ZT-004', 'severity': 'HIGH', 'cvss': 7.8,
         'affected_nodes': ['app_server', 'patient_db'], 'plugin': 'zero_trust'},
        {'rule_id': 'ZT-001', 'severity': 'CRITICAL', 'cvss': 8.2,
         'affected_nodes': ['admin_panel', 'patient_db'], 'plugin': 'zero_trust'},
        {'rule_id': 'Q-001',  'severity': 'CRITICAL', 'cvss': 8.5,
         'affected_nodes': ['patient_db'], 'plugin': 'quantum'},
        {'rule_id': 'ZT-005', 'severity': 'CRITICAL', 'cvss': 8.8,
         'affected_nodes': ['admin_panel'], 'plugin': 'zero_trust'},
    ]


class TestAutoFixEngine:

    def test_generates_patches_for_known_rules(self):
        from app.autofix.engine import generate_auto_fixes
        patches = generate_auto_fixes(_make_findings())
        assert len(patches) > 0, 'No patches generated — check templates.json path'

    def test_all_6_templates_covered(self):
        from app.autofix.engine import generate_auto_fixes
        patches = generate_auto_fixes(_make_findings())
        got_ids = {p['rule_id'] for p in patches}
        expected = {'ZT-003', 'SC-001', 'ZT-004', 'ZT-001', 'Q-001', 'ZT-005'}
        assert expected == got_ids, f'Missing rule_ids: {expected - got_ids}'

    def test_patches_sorted_by_score_impact_descending(self):
        from app.autofix.engine import generate_auto_fixes
        patches = generate_auto_fixes(_make_findings())
        impacts = []
        for p in patches:
            try:
                impacts.append(int(str(p.get('score_impact', '+0')).replace('+', '')))
            except ValueError:
                impacts.append(0)
        assert impacts == sorted(impacts, reverse=True), \
            f'Not sorted: {[p.get("score_impact") for p in patches]}'

    def test_node_id_placeholder_filled(self):
        from app.autofix.engine import generate_auto_fixes
        patches = generate_auto_fixes(_make_findings())
        for p in patches:
            assert '{node_id}' not in str(p), \
                f'Patch {p["rule_id"]} still has {{node_id}} placeholder'

    def test_fix_version_placeholder_filled_in_sc001(self):
        from app.autofix.engine import generate_auto_fixes
        patches = generate_auto_fixes(_make_findings())
        sc = [p for p in patches if p['rule_id'] == 'SC-001']
        assert sc, 'No SC-001 patch generated'
        assert '{fix_version}' not in str(sc[0]), 'SC-001 still has {fix_version}'
        assert 'nginx:1.25.3' in str(sc[0]), 'fix_version not substituted'

    def test_no_duplicate_patches_for_same_node(self):
        from app.autofix.engine import generate_auto_fixes
        findings = _make_findings()
        findings.append({'rule_id': 'ZT-003', 'severity': 'CRITICAL', 'cvss': 9.1,
                         'affected_nodes': ['patient_db']})
        patches = generate_auto_fixes(findings)
        zt3_pd = [p for p in patches if p['rule_id'] == 'ZT-003'
                  and p.get('affected_node') == 'patient_db']
        assert len(zt3_pd) == 1, f'Expected 1, got {len(zt3_pd)} ZT-003/patient_db patches'

    def test_patch_has_all_required_metadata(self):
        from app.autofix.engine import generate_auto_fixes
        patches = generate_auto_fixes(_make_findings())
        required = {'title', 'score_impact', 'difficulty', 'affected_node', 'rule_id', 'severity'}
        for p in patches:
            missing = required - set(p.keys())
            assert not missing, f'Patch {p.get("rule_id")} missing fields: {missing}'

    def test_empty_findings_returns_empty_list(self):
        from app.autofix.engine import generate_auto_fixes
        assert generate_auto_fixes([]) == []

    def test_unknown_rule_id_skipped(self):
        from app.autofix.engine import generate_auto_fixes
        findings = [{'rule_id': 'ZT-999', 'severity': 'HIGH', 'cvss': 7.0,
                     'affected_nodes': ['node']}]
        assert generate_auto_fixes(findings) == []

    def test_return_shape_is_list(self):
        """Shape assertion: generate_auto_fixes must always return a list."""
        from app.autofix.engine import generate_auto_fixes
        result = generate_auto_fixes(_make_findings())
        assert isinstance(result, list), f'Expected list, got {type(result)}'
