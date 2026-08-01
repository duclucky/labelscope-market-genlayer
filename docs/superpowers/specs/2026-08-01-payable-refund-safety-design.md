# Payable Rejection Refund Safety Design

Date: 2026-08-01
Status: Approved architecture; implementation pending written-spec approval
Track: Projects
Contract count: One

## Context

The active Studionet revision at `0x9F623cd3703c76E123aD561630A6B72364559f5E`
validates `fund_position` before it records `gl.message.value`. A deliberately invalid
call sent `0.001 GEN` to that payable method and finalized with an execution error, but
the native value remained in the contract while all GenVM state changes reverted.

The observed transaction is
`0x7de4bed03104b02cae321d7a1e991125448b613eae2e9660cca460d6b68851bb`.
After all legitimate positions and credits were settled, canonical reads showed:

- `contract_liability = 0`
- `total_received = 7000000000000000`
- `total_credited = 7000000000000000`
- `total_withdrawn = 7000000000000000`
- native contract balance = `1000000000000000` wei

The exact surplus equals the invalid call value. The deployed revision is frozen because
it did not configure an upgrader, and it exposes no surplus-recovery method. The surplus
therefore cannot be recovered from that immutable revision.

Frontend validation is not a sufficient fix. `LabelScopeMarket` is a reusable public
contract, so scripts and third-party integrations must remain safe when they call the
contract directly.

## Decision

Deploy a new frozen one-contract revision that uses **credit on payable rejection**.
When `fund_position` receives a positive value but rejects the requested business action,
the transaction succeeds without changing the requested market or position. Instead, the
full received value becomes withdrawable credit for the sender through the existing
`withdraw_credit` path.

The revision will not add an administrator, upgrader, owner-only sweep, or discretionary
custody path. This keeps recovery user-owned and preserves the minimum one-contract
architecture.

## Goals

1. Prevent positive value sent to `fund_position` from becoming unaccounted surplus on
   every deterministic business-rule rejection.
2. Preserve all existing market, position, resolution, claim, and withdrawal semantics
   for valid actions.
3. Make every rejected positive funding attempt observable through a bounded return value
   and canonical account credit.
4. Maintain explicit accounting invariants from receipt through withdrawal.
5. Prove the behavior with direct tests, static checks, a bounded Studionet rejection
   smoke test, and a complete valid lifecycle on the new revision.
6. Archive the old revision and its unrecoverable test surplus honestly.

## Non-goals

- Recovering the `0.001 GEN` already stranded in the frozen old revision.
- Adding an administrator or a general-purpose surplus sweep.
- Accepting arbitrary direct native transfers outside the documented payable
  `fund_position` interface.
- Changing validator judgment, equivalence rules, market resolution, payout allocation,
  or cancellation policy.
- Rebuilding or restyling the frontend.

## Contract behavior

### Funding result

`fund_position(market_id: str, side: str)` remains a payable public write method and now
returns a dictionary with these stable fields:

| Field | Type | Meaning |
| --- | --- | --- |
| `accepted` | boolean | Whether the value was added to the requested position |
| `reason` | string enum | `ACCEPTED` or the bounded rejection reason |
| `received` | decimal string | Native value observed from `gl.message.value` |
| `credited_refund` | decimal string | Amount credited back to the sender |

The bounded rejection reasons are:

- `MARKET_NOT_FOUND`
- `MARKET_NOT_OPEN`
- `FUNDING_CLOSED`
- `INVALID_SIDE`
- `SIDE_LOCKED`

A successful funding returns `accepted = true`, `reason = ACCEPTED`, and
`credited_refund = "0"`. A rejected positive funding returns `accepted = false`, the
applicable reason, and `credited_refund = received`.

### Evaluation order

The method follows this order:

1. Read `gl.message.value` and the sender.
2. If the value is zero or negative, raise `UserError("Funding value must be positive")`.
   No native value is at risk in this branch.
3. Evaluate deterministic business rules without mutating market or position state.
4. If a rule rejects the action, record the full value as sender credit and return the
   rejection result without raising.
5. If all rules pass, update the position, market pools, and contract accounting once,
   then return the accepted result.

The first applicable rejection reason in the list above is returned. Stored market
timestamps remain validated at market creation, so parsing a stored close time is not an
untrusted funding-time operation.

### Rejection credit transition

For a positive rejected value `v` from sender `s`, the contract performs exactly these
state changes:

- `credits[s] += v`
- `total_received += v`
- `total_credited += v`
- `contract_liability += v`

It does not create or modify a position, append an account market ID, or change
`yes_total`, `no_total`, `total_pool`, `remaining_pool`, or market status.

The sender recovers the credit with the existing `withdraw_credit` method. The contract
debits the ledger before scheduling the external transfer, and Studionet evidence must
verify the finalized child transfer as well as the parent receipt.

### Accepted funding transition

For accepted value `v`, current behavior remains unchanged:

- create or increase the sender's same-side position;
- add `v` to the selected side, total pool, and position stake;
- `total_received += v`;
- `contract_liability += v`;
- do not increment `total_credited` until a claim or refund credit is created.

## Accounting invariants

The revision must preserve these invariants after every completed contract method:

1. `total_received - total_withdrawn = contract_liability`.
2. `contract_liability >= 0`.
3. Every rejected positive funding value is represented in exactly one sender credit and
   is not represented in any market pool.
4. A rejected value is counted once in `total_received` and once in `total_credited`.
5. A successful withdrawal reduces both the sender credit and `contract_liability` by the
   requested amount and increments `total_withdrawn` once.
