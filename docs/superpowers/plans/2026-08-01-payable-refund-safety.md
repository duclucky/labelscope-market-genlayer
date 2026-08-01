# Payable Refund Safety Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deploy and prove a frozen `LabelScopeMarket` revision in which every positive deterministic rejection from `fund_position` becomes sender-owned withdrawable credit instead of unaccounted contract surplus.

**Architecture:** Keep the existing one-contract architecture and add a deterministic credit-on-rejection transition inside the payable entrypoint. Normalize the bounded funding return in the existing frontend finality layer, then extend the resumable Studionet script with an exact one-time retirement exception and a rejection/withdrawal proof before the normal lifecycle.

**Tech Stack:** Python 3.12, pinned `py-genlayer`, `gltest`, Node.js, `genlayer-js@1.1.8`, React 19, TypeScript, Vitest, Vite, Studionet chain 61999, Vercel.

## Global Constraints

- Keep exactly one frozen contract; do not add an administrator, upgrader, sweep, or second contract.
- Preserve the existing frontend design and information hierarchy.
- Positive deterministic rejection returns `{accepted, reason, received, credited_refund}` and creates full sender credit without market allocation.
- Zero-value funding continues to raise `Funding value must be positive` without changing accounting.
- Preserve `total_received - total_withdrawn = contract_liability` after every completed method.
- Never expose private keys, complete receipts, validator configuration, `.env` values, or raw RPC payloads.
- Preserve the current unstaged edits in `docs/SUBMISSION.md` and `docs/evidence/studionet/browser-wallet.json` until the evidence task reconciles them.
- Run `npm run check` after contract, test, deployment-script, or frontend changes.
- Do not treat local results as Studionet evidence and do not click the final submission button.

---

### Task 1: Contract credit on payable rejection

**Files:**
- Create: `tests/direct/test_payable_refund_safety.py`
- Modify: `tests/direct/test_market_state.py`
- Modify: `contracts/labelscope_market.py`

**Interfaces:**
- Consumes: existing account credit and aggregate accounting storage.
- Produces: `fund_position(market_id: str, side: str) -> dict` with exactly `accepted: bool`, `reason: str`, `received: str`, and `credited_refund: str`.

- [ ] **Step 1: Write failing rejection and accounting tests**

Create focused tests with this shared call/assertion shape, then instantiate it for `MARKET_NOT_FOUND`, `MARKET_NOT_OPEN`, `FUNDING_CLOSED`, `INVALID_SIDE`, and `SIDE_LOCKED`:

```python
from tests.direct.conftest import to_hex
from tests.direct.helpers import CLOSE_AT, CONTRACT_PATH, create_market, fund


def reject(contract, vm, sender, market_id, side, amount):
    vm.sender = sender
    vm.value = amount
    result = contract.fund_position(market_id, side)
    address = vm._contract_address
    vm.deal(address, vm._balances.get(bytes(address), 0) + amount)
    vm.value = 0
    return result


def assert_rejected(contract, account, result, reason, amount):
    assert result == {
        "accepted": False,
        "reason": reason,
        "received": str(amount),
        "credited_refund": str(amount),
    }
    assert contract.get_credit(to_hex(account)) == str(amount)
    summary = contract.get_contract_summary()
    assert summary["total_received"] == str(amount)
    assert summary["total_credited"] == str(amount)
    assert summary["contract_liability"] == str(amount)
    assert int(summary["total_received"]) - int(summary["total_withdrawn"]) == int(summary["contract_liability"])


def test_missing_market_value_becomes_credit(direct_vm, direct_deploy, direct_bob):
    contract = direct_deploy(CONTRACT_PATH)
    result = reject(contract, direct_vm, direct_bob, "missing-market", "YES", 11)
    assert_rejected(contract, direct_bob, result, "MARKET_NOT_FOUND", 11)
    assert contract.get_account_market_ids(to_hex(direct_bob)) == []


def test_rejected_credit_is_isolated_withdrawable_and_not_repeatable(
    direct_vm, direct_deploy, direct_bob, direct_charlie
):
    contract = direct_deploy(CONTRACT_PATH)
    reject(contract, direct_vm, direct_bob, "missing-market", "YES", 9)
    assert contract.get_credit(to_hex(direct_charlie)) == "0"
    sends = []
    def capture(vm, request):
        if "EthSend" in request:
            sends.append(request["EthSend"])
            return {"ok": None}
        return None
    direct_vm._gl_call_hook = capture
    direct_vm.sender = direct_bob
    contract.withdraw_credit(9)
    assert int(sends[0]["value"]) == 9
    assert contract.get_credit(to_hex(direct_bob)) == "0"
    assert contract.get_contract_summary()["contract_liability"] == "0"
    with direct_vm.expect_revert("Insufficient credit"):
        contract.withdraw_credit(9)
```

