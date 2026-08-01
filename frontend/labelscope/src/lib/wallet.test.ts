import { describe, expect, it, vi } from 'vitest';
import { studionet } from 'genlayer-js/chains';
import { ensureStudionet, restoreAuthorizedAccount } from './wallet';

describe('wallet network behavior', () => {
  it('switches using studionet.id and adds the chain only when the wallet does not know it', async () => {
    const request = vi.fn().mockRejectedValueOnce({ code: 4902 }).mockResolvedValueOnce(null);
    const provider = { request };

    await ensureStudionet(provider);

    const chainId = `0x${studionet.id.toString(16)}`;
    expect(request).toHaveBeenNthCalledWith(1, {
      method: 'wallet_switchEthereumChain',
      params: [{ chainId }],
    });
    expect(request).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        method: 'wallet_addEthereumChain',
        params: [expect.objectContaining({ chainId })],
      }),
    );
  });

  it('restores only already-authorized accounts without forcing a permission prompt', async () => {
    const request = vi.fn().mockResolvedValue(['0x4444444444444444444444444444444444444444']);

    const account = await restoreAuthorizedAccount({ request });

    expect(account).toBe('0x4444444444444444444444444444444444444444');
    expect(request).toHaveBeenCalledWith({ method: 'eth_accounts' });
    expect(request).not.toHaveBeenCalledWith(expect.objectContaining({ method: 'eth_requestAccounts' }));
  });
});
