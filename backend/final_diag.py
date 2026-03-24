"""Fixed diagnostic — Sections 1,3,4,5,6,7,8,9."""
import sys, os, re, json, time, importlib, inspect, traceback

ROOT = r"C:\Users\avadu\OneDrive\Desktop\Quantum_Ares\backend"
sys.path.insert(0, ROOT)
os.environ["SQLITE_PATH"] = os.path.join(ROOT, "app", "data", "quantum_ares.db")

passed = []
failed = []

def mark(section, name, ok, detail=""):
    tag = "PASS" if ok else "FAIL"
    line = f"  [{tag}]  {name}" + (f"  ({detail})" if detail else "")
    print(line)
    (passed if ok else failed).append(f"S{section}: {name}")

# S1
print("=" * 60)
print("SECTION 1 -- DEPENDENCY AUDIT")
print("=" * 60)
required = [
    ("fastapi","fastapi"), ("uvicorn","uvicorn"), ("pydantic","pydantic"),
    ("jose","python-jose"), ("argon2","argon2-cffi"), ("cryptography","cryptography"),
    ("reportlab","reportlab"), ("networkx","networkx"), ("rapidfuzz","rapidfuzz"),
    ("yaml","pyyaml"), ("multipart","python-multipart"), ("pytest","pytest"),
]
for mod, pkg in required:
    try:
        m = __import__(mod)
        mark(1, pkg, True)
    except ImportError:
        mark(1, pkg, False, "MISSING")

# S3
print("\n" + "=" * 60)
print("SECTION 3 -- HARDCODED PATH AUDIT")
print("=" * 60)
pattern = re.compile(r'C:\\\\|C:/Users|/home/avadu', re.IGNORECASE)
hardcoded = []
for root, dirs, files in os.walk(ROOT):
    dirs[:] = [d for d in dirs if d not in ["venv","__pycache__",".pytest_cache",".git","data"]]
    for fname in files:
        if not fname.endswith(".py"): continue
        if fname.startswith(("gate","check","debug","run_tests","day6","smoke","test_auto","final_diag")):
            continue
        fpath = os.path.join(root, fname)
        with open(fpath, encoding="utf-8", errors="ignore") as f:
            for i, line in enumerate(f, 1):
                if pattern.search(line) and "sys.path.insert" not in line:
                    hardcoded.append(f"  {os.path.relpath(fpath, ROOT)}:{i}  {line.strip()[:80]}")
if hardcoded:
    print(f"  Found {len(hardcoded)} hardcoded paths:")
    for h in hardcoded[:10]: print(h)
mark(3, "No hardcoded paths in production code", len(hardcoded) == 0, f"{len(hardcoded)} found" if hardcoded else "clean")

# S4
print("\n" + "=" * 60)
print("SECTION 4 -- API FIELD CONTRACT AUDIT")
print("=" * 60)
from app.db.database import get_db
conn = get_db()
row = conn.execute("SELECT * FROM scans WHERE status='complete' ORDER BY created_at DESC LIMIT 1").fetchone()
if row:
    scan = dict(row)
    required_fields = ["security_index","status","findings","score_breakdown",
                       "risk_summary","auto_fix_patches","ai_opinions","executive_summary",
                       "confidence_warnings","engine_status","node_count"]
    for field in required_fields:
        val = scan.get(field)
        if val is not None:
            if isinstance(val, str) and val.startswith(("[","{")):
                try:
                    parsed = json.loads(val)
                    detail = f"list({len(parsed)})" if isinstance(parsed, list) else f"dict({list(parsed.keys())[:3]})"
                    mark(4, field, True, detail)
                except: mark(4, field, False, "invalid JSON")
            else:
                mark(4, field, True, str(val)[:40])
        else:
            mark(4, field, False, "NULL/missing in DB")
else:
    print("  No complete scans in DB")
conn.close()

# S5
print("\n" + "=" * 60)
print("SECTION 5 -- ENGINE RETURN SHAPE VERIFICATION")
print("=" * 60)
import networkx as nx
G = nx.DiGraph()
G.add_node("gw", type="gateway", zone="PUBLIC", tls_enforced=False, mfa_enabled=False,
           sensitivity=3, vuln_score=8, data_retention_years=5, software="nginx:1.20.1")
G.add_node("db", type="database", zone="CRITICAL", tls_enforced=True, mfa_enabled=False,
           sensitivity=5, vuln_score=9, data_retention_years=10)
G.add_node("app", type="server", zone="INTERNAL", tls_enforced=True, mfa_enabled=True,
           sensitivity=2, vuln_score=3, data_retention_years=1)
G.add_edge("gw", "app"); G.add_edge("app", "db")