For each market-specific case, assert pool, position, and account-market index remain unchanged. Update old tests so only zero value expects a revert; positive invalid calls assert the new result and credit.

- [ ] **Step 2: Run the focused tests and prove red state**

```powershell
$env:PYTHONUTF8='1'
.venv\Scripts\python.exe -m pytest tests/direct/test_payable_refund_safety.py tests/direct/test_market_state.py -v
```

Expected: new positive-rejection tests fail because the current contract raises or returns `None`; unrelated state tests pass.

- [ ] **Step 3: Implement the minimal ordered transition**

Add two private helpers and replace the payable method:

```python
    def _funding_result(self, accepted: bool, reason: str, received: bigint, credited_refund: bigint) -> dict:
        return {
            "accepted": accepted,
            "reason": reason,
            "received": str(int(received)),
            "credited_refund": str(int(credited_refund)),
        }

    def _credit_funding_rejection(self, sender: Address, received: bigint, reason: str) -> dict:
        account_key = _addr_str(sender)
        current = self.credits.get(account_key, bigint(0))
        self.credits[account_key] = bigint(int(current) + int(received))
        self.total_received = bigint(int(self.total_received) + int(received))
        self.total_credited = bigint(int(self.total_credited) + int(received))
        self.contract_liability = bigint(int(self.contract_liability) + int(received))
        return self._funding_result(False, reason, received, received)

    @gl.public.write.payable
    def fund_position(self, market_id: str, side: str) -> dict:
        received = bigint(int(gl.message.value))
        if int(received) <= 0:
            raise gl.vm.UserError("Funding value must be positive")
        sender = gl.message.sender_address
        if market_id not in self.markets:
            return self._credit_funding_rejection(sender, received, "MARKET_NOT_FOUND")
        market = self.markets[market_id]
        if market.status != "OPEN":
            return self._credit_funding_rejection(sender, received, "MARKET_NOT_OPEN")
        if _now() >= _parse_utc(market.close_at):
            return self._credit_funding_rejection(sender, received, "FUNDING_CLOSED")
        if side not in SIDES:
            return self._credit_funding_rejection(sender, received, "INVALID_SIDE")
        key = _position_key(market_id, sender)
        if key in self.positions and self.positions[key].side != side:
            return self._credit_funding_rejection(sender, received, "SIDE_LOCKED")
        if key in self.positions:
            self.positions[key].stake = bigint(int(self.positions[key].stake) + int(received))
        else:
            self.positions[key] = Position(
                market_id=market_id,
                owner=sender,
                side=side,
                stake=received,
                claimed=False,
                credited_amount=bigint(0),
            )
        if side == "YES":
            market.yes_total = bigint(int(market.yes_total) + int(received))
        else:
            market.no_total = bigint(int(market.no_total) + int(received))
        market.total_pool = bigint(int(market.total_pool) + int(received))
        self.total_received = bigint(int(self.total_received) + int(received))
        self.contract_liability = bigint(int(self.contract_liability) + int(received))
        return self._funding_result(True, "ACCEPTED", received, bigint(0))
```

