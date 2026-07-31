# LabelScope Market — Stage 1 product and frontend blueprint

## Identity

- Idea ID: `IDEA-007`
- Project name: `LabelScope Market`
- Project slug: `labelscope-market`
- Category: `Projects`
- Status: `SELECTED`
- Repository: local child repository; public remote is intentionally deferred until the publication phase
- Target network: `studionet`

## One-sentence product hook

**Stake on the exact FDA label—not a headline—and let independent validators decide which side the official indication language actually supports.**

## Scope

### In scope

- Fully collateralized binary forecast pools about one exact FDA label-scope predicate.
- Typed indication facets: condition, biomarker, patient population, disease stage, prior-therapy context, combination requirement, and approval class.
- Opposed YES and NO positions funded with native GEN on studionet.
- Validator-controlled `MATCH`, `NO_MATCH`, or `UNVERIFIABLE` resolution from bounded official FDA sources.
- Pro-rata winner credit, retryable evidence failure, cancellation/refund recovery, and canonical portfolio reads.
- A responsive wallet-enabled product for creating, funding, resolving, and claiming positions.

### Out of scope

- Medical advice, treatment recommendations, safety or efficacy scoring, patient-specific decisions, or claims that a drug should be used.
- Arbitrary websites, user-uploaded evidence, private trial data, news/social sources, or a generic natural-language prediction oracle.
- Trading order books, leverage, derivatives, secondary-market transfers, dynamic odds, or real-money/mainnet claims.
- Legal, gambling, securities, health-regulatory, or production-readiness claims.
- A backend or frontend that calculates the canonical verdict.

## Provisional contract-capability sketch

This sketch exists only to keep the frontend honest. Phase 4 will finalize storage, method names, evidence authentication, equivalence, accounting, and legal transitions after the returned frontend is audited.

### Human roles

- **Market creator:** publishes a bounded FDA question and source anchors before any position exists; cannot edit terms after the first stake.
- **Forecaster:** reviews the exact semantic predicate, funds YES or NO, follows resolution finality, and claims winner credit or a permitted refund.
- **Resolver:** any eligible participant can request adjudication after the market locks; this role receives no outcome-dependent authority.

### User-visible capabilities

| Capability | User-visible outcome | Minimum canonical read |
| --- | --- | --- |
| Create a market | A draft/open market with immutable question facets, source identity, close time, and resolution time | Market terms, creator, status, deadlines |
| Fund YES or NO | A canonical position and updated collateral totals after transaction finality | User position, side totals, total pool |
| Request resolution | A submitted transaction followed by accepted/decided/finalized or failed/retry feedback | Current attempt, lifecycle status, market status |
| Retry resolution | A new append-only attempt after an unverifiable/source-failure outcome | Retry eligibility and current attempt identity |
| Cancel for refund | A recovery path only after the configured unresolved grace period | Cancellation eligibility and refundable amount |
| Claim payout/refund | Withdrawable credit is transferred once and the position becomes claimed | Claimable credit, claimed flag, market accounting |
| Browse/inspect | Users can independently see exact terms, official source links, pool state, resolution summary, and their own position | Market list/detail and portfolio views |

### Meaningful product states

`DRAFT`, `OPEN`, `LOCKED`, `RESOLUTION_PENDING`, `RETRYABLE`, `RESOLVED_YES`, `RESOLVED_NO`, `CANCELLED_REFUND`, and `CLAIMED`.

`UNVERIFIABLE` is an attempt outcome, not a paid winner. Wallet approval and transaction submission are not success. The interface reports success only after finality and a canonical state reload.

### Value, finality, and recovery expectations

- Position funding and market creation are state-changing wallet transactions on studionet.
- A resolution request may remain submitted, accepted/decided, or awaiting finality for minutes.
- Winner selection and credits appear only after the resolution transaction is finalized and the market is re-read.
- Failed or undetermined resolution never fabricates a winner and exposes retry only when canonical state allows it.
- Cancellation/refund appears only after the unresolved grace window and only to eligible accounts.
- Claim is idempotent; after successful finality the action disappears and the canonical claimed amount remains visible.

## Product/frontend blueprint

### Human users and jobs

| User/role | Primary job | Decision or outcome needed |
| --- | --- | --- |
| Forecaster | Find a precisely worded market, understand what must match, fund one side, and later claim | Is the question unambiguous, what is my exposure, what did validators finalize, and what can I do now? |
| Market creator | Publish a bounded FDA label-scope question without creating an impossible or generic oracle request | Are all required facets/source identifiers valid, and when do terms become immutable? |
| Eligible resolver | Start or retry resolution after the deadline | Is resolution legal now, which official sources will validators inspect, and what recovery follows failure? |

