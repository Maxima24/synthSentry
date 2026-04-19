"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { getAccessToken } from "./api";
import { logout as logoutFn } from "./auth";
import { useMe } from "./queries";
import type { AuthUser } from "./types";

interface UseAuthResult {
  user: AuthUser | null;
  loading: boolean;
  logout: () => void;
}

export function useAuthGuard(): UseAuthResult {
  const router = useRouter();
  const qc = useQueryClient();

  const hasToken = typeof window !== "undefined" && !!getAccessToken();
  const { data, isLoading, isError } = useMe({ enabled: hasToken });

  useEffect(() => {
    if (!hasToken) {
      router.replace("/login");
    }
  }, [hasToken, router]);

  useEffect(() => {
    if (isError) {
      logoutFn();
      qc.clear();
      router.replace("/login");
    }
  }, [isError, qc, router]);

  return {
    user: data ?? null,
    loading: !hasToken || (isLoading && !data),
    logout: () => {
      logoutFn();
      qc.clear();
      router.replace("/login");
    },
  };
}
