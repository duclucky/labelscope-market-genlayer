import { describe, expect, it, vi } from 'vitest';
import {
  getAvailableActions,
  mapCanonicalMarket,
  submitAndFinalize,
  type CanonicalMarket,
  type CanonicalPosition,
} from './contract';

const canonicalMarket: CanonicalMarket = {
  creator: '0x1111111111111111111111111111111111111111',
  title: 'Will the FDA label match the locked ROS1 NSCLC scope?',
  category: 'ONCOLOGY',
  drug_name: 'Jideytro (zidesamtinib)',
  application_number: 'NDA220185',
  label_set_id: '3760e421-b523-4d9b-e063-6394a90ab94b',
  label_effective_time: '20260722',
  approval_url: 'https://www.fda.gov/drugs/resources-information-approved-drugs/fda-approves-zidesamtinib-ros1-positive-non-small-cell-lung-cancer',
  condition: 'ROS1-positive non-small cell lung cancer',
  biomarker: 'ROS1-positive',
  population: 'adults',
  disease_stage: 'locally advanced or metastatic',
  prior_therapy: 'at least one prior ROS1 tyrosine kinase inhibitor',
  combination_requirement: 'NOT_REQUIRED',
  approval_class: 'FDA approval',
  close_at: '2026-08-01T00:10:00Z',
  resolve_at: '2026-08-01T00:20:00Z',
  refund_at: '2026-08-01T01:20:00Z',
  status: 'RETRYABLE',
  verdict: 'UNVERIFIABLE',
  consequence_class: 'NO_SETTLEMENT',
  yes_total: '1000000000000000000',
  no_total: '500000000000000000',
  total_pool: '1500000000000000000',
  remaining_pool: '0',
  remaining_winning_stake: '0',
  attempt_count: 1,
};

const emptyPosition: CanonicalPosition = {
  market_id: 'jideytro-ros1',
  owner: '0x2222222222222222222222222222222222222222',
  side: '',
  stake: '0',
  claimed: false,
  credited_amount: '0',
};

describe('canonical market adapter', () => {
  it('maps retryable state and native GEN amounts without inventing fixture fields', () => {
    const market = mapCanonicalMarket('jideytro-ros1', canonicalMarket);

    expect(market.status).toBe('Locked');
    expect(market.statusLabel).toBe('Evidence unavailable — retry available');
    expect(market.collateralYes).toBe(1);
    expect(market.collateralNo).toBe(0.5);
    expect(market.sources).toHaveLength(2);
    expect(market.sources[0].url).toBe(canonicalMarket.approval_url);
    expect(market.sources[1].url).toContain('api.fda.gov/drug/label.json');
  });

  it('shows only actions legal for canonical state, time, role, and position', () => {
    const now = new Date('2026-08-01T01:30:00Z');
    const participant = { ...emptyPosition, stake: '5' };

    expect(getAvailableActions(canonicalMarket, participant, participant.owner, '10', now)).toEqual([
      'retry',
      'cancel',
      'withdraw',
    ]);
    expect(getAvailableActions(canonicalMarket, emptyPosition, emptyPosition.owner, '0', now)).toEqual([
      'retry',
    ]);
  });
});

