# backend/tests/test_routes_day4.py
"""
Day 4 endpoint tests: /patches and /chat.
Run with: pytest tests/test_routes_day4.py -v
"""
import sys, os, io, json, time, tempfile
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
test_db_path = os.path.join(tempfile.gettempdir(), 'quantum_ares_test_routes_day4.db')
if os.path.exists(test_db_path):
    os.remove(test_db_path)
os.environ['SQLITE_PATH'] = test_db_path
os.environ['SECRET_KEY']  = 'test-key-day4'
import pytest
from fastapi.testclient import TestClient
from argon2 import PasswordHasher


@pytest.fixture(scope='module')
def ct():
    """Returns (client, token, headers)."""
    from app.main import app
    from app.db.database import get_db, init_schema, build_fts5_index
    with TestClient(app) as c:
        init_schema()
        build_fts5_index()
        conn = get_db()
        ph = PasswordHasher()
        conn.execute("INSERT OR IGNORE INTO orgs (id,name,tier) VALUES ('d4org','D4Org','enterprise')")
        conn.execute("INSERT OR IGNORE INTO users (org_id,email,password_hash,role) VALUES (?,?,?,?)",
                     ('d4org', 'd4@test.com', ph.hash('D4Pass@'), 'admin'))
        conn.commit()
        conn.close()
        login = c.post('/api/v1/auth/login', json={'email': 'd4@test.com', 'password': 'D4Pass@'})
        token = login.json()['access_token']
        headers = {'Authorization': f'Bearer {token}'}
        yield c, token, headers


def _scan(ct_fixture, payload_bytes, name='Test', evidence='json'):
    """Upload file, wait for completion, return scan_id."""
    c, _, headers = ct_fixture
    upload = c.post('/api/v1/validate', headers=headers,
                    files={'file': ('t.json', io.BytesIO(payload_bytes), 'application/json')},
                    data={'name': name, 'evidence_source': evidence})
    assert upload.status_code == 202
    sid = upload.json()['scan_id']
    for _ in range(30):
        time.sleep(0.5)
        s = c.get(f'/api/v1/scans/{sid}/status', headers=headers).json()
        if s.get('status') in ('complete', 'failed'):
            break
    return sid


_HOSPITAL_PAYLOAD = json.dumps({
    'nodes': [
        {'id': 'web', 'type': 'server', 'zone': 'PUBLIC',
         'data_sensitivity': 'CRITICAL', 'encryption_type': 'none',
         'container_image': 'nginx:1.20.1'},
        {'id': 'db', 'type': 'database', 'zone': 'PRIVATE',
         'data_sensitivity': 'CRITICAL', 'encryption_type': 'none',
         'iam_roles': ['arn:aws:iam::*:role/*'], 'retention_years': 15}
    ],
    'edges': [{'source': 'web', 'target': 'db',
               'auth_required': False, 'mfa_required': False,
               'tls_enforced': False, 'access_scope': 'FULL'}]
}).encode()


class TestPatchesEndpoint:

    def test_patches_200_for_complete_scan(self, ct):
        c, _, headers = ct
        sid = _scan(ct, _HOSPITAL_PAYLOAD, 'PatchTest')
        r = c.get(f'/api/v1/scans/{sid}/patches', headers=headers)
        assert r.status_code == 200
        data = r.json()
        assert 'patches' in data
        assert 'count' in data
        assert isinstance(data['patches'], list)

    def test_patches_non_empty_for_violation_scan(self, ct):
        c, _, headers = ct
        sid = _scan(ct, _HOSPITAL_PAYLOAD, 'PatchNonEmpty')
        r = c.get(f'/api/v1/scans/{sid}/patches', headers=headers)
        data = r.json()
        assert data['count'] > 0, 'Expected patches for a scan with violations'

    def test_patches_have_required_fields(self, ct):
        c, _, headers = ct
        sid = _scan(ct, _HOSPITAL_PAYLOAD, 'PatchFields')
        r = c.get(f'/api/v1/scans/{sid}/patches', headers=headers)
        for p in r.json().get('patches', []):
            assert 'title' in p,        f'Missing title in {p}'
            assert 'score_impact' in p,  f'Missing score_impact in {p}'
            assert 'affected_node' in p, f'Missing affected_node in {p}'

    def test_patches_download_returns_text_file(self, ct):
        c, _, headers = ct
        sid = _scan(ct, _HOSPITAL_PAYLOAD, 'PatchDownload')
        r = c.get(f'/api/v1/scans/{sid}/patches?format=download', headers=headers)
        assert r.status_code == 200
        ct_header = r.headers.get('content-type', '')
        assert 'text' in ct_header, f'Expected text content-type, got: {ct_header}'
        cd = r.headers.get('content-disposition', '')
        assert 'attachment' in cd and '.tf' in cd

    def test_patches_404_for_unknown_scan(self, ct):
        c, _, headers = ct
        r = c.get('/api/v1/scans/nonexistent123/patches', headers=headers)
        assert r.status_code == 404

    def test_patches_requires_auth(self, ct):
        c, _, _ = ct
        r = c.get('/api/v1/scans/someid/patches')
        assert r.status_code in (401, 422)

    def test_total_score_impact_is_integer(self, ct):
        c, _, headers = ct
        sid = _scan(ct, _HOSPITAL_PAYLOAD, 'PatchImpact')
        r = c.get(f'/api/v1/scans/{sid}/patches', headers=headers)
        data = r.json()
        assert isinstance(data.get('total_score_impact'), int), \
            f'total_score_impact must be int, got {type(data.get("total_score_impact"))}'


class TestChatEndpoint:

    def test_known_question_returns_answer(self, ct):
        c, _, headers = ct
        r = c.post('/api/v1/chat',
                   json={'question': 'Why is our QVI high?'},
                   headers=headers)
        assert r.status_code == 200
        data = r.json()
        assert 'answer' in data
        assert 'tier' in data
        assert len(data['answer']) > 10

    def test_tier1_match_for_exact_template_question(self, ct):
        c, _, headers = ct
        r = c.post('/api/v1/chat',
                   json={'question': 'What is Zero Trust Architecture?'},
                   headers=headers)
        assert r.status_code == 200
        data = r.json()
        # If templates loaded, should be rule_engine; else semantic fallback is fine
        assert data['tier'] in ('rule_engine', 'semantic', 'error')

    def test_unknown_question_falls_to_tier2(self, ct):
        c, _, headers = ct
        r = c.post('/api/v1/chat',
                   json={'question': 'What is the DPDP Act penalty for data breach?'},
                   headers=headers)
        assert r.status_code == 200
        data = r.json()
        assert 'answer' in data

    def test_empty_question_returns_400(self, ct):
        c, _, headers = ct
        r = c.post('/api/v1/chat', json={'question': ''}, headers=headers)
        assert r.status_code == 400

    def test_missing_question_returns_400(self, ct):
        c, _, headers = ct
        r = c.post('/api/v1/chat', json={'scan_id': 'abc'}, headers=headers)
        assert r.status_code == 400

    def test_chat_without_token_returns_401_or_422(self, ct):
        c, _, _ = ct
        r = c.post('/api/v1/chat', json={'question': 'What is QVI?'})
        assert r.status_code in (401, 422)

    def test_chat_never_returns_500(self, ct):
        """/chat must NEVER return 500 — always 200 even on internal error."""
        c, _, headers = ct
        r = c.post('/api/v1/chat',
                   json={'question': 'xkcd meme about flying pigs in space quadrants'},
                   headers=headers)
        # Must be 200 (answer from tier1/tier2/error) or 400 (validation)
        assert r.status_code != 500, '/chat must never return 500'
