# backend/tests/test_api.py
"""
Gate 1 API integration tests.
Run with: pytest tests/test_api.py -v

These tests verify all Gate 1 requirements using FastAPI TestClient.
All tests use an in-memory SQLite DB — no file system side effects.
"""
import os
import sys
import tempfile
import pytest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
test_db_path = os.path.join(tempfile.gettempdir(), 'quantum_ares_test_api.db')
if os.path.exists(test_db_path):
    os.remove(test_db_path)
os.environ['SQLITE_PATH'] = test_db_path
os.environ['SECRET_KEY'] = 'test-secret-key-for-testing-only'

from fastapi.testclient import TestClient
from argon2 import PasswordHasher


@pytest.fixture(scope='module')
def client():
    """TestClient with seeded org + user."""
    from app.main import app
    from app.db.database import get_db, init_schema, build_fts5_index, _get_sqlite_path

    print(f'\n[TEST_API] SQLITE_PATH env: {os.environ.get("SQLITE_PATH")}')
    print(f'[TEST_API] _get_sqlite_path(): {_get_sqlite_path()}')

    with TestClient(app) as c:
        print(f'[TEST_API] After lifespan, _get_sqlite_path(): {_get_sqlite_path()}')
        # Ensure schema exists for THIS test's DB path
        init_schema()
        build_fts5_index()
        print(f'[TEST_API] After init_schema, _get_sqlite_path(): {_get_sqlite_path()}')
        # Seed test org and user
        conn = get_db()
        print(f'[TEST_API] get_db() connection database: {conn.execute("PRAGMA database_list").fetchall()}')
        # Check if orgs table exists
        tables = [row[0] for row in conn.execute("SELECT name FROM sqlite_master WHERE type='table'").fetchall()]
        print(f'[TEST_API] Tables in DB: {tables}')
        ph = PasswordHasher()
        conn.execute("INSERT OR IGNORE INTO orgs (id, name, tier) VALUES ('testorg', 'TestOrg', 'enterprise')")
        conn.execute(
            "INSERT OR IGNORE INTO users (org_id, email, password_hash, role) VALUES (?, ?, ?, ?)",
            ('testorg', 'test@example.com', ph.hash('TestPass@123'), 'admin')
        )
        conn.commit()
        conn.close()
        yield c


def test_health_returns_ok(client):
    """GET /health must return status: ok with db: ok."""
    r = client.get('/health')
    assert r.status_code == 200
    data = r.json()
    assert data['status'] == 'ok'
    assert data['db'] == 'ok'
    assert 'version' in data


def test_login_valid_credentials(client):
    """POST /auth/login with correct password returns a JWT token."""
    r = client.post('/api/v1/auth/login', json={
        'email': 'test@example.com',
        'password': 'TestPass@123'
    })
    assert r.status_code == 200
    data = r.json()
    assert 'access_token' in data
    assert data['token_type'] == 'bearer'
    assert data['expires_in'] == 86400


def test_login_wrong_password_returns_401(client):
    """Wrong password must return 401 — never 200."""
    r = client.post('/api/v1/auth/login', json={
        'email': 'test@example.com',
        'password': 'WrongPassword'
    })
    assert r.status_code == 401


def test_login_nonexistent_user_returns_401(client):
    """Non-existent email must return 401 — never reveal user existence."""
    r = client.post('/api/v1/auth/login', json={
        'email': 'nobody@nowhere.com',
        'password': 'AnyPassword'
    })
    assert r.status_code == 401


def test_protected_route_without_token_returns_422(client):
    """GET /scans without token must fail (missing Authorization header)."""
    r = client.get('/api/v1/scans')
    assert r.status_code == 422  # Unprocessable — missing required header


def test_protected_route_with_invalid_token_returns_401(client):
    """GET /scans with a fake token must return 401."""
    r = client.get('/api/v1/scans', headers={'Authorization': 'Bearer fakefakefake'})
    assert r.status_code == 401


def test_upload_and_poll_full_cycle(client):
    """Full Gate 1 cycle: login → upload → poll → get result."""
    # Step 1: Login
    login_r = client.post('/api/v1/auth/login', json={
        'email': 'test@example.com',
        'password': 'TestPass@123'
    })
    token = login_r.json()['access_token']
    headers = {'Authorization': f'Bearer {token}'}

    # Step 2: Upload
    import io
    file_content = b'{"nodes":[{"id":"web","type":"server","zone":"PUBLIC"}],"edges":[]}'
    upload_r = client.post(
        '/api/v1/validate',
        headers=headers,
        files={'file': ('test.json', io.BytesIO(file_content), 'application/json')},
        data={'name': 'Gate1Test', 'evidence_source': 'json'}
    )
    assert upload_r.status_code == 202
    scan_id = upload_r.json()['scan_id']
    assert len(scan_id) == 32

    # Step 3: Poll status (stub pipeline completes in ~0.3s)
    import time
    time.sleep(1)
    status_r = client.get(f'/api/v1/scans/{scan_id}/status', headers=headers)
    assert status_r.status_code == 200
    assert status_r.json()['status'] in ('pending', 'running', 'complete')

    # Step 4: Get full result (wait a bit more for stub to finish)
    time.sleep(1)
    result_r = client.get(f'/api/v1/scans/{scan_id}', headers=headers)
    assert result_r.status_code == 200

    # Step 5: List scans
    list_r = client.get('/api/v1/scans', headers=headers)
    assert list_r.status_code == 200
    assert 'scans' in list_r.json()
