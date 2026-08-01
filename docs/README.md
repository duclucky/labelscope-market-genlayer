# LabelScope Market - product and contract specification

## Identity

- Idea ID: `IDEA-007`
- Project name: `LabelScope Market`
- Project slug: `labelscope-market`
- Category: `Projects`
- Status: `BUILDING`
- Repository: local project repository; the public remote is created only after the publication gate
- Target network: `studionet`
- Contract count: one (`LabelScopeMarket`)

## One-sentence product hook

**Stake GEN on the exact FDA label, not a headline, and let independent validators decide which side the official indication language supports.**

## Trust problem

- Decision that must not depend on one party: whether a version-locked official FDA label satisfies every required semantic facet of a funded market.
- Why a database, ordinary EVM contract, or backend LLM is insufficient: deterministic code can verify identifiers and accounting but cannot neutrally interpret natural-language indication scope; a backend LLM would let the operator choose the winner.
- Value at risk: the complete native-GEN collateral pool funded by opposed YES and NO forecasters.

## Fingerprint

- Trust problem: neither the market creator, operator, nor either funded side may unilaterally interpret the label.
- Actors/adversary: YES holders benefit from an expansive match, NO holders from a narrow match, and the creator can phrase the initial question but cannot change it after creation.
- Evidence class: one locked FDA approval page and one exact openFDA label record from `api.fda.gov`, identified by application number, label set ID, and effective time.
- Consensus question: whether the official label matches the required condition, biomarker, population, disease stage, prior-therapy, combination, and approval-class facets.
- State machine: `OPEN -> LOCKED -> RESOLVED_YES | RESOLVED_NO`, with `RETRYABLE` and `CANCELLED_REFUND` recovery paths.
- Direct consequence: a finalized verdict selects the winning side and opens pro-rata credits from the fully collateralized pool; unverifiable evidence pays neither side.
- Reuse surface: other products can create typed markets, fund positions, resolve them, claim/withdraw credits, and read canonical market, attempt, position, and account views.

## Mandatory gate matrix

| Gate | Result | Evidence/reason |
| --- | --- | --- |
| Replacement | PASS | Replacing validators with an operator-controlled database or LLM reintroduces unilateral winner selection. |
| Judgment | PASS | Validators independently map natural-language label text to seven locked semantic facets; clients never submit a verdict. |
| Evidence | PASS | Evidence is bounded to exact public FDA/openFDA sources and immutable label identifiers. Live source probes are recorded in `docs/IDEATION.md`. |
| Equivalence | PASS | Consensus compares the source stage, source consistency, seven normalized facet classes, derived verdict, and derived consequence; prose is not compared. |
| Consequence | PASS | `MATCH` selects YES credits and `NO_MATCH` selects NO credits from the funded pool. |
| Adversarial | PASS | YES and NO position holders have directly opposed financial incentives. |
| State model | PASS | Market, position, attempt, credit, and account indexes are keyed per entity; terms are immutable; claims and withdrawals are idempotent. |
| Reuse | PASS | The public write/view interface is domain-specific but application-independent and needs no copied frontend. |
| Contract count | PASS | One contract is the minimum owner of market terms, evidence policy, pool accounting, verdict, credits, and withdrawals. |
| Differentiation | PASS | The pooled multi-participant lifecycle, FDA facet schema, and pro-rata consequence differ structurally from covenant, recall, quarantine, and bilateral escrow work. |
| Claim-to-code | PASS | Every important product claim below maps to a method/state, view, direct test, and network evidence item. |
| Full lifecycle | PASS | The defined Projects lifecycle includes browser creation/funding, opposed wallets, validator adjudication, finality, canonical rereads, credit claim, and native-GEN withdrawal. |
| Scope honesty | PASS | Uncaptured Studionet, browser-wallet, deployment, CI, adoption, and legal evidence remains explicitly pending until produced. |

One failed mandatory gate requires redesign or rejection; UI scope cannot compensate for it.

## Actors, roles, and incentives

| Actor | Permissions | Value at risk | Incentive to bias |
| --- | --- | --- | --- |
| Market creator | Create an immutable typed market; fund either side; lock/resolve under the same public rules; enable refunds after the grace time | Any funded position | May phrase a favorable predicate before publication, but cannot edit it or choose the verdict |
| YES forecaster | Fund YES; request lock/resolution; claim if YES wins or refund if cancelled; withdraw own credit | YES stake | Wants broad label interpretation |
| NO forecaster | Fund NO; request lock/resolution; claim if NO wins or refund if cancelled; withdraw own credit | NO stake | Wants narrow label interpretation |
| Resolution caller | Trigger lock or validator adjudication after the locked time | Transaction cost only unless also funded | Cannot supply a verdict or evidence replacement |
| GenLayer validators | Fetch locked sources, classify facets, and compare semantic fingerprints | Consensus participation | Independently re-evaluate rather than trust the leader |

