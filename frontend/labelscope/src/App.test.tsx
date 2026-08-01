import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import App, { transactionPhaseMessage } from './App';

describe('application boot state', () => {
  it('fails honestly without a deployed address and never renders fixture markets', async () => {
    render(<App />);

    expect(await screen.findByText(/Contract connection is not configured/i)).toBeInTheDocument();
    expect(screen.queryByText(/Pembrolizumab.*Q4 2024/i)).not.toBeInTheDocument();
  });

  it('renders a contract-aware finalized message when one is present', () => {
    expect(
      transactionPhaseMessage({
        status: 'finalized',
        hash: '0xrefund',
        message:
          'Stake was not added. The full amount is available to withdraw from your contract credit.',
      }),
    ).toBe(
      'Stake was not added. The full amount is available to withdraw from your contract credit.',
    );
  });
});