- [ ] **Step 4: Verify and commit the contract slice**

```powershell
npm run lint:contract
npm run test:direct
git add -- contracts/labelscope_market.py tests/direct/test_payable_refund_safety.py tests/direct/test_market_state.py
git diff --cached --check
git commit -m "Protect payable funding rejections with credits"
```

Expected: lint and all direct tests pass; the commit contains exactly the three listed paths.

---

### Task 2: Frontend return normalization and user copy

**Files:**
- Modify: `frontend/labelscope/src/lib/contract.ts`
- Modify: `frontend/labelscope/src/lib/contract.test.ts`
- Modify: `frontend/labelscope/src/App.tsx`

**Interfaces:**
- Consumes: finalized `leader_receipt.result` encoded by GenVM.
- Produces: `fundingResultFromReceipt(receipt) -> FundingResult | null` and an optional finalized phase message.

- [ ] **Step 1: Write failing wire-format tests**

Use the real SDK encoder so the fixture matches GenVM return bytes:

```typescript
function returned(value: unknown): string {
  const payload = abi.calldata.encode(value as never);
  const bytes = new Uint8Array(payload.length + 1);
  bytes[0] = 0;
  bytes.set(payload, 1);
  return btoa(String.fromCharCode(...bytes));
}

it('normalizes a credited funding rejection', () => {
  expect(fundingResultFromReceipt({ consensus_data: { leader_receipt: [{
    execution_result: 'SUCCESS',
    result: returned({ accepted: false, reason: 'MARKET_NOT_FOUND', received: '1000', credited_refund: '1000' }),
  }] } })).toEqual({ accepted: false, reason: 'MARKET_NOT_FOUND', received: '1000', credited_refund: '1000' });
});
```

Add a `submitAndFinalize` test whose finalized receipt contains `SIDE_LOCKED`; assert the last phase says the stake was not added and the full amount is withdrawable. Add a legacy receipt without `result`; assert it keeps the generic final message.

- [ ] **Step 2: Run the test and prove red state**

```powershell
npm --workspace frontend/labelscope run test -- src/lib/contract.test.ts
```

Expected: failure because the return normalizer and contract-aware final message do not exist.

- [ ] **Step 3: Decode strictly and attach user-facing finalization copy**

Import `abi`, extend the minimal leader type with `result?: unknown`, and add:

```typescript
export interface FundingResult {
  accepted: boolean;
  reason: 'ACCEPTED' | 'MARKET_NOT_FOUND' | 'MARKET_NOT_OPEN' | 'FUNDING_CLOSED' | 'INVALID_SIDE' | 'SIDE_LOCKED';
  received: string;
  credited_refund: string;
}

export function fundingResultFromReceipt(receipt: MinimalReceipt): FundingResult | null {
  const leaders = receipt.consensus_data?.leader_receipt;
  const leader = Array.isArray(leaders) ? leaders[0] : leaders;
  if (!leader || typeof leader.result !== 'string') return null;
  try {
    const bytes = Uint8Array.from(atob(leader.result), (character) => character.charCodeAt(0));
    if (bytes[0] !== 0) return null;
    const value = abi.calldata.decode(bytes.slice(1));
    if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
    const record = value as Record<string, unknown>;
    const reasons = ['ACCEPTED', 'MARKET_NOT_FOUND', 'MARKET_NOT_OPEN', 'FUNDING_CLOSED', 'INVALID_SIDE', 'SIDE_LOCKED'];
    if (typeof record.accepted !== 'boolean' || !reasons.includes(String(record.reason))) return null;
    if (!/^\d+$/.test(String(record.received)) || !/^\d+$/.test(String(record.credited_refund))) return null;
    return { accepted: record.accepted, reason: String(record.reason) as FundingResult['reason'], received: String(record.received), credited_refund: String(record.credited_refund) };
  } catch {
    return null;
  }
}
```

After canonical reload, emit:

