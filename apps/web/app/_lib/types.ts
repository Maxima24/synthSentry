export type UserRole = "USER" | "ADMIN";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthSession extends AuthUser, AuthTokens {}

export interface ApiEnvelope<T> {
  message: string;
  data: T;
}

export type RiskLevel = "low" | "medium" | "high" | "critical";
export type AnomalySeverity = "low" | "medium" | "high";
export type Outcome = "YES" | "NO";

export interface Holding {
  id: string;
  symbol: string;
  eventTitle?: string;
  outcome?: Outcome;
  quantity: number | string;
  currentPrice?: number;
  currentValue?: number;
  percentageChange?: number;
  payoutIfWins?: number;
  isLive?: boolean;
  portfolioId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Portfolio {
  id: string;
  name: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  holdings?: Holding[];
  totalValue?: number;
  totalCost?: number;
  totalPercentageChange?: number;
  wallet?: { usd: number; ngn: number };
  openPositions?: number;
  lastUpdated?: string;
}

export interface RiskSnapshot {
  id: string;
  overallScore: number;
  riskLevel: RiskLevel;
  explanation: string;
  holdingScores: Record<string, number>;
  snapShotAt: string;
}

export interface PerAssetScore {
  symbol: string;
  score: number;
  riskLevel: RiskLevel;
  riskFactors: string[];
}

export interface RiskScore {
  overallScore: number;
  riskLevel: RiskLevel;
  explanation: string;
  reasoningPath: string[];
  anomalies: string[];
  perAssetScores: PerAssetScore[];
  evaluatedAt: string;
}

export interface PortfolioSummaryField {
  id: string;
  name: string;
  totalValue: number;
  totalCost?: number;
  totalPercentageChange?: number;
  walletUsd?: number;
  walletNgn?: number;
  openPositions?: number;
}

export interface AlertSummary {
  id: string;
  label: string;
  threshold: number;
  triggered: boolean;
  triggeredAt?: string | null;
}

export interface AnomalySummary {
  label: string;
  reason: string;
  severity: AnomalySeverity;
}

export interface RiskSummary {
  portfolio?: PortfolioSummaryField;
  risk?: RiskScore;
  alerts?: AlertSummary[];
  activeAnomalies?: AnomalySummary[];
}

export interface AlertConfig {
  id: string;
  label?: string;
  holdingId?: string;
  threshold: number;
  triggered?: boolean;
  triggeredAt?: string | null;
  reason?: string;
  createdAt?: string;
}

export interface MarketTrendEvent {
  eventId: string;
  title: string;
  category: string;
  yesPrice: number;
  totalVolume: number;
  liquidity: number;
  trend: "bullish" | "bearish" | string;
}

export interface EventSearchResult {
  eventId: string;
  slug: string;
  title: string;
  category: string;
  yesPrice: number;
  noPrice: number;
  impliedProbability: number;
  liquidity: number;
  totalVolume: number;
  resolutionDate: string;
  status: string;
}

export interface EventMarketOutcome {
  id: string;
  title: string;
  outcome1Id: string;
  outcome1Label: string;
  outcome1Price: number;
  outcome2Id: string;
  outcome2Label: string;
  outcome2Price: number;
  yesBuyPrice?: number;
  noBuyPrice?: number;
  status?: string;
  imageUrl?: string;
}

export interface BayseEvent {
  id: string;
  slug: string;
  title: string;
  description?: string;
  category: string;
  status: string;
  resolutionDate?: string;
  liquidity: number;
  totalVolume: number;
  totalOrders?: number;
  yesPrice: number;
  noPrice: number;
  impliedProbability: number;
  markets?: EventMarketOutcome[];
}

export interface WalletAsset {
  symbol: string;
  availableBalance: number;
  pendingBalance: number;
  isDefault: boolean;
  depositActive: boolean;
  withdrawalActive: boolean;
}

export interface Wallet {
  assets: WalletAsset[];
  totalUsd: number;
  totalNgn: number;
}
