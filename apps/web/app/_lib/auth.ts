"use client";

import { apiFetch, clearTokens, setTokens } from "./api";
import type { ApiEnvelope, AuthSession, AuthUser } from "./types";

interface LoginInput {
  email: string;
  password: string;
}

interface SignupInput {
  name: string;
  email: string;
  password: string;
}

export async function login(input: LoginInput): Promise<AuthSession> {
  const res = await apiFetch<ApiEnvelope<AuthSession>>("/auth/login", {
    method: "POST",
    auth: false,
    json: input,
  });
  setTokens({
    accessToken: res.data.accessToken,
    refreshToken: res.data.refreshToken,
  });
  return res.data;
}

export async function signup(input: SignupInput): Promise<AuthSession> {
  const res = await apiFetch<ApiEnvelope<AuthSession>>("/auth/register", {
    method: "POST",
    auth: false,
    json: input,
  });
  setTokens({
    accessToken: res.data.accessToken,
    refreshToken: res.data.refreshToken,
  });
  return res.data;
}

export async function getMe(): Promise<AuthUser> {
  const res = await apiFetch<ApiEnvelope<AuthUser>>("/auth/me", {
    method: "GET",
  });
  return res.data;
}

export function logout() {
  clearTokens();
}
