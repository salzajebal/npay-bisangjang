import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, Link, Redirect } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient, getQueryFn } from "@/lib/queryClient";
import { STOCK_CATEGORIES, KOREAN_BANKS } from "@shared/schema";
import type { User, StockTransaction, TransferRequest } from "@shared/schema";
import {
  LogOut, Users, Package, ArrowDownRight, ArrowUpRight,
  Search, Trash2, LayoutDashboard, ClipboardList, Home, ChevronLeft, ChevronRight,
  Eye, Pencil, Snowflake, UserX, AlertTriangle, Save, X, ArrowRightLeft,
  CheckCircle2, XCircle, PauseCircle, Clock, MessageSquare, Send,
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
      toast({ title: "오류 발생", description: error.message, variant: "destructive" });
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
            <Input value={stockName} onChange={(e) => setStockName(e.target.value)} data-testid="input-stock-name" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>수량 (주)</Label>
              <Input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="수량 입력" data-testid="input-quantity" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <Label>단가 (원)</Label>
                <Button type="button" size="sm" variant="outline" onClick={fetchRealtimePrice} disabled={loadingPrice} data-testid="button-realtime-price">
                  {loadingPrice ? "조회 중..." : "실시간 시세"}
                </Button>
              </div>
              <Input type="number" value={pricePerShare} onChange={(e) => setPricePerShare(e.target.value)} data-testid="input-price" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>메모</Label>
            <Input value={memo} onChange={(e) => setMemo(e.target.value)} placeholder="메모 (선택)" data-testid="input-memo" />
          </div>
          <Button className="w-full" onClick={() => mutation.mutate()} disabled={mutation.isPending || !quantity || parseInt(quantity) <= 0} data-testid="button-submit-transaction">
            {mutation.isPending ? "처리 중..." : type === "in" ? "입고 처리" : "출고 처리"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function MemberDetailDialog({ user, transactions }: { user: User; transactions: StockTransaction[] }) {
  const [open, setOpen] = useState(false);
  const userTx = transactions.filter((t) => t.userId === user.id);
  const totalIn = userTx.filter((t) => t.type === "in").reduce((s, t) => s + t.quantity, 0);
  const totalOut = userTx.filter((t) => t.type === "out").reduce((s, t) => s + t.quantity, 0);
  const totalValue = userTx.filter((t) => t.type === "in").reduce((s, t) => s + t.quantity * t.pricePerShare, 0);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="icon" variant="ghost" data-testid={`button-view-${user.id}`} title="정보 열람">
          <Eye className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>회원 정보 열람</DialogTitle>
          <DialogDescription>회원의 상세 정보와 거래 현황을 확인합니다</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <span className="text-lg font-bold text-primary">{user.fullName.charAt(0)}</span>
            </div>
            <div>
              <p className="font-bold text-lg">{user.fullName}</p>
              <p className="text-sm text-muted-foreground">@{user.username}</p>
            </div>
            {user.isFrozen && <Badge variant="destructive" className="ml-auto">동결</Badge>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Card className="p-3">
              <p className="text-xs text-muted-foreground">은행</p>
              <p className="text-sm font-medium mt-0.5">{user.bank}</p>
            </Card>
            <Card className="p-3">
              <p className="text-xs text-muted-foreground">예금주</p>
              <p className="text-sm font-medium mt-0.5">{user.accountHolder}</p>
            </Card>
            <Card className="p-3 col-span-2">
              <p className="text-xs text-muted-foreground">계좌번호</p>
              <p className="text-sm font-medium font-mono mt-0.5">{user.accountNumber}</p>
            </Card>
          </div>

          <Card className="p-3">
            <p className="text-xs text-muted-foreground mb-2">가입일</p>
            <p className="text-sm font-medium">{new Date(user.createdAt).toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" })}</p>
          </Card>

          <div className="grid grid-cols-3 gap-3">
            <Card className="p-3 text-center">
              <p className="text-xs text-muted-foreground">총 입고</p>
              <p className="text-lg font-bold text-red-500 mt-0.5 tabular-nums">{totalIn.toLocaleString()}주</p>
            </Card>
            <Card className="p-3 text-center">
              <p className="text-xs text-muted-foreground">총 출고</p>
              <p className="text-lg font-bold text-blue-500 mt-0.5 tabular-nums">{totalOut.toLocaleString()}주</p>
            </Card>
            <Card className="p-3 text-center">
              <p className="text-xs text-muted-foreground">보유 잔량</p>
              <p className="text-lg font-bold mt-0.5 tabular-nums">{(totalIn - totalOut).toLocaleString()}주</p>
            </Card>
          </div>

          <Card className="p-3">
            <p className="text-xs text-muted-foreground">총 입고 금액</p>
            <p className="text-lg font-bold mt-0.5 tabular-nums">{totalValue.toLocaleString()}원</p>
          </Card>

          {userTx.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-2">최근 거래 내역</p>
              <div className="max-h-40 overflow-y-auto space-y-1">
                {userTx.slice(0, 10).map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between gap-2 text-sm py-1.5 px-2 rounded-md bg-muted/50">
                    <div className="flex items-center gap-2 min-w-0">
                      <Badge variant={tx.type === "in" ? "default" : "secondary"} className={`shrink-0 text-[11px] ${tx.type === "in" ? "bg-red-500 border-red-500" : "bg-blue-500 border-blue-500 text-white"}`}>
                        {tx.type === "in" ? "입고" : "출고"}
                      </Badge>
                      <span className="truncate">{tx.stockName} {tx.quantity}주</span>
                    </div>
                    <span className="text-muted-foreground shrink-0 text-xs">{new Date(tx.createdAt).toLocaleDateString("ko-KR")}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function MemberEditDialog({ user, onSuccess }: { user: User; onSuccess: () => void }) {
  const [open, setOpen] = useState(false);
  const [fullName, setFullName] = useState(user.fullName);
  const [bank, setBank] = useState(user.bank);
  const [accountNumber, setAccountNumber] = useState(user.accountNumber);
  const [accountHolder, setAccountHolder] = useState(user.accountHolder);
  const [newPassword, setNewPassword] = useState("");
  const { toast } = useToast();

  const mutation = useMutation({
    mutationFn: async () => {
      const body: any = { fullName, bank, accountNumber, accountHolder };
      if (newPassword) body.password = newPassword;
      await apiRequest("PUT", `/api/admin/users/${user.id}`, body);
    },
    onSuccess: () => {
      toast({ title: "수정 완료", description: `${fullName}님의 정보가 수정되었습니다` });
      setOpen(false);
      setNewPassword("");
      onSuccess();
    },
    onError: (error: Error) => {
      toast({ title: "오류", description: error.message, variant: "destructive" });
    },
  });

  return (
    <Dialog open={open} onOpenChange={(v) => {
      setOpen(v);
      if (v) {
        setFullName(user.fullName);
        setBank(user.bank);
        setAccountNumber(user.accountNumber);
        setAccountHolder(user.accountHolder);
        setNewPassword("");
      }
    }}>
      <DialogTrigger asChild>
        <Button size="icon" variant="ghost" data-testid={`button-edit-${user.id}`} title="정보 변경">
          <Pencil className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>회원 정보 변경</DialogTitle>
          <DialogDescription>{user.username} 회원의 정보를 수정합니다</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label>성명</Label>
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} data-testid="input-edit-fullname" />
          </div>
          <div className="space-y-2">
            <Label>은행</Label>
            <Select value={bank} onValueChange={setBank}>
              <SelectTrigger data-testid="select-edit-bank">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {KOREAN_BANKS.map((b) => (
                  <SelectItem key={b} value={b}>{b}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>계좌번호</Label>
            <Input value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} data-testid="input-edit-account" />
          </div>
          <div className="space-y-2">
            <Label>예금주</Label>
            <Input value={accountHolder} onChange={(e) => setAccountHolder(e.target.value)} data-testid="input-edit-holder" />
          </div>
          <div className="space-y-2">
            <Label>새 비밀번호 (변경 시에만 입력)</Label>
            <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="비밀번호 변경 시 입력" data-testid="input-edit-password" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>취소</Button>
            <Button onClick={() => mutation.mutate()} disabled={mutation.isPending || !fullName || !accountNumber || !accountHolder} data-testid="button-save-user">
              {mutation.isPending ? "저장 중..." : "저장"}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function MemberFreezeDialog({ user, onSuccess }: { user: User; onSuccess: () => void }) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const isFrozen = user.isFrozen;

  const mutation = useMutation({
    mutationFn: async () => {
      await apiRequest("PATCH", `/api/admin/users/${user.id}/freeze`, { isFrozen: !isFrozen });
    },
    onSuccess: () => {
      toast({
        title: isFrozen ? "동결 해제" : "계정 동결",
        description: `${user.fullName}님의 계정이 ${isFrozen ? "동결 해제" : "동결"}되었습니다`,
      });
      setOpen(false);
      onSuccess();
    },
    onError: (error: Error) => {
      toast({ title: "오류", description: error.message, variant: "destructive" });
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="icon" variant="ghost" data-testid={`button-freeze-${user.id}`} title={isFrozen ? "동결 해제" : "계정 동결"}>
          <Snowflake className={`w-4 h-4 ${isFrozen ? "text-blue-500" : ""}`} />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isFrozen ? "계정 동결 해제" : "계정 동결"}</DialogTitle>
          <DialogDescription>
            {isFrozen
              ? `${user.fullName}님의 계정 동결을 해제하시겠습니까? 해제 후 로그인이 가능합니다.`
              : `${user.fullName}님의 계정을 동결하시겠습니까? 동결 시 로그인이 차단됩니다.`}
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center gap-3 p-4 rounded-md bg-muted/50 mt-2">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <span className="text-sm font-bold text-primary">{user.fullName.charAt(0)}</span>
          </div>
          <div>
            <p className="font-medium text-sm">{user.fullName} (@{user.username})</p>
            <p className="text-xs text-muted-foreground">{user.bank} · {user.accountNumber}</p>
          </div>
          {isFrozen && <Badge variant="destructive" className="ml-auto">동결 중</Badge>}
        </div>
        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => setOpen(false)}>취소</Button>
          <Button
            variant={isFrozen ? "default" : "destructive"}
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
            data-testid="button-confirm-freeze"
          >
            {mutation.isPending ? "처리 중..." : isFrozen ? "동결 해제" : "계정 동결"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function MemberDeleteDialog({ user, onSuccess }: { user: User; onSuccess: () => void }) {
  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const { toast } = useToast();

  const mutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/admin/users/${user.id}`);
    },
    onSuccess: () => {
      toast({ title: "삭제 완료", description: `${user.fullName}님의 계정이 삭제되었습니다` });
      setOpen(false);
      setConfirmText("");
      onSuccess();
    },
    onError: (error: Error) => {
      toast({ title: "오류", description: error.message, variant: "destructive" });
    },
  });

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setConfirmText(""); }}>
      <DialogTrigger asChild>
        <Button size="icon" variant="ghost" data-testid={`button-delete-user-${user.id}`} title="회원 삭제">
          <UserX className="w-4 h-4 text-destructive" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-destructive" />
            회원 삭제
          </DialogTitle>
          <DialogDescription>
            이 작업은 되돌릴 수 없습니다. 회원의 모든 거래 내역도 함께 삭제됩니다.
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center gap-3 p-4 rounded-md bg-destructive/10 mt-2">
          <div className="w-10 h-10 rounded-full bg-destructive/20 flex items-center justify-center shrink-0">
            <span className="text-sm font-bold text-destructive">{user.fullName.charAt(0)}</span>
          </div>
          <div>
            <p className="font-medium text-sm">{user.fullName} (@{user.username})</p>
            <p className="text-xs text-muted-foreground">{user.bank} · {user.accountNumber}</p>
          </div>
        </div>
        <div className="space-y-2 mt-2">
          <Label>확인을 위해 회원 아이디를 입력해주세요</Label>
          <Input
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder={user.username}
            data-testid="input-confirm-delete"
          />
        </div>
        <DialogFooter className="mt-2">
          <Button variant="outline" onClick={() => setOpen(false)}>취소</Button>
          <Button
            variant="destructive"
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending || confirmText !== user.username}
            data-testid="button-confirm-delete"
          >
            {mutation.isPending ? "삭제 중..." : "회원 삭제"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function TransactionEditDialog({ tx, onSuccess }: { tx: StockTransaction; onSuccess: () => void }) {
  const [open, setOpen] = useState(false);
  const [quantity, setQuantity] = useState(String(tx.quantity));
  const [pricePerShare, setPricePerShare] = useState(String(tx.pricePerShare));
  const [memo, setMemo] = useState(tx.memo || "");
  const [category, setCategory] = useState(tx.category);
  const { toast } = useToast();

  const mutation = useMutation({
    mutationFn: async () => {
      await apiRequest("PUT", `/api/admin/transactions/${tx.id}`, {
        quantity: parseInt(quantity),
        pricePerShare: parseInt(pricePerShare),
        memo: memo || null,
        category,
      });
    },
    onSuccess: () => {
      toast({ title: "수정 완료", description: "거래 내역이 수정되었습니다" });
      setOpen(false);
      onSuccess();
    },
    onError: (error: Error) => {
      toast({ title: "오류", description: error.message, variant: "destructive" });
    },
  });

  return (
    <Dialog open={open} onOpenChange={(v) => {
      setOpen(v);
      if (v) {
        setQuantity(String(tx.quantity));
        setPricePerShare(String(tx.pricePerShare));
        setMemo(tx.memo || "");
        setCategory(tx.category);
      }
    }}>
      <DialogTrigger asChild>
        <Button size="icon" variant="ghost" data-testid={`button-edit-tx-${tx.id}`} title="거래 수정">
          <Pencil className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>거래 내역 수정</DialogTitle>
          <DialogDescription>{tx.stockName} - {tx.type === "in" ? "입고" : "출고"}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label>카테고리</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger data-testid="select-edit-tx-category">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STOCK_CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>수량 (주)</Label>
              <Input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} data-testid="input-edit-tx-quantity" />
            </div>
            <div className="space-y-2">
              <Label>단가 (원)</Label>
              <Input type="number" value={pricePerShare} onChange={(e) => setPricePerShare(e.target.value)} data-testid="input-edit-tx-price" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>메모</Label>
            <Input value={memo} onChange={(e) => setMemo(e.target.value)} placeholder="메모 (선택)" data-testid="input-edit-tx-memo" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>취소</Button>
            <Button onClick={() => mutation.mutate()} disabled={mutation.isPending || !quantity || parseInt(quantity) <= 0} data-testid="button-save-tx">
              {mutation.isPending ? "저장 중..." : "저장"}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}

type AdminSection = "dashboard" | "members" | "transactions" | "transfers" | "chat";

const sidebarItems: { id: AdminSection; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "dashboard", label: "대시보드", icon: LayoutDashboard },
  { id: "members", label: "회원 관리", icon: Users },
  { id: "transactions", label: "거래 내역", icon: ClipboardList },
  { id: "transfers", label: "대체출고 관리", icon: ArrowRightLeft },
  { id: "chat", label: "1:1 상담", icon: MessageSquare },
];

export default function AdminPage() {
  const [, setLocation] = useLocation();
  const [activeSection, setActiveSection] = useState<AdminSection>("dashboard");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [selectedChatRoom, setSelectedChatRoom] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState("");
  const chatWsRef = useRef<WebSocket | null>(null);
  const chatMessagesEndRef = useRef<HTMLDivElement>(null);
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

  const { data: allTransferRequests, isLoading: transfersLoading } = useQuery<TransferRequest[]>({
    queryKey: ["/api/admin/transfer-requests"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: !!authData?.user?.isAdmin,
  });

  const { data: chatRooms, isLoading: chatRoomsLoading } = useQuery<any[]>({
    queryKey: ["/api/chat/rooms"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: !!authData?.user?.isAdmin,
    refetchInterval: 5000,
  });

  const updateTransferStatusMutation = useMutation({
    mutationFn: async ({ id, status, adminMemo }: { id: string; status: string; adminMemo?: string }) => {
      await apiRequest("PATCH", `/api/admin/transfer-requests/${id}`, { status, adminMemo });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/transfer-requests"] });
      toast({ title: "상태 변경 완료", description: "대체출고 신청 상태가 변경되었습니다" });
    },
    onError: (error: Error) => {
      toast({ title: "오류", description: error.message, variant: "destructive" });
    },
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
    queryClient.invalidateQueries({ queryKey: ["/api/admin/transfer-requests"] });
    queryClient.invalidateQueries({ queryKey: ["/api/chat/rooms"] });
  };

  useEffect(() => {
    if (!authData?.user?.isAdmin) return;
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const ws = new WebSocket(`${protocol}//${window.location.host}/ws/chat`);
    chatWsRef.current = ws;
    ws.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data);
        if (parsed.type === "message" && parsed.data) {
          setChatMessages((prev) => {
            if (prev.some((m) => m.id === parsed.data.id)) return prev;
            return [...prev, parsed.data];
          });
        }
        if (parsed.type === "notification") {
          const audio = new Audio("data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbsGMcBj+a2telezhJj+DYrGQ/RG2q3+OiXzZEgNThpGc/SF+W4NqkZz1Bd9bnpmk7Rme15NSmaT1ER9bn0apjNkhfvOnSrWI0R2bC8NCtVjRJZMXw1atXM0xnzvfXrFQ0TGXL9NitVTBMZc741qtU");
          audio.volume = 0.5;
          audio.play().catch(() => {});
          toast({
            title: "새 상담 메시지",
            description: `${parsed.data.userName}: ${parsed.data.message.substring(0, 30)}${parsed.data.message.length > 30 ? "..." : ""}`,
          });
          queryClient.invalidateQueries({ queryKey: ["/api/chat/rooms"] });
        }
      } catch {}
    };
    ws.onclose = () => {};
    return () => { ws.close(); chatWsRef.current = null; };
  }, [authData?.user?.isAdmin]);

  useEffect(() => {
    chatMessagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  useEffect(() => {
    if (!selectedChatRoom) return;
    async function loadMessages() {
      try {
        const res = await fetch(`/api/chat/rooms/${selectedChatRoom}/messages`, { credentials: "include" });
        if (res.ok) {
          const msgs = await res.json();
          setChatMessages(msgs);
        }
      } catch {}
    }
    loadMessages();
  }, [selectedChatRoom]);

  const handleChatSend = () => {
    const text = chatInput.trim();
    if (!text || !chatWsRef.current || !selectedChatRoom) return;
    chatWsRef.current.send(JSON.stringify({ type: "join", roomId: selectedChatRoom }));
    chatWsRef.current.send(JSON.stringify({ type: "message", roomId: selectedChatRoom, message: text }));
    setChatInput("");
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
  const frozenMembers = users.filter((u) => u.isFrozen).length;
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
                      {frozenMembers > 0 && <p className="text-xs text-blue-500 mt-0.5">{frozenMembers}명 동결</p>}
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
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-medium truncate">{u.fullName}</p>
                                {u.isFrozen && <Badge variant="destructive" className="text-[10px] px-1.5 py-0">동결</Badge>}
                              </div>
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
                          <TableHead>상태</TableHead>
                          <TableHead>은행</TableHead>
                          <TableHead>계좌번호</TableHead>
                          <TableHead>예금주</TableHead>
                          <TableHead>가입일</TableHead>
                          <TableHead className="text-center">관리</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredUsers.map((u) => (
                          <TableRow key={u.id} className={u.isFrozen ? "opacity-60" : ""} data-testid={`row-user-${u.id}`}>
                            <TableCell className="font-medium">{u.username}</TableCell>
                            <TableCell>{u.fullName}</TableCell>
                            <TableCell>
                              {u.isFrozen ? (
                                <Badge variant="destructive" className="text-[11px]">동결</Badge>
                              ) : (
                                <Badge variant="outline" className="text-[11px]">정상</Badge>
                              )}
                            </TableCell>
                            <TableCell>{u.bank}</TableCell>
                            <TableCell className="font-mono text-sm">{u.accountNumber}</TableCell>
                            <TableCell>{u.accountHolder}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {new Date(u.createdAt).toLocaleDateString("ko-KR")}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center justify-center gap-1">
                                <MemberDetailDialog user={u} transactions={transactions} />
                                <MemberEditDialog user={u} onSuccess={refreshData} />
                                <MemberFreezeDialog user={u} onSuccess={refreshData} />
                                <MemberDeleteDialog user={u} onSuccess={refreshData} />
                                <div className="w-px h-5 bg-border mx-1" />
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
                          <TableHead className="text-center">관리</TableHead>
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
                            <TableCell>
                              <div className="flex items-center justify-center gap-1">
                                <TransactionEditDialog tx={tx} onSuccess={refreshData} />
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => deleteTransactionMutation.mutate(tx.id)}
                                  data-testid={`button-delete-tx-${tx.id}`}
                                  title="삭제"
                                >
                                  <Trash2 className="w-4 h-4 text-destructive" />
                                </Button>
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

          {activeSection === "transfers" && (
            <>
              <div className="flex items-center gap-3 flex-wrap">
                <Badge variant="outline" className="shrink-0">
                  {(allTransferRequests || []).length}건
                </Badge>
                <Badge variant="outline" className="shrink-0 bg-yellow-500/10 text-yellow-600 border-yellow-500/30">
                  대기 {(allTransferRequests || []).filter(r => r.status === "pending").length}건
                </Badge>
              </div>

              {transfersLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
                </div>
              ) : (allTransferRequests || []).length === 0 ? (
                <Card className="p-12 text-center">
                  <ArrowRightLeft className="w-10 h-10 mx-auto mb-3 opacity-30 text-muted-foreground" />
                  <p className="font-medium text-muted-foreground">대체출고 신청 내역이 없습니다</p>
                </Card>
              ) : (
                <Card className="p-0 overflow-hidden">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>상태</TableHead>
                          <TableHead>신청 회원</TableHead>
                          <TableHead>종목</TableHead>
                          <TableHead className="text-right">수량</TableHead>
                          <TableHead>예금주</TableHead>
                          <TableHead>계좌번호</TableHead>
                          <TableHead>신청일</TableHead>
                          <TableHead>관리자 메모</TableHead>
                          <TableHead className="text-center">처리</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(allTransferRequests || []).map((tr) => (
                          <TableRow key={tr.id} data-testid={`row-transfer-${tr.id}`}>
                            <TableCell>
                              {tr.status === "pending" && <Badge variant="outline" className="gap-1"><Clock className="w-3 h-3" />대기</Badge>}
                              {tr.status === "approved" && <Badge className="gap-1 bg-green-600 border-green-600"><CheckCircle2 className="w-3 h-3" />승인</Badge>}
                              {tr.status === "rejected" && <Badge variant="destructive" className="gap-1"><XCircle className="w-3 h-3" />거부</Badge>}
                              {tr.status === "held" && <Badge variant="secondary" className="gap-1"><PauseCircle className="w-3 h-3" />보류</Badge>}
                            </TableCell>
                            <TableCell className="font-medium">{getUserName(tr.userId)}</TableCell>
                            <TableCell>{tr.stockName}</TableCell>
                            <TableCell className="text-right font-mono tabular-nums">{tr.quantity.toLocaleString()}주</TableCell>
                            <TableCell>{tr.accountName}</TableCell>
                            <TableCell className="font-mono text-sm">{tr.accountNumber}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {new Date(tr.createdAt).toLocaleDateString("ko-KR")}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground max-w-[150px] truncate">
                              {tr.adminMemo || "-"}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center justify-center gap-1">
                                <Button
                                  size="sm"
                                  variant="default"
                                  className="bg-green-600 border-green-600"
                                  onClick={() => updateTransferStatusMutation.mutate({ id: tr.id, status: "approved" })}
                                  disabled={tr.status === "approved" || updateTransferStatusMutation.isPending}
                                  data-testid={`button-approve-${tr.id}`}
                                >
                                  승인
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => updateTransferStatusMutation.mutate({ id: tr.id, status: "rejected" })}
                                  disabled={tr.status === "rejected" || updateTransferStatusMutation.isPending}
                                  data-testid={`button-reject-${tr.id}`}
                                >
                                  거부
                                </Button>
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  onClick={() => updateTransferStatusMutation.mutate({ id: tr.id, status: "held" })}
                                  disabled={tr.status === "held" || updateTransferStatusMutation.isPending}
                                  data-testid={`button-hold-${tr.id}`}
                                >
                                  보류
                                </Button>
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

          {activeSection === "chat" && (
            <>
              <div className="flex items-center gap-3 mb-6">
                <MessageSquare className="w-5 h-5 text-primary" />
                <div>
                  <h2 className="text-lg font-bold">1:1 고객 상담</h2>
                  <p className="text-sm text-muted-foreground">회원 문의에 실시간으로 응답합니다</p>
                </div>
              </div>
              <div className="flex gap-4 h-[calc(100vh-180px)]">
                <Card className="w-72 shrink-0 p-0 overflow-hidden flex flex-col">
                  <div className="p-3 border-b">
                    <h3 className="text-sm font-bold">상담 목록</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">{(chatRooms || []).length}건의 상담</p>
                  </div>
                  <div className="flex-1 overflow-y-auto divide-y">
                    {chatRoomsLoading ? (
                      <div className="p-3 space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>
                    ) : (chatRooms || []).length === 0 ? (
                      <div className="p-8 text-center">
                        <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-30 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">상담 내역이 없습니다</p>
                      </div>
                    ) : (
                      (chatRooms || []).map((room: any) => (
                        <div
                          key={room.id}
                          className={`px-3 py-3 cursor-pointer hover-elevate ${selectedChatRoom === room.id ? "bg-primary/10" : ""}`}
                          onClick={() => setSelectedChatRoom(room.id)}
                          data-testid={`chat-room-${room.id}`}
                        >
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                              <span className="text-xs font-bold text-primary">{(room.userName || "?").charAt(0)}</span>
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-2">
                                <p className="text-sm font-medium truncate">{room.userName}</p>
                                <span className="text-[11px] text-muted-foreground shrink-0">
                                  {new Date(room.lastMessageAt).toLocaleDateString("ko-KR", { month: "short", day: "numeric" })}
                                </span>
                              </div>
                              <p className="text-xs text-muted-foreground truncate">@{room.userUsername}</p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </Card>
                <Card className="flex-1 p-0 overflow-hidden flex flex-col">
                  {!selectedChatRoom ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center space-y-3">
                        <MessageSquare className="w-10 h-10 mx-auto text-muted-foreground opacity-30" />
                        <p className="text-sm text-muted-foreground">채팅방을 선택해주세요</p>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="p-3 border-b flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-xs font-bold text-primary">
                            {((chatRooms || []).find((r: any) => r.id === selectedChatRoom)?.userName || "?").charAt(0)}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium">
                            {(chatRooms || []).find((r: any) => r.id === selectedChatRoom)?.userName || "알 수 없음"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            @{(chatRooms || []).find((r: any) => r.id === selectedChatRoom)?.userUsername || ""}
                          </p>
                        </div>
                      </div>
                      <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {chatMessages.filter(m => m.roomId === selectedChatRoom).length === 0 ? (
                          <div className="flex items-center justify-center h-full">
                            <p className="text-sm text-muted-foreground">메시지가 없습니다</p>
                          </div>
                        ) : (
                          chatMessages.filter(m => m.roomId === selectedChatRoom).map((msg: any) => {
                            const isAdmin = msg.senderRole === "admin";
                            return (
                              <div key={msg.id} className={`flex ${isAdmin ? "justify-end" : "justify-start"}`} data-testid={`admin-chat-msg-${msg.id}`}>
                                <div className={`max-w-[75%] space-y-1 flex flex-col ${isAdmin ? "items-end" : "items-start"}`}>
                                  <span className="text-xs text-muted-foreground px-1">
                                    {isAdmin ? "상담원" : ((chatRooms || []).find((r: any) => r.id === selectedChatRoom)?.userName || "회원")}
                                  </span>
                                  <div className={`rounded-md px-3 py-2 text-sm break-words ${isAdmin ? "bg-[#004B9C] text-white" : "bg-muted text-foreground"}`}>
                                    {msg.message}
                                  </div>
                                  <span className="text-[11px] text-muted-foreground px-1">
                                    {new Date(msg.createdAt).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })}
                                  </span>
                                </div>
                              </div>
                            );
                          })
                        )}
                        <div ref={chatMessagesEndRef} />
                      </div>
                      <div className="shrink-0 border-t p-3">
                        <div className="flex items-center gap-2">
                          <Input
                            value={chatInput}
                            onChange={(e: any) => setChatInput(e.target.value)}
                            onKeyDown={(e: any) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleChatSend(); } }}
                            placeholder="답변을 입력하세요..."
                            data-testid="input-admin-chat"
                          />
                          <Button
                            size="icon"
                            onClick={handleChatSend}
                            disabled={!chatInput.trim()}
                            className="bg-[#004B9C] border-[#004B9C]"
                            data-testid="button-admin-send"
                          >
                            <Send className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </>
                  )}
                </Card>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
