import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertCircle, CheckCircle2, LoaderCircle } from 'lucide-react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { MarketsDiscovery } from './components/MarketsDiscovery';
import { MarketDetail } from './components/MarketDetail';
import { CreateMarket } from './components/CreateMarket';
import { MyPositions } from './components/MyPositions';
import { WalletModal } from './components/WalletModal';
import { FundModal } from './components/FundModal';
import {
  contractAddress,
  loadCanonicalSnapshot,
  toGenWei,
  writeCanonicalAction,
} from './lib/contract';
import {
  discoverWallets,
  ensureStudionet,
  requestAccount,
  restoreAuthorizedAccount,
  type EthereumProvider,
  type WalletOption,
} from './lib/wallet';
import type {
  CreateMarketInput,
  Market,
  TransactionPhase,
  UserAction,
  UserPosition,
  UserWallet,
} from './types';

const EMPTY_WALLET: UserWallet = {
  isConnected: false,
  address: '',
  providerName: '',
  credit: 0,
  totalValueLocked: 0,
  pendingResolution: 0,
};

export default function App() {
  const [currentTab, setCurrentTab] = useState('markets');
  const [selectedMarketId, setSelectedMarketId] = useState<string | null>(null);
  const [markets, setMarkets] = useState<Market[]>([]);
  const [positions, setPositions] = useState<UserPosition[]>([]);
  const [wallet, setWallet] = useState<UserWallet>(EMPTY_WALLET);
  const [provider, setProvider] = useState<EthereumProvider | null>(null);
  const [walletOptions, setWalletOptions] = useState<WalletOption[]>([]);
  const [walletModalOpen, setWalletModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [appError, setAppError] = useState('');
  const [transaction, setTransaction] = useState<TransactionPhase>({ status: 'idle' });
  const [fundModalState, setFundModalState] = useState<{
    isOpen: boolean;
    market: Market | null;
    initialType: 'YES' | 'NO';
  }>({ isOpen: false, market: null, initialType: 'YES' });

  const selectedMarket = useMemo(
    () => markets.find((market) => market.id === selectedMarketId) ?? null,
    [markets, selectedMarketId],
  );

  const refresh = useCallback(async (account = wallet.address) => {
    if (!contractAddress) {
      setMarkets([]);
      setPositions([]);
      setAppError('Contract connection is not configured for this deployment.');
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const snapshot = await loadCanonicalSnapshot(account);
      setMarkets(snapshot.markets);
      setPositions(snapshot.positions);
      const totalValueLocked = snapshot.positions
        .filter((position) => !position.claimed)
        .reduce((sum, position) => sum + position.stakedAmount, 0);
      const pendingResolution = snapshot.positions
        .filter((position) => !position.isResolved)
        .reduce((sum, position) => sum + position.stakedAmount, 0);
      setWallet((current) => ({
        ...current,
        credit: snapshot.credit,
        totalValueLocked,
        pendingResolution,
      }));
      setAppError('');
    } catch (error) {
      setAppError(error instanceof Error ? error.message : 'Unable to read canonical market state.');
    } finally {
      setIsLoading(false);
    }
  }, [wallet.address]);

  useEffect(() => {
    void refresh('');
  }, []); // initial canonical read; wallet restoration follows separately

  useEffect(() => {
    let active = true;
    void (async () => {
      const options = await discoverWallets();
      if (!active) return;
      setWalletOptions(options);
      for (const option of options) {
        const account = await restoreAuthorizedAccount(option.provider);
        if (account && active) {
          setProvider(option.provider);
          setWallet((current) => ({
            ...current,
            isConnected: true,
            address: account,
            providerName: option.name,
          }));
          await refresh(account);
          break;
        }
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  const handleSelectTab = (tab: string) => {
    setCurrentTab(tab);
    setSelectedMarketId(null);
    scrollToTop();
  };

  const handleSelectMarket = (market: Market) => {
    setSelectedMarketId(market.id);
    scrollToTop();
  };

  const connectWallet = async (option: WalletOption) => {
    setAppError('');
    try {
      const account = await requestAccount(option.provider);
      await ensureStudionet(option.provider);
      setProvider(option.provider);
      setWallet((current) => ({
        ...current,
        isConnected: true,
        address: account,
        providerName: option.name,
      }));
      await refresh(account);
      setWalletModalOpen(false);
    } catch (error) {
      setAppError(error instanceof Error ? error.message : 'Wallet connection failed.');
    }
  };

  const execute = async (functionName: string, args: unknown[], value = 0n): Promise<boolean> => {
    if (!provider || !wallet.address) {
      setWalletModalOpen(true);
      setAppError('Connect a wallet before submitting this action.');
      return false;
    }
    setAppError('');
    try {
      await writeCanonicalAction({
        provider,
        account: wallet.address,
        functionName,
        args,
        value,
        onPhase: setTransaction,
        reload: () => refresh(wallet.address),
      });
      return true;
    } catch (error) {
      setAppError(error instanceof Error ? error.message : 'Transaction failed.');
      return false;
    }
  };

  const createMarket = async (input: CreateMarketInput) => {
    const ok = await execute('create_market', [
      input.marketId,
      input.title,
      input.category.replaceAll(' ', '_'),
      input.drugName,
      input.applicationNumber,
      input.labelSetId,
      input.labelEffectiveTime,
      input.approvalUrl,
      input.condition,
      input.biomarker,
      input.population,
      input.diseaseStage,
      input.priorTherapy,
      input.combinationRequirement,
      input.approvalClass,
      input.closeAt,
      input.resolveAt,
      input.refundAt,
    ]);
    if (ok) {
      setCurrentTab('markets');
      setSelectedMarketId(input.marketId);
      scrollToTop();
    }
    return ok;
  };

  const fundMarket = async (marketId: string, side: 'YES' | 'NO', amount: number) =>
    execute('fund_position', [marketId, side], toGenWei(amount));

  const runMarketAction = async (market: Market, action: UserAction) => {
    const methods: Partial<Record<UserAction, string>> = {
      lock: 'lock_market',
      resolve: 'resolve_market',
      retry: 'resolve_market',
      cancel: 'cancel_unresolved',
      claim: 'claim_credit',
    };
    const method = methods[action];
    return method ? execute(method, [market.id]) : false;
  };

  const claimPosition = async (positionId: string) => {
    const position = positions.find((item) => item.id === positionId);
    return position ? execute('claim_credit', [position.marketId]) : false;
  };

  const withdrawCredit = async (amount: number) => execute('withdraw_credit', [toGenWei(amount)]);

  const phaseMessage: Partial<Record<TransactionPhase['status'], string>> = {
    submitting: 'Confirm this action in your wallet.',
    submitted: 'Submitted to Studionet. Waiting for validator decision.',
    decided: 'Accepted by validators. Waiting for finalization.',
    finalized: 'Finalized. Canonical contract state has been refreshed.',
    failed: transaction.message || 'The transaction failed.',
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col md:flex-row font-sans">
      <Sidebar
        currentTab={currentTab}
        onSelectTab={handleSelectTab}
        onOpenCreate={() => handleSelectTab('create')}
      />
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          currentTab={currentTab}
          onSelectTab={handleSelectTab}
          wallet={wallet}
          onOpenWalletModal={() => setWalletModalOpen(true)}
          showBackButton={selectedMarket !== null}
          onBack={() => setSelectedMarketId(null)}
          backTitle={selectedMarket?.title}
        />

        {(appError || transaction.status !== 'idle') && (
          <div className="px-4 md:px-8 pt-4">
            <div
              className={`max-w-[1200px] mx-auto rounded-xl border px-4 py-3 flex items-start gap-3 text-sm ${
                appError || transaction.status === 'failed'
                  ? 'bg-red-50 border-red-200 text-red-700'
                  : transaction.status === 'finalized'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : 'bg-indigo-50 border-indigo-200 text-indigo-800'
              }`}
            >
              {appError || transaction.status === 'failed' ? (
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              ) : transaction.status === 'finalized' ? (
                <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
              ) : (
                <LoaderCircle className="w-4 h-4 mt-0.5 shrink-0 animate-spin" />
              )}
              <div className="flex-1">
                <p>{appError || phaseMessage[transaction.status]}</p>
                {transaction.hash && (
                  <a
                    className="font-semibold underline mt-1 inline-block"
                    href={`https://explorer-studio.genlayer.com/tx/${transaction.hash}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    View transaction
                  </a>
                )}
              </div>
            </div>
          </div>
        )}

        <main className="flex-1">
          {isLoading && markets.length === 0 && contractAddress ? (
            <div className="min-h-[50vh] flex items-center justify-center gap-2 text-slate-500">
              <LoaderCircle className="w-5 h-5 animate-spin" /> Loading canonical markets…
            </div>
          ) : selectedMarket ? (
            <MarketDetail
              market={selectedMarket}
              onBack={() => setSelectedMarketId(null)}
              onOpenFundModal={(market, side) =>
                setFundModalState({ isOpen: true, market, initialType: side })
              }
              onRunAction={runMarketAction}
            />
          ) : currentTab === 'markets' ? (
            <MarketsDiscovery
              markets={markets}
              onSelectMarket={handleSelectMarket}
              onOpenFundModal={(market, side) =>
                setFundModalState({ isOpen: true, market, initialType: side })
              }
              onOpenCreate={() => handleSelectTab('create')}
            />
          ) : currentTab === 'create' ? (
            <CreateMarket onCreateMarket={createMarket} onCancel={() => handleSelectTab('markets')} />
          ) : currentTab === 'positions' ? (
            <MyPositions
              positions={positions}
              wallet={wallet}
              onClaimPosition={claimPosition}
              onWithdraw={withdrawCredit}
            />
          ) : (
            <MarketsDiscovery
              markets={markets}
              onSelectMarket={handleSelectMarket}
              onOpenFundModal={(market, side) =>
                setFundModalState({ isOpen: true, market, initialType: side })
              }
              onOpenCreate={() => handleSelectTab('create')}
            />
          )}
        </main>
      </div>

      <WalletModal
        isOpen={walletModalOpen}
        onClose={() => setWalletModalOpen(false)}
        wallet={wallet}
        options={walletOptions}
        onConnect={connectWallet}
      />

      {fundModalState.isOpen && fundModalState.market && (
        <FundModal
          isOpen
          onClose={() => setFundModalState({ isOpen: false, market: null, initialType: 'YES' })}
          market={fundModalState.market}
          initialType={fundModalState.initialType}
          onConfirmFund={fundMarket}
        />
      )}
    </div>
  );
}
