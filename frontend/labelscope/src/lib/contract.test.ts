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
