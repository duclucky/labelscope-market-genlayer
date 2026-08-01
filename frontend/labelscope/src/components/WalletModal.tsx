import { X, Wallet, ShieldCheck, ExternalLink } from 'lucide-react';
import type { UserWallet } from '../types';
import { shortAddress, type WalletOption } from '../lib/wallet';

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  wallet: UserWallet;
  options: WalletOption[];
  onConnect: (option: WalletOption) => Promise<void>;
}

export function WalletModal({ isOpen, onClose, wallet, options, onConnect }: WalletModalProps) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-md w-full p-8 border border-slate-200 shadow-xl relative">
        <button onClick={onClose} aria-label="Close wallet" className="absolute top-4 right-4 p-1 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-full">
          <X className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-sans font-bold text-lg text-slate-900">Studionet wallet</h3>
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>Your wallet signs every market action</span>
            </div>
          </div>
        </div>

        {wallet.isConnected ? (
          <>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs text-slate-500 font-medium">Connected with {wallet.providerName}</span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Connected
                </span>
              </div>
              <div className="font-mono text-sm font-bold text-slate-900" title={wallet.address}>
                {shortAddress(wallet.address)}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-5">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                <div className="text-xs text-slate-500 mb-1">Position value</div>
                <div className="font-sans font-bold text-xl text-slate-900">{wallet.totalValueLocked.toFixed(4)} GEN</div>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                <div className="text-xs text-slate-500 mb-1">Withdrawable credit</div>
                <div className="font-sans font-bold text-xl text-indigo-600">{wallet.credit.toFixed(4)} GEN</div>
              </div>
            </div>
            <a
              href={`https://explorer-studio.genlayer.com/address/${wallet.address}`}
              target="_blank"
              rel="noreferrer"
              className="w-full border border-slate-200 text-slate-700 font-semibold h-11 rounded-xl flex items-center justify-center gap-2 hover:bg-slate-50"
            >
              View account on Explorer <ExternalLink className="w-4 h-4" />
            </a>
          </>
        ) : options.length > 0 ? (
          <div className="space-y-3">
            <p className="text-sm text-slate-500 mb-4">Choose an installed wallet. LabelScope will request Studionet only when you connect.</p>
            {options.map((option) => (
              <button
                key={option.id}
                onClick={() => void onConnect(option)}
                className="w-full bg-white border border-slate-200 text-slate-900 font-semibold h-12 rounded-xl hover:border-indigo-300 hover:bg-indigo-50 flex items-center px-4 gap-3"
              >
                {option.icon ? <img src={option.icon} alt="" className="w-6 h-6 rounded" /> : <Wallet className="w-5 h-5 text-indigo-600" />}
                {option.name}
              </button>
            ))}
          </div>
        ) : (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
            No injected wallet was detected. Install a browser wallet that supports EIP-1193/EIP-6963, then reload this page.
          </div>
        )}

        <p className="text-center text-xs text-slate-500 mt-5">No private key is stored by LabelScope.</p>
      </div>
    </div>
  );
}
