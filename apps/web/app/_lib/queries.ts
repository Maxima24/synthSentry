"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import { getMe } from "./auth";
import {
  addHolding,
  createPortfolio,
  deleteHolding,
  deletePortfolio,
  evaluateRisk,
  getAllAlerts,
  getEvent,
  getMarketTrends,
  getPortfolio,
  getRiskHistory,
  getRiskSummary,
  listPortfolios,
  searchEvents,
  setAlertThreshold,
} from "./portfolio-api";
import type {
  AlertConfig,
  AuthUser,
  BayseEvent,
  EventSearchResult,
  MarketTrendEvent,
  Portfolio,
  RiskSnapshot,
  RiskSummary,
} from "./types";

export const qk = {
  me: ["auth", "me"] as const,
  portfolios: ["portfolios"] as const,
  portfolio: (id: string) => ["portfolios", id] as const,
  riskHistory: (id: string) => ["risk", "history", id] as const,
  riskSummary: (id: string) => ["risk", "summary", id] as const,
  alerts: ["alerts"] as const,
  marketTrends: (limit: number) => ["market", "trends", limit] as const,
  event: (eventId: string) => ["event", eventId] as const,
  search: (q: string) => ["search", q] as const,
};

const STALE = {
  user: 5 * 60_000,
  portfolioList: 60_000,
  portfolioDetail: 30_000,
  riskSummary: 30_000,
  riskHistory: 60_000,
  alerts: 30_000,
  marketTrends: 30_000,
  event: 30_000,
  search: 2 * 60_000,
};

export function useMe(
  options?: Omit<UseQueryOptions<AuthUser>, "queryKey" | "queryFn">
) {
  return useQuery<AuthUser>({
    queryKey: qk.me,
    queryFn: getMe,
    staleTime: STALE.user,
    ...options,
  });
}

export function usePortfolios() {
  return useQuery<Portfolio[]>({
    queryKey: qk.portfolios,
    queryFn: listPortfolios,
    staleTime: STALE.portfolioList,
  });
}

export function usePortfolio(id: string | null | undefined) {
  return useQuery<Portfolio>({
    queryKey: qk.portfolio(id ?? ""),
    queryFn: () => getPortfolio(id as string),
    enabled: !!id,
    staleTime: STALE.portfolioDetail,
  });
}

export function useRiskHistory(id: string | null | undefined) {
  return useQuery<RiskSnapshot[]>({
    queryKey: qk.riskHistory(id ?? ""),
    queryFn: () => getRiskHistory(id as string),
    enabled: !!id,
    staleTime: STALE.riskHistory,
  });
}

export function useRiskSummary(id: string | null | undefined) {
  return useQuery<RiskSummary>({
    queryKey: qk.riskSummary(id ?? ""),
    queryFn: () => getRiskSummary(id as string),
    enabled: !!id,
    staleTime: STALE.riskSummary,
  });
}

export function useAlerts() {
  return useQuery<AlertConfig[]>({
    queryKey: qk.alerts,
    queryFn: getAllAlerts,
    staleTime: STALE.alerts,
  });
}

export function useMarketTrends(limit = 6) {
  return useQuery<MarketTrendEvent[]>({
    queryKey: qk.marketTrends(limit),
    queryFn: () => getMarketTrends(limit),
    staleTime: STALE.marketTrends,
    retry: false,
  });
}

export function useEvent(eventId: string | null | undefined) {
  return useQuery<BayseEvent>({
    queryKey: qk.event(eventId ?? ""),
    queryFn: () => getEvent(eventId as string),
    enabled: !!eventId,
    staleTime: STALE.event,
    retry: false,
  });
}

export function useEventSearch(query: string) {
  const trimmed = query.trim();
  return useQuery<EventSearchResult[]>({
    queryKey: qk.search(trimmed),
    queryFn: () => searchEvents(trimmed),
    enabled: trimmed.length > 0,
    staleTime: STALE.search,
    retry: false,
  });
}

export function useCreatePortfolio() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => createPortfolio(name),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.portfolios });
    },
  });
}

export function useDeletePortfolio() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (portfolioId: string) => deletePortfolio(portfolioId),
    onSuccess: (_data, portfolioId) => {
      qc.invalidateQueries({ queryKey: qk.portfolios });
      qc.removeQueries({ queryKey: qk.portfolio(portfolioId) });
      qc.removeQueries({ queryKey: qk.riskSummary(portfolioId) });
      qc.removeQueries({ queryKey: qk.riskHistory(portfolioId) });
    },
  });
}

export function useAddHolding(portfolioId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { eventId: string; outcome: "YES" | "NO"; quantity: number }) =>
      addHolding(portfolioId, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.portfolio(portfolioId) });
      qc.invalidateQueries({ queryKey: qk.portfolios });
      qc.invalidateQueries({ queryKey: qk.riskSummary(portfolioId) });
    },
  });
}

export function useDeleteHolding(portfolioId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (holdingId: string) => deleteHolding(holdingId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.portfolios });
      if (portfolioId) {
        qc.invalidateQueries({ queryKey: qk.portfolio(portfolioId) });
        qc.invalidateQueries({ queryKey: qk.riskSummary(portfolioId) });
      }
      qc.invalidateQueries({ queryKey: qk.alerts });
    },
  });
}

export function useEvaluateRisk(portfolioId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (forceRefresh: boolean = true) =>
      evaluateRisk(portfolioId, forceRefresh),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.riskSummary(portfolioId) });
      qc.invalidateQueries({ queryKey: qk.riskHistory(portfolioId) });
    },
  });
}

export function useSetAlertThreshold() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      holdingId: string;
      threshold: number;
      reason?: string;
    }) => setAlertThreshold(input.holdingId, input.threshold, input.reason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.alerts });
    },
  });
}

export function useInvalidateAll() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries();
  };
}

/** Backwards-compat alias — callers still use useAssetSearch name. */
export const useAssetSearch = useEventSearch;
