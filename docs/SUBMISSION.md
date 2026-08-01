# Copy-ready submission packet

## Recommended category

Projects

## Title

LabelScope Market — Validator-Resolved FDA Label Scope Pools

## Notes / Description

LabelScope is a fully collateralized FDA label-scope market on GenLayer. Opposed YES/NO participants fund one immutable pool; neither the creator nor frontend can submit the outcome. Validators independently fetch a locked FDA approval notice and the exact openFDA label bound to application number, set ID, and effective date. They normalize seven indication facets plus source consistency and compare semantic meaning, not rationale wording. A finalized MATCH or NO_MATCH selects the winning side and opens pro-rata native-GEN credit; unavailable or contradictory evidence is non-settling and retryable. The reusable one-contract interface covers typed market creation, funding, resolution, claims, withdrawals, and canonical views. Sixty-eight automated tests pass. Studionet proves opposed funding, MATCH/WIN_YES consensus, retry/refund recovery, browser-wallet writes, a finalized external transfer, and canonical rereads. The production frontend uses the deployed contract.

Character count: `979`

## Evidence

- Repository: https://github.com/duclucky/labelscope-market-genlayer
- Primary contract explorer: https://explorer-studio.genlayer.com/address/0x9F623cd3703c76E123aD561630A6B72364559f5E
- Consumer/integration explorer: N/A — no separate consumer contract is justified.
- Lifecycle evidence: https://github.com/duclucky/labelscope-market-genlayer/blob/main/docs/evidence/studionet/lifecycle.json
- Browser-wallet evidence: https://github.com/duclucky/labelscope-market-genlayer/blob/main/docs/evidence/studionet/browser-wallet.json
- CI: https://github.com/duclucky/labelscope-market-genlayer/actions/workflows/check.yml
- Demo/frontend: https://labelscope-market-genlayer.vercel.app
- Frontend proof: OKX browser-wallet creation, funding, lock, resolve, retry, cancel, claim, withdrawal, failure handling, and canonical rereads are captured. Script-signed provisioning is labeled separately.

## Verified facts

- Contracts: 1 — `LabelScopeMarket`
- Public methods: 15 — 8 view, 7 write
- Automated tests: 68 passing, zero skip/xfail — 41 direct contract, 4 receipt parser, 8 Studionet script, 15 frontend
- Network: Studionet, chain ID 61999
- Lifecycle: two opposed actors funded 0.001 GEN each; validators finalized `MATCH`, `WIN_YES`; winner claimed and received 0.002 GEN; credit/liability ended at zero.

## Honest limitations / pending

Only Studionet and bounded FDA label-scope markets are proven. Hosted Studionet is
rate-limited and can temporarily delay reads or finality polling. No mainnet,
other testnet, adoption, medical, legal, gambling, securities, or
production-security claim is made. Portal submission confirmation is pending user
action; Codex did not click the final Submit button.

## Why this category

Projects is the correct category because the contribution is a deployed end-to-end
product: a reusable Intelligent Contract, real opposed-value lifecycle, injected
wallet adapter, and production canonical-state UI. It is not a Milestone because
this is the first submission of LabelScope, and narrowing to Intelligent Contracts
would omit the product integration being demonstrated.

## Required short report

**Project name:** LabelScope Market

**Description:** LabelScope settles collateralized FDA label-scope markets through independent validator interpretation, removing the operator from outcome control.

**GitHub (public):** https://github.com/duclucky/labelscope-market-genlayer

**Live app:** https://labelscope-market-genlayer.vercel.app

**Contract (studionet):** 0x9F623cd3703c76E123aD561630A6B72364559f5E