## Scope and non-goals

### In scope

- Fully collateralized native-GEN YES/NO pools for exact FDA label-scope predicates.
- Seven bounded indication facets: condition, biomarker, population, disease stage, prior therapy, combination requirement, and approval class.
- Official FDA/openFDA evidence locked by application number, set ID, effective time, and approval URL.
- `MATCH`, `NO_MATCH`, and non-penalizing `UNVERIFIABLE` adjudication.
- Pro-rata winner credits, exact cancellation refunds, append-only attempts, retry, and withdrawal.
- A responsive wallet product that reads canonical state and signs real Studionet transactions.

### Out of scope

- Medical advice, treatment recommendations, safety/efficacy scoring, or patient-specific decisions.
- Arbitrary prediction questions, arbitrary websites, user-uploaded evidence, private trial data, news, or social sources.
- Order books, leverage, secondary transfers, dynamic market-making, mainnet value, or legal/gambling/securities claims.
- An offchain score, verdict, balance, finality simulator, or optional audit log.
- A separate pass-through consumer contract without a real independent trust boundary.

## Product/frontend blueprint

The returned React frontend was audited on desktop and a 390x844 mobile viewport. Its light scientific visual language, Lexend/Source Sans typography, sidebar/top navigation, editorial market cards, filter layout, detail grid, creation wizard, portfolio cards, and mobile sticky actions are preserved. The audit record is in `docs/FRONTEND-AUDIT.md`.

### Human users and jobs

| User/role | Primary job | Decision or outcome needed |
| --- | --- | --- |
| Forecaster | Find a precise market, inspect the locked predicate, fund one side, and later recover value | What exactly must match, what is my exposure, what finalized, and what can I do now? |
| Market creator | Publish a bounded label question that validators can resolve | Are required identifiers/facets valid and are all terms immutable after creation? |
| Resolution caller | Start or retry adjudication after the legal time | Is resolution currently legal and did it finalize, fail, or remain retryable? |

### Information architecture

| Screen/view | User purpose | Primary action | Required states | Mobile behavior |
| --- | --- | --- | --- | --- |
| Markets | Discover canonical pools | Open a market; secondary create action | Loading/error/empty plus `OPEN`, `LOCKED`, `RETRYABLE`, resolved, and cancelled cards | Single-column cards and horizontally scrollable filters |
| Market detail | Understand locked terms and take the one legal next action | Fund; otherwise lock, request/retry resolution, claim, or withdraw | Exact facets/sources, pool totals, own position, attempt result, transaction progress, final consequence | Existing sticky bottom action area with at least 44px targets |
| Create market | Compose and review immutable terms | Sign `create_market` | Validation, wrong network, wallet rejection, submitted, accepted/decided, finalized, failed | Existing one-column progressive form |
| My positions | Review exposure and collect available value | Claim credit or withdraw | Pending, winning/losing, refundable, credited, withdrawn, loading/error/empty | Existing action-grouped cards; no dense table |

No settings, validator console, reviewer dashboard, token faucet, AI assistant, or generic analytics route is part of the product.

### Visibility matrix

| Function/data group | Visibility | Eligible role/state | User need or reason hidden |
| --- | --- | --- | --- |
| Market question, facets, source labels, times, status, and pool totals | `USER_PRIMARY` | Everyone | Required to understand and evaluate the market |
| Own side, stake, claimable/refundable value, and wallet/network state | `USER_PRIMARY` | Connected account | Required to act safely |
| Create, fund YES/NO, claim, and withdraw | `USER_PRIMARY` | Eligible connected account | Core user actions |
| Final facet result and value consequence | `USER_PRIMARY` | Everyone after finalization | Explains settlement without exposing validator internals |
| Transaction approval/submitted/accepted/finalized/failed/retry state | `USER_PRIMARY` | Transaction initiator | Prevents a hash or acceptance from being mistaken for finality |
| Lock, request/retry resolution, and enable refunds | `USER_CONTEXTUAL` | Only when canonical time/state permits | Recovery/resolution actions should not clutter normal funding |
| Full official URLs and explorer links | `USER_CONTEXTUAL` | Everyone through concise verification disclosures | Useful for verification, secondary to the decision |
| Raw storage, receipt payloads, attempt internals, validator identities/config, prompts, equivalence code, tests, and submission evidence | `SYSTEM_ONLY` | Never in the primary product UI | They do not help a user complete a product job |
| Mock balances, fixture controls, local storage, fake hashes, gas, fees, signatures, odds, and finality | `SYSTEM_ONLY` | Development only and removed from production | They can misrepresent canonical state |

