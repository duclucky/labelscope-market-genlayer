import assert from 'node:assert/strict';
import test from 'node:test';

import {
  assertArchivable,
  assertSuccessfulReceipt,
  buildMarketArgs,
  executionResultFromReceipt,
  extractContractAddress,
  parseEnvText,
  safeReceipt,
  selectMarketId,
} from '../scripts/studionet.mjs';

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
