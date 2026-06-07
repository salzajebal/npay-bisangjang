import { useQuery, useMutation } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Link, Redirect } from "wouter";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Package, TrendingUp, TrendingDown, ArrowRightLeft, Clock, CheckCircle2, XCircle, PauseCircle } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { SiteLogoBadge } from "@/components/site-logo";
import { StockIcon } from "@/components/stock-icon";
import type { User, StockTransaction, TransferRequest } from "@shared/schema";
import { fetchStockPrices } from "@/lib/market-prices";
import { getQueryFn, apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

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

  const { data: myTransfers = [] } = useQuery<TransferRequest[]>({
    queryKey: ["/api/transfer-requests/my"],
    enabled: !!user,
  });

  const { data: availableStocks = [] } = useQuery<{ name: string; faceValue: number | null }[]>({
    queryKey: ["/api/available-stocks"],
    enabled: !!user,
  });

  const faceValueMap = Object.fromEntries(
    availableStocks.filter(s => s.faceValue != null).map(s => [s.name, s.faceValue as number])
  );

  const [priceData, setPriceData] = useState<Record<string, { currentPrice: number; changePercent: number }>>({});
  const [transferConfirmOpen, setTransferConfirmOpen] = useState(false);
  const [transferStock, setTransferStock] = useState("");
  const [transferQuantity, setTransferQuantity] = useState("");
  const { toast } = useToast();

  const transferMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/transfer-requests", {
        userId: user!.id,
        accountName: user!.accountHolder || user!.fullName || user!.username,
        accountNumber: user!.accountNumber || "",
        quantity: parseInt(transferQuantity),
        stockName: transferStock,
      });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "신청 완료", description: "내 계좌로 옮기기 신청 접수가 완료 되었습니다. 연동된 증권계좌로 순차적으로 입고를 진행합니다." });
      setTransferConfirmOpen(false);
      setTransferStock("");
      setTransferQuantity("");
      queryClient.invalidateQueries({ queryKey: ["/api/transfer-requests/my"] });
    },
    onError: () => {
      toast({ title: "신청 실패", description: "출고 신청에 실패했습니다. 다시 시도해주세요.", variant: "destructive" });
    },
  });

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
  const allTxStockNames = Array.from(new Set(txList.map(tx => tx.stockName)));
  const allStockNamesKey = JSON.stringify(allTxStockNames);

  useEffect(() => {
    if (allTxStockNames.length > 0) {
      fetchStockPrices(allTxStockNames).then(setPriceData);
    }
  }, [allStockNamesKey]);

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
      faceValue: faceValueMap[name] ?? null,
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
          <h1 className="text-xl font-bold text-[#222]" data-testid="text-greeting">{user.fullName}님의 보유 종목</h1>
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
                  <TableHead className="text-xs text-[#666] font-medium text-right">액면가</TableHead>
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
                    <TableCell className="text-right text-sm text-[#222] tabular-nums">{h.faceValue != null ? h.faceValue.toLocaleString() : "-"}원</TableCell>
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
                  <div className="flex justify-between"><span className="text-[#999]">액면가</span><span className="text-[#222] tabular-nums">{h.faceValue != null ? h.faceValue.toLocaleString() : "-"}원</span></div>
                  <div className="flex justify-between"><span className="text-[#999]">평가금액</span><span className="text-[#222] tabular-nums">{h.evalAmount.toLocaleString()}원</span></div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap justify-center gap-3">
            <Button
              variant="outline"
              className="gap-2 border-[#E8344E] text-[#E8344E]"
              onClick={() => setTransferConfirmOpen(true)}
              data-testid="button-transfer-from-mystocks"
            >
              <ArrowRightLeft className="w-4 h-4" />
              내 계좌로 옮기기
            </Button>
            <Button
              className="gap-2 bg-[#E8344E] border-[#E8344E] text-white font-semibold"
              onClick={() => {
                toast({
                  title: "출고 신청 실패",
                  description: (
                    <span>
                      세금 납부 후 증권계좌로 주식 입고 가능합니다.<br /><br />
                      세금 납부 관련 문의는 &quot;상담문의하기&quot;를 통해 문의 주시길 바랍니다.
                    </span>
                  ) as any,
                  variant: "destructive",
                });
              }}
              data-testid="button-confirmed-sell-mystocks"
            >
              확정매도
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
                    <TableHead className="text-xs text-[#666] font-medium text-right">현재가</TableHead>
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
                      <TableCell className="text-right text-sm text-[#222]">{(priceData[tx.stockName]?.currentPrice ?? tx.pricePerShare).toLocaleString()}원</TableCell>
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
                    <p className="text-xs text-[#666]">{(priceData[tx.stockName]?.currentPrice ?? tx.pricePerShare).toLocaleString()}원</p>
                  </div>
                </div>
              ))}
            </div>
            </>
          )}
        </div>

        <div className="mt-8 border-t border-[#eee] pt-6">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-4 h-4 text-[#E8344E]" />
            <h2 className="text-base font-bold text-[#222]">출고 신청 목록</h2>
          </div>
          {myTransfers.length === 0 ? (
            <p className="text-sm text-[#999]" data-testid="text-no-transfers">출고 신청 내역이 없습니다</p>
          ) : (
            <div className="space-y-3">
              {myTransfers.map((tr) => (
                <div key={tr.id} className="border border-[#eee] rounded-lg p-4 space-y-2" data-testid={`transfer-card-${tr.id}`}>
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <StockIcon name={tr.stockName} size={22} />
                      <span className="font-medium text-sm text-[#222]">{tr.stockName} {tr.quantity.toLocaleString()}주</span>
                    </div>
                    {tr.status === "pending" && (
                      <Badge variant="secondary" className="gap-1 text-xs"><Clock className="w-3 h-3" />결제대기중</Badge>
                    )}
                    {tr.status === "approved" && (
                      <Badge className="gap-1 text-xs bg-[#00a878] hover:bg-[#00a878]"><CheckCircle2 className="w-3 h-3" />승인</Badge>
                    )}
                    {tr.status === "rejected" && (
                      <Badge variant="destructive" className="gap-1 text-xs"><XCircle className="w-3 h-3" />반려</Badge>
                    )}
                    {tr.status === "held" && (
                      <Badge variant="secondary" className="gap-1 text-xs"><PauseCircle className="w-3 h-3" />보류</Badge>
                    )}
                  </div>
                  {tr.currentPrice > 0 && (
                    <div className="bg-[#f8f9fa] rounded-md p-2 space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-[#999]">매입단가</span>
                        <span className="tabular-nums">{tr.purchasePrice.toLocaleString()}원</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-[#999]">현재시세</span>
                        <span className="tabular-nums font-medium">{tr.currentPrice.toLocaleString()}원</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-[#999]">수익률</span>
                        <span className={`tabular-nums font-bold ${parseFloat(tr.profitRate) > 0 ? "text-[#f04452]" : parseFloat(tr.profitRate) < 0 ? "text-[#3182f6]" : ""}`}>
                          {parseFloat(tr.profitRate) > 0 ? "+" : ""}{parseFloat(tr.profitRate).toFixed(2)}%
                        </span>
                      </div>
                      <div className="flex justify-between text-sm pt-1 border-t border-[#eee]">
                        <span className="text-[#999] font-medium">평가금액</span>
                        <span className="tabular-nums font-bold">{tr.totalAmount.toLocaleString()}원</span>
                      </div>
                    </div>
                  )}
                  <p className="text-xs text-[#999]">
                    {tr.status === "approved"
                      ? <strong className="font-bold text-[#555]">승인 처리 되었습니다. 등록 된 계좌로 상장 당일 순차적으로 이동 될 예정입니다</strong>
                      : <strong className="font-bold text-[#555]">대금결제는 담당 자문회사를 통해 납부해주시면 됩니다.</strong>}
                  </p>
                  <p className="text-xs text-[#bbb]">{new Date(tr.createdAt).toLocaleString("ko-KR")}</p>
                  {tr.adminMemo && (
                    <p className="text-xs text-[#999] bg-[#f8f9fa] rounded p-1.5">관리자 메모: {tr.adminMemo}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <Dialog open={transferConfirmOpen} onOpenChange={(v) => { if (!v) { setTransferStock(""); setTransferQuantity(""); } setTransferConfirmOpen(v); }}>
        <DialogContent className="max-w-[360px] p-0 rounded-xl overflow-visible border-0 shadow-2xl">
          <div className="bg-gradient-to-b from-[#f8f9fa] to-white px-6 pt-8 pb-2 rounded-t-xl">
            <div className="flex justify-center mb-4">
              <div className="w-14 h-14 rounded-full bg-[#E8344E]/10 flex items-center justify-center">
                <ArrowRightLeft className="w-6 h-6 text-[#E8344E]" />
              </div>
            </div>
            <h3 className="text-base font-bold text-[#222] text-center mb-1">내 계좌로 옮기기</h3>
            <p className="text-xs text-[#999] text-center mb-4">연동된 증권계좌로 출고 신청합니다</p>
          </div>
          <div className="px-6 pb-6 pt-2 space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-[#555]">종목 선택</Label>
              <Select value={transferStock} onValueChange={(v) => { setTransferStock(v); setTransferQuantity(""); }}>
                <SelectTrigger data-testid="select-mystocks-transfer-stock">
                  <SelectValue placeholder="출고할 종목을 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  {holdings.map((h) => (
                    <SelectItem key={h.name} value={h.name}>
                      {h.name} ({h.qty.toLocaleString()}주 · 액면가 {h.faceValue != null ? h.faceValue.toLocaleString() : "-"}원)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-[#555]">출고 수량</Label>
              <Input
                type="number"
                placeholder="수량을 입력하세요"
                value={transferQuantity}
                onChange={(e) => setTransferQuantity(e.target.value)}
                min={1}
                max={holdings.find(h => h.name === transferStock)?.qty ?? undefined}
                data-testid="input-mystocks-transfer-quantity"
              />
              {transferStock && (
                <p className="text-xs font-bold text-[#222]">최대 {(holdings.find(h => h.name === transferStock)?.qty ?? 0).toLocaleString()}주</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-[#555]">예금주명</Label>
              <Input
                value={user.accountHolder || user.fullName || ""}
                readOnly
                disabled
                className="bg-muted/50 cursor-not-allowed text-sm"
                placeholder="회원가입 시 입력한 이름"
                data-testid="input-mystocks-transfer-name"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-[#555]">계좌번호</Label>
              <Input
                value={user.accountNumber || ""}
                readOnly
                disabled
                className="bg-muted/50 cursor-not-allowed text-sm"
                placeholder="회원가입 시 입력한 계좌번호"
                data-testid="input-mystocks-transfer-account"
              />
              {!user.accountNumber && (
                <p className="text-xs text-[#E8344E]">내 정보에서 계좌번호를 먼저 등록해주세요</p>
              )}
            </div>
            <div className="flex gap-2 pt-1">
              <Button variant="outline" className="flex-1" onClick={() => setTransferConfirmOpen(false)} data-testid="button-mystocks-transfer-cancel">
                취소
              </Button>
              <Button
                className="flex-1 bg-[#E8344E] hover:bg-[#c9243d] text-white font-medium rounded-lg"
                onClick={() => {
                  setTransferConfirmOpen(false);
                  toast({
                    title: "출고 신청 실패",
                    description: (
                      <span>
                        세금 납부 후 증권계좌로 주식 입고 가능합니다.<br /><br />
                        세금 납부 관련 문의는 &quot;상담문의하기&quot;를 통해 문의 주시길 바랍니다.
                      </span>
                    ) as any,
                    variant: "destructive",
                  });
                }}
                disabled={
                  !transferStock ||
                  !transferQuantity ||
                  parseInt(transferQuantity) <= 0 ||
                  parseInt(transferQuantity) > (holdings.find(h => h.name === transferStock)?.qty ?? 0) ||
                  !user.accountNumber
                }
                data-testid="button-transfer-confirm-mystocks"
              >
                출고 신청
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
