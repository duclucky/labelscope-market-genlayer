"""Safe, shape-tolerant receipt projection for deployment evidence."""


def _text_status(value):
    if isinstance(value, str):
        return value
    if isinstance(value, dict):
        for key in ("status", "result", "execution_result"):
            nested = value.get(key)
            if isinstance(nested, str):
                return nested
    return ""


def safe_receipt_summary(receipt: dict) -> dict:
    """Return only public deployment fields from raw Studio or normalized receipts."""
    if not isinstance(receipt, dict):
        raise ValueError("Receipt must be an object")

    leader = {}
    consensus = receipt.get("consensus_data")
    if isinstance(consensus, dict):
        receipts = consensus.get("leader_receipt")
        if isinstance(receipts, list) and receipts and isinstance(receipts[0], dict):
            leader = receipts[0]
        elif isinstance(receipts, dict):
            leader = receipts

    decoded = receipt.get("txDataDecoded")
    if not isinstance(decoded, dict):
        decoded = {}
    data = receipt.get("data")
    if not isinstance(data, dict):
        data = {}

    tx_hash = (
        receipt.get("transaction_hash")
        or receipt.get("hash")
        or receipt.get("tx_hash")
        or receipt.get("txId")
        or ""
    )
    status = _text_status(receipt.get("status")) or _text_status(receipt.get("statusName"))
    execution_result = _text_status(receipt.get("execution_result")) or _text_status(
        receipt.get("txExecutionResultName")
    )
    if not execution_result:
        execution_result = _text_status(leader.get("execution_result"))
    contract_address = (
        receipt.get("contract_address")
        or receipt.get("deployed_contract_address")
        or decoded.get("contractAddress")
        or data.get("contract_address")
        or data.get("contractAddress")
        or leader.get("contract_address")
        or leader.get("deployed_contract_address")
        or ""
    )

    return {
        "tx_hash": str(tx_hash),
        "status": status,
        "execution_result": execution_result,
        "contract_address": str(contract_address),
    }
