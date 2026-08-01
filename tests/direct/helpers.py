from tests.direct.conftest import to_hex


CONTRACT_PATH = "contracts/labelscope_market.py"
NOW = "2026-08-01T00:00:00Z"
CLOSE_AT = "2026-08-01T00:10:00Z"
RESOLVE_AT = "2026-08-01T00:20:00Z"
REFUND_AT = "2026-08-01T01:20:00Z"
SET_ID = "3760e421-b523-4d9b-e063-6394a90ab94b"
APPROVAL_URL = "https://www.fda.gov/drugs/resources-information-approved-drugs/fda-approves-zidesamtinib-ros1-positive-non-small-cell-lung-cancer"


def create_market(contract, vm, creator, market_id="jideytro-ros1"):
    vm.sender = creator
    vm.value = 0
    vm.warp(NOW)
    contract.create_market(
        market_id,
        "Will the FDA label match the locked ROS1 NSCLC scope?",
        "ONCOLOGY",
        "Jideytro (zidesamtinib)",
        "NDA220185",
        SET_ID,
        "20260722",
        APPROVAL_URL,
        "ROS1-positive non-small cell lung cancer",
        "ROS1-positive",
        "adults",
        "locally advanced or metastatic",
        "at least one prior ROS1 tyrosine kinase inhibitor",
        "NOT_REQUIRED",
        "FDA approval",
        CLOSE_AT,
        RESOLVE_AT,
        REFUND_AT,
    )


def fund(contract, vm, account, side, amount, market_id="jideytro-ros1"):
    vm.sender = account
    vm.value = amount
    contract.fund_position(market_id, side)
    contract_address = vm._contract_address
    current_balance = vm._balances.get(bytes(contract_address), 0)
    vm.deal(contract_address, current_balance + amount)
    vm.value = 0


def position_key(market_id, account):
    return market_id + "|" + to_hex(account).lower()


FDA_APPROVAL_TEXT = (
    "FDA approved Jideytro (zidesamtinib) for adults with locally advanced or "
    "metastatic ROS1-positive non-small cell lung cancer after at least one "
    "prior ROS1 tyrosine kinase inhibitor."
)


def openfda_label_text():
    return (
        '{"results":[{"set_id":"'
        + SET_ID
        + '","effective_time":"20260722","openfda":{"application_number":["NDA220185"]},'
        + '"indications_and_usage":["Jideytro is indicated for adults with locally advanced or metastatic '
        + 'ROS1-positive non-small cell lung cancer after a prior ROS1 TKI. Accelerated approval."]}]}'
    )


def semantic_result(**overrides):
    result = {
        "condition": "MATCH",
        "biomarker": "MATCH",
        "population": "MATCH",
        "disease_stage": "MATCH",
        "prior_therapy": "MATCH",
        "combination_requirement": "NOT_REQUIRED",
        "approval_class": "MATCH",
        "source_consistency": "CONSISTENT",
    }
    result.update(overrides)
    return result


def mock_resolution(vm, result, approval_status=200, label_status=200, approval_body=FDA_APPROVAL_TEXT, label_body=None):
    import json

    vm.mock_web(
        r".*www\.fda\.gov/drugs/resources-information-approved-drugs/.*",
        {"method": "GET", "status": approval_status, "body": approval_body},
    )
    vm.mock_web(
        r".*api\.fda\.gov/drug/label\.json.*",
        {"method": "GET", "status": label_status, "body": openfda_label_text() if label_body is None else label_body},
    )
    vm.mock_llm(
        r"(?s).*LabelScope FDA semantic adjudicator.*",
        result if isinstance(result, str) else json.dumps(result),
    )


def setup_funded_market(contract, vm, creator, yes_account, no_account, yes_amount=100, no_amount=60, market_id="jideytro-ros1"):
    create_market(contract, vm, creator, market_id)
    fund(contract, vm, yes_account, "YES", yes_amount, market_id)
    fund(contract, vm, no_account, "NO", no_amount, market_id)
    vm.warp(CLOSE_AT)
    vm.sender = creator
    contract.lock_market(market_id)
    vm.warp(RESOLVE_AT)
