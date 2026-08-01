import assert from 'node:assert/strict';
import test from 'node:test';

import {
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
