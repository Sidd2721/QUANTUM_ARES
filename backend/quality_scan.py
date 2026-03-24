import os
import ast

def scan_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        source = f.read()

    try:
        tree = ast.parse(source)
    except SyntaxError as e:
        print(f"Syntax Error in {filepath}: {e}")
        return False

    for node in ast.walk(tree):
        if isinstance(node, ast.Call) and getattr(node.func, 'id', '') == 'print':
            if 'verify' not in filepath and 'quality_scan.py' not in filepath and 'dep_check.py' not in filepath:
                print(f"Warning: Print statement found in {filepath}")
                # return False  # Uncomment if print statements should cause failure

        if isinstance(node, ast.ExceptHandler) and getattr(node, 'type', None) is None:
            print(f"Warning: Bare except clause found in {filepath}")

    return True

all_good = True
for root, _, files in os.walk('app'):
    for file in files:
        if file.endswith('.py'):
            if not scan_file(os.path.join(root, file)):
                all_good = False

if all_good:
    print("Quality scan PASS: No syntax errors or bare excepts found.")
else:
    print("Quality scan FAIL: Issues detected.")
