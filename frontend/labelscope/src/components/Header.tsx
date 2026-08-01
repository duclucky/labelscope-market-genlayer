import React, { useState } from 'react';
import { BarChart3, PlusCircle, Wallet, Menu, X, ArrowLeft, FlaskConical } from 'lucide-react';
import { UserWallet } from '../types';
import { shortAddress } from '../lib/wallet';

interface HeaderProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  wallet: UserWallet;
  onOpenWalletModal: () => void;
  showBackButton?: boolean;
  onBack?: () => void;
  backTitle?: string;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onSelectTab,
  wallet,
  onOpenWalletModal,
  showBackButton,
  onBack,
  backTitle,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      {/* Mobile Top Navigation */}
      <header className="md:hidden bg-white/80 backdrop-blur-md border-b border-slate-200/80 sticky top-0 left-0 w-full z-50 flex justify-between items-center h-[64px] px-4">
        <div className="flex items-center gap-3">
          {showBackButton ? (
            <button
              onClick={onBack}
              className="p-2 text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          ) : (
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-indigo-600 hover:bg-slate-100 rounded-md transition-colors"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          )}

          <div
            onClick={() => onSelectTab('markets')}
            className="font-sans font-bold text-xl text-indigo-600 cursor-pointer tracking-tight"
          >
            LabelScope
          </div>
        </div>

        <button
          onClick={onOpenWalletModal}
          className="bg-indigo-600 text-white font-sans text-xs font-semibold px-3 py-2 rounded-md transition-all active:scale-95 flex items-center gap-1.5"
        >
          <Wallet className="w-3.5 h-3.5" />
          <span>{wallet.isConnected ? shortAddress(wallet.address) : 'Connect Wallet'}</span>
        </button>
      </header>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 top-[64px] bg-white z-40 p-8 flex flex-col justify-between border-b border-slate-200">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3 px-2 mb-4 pb-4 border-b border-slate-200">
              <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
                <FlaskConical className="w-5 h-5" />
              </div>
              <div>
                <div className="font-sans font-bold text-indigo-600">LabelScope</div>
                <div className="text-xs text-slate-500">FDA scope markets</div>
              </div>
            </div>

            <button
              onClick={() => {
                onSelectTab('markets');
                setMobileMenuOpen(false);
              }}
              className={`flex items-center gap-3 px-4 py-3 rounded-[2rem] font-sans text-sm font-semibold ${
                currentTab === 'markets' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-700'
              }`}
            >
              <BarChart3 className="w-5 h-5" />
              <span>Markets</span>
            </button>

            <button
              onClick={() => {
                onSelectTab('create');
                setMobileMenuOpen(false);
              }}
              className={`flex items-center gap-3 px-4 py-3 rounded-[2rem] font-sans text-sm font-semibold ${
                currentTab === 'create' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-700'
              }`}
            >
              <PlusCircle className="w-5 h-5" />
              <span>Create Market</span>
            </button>

            <button
              onClick={() => {
                onSelectTab('positions');
                setMobileMenuOpen(false);
              }}
              className={`flex items-center gap-3 px-4 py-3 rounded-[2rem] font-sans text-sm font-semibold ${
                currentTab === 'positions' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-700'
              }`}
            >
              <Wallet className="w-5 h-5" />
              <span>My Positions</span>
            </button>
          </div>

          <div className="pt-6 border-t border-slate-200">
            <button
              onClick={() => {
                onOpenWalletModal();
                setMobileMenuOpen(false);
              }}
              className="w-full bg-indigo-600 text-white py-3 rounded-xl text-sm font-semibold"
            >
              {wallet.isConnected ? 'View wallet connection' : 'Connect wallet'}
            </button>
          </div>
        </div>
      )}

      {/* Desktop Top Sub-Header for Pages when Sidebar is active */}
      <div className="hidden md:flex items-center justify-between h-[64px] px-8 bg-white/80 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-30">
        <div className="flex items-center gap-6">
          <div
            onClick={() => onSelectTab('markets')}
            className="font-sans text-xl font-bold text-indigo-600 cursor-pointer"
          >
            LabelScope
          </div>

          <nav className="flex items-center gap-6">
            <button
              onClick={() => onSelectTab('markets')}
              className={`font-sans text-sm flex items-center gap-2 py-1 transition-colors ${
                currentTab === 'markets'
                  ? 'text-indigo-600 border-b-2 border-indigo-600 font-bold'
                  : 'text-slate-700 hover:text-indigo-600'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              Markets
            </button>

            <button
              onClick={() => onSelectTab('create')}
              className={`font-sans text-sm flex items-center gap-2 py-1 transition-colors ${
                currentTab === 'create'
                  ? 'text-indigo-600 border-b-2 border-indigo-600 font-bold'
                  : 'text-slate-700 hover:text-indigo-600'
              }`}
            >
              <PlusCircle className="w-4 h-4" />
              Create Market
            </button>

            <button
              onClick={() => onSelectTab('positions')}
              className={`font-sans text-sm flex items-center gap-2 py-1 transition-colors ${
                currentTab === 'positions'
                  ? 'text-indigo-600 border-b-2 border-indigo-600 font-bold'
                  : 'text-slate-700 hover:text-indigo-600'
              }`}
            >
              <Wallet className="w-4 h-4" />
              My Positions
            </button>
          </nav>
        </div>

        <button
          onClick={onOpenWalletModal}
          className="h-10 px-5 bg-indigo-600 text-white rounded-full font-sans text-sm font-semibold hover:bg-indigo-700 hover:shadow-md transition-all active:scale-95 flex items-center gap-2"
        >
          <Wallet className="w-4 h-4" />
          <span>{wallet.isConnected ? shortAddress(wallet.address) : 'Connect Wallet'}</span>
        </button>
      </div>
    </>
  );
};