engines = [
    ("zero_trust",   "app.engines.zero_trust",  "zero_trust_engine"),
    ("quantum",      "app.engines.quantum",      "quantum_engine"),
    ("attack_path",  "app.engines.attack_path",  "attack_path_engine"),
    ("supply_chain", "app.engines.supply_chain", "supply_chain_engine"),
]
for name, module_path, fn_name in engines:
    try:
        mod = importlib.import_module(module_path)
        fn = getattr(mod, fn_name)
        result = fn(G)
        ok = (isinstance(result, tuple) and len(result) == 2
              and isinstance(result[0], list) and isinstance(result[1], (int, float)))
        detail = f"{len(result[0])} findings, score={result[1]:.1f}" if ok else f"wrong shape"
        mark(5, name, ok, detail)
    except Exception as e:
        mark(5, name, False, str(e)[:60])

try:
    from app.engines.compliance import enrich_with_compliance
    sample = [{"severity":"CRITICAL","rule_id":"ZT-001","description":"No MFA",
               "engine":"zero_trust","affected_nodes":["db"]}]
    result = enrich_with_compliance(sample)
    ok = isinstance(result, tuple) and len(result) == 2
    mark(5, "compliance", ok, f"{len(result[0])} findings" if ok else str(type(result)))
except Exception as e:
    mark(5, "compliance", False, str(e)[:60])

# S6 — Fixed: ConfidenceResolver takes evidence_source as constructor arg
print("\n" + "=" * 60)
print("SECTION 6 -- CONFIDENCE RESOLVER VERIFICATION")
print("=" * 60)
try:
    from app.confidence.model import ConfidenceResolver
    # Test manual source (0.30 < 0.70 threshold) — should flip positive claims on edges
    r1 = ConfidenceResolver(evidence_source="manual")
    raw_data = {
        "nodes": [{"id":"db","type":"database","zone":"CRITICAL"}],
        "edges": [
            {"source":"gw","target":"db","tls_enforced":True,"mfa_required":True,"auth_required":True}
        ]
    }
    resolved = r1.resolve(raw_data)
    edge = resolved["edges"][0]
    tls_flipped = edge.get("tls_enforced") == False
    mfa_flipped = edge.get("mfa_required") == False
    mark(6, "Manual source flips TLS on edge", tls_flipped, f"True->{edge.get('tls_enforced')}")
    mark(6, "Manual source flips MFA on edge", mfa_flipped, f"True->{edge.get('mfa_required')}")
    mark(6, "Warnings generated", len(r1.warnings) > 0, f"{len(r1.warnings)} warnings")

    # Test automated source (0.90 >= 0.70) — should NOT flip
    r2 = ConfidenceResolver(evidence_source="terraform")
    raw2 = {"edges":[{"source":"a","target":"b","tls_enforced":True,"mfa_required":True}]}
    res2 = r2.resolve(raw2)
    e2 = res2["edges"][0]
    mark(6, "Terraform keeps TLS", e2.get("tls_enforced") == True)
    mark(6, "Terraform keeps MFA", e2.get("mfa_required") == True)

    s = r1.summary()
    mark(6, "summary() returns dict", isinstance(s, dict), f"keys={list(s.keys())[:4]}")
except Exception as e:
    mark(6, "ConfidenceResolver", False, str(e)[:80])
    traceback.print_exc()

# S7
print("\n" + "=" * 60)
print("SECTION 7 -- PDF BUILDER VERIFICATION")
print("=" * 60)
try:
    from app.report.pdf_builder import build_pdf
    from app.report.signer import sign_pdf, verify_signature
    scan_data = {
        "id":"debug-001","security_index":28,"node_count":7,"status":"complete",
        "risk_summary":"Critical vulnerabilities detected.",
        "findings":[
            {"severity":"CRITICAL","engine":"zero_trust","description":"No MFA on DB",
             "rule_id":"ZT-001","affected_nodes":["patient_db"],
             "ai_opinion":{"impact":"Full DB compromise","attack_story":"Attacker bypasses gateway",
                          "priority":"P1","likelihood":"HIGH"}},
        ],
        "score_breakdown":{"zero_trust":0.0,"quantum":2.1,"attack_path":11.0,
                          "supply_chain":5.0,"compliance":10.0,"total":28.0},
        "executive_summary":{"risk_level":"CRITICAL","critical_count":10,"attack_paths":6,
                            "summary":"Hospital critically exposed.",
                            "recommendation":"Enforce MFA and patch nginx."},
        "auto_fix_patches":[
            {"patch_id":"ZT-001-P","title":"Enable MFA","cvss_score":9.1,"score_impact":15,
             "description":"Enable MFA on all database connections"},
        ],
    }
    pdf = build_pdf(scan_data, "DemoOrg")
    mark(7, "PDF is bytes", isinstance(pdf, bytes))
    mark(7, "PDF header %PDF", pdf[:4] == b"%PDF", pdf[:4])
    mark(7, "PDF > 5000 bytes", len(pdf) > 5000, f"{len(pdf):,} bytes")

    sig = sign_pdf(pdf)
    mark(7, "SHA256 len=64", len(sig["sha256"]) == 64)
    mark(7, "Signature verifies", verify_signature(pdf, sig["sig_b64"]))
    tampered = pdf[:-10] + b"TAMPERED!!"
    mark(7, "Tampered PDF rejected", not verify_signature(tampered, sig["sig_b64"]))

    out = os.path.join(ROOT, "debug_report.pdf")
    with open(out, "wb") as f: f.write(pdf)
    print(f"  PDF saved: {out}")
