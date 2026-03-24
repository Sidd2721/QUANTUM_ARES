# app/report/signer.py
"""
RSA-2048 PDF signing for Quantum Ares security reports.

CRITICAL RULE: The RSA keypair is generated ONCE at module import time
and cached as module-level variables. Never regenerate per request.
Regenerating destroys the ability to verify any previously issued signature.
"""

import hashlib
import base64
from cryptography.hazmat.primitives.asymmetric import rsa, padding
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.backends import default_backend

# ── Generate keypair ONCE at module load ──────────────────────────────────────
_PRIVATE_KEY = rsa.generate_private_key(
    public_exponent=65537,
    key_size=2048,
    backend=default_backend()
)
_PUBLIC_KEY = _PRIVATE_KEY.public_key()

# Export public key PEM once — reuse this string in every signed report
PUBLIC_KEY_PEM: str = _PUBLIC_KEY.public_bytes(
    encoding=serialization.Encoding.PEM,
    format=serialization.PublicFormat.SubjectPublicKeyInfo
).decode("utf-8")


def sign_pdf(pdf_bytes: bytes) -> dict:
    """
    Sign PDF bytes with the module-level RSA private key.

    Returns dict with:
        sha256   — hex string of SHA-256 hash of the PDF bytes
        sig_b64  — base64-encoded RSA signature
        pub_pem  — public key PEM string (paste into report footer)
    """
    # 1. Compute SHA-256 of the raw PDF bytes
    sha256_hex = hashlib.sha256(pdf_bytes).hexdigest()

    # 2. Sign the PDF bytes directly with PKCS1v15 + SHA256
    signature = _PRIVATE_KEY.sign(
        pdf_bytes,
        padding.PKCS1v15(),
        hashes.SHA256()
    )

    # 3. Base64-encode the signature for JSON-safe storage
    sig_b64 = base64.b64encode(signature).decode("utf-8")

    return {
        "sha256":  sha256_hex,
        "sig_b64": sig_b64,
        "pub_pem": PUBLIC_KEY_PEM,
    }


def verify_signature(pdf_bytes: bytes, sig_b64: str) -> bool:
    """
    Verify a signature produced by sign_pdf().
    Returns True if valid, False otherwise.
    Used in tests only — not exposed via API.
    """
    try:
        signature = base64.b64decode(sig_b64)
        _PUBLIC_KEY.verify(
            signature,
            pdf_bytes,
            padding.PKCS1v15(),
            hashes.SHA256()
        )
        return True
    except Exception:
        return False
