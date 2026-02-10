import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient, getQueryFn } from "@/lib/queryClient";
import { STOCK_CATEGORIES } from "@shared/schema";
import type { User, StockTransaction } from "@shared/schema";
import {
  BarChart3, LogOut, Users, Package, ArrowDownRight, ArrowUpRight,
  Plus, Search, Trash2,
} from "lucide-react";

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
  const [pricePerShare, setPricePerShare] = useState("50000");
  const [memo, setMemo] = useState("");
  const { toast } = useToast();

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
              <Label>단가 (원)</Label>
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

export default function AdminPage() {
  const [, setLocation] = useLocation();
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
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-7xl mx-auto space-y-6">
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (!authData?.user?.isAdmin) {
    setLocation("/login");
    return null;
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

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-background/95 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg tracking-tight">관리자 패널</span>
            <Badge variant="secondary">Admin</Badge>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => logoutMutation.mutate()}
            data-testid="button-admin-logout"
          >
            <LogOut className="w-4 h-4 mr-1" /> 로그아웃
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-muted-foreground">총 회원수</p>
                <p className="text-2xl font-bold mt-1" data-testid="text-total-members">{totalMembers}</p>
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
                <p className="text-2xl font-bold mt-1 text-red-500" data-testid="text-admin-total-in">{totalIn.toLocaleString()}주</p>
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
                <p className="text-2xl font-bold mt-1 text-blue-500" data-testid="text-admin-total-out">{totalOut.toLocaleString()}주</p>
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
                <p className="text-2xl font-bold mt-1" data-testid="text-admin-holding">{(totalIn - totalOut).toLocaleString()}주</p>
              </div>
              <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center">
                <Package className="w-5 h-5 text-primary" />
              </div>
            </div>
          </Card>
        </div>

        <Tabs defaultValue="members" className="space-y-4">
          <TabsList>
            <TabsTrigger value="members" data-testid="tab-members">
              <Users className="w-4 h-4 mr-1" /> 회원 관리
            </TabsTrigger>
            <TabsTrigger value="transactions" data-testid="tab-transactions">
              <Package className="w-4 h-4 mr-1" /> 거래 내역
            </TabsTrigger>
          </TabsList>

          <TabsContent value="members" className="space-y-4">
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
          </TabsContent>

          <TabsContent value="transactions" className="space-y-4">
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
                          <TableCell className="text-right font-mono">{tx.quantity.toLocaleString()}주</TableCell>
                          <TableCell className="text-right font-mono">{tx.pricePerShare.toLocaleString()}원</TableCell>
                          <TableCell className="text-right font-mono">{(tx.quantity * tx.pricePerShare).toLocaleString()}원</TableCell>
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
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
