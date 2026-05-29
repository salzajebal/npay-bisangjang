import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { LogOut, Users, ChevronLeft, TrendingUp, Package, ArrowDownCircle, ArrowUpCircle, Search } from "lucide-react";

type Distributor = { id: string; username: string; name: string; managerCode: string };
type Member = { id: string; username: string; fullName: string; phone: string; bank: string; accountNumber: string; accountHolder: string; managerCode: string | null; createdAt: string; isFrozen: boolean };
type Transaction = { id: string; type: string; category: string; stockName: string; quantity: number; pricePerShare: number; memo: string | null; createdAt: string };

function calcHoldings(txs: Transaction[]) {
  const map: Record<string, { qty: number; totalCost: number }> = {};
  for (const tx of txs) {
    if (!map[tx.stockName]) map[tx.stockName] = { qty: 0, totalCost: 0 };
    const isIn = tx.type === "in" || tx.type === "입고";
    const isOut = tx.type === "out" || tx.type === "출고";
    if (isIn) {
      map[tx.stockName].qty += tx.quantity;
      map[tx.stockName].totalCost += tx.quantity * tx.pricePerShare;
    } else if (isOut) {
      const avg = map[tx.stockName].qty > 0 ? map[tx.stockName].totalCost / map[tx.stockName].qty : 0;
      map[tx.stockName].qty -= tx.quantity;
      if (map[tx.stockName].qty <= 0) { map[tx.stockName].qty = 0; map[tx.stockName].totalCost = 0; }
      else { map[tx.stockName].totalCost = map[tx.stockName].qty * avg; }
    }
  }
  return Object.entries(map).filter(([, v]) => v.qty > 0).map(([name, v]) => ({
    name,
    qty: v.qty,
    avgPrice: Math.round(v.totalCost / v.qty),
    totalCost: Math.round(v.totalCost),
  }));
}

function LoginForm({ onSuccess }: { onSuccess: () => void }) {
  const { toast } = useToast();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const loginMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/distributor/login", { username, password }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/distributor/me"] }); onSuccess(); },
    onError: (e: any) => toast({ title: "로그인 실패", description: e.message, variant: "destructive" }),
  });

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <Card className="w-full max-w-sm p-8 shadow-lg">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-[#E8344E] rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-xl font-bold text-[#222]">총판 로그인</h1>
          <p className="text-sm text-gray-500 mt-1">증권플러스 비상장 총판 전용</p>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">아이디</label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="총판 아이디"
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#E8344E]/30 focus:border-[#E8344E]"
              data-testid="input-distributor-username"
              onKeyDown={e => e.key === "Enter" && loginMutation.mutate()}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">비밀번호</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="비밀번호"
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#E8344E]/30 focus:border-[#E8344E]"
              data-testid="input-distributor-password"
              onKeyDown={e => e.key === "Enter" && loginMutation.mutate()}
            />
          </div>
          <Button
            className="w-full bg-[#E8344E] hover:bg-[#c9293f] text-white"
            onClick={() => loginMutation.mutate()}
            disabled={loginMutation.isPending}
            data-testid="button-distributor-login"
          >
            {loginMutation.isPending ? "로그인 중..." : "로그인"}
          </Button>
        </div>
      </Card>
    </div>
  );
}

