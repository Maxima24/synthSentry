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

export interface Holding {
  id: string;
  name?: string | null;
  symbol: string;
  quantity: number | string;
  portfolioId?: string;
  currentPrice?: number;
  change24h?: number;
  value?: number;
}

export interface Portfolio {
  id: string;
  name: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  holdings?: Holding[];
  totalValue?: number;
  lastUpdated?: string;
}

export interface RiskSnapshot {
  id: string;
  portfolioId: string;
  overallScore: number;
  explanation: string;
  holdingScores?: unknown;
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

export interface AlertConfig {
  id: string;
  holdingId: string;
  threshold: number;
  reason: string;
  triggeredAt?: string | null;
  createdAt: string;
}

export interface RiskSummary {
  portfolio?: { id: string; name: string; totalValue: number };
  risk?: RiskScore;
  alerts?: string[];
  activeAnomalies?: string[];
}

export interface MarketTrend {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  trend?: string;
  volatility?: number;
}

export interface SearchResult {
  symbol: string;
  name: string;
  type: string;
}

export interface Asset {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  volume: number;
  marketCap: number;
  currency: string;
  type: string;
}

export interface PricePoint {
  timestamp: string;
  price: number;
  volume?: number;
}

export interface PriceHistory {
  symbol: string;
  timeframe: string;
  data: PricePoint[];
}

export type Timeframe = "1h" | "24h" | "7d" | "30d";
