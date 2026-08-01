# LabelScope Market

**Stake on the exact FDA label, not a headline.** LabelScope is a fully
collateralized GenLayer market where opposed participants fund YES and NO, then
validators independently interpret exact FDA approval and openFDA label evidence.
The finalized semantic verdict selects the winning side and controls pro-rata
native-GEN credit.

## Live App

[https://labelscope-market-genlayer.vercel.app](https://labelscope-market-genlayer.vercel.app)

The production app reads canonical Studionet state and signs real writes through
an injected wallet. The active revision was verified in Chrome for wallet
restoration, canonical reads, search/filter, market detail, positions, a
reloadable shared-market deep link, market creation, payable funding, rejected
value credit, and credit withdrawal. A prior revision retains separate evidence
for the complete browser-signed resolution/recovery action set; no balances,
signatures, or finality are simulated.

## Deployed Contract

- Network: GenLayer Studionet, chain ID `61999`
- Contract: [`0xAb9d047c35c44Ac8D0fc7eC73C478EdbFb36a39d`](https://explorer-studio.genlayer.com/address/0xAb9d047c35c44Ac8D0fc7eC73C478EdbFb36a39d)
- Deploy transaction: [`0xf8acc52d936e7db99c7a2a60d2b3734097b4fecea207b56b7723cf9904eb0655`](https://explorer-studio.genlayer.com/tx/0xf8acc52d936e7db99c7a2a60d2b3734097b4fecea207b56b7723cf9904eb0655)
- Deployed contract source commit: `565ad7bb2518647e555e6caee869ac7245ae5fa7`
- Depends/API family: `py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6`

## Why GenLayer

An ordinary database, EVM contract, or operator LLM can store a result, but it
cannot remove the operator from interpreting natural-language indication scope.
LabelScope puts the judgment inside GenVM: validators independently fetch two
bounded authoritative sources, normalize seven semantic facets plus source
consistency, and compare only consensus-critical meaning. The client never
submits a score or verdict.

## Architecture

- `LabelScopeMarket`: the only Intelligent Contract; owns immutable terms,
  isolated positions, live evidence evaluation, append-only attempts, settlement,
  credits, and external GEN withdrawal.
- React/Vite frontend: preserves the supplied scientific-market design and exposes
  only canonical market data, the connected user's position, and currently legal
  actions.
- FDA evidence: one locked FDA approval URL plus one exact openFDA record bound to
  application number, set ID, and effective date.
- Failure policy: missing, malformed, unavailable, contradictory, or incomplete
  evidence becomes `RETRYABLE`; it cannot select a winning side.

The complete state model, public interface, equivalence rules, threat model, and
claim-to-code matrix are in [docs/README.md](docs/README.md).

## Verified Studionet Lifecycle

Two public actors each funded `0.001 GEN` on opposite sides of
`jideytro-20260722-ab9d047c`. The market finalized `RESOLVED_YES` with `MATCH` and
`WIN_YES`. All required facets matched, combination therapy was `NOT_REQUIRED`,
and the sources were `CONSISTENT`. The winner claimed `0.002 GEN`; both the parent
withdrawal and bound external child finalized. At the recorded lifecycle snapshot,
credit and contract liability were both `0`. Subsequent browser QA writes are
recorded separately and do not change that historical lifecycle result. A
deliberately invalid payable funding call also finalized without trapping value:
the full `0.001 GEN` became sender credit and was withdrawn through a separately
verified external child.

- [Active deployment evidence](docs/evidence/studionet/deployment.json)
- [Consequential lifecycle evidence](docs/evidence/studionet/lifecycle.json)
- [Browser-wallet lifecycle evidence](docs/evidence/studionet/browser-wallet.json)
- [Evidence guide and transaction index](docs/evidence/studionet/README.md)
- [Frozen surplus revision](docs/evidence/studionet/archive/0x9f623cd3703c76e123ad561630a6b72364559f5e/deployment.json)
- [Superseded revision and negative payout evidence](docs/evidence/studionet/archive/0xd36f45d6d878bf1adc2346614919c659c8d08f7f/deployment.json)

The archives are intentionally public. One revision proved that parent finality
alone is insufficient when its IC-to-EOA child failed. The later frozen revision
proved a payable-revert surplus that cannot be recovered because no upgrader,
admin, or sweep path exists. The active revision credits positive rejected value
to the sender and verifies both rejection and withdrawal.

## Verification

Prerequisites: Python 3.12 and Node.js 22.

```powershell
py -3.12 -m venv .venv
.venv\Scripts\python.exe -m pip install -r requirements.txt
npm ci
npm run check
```

`npm run check` currently passes GenVM lint/semantic validation, 49 direct
contract tests, 4 receipt-parser tests, 14 Studionet-script tests, 23 frontend
tests, TypeScript, and the Vite production build: **90 automated tests, zero
skip/xfail**.

[GitHub Actions](https://github.com/duclucky/labelscope-market-genlayer/actions/workflows/check.yml)
runs the same gate on Windows with Python 3.12 and Node 22.

## Run the Frontend

```powershell
npm ci
npm run dev
```

`frontend/labelscope/.env.example` contains the public active contract address.
Frontend environment variables are public; never place a wallet key in them.

## Studionet Operations

The project loads secret keys from the ignored project `.env`, then the authorized
parent `.env`, without printing values. Commands are resumable and default to a
read-only inspection:

```powershell
npm run studionet:inspect
npm run studionet:deploy
npm run studionet:lifecycle
```

Receipts are reduced to a public allowlist. Raw RPC payloads, traces, validator
configuration, stdout, stderr, and wallet material are never saved.

## Honest Limitations

- Projects track is recommended because the deployed product combines the
  reusable contract with a canonical-state frontend. Script-signed and
  browser-wallet Studionet writes, production reads, retry/refund recovery, and
  an external browser-wallet withdrawal are evidenced separately.
- Studionet is test infrastructure. No mainnet, Asimov, Bradbury, adoption,
  production-security, legal, gambling, securities, or medical-readiness claim is
  made.
- Hosted Studionet is rate-limited. The frontend retries bounded transient
  capacity/network failures and reports quota exhaustion without exposing raw RPC
  details; this does not turn local or cached state into canonical state.
- The installed OKX version exposes two transaction paths: EIP-6963 is required
  for `create_market`, while subsequent writes require `window.okxwallet`. The
  frontend routes by action and the active revision now has finalized browser
  create, payable fund, rejected-value credit, and withdrawal evidence. The prior
  revision remains the evidence source for the full resolve/retry/cancel/claim set.
- LabelScope is a narrow forecasting primitive, not medical advice. It supports
  only locked FDA label-scope markets, not arbitrary questions or sources.
- V1 has retry/refund recovery for unverifiable evidence but no appeal after a
  finalized `MATCH` or `NO_MATCH`.
