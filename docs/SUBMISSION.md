# Copy-ready submission packet

## Recommended category

Projects

## Title

LabelScope Market — Validator-Resolved FDA Label Scope Pools

## Notes / Description

LabelScope is a fully collateralized FDA label-scope market on GenLayer. Opposed YES/NO participants fund one immutable pool; neither the creator nor frontend can submit the outcome. Validators independently fetch a locked FDA notice and exact openFDA label bound to application, set ID, and effective date. They normalize seven indication facets plus source consistency and compare semantic meaning, not rationale prose. MATCH or NO_MATCH selects the winning side and opens pro-rata native-GEN credit; unavailable or contradictory evidence is non-settling and retryable. Rejected positive funding value becomes withdrawable sender credit instead of trapped surplus. The reusable single contract covers typed creation, funding, resolution, claims, withdrawals, and canonical views. Ninety tests pass. Studionet proves rejection refund safety, opposed funding, MATCH/WIN_YES consensus, two finalized external transfers, and zero final liability. Active production OKX writes finalized.

Character count: `984`

## Evidence

- Repository: https://github.com/duclucky/labelscope-market-genlayer
- Primary contract explorer: https://explorer-studio.genlayer.com/address/0xAb9d047c35c44Ac8D0fc7eC73C478EdbFb36a39d
- Consumer/integration explorer: N/A — no separate consumer contract is justified.
- Lifecycle evidence: https://github.com/duclucky/labelscope-market-genlayer/blob/main/docs/evidence/studionet/lifecycle.json
- Browser-wallet evidence: https://github.com/duclucky/labelscope-market-genlayer/blob/main/docs/evidence/studionet/browser-wallet.json
- Successful CI: https://github.com/duclucky/labelscope-market-genlayer/actions/runs/30704502349
- Demo/frontend: https://labelscope-market-genlayer.vercel.app
- Frontend proof: the active production deployment restores the OKX account, reads canonical markets/positions, search, detail, and reloadable share links, and finalized active-revision browser create, payable fund, rejected-value credit, and withdrawal transactions. The full resolve/retry/cancel/claim set is preserved on the explicitly superseded revision.

## Verified facts

- Contracts: 1 — `LabelScopeMarket`
- Public methods: 15 — 8 view, 7 write
- Automated tests: 90 passing, zero skip/xfail — 49 direct contract, 4 receipt parser, 14 Studionet script, 23 frontend
- Network: Studionet, chain ID 61999
- Lifecycle: an invalid 0.001 GEN payable action credited and returned the full amount; two opposed actors then funded 0.001 GEN each; validators finalized `MATCH`, `WIN_YES`; the winner claimed and received 0.002 GEN; credit/liability and contract balance ended at zero.

## Honest limitations / pending

Only Studionet and bounded FDA label-scope markets are proven. Hosted Studionet is
rate-limited and can temporarily delay reads or finality polling. No mainnet,
other testnet, adoption, medical, legal, gambling, securities, or
production-security claim is made. Portal submission confirmation is pending user
action; Codex did not click the final Submit button.
The prior revision remains the browser evidence source for resolve, retry,
cancel, and claim; active-revision browser evidence covers create, payable fund,
rejected-value credit, and withdrawal.

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

**Contract (studionet):** 0xAb9d047c35c44Ac8D0fc7eC73C478EdbFb36a39d