```typescript
const funding = options.request.functionName === 'fund_position' ? fundingResultFromReceipt(finalized) : null;
options.onPhase({
  status: 'finalized',
  hash,
  message: funding && !funding.accepted
    ? 'Stake was not added. The full amount is available to withdraw from your contract credit.'
    : undefined,
});
```

In `App.tsx`, change the finalized text to `transaction.message || 'Finalized. Canonical contract state has been refreshed.'`.

- [ ] **Step 4: Verify and commit the frontend slice**

```powershell
npm run test:frontend
npm --workspace frontend/labelscope run typecheck
npm run build:frontend
git add -- frontend/labelscope/src/lib/contract.ts frontend/labelscope/src/lib/contract.test.ts frontend/labelscope/src/App.tsx
git diff --cached --check
git commit -m "Explain credited funding rejections in the app"
```

Expected: frontend tests, TypeScript, and production build pass; only the three listed paths are committed.

---

### Task 3: Retirement guard and Studionet rejection automation

**Files:**
- Modify: `scripts/studionet.mjs`
- Modify: `tests/studionet_script.test.mjs`
- Modify: `package.json`

**Interfaces:**
- Consumes: active deployment evidence, canonical summary, contract balance, finalized leader result, and withdrawal child IDs.
- Produces: `archive-known-surplus`, `decodeGenVmReturn`, `assertFundingRejection`, and resumable `refundSafety` evidence.

- [ ] **Step 1: Write failing bounded-exception and rejection-proof tests**

Encode return fixtures with `abi.calldata.encode` and add:

```javascript
test('only the documented frozen revision can use the exact surplus exception', () => {
  const known = {
    address: '0x9F623cd3703c76E123aD561630A6B72364559f5E',
    balanceWei: '1000000000000000',
    transactionHash: '0x7de4bed03104b02cae321d7a1e991125448b613eae2e9660cca460d6b68851bb',
  };
  assert.doesNotThrow(() => assertArchivable({ contract_liability: '0' }, 1000000000000000n, known, known.address));
  assert.throws(() => assertArchivable({ contract_liability: '0' }, 2n, known, known.address), /exact documented surplus/);
  assert.throws(() => assertArchivable({ contract_liability: '0' }, 1000000000000000n, known, '0x1111111111111111111111111111111111111111'), /revision/);
});

test('rejection proof requires the bounded full-credit result', () => {
  const receipt = receiptWithReturn({ accepted: false, reason: 'MARKET_NOT_FOUND', received: '1000', credited_refund: '1000' });
  assert.equal(assertFundingRejection(receipt, 1000n).credited_refund, '1000');
  assert.throws(
    () => assertFundingRejection(receiptWithReturn({ accepted: true, reason: 'ACCEPTED', received: '1000', credited_refund: '0' }), 1000n),
    /rejection proof/,
  );
});
```

- [ ] **Step 2: Run script tests and prove red state**

```powershell
node --test tests/studionet_script.test.mjs
```

Expected: failure because the exception arguments and funding-return helpers are absent.

- [ ] **Step 3: Implement exact retirement exception and return decoder**

Import `abi` and add:

