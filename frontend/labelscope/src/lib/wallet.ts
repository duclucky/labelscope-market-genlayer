import { studionet } from 'genlayer-js/chains';

export interface EthereumProvider {
  request(args: { method: string; params?: unknown[] | object }): Promise<unknown>;
  on?(event: string, listener: (...args: unknown[]) => void): void;
  removeListener?(event: string, listener: (...args: unknown[]) => void): void;
}

export interface WalletOption {
  id: string;
  name: string;
  icon?: string;
  provider: EthereumProvider;
}

interface Eip6963Announcement {
  info: { uuid: string; name: string; icon?: string };
  provider: EthereumProvider;
}

declare global {
  interface Window {
    ethereum?: EthereumProvider;
  }
}

export async function discoverWallets(timeoutMs = 200): Promise<WalletOption[]> {
  if (typeof window === 'undefined') return [];
  const found = new Map<string, WalletOption>();
  const onAnnouncement = (event: Event) => {
    const detail = (event as CustomEvent<Eip6963Announcement>).detail;
    if (!detail?.provider || !detail.info?.uuid) return;
    found.set(detail.info.uuid, {
      id: detail.info.uuid,
      name: detail.info.name || 'Browser wallet',
      icon: detail.info.icon,
      provider: detail.provider,
    });
  };
  window.addEventListener('eip6963:announceProvider', onAnnouncement);
  window.dispatchEvent(new Event('eip6963:requestProvider'));
  await new Promise((resolve) => window.setTimeout(resolve, timeoutMs));
  window.removeEventListener('eip6963:announceProvider', onAnnouncement);

  if (found.size === 0 && window.ethereum) {
    found.set('injected', { id: 'injected', name: 'Browser wallet', provider: window.ethereum });
  }
  return [...found.values()];
}

export async function restoreAuthorizedAccount(provider: EthereumProvider): Promise<`0x${string}` | ''> {
  const accounts = await provider.request({ method: 'eth_accounts' });
  if (!Array.isArray(accounts) || typeof accounts[0] !== 'string') return '';
  return accounts[0] as `0x${string}`;
}

export async function requestAccount(provider: EthereumProvider): Promise<`0x${string}`> {
  const accounts = await provider.request({ method: 'eth_requestAccounts' });
  if (!Array.isArray(accounts) || typeof accounts[0] !== 'string') {
    throw new Error('The wallet did not return an account.');
  }
  return accounts[0] as `0x${string}`;
}

export async function ensureStudionet(provider: EthereumProvider): Promise<void> {
  const chainId = `0x${studionet.id.toString(16)}`;
  try {
    await provider.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId }],
    });
  } catch (error) {
    const code = typeof error === 'object' && error !== null && 'code' in error ? Number(error.code) : 0;
    if (code !== 4902) throw error;
    await provider.request({
      method: 'wallet_addEthereumChain',
      params: [
        {
          chainId,
          chainName: studionet.name,
          nativeCurrency: studionet.nativeCurrency,
          rpcUrls: [...studionet.rpcUrls.default.http],
          blockExplorerUrls: studionet.blockExplorers?.default
            ? [studionet.blockExplorers.default.url]
            : [],
        },
      ],
    });
  }
}

export function shortAddress(address: string): string {
  return address ? `${address.slice(0, 6)}…${address.slice(-4)}` : '';
}
