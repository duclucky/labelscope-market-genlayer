import React, { useState } from 'react';
import {
  ArrowLeft,
  Check,
  ExternalLink,
  Hourglass,
  Link as LinkIcon,
  FlaskConical,
  FileText,
  Share2,
  RefreshCw,
  Lock,
  RotateCcw,
  Coins,
} from 'lucide-react';
import { Market, UserAction } from '../types';

interface MarketDetailProps {
  market: Market;
  onBack: () => void;
  onOpenFundModal: (market: Market, position: 'YES' | 'NO') => void;
  onRunAction: (market: Market, action: UserAction) => Promise<boolean>;
}

export const MarketDetail: React.FC<MarketDetailProps> = ({
  market,
  onBack,
  onOpenFundModal,
  onRunAction,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [busyAction, setBusyAction] = useState<UserAction | ''>('');

  const totalLiquidity = market.collateralYes + market.collateralNo;
  const yesRatio = totalLiquidity > 0 ? (market.collateralYes / totalLiquidity) * 100 : 50;
  const noRatio = 100 - yesRatio;

  const yesReturn = market.collateralYes > 0 ? (totalLiquidity / market.collateralYes).toFixed(2) : '2.00';
  const noReturn = market.collateralNo > 0 ? (totalLiquidity / market.collateralNo).toFixed(2) : '2.00';

  const runAction = async (action: UserAction) => {
    setBusyAction(action);
    await onRunAction(market, action);
    setBusyAction('');
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="w-full max-w-[1200px] mx-auto px-4 md:px-6 pt-6 pb-24">
      {/* Top Breadcrumb & Share */}
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:underline"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Markets Discovery</span>
        </button>

        <button
          onClick={handleShare}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 bg-white border border-slate-200 shadow-sm px-3 py-1.5 rounded-md transition-colors"
        >
          <Share2 className="w-3.5 h-3.5" />
          <span>{copiedLink ? 'Link Copied!' : 'Share Market'}</span>
        </button>
      </div>

      {/* Header Section */}
      <div className="mb-8">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span className="px-2.5 py-1 bg-slate-100 text-slate-700 font-mono text-xs rounded-xl border border-slate-200">
            ID: {market.code}
          </span>
          <span className="px-2.5 py-1 bg-indigo-50 text-[#003751] font-sans text-xs font-semibold rounded-xl flex items-center gap-1">
            <Hourglass className="w-3.5 h-3.5" />
            <span>{market.statusLabel.toUpperCase()}</span>
          </span>
          <span className="px-2.5 py-1 bg-indigo-600/10 text-indigo-600 font-sans text-xs font-bold rounded-xl">
            {market.category}
          </span>
        </div>

        <h1 className="font-sans font-bold text-2xl md:text-3xl text-slate-900 mb-3 leading-tight">
          {market.title}
        </h1>
        <p className="font-sans text-base md:text-lg text-slate-500 max-w-3xl leading-relaxed">
          {market.description}
        </p>
      </div>

      {/* Main Grid: Left Facets & Evidence, Right Actions */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Left Column (8 cols) */}
        <div className="md:col-span-8 flex flex-col gap-6">
          {/* Resolution Scope (Predicate) */}
          <section className="bg-white border border-slate-200 shadow-sm rounded-3xl p-6 sm:p-8 shadow-sm">
            <h2 className="font-sans font-bold text-lg text-slate-900 mb-4 flex items-center gap-2">
              <Check className="w-5 h-5 text-indigo-600" />
              <span>Resolution Scope (Predicate)</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50">
                <span className="block font-sans text-xs font-bold text-indigo-600 mb-1 uppercase tracking-wider">
                  Target Indication
                </span>
                <span className="block font-sans text-sm font-semibold text-slate-900">
                  {market.resolutionScope.targetIndication}
                </span>
              </div>

              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50">
                <span className="block font-sans text-xs font-bold text-indigo-600 mb-1 uppercase tracking-wider">
                  Population Scope
                </span>
                <span className="block font-sans text-sm font-semibold text-slate-900">
                  {market.resolutionScope.populationScope}
                </span>
              </div>

              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50">
                <span className="block font-sans text-xs font-bold text-indigo-600 mb-1 uppercase tracking-wider">
                  Specific Drug / Molecule
                </span>
                <span className="block font-sans text-sm font-semibold text-slate-900">
                  {market.resolutionScope.specificDrug}
                </span>
              </div>

              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50">
                <span className="block font-sans text-xs font-bold text-indigo-600 mb-1 uppercase tracking-wider">
                  Resolution Deadline
                </span>
                <span className="block font-sans text-sm font-semibold text-slate-900">
                  {market.resolutionScope.deadline}
                </span>
              </div>
            </div>
          </section>

          {/* Official Source Anchors */}
          <section className="bg-white border border-slate-200 shadow-sm rounded-3xl p-6 sm:p-8 shadow-sm">
            <h2 className="font-sans font-bold text-lg text-slate-900 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-600" />
              <span>Official Source Anchors</span>
            </h2>

            <div className="flex flex-col gap-3">
              {market.sources.map((src) => (
                <a
                  key={src.id}
                  href={src.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-4 border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    {src.icon === 'science' ? (
                      <FlaskConical className="w-5 h-5 text-slate-500 group-hover:text-indigo-600 transition-colors" />
                    ) : (
                      <LinkIcon className="w-5 h-5 text-slate-500 group-hover:text-indigo-600 transition-colors" />
                    )}
                    <div>
                      <span className="block font-sans text-sm font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">
                        {src.title}
                      </span>
                      <span className="block font-sans text-xs text-slate-500">
                        {src.description}
                      </span>
                    </div>
                  </div>
                  <ExternalLink className="w-4 h-4 text-slate-500" />
                </a>
              ))}
            </div>
          </section>

          <section className="bg-gradient-to-br from-white to-slate-50 border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm">
            <h2 className="font-sans font-bold text-lg text-slate-900 mb-4">Locked Adjudication Facets</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              {[
                ['Biomarker', market.resolutionScope.biomarker],
                ['Disease stage', market.resolutionScope.diseaseStage],
                ['Prior therapy', market.resolutionScope.priorTherapy],
                ['Combination', market.resolutionScope.combinationRequirement],
                ['Approval class', market.resolutionScope.approvalClass],
                ['Label identity', `${market.applicationNumber} · ${market.labelEffectiveTime}`],
              ].map(([label, value]) => (
                <div key={label} className="border border-slate-200 rounded-xl p-4 bg-white">
                  <span className="block text-xs font-bold text-indigo-600 uppercase tracking-wider mb-1">{label}</span>
                  <span className="font-semibold text-slate-900">{value}</span>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Right Column (4 cols) */}
        <div className="md:col-span-4 flex flex-col gap-6">
          {/* Funding Pool Card */}
          <section className="bg-white border border-slate-200 shadow-sm rounded-3xl p-6 sm:p-8 shadow-sm sticky top-[88px]">
            <h3 className="font-sans font-bold text-lg text-slate-900 mb-4 border-b border-slate-200 pb-3">
              Funding Pool
            </h3>

            <div className="flex justify-between items-end mb-2">
              <span className="font-sans text-xs font-semibold text-slate-500">Total Liquidity</span>
              <span className="font-sans font-bold text-2xl text-indigo-600">
                {totalLiquidity.toLocaleString('en-US', { maximumFractionDigits: 4 })} GEN
              </span>
            </div>

            {/* Liquidity Ratio Bar */}
            <div className="w-full bg-slate-100 h-2.5 rounded-full mb-6 overflow-hidden flex">
              <div
                className="bg-emerald-500 h-full transition-all duration-300"
                style={{ width: `${yesRatio}%` }}
              ></div>
              <div
                className="bg-red-100 h-full transition-all duration-300"
                style={{ width: `${noRatio}%` }}
              ></div>
            </div>

            {/* YES vs NO stats */}
            <div className="flex justify-between mb-6 text-center">
              <div className="flex-1 border-r border-slate-200 pr-2">
                <span className="block font-sans text-xs font-bold text-slate-900 mb-0.5">
                  YES ({yesRatio.toFixed(0)}%)
                </span>
                <span className="block font-sans text-xs text-slate-500">
                  Est. Return: {yesReturn}x
                </span>
              </div>
              <div className="flex-1 pl-2">
                <span className="block font-sans text-xs font-bold text-slate-900 mb-0.5">
                  NO ({noRatio.toFixed(0)}%)
                </span>
                <span className="block font-sans text-xs text-slate-500">
                  Est. Return: {noReturn}x
                </span>
              </div>
            </div>

            {market.availableActions.includes('fund') && (
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => onOpenFundModal(market, 'YES')} className="h-11 bg-emerald-500 text-white font-sans text-sm font-semibold rounded-xl hover:opacity-90">Fund YES</button>
                <button onClick={() => onOpenFundModal(market, 'NO')} className="h-11 bg-red-100 text-red-700 font-sans text-sm font-semibold rounded-xl hover:bg-red-200">Fund NO</button>
              </div>
            )}
            <div className="flex flex-col gap-2 mt-3">
              {market.availableActions.includes('lock') && <ActionButton icon={<Lock className="w-4 h-4" />} busy={busyAction === 'lock'} onClick={() => void runAction('lock')}>Close funding</ActionButton>}
              {market.availableActions.includes('resolve') && <ActionButton icon={<RefreshCw className="w-4 h-4" />} busy={busyAction === 'resolve'} onClick={() => void runAction('resolve')}>Review official evidence</ActionButton>}
              {market.availableActions.includes('retry') && <ActionButton icon={<RefreshCw className="w-4 h-4" />} busy={busyAction === 'retry'} onClick={() => void runAction('retry')}>Retry evidence review</ActionButton>}
              {market.availableActions.includes('cancel') && <ActionButton icon={<RotateCcw className="w-4 h-4" />} busy={busyAction === 'cancel'} onClick={() => void runAction('cancel')}>Enable stake refunds</ActionButton>}
              {market.availableActions.includes('claim') && <ActionButton icon={<Coins className="w-4 h-4" />} busy={busyAction === 'claim'} onClick={() => void runAction('claim')}>Move payout to credit</ActionButton>}
            </div>
            {market.availableActions.length === 0 && <p className="text-xs text-slate-500 text-center mt-3">Connect the relevant wallet to see available actions.</p>}
          </section>

          {/* Lifecycle Status */}
          <section className="bg-white border border-slate-200 shadow-sm rounded-3xl p-6 sm:p-8 shadow-sm">
            <h3 className="font-sans font-bold text-lg text-slate-900 mb-4">
              Lifecycle Status
            </h3>

            <div className="relative pl-6 border-l-2 border-slate-200 ml-2 space-y-6 py-2">
              {market.lifecycle.map((step, idx) => (
                <div key={idx} className="relative">
                  {step.status === 'completed' && (
                    <div className="absolute -left-[31px] top-0.5 w-4 h-4 rounded-full bg-indigo-600 flex items-center justify-center">
                      <Check className="w-2.5 h-2.5 text-white stroke-[3]" />
                    </div>
                  )}

                  {step.status === 'current' && (
                    <div className="absolute -left-[31px] top-0.5 w-4 h-4 rounded-full bg-indigo-600 flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-white animate-pulse"></div>
                    </div>
                  )}

                  {step.status === 'upcoming' && (
                    <div className="absolute -left-[31px] top-0.5 w-4 h-4 rounded-full bg-slate-200 border-2 border-white"></div>
                  )}

                  <span
                    className={`block font-sans text-sm font-semibold ${
                      step.status === 'upcoming' ? 'text-slate-500' : 'text-indigo-600'
                    }`}
                  >
                    {step.label}
                  </span>
                  {step.date && (
                    <span className="block font-sans text-xs text-slate-500 mt-0.5">
                      {step.date}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>

      {market.availableActions.includes('fund') && (
        <div className="fixed bottom-0 left-0 w-full bg-white border-t border-slate-200 p-4 flex gap-3 md:hidden shadow-lg z-40">
          <button onClick={() => onOpenFundModal(market, 'YES')} className="flex-1 h-11 bg-emerald-500 text-white font-sans text-sm font-semibold rounded-xl">Fund YES ({yesReturn}x)</button>
          <button onClick={() => onOpenFundModal(market, 'NO')} className="flex-1 h-11 bg-red-100 text-red-700 font-sans text-sm font-semibold rounded-xl">Fund NO ({noReturn}x)</button>
        </div>
      )}
    </div>
  );
};

function ActionButton({ children, icon, busy, onClick }: { children: React.ReactNode; icon: React.ReactNode; busy: boolean; onClick: () => void }) {
  return <button disabled={busy} onClick={onClick} className="w-full h-11 border border-indigo-200 text-indigo-700 bg-indigo-50 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 hover:bg-indigo-100 disabled:opacity-50">{icon}{busy ? 'Waiting for finalization…' : children}</button>;
}