except Exception as e:
    mark(7, "PDF builder", False, str(e)[:80])
    traceback.print_exc()

# S8
print("\n" + "=" * 60)
print("SECTION 8 -- CHAT ADVISORY TIER 1 + TIER 2")
print("=" * 60)
try:
    from app.advisory.tier1 import tier1_answer
    t0 = time.time()
    r1 = tier1_answer("Why is our zero trust score low?")
    ms1 = (time.time() - t0) * 1000
    mark(8, "Tier 1 match found", r1 is not None, f"{ms1:.0f}ms")
    mark(8, "Tier 1 < 300ms", ms1 < 300, f"{ms1:.0f}ms")
except Exception as e:
    mark(8, "Tier 1", False, str(e)[:60])

try:
    from app.advisory.tier2 import tier2_answer
    db = os.environ["SQLITE_PATH"]
    t0 = time.time()
    r2 = tier2_answer("xyzzy purple elephant quantum", db)
    ms2 = (time.time() - t0) * 1000
    mark(8, "Tier 2 no crash on nonsense", True, f"{ms2:.0f}ms")
except Exception as e:
    mark(8, "Tier 2", False, str(e)[:60])

# S9
print("\n" + "=" * 60)
print("SECTION 9 -- PIPELINE RUNNER STAGE AUDIT")
print("=" * 60)
try:
    from app.pipeline import runner
    src = inspect.getsource(runner)
    stages = [
        ("Stage 1 (load)",       ["get_scan","load"]),
        ("Stage 2 (confidence)", ["ConfidenceResolver","confidence","resolve"]),
        ("Stage 3 (graph)",      ["build_graph","parse_input","enrich"]),
        ("Stage 4 (engines)",    ["zero_trust_engine","quantum_engine","attack_path_engine","supply_chain_engine"]),
        ("Stage 5 (compliance)", ["enrich_with_compliance"]),
        ("Stage 6 (AI opinion)", ["generate_ai_opinion","executive_summary"]),
        ("Stage 7 (autofix)",    ["generate_auto_fixes","auto_fix","autofix"]),
        ("Stage 8 (persist)",    ["update","commit","persist"]),
    ]
    for name, keywords in stages:
        found = any(kw.lower() in src.lower() for kw in keywords)
        mark(9, name, found)
    mark(9, "auto_fix_patches in DB write", "auto_fix_patches" in src)
except Exception as e:
    mark(9, "Pipeline runner", False, str(e)[:60])

# S12 — DB INTEGRITY
print("\n" + "=" * 60)
print("SECTION 12 -- DATABASE INTEGRITY")
print("=" * 60)
import sqlite3
db_path = os.environ["SQLITE_PATH"]
conn2 = sqlite3.connect(db_path)
conn2.row_factory = sqlite3.Row
tables = [r[0] for r in conn2.execute("SELECT name FROM sqlite_master WHERE type='table'").fetchall()]
for t in ["orgs","users","scans","reports","docs_fts"]:
    mark(12, f"table: {t}", t in tables)

cols = [r[1] for r in conn2.execute("PRAGMA table_info(scans)").fetchall()]
for c in ["security_index","findings","score_breakdown","ai_opinions","executive_summary",
           "auto_fix_patches","confidence_warnings","engine_status","node_count","risk_summary"]:
    mark(12, f"scans.{c}", c in cols)

u = conn2.execute("SELECT email FROM users WHERE email='admin@demo.com'").fetchone()
mark(12, "admin@demo.com exists", u is not None)
for t in ["orgs","users","scans","reports"]:
    n = conn2.execute(f"SELECT COUNT(*) FROM {t}").fetchone()[0]
    print(f"  {t}: {n} rows")
conn2.close()

# FINAL SUMMARY
print("\n" + "=" * 60)
print("FINAL SUMMARY")
print("=" * 60)
print(f"  PASSED: {len(passed)}")
print(f"  FAILED: {len(failed)}")
if failed:
    print("\n  Failures:")
    for f in failed:
        print(f"    X {f}")
    sys.exit(1)
else:
    print("\n  ALL CHECKS PASSED")
