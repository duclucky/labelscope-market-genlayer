import pytest

from tests.direct.conftest import to_hex
from tests.direct.helpers import (
    APPROVAL_URL,
    CLOSE_AT,
    CONTRACT_PATH,
    NOW,
    REFUND_AT,
    RESOLVE_AT,
    SET_ID,
    create_market,
    fund,
)


def test_create_market_stores_immutable_typed_terms(direct_vm, direct_deploy, direct_alice):
    contract = direct_deploy(CONTRACT_PATH)
    create_market(contract, direct_vm, direct_alice)

    market = contract.get_market("jideytro-ros1")
    assert market["status"] == "OPEN"
    assert market["creator"] == to_hex(direct_alice)
    assert market["application_number"] == "NDA220185"
    assert market["label_set_id"] == SET_ID
    assert market["condition"] == "ROS1-positive non-small cell lung cancer"
    assert market["close_at"] == CLOSE_AT
    assert market["yes_total"] == "0"
    assert contract.get_market_ids() == ["jideytro-ros1"]

    with direct_vm.expect_revert("Market already exists"):
        create_market(contract, direct_vm, direct_alice)


@pytest.mark.parametrize("market_id", ["", "abc", "UPPERCASE", "contains space", "bad:colon", "x" * 65])
def test_invalid_market_ids_are_rejected(market_id, direct_vm, direct_deploy, direct_alice):
    contract = direct_deploy(CONTRACT_PATH)
    direct_vm.sender = direct_alice
    direct_vm.warp(NOW)
    with direct_vm.expect_revert("Market ID"):
        contract.create_market(
            market_id,
            "A sufficiently precise FDA label market question",
            "ONCOLOGY",
            "Jideytro",
            "NDA220185",
            SET_ID,
            "20260722",
            APPROVAL_URL,
            "condition",
            "biomarker",
            "population",
            "stage",
            "prior therapy",
            "NOT_REQUIRED",
            "FDA approval",
            CLOSE_AT,
            RESOLVE_AT,
            REFUND_AT,
        )


def test_source_and_time_guards_fail_closed(direct_vm, direct_deploy, direct_alice):
    contract = direct_deploy(CONTRACT_PATH)
    direct_vm.sender = direct_alice
    direct_vm.warp(NOW)
    base = [
        "guarded-market",
        "A sufficiently precise FDA label market question",
        "ONCOLOGY",
        "Jideytro",
        "NDA220185",
        SET_ID,
        "20260722",
        APPROVAL_URL,
        "condition",
        "biomarker",
        "population",
        "stage",
        "prior therapy",
        "NOT_REQUIRED",
        "FDA approval",
        CLOSE_AT,
        RESOLVE_AT,
        REFUND_AT,
    ]

    bad_url = list(base)
    bad_url[7] = "https://example.com/fake-label"
    with direct_vm.expect_revert("FDA approval URL"):
        contract.create_market(*bad_url)

    bad_order = list(base)
    bad_order[15] = RESOLVE_AT
    bad_order[16] = CLOSE_AT
    with direct_vm.expect_revert("Resolution gap"):
        contract.create_market(*bad_order)

    bad_refund = list(base)
    bad_refund[17] = RESOLVE_AT
    with direct_vm.expect_revert("Refund gap"):
        contract.create_market(*bad_refund)


@pytest.mark.parametrize("effective_time", ["20250230", "20251301", "00000000"])
def test_label_effective_time_must_be_a_real_calendar_date(
    effective_time, direct_vm, direct_deploy, direct_alice
):
    contract = direct_deploy(CONTRACT_PATH)
    direct_vm.sender = direct_alice
    direct_vm.warp(NOW)
    with direct_vm.expect_revert("Label effective time must be a real YYYYMMDD date"):
        contract.create_market(
            "invalid-date",
            "A sufficiently precise FDA label market question",
            "ONCOLOGY",
            "Jideytro",
            "NDA220185",
            SET_ID,
            effective_time,
            APPROVAL_URL,
            "condition",
            "biomarker",
            "population",
            "stage",
            "prior therapy",
            "NOT_REQUIRED",
            "FDA approval",
            CLOSE_AT,
            RESOLVE_AT,
            REFUND_AT,
        )


