# tests/test_routes_day5.py
"""
Day 5 report endpoint tests.
Run with: pytest tests/test_routes_day5.py -v
"""
import sys, os, json, tempfile, uuid, pytest

# Use file-based temp DB to avoid in-memory isolation issues
_tmp_db = os.path.join(tempfile.gettempdir(), 'quantum_ares_test_routes_day5.db')
if os.path.exists(_tmp_db):
    os.remove(_tmp_db)
os.environ['SQLITE_PATH'] = _tmp_db
os.environ['SECRET_KEY']  = 'test-key-day5'

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from fastapi.testclient import TestClient
from app.main import app
from app.db.database import get_db, init_schema, build_fts5_index
from argon2 import PasswordHasher


@pytest.fixture(scope='module')
def ct():
    """Returns (client, token, scan_id)."""
    with TestClient(app) as c:
        init_schema()
        build_fts5_index()
        conn = get_db()
        ph = PasswordHasher()
        org_id = 'd5org'
        conn.execute("INSERT OR IGNORE INTO orgs (id, name, tier) VALUES (?, 'D5Org', 'enterprise')", (org_id,))
        conn.execute(
            "INSERT OR IGNORE INTO users (org_id, email, password_hash, role) VALUES (?, ?, ?, ?)",
            (org_id, 'day5@test.com', ph.hash('Day5Pass@'), 'admin')
        )
        conn.commit()

        # Login
        login = c.post('/api/v1/auth/login', json={'email': 'day5@test.com', 'password': 'Day5Pass@'})
        token = login.json()['access_token']

        # Create a complete scan with findings and patches
        scan_id = uuid.uuid4().hex
        conn.execute(
            "INSERT INTO scans (id, org_id, name, input_raw, evidence_source, status, security_index, "
            "findings, score_breakdown, ai_opinions, executive_summary, auto_fix_patches, "
            "confidence_warnings, engine_status, node_count) "
            "VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
            (scan_id, org_id, 'Day5Test', '{}', 'json', 'complete', 28,
             json.dumps([{"severity": "CRITICAL", "engine": "zero_trust",
                          "description": "No MFA", "rule_id": "ZT-001",
                          "ai_opinion": {"impact": "DB breach", "priority": "P1"}}]),
             json.dumps({"total": 28.0, "zero_trust": 0, "quantum": 2.1,
                         "attack_path": 11.0, "supply_chain": 5.0, "compliance": 10.0}),
             json.dumps({"risk_level": "CRITICAL"}),
             json.dumps({"risk_level": "CRITICAL", "critical_count": 1, "attack_paths": 0}),
             json.dumps([{"patch_id": "ZT-001-PATCH", "title": "Enable MFA",
                          "cvss_score": 9.1, "score_impact": 15}]),
             json.dumps([]),
             json.dumps({"zt": "ok", "autofix": "ok"}),
             7)
        )
        conn.commit()

        # Also create a pending scan for the 400 test
        pending_id = uuid.uuid4().hex
        conn.execute(
            "INSERT INTO scans (id, org_id, name, input_raw, evidence_source, status) "
            "VALUES (?,?,?,?,?,?)",
            (pending_id, org_id, 'PendingScan', '{}', 'json', 'pending')
        )
        conn.commit()
        conn.close()

        yield c, token, scan_id, pending_id


class TestReportRoutes:
    def test_generate_report_returns_report_id(self, ct):
        c, token, scan_id, _ = ct
        r = c.post(f'/api/v1/reports/{scan_id}/generate',
                   headers={'Authorization': f'Bearer {token}'})
        assert r.status_code == 200
        data = r.json()
        assert 'report_id' in data
        assert 'sha256' in data
        assert len(data['sha256']) == 64

    def test_generate_report_for_unknown_scan_returns_404(self, ct):
        c, token, _, _ = ct
        r = c.post('/api/v1/reports/nonexistent-scan/generate',
                   headers={'Authorization': f'Bearer {token}'})
        assert r.status_code == 404

    def test_generate_report_without_auth_returns_401_or_422(self, ct):
        c, _, scan_id, _ = ct
        r = c.post(f'/api/v1/reports/{scan_id}/generate')
        assert r.status_code in (401, 403, 422)

    def test_download_report_returns_pdf_bytes(self, ct):
        c, token, scan_id, _ = ct
        gen = c.post(f'/api/v1/reports/{scan_id}/generate',
                     headers={'Authorization': f'Bearer {token}'})
        report_id = gen.json()['report_id']
        r = c.get(f'/api/v1/reports/{report_id}',
                  headers={'Authorization': f'Bearer {token}'})
        assert r.status_code == 200
        assert r.headers['content-type'] == 'application/pdf'
        assert r.content[:4] == b'%PDF'
        assert len(r.content) > 2000

    def test_download_report_has_sha256_header(self, ct):
        c, token, scan_id, _ = ct
        gen = c.post(f'/api/v1/reports/{scan_id}/generate',
                     headers={'Authorization': f'Bearer {token}'})
        report_id = gen.json()['report_id']
        r = c.get(f'/api/v1/reports/{report_id}',
                  headers={'Authorization': f'Bearer {token}'})
        assert 'x-sha256' in r.headers

    def test_download_nonexistent_report_returns_404(self, ct):
        c, token, _, _ = ct
        r = c.get('/api/v1/reports/nonexistent-report-id',
                  headers={'Authorization': f'Bearer {token}'})
        assert r.status_code == 404

    def test_generate_returns_json_with_scan_id(self, ct):
        c, token, scan_id, _ = ct
        gen = c.post(f'/api/v1/reports/{scan_id}/generate',
                     headers={'Authorization': f'Bearer {token}'})
        assert gen.json()['scan_id'] == scan_id

    def test_pdf_content_disposition_header(self, ct):
        c, token, scan_id, _ = ct
        gen = c.post(f'/api/v1/reports/{scan_id}/generate',
                     headers={'Authorization': f'Bearer {token}'})
        report_id = gen.json()['report_id']
        r = c.get(f'/api/v1/reports/{report_id}',
                  headers={'Authorization': f'Bearer {token}'})
        assert 'attachment' in r.headers.get('content-disposition', '')

    def test_swagger_shows_report_endpoints(self, ct):
        c, _, _, _ = ct
        r = c.get('/openapi.json')
        paths = r.json()['paths']
        assert any('reports' in p for p in paths)

    def test_generate_incomplete_scan_returns_400(self, ct):
        c, token, _, pending_id = ct
        r = c.post(f'/api/v1/reports/{pending_id}/generate',
                   headers={'Authorization': f'Bearer {token}'})
        assert r.status_code == 400
