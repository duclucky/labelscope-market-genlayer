import { createClient } from 'genlayer-js';
import { studionet } from 'genlayer-js/chains';
import { ExecutionResult, TransactionStatus } from 'genlayer-js/types';
import type { Address } from 'viem';
import type {
  CanonicalMarketStatus,
  Market,
  MarketCategory,
  TransactionPhase,
  UserAction,
  UserPosition,
} from '../types';
import { ensureStudionet, type EthereumProvider } from './wallet';

export interface CanonicalMarket {
  creator: string;
  title: string;
  category: string;
  drug_name: string;
  application_number: string;
  label_set_id: string;
  label_effective_time: string;
  approval_url: string;
  condition: string;
  biomarker: string;
  population: string;
  disease_stage: string;
  prior_therapy: string;
  combination_requirement: string;
  approval_class: string;
  close_at: string;
  resolve_at: string;
  refund_at: string;
  status: CanonicalMarketStatus;
  verdict: string;
  consequence_class: string;
  yes_total: string;
  no_total: string;
  total_pool: string;
  remaining_pool: string;
  remaining_winning_stake: string;
  attempt_count: number;
}

export interface CanonicalPosition {
  market_id: string;
  owner: string;
  side: 'YES' | 'NO' | '';
  stake: string;
  claimed: boolean;
  credited_amount: string;
}

export interface CanonicalSnapshot {
  markets: Market[];
  positions: UserPosition[];
  credit: number;
}

const contractAddressValue = import.meta.env.VITE_CONTRACT_ADDRESS?.trim() ?? '';
export const contractAddress = /^0x[0-9a-fA-F]{40}$/.test(contractAddressValue)
  ? (contractAddressValue as Address)
  : null;
export const readClient = createClient({ chain: studionet });

function isTransientRpcError(message: string): boolean {
  const normalized = message.toLowerCase();
  return (
    normalized.includes('server busy') ||
    normalized.includes('execution slots occupied') ||
    normalized.includes('failed to fetch') ||
    normalized.includes('fetch failed') ||
    normalized.includes('networkerror')
  );
}

async function retryTransientRpc<T>(operation: () => Promise<T>): Promise<T> {
  const maxAttempts = 20;
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      const message = error instanceof Error ? error.message : '';
      if (!isTransientRpcError(message) || attempt === maxAttempts - 1) throw error;
      await new Promise((resolve) => globalThis.setTimeout(resolve, 1000));
    }
  }
  throw new Error('Studionet retry exhausted unexpectedly.');
}

async function readCanonical(request: Record<string, unknown>): Promise<unknown> {
  try {
    return await retryTransientRpc(() => readClient.readContract(request as never));
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    if (/rate limit exceeded/i.test(message)) {
      throw new Error('Studionet request limit reached. Try again later.');
    }
    if (isTransientRpcError(message)) {
      throw new Error('Studionet is temporarily unavailable. Try again shortly.');
    }
    throw error;
  }
}

function genAmount(value: string): number {
  const raw = BigInt(value || '0');
  const whole = raw / 10n ** 18n;
  const fraction = raw % 10n ** 18n;
  return Number(whole) + Number(fraction) / 1e18;
}

export function toGenWei(value: number): bigint {
  if (!Number.isFinite(value) || value <= 0) throw new Error('Enter a positive GEN amount.');
  const text = value.toFixed(18);
  const [whole, fraction] = text.split('.');
  return BigInt(whole) * 10n ** 18n + BigInt(fraction.padEnd(18, '0'));
}

function displayDate(value: string): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
  }).format(new Date(value));
}

