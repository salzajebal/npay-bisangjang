import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest, queryClient, getQueryFn } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";
import { LogOut, Package, ArrowDownRight, ArrowUpRight, User as UserIcon, TrendingUp, TrendingDown, RefreshCw } from "lucide-react";
import { SamsungBadge } from "@/components/samsung-logo";
import type { User, StockTransaction } from "@shared/schema";
import { useState, useEffect } from "react";

export default function DashboardPage() {
  const [, setLocation] = useLocation();

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
    price: number;
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
    if (stockData?.price) setLastUpdated(new Date());
  }, [stockData?.price]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-5xl mx-auto space-y-6">
          <Skeleton className="h-14 w-full" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (!authData?.user) {
    setLocation("/login");
    return null;
  }

  const user = authData.user;
  const txList = transactions || [];
  const livePrice = stockData?.price || 0;
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
    <div className="min-h-screen bg-background">
      <header className="border-b bg-background/95 backdrop-blur sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2.5">
            <SamsungBadge size={30} />
            <span className="font-bold text-base">IBK기업증권</span>
            <div className="h-4 w-px bg-border" />
            <span className="font-semibold text-sm tracking-wide text-muted-foreground">내 계좌</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <UserIcon className="w-4 h-4" />
              <span data-testid="text-user-name">{user.fullName}님</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => logoutMutation.mutate()}
              data-testid="button-logout"
            >
              <LogOut className="w-4 h-4 mr-1" /> 로그아웃
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold" data-testid="text-dashboard-title">내 주식 현황</h1>
            <p className="text-sm text-muted-foreground mt-1">실시간 시세와 수익률을 확인하세요</p>
          </div>
          <div className="flex items-center gap-2">
            {lastUpdated && (
              <span className="text-xs text-muted-foreground">
                {lastUpdated.toLocaleTimeString("ko-KR")} 기준
              </span>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetchStock()}
              data-testid="button-refresh-price"
            >
              <RefreshCw className="w-3.5 h-3.5 mr-1" /> 시세 새로고침
            </Button>
          </div>
        </div>

        <Card className="p-5">
          <div className="flex items-center justify-between gap-4 mb-4 flex-wrap">
            <h3 className="text-sm text-muted-foreground">삼성전자 실시간 시세</h3>
            {stockLoading ? (
              <Skeleton className="h-4 w-20" />
            ) : (
              <Badge variant="outline" className="font-mono">005930</Badge>
            )}
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
          <h3 className="text-sm text-muted-foreground mb-3">총 자산 평가</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-muted-foreground mb-1">평가금액</p>
              <p className="text-2xl font-bold tabular-nums" data-testid="text-total-eval">
                {totalEval.toLocaleString()}원
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">총 매입금액</p>
              <p className="text-2xl font-bold tabular-nums" data-testid="text-total-cost">
                {totalCost.toLocaleString()}원
              </p>
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-muted-foreground">총 보유수량</p>
                <p className="text-2xl font-bold mt-1" data-testid="text-total-holding">
                  {totalHolding.toLocaleString()}주
                </p>
              </div>
              <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center">
                <Package className="w-5 h-5 text-primary" />
              </div>
            </div>
          </Card>
          <Card className="p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-muted-foreground">총 입고수량</p>
                <p className="text-2xl font-bold mt-1 text-red-500" data-testid="text-total-in">
                  {totalIn.toLocaleString()}주
                </p>
              </div>
              <div className="w-10 h-10 rounded-md bg-red-500/10 flex items-center justify-center">
                <ArrowDownRight className="w-5 h-5 text-red-500" />
              </div>
            </div>
          </Card>
          <Card className="p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-muted-foreground">총 출고수량</p>
                <p className="text-2xl font-bold mt-1 text-blue-500" data-testid="text-total-out">
                  {totalOut.toLocaleString()}주
                </p>
              </div>
              <div className="w-10 h-10 rounded-md bg-blue-500/10 flex items-center justify-center">
                <ArrowUpRight className="w-5 h-5 text-blue-500" />
              </div>
            </div>
          </Card>
        </div>

        {holdingsList.length > 0 && (
          <Card className="p-0 overflow-hidden">
            <div className="p-4 border-b">
              <h3 className="font-bold">보유 종목 현황</h3>
              <p className="text-xs text-muted-foreground mt-1">실시간 시세 기준 평가손익</p>
            </div>
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

        <Card className="p-0 overflow-hidden">
          <div className="p-4 border-b">
            <h3 className="font-bold">거래 내역</h3>
            <p className="text-xs text-muted-foreground mt-1">입출고 내역을 확인하세요</p>
          </div>
          {txLoading ? (
            <div className="p-4 space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : txList.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              <Package className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="font-medium">거래 내역이 없습니다</p>
              <p className="text-sm mt-1">관리자가 주식을 입고하면 여기에 표시됩니다</p>
            </div>
          ) : (
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
                      <TableCell className="text-right font-mono">
                        {tx.quantity.toLocaleString()}주
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {tx.pricePerShare.toLocaleString()}원
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {(tx.quantity * tx.pricePerShare).toLocaleString()}원
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {tx.memo || "-"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(tx.createdAt).toLocaleDateString("ko-KR")}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </Card>
      </main>
    </div>
  );
}
