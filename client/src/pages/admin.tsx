import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, Link, Redirect } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient, getQueryFn } from "@/lib/queryClient";
import { STOCK_CATEGORIES } from "@shared/schema";
import type { User, StockTransaction } from "@shared/schema";
import {
  LogOut, Users, Package, ArrowDownRight, ArrowUpRight,
  Search, Trash2, LayoutDashboard, ClipboardList, Home, ChevronLeft, ChevronRight,
} from "lucide-react";
import { SamsungBadge } from "@/components/samsung-logo";

function StockTransactionDialog({
  user,
  type,
  onSuccess,
}: {
  user: User;
  type: "in" | "out";
  onSuccess: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState("보통주");
  const [stockName, setStockName] = useState("삼성전자");
  const [quantity, setQuantity] = useState("");
  const [pricePerShare, setPricePerShare] = useState("95000");
  const [memo, setMemo] = useState("");
  const [loadingPrice, setLoadingPrice] = useState(false);
  const { toast } = useToast();

  const fetchRealtimePrice = async () => {
    setLoadingPrice(true);
    try {
      const res = await fetch("/api/stock/samsung");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      if (data.currentPrice) {
        setPricePerShare(String(data.currentPrice));
        toast({ title: "실시간 시세 적용", description: `현재가 ${data.currentPrice.toLocaleString()}원이 적용되었습니다` });
      }
    } catch {
      toast({ title: "오류", description: "실시간 시세를 가져올 수 없습니다", variant: "destructive" });
    } finally {
      setLoadingPrice(false);
    }
  };

  const mutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/admin/transactions", {
        userId: user.id,
        type,
        category,
        stockName,
        quantity: parseInt(quantity),
        pricePerShare: parseInt(pricePerShare),
        memo: memo || null,
      });
    },
    onSuccess: () => {
      toast({
        title: type === "in" ? "입고 완료" : "출고 완료",
        description: `${user.fullName}님에게 ${stockName} ${quantity}주 ${type === "in" ? "입고" : "출고"} 완료`,
      });
      setOpen(false);
      setQuantity("");
      setMemo("");
      onSuccess();
    },
    onError: (error: Error) => {
      toast({
        title: "오류 발생",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          variant={type === "in" ? "default" : "secondary"}
          className={type === "in" ? "bg-red-500 border-red-500" : "bg-blue-500 border-blue-500 text-white"}
          data-testid={`button-${type}-${user.id}`}
        >
          {type === "in" ? (
            <><ArrowDownRight className="w-3 h-3 mr-1" />입고</>
          ) : (
            <><ArrowUpRight className="w-3 h-3 mr-1" />출고</>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {user.fullName}님 - {type === "in" ? "주식 입고" : "주식 출고"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label>카테고리</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger data-testid="select-category">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STOCK_CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>종목명</Label>
            <Input
              value={stockName}
              onChange={(e) => setStockName(e.target.value)}
              data-testid="input-stock-name"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>수량 (주)</Label>
              <Input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="수량 입력"
                data-testid="input-quantity"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <Label>단가 (원)</Label>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={fetchRealtimePrice}
                  disabled={loadingPrice}
                  data-testid="button-realtime-price"
                >
                  {loadingPrice ? "조회 중..." : "실시간 시세"}
                </Button>
              </div>
              <Input
                type="number"
                value={pricePerShare}
                onChange={(e) => setPricePerShare(e.target.value)}
                data-testid="input-price"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>메모</Label>
            <Input
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="메모 (선택)"
              data-testid="input-memo"
            />
          </div>
          <Button
            className="w-full"
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending || !quantity || parseInt(quantity) <= 0}
            data-testid="button-submit-transaction"
          >
            {mutation.isPending ? "처리 중..." : type === "in" ? "입고 처리" : "출고 처리"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

type AdminSection = "dashboard" | "members" | "transactions";

const sidebarItems: { id: AdminSection; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "dashboard", label: "대시보드", icon: LayoutDashboard },
  { id: "members", label: "회원 관리", icon: Users },
  { id: "transactions", label: "거래 내역", icon: ClipboardList },
];

export default function AdminPage() {
  const [, setLocation] = useLocation();
  const [activeSection, setActiveSection] = useState<AdminSection>("dashboard");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const { toast } = useToast();

  const { data: authData, isLoading: authLoading } = useQuery<{ user: User } | null>({
    queryKey: ["/api/auth/me"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  const { data: allUsers, isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: !!authData?.user?.isAdmin,
  });

  const { data: allTransactions, isLoading: txLoading } = useQuery<StockTransaction[]>({
    queryKey: ["/api/admin/transactions"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: !!authData?.user?.isAdmin,
  });

  const deleteTransactionMutation = useMutation({
    mutationFn: async (txId: string) => {
      await apiRequest("DELETE", `/api/admin/transactions/${txId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/transactions"] });
      toast({ title: "삭제 완료", description: "거래 내역이 삭제되었습니다" });
    },
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

  const refreshData = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
    queryClient.invalidateQueries({ queryKey: ["/api/admin/transactions"] });
  };

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

  if (!authData?.user?.isAdmin) {
    return <Redirect to="/login" />;
  }

  const users = (allUsers || []).filter((u) => !u.isAdmin);
  const transactions = allTransactions || [];

  const filteredUsers = users.filter(
    (u) =>
      u.fullName.includes(searchTerm) ||
      u.username.includes(searchTerm) ||
      u.accountNumber.includes(searchTerm)
  );

  const filteredTransactions = transactions.filter((tx) => {
    if (filterCategory !== "all" && tx.category !== filterCategory) return false;
    if (filterType !== "all" && tx.type !== filterType) return false;
    return true;
  });

  const getUserName = (userId: string) => {
    const u = (allUsers || []).find((u) => u.id === userId);
    return u ? u.fullName : "알 수 없음";
  };

  const totalMembers = users.length;
  const totalIn = transactions.filter((t) => t.type === "in").reduce((s, t) => s + t.quantity, 0);
  const totalOut = transactions.filter((t) => t.type === "out").reduce((s, t) => s + t.quantity, 0);
  const totalValue = transactions.filter((t) => t.type === "in").reduce((s, t) => s + t.quantity * t.pricePerShare, 0);

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <aside className={`${sidebarCollapsed ? "w-16" : "w-60"} border-r bg-muted/30 flex flex-col transition-all duration-200 shrink-0`}>
        <div className={`h-14 border-b flex items-center ${sidebarCollapsed ? "justify-center px-2" : "px-4"} gap-2`}>
          {!sidebarCollapsed && (
            <>
              <SamsungBadge size={28} />
              <div className="flex flex-col min-w-0">
                <span className="font-bold text-sm truncate">IBK기업증권</span>
                <span className="text-[11px] text-muted-foreground">관리자 시스템</span>
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
                data-testid={`nav-admin-${item.id}`}
                title={sidebarCollapsed ? item.label : undefined}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {!sidebarCollapsed && <span>{item.label}</span>}
              </button>
            );
          })}
        </nav>

        <div className="border-t p-2 space-y-1">
          <Link href="/">
            <button className={`w-full flex items-center gap-3 rounded-md text-sm text-muted-foreground transition-colors ${sidebarCollapsed ? "justify-center px-2 py-2.5" : "px-3 py-2.5"}`} data-testid="nav-admin-home" title={sidebarCollapsed ? "메인 홈" : undefined}>
              <Home className="w-4 h-4 shrink-0" />
              {!sidebarCollapsed && <span>메인 홈</span>}
            </button>
          </Link>
          <button
            onClick={() => logoutMutation.mutate()}
            className={`w-full flex items-center gap-3 rounded-md text-sm text-muted-foreground transition-colors ${sidebarCollapsed ? "justify-center px-2 py-2.5" : "px-3 py-2.5"}`}
            data-testid="button-admin-logout"
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
          <div>
            <h1 className="font-bold text-lg" data-testid="text-admin-section-title">
              {sidebarItems.find((i) => i.id === activeSection)?.label}
            </h1>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Badge variant="outline">Admin</Badge>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeSection === "dashboard" && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="p-5">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">총 회원수</p>
                      <p className="text-2xl font-bold mt-1 tabular-nums" data-testid="text-total-members">{totalMembers}명</p>
                    </div>
                    <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center">
                      <Users className="w-5 h-5 text-primary" />
                    </div>
                  </div>
                </Card>
                <Card className="p-5">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">총 입고</p>
                      <p className="text-2xl font-bold mt-1 text-red-500 tabular-nums" data-testid="text-admin-total-in">{totalIn.toLocaleString()}주</p>
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
                      <p className="text-2xl font-bold mt-1 text-blue-500 tabular-nums" data-testid="text-admin-total-out">{totalOut.toLocaleString()}주</p>
                    </div>
                    <div className="w-10 h-10 rounded-md bg-blue-500/10 flex items-center justify-center">
                      <ArrowUpRight className="w-5 h-5 text-blue-500" />
                    </div>
                  </div>
                </Card>
                <Card className="p-5">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">보유 잔량</p>
                      <p className="text-2xl font-bold mt-1 tabular-nums" data-testid="text-admin-holding">{(totalIn - totalOut).toLocaleString()}주</p>
                    </div>
                    <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center">
                      <Package className="w-5 h-5 text-primary" />
                    </div>
                  </div>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="p-0 overflow-hidden">
                  <div className="p-4 border-b flex items-center justify-between gap-4">
                    <div>
                      <h3 className="font-bold text-sm">최근 회원</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">최근 가입한 회원 목록</p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setActiveSection("members")} data-testid="link-view-all-members">
                      전체보기
                    </Button>
                  </div>
                  {usersLoading ? (
                    <div className="p-4 space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-10 w-full" />)}</div>
                  ) : users.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground text-sm">등록된 회원이 없습니다</div>
                  ) : (
                    <div className="divide-y">
                      {users.slice(0, 5).map((u) => (
                        <div key={u.id} className="px-4 py-3 flex items-center justify-between gap-4" data-testid={`dash-user-${u.id}`}>
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                              <span className="text-xs font-bold text-primary">{u.fullName.charAt(0)}</span>
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium truncate">{u.fullName}</p>
                              <p className="text-xs text-muted-foreground truncate">{u.bank} · {u.accountNumber}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <StockTransactionDialog user={u} type="in" onSuccess={refreshData} />
                            <StockTransactionDialog user={u} type="out" onSuccess={refreshData} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>

                <Card className="p-0 overflow-hidden">
                  <div className="p-4 border-b flex items-center justify-between gap-4">
                    <div>
                      <h3 className="font-bold text-sm">최근 거래</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">최근 입출고 내역</p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setActiveSection("transactions")} data-testid="link-view-all-tx">
                      전체보기
                    </Button>
                  </div>
                  {txLoading ? (
                    <div className="p-4 space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-10 w-full" />)}</div>
                  ) : transactions.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground text-sm">거래 내역이 없습니다</div>
                  ) : (
                    <div className="divide-y">
                      {transactions.slice(0, 5).map((tx) => (
                        <div key={tx.id} className="px-4 py-3 flex items-center justify-between gap-4" data-testid={`dash-tx-${tx.id}`}>
                          <div className="flex items-center gap-3 min-w-0">
                            <Badge
                              variant={tx.type === "in" ? "default" : "secondary"}
                              className={`shrink-0 ${tx.type === "in" ? "bg-red-500 border-red-500" : "bg-blue-500 border-blue-500 text-white"}`}
                            >
                              {tx.type === "in" ? "입고" : "출고"}
                            </Badge>
                            <div className="min-w-0">
                              <p className="text-sm font-medium truncate">{getUserName(tx.userId)} · {tx.stockName}</p>
                              <p className="text-xs text-muted-foreground">{tx.quantity.toLocaleString()}주 · {tx.pricePerShare.toLocaleString()}원</p>
                            </div>
                          </div>
                          <span className="text-xs text-muted-foreground shrink-0">{new Date(tx.createdAt).toLocaleDateString("ko-KR")}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              </div>

              <Card className="p-5">
                <h3 className="font-bold text-sm mb-1">자산 요약</h3>
                <p className="text-xs text-muted-foreground mb-4">전체 입고 기준 총 자산 가치</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <div>
                    <p className="text-sm text-muted-foreground">총 거래 건수</p>
                    <p className="text-xl font-bold mt-1 tabular-nums">{transactions.length}건</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">총 입고 금액</p>
                    <p className="text-xl font-bold mt-1 tabular-nums">{totalValue.toLocaleString()}원</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">현재 보유 잔량</p>
                    <p className="text-xl font-bold mt-1 tabular-nums">{(totalIn - totalOut).toLocaleString()}주</p>
                  </div>
                </div>
              </Card>
            </>
          )}

          {activeSection === "members" && (
            <>
              <div className="flex items-center gap-3 flex-wrap">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="회원 검색 (이름, 아이디, 계좌번호)"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                    data-testid="input-search-members"
                  />
                </div>
                <Badge variant="outline" className="shrink-0">{filteredUsers.length}명</Badge>
              </div>

              {usersLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full" />)}
                </div>
              ) : filteredUsers.length === 0 ? (
                <Card className="p-12 text-center">
                  <Users className="w-10 h-10 mx-auto mb-3 opacity-30 text-muted-foreground" />
                  <p className="font-medium text-muted-foreground">
                    {searchTerm ? "검색 결과가 없습니다" : "등록된 회원이 없습니다"}
                  </p>
                </Card>
              ) : (
                <Card className="p-0 overflow-hidden">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>아이디</TableHead>
                          <TableHead>성명</TableHead>
                          <TableHead>은행</TableHead>
                          <TableHead>계좌번호</TableHead>
                          <TableHead>예금주</TableHead>
                          <TableHead>가입일</TableHead>
                          <TableHead className="text-center">관리</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredUsers.map((u) => (
                          <TableRow key={u.id} data-testid={`row-user-${u.id}`}>
                            <TableCell className="font-medium">{u.username}</TableCell>
                            <TableCell>{u.fullName}</TableCell>
                            <TableCell>{u.bank}</TableCell>
                            <TableCell className="font-mono text-sm">{u.accountNumber}</TableCell>
                            <TableCell>{u.accountHolder}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {new Date(u.createdAt).toLocaleDateString("ko-KR")}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center justify-center gap-2">
                                <StockTransactionDialog user={u} type="in" onSuccess={refreshData} />
                                <StockTransactionDialog user={u} type="out" onSuccess={refreshData} />
                              </div>
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
              <div className="flex items-center gap-3 flex-wrap">
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-[140px]" data-testid="select-filter-type">
                    <SelectValue placeholder="유형" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">전체</SelectItem>
                    <SelectItem value="in">입고</SelectItem>
                    <SelectItem value="out">출고</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterCategory} onValueChange={setFilterCategory}>
                  <SelectTrigger className="w-[140px]" data-testid="select-filter-category">
                    <SelectValue placeholder="카테고리" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">전체</SelectItem>
                    {STOCK_CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Badge variant="outline" className="shrink-0">{filteredTransactions.length}건</Badge>
              </div>

              {txLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
                </div>
              ) : filteredTransactions.length === 0 ? (
                <Card className="p-12 text-center">
                  <Package className="w-10 h-10 mx-auto mb-3 opacity-30 text-muted-foreground" />
                  <p className="font-medium text-muted-foreground">거래 내역이 없습니다</p>
                </Card>
              ) : (
                <Card className="p-0 overflow-hidden">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>유형</TableHead>
                          <TableHead>카테고리</TableHead>
                          <TableHead>회원</TableHead>
                          <TableHead>종목</TableHead>
                          <TableHead className="text-right">수량</TableHead>
                          <TableHead className="text-right">단가</TableHead>
                          <TableHead className="text-right">총액</TableHead>
                          <TableHead>메모</TableHead>
                          <TableHead>일시</TableHead>
                          <TableHead className="text-center">삭제</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredTransactions.map((tx) => (
                          <TableRow key={tx.id} data-testid={`row-tx-${tx.id}`}>
                            <TableCell>
                              <Badge
                                variant={tx.type === "in" ? "default" : "secondary"}
                                className={tx.type === "in" ? "bg-red-500 border-red-500" : "bg-blue-500 border-blue-500 text-white"}
                              >
                                {tx.type === "in" ? "입고" : "출고"}
                              </Badge>
                            </TableCell>
                            <TableCell>{tx.category}</TableCell>
                            <TableCell className="font-medium">{getUserName(tx.userId)}</TableCell>
                            <TableCell>{tx.stockName}</TableCell>
                            <TableCell className="text-right font-mono tabular-nums">{tx.quantity.toLocaleString()}주</TableCell>
                            <TableCell className="text-right font-mono tabular-nums">{tx.pricePerShare.toLocaleString()}원</TableCell>
                            <TableCell className="text-right font-mono tabular-nums">{(tx.quantity * tx.pricePerShare).toLocaleString()}원</TableCell>
                            <TableCell className="text-sm text-muted-foreground">{tx.memo || "-"}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {new Date(tx.createdAt).toLocaleDateString("ko-KR")}
                            </TableCell>
                            <TableCell className="text-center">
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => deleteTransactionMutation.mutate(tx.id)}
                                data-testid={`button-delete-tx-${tx.id}`}
                              >
                                <Trash2 className="w-4 h-4 text-destructive" />
                              </Button>
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
        </main>
      </div>
    </div>
  );
}