describe('transaction finality', () => {
  it('turns a wallet rejection into a concise user-facing message', async () => {
    const phases: Array<{ status: string; message?: string }> = [];
    const rawWalletError =
      'User rejected the request. Details: Request Signature: User denied request signature. Version: viem@2.55.10';
    const writeClient = { writeContract: vi.fn().mockRejectedValue(new Error(rawWalletError)) };
    const readClient = { waitForTransactionReceipt: vi.fn() };

    await expect(
      submitAndFinalize({
        writeClient,
        readClient,
        request: {
          address: '0x3333333333333333333333333333333333333333',
          functionName: 'resolve_market',
          args: ['m1'],
          value: 0n,
        },
        onPhase: (phase) => phases.push(phase),
        reload: vi.fn(),
      }),
    ).rejects.toThrow('Transaction cancelled in your wallet.');

    expect(phases.at(-1)).toEqual({
      status: 'failed',
      hash: undefined,
      message: 'Transaction cancelled in your wallet.',
    });
  });

  it('turns a wallet transport failure into a concise user-facing message', async () => {
    const writeClient = {
      writeContract: vi
        .fn()
        .mockRejectedValue(new Error('An unknown RPC error occurred. Details: Failed to fetch Version: viem@2.55.10')),
    };

    await expect(
      submitAndFinalize({
        writeClient,
        readClient: { waitForTransactionReceipt: vi.fn() },
        request: {
          address: '0x3333333333333333333333333333333333333333',
          functionName: 'resolve_market',
          args: ['m1'],
          value: 0n,
        },
        onPhase: vi.fn(),
        reload: vi.fn(),
      }),
    ).rejects.toThrow('Studionet connection was interrupted. Try again.');
  });

  it('accepts SUCCESS nested in the current Studio leader receipt', async () => {
    const phases: string[] = [];
    const reload = vi.fn();
    const writeClient = { writeContract: vi.fn().mockResolvedValue('0xstudio') };
    const readClient = {
      waitForTransactionReceipt: vi
        .fn()
        .mockResolvedValueOnce({ status: 5, consensus_data: { leader_receipt: [{ execution_result: 'SUCCESS' }] } })
        .mockResolvedValueOnce({ status: 7, consensus_data: { leader_receipt: [{ execution_result: 'SUCCESS' }] } }),
    };

    await submitAndFinalize({
      writeClient,
      readClient,
      request: { address: '0x3333333333333333333333333333333333333333', functionName: 'create_market', args: [], value: 0n },
      onPhase: (phase) => phases.push(phase.status),
      reload,
    });

    expect(phases).toEqual(['submitting', 'submitted', 'decided', 'finalized']);
    expect(reload).toHaveBeenCalledOnce();
  });

  it('retries a transient Studio capacity error while waiting for finality', async () => {
    const phases: string[] = [];
    const reload = vi.fn();
    const writeClient = { writeContract: vi.fn().mockResolvedValue('0xbusy') };
    const readClient = {
      waitForTransactionReceipt: vi
        .fn()
        .mockResolvedValueOnce({ status: 5, consensus_data: { leader_receipt: [{ execution_result: 'SUCCESS' }] } })
        .mockRejectedValueOnce(new Error('Server busy: all 8 execution slots occupied, retry later'))
        .mockRejectedValueOnce(new Error('Server busy: all 8 execution slots occupied, retry later'))
        .mockRejectedValueOnce(new Error('Server busy: all 8 execution slots occupied, retry later'))
        .mockRejectedValueOnce(new Error('Server busy: all 8 execution slots occupied, retry later'))
        .mockRejectedValueOnce(new Error('Server busy: all 8 execution slots occupied, retry later'))
        .mockResolvedValueOnce({ status: 7, consensus_data: { leader_receipt: [{ execution_result: 'SUCCESS' }] } }),
    };

    await submitAndFinalize({
      writeClient,
      readClient,
      request: { address: '0x3333333333333333333333333333333333333333', functionName: 'claim_credit', args: ['m1'], value: 0n },
      onPhase: (phase) => phases.push(phase.status),
      reload,
    });

    expect(phases).toEqual(['submitting', 'submitted', 'decided', 'finalized']);
    expect(readClient.waitForTransactionReceipt).toHaveBeenCalledTimes(7);
    expect(reload).toHaveBeenCalledOnce();
  }, 10_000);

  it('retries a transient fetch failure while tracking an accepted transaction', async () => {
    const phases: string[] = [];
    const writeClient = { writeContract: vi.fn().mockResolvedValue('0xnetwork') };
    const readClient = {
      waitForTransactionReceipt: vi
        .fn()
        .mockResolvedValueOnce({ status: 5, consensus_data: { leader_receipt: [{ execution_result: 'SUCCESS' }] } })
        .mockRejectedValueOnce(new Error('An unknown RPC error occurred. Details: Failed to fetch Version: viem@2.55.10'))
        .mockResolvedValueOnce({ status: 7, consensus_data: { leader_receipt: [{ execution_result: 'SUCCESS' }] } }),
    };

    await submitAndFinalize({
      writeClient,
      readClient,
      request: { address: '0x3333333333333333333333333333333333333333', functionName: 'claim_credit', args: ['m1'], value: 0n },
      onPhase: (phase) => phases.push(phase.status),
      reload: vi.fn(),
    });

    expect(phases).toEqual(['submitting', 'submitted', 'decided', 'finalized']);
    expect(readClient.waitForTransactionReceipt).toHaveBeenCalledTimes(3);
  });

  it('tracks submitted, decided, finalized, then reloads canonical state', async () => {
    const phases: string[] = [];
    const reload = vi.fn();
    const writeClient = { writeContract: vi.fn().mockResolvedValue('0xabc') };
    const readClient = {
      waitForTransactionReceipt: vi
        .fn()
        .mockResolvedValueOnce({ statusName: 'ACCEPTED', txExecutionResultName: 'FINISHED_WITH_RETURN' })
        .mockResolvedValueOnce({ statusName: 'FINALIZED', txExecutionResultName: 'FINISHED_WITH_RETURN' }),
    };

    await submitAndFinalize({
      writeClient,
      readClient,
      request: { address: '0x3333333333333333333333333333333333333333', functionName: 'lock_market', args: ['m1'], value: 0n },
      onPhase: (phase) => phases.push(phase.status),
      reload,
    });

    expect(phases).toEqual(['submitting', 'submitted', 'decided', 'finalized']);
    expect(reload).toHaveBeenCalledOnce();
  });

  it('surfaces finalized execution failure and never reloads as success', async () => {
    const phases: string[] = [];
    const reload = vi.fn();
    const writeClient = { writeContract: vi.fn().mockResolvedValue('0xdef') };
    const readClient = {
      waitForTransactionReceipt: vi
        .fn()
        .mockResolvedValueOnce({ statusName: 'ACCEPTED', txExecutionResultName: 'FINISHED_WITH_RETURN' })
        .mockResolvedValueOnce({ statusName: 'FINALIZED', txExecutionResultName: 'FINISHED_WITH_ERROR' }),
    };

    await expect(
      submitAndFinalize({
        writeClient,
        readClient,
        request: { address: '0x3333333333333333333333333333333333333333', functionName: 'resolve_market', args: ['m1'], value: 0n },
        onPhase: (phase) => phases.push(phase.status),
        reload,
      }),
    ).rejects.toThrow('Contract execution failed');
    expect(phases.at(-1)).toBe('failed');
    expect(reload).not.toHaveBeenCalled();
  });
});
