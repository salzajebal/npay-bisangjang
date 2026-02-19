import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Link, Redirect } from "wouter";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Package, TrendingUp, TrendingDown, ArrowRightLeft } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { SiteLogoBadge } from "@/components/site-logo";
import { StockIcon } from "@/components/stock-icon";
import type { User, StockTransaction } from "@shared/schema";
import { fetchStockPrices } from "@/lib/market-prices";
import { getQueryFn } from "@/lib/queryClient";

export default function MyStocksPage() {
  const { data: authData, isLoading: userLoading } = useQuery<{ user: User } | null>({
    queryKey: ["/api/auth/me"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  const user = authData?.user ?? null;

  const { data: transactions, isLoading: txLoading } = useQuery<StockTransaction[]>({
    queryKey: ["/api/transactions/my"],
    enabled: !!user,
  });

  const [priceData, setPriceData] = useState<Record<string, { currentPrice: number; changePercent: number }>>({});
  const [transferConfirmOpen, setTransferConfirmOpen] = useState(false);

  const txList = (transactions || []);
  const inTx = txList.filter(tx => tx.type === "in");

  const holdingsMap = new Map<string, { qty: number; totalCost: number; category: string }>();
  for (const tx of inTx) {
    const existing = holdingsMap.get(tx.stockName) || { qty: 0, totalCost: 0, category: tx.category };
    existing.qty += tx.quantity;
    existing.totalCost += tx.quantity * tx.pricePerShare;
    holdingsMap.set(tx.stockName, existing);
  }

  for (const tx of txList.filter(t => t.type === "out")) {
    const existing = holdingsMap.get(tx.stockName);
    if (existing) {
      existing.qty -= tx.quantity;
      if (existing.qty <= 0) holdingsMap.delete(tx.stockName);
    }
  }

  const stockNames = Array.from(holdingsMap.keys());
  const stockNamesKey = JSON.stringify(stockNames);

  useEffect(() => {
    if (stockNames.length > 0) {
      fetchStockPrices(stockNames).then(setPriceData);
    }
  }, [stockNamesKey]);

  if (userLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Skeleton className="w-64 h-8" />
      </div>
    );
  }

  if (!user) {
    return <Redirect to="/login" />;
  }

  const holdings = Array.from(holdingsMap.entries()).map(([name, data]) => {
    const avgPrice = Math.round(data.totalCost / (data.qty || 1));
    const market = priceData[name] || { currentPrice: avgPrice, changePercent: 0 };
    const currentPrice = market.currentPrice;
    const evalAmount = data.qty * currentPrice;
    const totalCost = data.qty * avgPrice;
    const profitLoss = evalAmount - totalCost;
    const profitPct = totalCost > 0 ? ((profitLoss / totalCost) * 100) : 0;
    return {
      name,
      qty: data.qty,
      avgPrice,
      currentPrice,
      evalAmount,
      totalCost,
      profitLoss,
      profitPct,
      category: data.category,
      changePercent: market.changePercent,
    };
  });

  const totalEval = holdings.reduce((sum, h) => sum + h.evalAmount, 0);
  const totalCost = holdings.reduce((sum, h) => sum + h.totalCost, 0);
  const totalProfit = totalEval - totalCost;
  const totalProfitPct = totalCost > 0 ? ((totalProfit / totalCost) * 100) : 0;

  return (
    <div className="min-h-screen bg-white" data-testid="page-my-stocks">
      <header className="border-b border-[#eee]">
        <div className="max-w-[1200px] mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/">
              <span className="flex items-center gap-1.5 cursor-pointer" data-testid="link-home">
                <SiteLogoBadge size={24} />
                <span className="text-[#222] font-bold text-base">증권플러스 <span className="text-[#E8344E]">비상장</span></span>
              </span>
            </Link>
            <span className="text-[#999] text-sm">|</span>
            <span className="text-[#222] text-sm font-medium" data-testid="text-page-title">공모주 마이페이지</span>
          </div>
          <Link href="/">
            <span className="flex items-center gap-1 text-sm text-[#666] hover:text-[#222] cursor-pointer" data-testid="link-back-home">
              <ArrowLeft className="w-4 h-4" />
              홈으로
            </span>
          </Link>
        </div>
      </header>

      <main className="max-w-[1200px] mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-[#222] mb-1" data-testid="text-greeting">{user.fullName}님의 보유 종목</h1>
          <p className="text-sm text-[#666]">관리자가 입고 처리한 종목이 표시됩니다</p>
        </div>

        <div className="bg-[#f8f9fa] rounded-lg p-5 mb-6">
          <div className="flex flex-wrap gap-6 mb-3">
            <div>
              <p className="text-xs text-[#999] mb-1">보유 종목수</p>
              <p className="text-lg font-bold text-[#222]" data-testid="text-holdings-count">{holdings.length}개</p>
            </div>
            <div>
              <p className="text-xs text-[#999] mb-1">총 평가금액</p>
              <p className="text-lg font-bold text-[#222]" data-testid="text-total-value">{totalEval.toLocaleString()}원</p>
            </div>
            <div>
              <p className="text-xs text-[#999] mb-1">총 매입금액</p>
              <p className="text-lg font-bold text-[#222]" data-testid="text-total-cost">{totalCost.toLocaleString()}원</p>
            </div>
          </div>
          <div className="flex items-center gap-3 pt-3 border-t border-[#eee]">
            <div>
              <p className="text-xs text-[#999] mb-1">평가손익</p>
              <p className={`text-lg font-bold tabular-nums ${totalProfit >= 0 ? "text-[#f04452]" : "text-[#3182f6]"}`} data-testid="text-total-profit">
                {totalProfit >= 0 ? "+" : ""}{totalProfit.toLocaleString()}원
                <span className="text-sm ml-1">({totalProfitPct >= 0 ? "+" : ""}{totalProfitPct.toFixed(2)}%)</span>
              </p>
            </div>
          </div>
        </div>

        {txLoading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : holdings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-14 h-14 rounded-full bg-[#f5f5f5] flex items-center justify-center mb-3">
              <Package className="w-6 h-6 text-[#ccc]" />
            </div>
            <p className="text-sm text-[#999]" data-testid="text-no-holdings">보유 중인 종목이 없습니다</p>
            <p className="text-xs text-[#bbb] mt-1">관리자가 주식을 입고하면 여기에 표시됩니다</p>
          </div>
        ) : (
          <>
          <div className="border border-[#eee] rounded-lg overflow-hidden hidden sm:block">
            <Table>
              <TableHeader>
                <TableRow className="bg-[#f8f9fa]">
                  <TableHead className="text-xs text-[#666] font-medium">종목명</TableHead>
                  <TableHead className="text-xs text-[#666] font-medium text-center">카테고리</TableHead>
                  <TableHead className="text-xs text-[#666] font-medium text-right">보유수량</TableHead>
                  <TableHead className="text-xs text-[#666] font-medium text-right">평균단가</TableHead>
                  <TableHead className="text-xs text-[#666] font-medium text-right">현재가</TableHead>
                  <TableHead className="text-xs text-[#666] font-medium text-right">평가금액</TableHead>
                  <TableHead className="text-xs text-[#666] font-medium text-right">평가손익</TableHead>
                  <TableHead className="text-xs text-[#666] font-medium text-right">수익률</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {holdings.map((h) => (
                  <TableRow key={h.name} data-testid={`row-holding-${h.name}`}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <StockIcon name={h.name} size={28} />
                        <span className="text-sm font-medium text-[#222]">{h.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className="text-xs">{h.category}</Badge>
                    </TableCell>
                    <TableCell className="text-right text-sm text-[#222] tabular-nums">{h.qty.toLocaleString()}주</TableCell>
                    <TableCell className="text-right text-sm text-[#222] tabular-nums">{h.avgPrice.toLocaleString()}원</TableCell>
                    <TableCell className="text-right text-sm text-[#222] tabular-nums">{h.currentPrice.toLocaleString()}원</TableCell>
                    <TableCell className="text-right text-sm font-medium text-[#222] tabular-nums">{h.evalAmount.toLocaleString()}원</TableCell>
                    <TableCell className={`text-right text-sm font-semibold tabular-nums ${h.profitLoss >= 0 ? "text-[#f04452]" : "text-[#3182f6]"}`}>
                      {h.profitLoss >= 0 ? "+" : ""}{h.profitLoss.toLocaleString()}원
                    </TableCell>
                    <TableCell className={`text-right text-sm font-semibold tabular-nums ${h.profitPct >= 0 ? "text-[#f04452]" : "text-[#3182f6]"}`}>
                      {h.profitPct >= 0 ? "+" : ""}{h.profitPct.toFixed(2)}%
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="sm:hidden space-y-3">
            {holdings.map((h) => (
              <div key={h.name} className="border border-[#eee] rounded-lg p-3" data-testid={`card-holding-${h.name}`}>
                <div className="flex items-center justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <StockIcon name={h.name} size={28} />
                    <div className="min-w-0">
                      <span className="text-sm font-medium text-[#222] truncate block">{h.name}</span>
                      <Badge variant="outline" className="text-[10px] mt-0.5">{h.category}</Badge>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`text-sm font-semibold tabular-nums ${h.profitPct >= 0 ? "text-[#f04452]" : "text-[#3182f6]"}`}>
                      {h.profitPct >= 0 ? "+" : ""}{h.profitPct.toFixed(2)}%
                    </p>
                    <p className={`text-xs tabular-nums ${h.profitLoss >= 0 ? "text-[#f04452]" : "text-[#3182f6]"}`}>
                      {h.profitLoss >= 0 ? "+" : ""}{h.profitLoss.toLocaleString()}원
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                  <div className="flex justify-between"><span className="text-[#999]">보유수량</span><span className="text-[#222] tabular-nums">{h.qty.toLocaleString()}주</span></div>
                  <div className="flex justify-between"><span className="text-[#999]">현재가</span><span className="text-[#222] tabular-nums">{h.currentPrice.toLocaleString()}원</span></div>
                  <div className="flex justify-between"><span className="text-[#999]">평균단가</span><span className="text-[#222] tabular-nums">{h.avgPrice.toLocaleString()}원</span></div>
                  <div className="flex justify-between"><span className="text-[#999]">평가금액</span><span className="text-[#222] tabular-nums">{h.evalAmount.toLocaleString()}원</span></div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 flex justify-center">
            <Button
              variant="outline"
              className="gap-2 border-[#E8344E] text-[#E8344E]"
              onClick={() => setTransferConfirmOpen(true)}
              data-testid="button-transfer-from-mystocks"
            >
              <ArrowRightLeft className="w-4 h-4" />
              내 계좌로 옮기기
            </Button>
          </div>
          </>
        )}

        <div className="mt-8 border-t border-[#eee] pt-6">
          <h2 className="text-base font-bold text-[#222] mb-4" data-testid="text-tx-history-title">입고/출고 내역</h2>
          {txList.length === 0 ? (
            <p className="text-sm text-[#999]">거래 내역이 없습니다</p>
          ) : (
            <>
            <div className="border border-[#eee] rounded-lg overflow-hidden hidden sm:block">
              <Table>
                <TableHeader>
                  <TableRow className="bg-[#f8f9fa]">
                    <TableHead className="text-xs text-[#666] font-medium">날짜</TableHead>
                    <TableHead className="text-xs text-[#666] font-medium">구분</TableHead>
                    <TableHead className="text-xs text-[#666] font-medium">종목명</TableHead>
                    <TableHead className="text-xs text-[#666] font-medium text-right">수량</TableHead>
                    <TableHead className="text-xs text-[#666] font-medium text-right">단가</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {txList.map((tx) => (
                    <TableRow key={tx.id} data-testid={`row-tx-${tx.id}`}>
                      <TableCell className="text-xs text-[#666]">
                        {tx.createdAt ? new Date(tx.createdAt).toLocaleDateString("ko-KR") : "-"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={tx.type === "in" ? "default" : "secondary"} className={tx.type === "in" ? "bg-[#E8344E] text-white text-xs" : "text-xs"}>
                          {tx.type === "in" ? "입고" : "출고"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <StockIcon name={tx.stockName} size={22} />
                          <span className="text-sm text-[#222]">{tx.stockName}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right text-sm text-[#222]">{tx.quantity.toLocaleString()}주</TableCell>
                      <TableCell className="text-right text-sm text-[#222]">{tx.pricePerShare.toLocaleString()}원</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="sm:hidden space-y-2">
              {txList.map((tx) => (
                <div key={tx.id} className="border border-[#eee] rounded-lg p-3 flex items-center gap-3" data-testid={`card-tx-${tx.id}`}>
                  <Badge variant={tx.type === "in" ? "default" : "secondary"} className={tx.type === "in" ? "bg-[#E8344E] text-white text-xs shrink-0" : "text-xs shrink-0"}>
                    {tx.type === "in" ? "입고" : "출고"}
                  </Badge>
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <StockIcon name={tx.stockName} size={22} />
                    <div className="min-w-0">
                      <span className="text-sm text-[#222] truncate block">{tx.stockName}</span>
                      <span className="text-[11px] text-[#999]">{tx.createdAt ? new Date(tx.createdAt).toLocaleDateString("ko-KR") : "-"}</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm text-[#222]">{tx.quantity.toLocaleString()}주</p>
                    <p className="text-xs text-[#666]">{tx.pricePerShare.toLocaleString()}원</p>
                  </div>
                </div>
              ))}
            </div>
            </>
          )}
        </div>
      </main>

      <Dialog open={transferConfirmOpen} onOpenChange={setTransferConfirmOpen}>
        <DialogContent className="max-w-sm">
          <div className="py-4 text-center">
            <p className="text-sm text-[#222] leading-relaxed">
              위 종목은 신주상당일 증권 계좌로 이동 될 예정입니다.
            </p>
          </div>
          <div className="flex justify-center pb-2">
            <Button
              variant="outline"
              className="min-w-[80px] border-blue-500 text-blue-500"
              onClick={() => setTransferConfirmOpen(false)}
              data-testid="button-transfer-confirm-mystocks"
            >
              확인
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
