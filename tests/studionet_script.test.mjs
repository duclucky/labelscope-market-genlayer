import assert from 'node:assert/strict';
import test from 'node:test';
import { abi } from 'genlayer-js';

import {
  assertArchivable,
  assertExternalTransferReceipt,
  assertFundingRejection,
  assertSuccessfulReceipt,
  buildArchiveDeploymentRecord,
  buildMarketArgs,
  executionResultFromReceipt,
  extractContractAddress,
  decodeGenVmReturn,
  parseEnvText,
  safeReceipt,
  selectRecordedAction,
  selectMarketId,
  KNOWN_UNRECOVERABLE_SURPLUS,
} from '../scripts/studionet.mjs';

function receiptWithReturn(value) {
  const payload = abi.calldata.encode(value);
  const bytes = new Uint8Array(payload.length + 1);
  bytes[0] = 0;
  bytes.set(payload, 1);
  return {
    statusName: 'FINALIZED',
    consensus_data: {
      leader_receipt: [
        {
          execution_result: 'SUCCESS',
          result: Buffer.from(bytes).toString('base64'),
        },
      ],
    },
  };
}

test('parseEnvText accepts ordinary dotenv lines without expanding or logging values', () => {
  assert.deepEqual(parseEnvText('A=one\n# comment\nB="two words"\nINVALID\n'), {
    A: 'one',
    B: 'two words',
  });
});

test('safeReceipt exposes only public transaction evidence', () => {
  const receipt = {
    hash: '0xabc',
    statusName: 'FINALIZED',
    txExecutionResultName: 'FINISHED_WITH_RETURN',
    txDataDecoded: { contractAddress: '0x1111111111111111111111111111111111111111', code: 'secret-ish' },
    consensus_data: { validators: [{ node_config: { private: 'never expose' } }] },
  };

  assert.deepEqual(safeReceipt(receipt), {
    txHash: '0xabc',
    status: 'FINALIZED',
    executionResult: 'FINISHED_WITH_RETURN',
    contractAddress: '0x1111111111111111111111111111111111111111',
  });
});

test('current Studio receipt proves execution through the allowlisted leader result', () => {
  const receipt = {
    statusName: 'FINALIZED',
    result: 6,
    consensus_data: {
      leader_receipt: [{ execution_result: 'SUCCESS', node_config: { private: 'never expose' } }],
    },
  };

  assert.equal(executionResultFromReceipt(receipt), 'SUCCESS');
  assert.doesNotThrow(() => assertSuccessfulReceipt(receipt, 'deploy'));
  assert.throws(
    () => assertSuccessfulReceipt({ statusName: 'FINALIZED' }, 'deploy'),
    /without successful execution/,
  );
});

test('extractContractAddress handles both SDK and Studio decoded shapes', () => {
  assert.equal(
    extractContractAddress({ txDataDecoded: { contractAddress: '0x2222222222222222222222222222222222222222' } }),
    '0x2222222222222222222222222222222222222222',
  );
  assert.equal(
    extractContractAddress({ data: { contract_address: '0x3333333333333333333333333333333333333333' } }),
    '0x3333333333333333333333333333333333333333',
  );
});

test('selectMarketId is deterministic for a deployment and avoids hardcoded attempt ids', () => {
  assert.equal(
    selectMarketId('0xABCDEFabcdefABCDEFabcdefABCDEFabcdef1234'),
    'jideytro-20260722-abcdefab',
  );
});

test('the live Jideytro market uses the contract oncology enum and complete constructor shape', () => {
  const args = buildMarketArgs(
    'jideytro-20260722-abcdefab',
    '2026-08-01T06:20:00Z',
    '2026-08-01T06:22:00Z',
    '2026-08-01T06:37:00Z',
  );

  assert.equal(args.length, 18);
  assert.equal(args[2], 'ONCOLOGY');
  assert.equal(args[4], 'NDA220185');
  assert.equal(args[5], '3760e421-b523-4d9b-e063-6394a90ab94b');
});

test('a superseded value revision can only be archived after liability and balance reach zero', () => {
  assert.doesNotThrow(() => assertArchivable({ contract_liability: '0' }, 0n));
  assert.throws(() => assertArchivable({ contract_liability: '1' }, 0n), /liability/);
  assert.throws(() => assertArchivable({ contract_liability: '0' }, 1n), /balance/);
});

test('only the documented frozen revision can archive its exact known surplus', () => {
  const known = {
    address: '0x9F623cd3703c76E123aD561630A6B72364559f5E',
    balanceWei: '1000000000000000',
    transactionHash:
      '0x7de4bed03104b02cae321d7a1e991125448b613eae2e9660cca460d6b68851bb',
  };

  assert.doesNotThrow(() =>
    assertArchivable(
      { contract_liability: '0' },
      1000000000000000n,
      known,
      known.address,
    ),
  );
  assert.throws(
    () =>
      assertArchivable(
        { contract_liability: '0' },
        2n,
        known,
        known.address,
      ),
    /exact documented surplus/,
  );
  assert.throws(
    () =>
      assertArchivable(
        { contract_liability: '0' },
        1000000000000000n,
        known,
        '0x1111111111111111111111111111111111111111',
      ),
    /documented frozen revision/,
  );
  assert.throws(
    () =>
      assertArchivable(
        { contract_liability: '1' },
        1000000000000000n,
        known,
        known.address,
      ),
    /liability/,
  );
});

