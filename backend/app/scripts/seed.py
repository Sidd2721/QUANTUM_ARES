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
import logging

logging.basicConfig(level=logging.INFO, format='%(message)s')
logger = logging.getLogger(__name__)

# Add the backend directory to Python path so imports work
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

# Set default DB path to local dev location (not /app/data which is Docker path)
if 'SQLITE_PATH' not in os.environ:
    os.environ['SQLITE_PATH'] = os.path.join(
        os.path.dirname(os.path.abspath(__file__)), 'app', 'data', 'quantum_ares.db'
    )

from app.db.database import init_schema, get_db
from argon2 import PasswordHasher


def seed():
    logger.info('[SEED] Initialising schema...')
    init_schema()

    conn = get_db()
    ph = PasswordHasher()

    # Check if already seeded
    existing = conn.execute("SELECT id FROM orgs WHERE id='demoorg001'").fetchone()
    if existing:
        user = conn.execute("SELECT email FROM users WHERE org_id='demoorg001'").fetchone()
        logger.info(f'[SEED] Already seeded.')
        logger.info(f'[SEED] Org: DemoOrg (id: demoorg001)')
        logger.info(f'[SEED] User: {user["email"] if user else "not found"}')
        conn.close()
        return

    # Create demo org
    conn.execute(
        "INSERT INTO orgs (id, name, tier, node_limit) VALUES (?, ?, ?, ?)",
        ('demoorg001', 'DemoOrg', 'enterprise', 500)
    )
    logger.info('[SEED] ✓ Org created: DemoOrg | tier: enterprise | node_limit: 500')

    # Create admin user — password: Admin@1234
    password_hash = ph.hash('Admin@1234')
    conn.execute(
        "INSERT INTO users (org_id, email, password_hash, role) VALUES (?, ?, ?, ?)",
        ('demoorg001', 'admin@demo.com', password_hash, 'admin')
    )
    logger.info('[SEED] ✓ User created: admin@demo.com | password: Admin@1234 | role: admin')

    # Create a second analyst user for testing
    analyst_hash = ph.hash('Analyst@1234')
    conn.execute(
        "INSERT INTO users (org_id, email, password_hash, role) VALUES (?, ?, ?, ?)",
        ('demoorg001', 'analyst@demo.com', analyst_hash, 'analyst')
    )
    logger.info('[SEED] ✓ User created: analyst@demo.com | password: Analyst@1234 | role: analyst')

    conn.commit()
    conn.close()

    logger.info('')
    logger.info('[SEED] ══════════════════════════════════════════')
    logger.info('[SEED] Seed complete. Use these credentials:')
    logger.info('[SEED] Email:    admin@demo.com')
    logger.info('[SEED] Password: Admin@1234')
    logger.info('[SEED] ══════════════════════════════════════════')


if __name__ == '__main__':
    seed()