### Final UI action matrix

| Visible control | Contract method/capability | Eligible role | Legal state | Input/value | Finality | Failure/recovery |
| --- | --- | --- | --- | --- | --- | --- |
| Create market | `create_market(...)` | Connected account | Unique ID; future legal times | Immutable identifiers, seven facets, source identity, and times; no value | Show wallet approval -> submitted -> accepted/decided -> finalized -> reread | Preserve form; a failed/rejected tx creates no market |
| Fund YES | `fund_position(market_id, "YES")` payable | Connected account | `OPEN` and before `close_at` | Native GEN in `gl.message.value` | Finalized then reread market/position | Canonical pool remains unchanged on failure |
| Fund NO | `fund_position(market_id, "NO")` payable | Connected account | `OPEN` and before `close_at` | Native GEN in `gl.message.value` | Same as YES | Same as YES |
| Close funding | `lock_market(market_id)` | Any account | `OPEN` and at/after `close_at` | Market ID only | Finalized then status reread | Too early leaves `OPEN` |
| Request resolution | `resolve_market(market_id)` | Any account | `LOCKED` and at/after `resolve_at` | Market ID only; no verdict/evidence input | Finalized verdict or retry state then canonical reread | Source/schema/consensus failure never fabricates a winner |
| Retry resolution | `resolve_market(market_id)` | Any account | `RETRYABLE` and at/after `resolve_at` | Current attempt inferred by contract | Appends a new finalized attempt | Never hardcode an attempt index |
| Enable refunds | `cancel_unresolved(market_id)` | Creator or participant | `LOCKED`/`RETRYABLE` and at/after `refund_at` | Market ID only | Finalized then claimable refunds reread | Unauthorized/early calls leave state unchanged |
| Claim payout/refund | `claim_credit(market_id)` | Position owner | Winning resolved side or cancelled market; unclaimed | Market ID only | Finalized internal credit then reread | Duplicate/losing claims reject without changing credit |
| Withdraw GEN | `withdraw_credit(amount)` | Account with credit | Positive credit | Integer base-unit amount; UI defaults to full credit | Ledger debited before native transfer; balance and credit reread | Failed tx leaves canonical credit available |
| Connect/switch wallet | EIP-1193 wallet adapter | Any user | Any | Selected provider and Studionet chain | Connection/network confirmation only | Explain missing provider, wrong network, rejection, or unfunded wallet |

### User-facing state language

| Canonical status/outcome | User-facing label | User consequence/next step |
| --- | --- | --- |
| `OPEN` | Funding open | Review the exact terms, then fund YES or NO before close. |
| `LOCKED` | Funding closed | Positions are fixed; request resolution when its time arrives. |
| Submitted/accepted but not finalized | Validators are reviewing FDA evidence | No winner or credit exists yet. |
| `RETRYABLE` / `UNVERIFIABLE` | Official evidence could not be verified | No side won; retry or wait for refund eligibility. |
| `RESOLVED_YES` / `MATCH` | FDA label matches the locked scope | Winning YES accounts may claim canonical credit. |
| `RESOLVED_NO` / `NO_MATCH` | FDA label does not match the locked scope | Winning NO accounts may claim canonical credit. |
| `CANCELLED_REFUND` | Market cancelled - refunds available | Every participant may claim the exact remaining stake. |
| Position credited | Payout ready to withdraw | Withdraw available GEN from contract credit. |
| Credit withdrawn | Funds withdrawn | Show the canonical zero/remaining credit and explorer link. |
| Transaction rejected/failed | Transaction did not complete | Canonical state is unchanged; correct the cause and retry safely. |

### Visual preservation constraints

- Preserve: the returned palette, typography, navigation, cards, filters, content order, form stepper, portfolio grouping, rounded border language, and mobile sticky action placement.
- Allowed functional edits: remove fake/technical surfaces; replace mock data/actions with adapters; add loading/error/empty/finality/retry states; correct labels/units/accessibility; conditionally show legal actions; fix scroll and responsive defects.
- Excluded from primary UI: raw enums/storage/receipts, validator identities/configuration, prompts/equivalence logic, full attempt payloads, test/deployment/submission data, and fixture controls.

