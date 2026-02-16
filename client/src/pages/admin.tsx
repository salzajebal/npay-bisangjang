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
import { StockIcon } from "@/components/stock-icon";
import type { User, StockTransaction, TransferRequest, IpoStock } from "@shared/schema";
import {
  LogOut, Users, Package, ArrowDownRight, ArrowUpRight,
  Search, Trash2, LayoutDashboard, ClipboardList, Home, ChevronLeft, ChevronRight,
  Eye, Pencil, Snowflake, UserX, AlertTriangle, Save, X, ArrowRightLeft,
  CheckCircle2, XCircle, PauseCircle, Clock, MessageSquare, Send, Menu, Plus,
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
  const [category, setCategory] = useState("일반");
  const [stockName, setStockName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [pricePerShare, setPricePerShare] = useState("");
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
              <Label>단가 (원)</Label>
              <Input type="number" value={pricePerShare} onChange={(e) => setPricePerShare(e.target.value)} placeholder="단가 입력" data-testid="input-price" />
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
                      <span className="truncate flex items-center gap-1.5"><StockIcon name={tx.stockName} size={18} />{tx.stockName} {tx.quantity}주</span>
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

const KOREAN_STOCK_LIST = [
  "삼성전자","SK하이닉스","LG에너지솔루션","삼성바이오로직스","현대자동차","기아","셀트리온","KB금융","POSCO홀딩스","신한지주",
  "삼성SDI","LG화학","NAVER","카카오","하나금융지주","현대모비스","삼성물산","SK이노베이션","LG전자","삼성생명",
  "한국전력","SK텔레콤","KT","우리금융지주","삼성화재","포스코인터내셔널","SK","한화에어로스페이스","대한항공","HMM",
  "LG","고려아연","삼성전기","한화솔루션","한국타이어앤테크놀로지","CJ제일제당","S-Oil","두산에너빌리티","롯데케미칼","엔씨소프트",
  "카카오뱅크","크래프톤","삼성에스디에스","NH투자증권","미래에셋증권","한국투자증권","키움증권","대신증권","SK바이오팜","SK바이오사이언스",
  "에코프로비엠","에코프로","포스코퓨처엠","알테오젠","한미약품","유한양행","녹십자","JYP엔터","HYBE","SM엔터",
  "넷마블","펄어비스","컴투스","CJ ENM","스튜디오드래곤","카카오게임즈","위메이드","쿠팡","SK스퀘어","LG이노텍",
  "두산밥캣","한화오션","HD현대","HD한국조선해양","HD현대중공업","현대건설","GS건설","대우건설","현대엔지니어링","DL이앤씨",
  "한전KPS","한국가스공사","에스원","CJ대한통운","하이브","아모레퍼시픽","LG생활건강","호텔신라","F&F","한섬",
  "케이뱅크","무신사","두나무","빗썸","에스팀","엑스비스","카나프테라퓨틱스","토스","야놀자","컬리",
  "오아시스","에너진","오톰","이브이알스튜디오","에스엠랩","케이솔루션","비바리퍼블리카","직방","마켓컬리","쏘카",
  "원스토어","리디","버킷플레이스","당근","지그재그","클래스101","스파크플러스","마이리얼트립","타다","플레이디",
  "위블","코리아센터","브레인즈컴퍼니","메디톡스","휴젤","파마리서치","제넥신","진원생명과학","씨젠","에이비엘바이오",
  "레인보우로보틱스","두산로보틱스","한화시스템","LIG넥스원","현대로템","풍산","한국항공우주","한화","LG디스플레이","BOE",
];

function StocksManagementSection({
  ipoStocks,
  isLoading,
  onCreate,
  onUpdate,
  onDelete,
  isCreating,
  isUpdating,
}: {
  ipoStocks: IpoStock[];
  isLoading: boolean;
  onCreate: (data: any) => void;
  onUpdate: (data: any) => void;
  onDelete: (id: string) => void;
  isCreating: boolean;
  isUpdating: boolean;
}) {
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editStock, setEditStock] = useState<IpoStock | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [stockSearch, setStockSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const [formData, setFormData] = useState({
    stockName: "",
    startDate: "",
    endDate: "",
    brokers: "",
    priceMin: "",
    priceMax: "",
    competitionRate: "",
    status: "active",
    subscriptionStatus: "청약예정",
  });

  const resetForm = () => {
    setFormData({ stockName: "", startDate: "", endDate: "", brokers: "", priceMin: "", priceMax: "", competitionRate: "", status: "active", subscriptionStatus: "청약예정" });
    setStockSearch("");
  };

  const filteredStockSuggestions = stockSearch.length >= 1
    ? KOREAN_STOCK_LIST.filter(s => s.includes(stockSearch)).slice(0, 8)
    : [];

  const handleAdd = () => {
    if (!formData.stockName || !formData.startDate || !formData.endDate || !formData.brokers || !formData.priceMin || !formData.priceMax) return;
    onCreate(formData);
    setAddOpen(false);
    resetForm();
  };

  const handleEdit = () => {
    if (!editStock) return;
    onUpdate({ id: editStock.id, ...formData });
    setEditOpen(false);
    setEditStock(null);
    resetForm();
  };

  const openEdit = (stock: IpoStock) => {
    setEditStock(stock);
    setFormData({
      stockName: stock.stockName,
      startDate: stock.startDate,
      endDate: stock.endDate,
      brokers: stock.brokers,
      priceMin: String(stock.priceMin),
      priceMax: String(stock.priceMax),
      competitionRate: stock.competitionRate || "",
      status: stock.status,
      subscriptionStatus: stock.subscriptionStatus,
    });
    setEditOpen(true);
  };

  const filteredStocks = ipoStocks.filter((s) => {
    if (filterStatus !== "all" && s.status !== filterStatus) return false;
    if (searchTerm && !s.stockName.includes(searchTerm)) return false;
    return true;
  });

  const stockFormFields = (
    <div className="space-y-4 mt-2">
      <div className="space-y-2">
        <Label>종목명</Label>
        <div className="relative">
          <Input
            value={formData.stockName}
            onChange={(e) => { setFormData({ ...formData, stockName: e.target.value }); setStockSearch(e.target.value); }}
            placeholder="종목명 검색 (예: 삼성전자)"
            data-testid="input-stock-name"
          />
          {filteredStockSuggestions.length > 0 && stockSearch && formData.stockName === stockSearch && (
            <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-48 overflow-y-auto">
              {filteredStockSuggestions.map((name) => (
                <button
                  key={name}
                  type="button"
                  className="w-full text-left px-3 py-2 text-sm hover-elevate flex items-center gap-2"
                  onClick={() => { setFormData({ ...formData, stockName: name }); setStockSearch(""); }}
                  data-testid={`suggest-stock-${name}`}
                >
                  <StockIcon name={name} size={20} />
                  <span>{name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>시작일</Label>
          <Input type="date" value={formData.startDate} onChange={(e) => setFormData({ ...formData, startDate: e.target.value })} data-testid="input-stock-start" />
        </div>
        <div className="space-y-2">
          <Label>종료일</Label>
          <Input type="date" value={formData.endDate} onChange={(e) => setFormData({ ...formData, endDate: e.target.value })} data-testid="input-stock-end" />
        </div>
      </div>
      <div className="space-y-2">
        <Label>증권사</Label>
        <Input value={formData.brokers} onChange={(e) => setFormData({ ...formData, brokers: e.target.value })} placeholder="예: NH, 삼성, 한국" data-testid="input-stock-brokers" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>최소 공모가</Label>
          <Input type="number" value={formData.priceMin} onChange={(e) => setFormData({ ...formData, priceMin: e.target.value })} placeholder="7000" data-testid="input-stock-price-min" />
        </div>
        <div className="space-y-2">
          <Label>최대 공모가</Label>
          <Input type="number" value={formData.priceMax} onChange={(e) => setFormData({ ...formData, priceMax: e.target.value })} placeholder="8500" data-testid="input-stock-price-max" />
        </div>
      </div>
      <div className="space-y-2">
        <Label>기관경쟁률</Label>
        <Input value={formData.competitionRate} onChange={(e) => setFormData({ ...formData, competitionRate: e.target.value })} placeholder="198.53:1 (없으면 비워두기)" data-testid="input-stock-competition" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>청약 상태</Label>
          <Select value={formData.subscriptionStatus} onValueChange={(v) => setFormData({ ...formData, subscriptionStatus: v })}>
            <SelectTrigger data-testid="select-subscription-status"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="청약진행중">청약진행중</SelectItem>
              <SelectItem value="청약예정">청약예정</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>활성 상태</Label>
          <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
            <SelectTrigger data-testid="select-stock-status"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="active">활성</SelectItem>
              <SelectItem value="inactive">비활성</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3 flex-wrap flex-1">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="종목 검색"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
              data-testid="input-search-stocks"
            />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[120px]" data-testid="select-filter-stock-status">
              <SelectValue placeholder="상태" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체</SelectItem>
              <SelectItem value="active">활성</SelectItem>
              <SelectItem value="inactive">비활성</SelectItem>
            </SelectContent>
          </Select>
          <Badge variant="outline" className="shrink-0">{filteredStocks.length}건</Badge>
        </div>
        <Dialog open={addOpen} onOpenChange={(v) => { setAddOpen(v); if (!v) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="bg-[#E8344E] border-[#E8344E]" data-testid="button-add-stock">
              <Plus className="w-4 h-4 mr-1" />종목 추가
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>종목 추가</DialogTitle>
              <DialogDescription>새로운 청약 종목을 등록합니다</DialogDescription>
            </DialogHeader>
            {stockFormFields}
            <DialogFooter>
              <Button variant="ghost" onClick={() => { setAddOpen(false); resetForm(); }}>취소</Button>
              <Button className="bg-[#E8344E] border-[#E8344E]" onClick={handleAdd} disabled={isCreating} data-testid="button-confirm-add-stock">
                {isCreating ? "추가 중..." : "추가"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full bg-gray-200" />)}
        </div>
      ) : filteredStocks.length === 0 ? (
        <Card className="p-12 text-center">
          <Package className="w-10 h-10 mx-auto mb-3 opacity-30 text-gray-400" />
          <p className="font-medium text-gray-500">
            {searchTerm ? "검색 결과가 없습니다" : "등록된 종목이 없습니다"}
          </p>
        </Card>
      ) : (
        <>
          <div className="md:hidden space-y-3">
            {filteredStocks.map((stock) => (
              <Card key={stock.id} className="p-4 space-y-3" data-testid={`card-stock-${stock.id}`}>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <StockIcon name={stock.stockName} size={28} />
                    <div>
                      <p className="text-sm font-bold text-gray-900">{stock.stockName}</p>
                      <p className="text-xs text-gray-500">{stock.brokers}</p>
                    </div>
                  </div>
                  <Badge variant={stock.status === "active" ? "default" : "secondary"} className={stock.status === "active" ? "bg-green-600 border-green-600" : ""}>
                    {stock.status === "active" ? "활성" : "비활성"}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
                  <span>시작: {stock.startDate}</span>
                  <span>종료: {stock.endDate}</span>
                  <span>공모가: {stock.priceMin.toLocaleString()} ~ {stock.priceMax.toLocaleString()}원</span>
                  <span>경쟁률: {stock.competitionRate || "-"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={stock.subscriptionStatus === "청약진행중" ? "text-[#E8344E] border-[#E8344E]" : ""}>{stock.subscriptionStatus}</Badge>
                </div>
                <div className="flex items-center gap-1 pt-2 border-t border-gray-200">
                  <Button size="sm" variant="default" className="bg-blue-500 border-blue-500 text-xs" onClick={() => openEdit(stock)} data-testid={`button-edit-stock-${stock.id}`}>
                    <Pencil className="w-3 h-3 mr-1" />수정
                  </Button>
                  <Button size="sm" variant="destructive" className="text-xs" onClick={() => onDelete(stock.id)} data-testid={`button-delete-stock-${stock.id}`}>
                    <Trash2 className="w-3 h-3 mr-1" />삭제
                  </Button>
                  <Button
                    size="sm"
                    variant={stock.status === "active" ? "secondary" : "default"}
                    className={`text-xs ml-auto ${stock.status !== "active" ? "bg-green-600 border-green-600" : ""}`}
                    onClick={() => onUpdate({ id: stock.id, status: stock.status === "active" ? "inactive" : "active" })}
                    data-testid={`button-toggle-stock-${stock.id}`}
                  >
                    {stock.status === "active" ? "비활성화" : "활성화"}
                  </Button>
                </div>
              </Card>
            ))}
          </div>

          <Card className="hidden md:block p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="text-gray-500">종목명</TableHead>
                    <TableHead className="text-gray-500">시작일</TableHead>
                    <TableHead className="text-gray-500">종료일</TableHead>
                    <TableHead className="text-gray-500">증권사</TableHead>
                    <TableHead className="text-right text-gray-500">공모가</TableHead>
                    <TableHead className="text-gray-500">경쟁률</TableHead>
                    <TableHead className="text-gray-500">청약상태</TableHead>
                    <TableHead className="text-gray-500">상태</TableHead>
                    <TableHead className="text-center text-gray-500">작업</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStocks.map((stock) => (
                    <TableRow key={stock.id} data-testid={`row-stock-${stock.id}`}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <StockIcon name={stock.stockName} size={24} />
                          <span className="font-medium text-gray-900">{stock.stockName}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-700">{stock.startDate}</TableCell>
                      <TableCell className="text-gray-700">{stock.endDate}</TableCell>
                      <TableCell className="text-gray-700">{stock.brokers}</TableCell>
                      <TableCell className="text-right font-mono tabular-nums text-gray-700">
                        {stock.priceMin.toLocaleString()} ~ {stock.priceMax.toLocaleString()}원
                      </TableCell>
                      <TableCell className="text-gray-700">{stock.competitionRate || "-"}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={stock.subscriptionStatus === "청약진행중" ? "text-[#E8344E] border-[#E8344E]" : ""}>
                          {stock.subscriptionStatus}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={stock.status === "active" ? "default" : "secondary"} className={stock.status === "active" ? "bg-green-600 border-green-600" : ""}>
                          {stock.status === "active" ? "활성" : "비활성"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-1">
                          <Button size="sm" variant="default" className="bg-blue-500 border-blue-500 text-xs" onClick={() => openEdit(stock)} data-testid={`button-edit-stock-${stock.id}`}>
                            <Pencil className="w-3 h-3 mr-1" />수정
                          </Button>
                          <Button size="sm" variant="destructive" className="text-xs" onClick={() => onDelete(stock.id)} data-testid={`button-delete-stock-${stock.id}`}>
                            <Trash2 className="w-3 h-3 mr-1" />삭제
                          </Button>
                          <Button
                            size="sm"
                            variant={stock.status === "active" ? "secondary" : "default"}
                            className={`text-xs ${stock.status !== "active" ? "bg-green-600 border-green-600" : ""}`}
                            onClick={() => onUpdate({ id: stock.id, status: stock.status === "active" ? "inactive" : "active" })}
                            data-testid={`button-toggle-stock-${stock.id}`}
                          >
                            {stock.status === "active" ? "비활성화" : "활성화"}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        </>
      )}

      <Dialog open={editOpen} onOpenChange={(v) => { setEditOpen(v); if (!v) { setEditStock(null); resetForm(); } }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>종목 수정</DialogTitle>
            <DialogDescription>{editStock?.stockName} 정보를 수정합니다</DialogDescription>
          </DialogHeader>
          {stockFormFields}
          <DialogFooter>
            <Button variant="ghost" onClick={() => { setEditOpen(false); setEditStock(null); resetForm(); }}>취소</Button>
            <Button className="bg-[#E8344E] border-[#E8344E]" onClick={handleEdit} disabled={isUpdating} data-testid="button-confirm-edit-stock">
              {isUpdating ? "수정 중..." : "수정"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

type AdminSection = "dashboard" | "members" | "transactions" | "transfers" | "stocks" | "chat";

const sidebarItems: { id: AdminSection; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "dashboard", label: "대시보드", icon: LayoutDashboard },
  { id: "members", label: "회원 관리", icon: Users },
  { id: "transactions", label: "거래 내역", icon: ClipboardList },
  { id: "transfers", label: "대체출고 관리", icon: ArrowRightLeft },
  { id: "stocks", label: "종목 관리", icon: Package },
  { id: "chat", label: "1:1 상담", icon: MessageSquare },
];

export default function AdminPage() {
  const [, setLocation] = useLocation();
  const [activeSection, setActiveSection] = useState<AdminSection>("dashboard");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [selectedChatRoom, setSelectedChatRoom] = useState<string | null>(null);
  const selectedChatRoomRef = useRef<string | null>(null);
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

  const { data: ipoStocksData, isLoading: ipoStocksLoading } = useQuery<IpoStock[]>({
    queryKey: ["/api/admin/ipo-stocks"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: !!authData?.user?.isAdmin,
  });

  const totalUnreadCount = (chatRooms || []).reduce((sum: number, room: any) => sum + (room.unreadCount || 0), 0);

  const createIpoStockMutation = useMutation({
    mutationFn: async (data: any) => {
      await apiRequest("POST", "/api/admin/ipo-stocks", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/ipo-stocks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/ipo-stocks"] });
      toast({ title: "종목 추가 완료" });
    },
    onError: (error: Error) => {
      toast({ title: "오류", description: error.message, variant: "destructive" });
    },
  });

  const updateIpoStockMutation = useMutation({
    mutationFn: async ({ id, ...data }: any) => {
      await apiRequest("PATCH", `/api/admin/ipo-stocks/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/ipo-stocks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/ipo-stocks"] });
      toast({ title: "종목 수정 완료" });
    },
    onError: (error: Error) => {
      toast({ title: "오류", description: error.message, variant: "destructive" });
    },
  });

  const deleteIpoStockMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/admin/ipo-stocks/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/ipo-stocks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/ipo-stocks"] });
      toast({ title: "종목 삭제 완료" });
    },
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
      setLocation("/admin/login");
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
          if (parsed.data.senderRole === "user") {
            const currentRoom = selectedChatRoomRef.current;
            if (currentRoom && parsed.data.roomId === currentRoom) {
              fetch(`/api/chat/rooms/${currentRoom}/mark-read`, { method: "POST", credentials: "include" }).then(() => {
                queryClient.invalidateQueries({ queryKey: ["/api/chat/rooms"] });
              }).catch(() => {});
            } else {
              queryClient.invalidateQueries({ queryKey: ["/api/chat/rooms"] });
            }
          }
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
        if (parsed.type === "transfer_update" && parsed.data?.action === "new_request") {
          const audio = new Audio("data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbsGMcBj+a2telezhJj+DYrGQ/RG2q3+OiXzZEgNThpGc/SF+W4NqkZz1Bd9bnpmk7Rme15NSmaT1ER9bn0apjNkhfvOnSrWI0R2bC8NCtVjRJZMXw1atXM0xnzvfXrFQ0TGXL9NitVTBMZc741qtU");
          audio.volume = 0.5;
          audio.play().catch(() => {});
          toast({
            title: "새 대체출고 신청",
            description: `${parsed.data.userName || "회원"}님이 대체출고를 신청했습니다`,
          });
          queryClient.invalidateQueries({ queryKey: ["/api/admin/transfer-requests"] });
          queryClient.invalidateQueries({ queryKey: ["/api/admin/transactions"] });
        }
        if (parsed.type === "transaction_update") {
          queryClient.invalidateQueries({ queryKey: ["/api/admin/transactions"] });
          queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
        }
      } catch {}
    };
    ws.onclose = () => {};
    return () => { ws.close(); chatWsRef.current = null; };
  }, [authData?.user?.isAdmin]);

  useEffect(() => {
    selectedChatRoomRef.current = selectedChatRoom;
  }, [selectedChatRoom]);

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
        await fetch(`/api/chat/rooms/${selectedChatRoom}/mark-read`, { method: "POST", credentials: "include" });
        queryClient.invalidateQueries({ queryKey: ["/api/chat/rooms"] });
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
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="space-y-4 w-full max-w-md px-4">
          <Skeleton className="h-10 w-full bg-gray-200" />
          <Skeleton className="h-32 w-full bg-gray-200" />
          <Skeleton className="h-64 w-full bg-gray-200" />
        </div>
      </div>
    );
  }

  if (!authData?.user?.isAdmin) {
    return <Redirect to="/admin/login" />;
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

  const adminSidebarContent = (isMobile: boolean) => (
    <>
      <div className={`h-14 border-b border-gray-200 flex items-center ${!isMobile && sidebarCollapsed ? "justify-center px-2" : "px-4"} gap-2`}>
        {(!isMobile && sidebarCollapsed) ? (
          <div className="w-7 h-7 rounded-md bg-[#E8344E] flex items-center justify-center shrink-0">
            <span className="text-white text-xs font-bold">U+</span>
          </div>
        ) : (
          <>
            <div className="w-7 h-7 rounded-md bg-[#E8344E] flex items-center justify-center shrink-0">
              <span className="text-white text-xs font-bold">U+</span>
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-bold text-sm truncate text-gray-900">증권플러스 비상장</span>
              <span className="text-[11px] text-gray-500">관리자 시스템</span>
            </div>
            {isMobile && (
              <button onClick={() => setMobileSidebarOpen(false)} className="ml-auto p-1" data-testid="button-close-admin-sidebar">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            )}
          </>
        )}
      </div>
      <nav className="flex-1 py-3 px-2 space-y-1">
        {sidebarItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;
          const showUnread = item.id === "chat" && totalUnreadCount > 0;
          return (
            <button
              key={item.id}
              onClick={() => { setActiveSection(item.id); if (isMobile) setMobileSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 rounded-md text-sm font-medium transition-colors ${!isMobile && sidebarCollapsed ? "justify-center px-2 py-2.5" : "px-3 py-2.5"} ${isActive ? "bg-[#E8344E] text-white" : "text-gray-600"}`}
              data-testid={`nav-admin-${item.id}`}
              title={!isMobile && sidebarCollapsed ? item.label : undefined}
            >
              <div className="relative shrink-0">
                <Icon className="w-4 h-4" />
                {showUnread && !isMobile && sidebarCollapsed && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center" data-testid="badge-chat-unread-icon">
                    {totalUnreadCount > 99 ? "99+" : totalUnreadCount}
                  </span>
                )}
              </div>
              {(isMobile || !sidebarCollapsed) && (
                <span className="flex-1 text-left">{item.label}</span>
              )}
              {showUnread && (isMobile || !sidebarCollapsed) && (
                <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-red-500 text-white text-[11px] font-bold flex items-center justify-center shrink-0" data-testid="badge-chat-unread">
                  {totalUnreadCount > 99 ? "99+" : totalUnreadCount}
                </span>
              )}
            </button>
          );
        })}
      </nav>
      <div className="border-t border-gray-200 p-2 space-y-1">
        <Link href="/">
          <button onClick={() => isMobile && setMobileSidebarOpen(false)} className={`w-full flex items-center gap-3 rounded-md text-sm text-gray-600 transition-colors ${!isMobile && sidebarCollapsed ? "justify-center px-2 py-2.5" : "px-3 py-2.5"}`} data-testid="nav-admin-home" title={!isMobile && sidebarCollapsed ? "메인 홈" : undefined}>
            <Home className="w-4 h-4 shrink-0" />
            {(isMobile || !sidebarCollapsed) && <span>메인 홈</span>}
          </button>
        </Link>
        <button
          onClick={() => logoutMutation.mutate()}
          className={`w-full flex items-center gap-3 rounded-md text-sm text-gray-600 transition-colors ${!isMobile && sidebarCollapsed ? "justify-center px-2 py-2.5" : "px-3 py-2.5"}`}
          data-testid="button-admin-logout"
          title={!isMobile && sidebarCollapsed ? "로그아웃" : undefined}
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {(isMobile || !sidebarCollapsed) && <span>로그아웃</span>}
        </button>
        {!isMobile && (
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className={`w-full flex items-center gap-3 rounded-md text-sm text-gray-600 transition-colors ${sidebarCollapsed ? "justify-center px-2 py-2" : "px-3 py-2"}`}
            data-testid="button-toggle-sidebar"
          >
            {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <><ChevronLeft className="w-4 h-4 shrink-0" /><span>접기</span></>}
          </button>
        )}
      </div>
    </>
  );

  return (
    <div className="flex h-screen bg-white overflow-hidden">
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-64 bg-gray-50 border-r border-gray-200 flex flex-col z-10">
            {adminSidebarContent(true)}
          </aside>
        </div>
      )}

      <aside className={`hidden md:flex ${sidebarCollapsed ? "w-16" : "w-60"} border-r border-gray-200 bg-gray-50 flex-col transition-all duration-200 shrink-0`}>
        {adminSidebarContent(false)}
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-14 border-b border-gray-200 bg-gray-50 flex items-center justify-between gap-2 sm:gap-4 px-3 sm:px-6 shrink-0">
          <div className="flex items-center gap-2">
            <button onClick={() => setMobileSidebarOpen(true)} className="md:hidden p-1 text-gray-500" data-testid="button-admin-mobile-menu">
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="font-bold text-base sm:text-lg text-gray-900" data-testid="text-admin-section-title">
              {sidebarItems.find((i) => i.id === activeSection)?.label}
            </h1>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Badge variant="outline" className="border-gray-200 text-gray-500">Admin</Badge>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-4 sm:space-y-6">
          {activeSection === "dashboard" && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="p-5 bg-white border-gray-200">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm text-gray-500">총 회원수</p>
                      <p className="text-2xl font-bold mt-1 tabular-nums text-gray-900" data-testid="text-total-members">{totalMembers}명</p>
                      {frozenMembers > 0 && <p className="text-xs text-blue-500 mt-0.5">{frozenMembers}명 동결</p>}
                    </div>
                    <div className="w-10 h-10 rounded-md bg-[#E8344E]/20 flex items-center justify-center">
                      <Users className="w-5 h-5 text-[#E8344E]" />
                    </div>
                  </div>
                </Card>
                <Card className="p-5 bg-white border-gray-200">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm text-gray-500">총 입고</p>
                      <p className="text-2xl font-bold mt-1 text-red-500 tabular-nums" data-testid="text-admin-total-in">{totalIn.toLocaleString()}주</p>
                    </div>
                    <div className="w-10 h-10 rounded-md bg-red-500/10 flex items-center justify-center">
                      <ArrowDownRight className="w-5 h-5 text-red-500" />
                    </div>
                  </div>
                </Card>
                <Card className="p-5 bg-white border-gray-200">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm text-gray-500">총 출고</p>
                      <p className="text-2xl font-bold mt-1 text-blue-500 tabular-nums" data-testid="text-admin-total-out">{totalOut.toLocaleString()}주</p>
                    </div>
                    <div className="w-10 h-10 rounded-md bg-blue-500/10 flex items-center justify-center">
                      <ArrowUpRight className="w-5 h-5 text-blue-500" />
                    </div>
                  </div>
                </Card>
                <Card className="p-5 bg-white border-gray-200">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm text-gray-500">보유 잔량</p>
                      <p className="text-2xl font-bold mt-1 tabular-nums text-gray-900" data-testid="text-admin-holding">{(totalIn - totalOut).toLocaleString()}주</p>
                    </div>
                    <div className="w-10 h-10 rounded-md bg-[#E8344E]/20 flex items-center justify-center">
                      <Package className="w-5 h-5 text-[#E8344E]" />
                    </div>
                  </div>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="p-0 overflow-hidden bg-white border-gray-200">
                  <div className="p-4 border-b border-gray-200 flex items-center justify-between gap-4">
                    <div>
                      <h3 className="font-bold text-sm text-gray-900">최근 회원</h3>
                      <p className="text-xs text-gray-500 mt-0.5">최근 가입한 회원 목록</p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setActiveSection("members")} data-testid="link-view-all-members">
                      전체보기
                    </Button>
                  </div>
                  {usersLoading ? (
                    <div className="p-4 space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-10 w-full bg-gray-200" />)}</div>
                  ) : users.length === 0 ? (
                    <div className="p-8 text-center text-gray-500 text-sm">등록된 회원이 없습니다</div>
                  ) : (
                    <div className="divide-y divide-gray-200">
                      {users.slice(0, 5).map((u) => (
                        <div key={u.id} className="px-4 py-3 flex items-center justify-between gap-4" data-testid={`dash-user-${u.id}`}>
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-8 h-8 rounded-full bg-[#E8344E]/20 flex items-center justify-center shrink-0">
                              <span className="text-xs font-bold text-[#E8344E]">{u.fullName.charAt(0)}</span>
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-medium truncate text-gray-700">{u.fullName}</p>
                                {u.isFrozen && <Badge variant="destructive" className="text-[10px] px-1.5 py-0">동결</Badge>}
                              </div>
                              <p className="text-xs text-gray-500 truncate">{u.bank} · {u.accountNumber}</p>
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

                <Card className="p-0 overflow-hidden bg-white border-gray-200">
                  <div className="p-4 border-b border-gray-200 flex items-center justify-between gap-4">
                    <div>
                      <h3 className="font-bold text-sm text-gray-900">최근 거래</h3>
                      <p className="text-xs text-gray-500 mt-0.5">최근 입출고 내역</p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setActiveSection("transactions")} data-testid="link-view-all-tx">
                      전체보기
                    </Button>
                  </div>
                  {txLoading ? (
                    <div className="p-4 space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-10 w-full bg-gray-200" />)}</div>
                  ) : transactions.length === 0 ? (
                    <div className="p-8 text-center text-gray-500 text-sm">거래 내역이 없습니다</div>
                  ) : (
                    <div className="divide-y divide-gray-200">
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
                              <span className="text-sm font-medium truncate text-gray-700 flex items-center gap-1.5"><StockIcon name={tx.stockName} size={18} />{getUserName(tx.userId)} · {tx.stockName}</span>
                              <p className="text-xs text-gray-500">{tx.quantity.toLocaleString()}주 · {tx.pricePerShare.toLocaleString()}원</p>
                            </div>
                          </div>
                          <span className="text-xs text-gray-400 shrink-0">{new Date(tx.createdAt).toLocaleDateString("ko-KR")}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              </div>

              <Card className="p-5 bg-white border-gray-200">
                <h3 className="font-bold text-sm mb-1 text-gray-900">자산 요약</h3>
                <p className="text-xs text-gray-500 mb-4">전체 입고 기준 총 자산 가치</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <div>
                    <p className="text-sm text-gray-500">총 거래 건수</p>
                    <p className="text-xl font-bold mt-1 tabular-nums text-gray-900">{transactions.length}건</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">총 입고 금액</p>
                    <p className="text-xl font-bold mt-1 tabular-nums text-gray-900">{totalValue.toLocaleString()}원</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">현재 보유 잔량</p>
                    <p className="text-xl font-bold mt-1 tabular-nums text-gray-900">{(totalIn - totalOut).toLocaleString()}주</p>
                  </div>
                </div>
              </Card>
            </>
          )}

          {activeSection === "members" && (
            <>
              <div className="flex items-center gap-3 flex-wrap">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="회원 검색 (이름, 아이디, 계좌번호)"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 bg-white border-gray-200 text-gray-900 placeholder:text-gray-400"
                    data-testid="input-search-members"
                  />
                </div>
                <Badge variant="outline" className="shrink-0 border-gray-200 text-gray-500">{filteredUsers.length}명</Badge>
              </div>

              {usersLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full bg-gray-200" />)}
                </div>
              ) : filteredUsers.length === 0 ? (
                <Card className="p-12 text-center bg-white border-gray-200">
                  <Users className="w-10 h-10 mx-auto mb-3 opacity-30 text-gray-400" />
                  <p className="font-medium text-gray-500">
                    {searchTerm ? "검색 결과가 없습니다" : "등록된 회원이 없습니다"}
                  </p>
                </Card>
              ) : (
                <>
                <div className="md:hidden space-y-3">
                  {filteredUsers.map((u) => (
                    <div key={u.id} className={`rounded-md border border-gray-200 bg-white p-4 space-y-3 ${u.isFrozen ? "opacity-60" : ""}`} data-testid={`row-user-${u.id}`}>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#E8344E]/20 flex items-center justify-center shrink-0">
                          <span className="text-sm font-bold text-[#E8344E]">{u.fullName.charAt(0)}</span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-700 truncate">{u.fullName}</p>
                          <p className="text-xs text-gray-500">@{u.username}</p>
                        </div>
                        {u.isFrozen ? (
                          <Badge variant="destructive" className="text-[11px] shrink-0">동결</Badge>
                        ) : (
                          <Badge variant="outline" className="text-[11px] border-gray-200 text-gray-500 shrink-0">정상</Badge>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 space-y-1">
                        <p>{u.bank} · {u.accountHolder}</p>
                        <p className="font-mono text-gray-400">{u.accountNumber}</p>
                      </div>
                      <div className="flex items-center gap-1 flex-wrap pt-1 border-t border-gray-200">
                        <MemberDetailDialog user={u} transactions={transactions} />
                        <MemberEditDialog user={u} onSuccess={refreshData} />
                        <MemberFreezeDialog user={u} onSuccess={refreshData} />
                        <MemberDeleteDialog user={u} onSuccess={refreshData} />
                        <div className="w-px h-5 bg-gray-200 mx-1" />
                        <StockTransactionDialog user={u} type="in" onSuccess={refreshData} />
                        <StockTransactionDialog user={u} type="out" onSuccess={refreshData} />
                      </div>
                    </div>
                  ))}
                </div>

                <Card className="hidden md:block p-0 overflow-hidden bg-white border-gray-200">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-50 border-gray-200">
                          <TableHead className="text-gray-500">아이디</TableHead>
                          <TableHead className="text-gray-500">성명</TableHead>
                          <TableHead className="text-gray-500">상태</TableHead>
                          <TableHead className="text-gray-500">은행</TableHead>
                          <TableHead className="text-gray-500">계좌번호</TableHead>
                          <TableHead className="text-gray-500">예금주</TableHead>
                          <TableHead className="text-gray-500">가입일</TableHead>
                          <TableHead className="text-center text-gray-500">관리</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredUsers.map((u) => (
                          <TableRow key={u.id} className={`border-gray-200 ${u.isFrozen ? "opacity-60" : ""}`} data-testid={`row-user-${u.id}`}>
                            <TableCell className="font-medium text-gray-700">{u.username}</TableCell>
                            <TableCell className="text-gray-700">{u.fullName}</TableCell>
                            <TableCell>
                              {u.isFrozen ? (
                                <Badge variant="destructive" className="text-[11px]">동결</Badge>
                              ) : (
                                <Badge variant="outline" className="text-[11px] border-gray-200 text-gray-500">정상</Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-gray-700">{u.bank}</TableCell>
                            <TableCell className="font-mono text-sm text-gray-700">{u.accountNumber}</TableCell>
                            <TableCell className="text-gray-700">{u.accountHolder}</TableCell>
                            <TableCell className="text-sm text-gray-400">
                              {new Date(u.createdAt).toLocaleDateString("ko-KR")}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center justify-center gap-1">
                                <MemberDetailDialog user={u} transactions={transactions} />
                                <MemberEditDialog user={u} onSuccess={refreshData} />
                                <MemberFreezeDialog user={u} onSuccess={refreshData} />
                                <MemberDeleteDialog user={u} onSuccess={refreshData} />
                                <div className="w-px h-5 bg-gray-200 mx-1" />
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
                </>
              )}
            </>
          )}

          {activeSection === "transactions" && (
            <>
              <div className="flex items-center gap-3 flex-wrap">
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-[140px] bg-white border-gray-200 text-gray-700" data-testid="select-filter-type">
                    <SelectValue placeholder="유형" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">전체</SelectItem>
                    <SelectItem value="in">입고</SelectItem>
                    <SelectItem value="out">출고</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterCategory} onValueChange={setFilterCategory}>
                  <SelectTrigger className="w-[140px] bg-white border-gray-200 text-gray-700" data-testid="select-filter-category">
                    <SelectValue placeholder="카테고리" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">전체</SelectItem>
                    {STOCK_CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Badge variant="outline" className="shrink-0 border-gray-200 text-gray-500">{filteredTransactions.length}건</Badge>
              </div>

              {txLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full bg-gray-200" />)}
                </div>
              ) : filteredTransactions.length === 0 ? (
                <Card className="p-12 text-center bg-white border-gray-200">
                  <Package className="w-10 h-10 mx-auto mb-3 opacity-30 text-gray-400" />
                  <p className="font-medium text-gray-500">거래 내역이 없습니다</p>
                </Card>
              ) : (
                <>
                <div className="md:hidden space-y-3">
                  {filteredTransactions.map((tx) => (
                    <div key={tx.id} className="rounded-md border border-gray-200 bg-white p-4 space-y-3" data-testid={`row-tx-${tx.id}`}>
                      <div className="flex items-center justify-between gap-2">
                        <Badge
                          variant={tx.type === "in" ? "default" : "secondary"}
                          className={tx.type === "in" ? "bg-red-500 border-red-500" : "bg-blue-500 border-blue-500 text-white"}
                        >
                          {tx.type === "in" ? "입고" : "출고"}
                        </Badge>
                        <span className="text-xs text-gray-400">{new Date(tx.createdAt).toLocaleDateString("ko-KR")}</span>
                      </div>
                      <div className="space-y-1">
                        <span className="text-sm font-medium text-gray-700 flex items-center gap-1.5"><StockIcon name={tx.stockName} size={18} />{getUserName(tx.userId)} · {tx.stockName}</span>
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                          <span>{tx.quantity.toLocaleString()}주</span>
                          <span>{tx.pricePerShare.toLocaleString()}원</span>
                        </div>
                        <p className="text-sm font-medium text-gray-700 tabular-nums">총 {(tx.quantity * tx.pricePerShare).toLocaleString()}원</p>
                      </div>
                      <div className="flex items-center justify-between gap-2 text-xs text-gray-400">
                        <span>{tx.category}{tx.memo ? ` · ${tx.memo}` : ""}</span>
                      </div>
                      <div className="flex items-center gap-1 pt-1 border-t border-gray-200">
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
                    </div>
                  ))}
                </div>

                <Card className="hidden md:block p-0 overflow-hidden bg-white border-gray-200">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-50 border-gray-200">
                          <TableHead className="text-gray-500">유형</TableHead>
                          <TableHead className="text-gray-500">카테고리</TableHead>
                          <TableHead className="text-gray-500">회원</TableHead>
                          <TableHead className="text-gray-500">종목</TableHead>
                          <TableHead className="text-right text-gray-500">수량</TableHead>
                          <TableHead className="text-right text-gray-500">단가</TableHead>
                          <TableHead className="text-right text-gray-500">총액</TableHead>
                          <TableHead className="text-gray-500">메모</TableHead>
                          <TableHead className="text-gray-500">일시</TableHead>
                          <TableHead className="text-center text-gray-500">관리</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredTransactions.map((tx) => (
                          <TableRow key={tx.id} className="border-gray-200" data-testid={`row-tx-${tx.id}`}>
                            <TableCell>
                              <Badge
                                variant={tx.type === "in" ? "default" : "secondary"}
                                className={tx.type === "in" ? "bg-red-500 border-red-500" : "bg-blue-500 border-blue-500 text-white"}
                              >
                                {tx.type === "in" ? "입고" : "출고"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-gray-700">{tx.category}</TableCell>
                            <TableCell className="font-medium text-gray-700">{getUserName(tx.userId)}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1.5">
                                <StockIcon name={tx.stockName} size={22} />
                                <span className="text-gray-700">{tx.stockName}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-right font-mono tabular-nums text-gray-700">{tx.quantity.toLocaleString()}주</TableCell>
                            <TableCell className="text-right font-mono tabular-nums text-gray-700">{tx.pricePerShare.toLocaleString()}원</TableCell>
                            <TableCell className="text-right font-mono tabular-nums text-gray-700">{(tx.quantity * tx.pricePerShare).toLocaleString()}원</TableCell>
                            <TableCell className="text-sm text-gray-400">{tx.memo || "-"}</TableCell>
                            <TableCell className="text-sm text-gray-400">
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
                </>
              )}
            </>
          )}

          {activeSection === "transfers" && (
            <>
              <div className="flex items-center gap-3 flex-wrap">
                <Badge variant="outline" className="shrink-0 border-gray-200 text-gray-500">
                  {(allTransferRequests || []).length}건
                </Badge>
                <Badge variant="outline" className="shrink-0 bg-yellow-500/10 text-yellow-600 border-yellow-500/30">
                  대기 {(allTransferRequests || []).filter(r => r.status === "pending").length}건
                </Badge>
              </div>

              {transfersLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full bg-gray-200" />)}
                </div>
              ) : (allTransferRequests || []).length === 0 ? (
                <Card className="p-12 text-center bg-white border-gray-200">
                  <ArrowRightLeft className="w-10 h-10 mx-auto mb-3 opacity-30 text-gray-400" />
                  <p className="font-medium text-gray-500">대체출고 신청 내역이 없습니다</p>
                </Card>
              ) : (
                <>
                <div className="md:hidden space-y-3">
                  {(allTransferRequests || []).map((tr) => (
                    <div key={tr.id} className="rounded-md border border-gray-200 bg-white p-4 space-y-3" data-testid={`row-transfer-${tr.id}`}>
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          {tr.status === "pending" && <Badge variant="outline" className="gap-1 border-gray-200 text-gray-500"><Clock className="w-3 h-3" />대기</Badge>}
                          {tr.status === "approved" && <Badge className="gap-1 bg-green-600 border-green-600"><CheckCircle2 className="w-3 h-3" />승인</Badge>}
                          {tr.status === "rejected" && <Badge variant="destructive" className="gap-1"><XCircle className="w-3 h-3" />거부</Badge>}
                          {tr.status === "held" && <Badge variant="secondary" className="gap-1"><PauseCircle className="w-3 h-3" />보류</Badge>}
                        </div>
                        <span className="text-xs text-gray-400">{new Date(tr.createdAt).toLocaleDateString("ko-KR")}</span>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-gray-700">{getUserName(tr.userId)}</p>
                        <span className="text-sm text-gray-700 flex items-center gap-1.5"><StockIcon name={tr.stockName} size={18} />{tr.stockName} · {tr.quantity.toLocaleString()}주</span>
                      </div>
                      <div className="text-xs text-gray-500 space-y-1">
                        <p>{tr.accountName} · <span className="font-mono text-gray-400">{tr.accountNumber}</span></p>
                        {tr.adminMemo && <p className="text-gray-400">{tr.adminMemo}</p>}
                      </div>
                      <div className="flex items-center gap-1 flex-wrap pt-1 border-t border-gray-200">
                        <Button
                          size="sm"
                          variant="default"
                          className="bg-green-600 border-green-600 text-xs"
                          onClick={() => updateTransferStatusMutation.mutate({ id: tr.id, status: "approved" })}
                          disabled={tr.status === "approved" || updateTransferStatusMutation.isPending}
                          data-testid={`button-approve-${tr.id}`}
                        >
                          승인
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          className="text-xs"
                          onClick={() => updateTransferStatusMutation.mutate({ id: tr.id, status: "rejected" })}
                          disabled={tr.status === "rejected" || updateTransferStatusMutation.isPending}
                          data-testid={`button-reject-${tr.id}`}
                        >
                          거부
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          className="text-xs"
                          onClick={() => updateTransferStatusMutation.mutate({ id: tr.id, status: "held" })}
                          disabled={tr.status === "held" || updateTransferStatusMutation.isPending}
                          data-testid={`button-hold-${tr.id}`}
                        >
                          보류
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                <Card className="hidden md:block p-0 overflow-hidden bg-white border-gray-200">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-50 border-gray-200">
                          <TableHead className="text-gray-500">상태</TableHead>
                          <TableHead className="text-gray-500">신청 회원</TableHead>
                          <TableHead className="text-gray-500">종목</TableHead>
                          <TableHead className="text-right text-gray-500">수량</TableHead>
                          <TableHead className="text-gray-500">예금주</TableHead>
                          <TableHead className="text-gray-500">계좌번호</TableHead>
                          <TableHead className="text-gray-500">신청일</TableHead>
                          <TableHead className="text-gray-500">관리자 메모</TableHead>
                          <TableHead className="text-center text-gray-500">처리</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(allTransferRequests || []).map((tr) => (
                          <TableRow key={tr.id} className="border-gray-200" data-testid={`row-transfer-${tr.id}`}>
                            <TableCell>
                              {tr.status === "pending" && <Badge variant="outline" className="gap-1 border-gray-200 text-gray-500"><Clock className="w-3 h-3" />대기</Badge>}
                              {tr.status === "approved" && <Badge className="gap-1 bg-green-600 border-green-600"><CheckCircle2 className="w-3 h-3" />승인</Badge>}
                              {tr.status === "rejected" && <Badge variant="destructive" className="gap-1"><XCircle className="w-3 h-3" />거부</Badge>}
                              {tr.status === "held" && <Badge variant="secondary" className="gap-1"><PauseCircle className="w-3 h-3" />보류</Badge>}
                            </TableCell>
                            <TableCell className="font-medium text-gray-700">{getUserName(tr.userId)}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1.5">
                                <StockIcon name={tr.stockName} size={22} />
                                <span className="text-gray-700">{tr.stockName}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-right font-mono tabular-nums text-gray-700">{tr.quantity.toLocaleString()}주</TableCell>
                            <TableCell className="text-gray-700">{tr.accountName}</TableCell>
                            <TableCell className="font-mono text-sm text-gray-700">{tr.accountNumber}</TableCell>
                            <TableCell className="text-sm text-gray-400">
                              {new Date(tr.createdAt).toLocaleDateString("ko-KR")}
                            </TableCell>
                            <TableCell className="text-sm text-gray-400 max-w-[150px] truncate">
                              {tr.adminMemo || "-"}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center justify-center gap-1 flex-nowrap">
                                <Button
                                  size="sm"
                                  variant="default"
                                  className="bg-green-600 border-green-600 text-xs sm:text-sm px-2 sm:px-3"
                                  onClick={() => updateTransferStatusMutation.mutate({ id: tr.id, status: "approved" })}
                                  disabled={tr.status === "approved" || updateTransferStatusMutation.isPending}
                                  data-testid={`button-approve-${tr.id}`}
                                >
                                  승인
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  className="text-xs sm:text-sm px-2 sm:px-3"
                                  onClick={() => updateTransferStatusMutation.mutate({ id: tr.id, status: "rejected" })}
                                  disabled={tr.status === "rejected" || updateTransferStatusMutation.isPending}
                                  data-testid={`button-reject-${tr.id}`}
                                >
                                  거부
                                </Button>
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  className="text-xs sm:text-sm px-2 sm:px-3"
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
                </>
              )}
            </>
          )}

          {activeSection === "stocks" && (
            <StocksManagementSection
              ipoStocks={ipoStocksData || []}
              isLoading={ipoStocksLoading}
              onCreate={(data: any) => createIpoStockMutation.mutate(data)}
              onUpdate={(data: any) => updateIpoStockMutation.mutate(data)}
              onDelete={(id: string) => deleteIpoStockMutation.mutate(id)}
              isCreating={createIpoStockMutation.isPending}
              isUpdating={updateIpoStockMutation.isPending}
            />
          )}

          {activeSection === "chat" && (
            <>
              <div className="flex items-center gap-3 mb-4 sm:mb-6">
                <MessageSquare className="w-5 h-5 text-[#E8344E]" />
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-gray-900">1:1 고객 상담</h2>
                  <p className="text-xs sm:text-sm text-gray-500">회원 문의에 실시간으로 응답합니다</p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 h-[calc(100vh-200px)] sm:h-[calc(100vh-180px)]">
                <Card className={`${selectedChatRoom ? "hidden sm:flex" : "flex"} w-full sm:w-72 sm:shrink-0 p-0 overflow-hidden flex-col bg-white border-gray-200`}>
                  <div className="p-3 border-b border-gray-200">
                    <h3 className="text-sm font-bold text-gray-900">상담 목록</h3>
                    <p className="text-xs text-gray-500 mt-0.5">{(chatRooms || []).length}건의 상담</p>
                  </div>
                  <div className="flex-1 overflow-y-auto divide-y divide-gray-200">
                    {chatRoomsLoading ? (
                      <div className="p-3 space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-12 w-full bg-gray-200" />)}</div>
                    ) : (chatRooms || []).length === 0 ? (
                      <div className="p-8 text-center">
                        <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-30 text-gray-400" />
                        <p className="text-sm text-gray-500">상담 내역이 없습니다</p>
                      </div>
                    ) : (
                      (chatRooms || []).map((room: any) => (
                        <div
                          key={room.id}
                          className={`px-3 py-3 cursor-pointer hover-elevate ${selectedChatRoom === room.id ? "bg-[#E8344E]/20" : ""}`}
                          onClick={() => setSelectedChatRoom(room.id)}
                          data-testid={`chat-room-${room.id}`}
                        >
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-[#E8344E]/20 flex items-center justify-center shrink-0">
                              <span className="text-xs font-bold text-[#E8344E]">{(room.userName || "?").charAt(0)}</span>
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-2">
                                <p className="text-sm font-medium truncate text-gray-700">{room.userName}</p>
                                {room.unreadCount > 0 ? (
                                  <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center shrink-0" data-testid={`badge-room-unread-${room.id}`}>
                                    {room.unreadCount > 99 ? "99+" : room.unreadCount}
                                  </span>
                                ) : (
                                  <span className="text-[11px] text-gray-400 shrink-0">
                                    {new Date(room.lastMessageAt).toLocaleDateString("ko-KR", { month: "short", day: "numeric" })}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-gray-500 truncate">@{room.userUsername}</p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </Card>
                <Card className={`${!selectedChatRoom ? "hidden sm:flex" : "flex"} flex-1 p-0 overflow-hidden flex-col bg-white border-gray-200`}>
                  {!selectedChatRoom ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center space-y-3">
                        <MessageSquare className="w-10 h-10 mx-auto text-gray-400 opacity-30" />
                        <p className="text-sm text-gray-500">채팅방을 선택해주세요</p>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="p-3 border-b border-gray-200 flex items-center gap-2">
                        <button onClick={() => setSelectedChatRoom(null)} className="sm:hidden p-1 text-gray-500" data-testid="button-chat-back">
                          <ChevronLeft className="w-5 h-5" />
                        </button>
                        <div className="w-7 h-7 rounded-full bg-[#E8344E]/20 flex items-center justify-center">
                          <span className="text-xs font-bold text-[#E8344E]">
                            {((chatRooms || []).find((r: any) => r.id === selectedChatRoom)?.userName || "?").charAt(0)}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700">
                            {(chatRooms || []).find((r: any) => r.id === selectedChatRoom)?.userName || "알 수 없음"}
                          </p>
                          <p className="text-xs text-gray-500">
                            @{(chatRooms || []).find((r: any) => r.id === selectedChatRoom)?.userUsername || ""}
                          </p>
                        </div>
                      </div>
                      <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {chatMessages.filter(m => m.roomId === selectedChatRoom).length === 0 ? (
                          <div className="flex items-center justify-center h-full">
                            <p className="text-sm text-gray-500">메시지가 없습니다</p>
                          </div>
                        ) : (
                          chatMessages.filter(m => m.roomId === selectedChatRoom).map((msg: any) => {
                            const isAdmin = msg.senderRole === "admin";
                            return (
                              <div key={msg.id} className={`flex ${isAdmin ? "justify-end" : "justify-start"}`} data-testid={`admin-chat-msg-${msg.id}`}>
                                <div className={`max-w-[75%] space-y-1 flex flex-col ${isAdmin ? "items-end" : "items-start"}`}>
                                  <span className="text-xs text-gray-400 px-1">
                                    {isAdmin ? "상담원" : ((chatRooms || []).find((r: any) => r.id === selectedChatRoom)?.userName || "회원")}
                                  </span>
                                  <div className={`rounded-md px-3 py-2 text-sm break-words ${isAdmin ? "bg-[#E8344E] text-white" : "bg-gray-200 text-gray-700"}`}>
                                    {msg.message}
                                  </div>
                                  <span className="text-[11px] text-gray-400 px-1">
                                    {new Date(msg.createdAt).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })}
                                  </span>
                                </div>
                              </div>
                            );
                          })
                        )}
                        <div ref={chatMessagesEndRef} />
                      </div>
                      <div className="shrink-0 border-t border-gray-200 p-3">
                        <div className="flex items-center gap-2">
                          <Input
                            value={chatInput}
                            onChange={(e: any) => setChatInput(e.target.value)}
                            onKeyDown={(e: any) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleChatSend(); } }}
                            placeholder="답변을 입력하세요..."
                            className="bg-white border-gray-200 text-gray-900 placeholder:text-gray-400"
                            data-testid="input-admin-chat"
                          />
                          <Button
                            size="icon"
                            onClick={handleChatSend}
                            disabled={!chatInput.trim()}
                            className="bg-[#E8344E] border-[#E8344E]"
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
