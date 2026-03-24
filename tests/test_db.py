# backend/tests/test_db.py
"""
Day 1 database tests.
Run with: pytest tests/test_db.py -v
"""
import os
import sys
import tempfile
import pytest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
test_db_path = os.path.join(tempfile.gettempdir(), 'quantum_ares_test_db.db')

@pytest.fixture(autouse=True)
def setup_db():
    if os.path.exists(test_db_path):
        os.remove(test_db_path)
    os.environ['SQLITE_PATH'] = test_db_path
    from app.db.database import init_schema
    init_schema()


def test_init_schema():
    """Schema creation must be idempotent."""
    from app.db.database import init_schema, get_db
    init_schema()
    init_schema()  # second call must not fail
    conn = get_db()
    tables = [row[0] for row in conn.execute(
        "SELECT name FROM sqlite_master WHERE type='table'"
    ).fetchall()]
    assert 'orgs' in tables
    assert 'users' in tables
    assert 'scans' in tables
    assert 'reports' in tables
    conn.close()


def test_create_and_get_scan():
    """Create a scan, retrieve it, verify fields."""
    from app.db.database import init_schema, get_db
    from app.db.queries import create_scan, get_scan, update_scan_running

    init_schema()

    # Create test org
    conn = get_db()
    conn.execute("INSERT OR IGNORE INTO orgs (id, name) VALUES ('testorg', 'TestOrg')")
    conn.commit()
    conn.close()

    scan_id = create_scan('testorg', 'Test Scan', '{"nodes":[],"edges":[]}', 'json')
    assert len(scan_id) == 32  # UUID without hyphens

    scan = get_scan(scan_id, 'testorg')
    assert scan is not None
    assert scan['status'] == 'pending'
    assert scan['name'] == 'Test Scan'
    assert scan['org_id'] == 'testorg'

    # Update to running
    update_scan_running(scan_id)
    scan = get_scan(scan_id, 'testorg')
    assert scan['status'] == 'running'


def test_cross_org_isolation():
    """A scan from org A must not be visible to org B."""
    from app.db.database import init_schema, get_db
    from app.db.queries import create_scan, get_scan

    init_schema()

    conn = get_db()
    conn.execute("INSERT OR IGNORE INTO orgs (id, name) VALUES ('orgA', 'OrgA')")
    conn.execute("INSERT OR IGNORE INTO orgs (id, name) VALUES ('orgB', 'OrgB')")
    conn.commit()
    conn.close()

    scan_id = create_scan('orgA', 'OrgA Scan', '{}', 'json')
    result = get_scan(scan_id, 'orgB')  # should return None — not visible to orgB
    assert result is None, 'Cross-org data leak detected!'


def test_update_scan_result_atomic():
    """update_scan_result must write all fields in one UPDATE."""
    from app.db.database import init_schema, get_db
    from app.db.queries import create_scan, update_scan_result, get_scan

    init_schema()

    conn = get_db()
    conn.execute("INSERT OR IGNORE INTO orgs (id, name) VALUES ('testorg2', 'TestOrg2')")
    conn.commit()
    conn.close()

    scan_id = create_scan('testorg2', 'Test', '{}', 'json')
    update_scan_result(scan_id, {
        'graph_json':         {'nodes': [{'id': 'web'}], 'edges': []},
        'node_count':         1,
        'security_index':     75,
        'score_breakdown':    {'zero_trust': 26.25, 'total': 75},
        'risk_summary':       {'CRITICAL': 0, 'HIGH': 1, 'MEDIUM': 0, 'LOW': 0},
        'findings':           [{'rule_id': 'ZT-001', 'severity': 'HIGH'}],
        'ai_opinions':        {'risk_level': 'HIGH'},
        'executive_summary':  {'security_index': 75},
        'auto_fix_patches':   [],
        'confidence_warnings':[],
        'engine_status':      {'zt': 'ok', 'quantum': 'ok', 'ap': 'ok', 'sc': 'ok'},
        'duration_ms':        1234
    })

    scan = get_scan(scan_id, 'testorg2')
    assert scan['status'] == 'complete'
    assert scan['security_index'] == 75
    assert scan['node_count'] == 1
    assert isinstance(scan['findings'], list)
    assert len(scan['findings']) == 1
    assert scan['findings'][0]['rule_id'] == 'ZT-001'
    assert scan['duration_ms'] == 1234