```javascript
export const KNOWN_UNRECOVERABLE_SURPLUS = Object.freeze({
  address: '0x9F623cd3703c76E123aD561630A6B72364559f5E',
  balanceWei: '1000000000000000',
  transactionHash: '0x7de4bed03104b02cae321d7a1e991125448b613eae2e9660cca460d6b68851bb',
});

export function assertArchivable(summary, balance, exception = null, address = '') {
  if (String(summary?.contract_liability ?? '') !== '0') {
    throw new Error('Cannot archive a deployment with nonzero canonical liability.');
  }
  if (BigInt(balance) === 0n) return;
  if (!exception || address.toLowerCase() !== exception.address.toLowerCase()) {
    throw new Error('Cannot archive a nonzero balance outside the documented frozen revision.');
  }
  if (BigInt(balance) !== BigInt(exception.balanceWei)) {
    throw new Error('Contract balance does not match the exact documented surplus.');
  }
}

export function decodeGenVmReturn(receipt) {
  const leaders = receipt?.consensus_data?.leader_receipt;
  const leader = Array.isArray(leaders) ? leaders[0] : leaders;
  if (!leader || typeof leader.result !== 'string') return null;
  const bytes = Uint8Array.from(Buffer.from(leader.result, 'base64'));
  if (bytes[0] !== 0) return null;
  return abi.calldata.decode(bytes.subarray(1));
}

export function assertFundingRejection(receipt, expectedValue) {
  const result = decodeGenVmReturn(receipt);
  if (!result || result.accepted !== false || result.reason !== 'MARKET_NOT_FOUND') {
    throw new Error('Finalized call does not prove the expected funding rejection proof.');
  }
  if (BigInt(result.received) !== expectedValue || BigInt(result.credited_refund) !== expectedValue) {
    throw new Error('Funding rejection did not preserve the full received value as credit.');
  }
  return result;
}
```

Change `archiveSuperseded(exception = null)` to pass the active address to `assertArchivable`. With the exception, archive as `SUPERSEDED_UNRECOVERABLE_TEST_SURPLUS` and record its exact transaction, summary, balance, and immutable limitation. Default archiving still requires zero balance.

Add:

```javascript
if (command === 'archive-known-surplus') return archiveSuperseded(KNOWN_UNRECOVERABLE_SURPLUS);
```

and package script:

```json
"studionet:archive-known-surplus": "node scripts/studionet.mjs archive-known-surplus"
```

- [ ] **Step 4: Add resumable rejection and withdrawal proof before market creation**

Before the valid lifecycle market is created, submit one missing-market funding call, assert its return, read the exact credit delta, withdraw `STAKE`, and prove every triggered child:

```javascript
if (!state.refundSafety?.completedAt) {
  const invalidMarketId = `missing-${address.toLowerCase().slice(2, 10)}`;
  const before = BigInt(await read.readContract({ address, functionName: 'get_credit', args: [primary.address], jsonSafeReturn: true }));
  const receipt = await sendAndRecord({
    read, client: primaryClient, actor: primary, address,
    action: 'reject_missing_market', functionName: 'fund_position',
    args: [invalidMarketId, 'YES'], value: STAKE, state,
  });
  const fundingResult = assertFundingRejection(receipt, STAKE);
  const credited = BigInt(await read.readContract({ address, functionName: 'get_credit', args: [primary.address], jsonSafeReturn: true }));
  if (credited !== before + STAKE) throw new Error('Canonical refund credit does not match rejected value.');
  state.refundSafety = { invalidMarketId, fundingResult, creditAfterRejectWei: credited.toString() };
  writeJson(LIFECYCLE_PATH, state);
  const parent = await sendAndRecord({
    read, client: primaryClient, actor: primary, address,
    action: 'withdraw_rejected_credit', functionName: 'withdraw_credit', args: [STAKE], state,
  });
  const parentHash = String(parent.hash ?? parent.txId ?? '');
  const childIds = await waitForTriggeredTransactions(read, parentHash);
  const children = [];
  for (const hash of childIds) {
    const child = await waitExternalFinalized(read, hash, { sender: address, recipient: primary.address, value: STAKE });
    children.push({ txHash: hash, explorer: explorerTx(hash), status: child.statusName ?? String(child.status ?? ''), executionResult: executionResultFromReceipt(child), sender: child.sender ?? child.from_address ?? '', recipient: child.recipient ?? child.to_address ?? '', valueWei: String(child.value ?? '') });
  }
  const after = await read.readContract({ address, functionName: 'get_credit', args: [primary.address], jsonSafeReturn: true });
  if (BigInt(after) !== before) throw new Error('Rejected-value credit was not fully withdrawn.');
  Object.assign(state.refundSafety, { parentTxHash: parentHash, children, creditAfterWithdrawWei: String(after), completedAt: nowIso() });
  writeJson(LIFECYCLE_PATH, state);
}
```

