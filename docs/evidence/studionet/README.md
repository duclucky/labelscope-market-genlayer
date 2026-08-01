# Studionet evidence

This directory contains only public, allowlisted evidence for chain ID `61999`.
It does not contain raw receipts, traces, validator configuration, stdout, stderr,
or wallet material.

## Active revision

- Contract: `0xAb9d047c35c44Ac8D0fc7eC73C478EdbFb36a39d`
- Deploy: `0xf8acc52d936e7db99c7a2a60d2b3734097b4fecea207b56b7723cf9904eb0655`
- Market: `jideytro-20260722-ab9d047c`
- Final state: `RESOLVED_YES`, `MATCH`, `WIN_YES`
- Pool: `2000000000000000 wei`; final credit and liability: `0`
- External transfer child: `0x6db0b915da3fa065d294b2b00f99dc5708f5aa6ac785669c5258d99bfa8cf389`
- Winner balance delta: `2000000000000000 wei`
- Rejected payable value: `1000000000000000 wei`, credited in full and withdrawn

`deployment.json` binds network, source commit, contract hash, Depends runner,
deployer, address, transaction, finality, and initial canonical state.
`lifecycle.json` records each public actor/action/hash, accepted/finalized timing,
the normalized adjudication attempt, settlement state, external child, and balance
proof.

## Browser-wallet evidence

`browser-wallet.json` records an OKX-injected-wallet session against the former
production contract. The browser wallet created and funded markets, observed a
rejected write without canonical mutation, and signed lock, resolve, retry,
cancel, claim, and withdrawal actions. The main browser lifecycle finalized
`RESOLVED_YES / MATCH / WIN_YES`; its withdrawal child transferred
`2000000000000000 wei` to the connected wallet and left that market's pool and
wallet credit at zero. A separate missing-source lifecycle produced two
`UNVERIFIABLE / NO_SETTLEMENT` attempts before `CANCELLED_REFUND` and an exact
stake credit.

Provisioning actions signed by the authorized scripts are labeled separately;
they are not represented as browser-wallet proof. The file contains only public
transaction hashes and allowlisted canonical fields.

The current production deployment `dpl_3G3UgZCuZ42eaFcSfwxBPShFcwx7` was verified
against the active contract for wallet restoration, canonical market/position
reads, filtering, direct market deep-link reload, and clipboard sharing. Two
active-revision create attempts were rejected by OKX without a confirmation popup,
so they produced no transaction hash or canonical mutation and are not claimed as
successful browser writes.

## Superseded revision

`archive/0xd36.../` is retained as negative evidence. Its withdrawal parent
finalized, but the child used an IC message boundary for an EOA and finalized
`ERROR`. The revision was archived only after canonical liability and contract
balance both read `0`. The failed child value was not automatically returned and
is not counted as a successful consequence.

`archive/0x9f623.../` records the frozen prior revision whose invalid payable call
left `1000000000000000 wei` outside canonical liability. It has no admin, upgrader,
or sweep method, so the surplus is explicitly classified as unrecoverable test
value rather than concealed or replayed.
