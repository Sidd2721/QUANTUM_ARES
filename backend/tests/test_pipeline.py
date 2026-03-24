# backend/tests/test_pipeline.py
"""
Pipeline integration tests — Gate 2 verification.
Uses FastAPI TestClient with a temp DB for full end-to-end checks.
"""
import sys, os, time, io, json, tempfile
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

test_db = os.path.join(tempfile.gettempdir(), 'quantum_ares_test_pipeline.db')
if os.path.exists(test_db):
    os.remove(test_db)
os.environ['SQLITE_PATH'] = test_db
os.environ['SECRET_KEY'] = 'test-key-day2'

import pytest


@pytest.fixture(scope='module')
def client_and_token():
    from fastapi.testclient import TestClient
    from app.main import app
    from app.db.database import get_db
    from argon2 import PasswordHasher

    with TestClient(app) as client:
        conn = get_db()
        ph = PasswordHasher()
        conn.execute("INSERT OR IGNORE INTO orgs (id, name, tier) VALUES ('p2org', 'P2Org', 'enterprise')")
        conn.execute(
            "INSERT OR IGNORE INTO users (org_id, email, password_hash, role) VALUES (?,?,?,?)",
            ('p2org', 'day2@test.com', ph.hash('Day2Pass@'), 'admin')
        )
        conn.commit()
        conn.close()

        login = client.post('/api/v1/auth/login', json={
            'email': 'day2@test.com', 'password': 'Day2Pass@'
        })
        token = login.json()['access_token']
        yield client, token


def test_health_still_passes(client_and_token):
    client, _ = client_and_token
    r = client.get('/health')
    assert r.status_code == 200
    assert r.json()['status'] == 'ok'


def test_validate_returns_202(client_and_token):
    client, token = client_and_token
    headers = {'Authorization': f'Bearer {token}'}
    payload = b'{"nodes":[{"id":"web","type":"server","zone":"PUBLIC"}],"edges":[]}'
    r = client.post(
        '/api/v1/validate',
        headers=headers,
        files={'file': ('test.json', io.BytesIO(payload), 'application/json')},
        data={'name': 'Day2SimpleTest', 'evidence_source': 'json'}
    )
    assert r.status_code == 202
    data = r.json()
    assert 'scan_id' in data
    assert data['status'] == 'pending'


def test_pipeline_produces_graph_json(client_and_token):
    client, token = client_and_token
    headers = {'Authorization': f'Bearer {token}'}

    payload = json.dumps({
        'nodes': [
            {'id': 'web', 'type': 'server', 'zone': 'PUBLIC', 'data_sensitivity': 'LOW'},
            {'id': 'db',  'type': 'database', 'zone': 'PRIVATE', 'data_sensitivity': 'CRITICAL'}
        ],
        'edges': [
            {'source': 'web', 'target': 'db', 'auth_required': True, 'mfa_required': True}
        ]
    }).encode()

    upload = client.post(
        '/api/v1/validate',
        headers=headers,
        files={'file': ('arch.json', io.BytesIO(payload), 'application/json')},
        data={'name': 'GraphTest', 'evidence_source': 'json'}
    )
    scan_id = upload.json()['scan_id']

    for _ in range(20):
        time.sleep(0.5)
        status = client.get(f'/api/v1/scans/{scan_id}/status', headers=headers)
        if status.json().get('status') == 'complete':
            break

    result = client.get(f'/api/v1/scans/{scan_id}', headers=headers)
    assert result.status_code == 200
    data = result.json()
    assert data['status'] == 'complete'
    assert data['node_count'] == 2
    assert len(data['graph_json']['nodes']) == 2


def test_manual_source_generates_confidence_warnings(client_and_token):
    """
    GATE 2 CRITICAL TEST:
    manual evidence_source with positive security claims
    MUST produce confidence_warnings in the scan result.
    """
    client, token = client_and_token
    headers = {'Authorization': f'Bearer {token}'}

    payload = json.dumps({
        'nodes': [
            {'id': 'server', 'type': 'server', 'zone': 'PUBLIC'},
            {'id': 'patient_data', 'type': 'database', 'zone': 'PRIVATE',
             'data_sensitivity': 'CRITICAL'}
        ],
        'edges': [{
            'source': 'server', 'target': 'patient_data',
            'auth_required': True,
            'mfa_required': True,
            'tls_enforced': True
        }],
        'evidence_source': 'manual'
    }).encode()

    upload = client.post(
        '/api/v1/validate',
        headers=headers,
        files={'file': ('manual.json', io.BytesIO(payload), 'application/json')},
        data={'name': 'ConfidenceTest', 'evidence_source': 'manual'}
    )
    scan_id = upload.json()['scan_id']

    for _ in range(20):
        time.sleep(0.5)
        status = client.get(f'/api/v1/scans/{scan_id}/status', headers=headers)
        if status.json().get('status') in ('complete', 'failed'):
            break

    result = client.get(f'/api/v1/scans/{scan_id}', headers=headers)
    data = result.json()

    assert data['status'] == 'complete', f"Scan failed: {data}"

    warnings = data.get('confidence_warnings', [])
    assert len(warnings) > 0, (
        'GATE 2 FAILED: manual evidence source with positive claims '
        'must produce confidence_warnings.'
    )

    w = warnings[0]
    assert 'edge' in w
    assert 'downgraded_claims' in w
    assert 'reason' in w
    assert len(w['downgraded_claims']) > 0


def test_opinion_endpoint_returns_200(client_and_token):
    client, token = client_and_token
    headers = {'Authorization': f'Bearer {token}'}

    payload = json.dumps({'nodes': [{'id': 'n1'}], 'edges': []}).encode()
    upload = client.post(
        '/api/v1/validate',
        headers=headers,
        files={'file': ('t.json', io.BytesIO(payload), 'application/json')},
        data={'name': 'OpinionTest', 'evidence_source': 'json'}
    )
    scan_id = upload.json()['scan_id']

    for _ in range(20):
        time.sleep(0.5)
        if client.get(f'/api/v1/scans/{scan_id}/status', headers=headers).json().get('status') == 'complete':
            break

    r = client.get(f'/api/v1/scans/{scan_id}/opinion', headers=headers)
    assert r.status_code == 200
    assert 'executive_summary' in r.json()


def test_security_index_is_a_number(client_and_token):
    client, token = client_and_token
    headers = {'Authorization': f'Bearer {token}'}

    payload = json.dumps({'nodes': [{'id': 'x'}], 'edges': []}).encode()
    upload = client.post(
        '/api/v1/validate', headers=headers,
        files={'file': ('x.json', io.BytesIO(payload), 'application/json')},
        data={'name': 'IndexTest', 'evidence_source': 'json'}
    )
    scan_id = upload.json()['scan_id']

    for _ in range(20):
        time.sleep(0.5)
        if client.get(f'/api/v1/scans/{scan_id}/status', headers=headers).json().get('status') == 'complete':
            break

    result = client.get(f'/api/v1/scans/{scan_id}', headers=headers)
    data = result.json()
    idx = data.get('security_index')
    assert idx is not None, 'security_index must not be None'
    assert isinstance(idx, int), f'security_index must be int, got {type(idx)}'
    assert 0 <= idx <= 100, f'security_index must be 0-100, got {idx}'