Before resubmitting after interruption, reconcile the recorded `reject_missing_market` and `withdraw_rejected_credit` hashes. Extract the existing child-proof loop into `async function proveExternalTransfer(read, parentHash, expected)` returning the allowlisted child-evidence array, and use it for both rejection-credit and winner-credit withdrawals so they share the same finalized sender, recipient, and value checks.

- [ ] **Step 5: Verify and commit the script slice**

```powershell
node --test tests/studionet_script.test.mjs
npm run test:deployment
git add -- scripts/studionet.mjs tests/studionet_script.test.mjs package.json
git diff --cached --check
git commit -m "Prove rejected value recovery on Studionet"
```

Expected: deployment tests pass and exactly the three listed paths are committed.

---

### Task 4: Mandatory local verification checkpoint

**Files:**
- Verify only; no source file should change.

**Interfaces:**
- Consumes: Tasks 1–3.
- Produces: clean local evidence bound to committed source before deployment.

- [ ] **Step 1: Run the full project check**

```powershell
npm run check
```

Expected: GenVM lint, direct tests, deployment tests, frontend tests, TypeScript, and production build all exit successfully.

- [ ] **Step 2: Review diff and public-repository hygiene**

```powershell
git diff 68072cee8bc15ab86b9eb23fbf55d6febaf523fe..HEAD --check
git diff --stat 68072cee8bc15ab86b9eb23fbf55d6febaf523fe..HEAD
git status --short
git ls-files | rg "(^|/)(\.env|AGENTS\.md|MASTER-PROMPT|GENLAYER-PROJECT-PLAYBOOK|\.codex)(/|$)"
```

Expected: no whitespace error, only intended implementation paths differ, the two known documentation/evidence edits remain unstaged, and the tracked control/secret scan returns no matches.

---

### Task 5: Archive, deploy, and prove the new Studionet revision

**Files:**
- Create: `docs/evidence/studionet/archive/0x9f623cd3703c76e123ad561630a6b72364559f5e/deployment.json`
- Archive through script: old `docs/evidence/studionet/lifecycle.json`
- Replace through script: `docs/evidence/studionet/deployment.json`
- Replace through script: `docs/evidence/studionet/lifecycle.json`

**Interfaces:**
- Consumes: authorized ignored environment, exact committed source, and explicit known-surplus command.
- Produces: one active deployment, rejection/refund proof, valid lifecycle, and zero final liability/unexplained balance.

- [ ] **Step 1: Inspect current public network identity**

```powershell
npm run studionet:inspect
```

Expected: public output identifies the old address and zero canonical liability without exposing a key or raw receipt.

- [ ] **Step 2: Archive only the exact frozen old revision**

```powershell
npm run studionet:archive-known-surplus
```

Expected: archive status is `SUPERSEDED_UNRECOVERABLE_TEST_SURPLUS`, balance is exactly `1000000000000000`, the invalid transaction is recorded, and active evidence paths are ready for replacement.

- [ ] **Step 3: Deploy the committed safe source**

```powershell
npm run studionet:deploy
```

Expected: deployment finalizes successfully and `deployment.json` binds address, transaction, source commit, source hash, Depends runner, SDK, and zeroed canonical summary.

- [ ] **Step 4: Run the resumable rejection proof and valid lifecycle**

```powershell
npm run studionet:lifecycle
```

Expected: missing-market funding finalizes successfully and creates exact credit; its withdrawal child finalizes with bound sender, recipient, and value; then two signers create, fund, lock, resolve, claim, and withdraw a valid market. If authoritative evidence yields `RETRYABLE`, inspect the bounded source stage and rerun only when it is transient; always read the dynamic attempt count.

- [ ] **Step 5: Verify canonical cleanup and evidence allowlist**

```powershell
npm run studionet:inspect
rg -n "node_config|privateKey|seed|mnemonic" docs/evidence/studionet -g "*.json"
```

