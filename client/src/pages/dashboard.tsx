import { useQuery } from "@tanstack/react-query";
import { useLocation, Link, Redirect } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest, queryClient, getQueryFn } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";
import {
  LogOut, Package, ArrowDownRight, ArrowUpRight, User as UserIcon,
  TrendingUp, RefreshCw, LayoutDashboard, ClipboardList, Wallet, Home,
  ChevronLeft, ChevronRight, MessageSquare,
} from "lucide-react";
import { SamsungBadge } from "@/components/samsung-logo";
import type { User, StockTransaction } from "@shared/schema";
import { useState, useEffect } from "react";

type DashSection = "overview" | "holdings" | "transactions";

const sidebarItems: { id: DashSection; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "overview", label: "계좌 총괄", icon: LayoutDashboard },
  { id: "holdings", label: "보유 종목", icon: Wallet },
  { id: "transactions", label: "거래 내역", icon: ClipboardList },
];

export default function DashboardPage() {
  const [, setLocation] = useLocation();
  const [activeSection, setActiveSection] = useState<DashSection>("overview");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const { data: authData, isLoading: authLoading } = useQuery<{ user: User } | null>({
    queryKey: ["/api/auth/me"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  const { data: transactions, isLoading: txLoading } = useQuery<StockTransaction[]>({
    queryKey: ["/api/transactions/my"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: !!authData?.user,
  });

  const { data: stockData, isLoading: stockLoading, refetch: refetchStock } = useQuery<{
    currentPrice: number;
    change: number;
    changePercent: number;
    previousClose: number;
  }>({
    queryKey: ["/api/stock/samsung"],
    refetchInterval: 10000,
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/auth/logout");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      setLocation("/login");
    },
  });

  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  useEffect(() => {
    if (stockData?.currentPrice) setLastUpdated(new Date());
  }, [stockData?.currentPrice]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="space-y-4 w-full max-w-md px-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (!authData?.user) {
    return <Redirect to="/login" />;
  }

  const user = authData.user;
  const txList = transactions || [];
  const livePrice = stockData?.currentPrice || 0;
  const priceChange = stockData?.change || 0;
  const changePct = stockData?.changePercent || 0;

  const totalIn = txList.filter((t) => t.type === "in").reduce((sum, t) => sum + t.quantity, 0);
  const totalOut = txList.filter((t) => t.type === "out").reduce((sum, t) => sum + t.quantity, 0);
  const totalHolding = totalIn - totalOut;

  const holdings: Record<string, { qty: number; totalCost: number }> = {};
  txList.forEach((tx) => {
    const key = tx.stockName;
    if (!holdings[key]) holdings[key] = { qty: 0, totalCost: 0 };
    if (tx.type === "in") {
      holdings[key].qty += tx.quantity;
      holdings[key].totalCost += tx.quantity * tx.pricePerShare;
    } else {
      holdings[key].qty -= tx.quantity;
      holdings[key].totalCost -= tx.quantity * tx.pricePerShare;
    }
  });

  const holdingsList = Object.entries(holdings)
    .filter(([, v]) => v.qty > 0)
    .map(([name, v]) => {
      const avgPrice = Math.round(v.totalCost / v.qty);
      const currentPrice = name === "삼성전자" && livePrice > 0 ? livePrice : avgPrice;
      const evalAmount = v.qty * currentPrice;
      const profitLoss = evalAmount - v.totalCost;
      const profitPct = v.totalCost > 0 ? ((profitLoss / v.totalCost) * 100) : 0;
      return { name, qty: v.qty, avgPrice, currentPrice, evalAmount, totalCost: v.totalCost, profitLoss, profitPct };
    });

  const totalEval = holdingsList.reduce((s, h) => s + h.evalAmount, 0);
  const totalCost = holdingsList.reduce((s, h) => s + h.totalCost, 0);
  const totalProfit = totalEval - totalCost;
  const totalProfitPct = totalCost > 0 ? ((totalProfit / totalCost) * 100) : 0;

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <aside className={`${sidebarCollapsed ? "w-16" : "w-60"} border-r bg-muted/30 flex flex-col transition-all duration-200 shrink-0`}>
        <div className={`h-14 border-b flex items-center ${sidebarCollapsed ? "justify-center px-2" : "px-4"} gap-2`}>
          {!sidebarCollapsed && (
            <>
              <SamsungBadge size={28} />
              <div className="flex flex-col min-w-0">
                <span className="font-bold text-sm truncate">IBK기업증권</span>
                <span className="text-[11px] text-muted-foreground">내 계좌</span>
              </div>
            </>
          )}
          {sidebarCollapsed && <SamsungBadge size={28} />}
        </div>

        <nav className="flex-1 py-3 px-2 space-y-1">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`w-full flex items-center gap-3 rounded-md text-sm font-medium transition-colors ${sidebarCollapsed ? "justify-center px-2 py-2.5" : "px-3 py-2.5"} ${isActive ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
                data-testid={`nav-dash-${item.id}`}
                title={sidebarCollapsed ? item.label : undefined}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {!sidebarCollapsed && <span>{item.label}</span>}
              </button>
            );
          })}
        </nav>

        <div className="border-t p-2 space-y-1">
          {!sidebarCollapsed && (
            <div className="px-3 py-2 mb-1">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="text-xs font-bold text-primary">{user.fullName.charAt(0)}</span>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{user.fullName}</p>
                  <p className="text-[11px] text-muted-foreground truncate">{user.bank}</p>
                </div>
              </div>
            </div>
          )}
          <Link href="/chat">
            <button className={`w-full flex items-center gap-3 rounded-md text-sm text-muted-foreground transition-colors ${sidebarCollapsed ? "justify-center px-2 py-2.5" : "px-3 py-2.5"}`} data-testid="nav-dash-chat" title={sidebarCollapsed ? "1:1 상담" : undefined}>
              <MessageSquare className="w-4 h-4 shrink-0" />
              {!sidebarCollapsed && <span>1:1 상담</span>}
            </button>
          </Link>
          <Link href="/">
            <button className={`w-full flex items-center gap-3 rounded-md text-sm text-muted-foreground transition-colors ${sidebarCollapsed ? "justify-center px-2 py-2.5" : "px-3 py-2.5"}`} data-testid="nav-dash-home" title={sidebarCollapsed ? "메인 홈" : undefined}>
              <Home className="w-4 h-4 shrink-0" />
              {!sidebarCollapsed && <span>메인 홈</span>}
            </button>
          </Link>
          <button
            onClick={() => logoutMutation.mutate()}
            className={`w-full flex items-center gap-3 rounded-md text-sm text-muted-foreground transition-colors ${sidebarCollapsed ? "justify-center px-2 py-2.5" : "px-3 py-2.5"}`}
            data-testid="button-logout"
            title={sidebarCollapsed ? "로그아웃" : undefined}
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {!sidebarCollapsed && <span>로그아웃</span>}
          </button>
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className={`w-full flex items-center gap-3 rounded-md text-sm text-muted-foreground transition-colors ${sidebarCollapsed ? "justify-center px-2 py-2" : "px-3 py-2"}`}
            data-testid="button-toggle-sidebar"
          >
            {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <><ChevronLeft className="w-4 h-4 shrink-0" /><span>접기</span></>}
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-14 border-b bg-background flex items-center justify-between gap-4 px-6 shrink-0">
          <h1 className="font-bold text-lg" data-testid="text-dashboard-title">
            {sidebarItems.find((i) => i.id === activeSection)?.label}
          </h1>
          <div className="flex items-center gap-3">
            {lastUpdated && (
              <span className="text-xs text-muted-foreground hidden sm:block">
                {lastUpdated.toLocaleTimeString("ko-KR")} 기준
              </span>
            )}
            <Button variant="outline" size="sm" onClick={() => refetchStock()} data-testid="button-refresh-price">
              <RefreshCw className="w-3.5 h-3.5 mr-1" /> 시세 갱신
            </Button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeSection === "overview" && (
            <>
              <Card className="p-5">
                <div className="flex items-center justify-between gap-4 mb-3 flex-wrap">
                  <h3 className="text-sm text-muted-foreground">삼성전자 실시간 시세</h3>
                  <Badge variant="outline" className="font-mono">005930</Badge>
                </div>
                <div className="flex items-baseline gap-3 flex-wrap">
                  {stockLoading ? (
                    <Skeleton className="h-8 w-32" />
                  ) : (
                    <>
                      <span className="text-3xl font-bold tabular-nums" data-testid="text-live-price">
                        {livePrice > 0 ? livePrice.toLocaleString() : "-"}원
                      </span>
                      <span className={`text-base font-semibold tabular-nums ${priceChange >= 0 ? "text-red-500" : "text-blue-500"}`}>
                        {priceChange >= 0 ? "+" : ""}{priceChange.toLocaleString()}원 ({priceChange >= 0 ? "+" : ""}{changePct.toFixed(2)}%)
                      </span>
                    </>
                  )}
                </div>
              </Card>

              <Card className="p-5">
                <h3 className="text-sm text-muted-foreground mb-4">총 자산 평가</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">평가금액</p>
                    <p className="text-2xl font-bold tabular-nums" data-testid="text-total-eval">{totalEval.toLocaleString()}원</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">총 매입금액</p>
                    <p className="text-2xl font-bold tabular-nums" data-testid="text-total-cost">{totalCost.toLocaleString()}원</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">평가손익</p>
                    <p className={`text-2xl font-bold tabular-nums ${totalProfit >= 0 ? "text-red-500" : "text-blue-500"}`} data-testid="text-total-profit">
                      {totalProfit >= 0 ? "+" : ""}{totalProfit.toLocaleString()}원
                    </p>
                    <p className={`text-sm font-medium tabular-nums ${totalProfitPct >= 0 ? "text-red-500" : "text-blue-500"}`} data-testid="text-total-profit-pct">
                      수익률 {totalProfitPct >= 0 ? "+" : ""}{totalProfitPct.toFixed(2)}%
                    </p>
                  </div>
                </div>
              </Card>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card className="p-5">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">총 보유수량</p>
                      <p className="text-2xl font-bold mt-1 tabular-nums" data-testid="text-total-holding">{totalHolding.toLocaleString()}주</p>
                    </div>
                    <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center">
                      <Package className="w-5 h-5 text-primary" />
                    </div>
                  </div>
                </Card>
                <Card className="p-5">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">총 입고</p>
                      <p className="text-2xl font-bold mt-1 text-red-500 tabular-nums" data-testid="text-total-in">{totalIn.toLocaleString()}주</p>
                    </div>
                    <div className="w-10 h-10 rounded-md bg-red-500/10 flex items-center justify-center">
                      <ArrowDownRight className="w-5 h-5 text-red-500" />
                    </div>
                  </div>
                </Card>
                <Card className="p-5">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">총 출고</p>
                      <p className="text-2xl font-bold mt-1 text-blue-500 tabular-nums" data-testid="text-total-out">{totalOut.toLocaleString()}주</p>
                    </div>
                    <div className="w-10 h-10 rounded-md bg-blue-500/10 flex items-center justify-center">
                      <ArrowUpRight className="w-5 h-5 text-blue-500" />
                    </div>
                  </div>
                </Card>
              </div>

              <Card className="p-5">
                <h3 className="text-sm text-muted-foreground mb-3">내 정보</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">아이디</span>
                    <p className="font-medium" data-testid="text-my-username">{user.username}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">성명</span>
                    <p className="font-medium">{user.fullName}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">은행</span>
                    <p className="font-medium">{user.bank}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">계좌번호</span>
                    <p className="font-medium">{user.accountNumber}</p>
                  </div>
                </div>
              </Card>
            </>
          )}

          {activeSection === "holdings" && (
            <>
              <Card className="p-5">
                <div className="flex items-center justify-between gap-4 mb-3 flex-wrap">
                  <h3 className="text-sm text-muted-foreground">삼성전자 현재가</h3>
                  <span className={`text-lg font-bold tabular-nums ${priceChange >= 0 ? "text-red-500" : "text-blue-500"}`}>
                    {livePrice > 0 ? livePrice.toLocaleString() : "-"}원
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">평가금액</p>
                    <p className="text-xl font-bold tabular-nums">{totalEval.toLocaleString()}원</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">매입금액</p>
                    <p className="text-xl font-bold tabular-nums">{totalCost.toLocaleString()}원</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">평가손익</p>
                    <p className={`text-xl font-bold tabular-nums ${totalProfit >= 0 ? "text-red-500" : "text-blue-500"}`}>
                      {totalProfit >= 0 ? "+" : ""}{totalProfit.toLocaleString()}원 ({totalProfitPct >= 0 ? "+" : ""}{totalProfitPct.toFixed(2)}%)
                    </p>
                  </div>
                </div>
              </Card>

              {holdingsList.length === 0 ? (
                <Card className="p-12 text-center">
                  <Package className="w-10 h-10 mx-auto mb-3 opacity-30 text-muted-foreground" />
                  <p className="font-medium text-muted-foreground">보유 중인 종목이 없습니다</p>
                  <p className="text-sm text-muted-foreground mt-1">관리자에게 입고 요청하세요</p>
                </Card>
              ) : (
                <Card className="p-0 overflow-hidden">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>종목명</TableHead>
                          <TableHead className="text-right">보유수량</TableHead>
                          <TableHead className="text-right">평균단가</TableHead>
                          <TableHead className="text-right">현재가</TableHead>
                          <TableHead className="text-right">평가금액</TableHead>
                          <TableHead className="text-right">평가손익</TableHead>
                          <TableHead className="text-right">수익률</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {holdingsList.map((h) => (
                          <TableRow key={h.name} data-testid={`row-holding-${h.name}`}>
                            <TableCell className="font-semibold">{h.name}</TableCell>
                            <TableCell className="text-right font-mono tabular-nums">{h.qty.toLocaleString()}주</TableCell>
                            <TableCell className="text-right font-mono tabular-nums">{h.avgPrice.toLocaleString()}원</TableCell>
                            <TableCell className="text-right font-mono tabular-nums">{h.currentPrice.toLocaleString()}원</TableCell>
                            <TableCell className="text-right font-mono tabular-nums">{h.evalAmount.toLocaleString()}원</TableCell>
                            <TableCell className={`text-right font-mono tabular-nums font-semibold ${h.profitLoss >= 0 ? "text-red-500" : "text-blue-500"}`}>
                              {h.profitLoss >= 0 ? "+" : ""}{h.profitLoss.toLocaleString()}원
                            </TableCell>
                            <TableCell className={`text-right font-mono tabular-nums font-semibold ${h.profitPct >= 0 ? "text-red-500" : "text-blue-500"}`}>
                              {h.profitPct >= 0 ? "+" : ""}{h.profitPct.toFixed(2)}%
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </Card>
              )}
            </>
          )}

          {activeSection === "transactions" && (
            <>
              {txLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
                </div>
              ) : txList.length === 0 ? (
                <Card className="p-12 text-center">
                  <Package className="w-10 h-10 mx-auto mb-3 opacity-30 text-muted-foreground" />
                  <p className="font-medium text-muted-foreground">거래 내역이 없습니다</p>
                  <p className="text-sm text-muted-foreground mt-1">관리자가 주식을 입고하면 여기에 표시됩니다</p>
                </Card>
              ) : (
                <Card className="p-0 overflow-hidden">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>유형</TableHead>
                          <TableHead>카테고리</TableHead>
                          <TableHead>종목</TableHead>
                          <TableHead className="text-right">수량</TableHead>
                          <TableHead className="text-right">단가</TableHead>
                          <TableHead className="text-right">총액</TableHead>
                          <TableHead>메모</TableHead>
                          <TableHead>일시</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {txList.map((tx) => (
                          <TableRow key={tx.id} data-testid={`row-transaction-${tx.id}`}>
                            <TableCell>
                              <Badge
                                variant={tx.type === "in" ? "default" : "secondary"}
                                className={tx.type === "in" ? "bg-red-500 border-red-500" : "bg-blue-500 border-blue-500 text-white"}
                              >
                                {tx.type === "in" ? "입고" : "출고"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm">{tx.category}</TableCell>
                            <TableCell className="font-medium">{tx.stockName}</TableCell>
                            <TableCell className="text-right font-mono tabular-nums">{tx.quantity.toLocaleString()}주</TableCell>
                            <TableCell className="text-right font-mono tabular-nums">{tx.pricePerShare.toLocaleString()}원</TableCell>
                            <TableCell className="text-right font-mono tabular-nums">{(tx.quantity * tx.pricePerShare).toLocaleString()}원</TableCell>
                            <TableCell className="text-sm text-muted-foreground">{tx.memo || "-"}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">{new Date(tx.createdAt).toLocaleDateString("ko-KR")}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </Card>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
