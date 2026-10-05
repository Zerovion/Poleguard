import type { ReactNode } from "react";

import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { Topbar } from "./Topbar";
import { PageTransition } from "./PageTransition";
import { AlertStateProvider } from "@/features/alert-state";
import { useCriticalWatch } from "@/hooks/use-critical-watch";
import { useCriticalSiren } from "@/hooks/use-critical-siren";

function CriticalWatcher() {
  useCriticalWatch();
  useCriticalSiren();
  return null;
}

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <AlertStateProvider>
      <SidebarProvider>
        <div className="flex min-h-screen w-full bg-background">
          <AppSidebar />
          <SidebarInset className="min-w-0 bg-background">
            <CriticalWatcher />
            <Topbar />
            <main className="flex-1 p-3 sm:p-5">
              <PageTransition>{children}</PageTransition>
            </main>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </AlertStateProvider>
  );
}



export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
        {subtitle ? <p className="text-sm text-muted-foreground">{subtitle}</p> : null}
      </div>
      {action}
    </div>
  );
}
