# backend/seed.py
"""
Creates demo org + demo user for development and the 7-minute demo.

Run from backend/ directory:
  python seed.py

Creates:
  Org:  DemoOrg (id: demoorg001, tier: enterprise, node_limit: 500)
  User: admin@demo.com / Admin@1234 (role: admin)

Safe to run multiple times — skips if already seeded.
"""

import sys
import os

# Add the backend directory to Python path so imports work
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Set default DB path to local dev location (not /app/data which is Docker path)
if 'SQLITE_PATH' not in os.environ:
    os.environ['SQLITE_PATH'] = os.path.join(
        os.path.dirname(os.path.abspath(__file__)), 'app', 'data', 'quantum_ares.db'
    )

from app.db.database import init_schema, get_db
from argon2 import PasswordHasher


def seed():
    print('[SEED] Initialising schema...')
    init_schema()

    conn = get_db()
    ph = PasswordHasher()

    # Check if already seeded
    existing = conn.execute("SELECT id FROM orgs WHERE id='demoorg001'").fetchone()
    if existing:
        user = conn.execute("SELECT email FROM users WHERE org_id='demoorg001'").fetchone()
        print(f'[SEED] Already seeded.')
        print(f'[SEED] Org: DemoOrg (id: demoorg001)')
        print(f'[SEED] User: {user["email"] if user else "not found"}')
        conn.close()
        return

    # Create demo org
    conn.execute(
        "INSERT INTO orgs (id, name, tier, node_limit) VALUES (?, ?, ?, ?)",
        ('demoorg001', 'DemoOrg', 'enterprise', 500)
    )
    print('[SEED] ✓ Org created: DemoOrg | tier: enterprise | node_limit: 500')

    # Create admin user — password: Admin@1234
    password_hash = ph.hash('Admin@1234')
    conn.execute(
        "INSERT INTO users (org_id, email, password_hash, role) VALUES (?, ?, ?, ?)",
        ('demoorg001', 'admin@demo.com', password_hash, 'admin')
    )
    print('[SEED] ✓ User created: admin@demo.com | password: Admin@1234 | role: admin')

    # Create a second analyst user for testing
    analyst_hash = ph.hash('Analyst@1234')
    conn.execute(
        "INSERT INTO users (org_id, email, password_hash, role) VALUES (?, ?, ?, ?)",
        ('demoorg001', 'analyst@demo.com', analyst_hash, 'analyst')
    )
    print('[SEED] ✓ User created: analyst@demo.com | password: Analyst@1234 | role: analyst')

    conn.commit()
    conn.close()

    print()
    print('[SEED] ══════════════════════════════════════════')
    print('[SEED] Seed complete. Use these credentials:')
    print('[SEED] Email:    admin@demo.com')
    print('[SEED] Password: Admin@1234')
    print('[SEED] ══════════════════════════════════════════')


if __name__ == '__main__':
    seed()
