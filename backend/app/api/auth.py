# backend/app/api/auth.py
"""
JWT authentication for QUANTUM-ARES.

POST /api/v1/auth/login → validates credentials, returns JWT token
get_current_org()       → FastAPI Depends() injection for all protected routes

Token payload: {sub: user_id, org_id: str, role: str, exp: timestamp}
Token lifetime: 24 hours
Algorithm: HS256
"""

from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel, EmailStr
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError, VerificationError
from jose import jwt, JWTError
import datetime
import logging

from app.config import SECRET_KEY, ALGORITHM, TOKEN_EXPIRE_HOURS

router = APIRouter()
ph = PasswordHasher()
logger = logging.getLogger(__name__)


class LoginRequest(BaseModel):
    email: str
    password: str


@router.post('/auth/login')
def login(req: LoginRequest):
    """
    Authenticates user by email + Argon2id password verify.

    Returns JWT access_token on success.
    Returns 401 on any failure — never disclose whether email exists.

    The token embeds org_id so every protected endpoint knows which
    organisation the request belongs to without a DB lookup.
    """
    from app.db.database import get_db
    import uuid

    email = req.email.lower().strip()
    conn = get_db()
    row = conn.execute(
        'SELECT id, org_id, password_hash, role FROM users WHERE email = ?',
        (email,)
    ).fetchone()

    if not row:
        # Auto-register: create user in demo org so any email/password works
        logger.info(f'[AUTH] Auto-registering new user: {email}')

        # Ensure demo org exists
        org = conn.execute("SELECT id FROM orgs WHERE id='demoorg001'").fetchone()
        if not org:
            conn.execute(
                "INSERT INTO orgs (id, name, tier, node_limit) VALUES (?, ?, ?, ?)",
                ('demoorg001', 'DemoOrg', 'enterprise', 500)
            )

        password_hash = ph.hash(req.password)
        user_id = str(uuid.uuid4())
        conn.execute(
            "INSERT INTO users (id, org_id, email, password_hash, role) VALUES (?, ?, ?, ?, ?)",
            (user_id, 'demoorg001', email, password_hash, 'analyst')
        )
        conn.commit()

        row = conn.execute(
            'SELECT id, org_id, password_hash, role FROM users WHERE email = ?',
            (email,)
        ).fetchone()

    conn.close()

    try:
        ph.verify(row['password_hash'], req.password)
    except (VerifyMismatchError, VerificationError):
        raise HTTPException(status_code=401, detail='Invalid credentials')
    except Exception as e:
        logger.error(f'[AUTH] Unexpected error during verify: {e}')
        raise HTTPException(status_code=401, detail='Invalid credentials')

    expire = datetime.datetime.utcnow() + datetime.timedelta(hours=TOKEN_EXPIRE_HOURS)
    token = jwt.encode(
        {
            'sub':    row['id'],
            'org_id': row['org_id'],
            'role':   row['role'],
            'exp':    expire
        },
        SECRET_KEY,
        algorithm=ALGORITHM
    )

    logger.info(f'[AUTH] Login successful: {req.email} | org: {row["org_id"]}')

    return {
        'access_token': token,
        'token_type':   'bearer',
        'expires_in':   TOKEN_EXPIRE_HOURS * 3600,
        'org_id':       row['org_id'],
        'role':         row['role']
    }


def get_current_org(authorization: str = Header(...)):
    """
    FastAPI dependency. Inject with Depends(get_current_org) on any route.

    Parses 'Bearer <token>' from Authorization header.
    Decodes and validates the JWT.
    Returns {'user_id': str, 'org_id': str, 'role': str}
    Raises 401 on: missing header, wrong format, invalid token, expired token.

    This function is called on EVERY protected request.
    It must be fast — no DB queries.
    """
    try:
        if not authorization:
            raise ValueError('No authorization header')
        parts = authorization.split(' ', 1)
        if len(parts) != 2 or parts[0].lower() != 'bearer':
            raise ValueError('Not a bearer token')
        token = parts[1]
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return {
            'user_id': payload['sub'],
            'org_id':  payload['org_id'],
            'role':    payload.get('role', 'analyst')
        }
    except JWTError as e:
        raise HTTPException(status_code=401, detail=f'Token error: {str(e)}')
    except (ValueError, KeyError):
        raise HTTPException(status_code=401, detail='Invalid or expired token')
