import { describe, expect, it, vi } from 'vitest';
import { studionet } from 'genlayer-js/chains';
import { discoverWallets, ensureStudionet, providerForAction, restoreAuthorizedAccount } from './wallet';

describe('wallet network behavior', () => {
  it('routes OKX create through EIP-6963 and subsequent writes through its legacy provider', async () => {
    const announcedProvider = { request: vi.fn().mockResolvedValue('announced') };
    const legacyProvider = { request: vi.fn().mockResolvedValue('legacy') };
    const announce = () => {
      window.dispatchEvent(
        new CustomEvent('eip6963:announceProvider', {
          detail: {
            info: { uuid: 'okx-eip6963', name: 'OKX Wallet' },
            provider: announcedProvider,
          },
        }),
      );
      Object.defineProperty(window, 'okxwallet', {
        configurable: true,
        value: legacyProvider,
      });
    };
    window.addEventListener('eip6963:requestProvider', announce);

    try {
      const wallets = await discoverWallets(0);

      expect(wallets).toHaveLength(1);
      expect(wallets[0]).toMatchObject({ id: 'okx-eip6963', name: 'OKX Wallet' });
      expect(providerForAction(wallets[0].provider, 'create_market')).toBe(announcedProvider);
      expect(providerForAction(wallets[0].provider, 'fund_position')).toBe(legacyProvider);
      expect(providerForAction(wallets[0].provider, 'withdraw_credit')).toBe(legacyProvider);
    } finally {
      window.removeEventListener('eip6963:requestProvider', announce);
      delete (window as Window & { okxwallet?: unknown }).okxwallet;
    }
  });

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
