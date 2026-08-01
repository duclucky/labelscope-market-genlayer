import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import App from './App';

describe('application boot state', () => {
  it('fails honestly without a deployed address and never renders fixture markets', async () => {
    render(<App />);

    expect(await screen.findByText(/Contract connection is not configured/i)).toBeInTheDocument();
    expect(screen.queryByText(/Pembrolizumab.*Q4 2024/i)).not.toBeInTheDocument();
  });
});
