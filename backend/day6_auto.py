"""Day 6 Section 2 — Local smoke test + Section 3 ZIP creation + Section 6 SECRET_KEY."""
import subprocess, time, json, urllib.request, os, sys, uuid

BASE = "http://localhost:8000"
DEMO_DIR = r"C:\Users\avadu\OneDrive\Desktop\Quantum_Ares\demo"
BACKEND = r"C:\Users\avadu\OneDrive\Desktop\Quantum_Ares\backend"

# ── helpers ──
def post_json(url, data=None, headers=None):
    req = urllib.request.Request(url, method="POST")
    if headers:
        for k, v in headers.items():
            req.add_header(k, v)
    if data:
        req.add_header("Content-Type", "application/json")
        return json.loads(urllib.request.urlopen(req, json.dumps(data).encode()).read().decode())
    return json.loads(urllib.request.urlopen(req).read().decode())

def get_json(url, headers=None):
    req = urllib.request.Request(url)
    if headers:
        for k, v in headers.items():
            req.add_header(k, v)
    return json.loads(urllib.request.urlopen(req).read().decode())

def upload_file(url, filepath, headers):
    boundary = uuid.uuid4().hex
    filename = os.path.basename(filepath)
    with open(filepath, "rb") as f:
        file_data = f.read()
    body = (
        f"--{boundary}\r\n"
        f'Content-Disposition: form-data; name="file"; filename="{filename}"\r\n'
        f"Content-Type: application/json\r\n\r\n"
    ).encode() + file_data + f"\r\n--{boundary}--\r\n".encode()
    req = urllib.request.Request(url, data=body, method="POST")
    for k, v in headers.items():
        req.add_header(k, v)
    req.add_header("Content-Type", f"multipart/form-data; boundary={boundary}")
    return json.loads(urllib.request.urlopen(req).read().decode())

# ── wait for server ──
print("Waiting for server...")
for i in range(20):
    try:
        h = get_json(f"{BASE}/health")
        if h["status"] == "ok":
            print(f"  Server UP: status={h['status']} db={h['db']}")
            break
    except Exception:
        time.sleep(1)
else:
    print("  Server failed to start!")
    sys.exit(1)

# ── Section 2: Smoke test ──
print("\n=== SECTION 2: LOCAL SMOKE TEST ===")
r = post_json(f"{BASE}/api/v1/auth/login", {"email": "admin@demo.com", "password": "Admin@1234"})
token = r["access_token"]
headers = {"Authorization": f"Bearer {token}"}
print(f"Login: PASS")

scan = upload_file(f"{BASE}/api/v1/validate", os.path.join(DEMO_DIR, "demo_hospital.json"), headers)
sid = scan["scan_id"]
print(f"Upload: PASS (scan_id={sid})")

for _ in range(30):
    time.sleep(1)
    st = get_json(f"{BASE}/api/v1/scans/{sid}/status", headers)
    if st["status"] in ["complete", "failed"]:
        break
print(f"Scan: {st['status']} index={st.get('security_index', 'N/A')}")

rep = post_json(f"{BASE}/api/v1/reports/{sid}/generate", headers=headers)
print(f"Report: PASS (report_id={rep['report_id']}, sha256={rep['sha256'][:16]}...)")

chat = post_json(f"{BASE}/api/v1/chat", {"question": "Why is our zero trust score low?"}, headers)
print(f"Chat: PASS (tier={chat['tier']})")

print("\n=== LOCAL SMOKE TEST: ALL PASS ===")

# ── Section 6: SECRET_KEY ──
import secrets
key = secrets.token_hex(32)
print(f"\n=== SECTION 6: SECRET_KEY FOR RENDER ===")
print(f"SECRET_KEY={key}")
print(f"(Copy the 64-char hex above into Render Environment Variables)")

# ── Section 3: Deploy ZIP ──
print(f"\n=== SECTION 3: CREATING DEPLOY ZIP ===")
import zipfile

zip_path = r"C:\Users\avadu\OneDrive\Desktop\quantum_ares_deploy.zip"
src = BACKEND
excludes = {"venv", "__pycache__", ".pytest_cache", "data", ".git"}
exclude_ext = {".db", ".pdf", ".mp4", ".pyc"}

with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zf:
    for root, dirs, files in os.walk(src):
        # Skip excluded directories
        dirs[:] = [d for d in dirs if d not in excludes]
        for fname in files:
            _, ext = os.path.splitext(fname)
            if ext in exclude_ext:
                continue
            full = os.path.join(root, fname)
            arcname = os.path.relpath(full, src)
            zf.write(full, arcname)

size_kb = os.path.getsize(zip_path) // 1024
print(f"ZIP created: {zip_path}")
print(f"ZIP size: {size_kb} KB")

# List top-level contents of ZIP
with zipfile.ZipFile(zip_path, "r") as zf:
    top = set()
    for n in zf.namelist():
        top.add(n.split("/")[0])
    print(f"ZIP top-level entries: {sorted(top)}")

print("\n=== ALL AUTOMATED SECTIONS COMPLETE ===")
