import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Market } from '../types';
import { MarketDetail } from './MarketDetail';

afterEach(cleanup);

const resolvedMarket: Market = {
  id: 'jideytro-20260722-ab9d047c',
  code: 'JIDEYTRO-20260722-AB9D047C',
  title: 'Will the exact FDA label match the locked Jideytro approval scope?',
  description: 'Jideytro label scope',
  category: 'ONCOLOGY',
  status: 'Resolved',
  canonicalStatus: 'RESOLVED_YES',
  statusLabel: 'Label scope matched — YES wins',
  verdict: 'MATCH',
  consequenceClass: 'WIN_YES',
  fundingOpen: false,
  resolutionDate: 'Aug 01, 2026',
  refundDate: 'Aug 01, 2026',
  collateralYes: 0.001,
  collateralNo: 0.001,
  resolutionScope: {
    targetIndication: 'non-small cell lung cancer',
    biomarker: 'ROS1-positive',
    populationScope: 'adults',
    diseaseStage: 'locally advanced or metastatic',
    priorTherapy: 'received a prior ROS1 kinase inhibitor',
    combinationRequirement: 'NOT_REQUIRED',
    approvalClass: 'FDA approval',
    specificDrug: 'Jideytro (zidesamtinib)',
    deadline: 'Aug 01, 2026',
  },
  sources: [],
  lifecycle: [],
  creator: '0x1111111111111111111111111111111111111111',
  applicationNumber: 'NDA220185',
  labelSetId: '3760e421-b523-4d9b-e063-6394a90ab94b',
  labelEffectiveTime: '20260722',
  attemptCount: 1,
  availableActions: [],
};

describe('market detail user actions', () => {
  it('copies a deep link that restores the selected market', async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    });
    window.history.replaceState(null, '', '/markets?ref=audit');

    render(
      <MarketDetail
        market={resolvedMarket}
        onBack={vi.fn()}
        onOpenFundModal={vi.fn()}
        onRunAction={vi.fn()}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Share Market' }));

    expect(writeText).toHaveBeenCalledWith(
      'http://localhost:3000/markets?ref=audit&market=jideytro-20260722-ab9d047c',
    );
    expect(screen.getByText('Link Copied!')).toBeInTheDocument();
  });

  it('does not tell a connected user to reconnect when no action remains', () => {
    render(
      <MarketDetail
        market={resolvedMarket}
        onBack={vi.fn()}
        onOpenFundModal={vi.fn()}
        onRunAction={vi.fn()}
      />,
    );

    expect(screen.getByText('No actions are available for this wallet and market state.')).toBeInTheDocument();
    expect(screen.queryByText(/Connect the relevant wallet/i)).not.toBeInTheDocument();
  });
});
