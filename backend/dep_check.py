import sys
pkgs = [
    ('fastapi','fastapi'),('uvicorn','uvicorn'),('pydantic','pydantic'),
    ('jose','python-jose[cryptography]'),('argon2','argon2-cffi'),
    ('cryptography','cryptography'),('reportlab','reportlab'),
    ('networkx','networkx'),('rapidfuzz','rapidfuzz'),
    ('yaml','pyyaml'),('multipart','python-multipart'),
    ('httpx','httpx'),('pytest','pytest'),('requests','requests'),
]
missing=[]
for mod,pkg in pkgs:
    try: __import__(mod); print(f'  OK  {pkg}')
    except ImportError: print(f'  MISSING  {pkg}'); missing.append(pkg)
if missing:
    print('\nRun: .\\venv\\Scripts\\pip.exe install ' + ' '.join(f'"{p}"' for p in missing))
else:
    print('\nAll dependencies OK.')
