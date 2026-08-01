from tests.direct.conftest import to_hex
from tests.direct.helpers import CLOSE_AT, CONTRACT_PATH, create_market, fund


def send_funding(contract, vm, sender, market_id, side, amount):
    vm.sender = sender
    vm.value = amount
    result = contract.fund_position(market_id, side)
    contract_address = vm._contract_address
    current_balance = vm._balances.get(bytes(contract_address), 0)
    vm.deal(contract_address, current_balance + amount)
    vm.value = 0
    return result


def test_missing_market_value_becomes_sender_credit(
    direct_vm, direct_deploy, direct_bob
):
    contract = direct_deploy(CONTRACT_PATH)

    result = send_funding(
        contract,
        direct_vm,
        direct_bob,
        "missing-market",
        "YES",
        11,
    )

    assert result == {
        "accepted": False,
        "reason": "MARKET_NOT_FOUND",
        "received": "11",
        "credited_refund": "11",
    }
    assert contract.get_credit(to_hex(direct_bob)) == "11"
    assert contract.get_account_market_ids(to_hex(direct_bob)) == []
    summary = contract.get_contract_summary()
    assert summary["total_received"] == "11"
    assert summary["total_credited"] == "11"
    assert summary["total_withdrawn"] == "0"
    assert summary["contract_liability"] == "11"
    assert int(summary["total_received"]) - int(summary["total_withdrawn"]) == int(
        summary["contract_liability"]
    )


def test_invalid_side_value_becomes_credit_without_market_allocation(
    direct_vm,
    direct_deploy,
    direct_alice,
    direct_bob,
):
    contract = direct_deploy(CONTRACT_PATH)
    create_market(contract, direct_vm, direct_alice)

    result = send_funding(
        contract,
        direct_vm,
        direct_bob,
        "jideytro-ros1",
        "MAYBE",
        12,
    )

    assert result == {
        "accepted": False,
        "reason": "INVALID_SIDE",
        "received": "12",
        "credited_refund": "12",
    }
    assert contract.get_credit(to_hex(direct_bob)) == "12"
    assert contract.get_market("jideytro-ros1")["total_pool"] == "0"
    assert contract.get_position("jideytro-ros1", to_hex(direct_bob))["stake"] == "0"
    assert contract.get_account_market_ids(to_hex(direct_bob)) == []


def test_elapsed_funding_window_value_becomes_credit(
    direct_vm,
    direct_deploy,
    direct_alice,
    direct_bob,
):
    contract = direct_deploy(CONTRACT_PATH)
    create_market(contract, direct_vm, direct_alice)
    direct_vm.warp(CLOSE_AT)

    result = send_funding(
        contract,
        direct_vm,
        direct_bob,
        "jideytro-ros1",
        "YES",
        13,
    )

    assert result == {
        "accepted": False,
        "reason": "FUNDING_CLOSED",
        "received": "13",
        "credited_refund": "13",
    }
    assert contract.get_credit(to_hex(direct_bob)) == "13"
    assert contract.get_market("jideytro-ros1")["total_pool"] == "0"


def test_non_open_market_value_becomes_credit(
    direct_vm,
    direct_deploy,
    direct_alice,
    direct_bob,
):
    contract = direct_deploy(CONTRACT_PATH)
    create_market(contract, direct_vm, direct_alice)
    direct_vm.warp(CLOSE_AT)
    contract.lock_market("jideytro-ros1")

    result = send_funding(
        contract,
        direct_vm,
        direct_bob,
        "jideytro-ros1",
        "YES",
        14,
    )

    assert result == {
        "accepted": False,
        "reason": "MARKET_NOT_OPEN",
        "received": "14",
        "credited_refund": "14",
    }
    assert contract.get_credit(to_hex(direct_bob)) == "14"
    market = contract.get_market("jideytro-ros1")
    assert market["status"] == "LOCKED"
    assert market["total_pool"] == "0"