## State model

### Stable IDs

- `market_id`: user-supplied lowercase `[a-z0-9_-]`, 6-64 characters, globally unique, immutable.
- `position_key`: deterministic `market_id + "|" + normalized_account_address`.
- `attempt_key`: deterministic `market_id + "|" + decimal_attempt_number`.
- `label_identity`: deterministic `application_number + "|" + label_set_id + "|" + label_effective_time` stored inside immutable market terms.

### Structured storage

- `markets: TreeMap[str, Market]` and append-only `market_ids: DynArray[str]`.
- `positions: TreeMap[str, Position]` keyed by `market_id|account`; `get_account_market_ids` filters the canonical market index against those keyed positions, avoiding a second mutable registry.
- `attempts: TreeMap[str, ResolutionAttempt]`; previous attempts are never overwritten.
- `credits: TreeMap[Address, bigint]` for pull-based native-GEN withdrawals.
- Global accounting counters: total received, total credited, total withdrawn, and current contract liability.
- Each market stores immutable terms, YES/NO totals, total/remaining pool, remaining winning stake, status, verdict, consequence, attempt count, and creator.

### State machine

```text
MISSING --create_market/any account--> OPEN
OPEN --lock_market/any account after close_at--> LOCKED
LOCKED --resolve_market/any account after resolve_at, MATCH--> RESOLVED_YES
LOCKED --resolve_market/any account after resolve_at, NO_MATCH--> RESOLVED_NO
LOCKED --resolve_market/any account after resolve_at, UNVERIFIABLE--> RETRYABLE
RETRYABLE --resolve_market/any account, MATCH--> RESOLVED_YES
RETRYABLE --resolve_market/any account, NO_MATCH--> RESOLVED_NO
RETRYABLE --resolve_market/any account, UNVERIFIABLE--> RETRYABLE with appended attempt
LOCKED|RETRYABLE --cancel_unresolved/creator-or-participant after refund_at--> CANCELLED_REFUND
RESOLVED_YES|RESOLVED_NO|CANCELLED_REFUND --claim_credit/eligible position owner--> same market state, position.claimed=true
positive credit --withdraw_credit/credit owner--> credit reduced and native transfer emitted
```

`resolve_market` may first perform the legal `OPEN -> LOCKED` transition when both `close_at` and `resolve_at` have passed, preventing a stale UI from blocking resolution without allowing late funding.

Resolution requires positive collateral on both YES and NO. A one-sided pool cannot select a distributable winner and remains refundable through the recovery path.

### Illegal transitions

- Duplicate market IDs; funding at/after close; zero-value funding; invalid side; resolving before `resolve_at`; resolving a one-sided or already resolved/cancelled market; cancelling before `refund_at`; cancelling by a noncreator/nonparticipant; losing, zero, or duplicate claims; and withdrawals above credit all revert.
- There is no method that edits a market, position stake, attempt, verdict, winning side, or source identity.

### Authorization

- Creation and funding are permissionless under validation/time rules.
- Locking and resolution are permissionless because callers provide no outcome input.
- Cancellation after the grace time is limited to the creator or any account with a positive position in that market.
- Claim and withdrawal derive ownership exclusively from `gl.message.sender_address`.

### Idempotency and double-action prevention

- Market ID uniqueness and one account-market index entry prevent duplicate creation/indexing.
- Every resolution increments `attempt_count` once and writes a new immutable attempt key.
- Final states reject additional resolution/cancellation.
- `Position.claimed` prevents payout/refund replay.
- Withdrawal checks and debits credit/liability before sending through the current
  `@gl.evm.contract_interface` EOA transfer boundary.

## Evidence policy