### Information architecture

Use four routes within one compact application shell: `Markets`, `Market detail`, `Create market`, and `My positions`. Do not add a landing-only route, admin console, validator dashboard, reviewer page, token page, or generic analytics area.

| Screen/view | User purpose | Primary action | Required data and states | Mobile behavior |
| --- | --- | --- | --- | --- |
| Markets | Discover relevant open, locked, retryable, and resolved pools | Open a market; secondary `Create market` for connected users | Search/filter, exact short question, status label, close/resolution time, YES/NO collateral totals, empty/loading/error | Single-column cards, persistent filter sheet, no horizontal tables |
| Market detail | Understand the locked predicate and take the one legal next action | Fund YES/NO while open; otherwise request/retry resolution or claim when eligible | Facet checklist, FDA source anchors, pool totals, user's position, status timeline, final semantic outcome, submitted/accepted/finalized/failed/retry | Sticky bottom action area with 44px+ targets; evidence and technical verification collapse below the decision summary |
| Create market | Compose a bounded typed question | Review and create | Exact product/application identifiers, seven optional/required facet controls, deadlines, validation, review summary, wallet/network/error/submitted/finalized | One-column progressive form; labels never rely on placeholders; numeric fields use suitable mobile keyboards |
| My positions | See exposure and collect available value | Claim payout/refund where legal | Position side/stake, market status, claimable amount, pending/claimed state, empty/loading/error | Group by action needed; cards replace dense portfolio tables |

### Visibility matrix

| Function/data group | Visibility | Eligible role/state | User need or reason hidden |
| --- | --- | --- | --- |
| Market question, locked facets, FDA source labels/links, close/resolution times | `USER_PRIMARY` | Everyone | Required to understand what is being resolved |
| YES/NO collateral totals and user's funded position | `USER_PRIMARY` | Everyone; own amount when connected | Required to evaluate exposure and act |
| Fund YES/NO | `USER_PRIMARY` | Connected forecaster; `OPEN` | Core product action |
| Final outcome, matched/unmatched facets, payout/refund consequence | `USER_PRIMARY` | Everyone after finalization | Explains why value moved and what happens next |
| Transaction lifecycle and actionable failure/retry copy | `USER_PRIMARY` | Transaction initiator | Prevents submission from being mistaken for finality |
| Create market | `USER_PRIMARY` | Connected user | Required organizer workflow |
| Request/retry resolution | `USER_CONTEXTUAL` | Eligible participant; `LOCKED` or `RETRYABLE` | Appears only when legal and useful |
| Cancel unresolved market | `USER_CONTEXTUAL` | Authorized creator/participant after grace period | Recovery action, not normal flow |
| Claim payout/refund | `USER_CONTEXTUAL` | Connected account with positive canonical credit | Appears only when value is claimable |
| Full FDA URLs, application/set identifiers, explorer link | `USER_CONTEXTUAL` | Everyone via `Verify official evidence` disclosure | Useful for verification but too technical for the primary decision surface |
| Raw contract enums, attempt IDs, receipt internals, validator identities/configuration, prompt text, storage keys, claim-to-code/test/submission data | `SYSTEM_ONLY` | Never in primary UI | Internal/reviewer data does not help a user complete a job |
| Fixture labels and mock balances | `SYSTEM_ONLY` | Development only | Must never appear as live or canonical state |

### UI action matrix

| Visible control | Provisional contract capability | Eligible role | Legal state | Input/value | Expected finality | Failure/recovery |
| --- | --- | --- | --- | --- | --- | --- |
| Create market | `create_market(terms)` | Connected creator | New | Typed terms; any required creation value finalized in Phase 4 | Finalized before market is shown as open | Preserve form, show semantic error, allow resubmit only if no market was created |
| Fund YES | `fund_position(market_id, YES)` | Connected forecaster | `OPEN` | Native GEN stake | Finalized then reload market/position | Rejected/failed keeps prior canonical totals; retry is user-initiated |
| Fund NO | `fund_position(market_id, NO)` | Connected forecaster | `OPEN` | Native GEN stake | Finalized then reload market/position | Same as YES |
| Request resolution | `request_resolution(market_id)` | Eligible participant | `LOCKED` | No verdict input; exact market ID only | Show submitted -> accepted/decided -> finalized | Failure shows reason; undetermined/unverifiable never shows a winner |
| Retry resolution | `retry_resolution(market_id)` | Eligible participant | `RETRYABLE` | Current canonical attempt inferred by adapter | Finalized then reload attempt/market | Keep append-only attempt history; never hardcode attempt 1 |
| Cancel and enable refunds | `cancel_unresolved(market_id)` | Authorized actor | Retry/grace conditions met | Market ID | Finalized | If unauthorized or too early, retain state and explain eligibility |
| Claim | `claim_credit(market_id)` | Position owner with credit | Resolved or cancelled; unclaimed | No amount entered by user | Finalized transfer plus canonical claimed read | Prevent double claim; failure leaves canonical credit available |
| Connect / switch wallet | Wallet adapter | Any user | Any | Selected injected EIP-1193 provider | Connection and correct-chain confirmation, not a contract tx | Offer provider choice; add/switch studionet; explain missing/funded-wallet requirements |

