from pathlib import Path


contract = Path("contracts/labelscope_market.py")
data = contract.read_bytes()
data.decode("ascii")
lines = data.decode("ascii").splitlines()
expected = '# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }'
if not lines or lines[0] != expected:
    raise SystemExit("Contract Depends header does not match the locked API family")
