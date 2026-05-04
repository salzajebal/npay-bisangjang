import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import TradePage from "@/pages/landing";
import LoginPage from "@/pages/login";
import RegisterPage from "@/pages/register";
import DashboardPage from "@/pages/dashboard";
import AdminPage from "@/pages/admin";
import AdminLoginPage from "@/pages/admin-login";
import ChatPage from "@/pages/chat";
import MyStocksPage from "@/pages/my-stocks";
import IPOCalendarPage from "@/pages/ipo-calendar";
import AdminManualPage from "@/pages/admin-manual";
import TestAdminPage from "@/pages/test-admin";
import StockDetailPage from "@/pages/stock-detail";
import { useEffect, useState } from "react";

type FallbackUrl = { id: string; url: string; label: string; priority: number; isActive: boolean };

async function tryUrl(url: string, timeoutMs = 4000): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    await fetch(url, { signal: controller.signal, mode: "no-cors", cache: "no-store" });
    clearTimeout(timer);
    return true;
  } catch {
    return false;
  }
}

function DomainRedirectGuard({ children }: { children: React.ReactNode }) {
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    fetch("/api/domain-redirect", { credentials: "include" })
      .then((r) => r.json())
      .then(async (data: { urls?: FallbackUrl[] }) => {
        const urls = data?.urls ?? [];
        if (urls.length === 0) { setChecked(true); return; }
        for (const entry of urls) {
          const alive = await tryUrl(entry.url);
          if (alive) {
            window.location.href = entry.url;
            return;
          }
        }
        setChecked(true);
      })
      .catch(() => setChecked(true));
  }, []);

  if (!checked) return null;
  return <>{children}</>;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={TradePage} />
      <Route path="/login" component={LoginPage} />
      <Route path="/register" component={RegisterPage} />
      <Route path="/dashboard" component={DashboardPage} />
      <Route path="/my-stocks" component={MyStocksPage} />
      <Route path="/ipo-calendar" component={IPOCalendarPage} />
      <Route path="/admin/manual" component={AdminManualPage} />
      <Route path="/admin/login" component={AdminLoginPage} />
      <Route path="/admin" component={AdminPage} />
      <Route path="/test" component={TestAdminPage} />
      <Route path="/stock/:name" component={StockDetailPage} />
      <Route path="/chat" component={ChatPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <DomainRedirectGuard>
          <Router />
        </DomainRedirectGuard>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
