# Frontend audit - Stage 2 Phase 3B

Audited: 2026-08-01

App root: `frontend/labelscope`

## Baseline evidence

- The returned React 19/Vite frontend installed successfully with no reported package vulnerability.
- Baseline `npm run lint` passed.
- Baseline `npm run build` passed.
- Direct browser inspection covered the default desktop viewport and 390x844 mobile viewport.
- Markets, market detail, create-market, mobile navigation, filters, cards, and sticky mobile actions rendered successfully.

These checks establish only the returned frontend baseline. They are not contract integration, Studionet, wallet, or deployment evidence.

## Preserve

- Light scientific palette, Lexend/Source Sans typography, restrained indigo/emerald accents, and white editorial cards.
- Desktop sidebar plus compact top navigation; mobile header/drawer.
- Markets discovery hierarchy, search/status/category filters, bento-style cards, and single-column mobile layout.
- Market detail ordering: question, locked facets, official sources, pool/action card, and lifecycle.
- Three-step create-market wizard, portfolio summary/cards, rounded component language, and mobile sticky funding actions.

## Required functional corrections

| Finding | Why it cannot ship | Required correction |
| --- | --- | --- |
| All markets, positions, wallet balances, claims, and funding are React mock state | Misrepresents canonical contract state and value | Replace with a typed GenLayer adapter and canonical views; fixtures only in tests |
| UI claims USDC, Arbitrum, minting, institutional verification, and multisig/oracle behavior | None exists in the project architecture | Use native GEN/Studionet and remove unsupported identity/network/protocol claims |
| Wallet starts connected to a fake address and can top up locally | Simulates signatures and balances | Start disconnected; discover real EIP-1193 providers; read the public account balance |
| Funding/claiming uses timers and mutates arrays | Treats animation as blockchain finality | Use wallet writes, receipt lifecycle, finalization wait, and canonical reread |
| Gemini backend/fallback produces invented statistics and probability claims | Moves judgment offchain and risks misleading health/regulatory content | Remove Gemini, server endpoint, package, metadata capability, and AI evidence panel |
| Settings/profile screen exposes fake credentials and RPC/protocol language | It is a technical/fictional surface unrelated to a user job | Remove the route and navigation item |
| Creation includes two fake seed pools in one action | One native-value transaction cannot seed two sides and creation is nonpayable | Create immutable terms first; fund a side through the normal payable action |
| Hard-coded 2024 markets and resolution dates | Stale data appears live in 2026 | Load deployed contract markets; use explicit empty/loading/error states before deployment |
| Dynamic odds and return estimates are based on mutable mock pools | Precision and payout semantics do not match the contract | Show collateral totals and a clearly labeled current pro-rata estimate from bigint-safe data |
| No `RETRYABLE`, cancelled/refund, accepted/finalized/failure, or canonical refresh flow | Projects lifecycle is incomplete | Add contextual legal actions and one compact transaction-status surface |
| Detail navigation preserves prior scroll position | Mobile detail can open mid-page | Scroll to the top on view/market changes and verify on desktop/mobile |
| Clickable headings are not semantic controls and modal close buttons lack explicit labels | Keyboard/screen-reader behavior is incomplete | Use buttons/links or accessible labels while preserving appearance |
| Duplicate navigation exists on desktop | It consumes space but is part of the established layout | Preserve initially; remove only if integration makes it materially obstructive |

## User-only surface rule

The production UI may show exact terms, official sources, pool totals, own position, status, final facet outcome, value consequence, wallet/network state, and the next legal action. Raw storage, validator identities/configuration, prompts, equivalence internals, receipts, deployment evidence, test data, and submission material remain outside the primary interface.

## Phase 3B decision

The frontend is accepted as the visual foundation. It will not be rebuilt. Integration work is limited to the corrections above and the smallest accessibility/responsive changes required by the finalized contract interface.

## Phase 7 implementation result

- Preserved the audited hierarchy and responsive layout; rechecked desktop and 390x844 mobile views.
- Replaced fixture state with canonical contract reads and explicit empty/loading/error states.
- Added EIP-6963 wallet discovery with injected-provider fallback, Studionet switching from the official chain definition, and silent restoration through `eth_accounts` only.
- Added submitted, accepted, finalized, failed, canonical refresh, retry, cancellation, claim-credit, and withdrawal paths.
- Removed fake wallet/balance/mint/profile/settings behavior, Gemini/server code, stale markets, and unsupported USDC/Arbitrum claims.
- Locked the default demo identity to the matching FDA/openFDA Jideytro record: `NDA220185`, set ID `3760e421-b523-4d9b-e063-6394a90ab94b`, effective time `20260722`.

Local proof: TypeScript passed, 7 focused frontend tests passed, and the Vite production build completed. Studionet/browser-wallet write proof remains pending Phase 8/9 evidence.
