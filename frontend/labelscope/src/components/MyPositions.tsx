import { useState, type ReactNode } from 'react';
import { CheckCircle, Hourglass } from 'lucide-react';
import type { UserPosition, UserWallet } from '../types';

interface MyPositionsProps {
  positions: UserPosition[];
  wallet: UserWallet;
  onClaimPosition: (positionId: string) => Promise<boolean>;
  onWithdraw: (amount: number) => Promise<boolean>;
}

export function MyPositions({ positions, wallet, onClaimPosition, onWithdraw }: MyPositionsProps) {
  const [busyId, setBusyId] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState(wallet.credit);
  const claimable = positions.filter((position) => position.isClaimable);
  const pending = positions.filter((position) => !position.isResolved);

  const claim = async (id: string) => {
    setBusyId(id);
    await onClaimPosition(id);
    setBusyId('');
  };
  const withdraw = async () => {
    setBusyId('withdraw');
    await onWithdraw(withdrawAmount);
    setBusyId('');
  };

  if (!wallet.isConnected) {
    return (
      <div className="w-full max-w-[1200px] mx-auto px-4 md:px-6 pt-6 pb-24">
        <h1 className="font-sans font-bold text-3xl md:text-4xl text-slate-900 mb-2">My Positions</h1>
        <div className="bg-white border border-slate-200 rounded-3xl p-8 text-center text-slate-500 mt-8">Connect your wallet to load canonical positions and credits.</div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[1200px] mx-auto px-4 md:px-6 pt-6 pb-24">
      <header className="mb-8">
        <h1 className="font-sans font-bold text-3xl md:text-4xl text-slate-900 mb-2 tracking-tight">My Positions</h1>
        <p className="font-sans text-base md:text-lg text-slate-500">Canonical exposure, claimable outcomes, and withdrawable contract credit.</p>
      </header>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <Metric label="Position value" value={`${wallet.totalValueLocked.toFixed(4)} GEN`} />
        <Metric label="Pending resolution" value={`${wallet.pendingResolution.toFixed(4)} GEN`} accent="amber" />
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 border-l-4 border-l-indigo-600">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Withdrawable credit</span>
          <div className="font-bold text-3xl text-indigo-600 mt-2">{wallet.credit.toFixed(4)} GEN</div>
          {wallet.credit > 0 && (
            <div className="flex gap-2 mt-4">
              <input
                aria-label="Withdrawal amount"
                type="number"
                min="0"
                max={wallet.credit}
                step="0.001"
                value={withdrawAmount}
                onChange={(event) => setWithdrawAmount(Number(event.target.value))}
                className="min-w-0 flex-1 h-10 border border-slate-200 rounded-xl px-3 text-sm"
              />
              <button disabled={busyId === 'withdraw' || withdrawAmount <= 0 || withdrawAmount > wallet.credit} onClick={() => void withdraw()} className="bg-indigo-600 text-white px-4 rounded-xl text-xs font-bold disabled:opacity-50">
                {busyId === 'withdraw' ? 'Finalizing…' : 'Withdraw'}
              </button>
            </div>
          )}
        </div>
      </div>

      <section className="mb-12">
        <div className="flex items-center gap-2 mb-6 border-b border-slate-200 pb-3">
          <CheckCircle className="w-5 h-5 text-indigo-600" />
          <h2 className="font-sans font-bold text-xl">Available to Claim</h2>
        </div>
        {claimable.length === 0 ? (
          <Empty>Finalized winning or refundable positions will appear here.</Empty>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {claimable.map((position) => (
              <article key={position.id} className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8">
                <h3 className="font-bold text-lg mb-4">{position.marketTitle}</h3>
                <div className="grid grid-cols-2 gap-4 mb-5 text-sm">
                  <div><span className="block text-xs text-slate-500">Your side</span><strong className={position.position === 'YES' ? 'text-emerald-600' : 'text-red-600'}>{position.position}</strong></div>
                  <div><span className="block text-xs text-slate-500">Stake</span><strong>{position.stakedAmount.toFixed(4)} GEN</strong></div>
                </div>
                <button disabled={busyId === position.id} onClick={() => void claim(position.id)} className="w-full bg-indigo-600 text-white py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50">
                  {busyId === position.id ? 'Waiting for finalization…' : 'Move payout to credit'}
                </button>
              </article>
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="flex items-center gap-2 mb-6 border-b border-slate-200 pb-3">
          <Hourglass className="w-5 h-5 text-amber-500" />
          <h2 className="font-sans font-bold text-xl">Pending Resolution</h2>
        </div>
        {pending.length === 0 ? <Empty>You currently have no positions awaiting resolution.</Empty> : (
          <div className="flex flex-col gap-4">
            {pending.map((position) => (
              <article key={position.id} className="bg-white border border-slate-200 rounded-3xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 border-l-4 border-l-amber-500">
                <div><h3 className="font-bold text-lg">{position.marketTitle}</h3><p className="text-xs text-slate-500">Resolution eligible: {position.targetResolutionDate}</p></div>
                <div className="flex gap-8"><div><span className="block text-xs text-slate-500">Side</span><strong>{position.position}</strong></div><div><span className="block text-xs text-slate-500">Stake</span><strong>{position.stakedAmount.toFixed(4)} GEN</strong></div></div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function Metric({ label, value, accent }: { label: string; value: string; accent?: 'amber' }) {
  return <div className={`bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 ${accent ? 'border-l-4 border-l-amber-500' : ''}`}><span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{label}</span><div className={`font-bold text-3xl mt-2 ${accent ? 'text-amber-600' : 'text-slate-900'}`}>{value}</div></div>;
}

function Empty({ children }: { children: ReactNode }) {
  return <div className="bg-white border border-slate-200 rounded-3xl p-8 text-center text-slate-500 text-sm">{children}</div>;
}