function statusPresentation(status: CanonicalMarketStatus): {
  status: Market['status'];
  label: string;
} {
  const labels: Record<CanonicalMarketStatus, { status: Market['status']; label: string }> = {
    OPEN: { status: 'Open', label: 'Funding open' },
    LOCKED: { status: 'Locked', label: 'Awaiting evidence review' },
    RETRYABLE: { status: 'Locked', label: 'Evidence unavailable — retry available' },
    RESOLVED_YES: { status: 'Resolved', label: 'Label scope matched — YES wins' },
    RESOLVED_NO: { status: 'Resolved', label: 'Label scope did not match — NO wins' },
    CANCELLED_REFUND: { status: 'Resolved', label: 'Cancelled — stakes refundable' },
  };
  return labels[status];
}

function lifecycle(raw: CanonicalMarket): Market['lifecycle'] {
  const fundingDone = raw.status !== 'OPEN';
  const final = raw.status.startsWith('RESOLVED_') || raw.status === 'CANCELLED_REFUND';
  return [
    { label: 'Market terms locked', status: 'completed' },
    {
      label: fundingDone ? 'Funding closed' : 'Funding open',
      date: `Closes ${displayDate(raw.close_at)}`,
      status: fundingDone ? 'completed' : 'current',
    },
    {
      label: final ? 'Evidence review complete' : raw.status === 'RETRYABLE' ? 'Evidence retry available' : 'Awaiting evidence review',
      date: `Eligible ${displayDate(raw.resolve_at)}`,
      status: final ? 'completed' : fundingDone ? 'current' : 'upcoming',
    },
    {
      label: final ? statusPresentation(raw.status).label : 'Outcome and claims',
      status: final ? 'completed' : 'upcoming',
    },
  ];
}

export function mapCanonicalMarket(id: string, raw: CanonicalMarket): Market {
  const presentation = statusPresentation(raw.status);
  const category = raw.category.replaceAll('_', ' ') as MarketCategory;
  const labelUrl =
    `https://api.fda.gov/drug/label.json?search=set_id:%22${raw.label_set_id}` +
    `%22+AND+effective_time:%22${raw.label_effective_time}%22&limit=1`;
  return {
    id,
    code: id.toUpperCase(),
    title: raw.title,
    description: `${raw.drug_name}: ${raw.condition}; ${raw.population}; ${raw.disease_stage}.`,
    category,
    status: presentation.status,
    canonicalStatus: raw.status,
    statusLabel: presentation.label,
    verdict: raw.verdict,
    consequenceClass: raw.consequence_class,
    fundingOpen: raw.status === 'OPEN' && Date.now() < Date.parse(raw.close_at),
    resolutionDate: displayDate(raw.resolve_at),
    refundDate: displayDate(raw.refund_at),
    collateralYes: genAmount(raw.yes_total),
    collateralNo: genAmount(raw.no_total),
    featured: false,
    creator: raw.creator,
    applicationNumber: raw.application_number,
    labelSetId: raw.label_set_id,
    labelEffectiveTime: raw.label_effective_time,
    attemptCount: raw.attempt_count,
    availableActions: [],
    resolutionScope: {
      targetIndication: raw.condition,
      biomarker: raw.biomarker,
      populationScope: raw.population,
      diseaseStage: raw.disease_stage,
      priorTherapy: raw.prior_therapy,
      combinationRequirement: raw.combination_requirement,
      approvalClass: raw.approval_class,
      specificDrug: raw.drug_name,
      deadline: displayDate(raw.resolve_at),
    },
    sources: [
      {
        id: `${id}-approval`,
        title: 'FDA approval source',
        description: 'Official FDA source locked when this market was created.',
        url: raw.approval_url,
        icon: 'link',
      },
      {
        id: `${id}-label`,
        title: 'Exact openFDA label record',
        description: `${raw.application_number} · set ${raw.label_set_id} · effective ${raw.label_effective_time}`,
        url: labelUrl,
        icon: 'science',
      },
    ],
    lifecycle: lifecycle(raw),
  };
}

