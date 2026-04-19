"use client";

import { apiFetch } from "./api";
import type {
  AlertConfig,
  ApiEnvelope,
  Asset,
  Holding,
  MarketTrend,
  Portfolio,
  PriceHistory,
  RiskScore,
  RiskSnapshot,
  RiskSummary,
  SearchResult,
  Timeframe,
} from "./types";

export async function listPortfolios(): Promise<Portfolio[]> {
  const res = await apiFetch<ApiEnvelope<Portfolio[]> | Portfolio[]>(
    "/portfolio"
  );
  return unwrap<Portfolio[]>(res);
}

export async function getPortfolio(id: string): Promise<Portfolio> {
  const res = await apiFetch<ApiEnvelope<Portfolio> | Portfolio>(
    `/portfolio/${id}`
  );
  return unwrap<Portfolio>(res);
}

export async function createPortfolio(name: string): Promise<Portfolio> {
  const res = await apiFetch<ApiEnvelope<Portfolio> | Portfolio>("/portfolio", {
    method: "POST",
    json: { name },
  });
  return unwrap<Portfolio>(res);
}

export async function getRiskHistory(
  portfolioId: string
): Promise<RiskSnapshot[]> {
  const res = await apiFetch<ApiEnvelope<RiskSnapshot[]> | RiskSnapshot[]>(
    `/risk/history/${portfolioId}`
  );
  return unwrap<RiskSnapshot[]>(res);
}

export async function getRiskSummary(
  portfolioId: string
): Promise<RiskSummary> {
  const res = await apiFetch<ApiEnvelope<RiskSummary> | RiskSummary>(
    `/risk/summary/${portfolioId}`
  );
  return unwrap<RiskSummary>(res);
}

export async function getAllAlerts(): Promise<AlertConfig[]> {
  const res = await apiFetch<ApiEnvelope<AlertConfig[]> | AlertConfig[]>(
    "/risk/alerts"
  );
  return unwrap<AlertConfig[]>(res);
}

export async function addHolding(
  portfolioId: string,
  symbol: string,
  quantity: number
): Promise<Holding> {
  const res = await apiFetch<ApiEnvelope<Holding> | Holding>(
    `/portfolio/${portfolioId}/holdings`,
    { method: "POST", json: { symbol, quantity } }
  );
  return unwrap<Holding>(res);
}

export async function deleteHolding(holdingId: string): Promise<void> {
  await apiFetch<unknown>(`/portfolio/holdings/${holdingId}`, {
    method: "DELETE",
  });
}

export async function evaluateRisk(
  portfolioId: string,
  forceRefresh = false
): Promise<RiskScore> {
  const res = await apiFetch<ApiEnvelope<RiskScore> | RiskScore>(
    "/risk/evaluate",
    { method: "POST", json: { portfolioId, forceRefresh } }
  );
  return unwrap<RiskScore>(res);
}

export async function getMarketTrends(limit = 6): Promise<MarketTrend[]> {
  const res = await apiFetch<ApiEnvelope<MarketTrend[]> | MarketTrend[]>(
    `/bayse/market/trends?limit=${limit}`,
    { auth: false }
  );
  return unwrap<MarketTrend[]>(res);
}

export async function searchAssets(query: string): Promise<SearchResult[]> {
  if (!query.trim()) return [];
  const res = await apiFetch<ApiEnvelope<SearchResult[]> | SearchResult[]>(
    `/bayse/search?q=${encodeURIComponent(query)}`,
    { auth: false }
  );
  return unwrap<SearchResult[]>(res);
}

export async function getAsset(symbol: string): Promise<Asset> {
  const res = await apiFetch<ApiEnvelope<Asset> | Asset>(
    `/bayse/assets/${encodeURIComponent(symbol)}`,
    { auth: false }
  );
  return unwrap<Asset>(res);
}

export async function getAssetHistory(
  symbol: string,
  timeframe: Timeframe = "24h"
): Promise<PriceHistory> {
  const res = await apiFetch<ApiEnvelope<PriceHistory> | PriceHistory>(
    `/bayse/assets/${encodeURIComponent(symbol)}/history?timeframe=${timeframe}`,
    { auth: false }
  );
  return unwrap<PriceHistory>(res);
}

export async function setAlertThreshold(
  holdingId: string,
  threshold: number,
  reason?: string
): Promise<void> {
  await apiFetch(`/risk/alerts/${holdingId}`, {
    method: "POST",
    json: { threshold, ...(reason ? { reason } : {}) },
  });
}

function unwrap<T>(res: ApiEnvelope<T> | T): T {
  if (res && typeof res === "object" && "data" in res && "message" in res) {
    return (res as ApiEnvelope<T>).data;
  }
  return res as T;
}