- Authoritative sources: an exact HTTPS FDA approval page under `www.fda.gov` and an exact openFDA drug-label API URL under `api.fda.gov`, deterministically derived from the locked label set ID and effective time.
- Provenance/authentication: FDA hosts plus locked application number, set ID, and effective time; both response status and identity coverage are checked before semantic judgment.
- Authorized attestor/signer: not applicable. Evidence is FDA-authored public data, not actor-controlled telemetry; no user signature can substitute for an FDA source.
- Anti-replay event/digest identity: the immutable `label_identity` and unique market ID; a resolved market cannot be resolved again.
- Signed timestamp bounds: not applicable to authoritative public sources. Contract transaction time enforces close, resolve, and refund windows; label effective time is locked data.
- Immutable policy/source versions: contract constant `LABELSCOPE_FDA_V1`; application number, set ID, effective time, approval URL, and derived openFDA query are immutable market fields.
- Allowed scheme/domain/path: HTTPS only; approval URL must use `www.fda.gov` on an FDA drug approval/press/notice path; label source is derived under `api.fda.gov/drug/label.json` and cannot be user-expanded.
- Time/window rules: funding before `close_at`; resolution at/after `resolve_at`; refund cancellation at/after `refund_at`; at least 30 seconds to funding close, 30 seconds from close to resolution, 120 seconds from resolution to refund, and at most 30 days from creation to refund.
- Size/count bounds: exactly two fetches; each decoded source body at most 160,000 characters; one model call per independent evaluation; seven facets; 400 characters per facet; bounded IDs/title.
- Missing evidence: identity fields absent from the label body produce `UNVERIFIABLE`, never `NO_MATCH`.
- Contradictory evidence: conflicting version/application/source identity or semantic source consistency produces `UNVERIFIABLE`.
- Unavailable source: non-200, empty, undecodable, oversized, or fetch exception produces `UNVERIFIABLE` and `RETRYABLE`.
- Invalid/unverifiable attestation: no attestation input exists; any unavailable/invalid source is non-penalizing and retryable.
- Prompt-injection boundary: source text and market terms are delimited as untrusted data; they cannot change allowed fields, facet enums, verdicts, consequence mapping, hosts, fetch count, or action set; unknown output keys are discarded.
- Excluded evidence: arbitrary URLs, client text, uploaded documents, private sources, news/social content, model-provided URLs/IDs, and rationale prose.

## Consensus design

### Leader task

- Inputs: immutable market identity, required/not-required facet values, approval URL, and contract-derived openFDA URL.
- Fetch: GET exactly the two locked/derived sources and reject bad status, empty/oversized bodies, or missing locked openFDA identities.
- Extraction: present bounded source text and locked facet values to the model as data, never as instructions.
- Normalization: keep only the eight allowed semantic fields; coerce allowed case variants; force empty/nonrequired facets to `NOT_REQUIRED`; use `UNKNOWN` for absent/invalid required output.
- Structured output: seven facet classes plus `source_consistency`; contract code derives `source_stage`, `verdict`, and `consequence_class`.

Allowed facet classes are `MATCH`, `NO_MATCH`, `NOT_REQUIRED`, and `UNKNOWN`. Allowed source-consistency classes are `CONSISTENT`, `CONTRADICTORY`, and `UNKNOWN`.

### Consensus-critical fields

| Field | Type/bounds | Comparison rule | Why critical |
| --- | --- | --- | --- |
| `source_stage` | `COMPLETE`, `MISSING`, `UNAVAILABLE`, `MALFORMED` | Exact normalized enum | Distinguishes negative evidence from evidence failure |
| Seven facet fields | Seven fixed enums | Exact enum per facet in fixed order | A single required mismatch changes the winning side |
| `source_consistency` | Three-value enum | Exact normalized enum | Contradictory sources cannot settle value |
| `verdict` | `MATCH`, `NO_MATCH`, `UNVERIFIABLE` | Exact value derived from critical fields | Selects whether and how settlement occurs |
| `consequence_class` | `WIN_YES`, `WIN_NO`, `NO_SETTLEMENT` | Exact value derived from verdict | Prevents model-selected money movement |

Market/source identity is bound by the attempt key and captured market terms rather than accepted from model output.

### Validator

- Independent evidence/replay: each validator reruns the same bounded fetch, identity checks, prompt, normalization, and deterministic derivation.
- Semantic rule: `validator_fn` accepts only a `gl.vm.Return` whose complete fixed fingerprint equals the independent fingerprint. It uses `gl.vm.run_nondet`; `run_nondet_unsafe` is permitted only as a documented runtime compatibility fallback proved by a smoke test.
- Rejection conditions: wrong return type; missing/unknown critical fields when independent evidence is complete; different facet/consistency/verdict/consequence; invalid enum; or a model-selected consequence.
- `UNDETERMINED` handling: consensus disagreement or transaction failure reverts and preserves the prior market state; a consensual `UNVERIFIABLE` result appends an attempt and sets `RETRYABLE` without selecting a side.

### Rationale policy

No model rationale is consensus-critical or stored. The UI explains a result from canonical per-facet classes, source stage, and deterministic consequence, avoiding unstable or hallucinated prose.

## Consequence and accounting

