import React from 'react';
import { BarChart3, PlusCircle, Wallet, Plus, FlaskConical } from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onOpenCreate: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  onOpenCreate,
}) => {
  return (
    <aside className="hidden md:flex flex-col h-screen w-64 py-6 px-4 gap-4 bg-white border-r border-slate-200 sticky top-0 z-40">
      {/* Product Header */}
      <div className="flex items-center gap-3 px-2 mb-8">
        <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
          <FlaskConical className="w-5 h-5" />
        </div>
        <div>
          <div className="font-sans font-bold text-indigo-600 text-base leading-snug">
            LabelScope
          </div>
          <div className="font-sans text-xs text-slate-500">
            FDA scope markets
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex flex-col gap-2">
        <button
          onClick={() => onSelectTab('markets')}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl font-sans text-sm font-semibold transition-all duration-150 text-left ${
            currentTab === 'markets'
              ? 'bg-indigo-50 text-indigo-700 shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <BarChart3 className="w-5 h-5" />
          <span>Markets</span>
        </button>

        <button
          onClick={() => onSelectTab('create')}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl font-sans text-sm font-semibold transition-all duration-150 text-left ${
            currentTab === 'create'
              ? 'bg-indigo-50 text-indigo-700 shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <PlusCircle className="w-5 h-5" />
          <span>Create</span>
        </button>

        <button
          onClick={() => onSelectTab('positions')}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl font-sans text-sm font-semibold transition-all duration-150 text-left ${
            currentTab === 'positions'
              ? 'bg-indigo-50 text-indigo-700 shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Wallet className="w-5 h-5" />
          <span>Positions</span>
        </button>

      </nav>

      {/* Bottom CTA */}
      <div className="mt-auto">
        <button
          onClick={onOpenCreate}
          className="w-full bg-indigo-600 text-white font-sans text-sm font-semibold h-11 rounded-xl hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>New Forecast</span>
        </button>
      </div>
    </aside>
  );
};
