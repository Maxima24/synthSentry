"use client";

import { apiFetch } from "./api";
import type {
  AlertConfig,
  ApiEnvelope,
  BayseEvent,
  EventSearchResult,
  Holding,
  MarketTrendEvent,
  Portfolio,
  RiskScore,
  RiskSnapshot,
  RiskSummary,
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

export async function deletePortfolio(portfolioId: string): Promise<void> {
  await apiFetch<unknown>(`/portfolio/${portfolioId}`, { method: "DELETE" });
}

export async function addHolding(
  portfolioId: string,
  input: { eventId: string; outcome: "YES" | "NO"; quantity: number }
): Promise<Holding> {
  const res = await apiFetch<ApiEnvelope<Holding> | Holding>(
    `/portfolio/${portfolioId}/holdings`,
    {
      method: "POST",
      json: { symbol: input.eventId, outcome: input.outcome, quantity: input.quantity },
    }
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

export async function getMarketTrends(
  limit = 6
): Promise<MarketTrendEvent[]> {
  const res = await apiFetch<
    ApiEnvelope<MarketTrendEvent[]> | MarketTrendEvent[]
  >(`/bayse/market/trends?limit=${limit}`, { auth: false });
  return unwrap<MarketTrendEvent[]>(res);
}

export async function searchEvents(
  keyword: string,
  category?: string
): Promise<EventSearchResult[]> {
  const trimmed = keyword.trim();
  if (!trimmed) return [];
  const params = new URLSearchParams({ keyword: trimmed });
  if (category) params.set("category", category);
  const res = await apiFetch<
    ApiEnvelope<EventSearchResult[]> | EventSearchResult[]
  >(`/portfolio/search?${params.toString()}`);
  return unwrap<EventSearchResult[]>(res);
}

export async function getEvent(eventId: string): Promise<BayseEvent> {
  const res = await apiFetch<ApiEnvelope<BayseEvent> | BayseEvent>(
    `/bayse/events/${encodeURIComponent(eventId)}`,
    { auth: false }
  );
  return unwrap<BayseEvent>(res);
}

function unwrap<T>(res: ApiEnvelope<T> | T): T {
  if (res && typeof res === "object" && "data" in res && "message" in res) {
    return (res as ApiEnvelope<T>).data;
  }
  return res as T;
}