function MemberDetail({ member, onBack }: { member: Member; onBack: () => void }) {
  const { data: txs = [], isLoading } = useQuery<Transaction[]>({
    queryKey: ["/api/distributor/members", member.id, "transactions"],
    queryFn: async () => {
      const res = await fetch(`/api/distributor/members/${member.id}/transactions`, { credentials: "include" });
      if (!res.ok) throw new Error("거래내역 조회 실패");
      return res.json();
    },
  });

  const holdings = calcHoldings(txs);
  const totalEval = holdings.reduce((s, h) => s + h.totalCost, 0);
  const totalQty = holdings.reduce((s, h) => s + h.qty, 0);
  const totalIn = txs.filter(t => t.type === "in" || t.type === "입고").reduce((s, t) => s + t.quantity, 0);
  const totalOut = txs.filter(t => t.type === "out" || t.type === "출고").reduce((s, t) => s + t.quantity, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="p-1.5 rounded-md hover:bg-gray-100 transition-colors" data-testid="button-back-member-list">
          <ChevronLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div>
          <h2 className="text-lg font-bold text-[#222]">{member.fullName}</h2>
          <p className="text-sm text-gray-500">ID: {member.username} · {member.phone}</p>
        </div>
        {member.isFrozen && <Badge variant="destructive" className="ml-auto text-xs">동결</Badge>}
      </div>

      {/* 요약 카드 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "보유종목수", value: `${holdings.length}종목`, icon: Package, color: "text-blue-600" },
          { label: "총 보유수량", value: `${totalQty.toLocaleString()}주`, icon: TrendingUp, color: "text-green-600" },
          { label: "총 입고", value: `${totalIn.toLocaleString()}주`, icon: ArrowDownCircle, color: "text-[#E8344E]" },
          { label: "총 출고", value: `${totalOut.toLocaleString()}주`, icon: ArrowUpCircle, color: "text-gray-500" },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label} className="p-4">
            <div className={`${color} mb-1`}><Icon className="w-4 h-4" /></div>
            <p className="text-xs text-gray-500">{label}</p>
            <p className="text-base font-bold text-[#222] tabular-nums">{value}</p>
          </Card>
        ))}
      </div>

      {/* 보유 종목 */}
      <Card className="p-4">
        <h3 className="font-semibold text-[#222] mb-3">보유 주식</h3>
        {isLoading ? (
          <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>
        ) : holdings.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">보유 주식이 없습니다</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-xs text-gray-500">
                  <th className="text-left pb-2">종목명</th>
                  <th className="text-right pb-2">수량</th>
                  <th className="text-right pb-2">평균단가</th>
                  <th className="text-right pb-2">평가금액</th>
                </tr>
              </thead>
              <tbody>
                {holdings.map(h => (
                  <tr key={h.name} className="border-b last:border-0">
                    <td className="py-2.5 font-medium text-[#222]">{h.name}</td>
                    <td className="py-2.5 text-right tabular-nums">{h.qty.toLocaleString()}주</td>
                    <td className="py-2.5 text-right tabular-nums text-gray-600">{h.avgPrice.toLocaleString()}원</td>
                    <td className="py-2.5 text-right tabular-nums font-medium">{h.totalCost.toLocaleString()}원</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="font-bold text-[#222]">
                  <td className="pt-2.5 text-xs text-gray-500">합계</td>
                  <td className="pt-2.5 text-right tabular-nums">{totalQty.toLocaleString()}주</td>
                  <td></td>
                  <td className="pt-2.5 text-right tabular-nums text-[#E8344E]">{totalEval.toLocaleString()}원</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </Card>

      {/* 거래 내역 */}
      <Card className="p-4">
        <h3 className="font-semibold text-[#222] mb-3">거래 내역 ({txs.length}건)</h3>
        {isLoading ? (
          <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-10 w-full" />)}</div>
        ) : txs.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">거래 내역이 없습니다</p>
        ) : (
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {[...txs].reverse().map(tx => {
              const isIn = tx.type === "in" || tx.type === "입고";
              return (
                <div key={tx.id} className="flex items-center justify-between py-2 border-b last:border-0 gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`text-xs px-1.5 py-0.5 rounded font-medium shrink-0 ${isIn ? "bg-red-50 text-red-600" : "bg-blue-50 text-blue-600"}`}>
                      {isIn ? "입고" : "출고"}
                    </span>
                    <span className="text-sm font-medium text-[#222] truncate">{tx.stockName}</span>
                    <span className="text-xs text-gray-400 shrink-0">{tx.category}</span>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-mono tabular-nums font-medium">{tx.quantity.toLocaleString()}주</p>
                    <p className="text-xs text-gray-400">{new Date(tx.createdAt).toLocaleDateString("ko-KR")}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}

function Dashboard({ distributor }: { distributor: Distributor }) {
  const { toast } = useToast();
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [search, setSearch] = useState("");

  const { data: members = [], isLoading } = useQuery<Member[]>({
    queryKey: ["/api/distributor/members"],
  });

  const logoutMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/distributor/logout", {}),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/distributor/me"] }); },
    onError: () => toast({ title: "로그아웃 실패", variant: "destructive" }),
  });

  const filtered = members.filter(m =>
    m.fullName.includes(search) || m.username.includes(search) || (m.phone || "").includes(search)
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-[#E8344E] rounded-full flex items-center justify-center">
              <Users className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="font-bold text-sm text-[#222]">{distributor.name}</span>
              <span className="ml-2 text-xs text-gray-400">코드: {distributor.managerCode}</span>
            </div>
          </div>
          <Button
            size="sm"
            variant="ghost"
            className="text-gray-500 text-xs gap-1"
            onClick={() => logoutMutation.mutate()}
            disabled={logoutMutation.isPending}
            data-testid="button-distributor-logout"
          >
            <LogOut className="w-4 h-4" />
            로그아웃
          </Button>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-5 space-y-4">
        {selectedMember ? (
          <MemberDetail member={selectedMember} onBack={() => setSelectedMember(null)} />
        ) : (
          <>
            {/* 요약 */}
            <Card className="p-4 bg-[#E8344E] text-white">
              <p className="text-sm opacity-80">담당 회원 수</p>
              <p className="text-3xl font-bold tabular-nums mt-1">{members.length}명</p>
              <p className="text-xs opacity-70 mt-1">코드: {distributor.managerCode}</p>
            </Card>

            {/* 검색 */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="이름, 아이디, 전화번호 검색"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#E8344E]/30 focus:border-[#E8344E]"
                data-testid="input-member-search"
              />
            </div>

            {/* 회원 목록 */}
            <Card className="divide-y overflow-hidden">
              {isLoading ? (
                <div className="p-4 space-y-3">
                  {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-14 w-full" />)}
                </div>
              ) : filtered.length === 0 ? (
                <div className="p-12 text-center">
                  <Users className="w-10 h-10 mx-auto mb-3 opacity-20 text-gray-400" />
                  <p className="text-sm text-gray-400">{search ? "검색 결과가 없습니다" : "담당 회원이 없습니다"}</p>
                </div>
              ) : (
                filtered.map(member => (
                  <button
                    key={member.id}
                    onClick={() => setSelectedMember(member)}
                    className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-gray-50 transition-colors text-left"
                    data-testid={`button-member-${member.id}`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-[#222] text-sm">{member.fullName}</span>
                        {member.isFrozen && <Badge variant="destructive" className="text-[10px] py-0 px-1">동결</Badge>}
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">ID: {member.username} · {member.phone || "-"}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">{member.bank}</p>
                      <p className="text-xs text-gray-400">{new Date(member.createdAt).toLocaleDateString("ko-KR")} 가입</p>
                    </div>
                  </button>
                ))
              )}
            </Card>
          </>
        )}
      </div>
    </div>
  );
}

export default function DistributorPage() {
  const { data: distributor, isLoading } = useQuery<Distributor>({
    queryKey: ["/api/distributor/me"],
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center text-gray-400 text-sm">로딩 중...</div>
      </div>
    );
  }

  if (!distributor) {
    return <LoginForm onSuccess={() => queryClient.invalidateQueries({ queryKey: ["/api/distributor/me"] })} />;
  }

  return <Dashboard distributor={distributor} />;
}