export function getAvailableActions(
  market: CanonicalMarket,
  position: CanonicalPosition,
  account: string,
  credit: string,
  now = new Date(),
): UserAction[] {
  if (!account) return [];
  const actions: UserAction[] = [];
  const time = now.getTime();
  const hasPosition = BigInt(position.stake || '0') > 0n;
  const isCreator = account.toLowerCase() === market.creator.toLowerCase();
  if (market.status === 'OPEN') {
    if (time < Date.parse(market.close_at)) actions.push('fund');
    else actions.push('lock');
  }
  if (market.status === 'LOCKED' || market.status === 'RETRYABLE') {
    if (time >= Date.parse(market.resolve_at) && BigInt(market.yes_total) > 0n && BigInt(market.no_total) > 0n) {
      actions.push(market.status === 'RETRYABLE' ? 'retry' : 'resolve');
    }
    if (time >= Date.parse(market.refund_at) && (isCreator || hasPosition)) actions.push('cancel');
  }
  const winner = market.status === 'RESOLVED_YES' ? 'YES' : market.status === 'RESOLVED_NO' ? 'NO' : '';
  if (
    hasPosition &&
    !position.claimed &&
    (market.status === 'CANCELLED_REFUND' || (winner !== '' && position.side === winner))
  ) {
    actions.push('claim');
  }
  if (BigInt(credit || '0') > 0n) actions.push('withdraw');
  return actions;
}

function asObject<T>(value: unknown): T {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error('The contract returned an unexpected response.');
  }
  return value as T;
}

export async function loadCanonicalSnapshot(account = ''): Promise<CanonicalSnapshot> {
  if (!contractAddress) throw new Error('Contract address is not configured for this deployment.');
  const idsValue = await readCanonical({
    address: contractAddress,
    functionName: 'get_market_ids',
    args: [],
    jsonSafeReturn: true,
  });
  if (!Array.isArray(idsValue)) throw new Error('The contract market index is unavailable.');
  const ids = idsValue.map(String);
  const canonical = await Promise.all(
    ids.map(async (id) =>
      asObject<CanonicalMarket>(
        await readCanonical({
          address: contractAddress,
          functionName: 'get_market',
          args: [id],
          jsonSafeReturn: true,
        }),
      ),
    ),
  );
  const markets = canonical.map((market, index) => mapCanonicalMarket(ids[index], market));
  if (!account) return { markets, positions: [], credit: 0 };
  const positionValues = await Promise.all(
    ids.map((id) =>
      readCanonical({
        address: contractAddress,
        functionName: 'get_position',
        args: [id, account],
        jsonSafeReturn: true,
      }),
    ),
  );
  const rawPositions = positionValues.map((value) => asObject<CanonicalPosition>(value));
  const positions = rawPositions
    .map((value, index) => {
      const position = value;
      const market = markets[index];
      const resolved = market.canonicalStatus.startsWith('RESOLVED_') || market.canonicalStatus === 'CANCELLED_REFUND';
      const winningSide = market.canonicalStatus === 'RESOLVED_YES' ? 'YES' : market.canonicalStatus === 'RESOLVED_NO' ? 'NO' : '';
      const isClaimable =
        BigInt(position.stake || '0') > 0n &&
        !position.claimed &&
        (market.canonicalStatus === 'CANCELLED_REFUND' || position.side === winningSide);
      return {
        id: `${ids[index]}|${account.toLowerCase()}`,
        marketId: ids[index],
        marketTitle: market.title,
        position: position.side,
        stakedAmount: genAmount(position.stake),
        claimed: position.claimed,
        creditedAmount: genAmount(position.credited_amount),
        isResolved: resolved,
        isClaimable,
        targetResolutionDate: market.resolutionDate,
      } satisfies UserPosition;
    })
    .filter((position) => position.stakedAmount > 0);
  const creditValue = await readCanonical({
    address: contractAddress,
    functionName: 'get_credit',
    args: [account],
    jsonSafeReturn: true,
  });
  const creditRaw = String(creditValue);
  markets.forEach((market, index) => {
    market.availableActions = getAvailableActions(canonical[index], rawPositions[index], account, creditRaw);
  });
  return { markets, positions, credit: genAmount(creditRaw) };
}