def test_opposite_side_value_becomes_credit_without_changing_position(
    direct_vm,
    direct_deploy,
    direct_alice,
    direct_bob,
):
    contract = direct_deploy(CONTRACT_PATH)
    create_market(contract, direct_vm, direct_alice)
    fund(contract, direct_vm, direct_bob, "YES", 20)

    result = send_funding(
        contract,
        direct_vm,
        direct_bob,
        "jideytro-ros1",
        "NO",
        7,
    )

    assert result == {
        "accepted": False,
        "reason": "SIDE_LOCKED",
        "received": "7",
        "credited_refund": "7",
    }
    assert contract.get_credit(to_hex(direct_bob)) == "7"
    assert contract.get_position("jideytro-ros1", to_hex(direct_bob))["stake"] == "20"
    market = contract.get_market("jideytro-ros1")
    assert market["yes_total"] == "20"
    assert market["no_total"] == "0"
    assert market["total_pool"] == "20"


def test_valid_funding_and_same_side_top_up_return_accepted_result(
    direct_vm,
    direct_deploy,
    direct_alice,
    direct_bob,
):
    contract = direct_deploy(CONTRACT_PATH)
    create_market(contract, direct_vm, direct_alice)

    first = send_funding(
        contract,
        direct_vm,
        direct_bob,
        "jideytro-ros1",
        "YES",
        5,
    )
    second = send_funding(
        contract,
        direct_vm,
        direct_bob,
        "jideytro-ros1",
        "YES",
        6,
    )

    assert first == {
        "accepted": True,
        "reason": "ACCEPTED",
        "received": "5",
        "credited_refund": "0",
    }
    assert second == {
        "accepted": True,
        "reason": "ACCEPTED",
        "received": "6",
        "credited_refund": "0",
    }
    assert contract.get_position("jideytro-ros1", to_hex(direct_bob))["stake"] == "11"
    assert contract.get_credit(to_hex(direct_bob)) == "0"
    summary = contract.get_contract_summary()
    assert summary["total_received"] == "11"
    assert summary["total_credited"] == "0"
    assert summary["contract_liability"] == "11"


def test_zero_value_still_reverts_without_accounting_change(
    direct_vm,
    direct_deploy,
    direct_bob,
):
    contract = direct_deploy(CONTRACT_PATH)
    direct_vm.sender = direct_bob
    direct_vm.value = 0

    with direct_vm.expect_revert("Funding value must be positive"):
        contract.fund_position("missing-market", "YES")

    assert contract.get_credit(to_hex(direct_bob)) == "0"
    assert contract.get_contract_summary() == {
        "policy_version": "LABELSCOPE_FDA_V1",
        "market_count": 0,
        "total_received": "0",
        "total_credited": "0",
        "total_withdrawn": "0",
        "contract_liability": "0",
    }


def test_rejection_credit_is_account_isolated_and_not_double_withdrawable(
    direct_vm,
    direct_deploy,
    direct_bob,
    direct_charlie,
):
    contract = direct_deploy(CONTRACT_PATH)
    send_funding(contract, direct_vm, direct_bob, "missing-market", "YES", 9)
    send_funding(contract, direct_vm, direct_charlie, "missing-market", "NO", 10)
    sends = []

    def capture_send(vm, request):
        if "EthSend" in request:
            sends.append(request["EthSend"])
            return {"ok": None}
        return None

    direct_vm._gl_call_hook = capture_send
    direct_vm.sender = direct_bob
    contract.withdraw_credit(9)

    assert len(sends) == 1
    assert int(sends[0]["value"]) == 9
    assert sends[0]["address"].as_hex == to_hex(direct_bob)
    assert contract.get_credit(to_hex(direct_bob)) == "0"
    assert contract.get_credit(to_hex(direct_charlie)) == "10"
    summary = contract.get_contract_summary()
    assert summary["total_received"] == "19"
    assert summary["total_credited"] == "19"
    assert summary["total_withdrawn"] == "9"
    assert summary["contract_liability"] == "10"
    with direct_vm.expect_revert("Insufficient credit"):
        contract.withdraw_credit(9)
