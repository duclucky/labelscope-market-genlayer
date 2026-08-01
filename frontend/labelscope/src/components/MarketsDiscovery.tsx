import React, { useState } from 'react';
import { Search, FlaskConical, Calendar, ArrowRight, Brain, HeartPulse, ShieldAlert, Sparkles, Plus } from 'lucide-react';
import { Market, MarketCategory, MarketStatus } from '../types';

interface MarketsDiscoveryProps {
  markets: Market[];
  onSelectMarket: (market: Market) => void;
  onOpenFundModal: (market: Market, position: 'YES' | 'NO') => void;
  onOpenCreate: () => void;
}

export const MarketsDiscovery: React.FC<MarketsDiscoveryProps> = ({
  markets,
  onSelectMarket,
  onOpenFundModal,
  onOpenCreate,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<MarketStatus | 'All'>('Open');
  const [selectedCategory, setSelectedCategory] = useState<MarketCategory | 'ALL'>('ALL');

  // Filtering logic
  const filteredMarkets = markets.filter((market) => {
    const matchesSearch =
      market.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      market.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (market.sponsor && market.sponsor.toLowerCase().includes(searchQuery.toLowerCase())) ||
      market.category.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = selectedStatus === 'All' || market.status === selectedStatus;
    const matchesCategory = selectedCategory === 'ALL' || market.category === selectedCategory;

    return matchesSearch && matchesStatus && matchesCategory;
  });

  const getCategoryIcon = (category: MarketCategory) => {
    switch (category) {
      case 'ONCOLOGY':
        return <FlaskConical className="w-4 h-4" />;
      case 'NEUROLOGY':
        return <Brain className="w-4 h-4" />;
      case 'CARDIOLOGY':
        return <HeartPulse className="w-4 h-4" />;
      case 'INFECTIOUS DISEASE':
        return <ShieldAlert className="w-4 h-4" />;
      default:
        return <Sparkles className="w-4 h-4" />;
    }
  };

  const categoriesList: (MarketCategory | 'ALL')[] = [
    'ALL',
    'ONCOLOGY',
    'NEUROLOGY',
    'CARDIOLOGY',
    'INFECTIOUS DISEASE',
    'RARE DISEASE',
  ];

  return (
    <div className="w-full max-w-[1200px] mx-auto px-4 md:px-6 pt-6 pb-24">
      {/* Header */}
      <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="font-sans font-extrabold text-3xl md:text-4xl text-slate-900 mb-2 tracking-tight">
            Markets Discovery
          </h1>
          <p className="font-sans text-lg font-bold tracking-tight text-slate-700">
            Explore active FDA label-scope markets and provide scientific forecasts.
          </p>
        </div>

        <button
          onClick={onOpenCreate}
          className="self-start md:self-auto bg-indigo-600 text-white font-sans text-sm font-semibold h-11 px-5 rounded-xl hover:bg-indigo-700 transition-all flex items-center gap-2 shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Compose Question</span>
        </button>
      </header>

      {/* Search and Filters Container */}
      <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-4 mb-8 flex flex-col md:flex-row gap-4 items-center shadow-sm">
        {/* Search Input */}
        <div className="relative w-full md:flex-1">
          <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search mechanisms, indications, sponsors..."
            className="w-full pl-11 pr-4 h-11 border border-slate-200 rounded-md bg-slate-50 font-sans text-sm text-slate-900 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 outline-none"
          />
        </div>

        {/* Status Filter Buttons */}
        <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 hide-scrollbar shrink-0">
          {(['Open', 'Locked', 'Resolved', 'All'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setSelectedStatus(status)}
              className={`whitespace-nowrap px-4 h-11 rounded-full font-sans text-xs font-semibold flex items-center gap-2 transition-all ${
                selectedStatus === status
                  ? 'bg-indigo-100 text-indigo-900 border border-indigo-600'
                  : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              {status === 'Open' && <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse"></span>}
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8 hide-scrollbar">
        {categoriesList.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded-xl font-sans text-xs font-semibold transition-all shrink-0 ${
              selectedCategory === cat
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-white border border-slate-200 shadow-sm text-slate-700 hover:bg-slate-100'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Bento Grid Layout for Markets */}
      {filteredMarkets.length === 0 ? (
        <div className="bg-white border border-slate-200 shadow-sm rounded-3xl p-12 text-center my-8">
          <FlaskConical className="w-12 h-12 text-slate-500 mx-auto mb-3 opacity-50" />
          <h3 className="font-sans font-bold text-lg text-slate-900 mb-1">No markets match your filter</h3>
          <p className="font-sans text-sm text-slate-500 max-w-md mx-auto mb-4">
            Try adjusting your search terms or clearing status filters to view active FDA label-scope markets.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedStatus('All');
              setSelectedCategory('ALL');
            }}
            className="text-indigo-600 font-semibold text-sm hover:underline"
          >
            Reset All Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {filteredMarkets.map((market) => {
            const isFeatured = market.featured;

            if (isFeatured) {
              return (
                <article
                  key={market.id}
                  className="col-span-1 md:col-span-8 bg-white border border-slate-200 shadow-sm rounded-3xl p-6 sm:p-8 relative overflow-hidden transition-all duration-300 hover:border-indigo-300 hover:shadow-md hover:-translate-y-1 group flex flex-col justify-between"
                >
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-600"></div>

                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-2 text-indigo-600 font-sans text-xs font-bold uppercase tracking-wider">
                        {getCategoryIcon(market.category)}
                        <span>{market.category}</span>
                      </div>
                      <span className="bg-slate-100 text-slate-700 text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1.5 border border-slate-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        {market.statusLabel}
                      </span>
                    </div>

                    <h2
                      onClick={() => onSelectMarket(market)}
                      className="font-sans font-semibold text-xl md:text-2xl tracking-tight text-slate-900 mb-3 group-hover:text-indigo-600 transition-colors cursor-pointer leading-snug"
                    >
                      {market.title}
                    </h2>

                    <p className="font-sans text-sm text-slate-600 mb-5 line-clamp-2 leading-relaxed">
                      {market.description}
                    </p>

                    {/* Collateral Grid */}
                    <div className="grid grid-cols-2 gap-4 my-4 pt-4 border-t border-slate-200">
                      <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                          Current Collateral (YES)
                        </p>
                        <p className="font-sans font-semibold text-xl md:text-2xl tracking-tight text-emerald-500">
                          {market.collateralYes.toLocaleString('en-US', { maximumFractionDigits: 4 })} GEN
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                          Current Collateral (NO)
                        </p>
                        <p className="font-sans font-semibold text-xl md:text-2xl tracking-tight text-slate-700">
                          {market.collateralNo.toLocaleString('en-US', { maximumFractionDigits: 4 })} GEN
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Resolution bar & Action */}
                  <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center bg-slate-50 rounded-xl p-3 border border-slate-200 gap-3 mt-2">
                    <div className="flex items-center gap-2 text-slate-500 text-xs font-sans font-medium">
                      <Calendar className="w-4 h-4 text-indigo-600" />
                      <span>Resolution: {market.resolutionDate}</span>
                    </div>

                    <div className="flex gap-2">
                      {market.availableActions.includes('fund') && (
                        <button onClick={() => onOpenFundModal(market, 'YES')} className="flex-1 sm:flex-none px-3 py-1.5 bg-emerald-500 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition-colors">Fund YES</button>
                      )}
                      <button
                        onClick={() => onSelectMarket(market)}
                        className="flex-1 sm:flex-none bg-white border border-indigo-600 text-indigo-600 font-sans text-xs font-semibold h-9 px-5 rounded-xl hover:bg-indigo-600 hover:text-white transition-colors flex items-center justify-center gap-1"
                      >
                        <span>View Details</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </article>
              );
            }

            // Standard card (spans 4 columns)
            return (
              <article
                key={market.id}
                className="col-span-1 md:col-span-4 bg-white border border-slate-200 shadow-sm rounded-3xl p-6 sm:p-8 relative overflow-hidden transition-all duration-300 hover:border-indigo-300 hover:shadow-md hover:-translate-y-1 flex flex-col justify-between group"
              >
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#d8dadc] group-hover:bg-indigo-600 transition-colors"></div>

                <div>
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-1.5 text-slate-700 font-sans text-xs font-bold uppercase tracking-wider">
                      {getCategoryIcon(market.category)}
                      <span>{market.category}</span>
                    </div>
                  </div>

                  <h2
                    onClick={() => onSelectMarket(market)}
                    className="font-sans font-semibold text-lg font-bold tracking-tight text-slate-900 mb-3 group-hover:text-indigo-600 transition-colors cursor-pointer leading-snug line-clamp-3"
                  >
                    {market.title}
                  </h2>
                </div>

                <div>
                  <div className="flex justify-between items-center pt-3 border-t border-slate-200 my-3">
                    <div>
                      <p className="font-mono text-xs text-slate-500 mb-0.5">YES Pool</p>
                      <p className="font-sans font-semibold text-sm text-emerald-500">
                        {market.collateralYes.toLocaleString('en-US', { maximumFractionDigits: 4 })} GEN
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-mono text-xs text-slate-500 mb-0.5">NO Pool</p>
                      <p className="font-sans font-semibold text-sm text-slate-700">
                        {market.collateralNo.toLocaleString('en-US', { maximumFractionDigits: 4 })} GEN
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => onSelectMarket(market)}
                    className="w-full bg-white border border-slate-200 shadow-sm text-slate-900 font-sans text-xs font-semibold h-10 rounded-xl hover:bg-slate-100 transition-colors flex items-center justify-center gap-1.5"
                  >
                    <span>View Market</span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};