Expected: new liability and account credits are zero after withdrawals, the new native balance has no unexplained surplus, and the sensitive-field scan returns no matches.

---

### Task 6: Promote frontend, exercise Chrome wallet, and finalize public evidence

**Files:**
- Modify ignored local: `frontend/labelscope/.env`
- Modify ignored local: `frontend/labelscope/.env.local`
- Modify: `docs/evidence/studionet/browser-wallet.json`
- Modify: `docs/evidence/studionet/README.md`
- Modify: `docs/README.md`
- Modify: `docs/SUBMISSION.md`
- Modify: `README.md`
- Modify: `frontend/labelscope/README.md`

**Interfaces:**
- Consumes: new active address and network evidence.
- Produces: production app on the new address, real wallet evidence, exact submission fields, pushed commits, and successful CI.

- [ ] **Step 1: Update only the public frontend address and build**

Set `VITE_CONTRACT_ADDRESS` in ignored frontend environment files to `deployment.json.address`; add no secret. Run:

```powershell
npm run build:frontend
```

Expected: Vite builds with the new 40-hex address and no private value appears in tracked files or output.

- [ ] **Step 2: Deploy the linked Vercel project to production**

Update the production `VITE_CONTRACT_ADDRESS` through the existing authenticated Vercel project, then run from `frontend/labelscope`:

```powershell
npx vercel --prod --yes
```

Expected: production deploy succeeds and `https://labelscope-market-genlayer.vercel.app` returns HTTP 200 with the new active address.

- [ ] **Step 3: Exercise every currently available product action in connected Chrome**

At the production URL, verify wallet restoration/network, discovery, search, market detail, create, valid funding, close, resolve or retry, cancellation when eligible, claim, withdraw, transaction links, wallet rejection handling when reachable, and canonical refresh. Record only public hashes, statuses, addresses, values, canonical state, and child proof. No technical-only action is added to the product UI.

Expected: every offered action either finalizes and refreshes canonical state or shows the correct failure/retry state; no balance, signature, gas, or finality is simulated.

- [ ] **Step 4: Reconcile public documentation with exact evidence**

Update the listed files with the new active address/explorer, archived-address limitation, exact fresh test counts, rejection and lifecycle links, production URL, source commit, successful CI link, and distinct browser-wallet versus script-signed labels. Keep the English submission description within the portal limit and do not claim the old `0.001 GEN` was recovered.

- [ ] **Step 5: Run verification-before-completion checks**

```powershell
npm run check
git diff --check
git status --short
git diff --name-status
git ls-files | rg "(^|/)(\.env|AGENTS\.md|MASTER-PROMPT|GENLAYER-PROJECT-PLAYBOOK|\.codex)(/|$)"
```

Expected: full check passes; only intended public evidence/docs remain; the tracked control/secret scan returns no matches.

- [ ] **Step 6: Commit, push, and verify CI**

```powershell
git add -- README.md frontend/labelscope/README.md docs/README.md docs/SUBMISSION.md docs/evidence/studionet docs/superpowers/plans/2026-08-01-payable-refund-safety.md
git diff --cached --name-status
git diff --cached --check
git commit -m "Promote payable-safe Studionet revision"
git push origin main
```

Expected: no ignored environment or local control file is staged; push succeeds; GitHub Actions passes for the pushed commit. If its run URL was not available before push, add the exact URL in a final documentation-only commit and push once more.

## Completion Evidence

- Red/green direct tests for all five rejection reasons, zero value, isolation, withdrawal, and duplicate prevention.
- Fresh full `npm run check` success.
- Exact old-revision archive with immutable surplus evidence.
- New deployment identity and explorer address.
- Successful rejected payable parent, exact canonical credit, and finalized withdrawal child.
- Complete valid market lifecycle with canonical final reads.
- Production frontend bound to the new address and exercised with the connected Chrome wallet.
- Public repository push and successful CI URL.
- Copy-ready submission fields without final portal submission.
