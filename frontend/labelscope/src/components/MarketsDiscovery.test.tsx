import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { Market } from '../types';
import { MarketsDiscovery } from './MarketsDiscovery';

function market(id: string): Market {
  return {
    id,
    code: id.toUpperCase(),
    title: 'Will the FDA label match the locked ROS1 NSCLC scope?',
    description: 'Jideytro label scope',
    category: 'ONCOLOGY',
    status: 'Open',
    canonicalStatus: 'OPEN',
    statusLabel: 'Funding open',
    verdict: '',
    consequenceClass: '',
    fundingOpen: true,
    resolutionDate: 'Aug 01, 2026',
    refundDate: 'Aug 01, 2026',
    collateralYes: 0,
    collateralNo: 0,
    resolutionScope: {
      targetIndication: '',
      biomarker: '',
      populationScope: '',
      diseaseStage: '',
      priorTherapy: '',
      combinationRequirement: '',
      approvalClass: '',
      specificDrug: '',
      deadline: '',
    },
    sources: [],
    lifecycle: [],
    creator: '0x1111111111111111111111111111111111111111',
    applicationNumber: 'NDA220185',
    labelSetId: '3760e421-b523-4d9b-e063-6394a90ab94b',
    labelEffectiveTime: '20260722',
    attemptCount: 0,
    availableActions: ['fund'],
  };
}

describe('market discovery identity', () => {
  it('shows market IDs and supports searching by exact ID when titles collide', async () => {
    const user = userEvent.setup();
    render(
      <MarketsDiscovery
        markets={[market('browser-audit-one'), market('browser-audit-two')]}
        onSelectMarket={vi.fn()}
        onOpenFundModal={vi.fn()}
        onOpenCreate={vi.fn()}
      />,
    );

    expect(screen.getByText('browser-audit-one')).toBeInTheDocument();
    expect(screen.getByText('browser-audit-two')).toBeInTheDocument();

    await user.type(screen.getByPlaceholderText('Search mechanisms, indications, sponsors...'), 'browser-audit-two');

    expect(screen.queryByText('browser-audit-one')).not.toBeInTheDocument();
    expect(screen.getByText('browser-audit-two')).toBeInTheDocument();
  });
});
