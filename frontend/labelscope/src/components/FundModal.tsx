import { useEffect, useState } from 'react';
import { X, CheckCircle2, ShieldAlert } from 'lucide-react';
import type { Market } from '../types';

interface FundModalProps {
  isOpen: boolean;
  onClose: () => void;
  market: Market;
  initialType: 'YES' | 'NO';
  onConfirmFund: (marketId: string, position: 'YES' | 'NO', amount: number) => Promise<boolean>;
}

export function FundModal({ isOpen, onClose, market, initialType, onConfirmFund }: FundModalProps) {
  const [position, setPosition] = useState<'YES' | 'NO'>(initialType);
  const [amount, setAmount] = useState(0.01);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => setPosition(initialType), [initialType]);
  if (!isOpen) return null;

  const totalLiquidity = market.collateralYes + market.collateralNo;
  const targetPool = position === 'YES' ? market.collateralYes : market.collateralNo;
  const returnMultiplier = targetPool > 0 ? (totalLiquidity + amount) / (targetPool + amount) : 1;

  const handleFund = async () => {
    if (!Number.isFinite(amount) || amount <= 0) {
      setError('Enter a positive GEN amount.');
      return;
    }
    setError('');
    setIsSubmitting(true);
    const ok = await onConfirmFund(market.id, position, amount);
    setIsSubmitting(false);
    if (ok) onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div className="bg-white rounded-[2rem] max-w-md w-full p-8 border border-slate-200 shadow-xl relative">
        <button onClick={onClose} aria-label="Close funding" className="absolute top-4 right-4 p-1 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-full">
          <X className="w-5 h-5" />
        </button>
        <div className="mb-4">
          <span className="text-xs font-semibold px-2 py-0.5 rounded-2xl bg-indigo-50 text-indigo-700 uppercase tracking-wider">{market.category}</span>
          <h3 className="font-sans font-bold text-lg text-slate-900 mt-2 leading-snug">{market.title}</h3>
        </div>
        <div className="grid grid-cols-2 gap-3 p-1 bg-slate-50 border border-slate-200 rounded-2xl mb-5">
          {(['YES', 'NO'] as const).map((side) => (
            <button
              key={side}
              type="button"
              onClick={() => setPosition(side)}
              className={`py-2.5 rounded-md font-sans text-sm font-bold ${position === side ? (side === 'YES' ? 'bg-emerald-500 text-white shadow-sm' : 'bg-red-600 text-white shadow-sm') : 'text-slate-700'}`}
            >
              Fund {side}
            </button>
          ))}
        </div>
        <div className="mb-4">
          <label htmlFor="fund-amount" className="block text-xs font-semibold text-slate-900 mb-1.5">Funding amount (GEN)</label>
          <div className="relative">
            <input
              id="fund-amount"
              type="number"
              min="0.000001"
              step="0.001"
              value={amount}
              onChange={(event) => setAmount(Number(event.target.value))}
              className="w-full px-4 pr-16 h-11 border border-slate-200 rounded-2xl font-sans font-bold text-lg focus:outline-none focus:border-indigo-600 bg-white"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500">GEN</span>
          </div>
          <div className="flex gap-2 mt-2">
            {[0.01, 0.05, 0.1, 0.5].map((preset) => (
              <button key={preset} type="button" onClick={() => setAmount(preset)} className="flex-1 py-1 text-xs font-semibold rounded-2xl border border-slate-200 hover:bg-slate-50">{preset}</button>
            ))}
          </div>
        </div>
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 mb-5 space-y-2 text-xs">
          <div className="flex justify-between text-slate-500"><span>Estimated pool share multiplier</span><strong className="text-slate-900">{returnMultiplier.toFixed(2)}x</strong></div>
          <div className="flex justify-between text-slate-500"><span>Resolution eligible</span><strong className="text-slate-900">{market.resolutionDate}</strong></div>
          <p className="pt-2 border-t border-slate-200 text-slate-500">The exact payout is calculated from canonical remaining pool and winning stake when claims are processed.</p>
        </div>
        {error && <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-2xl text-xs font-semibold flex items-center gap-2"><ShieldAlert className="w-4 h-4" />{error}</div>}
        <button
          disabled={amount <= 0 || isSubmitting}
          onClick={() => void handleFund()}
          className={`w-full h-11 rounded-2xl font-sans text-sm font-semibold text-white flex items-center justify-center gap-2 ${position === 'YES' ? 'bg-emerald-500 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'} disabled:opacity-50`}
        >
          {isSubmitting ? 'Waiting for finalization…' : <><CheckCircle2 className="w-4 h-4" />Fund {amount} GEN on {position}</>}
        </button>
      </div>
    </div>
  );
}
