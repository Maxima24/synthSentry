"use client";

import type { ApiEnvelope, AuthTokens } from "./types";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "https://synthsentry.up.railway.app";

const ACCESS_KEY = "ss.accessToken";
const REFRESH_KEY = "ss.refreshToken";

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(ACCESS_KEY);
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(REFRESH_KEY);
}

export function setTokens(tokens: AuthTokens) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ACCESS_KEY, tokens.accessToken);
  window.localStorage.setItem(REFRESH_KEY, tokens.refreshToken);
}

export function clearTokens() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(ACCESS_KEY);
  window.localStorage.removeItem(REFRESH_KEY);
}

export class ApiError extends Error {
  status: number;
  body?: unknown;
  constructor(message: string, status: number, body?: unknown) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

interface FetchOptions extends RequestInit {
  auth?: boolean;
  json?: unknown;
}

async function doFetch<T>(path: string, opts: FetchOptions = {}): Promise<T> {
  const { auth = true, json, headers, ...rest } = opts;

  const finalHeaders: Record<string, string> = {
    Accept: "application/json",
    ...(headers as Record<string, string> | undefined),
  };

  if (json !== undefined) {
    finalHeaders["Content-Type"] = "application/json";
  }

  if (auth) {
    const token = getAccessToken();
    if (token) finalHeaders["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...rest,
    headers: finalHeaders,
    body: json !== undefined ? JSON.stringify(json) : rest.body,
  });

  const text = await res.text();
  const body = text ? safeJson(text) : undefined;

  if (!res.ok) {
    const message =
      (body && typeof body === "object" && "message" in body
        ? String((body as { message: unknown }).message)
        : res.statusText) || "Request failed";
    throw new ApiError(message, res.status, body);
  }

  return body as T;
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

async function refreshSession(): Promise<boolean> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;
  try {
    const res = await doFetch<ApiEnvelope<AuthTokens>>("/auth/refresh", {
      method: "POST",
      auth: false,
      json: { refreshToken },
    });
    setTokens(res.data);
    return true;
  } catch {
    clearTokens();
    return false;
  }
}

export async function apiFetch<T>(
  path: string,
  opts: FetchOptions = {}
): Promise<T> {
  try {
    return await doFetch<T>(path, opts);
  } catch (err) {
    if (err instanceof ApiError && err.status === 401 && opts.auth !== false) {
      const refreshed = await refreshSession();
      if (refreshed) {
        return await doFetch<T>(path, opts);
      }
    }
    throw err;
  }
}

export { API_BASE_URL };