6. Duplicate withdrawals cannot spend the same credit.
7. For the new revision, a completed clean lifecycle with all credits withdrawn must end
   with `contract_liability = 0`; Studionet balance evidence must also show no unexplained
   surplus.

## Authorization and trust boundary

Refund credit always belongs to `gl.message.sender_address`; the caller cannot nominate a
different refund recipient. No privileged actor can redirect or sweep credits. Existing
role rules for market creation, locking, resolution, and cancellation remain unchanged.

The change is deterministic and does not alter nondeterministic validator evaluation.
Validators continue to judge the same bounded evidence and semantic verdict fields during
resolution.

## Frontend behavior

The current visual design and information hierarchy remain intact. The frontend continues
to prevent invalid funding actions before opening the wallet whenever canonical state is
already sufficient to do so.

After a submitted funding transaction finalizes, the frontend interprets the new return
value:

- accepted funding refreshes the position, pools, balance, and canonical market state;
- rejected funding displays a user-facing explanation that the stake was not added and
  the full amount is available to withdraw;
- the existing credit action becomes visible from the canonical `get_credit` read;
- raw receipt internals, validator data, accounting diagnostics, and reason enum names are
  not exposed as a technical or reviewer interface.

RPC failure, wallet rejection, finality timeout, retry, and canonical refresh behavior
remain as currently tested. Existing callers that ignore the return value remain
compatible because the argument list and payable action are unchanged.

## Test design

Implementation follows test-driven development. Tests must fail against the old behavior
before the contract is changed.

### Direct contract tests

For each rejection reason, send a positive value and prove:

- the call returns the expected structured rejection result;
- sender credit increases by the full received value;
- received, credited, and liability totals increase exactly once;
- no market or position allocation changes;
- the global accounting invariant holds.

Cases cover missing market, non-open market, elapsed funding window, invalid side, and an
existing opposite-side position. Additional tests prove:

- zero value still raises and does not change accounting;
- valid first funding and valid same-side top-up remain accepted;
- rejected credit can be withdrawn;
- a second withdrawal cannot spend it again;
- entity isolation prevents one account's rejection credit from changing another account;
- all value-receiving public entrypoints retain payable metadata;
- the return schema contains only the four documented fields and a bounded reason.

### Frontend tests

Tests cover normalization of accepted and credited-rejection returns, the user-facing
credited-refund message, canonical credit refresh, and continued handling of legacy
receipts that do not provide the new return object during migration. Existing TypeScript,
receipt normalization, retry, wallet-error, and production-build tests remain required.

### Full local verification

`npm run check` must pass and continue to prove GenVM lint, all direct tests, deployment
parser tests, frontend tests, TypeScript checks, and a production frontend build.

## Studionet verification

Deployment and demo scripts remain resumable and idempotent. The new revision is not
promoted to active until all of the following evidence exists:

1. Deploy the exact verified source revision to Studionet and record the new address,
   source commit, API/runner version, deployment transaction, and finalized status using
   the safe evidence allowlist.
2. Send a deliberate positive-value funding call for a nonexistent market.
3. Prove the parent finalizes successfully with `accepted = false`,
   `reason = MARKET_NOT_FOUND`, and full `credited_refund`.
4. Read canonical account credit and contract summary to prove the liability was recorded
   and no market state was created.
5. Withdraw that credit and prove the parent receipt, finalized child transfer sender,
   recipient, value, absence of explicit error, and account/contract balance effect.
6. Run a complete valid two-sided lifecycle through funding, lock, nondeterministic
   resolution or retry/cancel as required, claim, withdrawal, and canonical final reads.
7. End with zero outstanding liability and no unexplained native balance on the new
   revision.

Local direct-mode success is not substituted for this Studionet evidence.

## Migration and deployment records

The old deployment is archived with status
`SUPERSEDED_UNRECOVERABLE_TEST_SURPLUS`, its address, source revision, supersession reason,
the invalid transaction, final canonical summary, and the `0.001 GEN` native balance. Its
liability is zero, but its balance cannot be reduced because the frozen contract has no
recovery interface. This immutable known defect is an explicit exception to the normal
zero-balance retirement requirement and must not be described as recovered.

Only after the new revision passes Studionet verification will `deployment.json` point to
the new address. The frontend's public contract address is then updated and deployed. A
browser-wallet smoke test confirms network, read, accepted funding, credited rejection,
credit withdrawal, finality, and canonical refresh against the new active revision.

README, evidence indexes, submission text, and explorer links must distinguish old and new
addresses and must not mix their receipts or balances.

## Acceptance criteria

The design is complete only when:

- every positive deterministic rejection from `fund_position` creates a full sender-owned
  credit without changing market or position allocation;
- zero-value invalid calls still fail safely;
- no admin, upgrader, sweep, or second contract is introduced;
- all accounting and isolation tests pass;
- `npm run check` passes on the implementation commit;
- the new Studionet revision passes both the deliberate rejection/withdrawal proof and a
  complete valid lifecycle;
- the deployed frontend uses the new address and presents only user-relevant state and
  actions;
- the old `0.001 GEN` surplus is documented as unrecoverable rather than omitted or claimed
  as recovered;
- repository, CI, explorer, lifecycle evidence, README, and submission fields all point to
  the exact verified revisions.

## Alternatives rejected

### Administrator surplus sweep

An owner-only sweep could recover unaccounted balance, but it adds discretionary custody
and a new trust assumption. It also treats the symptom after funds become surplus instead
of preserving the sender's claim at the rejection boundary.

### Frontend-only validation

The frontend already suppresses many invalid actions, but direct integrations can still
call the payable contract. Client validation cannot provide a contract-level safety
property and cannot protect the reusable interface.