| Verdict | Canonical state change | User action | Value movement |
| --- | --- | --- | --- |
| `MATCH` | `RESOLVED_YES`; winning total = YES total; remaining pool initialized | Eligible YES positions call `claim_credit` | Pro-rata credit from all collateral; NO receives zero |
| `NO_MATCH` | `RESOLVED_NO`; winning total = NO total; remaining pool initialized | Eligible NO positions call `claim_credit` | Pro-rata credit from all collateral; YES receives zero |
| `UNVERIFIABLE` | `RETRYABLE`; append attempt; no winner | Retry or wait for cancellation time | No payout, loss, or operator fee |
| Cancel after grace | `CANCELLED_REFUND` | Every participant calls `claim_credit` | Exact unclaimed stake credited |

- Accepted/finalized boundary: contract settlement is usable only after the resolution transaction is finalized and canonical state is reread. Submitted/accepted UI state is provisional.
- Ledger invariant: `total_received - total_withdrawn == contract_liability`; liability is the sum of remaining market pools and account credits. Claiming moves liability from a market pool to account credit without changing total liability.
- Pro-rata invariant: for resolved markets, each winner receives a floor share from current remaining pool/current remaining winning stake; the final winner receives all remaining dust, so aggregate credits equal the full pool.
- Child-message/transfer evidence: withdrawal zeroes/reduces credit and liability before
  `_ExternalRecipient(sender).emit_transfer`; network evidence must show finalized
  parent/external-child receipt projection plus before/after balance and canonical credit.
- Withdrawal/settlement: `claim_credit` performs accounting only; `withdraw_credit` performs pull-based native-GEN transfer. There is no push callback or operator custody path.
- Cure/appeal/restore: no appeal can reverse a finalized winner. Evidence failure is cured only by a new append-only retry before final resolution; after `refund_at`, cancellation opens exact refunds.

## Reusable interface

### Write methods

- `create_market(market_id, title, category, drug_name, application_number, label_set_id, label_effective_time, approval_url, condition, biomarker, population, disease_stage, prior_therapy, combination_requirement, approval_class, close_at, resolve_at, refund_at)`
- `fund_position(market_id, side)` - `@gl.public.write.payable`
- `lock_market(market_id)`
- `resolve_market(market_id) -> dict`
- `cancel_unresolved(market_id)`
- `claim_credit(market_id) -> int`
- `withdraw_credit(amount)`

### View methods

- `get_market(market_id) -> dict`
- `get_market_ids() -> list[str]`
- `get_position(market_id, account) -> dict`
- `get_account_market_ids(account) -> list[str]`
- `get_attempt(market_id, attempt_number) -> dict`
- `get_attempt_count(market_id) -> int`
- `get_credit(account) -> int`
- `get_contract_summary() -> dict`

All views return normalized JSON-compatible primitives; bigint values are returned in a frontend-safe representation and parsed by the adapter without `Number` precision loss.

### Consumer/callback

- Authentication: no callback exists in v1; consumers read finalized canonical views and authenticate the deployed address/network/source commit.
- Idempotency key: consumers key reads by `network + contract_address + market_id + attempt_number`.
- Failure/retry: consumers must not act on submitted/accepted transactions; they reread after finality and handle `RETRYABLE` as no settlement.
- Authorized cancellation: only the contract's `cancel_unresolved` rule can enable refunds; no consumer can override it.

## Threat model

| Threat | Attack | Mitigation | Direct test |
| --- | --- | --- | --- |
| Creator changes terms after stakes | Rewrite facet/source/deadline | No update method; immutable structured market | Terms unchanged after funding; nonexistent updater/static check |
| Client submits winner | Pass score/verdict to resolve | `resolve_market` accepts only market ID | ABI/static test and attempted extra input |
| Late funding | Stake after close | Deterministic transaction time check | Before/at/after boundary tests |
| Unauthorized cancellation | Stranger enables refunds | Creator-or-participant authorization plus time | Stranger and early cancellation tests |
| Cross-market overwrite | Global last-state fields | Per-market/per-position/per-attempt keys | Two-market isolation tests |
| Duplicate stake indexing | Repeated fund duplicates portfolio entry | Keyed position plus one-time account index flag | Repeated same-side/opposite-side funding tests |
| Source outage interpreted as NO | 404/timeout/oversized body | Source-stage normalization to `UNVERIFIABLE` | Missing/unavailable/malformed tests |
| Prompt injection | FDA/term text asks model to select winner/action | Delimit data, fixed enums, discard keys, deterministic verdict/consequence | Injection fixture and unknown-key tests |
| Malicious leader | Fabricate favorable facets | Validator independently refetches/replays and compares full fingerprint | Forged leader result tests |
| Format-only agreement | Same JSON shape, different meaning | Fixed semantic fields and exact normalized enums | Shape-equal/semantic-different test |
| Contradictory sources | Approval page/version differs from label | Locked identities and consistency enum force `UNVERIFIABLE` | Contradiction fixture |
| Duplicate resolution | Resolve a final market again | Final-state guards and append-only attempts | Double-resolution test |
| Double claim/withdraw | Replay payout or exceed credit | Position claimed flag; debit-before-transfer; credit bounds | Duplicate claim and over-withdraw tests |
| Rounding leakage | Floors leave contract dust | Remaining-pool/remaining-winning-stake algorithm; last winner gets remainder | Multi-winner/randomized conservation tests |
| Fake frontend state | Local mock balance/hash/finality | Canonical views plus transaction lifecycle adapter; no local storage source of truth | Component/adapter tests and browser canonical reread |

