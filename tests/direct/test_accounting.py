from tests.direct.conftest import to_hex
from tests.direct.helpers import (
    CONTRACT_PATH,
    REFUND_AT,
    create_market,
    fund,
    mock_resolution,
    semantic_result,
    setup_funded_market,
)


def resolve_yes(contract, vm, creator, yes_account, no_account, yes_amount=100, no_amount=60):
    setup_funded_market(contract, vm, creator, yes_account, no_account, yes_amount, no_amount)
    mock_resolution(vm, semantic_result())
    contract.resolve_market("jideytro-ros1")


def test_winner_claim_moves_pool_liability_to_credit_once(
    direct_vm, direct_deploy, direct_alice, direct_bob, direct_charlie
):
    contract = direct_deploy(CONTRACT_PATH)
    resolve_yes(contract, direct_vm, direct_alice, direct_bob, direct_charlie)

    direct_vm.sender = direct_bob
    amount = contract.claim_credit("jideytro-ros1")

    assert int(amount) == 160
    assert int(contract.get_credit(to_hex(direct_bob))) == 160
    assert contract.get_position("jideytro-ros1", to_hex(direct_bob))["claimed"] is True
    assert contract.get_position("jideytro-ros1", to_hex(direct_bob))["credited_amount"] == "160"
    assert contract.get_market("jideytro-ros1")["remaining_pool"] == "0"
    summary = contract.get_contract_summary()
    assert summary["contract_liability"] == "160"
    assert summary["total_credited"] == "160"

    with direct_vm.expect_revert("Position already claimed"):
        contract.claim_credit("jideytro-ros1")

    direct_vm.sender = direct_charlie
    with direct_vm.expect_revert("Position is not on the winning side"):
        contract.claim_credit("jideytro-ros1")


def test_rounding_dust_is_assigned_to_final_winner(
    direct_vm, direct_deploy, direct_alice, direct_bob, direct_charlie, direct_accounts
):
    direct_dave = direct_accounts[3]
    contract = direct_deploy(CONTRACT_PATH)
    create_market(contract, direct_vm, direct_alice)
    fund(contract, direct_vm, direct_bob, "YES", 2)
    fund(contract, direct_vm, direct_dave, "YES", 1)
    fund(contract, direct_vm, direct_charlie, "NO", 7)
    direct_vm.warp("2026-08-01T00:10:00Z")
    contract.lock_market("jideytro-ros1")
    direct_vm.warp("2026-08-01T00:20:00Z")
    mock_resolution(direct_vm, semantic_result())
    contract.resolve_market("jideytro-ros1")

    direct_vm.sender = direct_bob
    first = contract.claim_credit("jideytro-ros1")
    direct_vm.sender = direct_dave
    last = contract.claim_credit("jideytro-ros1")

    assert int(first) == 6
    assert int(last) == 4
    assert int(first) + int(last) == 10
    assert contract.get_market("jideytro-ros1")["remaining_pool"] == "0"


def test_cancellation_is_time_and_actor_guarded_then_refunds_exact_stakes(
    direct_vm, direct_deploy, direct_alice, direct_bob, direct_charlie, direct_accounts
):
    stranger = direct_accounts[4]
    contract = direct_deploy(CONTRACT_PATH)
    setup_funded_market(contract, direct_vm, direct_alice, direct_bob, direct_charlie)

    direct_vm.sender = direct_alice
    with direct_vm.expect_revert("Refund time has not arrived"):
        contract.cancel_unresolved("jideytro-ros1")

    direct_vm.warp(REFUND_AT)
    direct_vm.sender = stranger
    with direct_vm.expect_revert("Only creator or participant can cancel"):
        contract.cancel_unresolved("jideytro-ros1")

    direct_vm.sender = direct_bob
    contract.cancel_unresolved("jideytro-ros1")
    assert contract.get_market("jideytro-ros1")["status"] == "CANCELLED_REFUND"

    direct_vm.sender = direct_bob
    assert int(contract.claim_credit("jideytro-ros1")) == 100
    direct_vm.sender = direct_charlie
    assert int(contract.claim_credit("jideytro-ros1")) == 60
    assert int(contract.get_credit(to_hex(direct_bob))) == 100
    assert int(contract.get_credit(to_hex(direct_charlie))) == 60
    assert contract.get_market("jideytro-ros1")["remaining_pool"] == "0"


def test_retryable_market_can_be_cancelled_but_cancellation_cannot_repeat(
    direct_vm, direct_deploy, direct_alice, direct_bob, direct_charlie
):
    contract = direct_deploy(CONTRACT_PATH)
    setup_funded_market(contract, direct_vm, direct_alice, direct_bob, direct_charlie)
    mock_resolution(direct_vm, "not-json")
    contract.resolve_market("jideytro-ros1")
    assert contract.get_market("jideytro-ros1")["status"] == "RETRYABLE"

    direct_vm.warp(REFUND_AT)
    direct_vm.sender = direct_alice
    contract.cancel_unresolved("jideytro-ros1")
    assert contract.get_market("jideytro-ros1")["status"] == "CANCELLED_REFUND"

    with direct_vm.expect_revert("Market cannot be cancelled"):
        contract.cancel_unresolved("jideytro-ros1")


def test_withdrawal_debits_before_native_transfer_and_preserves_invariant(
    direct_vm, direct_deploy, direct_alice, direct_bob, direct_charlie
):
    contract = direct_deploy(CONTRACT_PATH)
    resolve_yes(contract, direct_vm, direct_alice, direct_bob, direct_charlie)
    direct_vm.sender = direct_bob
    contract.claim_credit("jideytro-ros1")

    sends = []

    def capture_send(vm, request):
        if "PostMessage" in request:
            message = request["PostMessage"]
            sends.append(message)
            assert int(contract.get_credit(to_hex(direct_bob))) == 120
            assert contract.get_contract_summary()["contract_liability"] == "120"
            contract_address = vm._contract_address
            current_balance = vm._balances.get(bytes(contract_address), 0)
            vm.deal(contract_address, current_balance - int(message["value"]))
            return {"ok": None}
        return None

    direct_vm._gl_call_hook = capture_send
    contract.withdraw_credit(40)

    assert len(sends) == 1
    assert int(sends[0]["value"]) == 40
    assert sends[0]["address"].as_hex == to_hex(direct_bob)
    assert sends[0]["on"] == "finalized"
    summary = contract.get_contract_summary()
    assert summary["total_received"] == "160"
    assert summary["total_withdrawn"] == "40"
    assert summary["contract_liability"] == "120"
    assert int(summary["total_received"]) - int(summary["total_withdrawn"]) == int(summary["contract_liability"])

    with direct_vm.expect_revert("Insufficient credit"):
        contract.withdraw_credit(121)
    with direct_vm.expect_revert("Withdrawal amount must be positive"):
        contract.withdraw_credit(0)
