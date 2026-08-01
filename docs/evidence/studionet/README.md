# Studionet evidence

This directory contains only public, allowlisted evidence for chain ID `61999`.
It does not contain raw receipts, traces, validator configuration, stdout, stderr,
or wallet material.

## Active revision

- Contract: `0x9F623cd3703c76E123aD561630A6B72364559f5E`
- Deploy: `0xc45f31813f32da6fa5c22aaacb98a873ebb3d8ecb23d0d45b02830e48ec4e808`
- Market: `jideytro-20260722-9f623cd3`
- Final state: `RESOLVED_YES`, `MATCH`, `WIN_YES`
- Pool: `2000000000000000 wei`; final credit and liability: `0`
- External transfer child: `0x6c900fa178c9f37cfa441631b2163bec6c2714c097a810cc99d1bc0c6362bc1a`
- Winner balance delta: `2000000000000000 wei`

`deployment.json` binds network, source commit, contract hash, Depends runner,
deployer, address, transaction, finality, and initial canonical state.
`lifecycle.json` records each public actor/action/hash, accepted/finalized timing,
the normalized adjudication attempt, settlement state, external child, and balance
proof.

## Browser-wallet evidence

`browser-wallet.json` records an OKX-injected-wallet session against the active
production frontend. The browser wallet created and funded markets, observed a
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

## Superseded revision

`archive/0xd36.../` is retained as negative evidence. Its withdrawal parent
finalized, but the child used an IC message boundary for an EOA and finalized
`ERROR`. The revision was archived only after canonical liability and contract
balance both read `0`. The failed child value was not automatically returned and
is not counted as a successful consequence.
