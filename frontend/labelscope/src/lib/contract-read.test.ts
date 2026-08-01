import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  readContract: vi.fn(),
}));

vi.mock('genlayer-js', () => ({
  createClient: () => ({ readContract: mocks.readContract }),
}));

describe('canonical snapshot reads', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv('VITE_CONTRACT_ADDRESS', '0x3333333333333333333333333333333333333333');
    mocks.readContract.mockReset();
  });

  it('retries a transient Studio capacity error instead of losing the market list', async () => {
    mocks.readContract
      .mockRejectedValueOnce(new Error('Server busy: all 8 execution slots occupied, retry later'))
      .mockResolvedValueOnce([]);
    const { loadCanonicalSnapshot } = await import('./contract');

    await expect(loadCanonicalSnapshot()).resolves.toEqual({ markets: [], positions: [], credit: 0 });
    expect(mocks.readContract).toHaveBeenCalledTimes(2);
  });

  it('reports the hosted Studionet quota without exposing raw RPC details', async () => {
    mocks.readContract.mockRejectedValueOnce(
      new Error('GenLayer RPC error: Rate limit exceeded: 500 requests per hour'),
    );
    const { loadCanonicalSnapshot } = await import('./contract');

    await expect(loadCanonicalSnapshot()).rejects.toThrow(
      'Studionet request limit reached. Try again later.',
    );
  });
});
