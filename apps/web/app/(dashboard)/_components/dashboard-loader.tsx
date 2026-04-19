"use client";

import { BrandSplash } from "../../_components/brand-loader";

interface DashboardLoaderProps {
  message?: string;
}

export function DashboardLoader({
  message = "Preparing your portfolio",
}: DashboardLoaderProps) {
  return <BrandSplash message={message} />;
}
