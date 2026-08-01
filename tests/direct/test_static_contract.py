import ast
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
CONTRACT = ROOT / "contracts" / "labelscope_market.py"
EXPECTED_HEADER = '# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }'


def test_contract_file_is_ascii_and_uses_locked_header():
    data = CONTRACT.read_bytes()
    source = data.decode("ascii")
    lines = source.splitlines()
    assert lines[0] == EXPECTED_HEADER
    assert lines[1] == "from genlayer import *"


def test_exactly_one_contract_subclass_and_no_placeholder_markers():
    source = CONTRACT.read_text(encoding="ascii")
    tree = ast.parse(source)
    contract_classes = []
    for node in tree.body:
        if isinstance(node, ast.ClassDef):
            if any(isinstance(base, ast.Attribute) and base.attr == "Contract" for base in node.bases):
                contract_classes.append(node.name)
    assert contract_classes == ["LabelScopeMarket"]
    assert "TODO" not in source
    assert "pass  # placeholder" not in source


def test_value_receiving_entrypoint_is_payable_and_resolution_accepts_no_verdict():
    source = CONTRACT.read_text(encoding="ascii")
    tree = ast.parse(source)
    methods = {
        node.name: node
        for top in tree.body
        if isinstance(top, ast.ClassDef) and top.name == "LabelScopeMarket"
        for node in top.body
        if isinstance(node, ast.FunctionDef)
    }
    fund = methods["fund_position"]
    decorators = [ast.unparse(item) for item in fund.decorator_list]
    assert "gl.public.write.payable" in decorators
    resolve_args = [arg.arg for arg in methods["resolve_market"].args.args]
    assert resolve_args == ["self", "market_id"]
    assert "gl.message.value" in ast.unparse(fund)


def test_native_withdrawal_uses_current_external_eoa_interface():
    source = CONTRACT.read_text(encoding="ascii")
    tree = ast.parse(source)
    interfaces = [node for node in tree.body if isinstance(node, ast.ClassDef) and node.name == "_ExternalRecipient"]

    assert len(interfaces) == 1
    assert "gl.evm.contract_interface" in ast.unparse(interfaces[0])
    withdraw = next(
        node
        for node in ast.walk(tree)
        if isinstance(node, ast.FunctionDef) and node.name == "withdraw_credit"
    )
    rendered = ast.unparse(withdraw)
    assert "_ExternalRecipient(sender).emit_transfer" in rendered
    assert "gl.get_contract_at(sender).emit_transfer" not in rendered


def test_custom_validator_is_semantic_and_sandboxed_by_default():
    source = CONTRACT.read_text(encoding="ascii")
    assert "gl.vm.run_nondet(" in source
    assert "_semantic_fingerprint" in source
    assert "isinstance(leader_result, gl.vm.Return)" in source
