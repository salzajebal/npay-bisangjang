import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ArrowLeft, Send, Clock, CheckCircle2, XCircle, PauseCircle, ArrowRightLeft } from "lucide-react";
import { SiteLogoBadge } from "@/components/samsung-logo";
import type { TransferRequest } from "@shared/schema";

function TransferStatusBadge({ status }: { status: string }) {
  switch (status) {
    case "pending":
      return <Badge variant="outline" className="gap-1" data-testid="badge-status-pending"><Clock className="w-3 h-3" />대기중</Badge>;
    case "approved":
      return <Badge variant="default" className="gap-1 bg-green-600 border-green-600" data-testid="badge-status-approved"><CheckCircle2 className="w-3 h-3" />승인</Badge>;
    case "rejected":
      return <Badge variant="destructive" className="gap-1" data-testid="badge-status-rejected"><XCircle className="w-3 h-3" />거부</Badge>;
    case "held":
      return <Badge variant="secondary" className="gap-1" data-testid="badge-status-held"><PauseCircle className="w-3 h-3" />보류</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [transferName, setTransferName] = useState("");
  const [transferAccount, setTransferAccount] = useState("");
  const [transferQuantity, setTransferQuantity] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const { data: authData } = useQuery<{ user: any }>({
    queryKey: ["/api/auth/me"],
    retry: false,
  });

  const currentUser = authData?.user;

  const { data: myTransfers = [] } = useQuery<TransferRequest[]>({
    queryKey: ["/api/transfer-requests/my"],
    enabled: !!currentUser,
  });

  const wsRef = useRef<WebSocket | null>(null);
  useEffect(() => {
    if (!currentUser) return;
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const ws = new WebSocket(`${protocol}//${window.location.host}/ws`);
    wsRef.current = ws;
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "transfer_update") {
          queryClient.invalidateQueries({ queryKey: ["/api/transfer-requests/my"] });
          if (data.data?.action === "status_change" && data.data?.statusLabel) {
            toast({
              title: "대체출고 상태 변경",
              description: `신청이 "${data.data.statusLabel}" 처리되었습니다`,
            });
          }
        }
        if (data.type === "transaction_update") {
          queryClient.invalidateQueries({ queryKey: ["/api/transactions/my"] });
        }
      } catch {}
    };
    return () => { ws.close(); wsRef.current = null; };
  }, [currentUser?.id]);

  const loginMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/auth/login", { username, password });
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      if (data.user.isAdmin) {
        setLocation("/admin");
      } else {
        setLocation("/trade");
      }
    },
    onError: (error: Error) => {
      let description = "오류가 발생했습니다";
      if (error.message.includes("401")) {
        description = "아이디 또는 비밀번호가 일치하지 않습니다";
      } else if (error.message.includes("403")) {
        description = "계정이 동결되었습니다. 관리자에게 문의하세요.";
      }
      toast({
        title: "로그인 실패",
        description,
        variant: "destructive",
      });
    },
  });

  const transferMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/transfer-requests", {
        userId: currentUser.id,
        accountName: transferName,
        accountNumber: transferAccount,
        quantity: parseInt(transferQuantity),
        stockName: "비상장주식",
      });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "출고 신청 완료", description: "타사 대체출고가 신청되었습니다. 관리자 승인을 기다려주세요." });
      setTransferName("");
      setTransferAccount("");
      setTransferQuantity("");
      queryClient.invalidateQueries({ queryKey: ["/api/transfer-requests/my"] });
      queryClient.invalidateQueries({ queryKey: ["/api/transactions/my"] });
    },
    onError: (error: Error) => {
      let msg = "출고 신청에 실패했습니다";
      try {
        const parsed = JSON.parse(error.message.replace(/^[0-9]+:\s*/, ""));
        if (parsed.message) msg = parsed.message;
      } catch {
        if (error.message.includes("400")) msg = "보유 수량을 초과하거나 입력이 올바르지 않습니다";
      }
      toast({ title: "출고 신청 실패", description: msg, variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate();
  };

  const handleTransferSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferName || !transferAccount || !transferQuantity || parseInt(transferQuantity) <= 0) {
      toast({ title: "입력 오류", description: "모든 항목을 올바르게 입력해주세요", variant: "destructive" });
      return;
    }
    transferMutation.mutate();
  };

  const showTransferPanel = isLoggedIn || !!currentUser;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className={`w-full ${showTransferPanel ? "max-w-4xl" : "max-w-md"}`}>
        <div className="text-center mb-8">
          <Link href="/">
            <Button variant="ghost" size="sm" className="mb-4" data-testid="link-back-home">
              <ArrowLeft className="w-4 h-4 mr-1" /> 홈으로
            </Button>
          </Link>
          <div className="flex items-center justify-center gap-2.5 mb-4">
            <SiteLogoBadge size={36} />
            <span className="font-bold text-lg">증권플러스 비상장</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">{showTransferPanel ? "증권플러스 비상장" : "로그인"}</h1>
          <p className="text-sm text-muted-foreground mt-1">비상장 주식 관리 시스템</p>
        </div>

        <div className={`${showTransferPanel ? "grid grid-cols-1 md:grid-cols-2 gap-6" : ""}`}>
          {!showTransferPanel && (
            <Card className="p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username">아이디</Label>
                  <Input
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="아이디를 입력하세요"
                    required
                    data-testid="input-username"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">비밀번호</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="비밀번호를 입력하세요"
                    required
                    data-testid="input-password"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={loginMutation.isPending}
                  data-testid="button-login"
                >
                  {loginMutation.isPending ? "로그인 중..." : "로그인"}
                </Button>
              </form>
              <div className="mt-4 text-center text-sm text-muted-foreground">
                계정이 없으신가요?{" "}
                <Link href="/register" className="text-primary font-medium" data-testid="link-register">
                  회원가입
                </Link>
              </div>
            </Card>
          )}

          {showTransferPanel && (
            <>
              <Card className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <ArrowRightLeft className="w-5 h-5 text-[#E8344E]" />
                  <h2 className="text-lg font-semibold">타사 대체출고 신청</h2>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  현재 보유 중인 비상장 주식을 타 증권사로 출고할 수 있습니다.
                  출고 신청 시 현재 포지션이 종료되며, 관리자 승인 후 처리됩니다.
                </p>
                <form onSubmit={handleTransferSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="transfer-name">예금주명</Label>
                    <Input
                      id="transfer-name"
                      value={transferName}
                      onChange={(e) => setTransferName(e.target.value)}
                      placeholder="출고 받을 계좌 예금주명"
                      required
                      data-testid="input-transfer-name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="transfer-account">계좌번호</Label>
                    <Input
                      id="transfer-account"
                      value={transferAccount}
                      onChange={(e) => setTransferAccount(e.target.value)}
                      placeholder="출고 받을 증권사 계좌번호"
                      required
                      data-testid="input-transfer-account"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="transfer-quantity">출고 수량 (주)</Label>
                    <Input
                      id="transfer-quantity"
                      type="number"
                      min="1"
                      value={transferQuantity}
                      onChange={(e) => setTransferQuantity(e.target.value)}
                      placeholder="출고할 주식 수량"
                      required
                      data-testid="input-transfer-quantity"
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-[#E8344E] border-[#E8344E]"
                    disabled={transferMutation.isPending}
                    data-testid="button-submit-transfer"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    {transferMutation.isPending ? "신청 중..." : "출고 신청"}
                  </Button>
                </form>
                <div className="mt-4 flex flex-wrap gap-2 items-center">
                  <Link href="/dashboard">
                    <Button variant="outline" size="sm" data-testid="link-dashboard">
                      대시보드로 이동
                    </Button>
                  </Link>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Clock className="w-5 h-5 text-[#E8344E]" />
                  <h2 className="text-lg font-semibold">대체출고 신청 목록</h2>
                </div>
                {myTransfers.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    출고 신청 내역이 없습니다
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[400px] overflow-y-auto">
                    {myTransfers.map((tr) => (
                      <div
                        key={tr.id}
                        className="border rounded-md p-3 space-y-1"
                        data-testid={`transfer-item-${tr.id}`}
                      >
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <span className="font-medium text-sm">{tr.stockName} {tr.quantity}주</span>
                          <TransferStatusBadge status={tr.status} />
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {tr.accountName} | {tr.accountNumber}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(tr.createdAt).toLocaleString("ko-KR")}
                        </div>
                        {tr.adminMemo && (
                          <div className="text-xs text-muted-foreground mt-1 bg-muted/50 rounded p-1.5">
                            관리자 메모: {tr.adminMemo}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
