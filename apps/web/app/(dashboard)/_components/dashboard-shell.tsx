"use client";

import { useAuthGuard } from "../../_lib/use-auth";
import { useAlerts } from "../../_lib/queries";
import { DashboardLoader } from "./dashboard-loader";
import { Sidebar } from "./sidebar";
import { SidebarCollapseProvider } from "./sidebar-collapse-context";
import { Topbar } from "./topbar";

export function DashboardShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, logout } = useAuthGuard();
  const { data: alerts } = useAlerts();

  const alertCount = alerts?.length ?? 0;

  if (loading || !user) {
    return <DashboardLoader message="Signing you in" />;
  }

  return (
    <SidebarCollapseProvider>
      <div className="flex min-h-screen bg-background">
        <Sidebar onLogout={logout} />
        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar user={user} alertCount={alertCount} onLogout={logout} />
          <main className="flex-1 px-6 py-8">{children}</main>
        </div>
      </div>
    </SidebarCollapseProvider>
  );
}