test('known-surplus archive record is explicit and never claims recovery', () => {
  const exception = {
    address: '0x9F623cd3703c76E123aD561630A6B72364559f5E',
    balanceWei: '1000000000000000',
    transactionHash:
      '0x7de4bed03104b02cae321d7a1e991125448b613eae2e9660cca460d6b68851bb',
  };
  const record = buildArchiveDeploymentRecord({
    deployment: { address: exception.address, sourceCommit: 'source-commit' },
    summary: { contract_liability: '0', total_received: '7' },
    balance: 1000000000000000n,
    archivedAt: '2026-08-01T10:00:00Z',
    exception,
    failedChildren: [],
  });

  assert.equal(record.status, 'SUPERSEDED_UNRECOVERABLE_TEST_SURPLUS');
  assert.equal(record.recovery.contractBalanceWei, exception.balanceWei);
  assert.equal(record.recovery.invalidPayableTransactionHash, exception.transactionHash);
  assert.equal(record.recovery.remainingAccountingZero, true);
  assert.equal('failedChildren' in record.recovery, false);
  assert.match(record.recovery.limitation, /cannot be recovered/i);
  assert.doesNotMatch(record.recovery.limitation, /was recovered/i);
});

test('known-surplus command is bound to the observed immutable defect', () => {
  assert.deepEqual(KNOWN_UNRECOVERABLE_SURPLUS, {
    address: '0x9F623cd3703c76E123aD561630A6B72364559f5E',
    balanceWei: '1000000000000000',
    transactionHash:
      '0x7de4bed03104b02cae321d7a1e991125448b613eae2e9660cca460d6b68851bb',
  });
  assert.equal(Object.isFrozen(KNOWN_UNRECOVERABLE_SURPLUS), true);
});

test('funding rejection proof requires the bounded full-credit return', () => {
  const receipt = receiptWithReturn({
    accepted: false,
    reason: 'MARKET_NOT_FOUND',
    received: '1000',
    credited_refund: '1000',
  });

  assert.deepEqual(Object.fromEntries(decodeGenVmReturn(receipt)), {
    accepted: false,
    credited_refund: '1000',
    reason: 'MARKET_NOT_FOUND',
    received: '1000',
  });
  assert.deepEqual(assertFundingRejection(receipt, 1000n), {
    accepted: false,
    reason: 'MARKET_NOT_FOUND',
    received: '1000',
    credited_refund: '1000',
  });
  assert.throws(
    () =>
      assertFundingRejection(
        receiptWithReturn({
          accepted: true,
          reason: 'ACCEPTED',
          received: '1000',
          credited_refund: '0',
        }),
        1000n,
      ),
    /rejection proof/,
  );
  assert.throws(
    () =>
      assertFundingRejection(
        receiptWithReturn({
          accepted: false,
          reason: 'MARKET_NOT_FOUND',
          received: '1000',
          credited_refund: '999',
        }),
        1000n,
      ),
    /full received value/,
  );
});

test('resumable value stage recovers the latest recorded action instead of resending', () => {
  const state = {
    transactions: [
      { action: 'reject_missing_market', txHash: '0xold', status: 'SUBMITTED' },
      { action: 'fund_yes', txHash: '0xfund', status: 'FINALIZED' },
      { action: 'reject_missing_market', txHash: '0xlatest', status: 'FINALIZED' },
    ],
  };

  assert.deepEqual(selectRecordedAction(state, 'reject_missing_market'), {
    action: 'reject_missing_market',
    txHash: '0xlatest',
    status: 'FINALIZED',
  });
  assert.equal(selectRecordedAction(state, 'withdraw_rejected_credit'), null);
});

test('an external EOA child is proven by finality, bound transfer fields, and no explicit error', () => {
  const receipt = {
    statusName: 'FINALIZED',
    sender: '0x1111111111111111111111111111111111111111',
    recipient: '0x2222222222222222222222222222222222222222',
    value: 2000,
  };
  const expected = {
    sender: '0x1111111111111111111111111111111111111111',
    recipient: '0x2222222222222222222222222222222222222222',
    value: 2000n,
  };

  assert.doesNotThrow(() => assertExternalTransferReceipt(receipt, expected));
  assert.throws(
    () => assertExternalTransferReceipt({ ...receipt, txExecutionResultName: 'ERROR' }, expected),
    /explicit execution failure/,
  );
  assert.throws(
    () => assertExternalTransferReceipt({ ...receipt, recipient: expected.sender }, expected),
    /recipient/,
  );
});