Actor-controlled attestation forgery/replay/timestamp tests are explicitly not applicable because v1 accepts no actor-authored evidence or attestor input; static tests prove those entrypoints/fields do not exist.

## Test plan

- Happy path: create, two opposed funded positions, lock, `MATCH` and `NO_MATCH`, claim winner credits, and withdraw.
- Unauthorized: stranger cancellation, account A claiming B, and over-withdraw.
- Isolation: multiple markets, positions, attempts, account indexes, and credits cannot overwrite each other.
- Configuration/time: invalid IDs/URLs/source identities/facets/timestamp order; immutable terms; fund/lock/resolve/cancel boundaries.
- Evidence failure: missing, non-200, empty, undecodable, oversized, identity-missing, contradictory, and transient source fixtures.
- Malicious leader: fabricated verdict, omitted facet, extra key, wrong consequence, and wrong return type.
- Prompt injection: source/term instructions cannot expand enums, URLs, actions, or consequences.
- Semantic mismatch: identical JSON shape but one different critical facet or consistency class is rejected.
- Verdict classes: `MATCH`, `NO_MATCH`, `UNVERIFIABLE`, and all deterministic consequence mappings.
- Duplicate/idempotency: duplicate market, resolution, claim, account index, cancellation, and withdrawal attempts.
- Accounting/value: payable metadata, zero/negative value rejection, pool conservation, dust assignment, credit transfer, partial/full withdrawal, and cancellation refunds.
- Direct-mode limitations: supplement mocked semantics with AST/metadata tests and bounded Studionet smoke/full lifecycle before any network claim.
- Frontend: adapter parsing, state/action selectors, wallet/network errors, write lifecycle, canonical refresh, precision, empty/error/loading, and desktop/mobile interaction.

## Claim-to-code matrix

| Product claim | Contract method/state | View/read | Direct test | Network evidence |
| --- | --- | --- | --- | --- |
| Terms are immutable | `create_market`; no update path | `get_market` | immutable/invalid configuration tests | Before/after funding market snapshot |
| Opposed native GEN funds one isolated pool | payable `fund_position`; keyed totals/positions | `get_market`, `get_position` | payable, side, value, and isolation tests | Two public wallet writes plus canonical totals |
| Validators inspect exact FDA label evidence | `resolve_market` bounded leader/validator | `get_attempt`, `get_market` | source bounds, injection, malicious-leader, semantic replay tests | Finalized resolution and allowlisted attempt fields |
| Unverifiable evidence pays neither side | `RETRYABLE`, `NO_SETTLEMENT` | `get_attempt`, `get_market`, positions | missing/contradictory/unavailable tests | Retryable smoke market if network permits |
| Final verdict selects winning side | `_settle_resolution` derived consequence | `get_market` | all verdict/consequence tests | Resolved state after finality |
| Winners receive the complete pool pro rata | `claim_credit` remaining-pool algorithm | position, credit, market | multi-winner conservation/dust tests | Winner credit plus remaining pool reads |
| Cancelled markets refund exact stakes | `cancel_unresolved`, `claim_credit` | market/position/credit | authorization/time/refund tests | Optional recovery evidence; otherwise honestly pending |
| Credits withdraw once | `withdraw_credit` debit-before-transfer | `get_credit`, summary | duplicate/partial/over-withdraw tests | Receipt projection and before/after balance |
| Frontend uses canonical state and real writes | adapter + wallet transaction controller | all public views | adapter/component tests | Browser capture of write, finality, and reread |

No important claim is complete until its network-evidence cell has a real artifact or is explicitly labeled pending.

## Analogue and differentiation matrix