### User-facing state language

| Canonical status/outcome | User-facing label | User consequence/next step |
| --- | --- | --- |
| `DRAFT` | Draft question | Complete and review the locked FDA scope before publishing. |
| `OPEN` | Funding open | Review the exact terms, then fund YES or NO. |
| `LOCKED` | Funding closed | Positions are fixed; wait for or request resolution when eligible. |
| `RESOLUTION_PENDING` | Validators reviewing FDA evidence | No winner exists yet; keep this view open or return later. |
| Accepted/decided but not finalized | Decision reached, awaiting finality | Treat the displayed direction as provisional; no payout is claimable. |
| `RETRYABLE` / `UNVERIFIABLE` attempt | Official evidence could not be verified | No side won; retry or wait for the refund recovery window. |
| `RESOLVED_YES` | FDA label matches the locked scope | YES positions can claim their canonical share. |
| `RESOLVED_NO` | FDA label does not match the locked scope | NO positions can claim their canonical share. |
| `CANCELLED_REFUND` | Market cancelled — refunds available | Each participant can reclaim the eligible canonical amount. |
| `CLAIMED` | Funds claimed | Show the settled amount and explorer link; hide the claim action. |
| Transaction rejected/failed | Transaction did not complete | Canonical state is unchanged; show the reason and safe retry path. |

### Wallet, network, and transaction feedback

- Discover injected providers, prefer EIP-6963, and let users choose when multiple wallets exist.
- Restore an already authorized connection without forcing a permission prompt on every reload.
- Require studionet and use the SDK chain definition; never hardcode another network or simulate funding.
- Show connected account truncation, network state, and a clear unfunded-wallet message without inventing a balance or fee.
- Every write uses a compact progress sequence: wallet approval, submitted, accepted/decided, finalized, then canonical reload.
- A transaction hash is optional verification context, never the success message.

### Visual direction and preservation constraints

- Build a credible scientific forecast product, not a casino, contract explorer, hospital dashboard, or marketing landing page.
- Use a light evidence-led palette: sky/knowledge blue, deep navy text, white cards, and restrained emerald for claimable/finalized actions. YES and NO must also use text/icons/patterns so meaning never depends on green/red alone.
- Prefer `Lexend` for headings and `Source Sans 3` for body/UI text; minimum 16px body, 1.5 line height, 4.5:1 text contrast.
- Use compact editorial cards, facet checklists, a restrained status timeline, thin borders, generous whitespace, and Lucide-style SVG icons. No emoji icons, glassmorphism, neon gradients, fake market charts, or decorative medical imagery.
- Motion is limited to 150–300ms state feedback and subtle list/card transitions; respect `prefers-reduced-motion` and avoid layout-shifting animation.
- All controls are keyboard reachable, have visible focus, accessible names, inline errors announced with `aria-live`/`role=alert`, and touch targets at least 44x44px.
- After the frontend handoff, preserve its established palette, typography, component language, navigation, and overall page arrangement. Stage 2 may make only the smallest functional/accessibility corrections needed to match canonical actions and states.
- System/reviewer details excluded from the primary UI: raw enums/storage, prompt/equivalence internals, validator identities, full attempt/receipt payloads, test matrices, deployment evidence, submission claims, and fixture controls.

## Stage boundary and honest limitations

Completed now: current-source research, collision screen, mandatory idea gates, live FDA HTTP/API probes, product scope, provisional capability map, and frontend blueprint.

Not completed or claimed: contract specification/source, tests, GenVM lint, Studionet deployment, transaction hashes, validator verdict, value transfer, public GitHub remote, CI, browser-wallet lifecycle, Vercel deployment, external adoption, legal review, or production medical/financial use.

Stage 2 will complete the remaining specification only after the user-created frontend is returned and audited. The project must remain `SELECTED` until that full-spec gate passes.