@pytest.mark.parametrize(
    ("close_at", "resolve_at", "refund_at", "message"),
    [
        ("2026-08-01T00:00:20Z", RESOLVE_AT, REFUND_AT, "Funding window is too short"),
        (CLOSE_AT, "2026-08-01T00:10:20Z", REFUND_AT, "Resolution gap is too short"),
        (CLOSE_AT, RESOLVE_AT, "2026-08-01T00:21:00Z", "Refund gap is too short"),
        (CLOSE_AT, RESOLVE_AT, "2026-09-01T00:00:01Z", "Market horizon is too long"),
    ],
)
def test_market_windows_have_explicit_minimums_and_bounded_horizon(
    close_at, resolve_at, refund_at, message, direct_vm, direct_deploy, direct_alice
):
    contract = direct_deploy(CONTRACT_PATH)
    direct_vm.sender = direct_alice
    direct_vm.warp(NOW)
    with direct_vm.expect_revert(message):
        contract.create_market(
            "bounded-window",
            "A sufficiently precise FDA label market question",
            "ONCOLOGY",
            "Jideytro",
            "NDA220185",
            SET_ID,
            "20260722",
            APPROVAL_URL,
            "condition",
            "biomarker",
            "population",
            "stage",
            "prior therapy",
            "NOT_REQUIRED",
            "FDA approval",
            close_at,
            resolve_at,
            refund_at,
        )


def test_funding_is_isolated_and_account_side_is_locked(
    direct_vm, direct_deploy, direct_alice, direct_bob, direct_charlie
):
    contract = direct_deploy(CONTRACT_PATH)
    create_market(contract, direct_vm, direct_alice, "market-one")
    create_market(contract, direct_vm, direct_alice, "market-two")

    fund(contract, direct_vm, direct_bob, "YES", 100, "market-one")
    fund(contract, direct_vm, direct_bob, "YES", 40, "market-one")
    fund(contract, direct_vm, direct_charlie, "NO", 60, "market-one")
    fund(contract, direct_vm, direct_bob, "NO", 25, "market-two")

    one = contract.get_market("market-one")
    two = contract.get_market("market-two")
    assert one["yes_total"] == "140"
    assert one["no_total"] == "60"
    assert two["yes_total"] == "0"
    assert two["no_total"] == "25"
    assert contract.get_position("market-one", to_hex(direct_bob))["stake"] == "140"
    assert contract.get_account_market_ids(to_hex(direct_bob)) == ["market-one", "market-two"]

    direct_vm.sender = direct_bob
    direct_vm.value = 1
    with direct_vm.expect_revert("Position side is already locked"):
        contract.fund_position("market-one", "NO")


def test_funding_requires_open_market_time_side_and_positive_value(
    direct_vm, direct_deploy, direct_alice, direct_bob
):
    contract = direct_deploy(CONTRACT_PATH)
    create_market(contract, direct_vm, direct_alice)
    direct_vm.sender = direct_bob

    direct_vm.value = 0
    with direct_vm.expect_revert("Funding value must be positive"):
        contract.fund_position("jideytro-ros1", "YES")

    direct_vm.value = 10
    with direct_vm.expect_revert("Side must be YES or NO"):
        contract.fund_position("jideytro-ros1", "MAYBE")

    direct_vm.warp(CLOSE_AT)
    with direct_vm.expect_revert("Funding is closed"):
        contract.fund_position("jideytro-ros1", "YES")


def test_lock_transition_enforces_close_time(direct_vm, direct_deploy, direct_alice):
    contract = direct_deploy(CONTRACT_PATH)
    create_market(contract, direct_vm, direct_alice)

    with direct_vm.expect_revert("Funding close time has not arrived"):
        contract.lock_market("jideytro-ros1")

    direct_vm.warp(CLOSE_AT)
    contract.lock_market("jideytro-ros1")
    assert contract.get_market("jideytro-ros1")["status"] == "LOCKED"
    with direct_vm.expect_revert("Market is not open"):
        contract.lock_market("jideytro-ros1")
