export type MarketCategory =
  | 'ONCOLOGY'
  | 'NEUROLOGY'
  | 'CARDIOLOGY'
  | 'INFECTIOUS DISEASE'
  | 'RARE DISEASE'
  | 'ENDOCRINOLOGY';

export type MarketStatus = 'Open' | 'Locked' | 'Resolved';
export type CanonicalMarketStatus =
  | 'OPEN'
  | 'LOCKED'
  | 'RETRYABLE'
  | 'RESOLVED_YES'
  | 'RESOLVED_NO'
  | 'CANCELLED_REFUND';

export interface OfficialSource {
  id: string;
  title: string;
  description: string;
  url: string;
  icon?: 'link' | 'science' | 'file-text' | 'external-link';
}

export interface ResolutionScope {
  targetIndication: string;
  biomarker: string;
  populationScope: string;
  diseaseStage: string;
  priorTherapy: string;
  combinationRequirement: string;
  approvalClass: string;
  specificDrug: string;
  deadline: string;
}

export interface LifecycleStep {
  label: string;
  date?: string;
  status: 'completed' | 'current' | 'upcoming';
}

export interface Market {
  id: string;
  code: string;
  title: string;
  description: string;
  category: MarketCategory;
  status: MarketStatus;
  canonicalStatus: CanonicalMarketStatus;
  statusLabel: string;
  verdict: string;
  consequenceClass: string;
  fundingOpen: boolean;
  resolutionDate: string;
  refundDate: string;
  collateralYes: number;
  collateralNo: number;
  featured?: boolean;
  resolutionScope: ResolutionScope;
  sources: OfficialSource[];
  lifecycle: LifecycleStep[];
  creator: string;
  applicationNumber: string;
  labelSetId: string;
  labelEffectiveTime: string;
  attemptCount: number;
  availableActions: UserAction[];
}

export interface UserPosition {
  id: string;
  marketId: string;
  marketTitle: string;
  position: 'YES' | 'NO' | '';
  stakedAmount: number;
  claimed: boolean;
  creditedAmount: number;
  isResolved: boolean;
  isClaimable: boolean;
  targetResolutionDate: string;
}

export interface UserWallet {
  isConnected: boolean;
  address: `0x${string}` | '';
  providerName: string;
  credit: number;
  totalValueLocked: number;
  pendingResolution: number;
}

export type UserAction = 'fund' | 'lock' | 'resolve' | 'retry' | 'cancel' | 'claim' | 'withdraw';

export interface CreateMarketInput {
  marketId: string;
  title: string;
  category: string;
  drugName: string;
  applicationNumber: string;
  labelSetId: string;
  labelEffectiveTime: string;
  approvalUrl: string;
  condition: string;
  biomarker: string;
  population: string;
  diseaseStage: string;
  priorTherapy: string;
  combinationRequirement: string;
  approvalClass: string;
  closeAt: string;
  resolveAt: string;
  refundAt: string;
}

export interface TransactionPhase {
  status: 'idle' | 'submitting' | 'submitted' | 'decided' | 'finalized' | 'failed';
  hash?: string;
  message?: string;
}
