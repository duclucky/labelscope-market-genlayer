# LabelScope build postmortem

Date: 2026-08-01

## What validated

- One typed contract was sufficient for evidence policy, opposed pool ownership,
  semantic resolution, credit accounting, and the user-facing consequence.
- GenVM validators fetched the exact FDA approval notice and matching openFDA label
  record. One attempt finalized with every required facet `MATCH`, source
  consistency `CONSISTENT`, and deterministic `MATCH -> WIN_YES` settlement.
- Two public actors funded opposite sides; claim, parent withdrawal, external
  child, balance delta, and zero final liability were proven on Studionet.
- The returned frontend could be preserved visually while replacing mock state,
  fake assets, timers, and offchain AI with a small canonical adapter.

## Findings that changed the build

1. `FINALIZED` was not enough. Current Studionet receipts sometimes expose
   execution through the allowlisted leader `SUCCESS` field rather than the SDK's
   normalized `txExecutionResultName`.
2. Deployment/demo arguments must reuse contract enums. An early create call used
   a UI concept as a category and correctly finalized `ERROR`; it was not counted.
3. `gl.get_contract_at(...).emit_transfer` targets another Intelligent Contract.
   The first EOA payout child failed. Current official docs require an
   `@gl.evm.contract_interface` recipient for external EOA value.
4. An external child may have no GenVM execution-result field. Its proof is final
   status, exact sender/recipient/value binding, absence of an explicit error, and
   the recipient balance delta.
5. Browser-wallet evidence cannot be inferred from script signing. The installed
   OKX Wallet did not connect, so that proof remains explicitly pending.

## New anti-pattern

Reject any value-transfer claim that ends at the parent transaction. A successful
parent ledger debit can coexist with a failed child and no recipient balance
increase. Evidence must follow the child at the correct IC/external boundary and
read the final balance.