interface MinimalWriteClient {
  writeContract(request: Record<string, unknown>): Promise<string>;
}

interface MinimalReceipt {
  statusName?: string;
  txExecutionResultName?: string;
  execution_result?: string | { status?: string };
  consensus_data?: {
    leader_receipt?: { execution_result?: string } | Array<{ execution_result?: string }>;
  };
}

interface MinimalReadClient {
  waitForTransactionReceipt(request: Record<string, unknown>): Promise<MinimalReceipt>;
}

function executionResultFromReceipt(receipt: MinimalReceipt): string {
  const leaderValue = receipt.consensus_data?.leader_receipt;
  const leader = Array.isArray(leaderValue) ? leaderValue[0] : leaderValue;
  const direct = receipt.execution_result;
  return String(
    receipt.txExecutionResultName ??
      (typeof direct === 'object' ? direct.status : direct) ??
      leader?.execution_result ??
      '',
  );
}

async function waitForReceipt(
  readClient: MinimalReadClient,
  request: Record<string, unknown>,
): Promise<MinimalReceipt> {
  return retryTransientRpc(() => readClient.waitForTransactionReceipt(request));
}

function transactionErrorMessage(rawMessage: string, hash: string): string {
  if (/user (rejected|denied)/i.test(rawMessage)) {
    return 'Transaction cancelled in your wallet.';
  }
  if (isTransientRpcError(rawMessage)) {
    return hash
      ? 'Studionet status check was interrupted. Refresh canonical state before retrying.'
      : 'Studionet connection was interrupted. Try again.';
  }
  return rawMessage || 'Transaction failed.';
}

export async function submitAndFinalize(options: {
  writeClient: MinimalWriteClient;
  readClient: MinimalReadClient;
  request: { address: string; functionName: string; args: unknown[]; value: bigint };
  onPhase: (phase: TransactionPhase) => void;
  reload: () => Promise<unknown> | unknown;
}): Promise<string> {
  let hash = '';
  options.onPhase({ status: 'submitting' });
  try {
    hash = await options.writeClient.writeContract(options.request);
    options.onPhase({ status: 'submitted', hash });
    await waitForReceipt(options.readClient, {
      hash,
      status: TransactionStatus.ACCEPTED,
      interval: 3000,
      retries: 600,
    });
    options.onPhase({ status: 'decided', hash });
    const finalized = await waitForReceipt(options.readClient, {
      hash,
      status: TransactionStatus.FINALIZED,
      interval: 3000,
      retries: 600,
    });
    const executionResult = executionResultFromReceipt(finalized);
    if (executionResult !== ExecutionResult.FINISHED_WITH_RETURN && executionResult !== 'SUCCESS') {
      throw new Error('Contract execution failed after finalization.');
    }
    await options.reload();
    options.onPhase({ status: 'finalized', hash });
    return hash;
  } catch (error) {
    const rawMessage = error instanceof Error ? error.message : '';
    const message = transactionErrorMessage(rawMessage, hash);
    options.onPhase({ status: 'failed', hash: hash || undefined, message });
    throw new Error(message);
  }
}

export async function writeCanonicalAction(options: {
  provider: EthereumProvider;
  account: `0x${string}`;
  functionName: string;
  args: unknown[];
  value?: bigint;
  onPhase: (phase: TransactionPhase) => void;
  reload: () => Promise<unknown>;
}): Promise<string> {
  if (!contractAddress) throw new Error('Contract address is not configured for this deployment.');
  await ensureStudionet(options.provider);
  const walletClient = createClient({
    chain: studionet,
    account: options.account,
    provider: options.provider,
  });
  return submitAndFinalize({
    writeClient: walletClient,
    readClient,
    request: {
      address: contractAddress,
      functionName: options.functionName,
      args: options.args,
      value: options.value ?? 0n,
    },
    onPhase: options.onPhase,
    reload: options.reload,
  });
}
