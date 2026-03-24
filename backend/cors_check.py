import urllib.request, json

# Test OPTIONS preflight (this is what browsers send before every cross-origin request)
req = urllib.request.Request(
    'http://localhost:8000/api/v1/auth/login',
    method='OPTIONS'
)
req.add_header('Origin', 'http://localhost:3000')
req.add_header('Access-Control-Request-Method', 'POST')
req.add_header('Access-Control-Request-Headers', 'Content-Type,Authorization')

try:
    with urllib.request.urlopen(req) as resp:
        headers = dict(resp.headers)
        acao = headers.get('access-control-allow-origin', 'MISSING')
        acam = headers.get('access-control-allow-methods', 'MISSING')
        acah = headers.get('access-control-allow-headers', 'MISSING')
        print(f'Allow-Origin:  {acao}')
        print(f'Allow-Methods: {acam}')
        print(f'Allow-Headers: {acah}')
        if acao in ('http://localhost:3000', '*'):
            print('CORS PREFLIGHT: PASS')
        else:
            print(f'CORS PREFLIGHT: FAIL — origin not allowed')
except Exception as e:
    print(f'CORS test error: {e}')
    print('Check that server is running and ALLOWED_ORIGINS includes http://localhost:3000')
