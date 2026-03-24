# tests/test_report.py
import os, sys, pytest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))


# ── Signer tests ─────────────────────────────────────────────────────────────
class TestSigner:
    def test_sign_returns_three_fields(self):
        from app.report.signer import sign_pdf
        result = sign_pdf(b"test payload")
        assert "sha256" in result
        assert "sig_b64" in result
        assert "pub_pem" in result

    def test_sha256_is_hex_64_chars(self):
        from app.report.signer import sign_pdf
        result = sign_pdf(b"test payload")
        assert len(result["sha256"]) == 64
        int(result["sha256"], 16)   # raises ValueError if not hex

    def test_pub_pem_format(self):
        from app.report.signer import sign_pdf
        result = sign_pdf(b"any data")
        assert result["pub_pem"].startswith("-----BEGIN PUBLIC KEY-----")

    def test_verify_correct_signature(self):
        from app.report.signer import sign_pdf, verify_signature
        data = b"quantum ares report content"
        result = sign_pdf(data)
        assert verify_signature(data, result["sig_b64"]) is True

    def test_verify_tampered_content_fails(self):
        from app.report.signer import sign_pdf, verify_signature
        result = sign_pdf(b"original content")
        assert verify_signature(b"tampered content", result["sig_b64"]) is False

    def test_keypair_stable_across_calls(self):
        """Same module-level keypair used for all signatures."""
        from app.report.signer import sign_pdf, verify_signature
        r1 = sign_pdf(b"doc one")
        r2 = sign_pdf(b"doc two")
        assert verify_signature(b"doc one", r1["sig_b64"]) is True
        assert verify_signature(b"doc two", r2["sig_b64"]) is True
        assert verify_signature(b"doc one", r2["sig_b64"]) is False


# ── PDF builder tests ─────────────────────────────────────────────────────────
SAMPLE_SCAN = {
    "id": "test-scan-001",
    "security_index": 28,
    "node_count": 7,
    "status": "complete",
    "risk_summary": "Critical vulnerabilities detected.",
    "findings": [
        {"severity": "CRITICAL", "engine": "zero_trust",
         "description": "No MFA on database", "rule_id": "ZT-001",
         "ai_opinion": {"impact": "Full DB compromise",
                        "attack_story": "Attacker exploits gateway",
                        "priority": "P1"}},
    ],
    "score_breakdown": {"zero_trust": 0, "quantum": 2.1,
                        "attack_path": 11.0, "supply_chain": 5.0,
                        "compliance": 10.0, "total": 28.0},
    "executive_summary": {"risk_level": "CRITICAL", "critical_count": 10,
                           "attack_paths": 6, "summary": "System critically exposed."},
    "auto_fix_patches": [
        {"patch_id": "ZT-003-PATCH", "title": "Enable MFA",
         "cvss_score": 9.1, "score_impact": 15, "description": "Enable MFA on all admins"}
    ],
}


class TestPDFBuilder:
    def test_returns_bytes(self):
        from app.report.pdf_builder import build_pdf
        result = build_pdf(SAMPLE_SCAN)
        assert isinstance(result, bytes)

    def test_valid_pdf_header(self):
        from app.report.pdf_builder import build_pdf
        result = build_pdf(SAMPLE_SCAN)
        assert result[:4] == b"%PDF", f"Expected %PDF, got {result[:4]}"

    def test_nonzero_size(self):
        from app.report.pdf_builder import build_pdf
        result = build_pdf(SAMPLE_SCAN)
        assert len(result) > 2000, \
            f"PDF too small ({len(result)} bytes) — likely forgot buf.seek(0)"

    def test_sign_and_verify_pdf(self):
        from app.report.pdf_builder import build_pdf
        from app.report.signer import sign_pdf, verify_signature
        pdf_bytes = build_pdf(SAMPLE_SCAN)
        sig_data = sign_pdf(pdf_bytes)
        assert verify_signature(pdf_bytes, sig_data["sig_b64"]) is True

    def test_empty_findings_does_not_crash(self):
        from app.report.pdf_builder import build_pdf
        scan = dict(SAMPLE_SCAN)
        scan["findings"] = []
        result = build_pdf(scan)
        assert result[:4] == b"%PDF"

    def test_missing_exec_summary_does_not_crash(self):
        from app.report.pdf_builder import build_pdf
        scan = dict(SAMPLE_SCAN)
        scan["executive_summary"] = {}
        result = build_pdf(scan)
        assert result[:4] == b"%PDF"