| Analogue/prior idea | Similar dimensions | Structural difference | Collision decision |
| --- | --- | --- | --- |
| FilingTriggerCovenant | Official regulatory text, validator judgment, GEN consequence | Bilateral recurring SEC covenant/claim versus one FDA-facet multi-participant pooled settlement | Distinct |
| RecallBond | Public product evidence and semantic scope | Listing quarantine, seller/challenger bonds, and remedy versus opposed forecast sides and pro-rata pool | Distinct |
| TrustlessAgent/subjective escrow | Nondeterministic verdict moves escrow | Bilateral deliverable evidence versus many positions around public version-locked regulatory evidence | Distinct |
| Generic prediction market | YES/NO pool and resolution | Arbitrary questions/operator oracle versus fixed FDA identity/facet/source schema and validator-owned interpretation | Generic version rejected; bounded primitive selected |
| On-Chain Sentiment Oracle | Market-adjacent nondeterministic output | Advisory sentiment versus direct finalized collateral entitlement | Distinct |
| CampaignScoreRegistry | UI plus purported judgment record | Client-computed/write-only result versus onchain evidence evaluation, structured isolation, finality reads, and enforced value movement | Anti-pattern rejected |

## Deployment and evidence plan

- Network: Studionet only; never mix localnet/Asimov/Bradbury addresses or receipts.
- Actors/wallet separation: authorized primary wallet creates/funds one side; authorized integrator wallet funds the opposite side and may claim/withdraw if it wins.
- Deploy: bind dependency/API family and source commit; deploy one contract; save only allowlisted address/hash/status/timestamps/explorer fields.
- Consequential lifecycle: deploy -> create short-window demo market -> fund YES -> fund NO -> lock -> resolve from live FDA evidence -> wait finality -> reread winner/facets -> winning account claims credit -> withdraws -> reread credit/pool/balances.
- Failure/retry lifecycle: a separate official-host unavailable/identity-missing case may prove `RETRYABLE`; retry only after diagnosing transient versus structural failure.
- Canonical reads: market list/detail, both positions, attempt count/result, credit, and contract summary after each finalized boundary.
- Balance/receipt proof: before/after public balances and allowlisted normalized receipt fields; never store raw RPC/trace/node configuration.
- Evidence path: `docs/evidence/studionet/` with one active `deployment.json`, lifecycle manifest, safe snapshots, and archived superseded revisions.
- Resume/idempotency: scripts discover the active deployment and current market/attempt/credit before every write, recover finalized state, and never hardcode attempt `-1` or replay a completed step.

## Definition of Done

### Projects track

- [ ] One reusable semantic contract with a documented interface and no unjustified consumer.
- [ ] Full direct/adversarial/accounting tests and GenVM lint pass.
- [ ] Bounded live FDA semantic adjudication finalizes on Studionet.
- [ ] Two opposed public actors fund isolated positions with native GEN.
- [ ] Finalized outcome opens the correct credit and a withdrawal moves value exactly once.
- [ ] Frontend signs at least one real wallet write, shows submitted/accepted/finalized/failure/retry, and rereads canonical state.
- [ ] Desktop and mobile browser lifecycle evidence exists.
- [ ] Public repository, CI, deployed frontend, README, security report, and submission packet match current evidence.
- [ ] Primary UI contains only user-relevant data/actions; system/reviewer details remain hidden/contextual.

## Honest limitations

- This is a bounded FDA label interpretation and testnet forecasting product, not medical advice or a production market.
- Official-source availability, GenVM model behavior, validator consensus, wallet compatibility, and Studionet finality must be demonstrated per deployment; local/direct success is not network evidence.
- The creator can choose the public question before anyone funds it; users must review immutable terms. Validators remove outcome control, not poor-question risk.
- No finalized market can be appealed in v1; only `UNVERIFIABLE` attempts are retryable before the refund boundary.
- Legal, gambling, securities, medical-device, regulatory, security, and production readiness have not been reviewed.
- GitHub, CI, browser-wallet, Studionet, frontend hosting, adoption, and submission claims remain pending until their artifacts exist.

## Kill criteria

- Kill/redesign if current GenVM cannot safely fetch and independently classify the locked FDA sources with stable critical fields.
- Kill/redesign if a finalized verdict cannot control real native-GEN entitlement and withdrawal on Studionet.
- Kill/redesign if the frontend cannot sign real Studionet writes and reread canonical state without simulation.
- Kill/redesign if evidence must be supplied or pre-scored by a participant/backend, if source outages become `NO_MATCH`, or if terms can change after funding.
- Kill/redesign if the one-contract accounting cannot prove full-pool conservation, refundability, and duplicate-action prevention.
