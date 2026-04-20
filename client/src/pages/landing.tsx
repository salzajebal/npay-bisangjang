import { useEffect, useState, useRef, type ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Search,
  ChevronRight,
  ChevronLeft,
  MessageCircle,
  BookOpen,
  HelpCircle,
  Award,
  LogIn,
  LogOut,
  User,
  Menu,
  X,
  ExternalLink,
  Star,
  Bell,
  Plus,
  BarChart3,
  CalendarDays,
  FileText,
  Coins,
  TrendingUp,
} from "lucide-react";
import { getQueryFn, apiRequest, queryClient } from "@/lib/queryClient";
import { StockIcon } from "@/components/stock-icon";
import { SiteLogoBadge } from "@/components/site-logo";
import { fetchStockPrices } from "@/lib/market-prices";
import type { User as UserType, StockTransaction, Watchlist } from "@shared/schema";

type StockRow = {
  name: string;
  category: "일반" | "전문";
  isIPO: boolean;
  price: number | null;
  change: number | null;
  orders: number | null;
  marketCapStr?: string;
  ipoDate?: string;
  reviewType?: string;
  fiscalYear?: string;
  revenueGrowthStr?: string;
};

const s = (name: string, cat: "일반"|"전문", ipo: boolean, price: number|null, change: number|null, orders: number|null): StockRow =>
  ({ name, category: cat, isIPO: ipo, price, change, orders });

const RANK_일반종목: StockRow[] = [
  s("두나무", "일반", false, 298000, -0.67, 128),
  s("무신사", "일반", true,  23700,  0,    82),
  s("제이비케이랩", "일반", false, 6400, 0,  48),
  s("야놀자", "일반", false, 22300, -10.8, 65),
  s("에너진", "일반", false,  3080,  1.32, 29),
  s("넷마블에프앤씨", "일반", false, 7750, -1.27, 9),
  s("오아시스", "일반", false, 7200,  0,   38),
  s("빗썸", "일반", false, 197000, 1.03, 38),
  s("컬리", "일반", false, 18200, -0.55, 23),
  s("케이솔루션", "일반", true, 14400, 2.13, 16),
];

const RANK_거래많은: StockRow[] = [
  s("두나무", "일반", false, 298000, -0.67, 128),
  s("무신사", "일반", true,  23700,  0,    82),
  s("제이비케이랩", "일반", false, 6400,  0,  48),
  s("비바리퍼블리카", "전문", false, null, null, null),
  s("에이치디현대삼호", "전문", false, null, null, null),
  s("스트라드비전", "전문", true,  null, null, null),
  s("아스트로젠", "전문", false, null, null, null),
  s("케이피항공산업", "전문", true,  null, null, null),
  s("덕산넵코어스", "전문", true,  null, null, null),
  s("한국증권금융", "전문", false, null, null, null),
];

const RANK_상승률높은: StockRow[] = [
  s("레메디", "전문", true,  null, null, null),
  s("레몬헬스케어", "전문", true,  null, null, null),
  s("노바셀테크놀로지", "전문", false, null, null, null),
  s("아스트로젠", "전문", false, null, null, null),
  s("마키나락스", "전문", true,  null, null, null),
  s("케이피항공산업", "전문", true,  null, null, null),
  s("현대엔지니어링", "전문", false, null, null, null),
  s("리딩투자증권", "전문", false, null, null, null),
  s("스트라드비전", "전문", true,  null, null, null),
  s("재영텍", "전문", false, null, null, null),
];

const RANK_상장준비: StockRow[] = [
  { ...s("와이즈플래닛컴퍼니", "전문", true,  null, null, null), ipoDate: "26.04.15", reviewType: "심사청구" },
  { ...s("크리에이츠", "전문", true,  null, null, null),          ipoDate: "26.04.07", reviewType: "심사청구" },
  { ...s("인텔리빅스", "전문", true,  null, null, null),          ipoDate: "26.03.24", reviewType: "심사청구" },
  { ...s("케이솔루션", "일반", true,  null, null, null),          ipoDate: "26.02.12", reviewType: "심사청구" },
  { ...s("스카이랩스", "전문", true,  null, null, null),          ipoDate: "26.01.30", reviewType: "심사청구" },
  { ...s("레메디", "전문", true,  null, null, null),              ipoDate: "26.01.30", reviewType: "심사청구" },
  { ...s("파워큐브세미", "전문", true, null, null, null),         ipoDate: "26.01.16", reviewType: "심사청구" },
  { ...s("넥스트젠바이오사이언스", "전문", true, null, null, null), ipoDate: "25.12.23", reviewType: "심사청구" },
  { ...s("빅웨이브로보틱스", "전문", true, null, null, null),     ipoDate: "25.12.16", reviewType: "심사청구" },
  { ...s("메타넷엑스", "전문", true,  null, null, null),          ipoDate: "25.12.09", reviewType: "심사청구" },
];

const RANK_예상시총: StockRow[] = [
  { ...s("비바리퍼블리카", "전문", false, null, null, null),      marketCapStr: "미제공" },
  { ...s("두나무", "일반", false, 298000, -0.67, 128),            marketCapStr: "10조 3,924억" },
  { ...s("에이치디현대삼호", "전문", false, null, null, null),    marketCapStr: "미제공" },
  { ...s("현대오일뱅크", "전문", false, null, null, null),        marketCapStr: "미제공" },
  { ...s("무신사", "일반", true, 23700, 0, 82),                   marketCapStr: "4조 8,262억" },
  { ...s("교보생명보험", "전문", false, null, null, null),        marketCapStr: "미제공" },
  { ...s("현대엔지니어링", "전문", false, null, null, null),      marketCapStr: "미제공" },
  { ...s("카카오모빌리티", "전문", false, null, null, null),      marketCapStr: "미제공" },
  { ...s("한국증권금융", "전문", false, null, null, null),        marketCapStr: "미제공" },
  { ...s("야놀자", "일반", false, 22300, -10.8, 65),              marketCapStr: "2조 2,637억" },
];

const RANK_매출상승: StockRow[] = [
  { ...s("에코크레이션", "전문", false, null, null, null),        fiscalYear: "2024년", revenueGrowthStr: "+4,596.8%" },
  { ...s("에이엠에스티", "전문", false, null, null, null),        fiscalYear: "2025년", revenueGrowthStr: "+109.9%" },
  { ...s("뱅크샐러드", "전문", false, null, null, null),          fiscalYear: "2025년", revenueGrowthStr: "+76.54%" },
  { ...s("리딩투자증권", "전문", false, null, null, null),        fiscalYear: "2025년", revenueGrowthStr: "+56.42%" },
  { ...s("케이솔루션", "일반", true,  null, null, null),          fiscalYear: "2025년", revenueGrowthStr: "+51.26%" },
  { ...s("칸에스티엔", "전문", false, null, null, null),          fiscalYear: "2024년", revenueGrowthStr: "+45.71%" },
  { ...s("인투코어테크놀로지", "전문", false, null, null, null),  fiscalYear: "2024년", revenueGrowthStr: "+43.8%" },
  { ...s("에스엘엘중앙", "전문", false, null, null, null),        fiscalYear: "2025년", revenueGrowthStr: "+42.96%" },
  { ...s("이피캠텍", "전문", false, null, null, null),            fiscalYear: "2025년", revenueGrowthStr: "+42.45%" },
  { ...s("비바리퍼블리카", "전문", false, null, null, null),      fiscalYear: "2025년", revenueGrowthStr: "+37.98%" },
];

const ALL_TAB_DATA: Record<string, StockRow[]> = {
  "일반종목": RANK_일반종목,
  "거래많은": RANK_거래많은,
  "상승률 높은": RANK_상승률높은,
  "상장준비 시작": RANK_상장준비,
  "예상시총 높은": RANK_예상시총,
  "매출이 상승한": RANK_매출상승,
};

const BANNER_SLIDES = [
  {
    accent: "#E8344E",
    tagBg: "#fff0f2",
    tag: "NEW",
    title: "증권플러스 비상장",
    subtitle: "Npay 비상장으로!",
    icon: (
      <div className="flex flex-col gap-1.5 items-center">
        <div className="bg-gray-100 rounded-xl px-2.5 py-1.5 flex items-center gap-1.5">
          <SiteLogoBadge size={16} />
          <span className="text-[11px] font-bold text-gray-800 leading-none whitespace-nowrap">비상장</span>
        </div>
        <div className="text-gray-400 text-sm leading-none">↓</div>
        <div className="bg-gray-100 rounded-xl px-2.5 py-1.5 flex items-center gap-1.5">
          <span className="text-[11px] font-black px-1.5 py-0.5 rounded-md text-white whitespace-nowrap" style={{ background: "#03C75A" }}>N</span>
          <span className="text-[11px] font-bold text-gray-800 leading-none whitespace-nowrap">Pay 비상장</span>
        </div>
      </div>
    ),
  },
  {
    accent: "#1976D2",
    tagBg: "#e8f0fc",
    tag: "IPO",
    title: "공모주 청약 일정",
    subtitle: "놓치지 마세요!",
    icon: <div className="p-3 rounded-xl" style={{ background: "#e8f0fc" }}><CalendarDays className="w-8 h-8" style={{ color: "#1976D2" }} /></div>,
  },
  {
    accent: "#43A047",
    tagBg: "#e8f5e9",
    tag: "이벤트",
    title: "주식모으기 수수료",
    subtitle: "무료 이벤트 진행 중",
    icon: <div className="p-3 rounded-xl" style={{ background: "#e8f5e9" }}><Coins className="w-8 h-8" style={{ color: "#43A047" }} /></div>,
  },
  {
    accent: "#7B1FA2",
    tagBg: "#f3e5f5",
    tag: "리포트",
    title: "전문가 리포트",
    subtitle: "비상장 투자 가이드",
    icon: <div className="p-3 rounded-xl" style={{ background: "#f3e5f5" }}><FileText className="w-8 h-8" style={{ color: "#7B1FA2" }} /></div>,
  },
];

const QUICK_CATEGORIES = [
  { label: "일반종목", icon: BarChart3, href: "#rankings" },
  { label: "공모주", icon: TrendingUp, href: "#rankings" },
  { label: "전문가리포트", icon: FileText, href: "#reports" },
  { label: "IPO캘린더", icon: CalendarDays, href: "/ipo-calendar" },
  { label: "테마", icon: Coins, href: "#themes" },
];

const RANKING_TABS = ["일반종목", "거래많은", "상승률 높은", "상장준비 시작", "예상시총 높은", "매출이 상승한"];

const EXPERT_REPORTS = [
  { title: "[앤스로픽] 3,500억 달러 기업 가치, AI 시장의 새로운 리더", author: "증권플러스 이영진", date: "2026.02.06", color: "#6B4CE6" },
  { title: "[반도체·로봇] Korea Startup Scaleup Day", author: "증권플러스 이종욱", date: "2026.01.12", color: "#1976D2" },
  { title: "[KT클라우드] 국내 대표 AI 인프라 기업", author: "증권플러스 최민하", date: "2025.12.12", color: "#E8344E" },
  { title: "[에임드바이오] 스크리닝 기술로 키운 ADC 파이프라인의 가치", author: "증권플러스 서근희", date: "2025.11.25", color: "#43A047" },
];

const THEME_TAGS = ["일반종목", "핀테크", "2차전지", "제약/바이오", "식품/딜리버리", "여행/숙박", "메타버스(VR·AR)", "전기차", "게임"];

const THEME_COMPANIES: Record<string, { companies: string[]; extra: number; desc: string }> = {
  "일반종목": { companies: ["두나무", "오톰", "빗썸", "야놀자"], extra: 18, desc: "일반투자자와 전문투자자 모두 거래 가능한 일반종목입니다." },
  "핀테크": { companies: ["두나무", "빗썸", "토스"], extra: 12, desc: "금융과 기술의 융합, 핀테크 관련 비상장 종목입니다." },
  "2차전지": { companies: ["에너진", "케이솔루션"], extra: 8, desc: "2차전지 및 배터리 관련 비상장 종목입니다." },
  "제약/바이오": { companies: ["에임드바이오", "에스엠랩"], extra: 15, desc: "제약 및 바이오 관련 비상장 종목입니다." },
  "식품/딜리버리": { companies: ["컬리", "오아시스", "무신사"], extra: 7, desc: "식품 및 딜리버리 관련 비상장 종목입니다." },
  "여행/숙박": { companies: ["야놀자"], extra: 5, desc: "여행 및 숙박 관련 비상장 종목입니다." },
  "메타버스(VR·AR)": { companies: ["이브이알스튜디오"], extra: 6, desc: "메타버스, VR·AR 관련 비상장 종목입니다." },
  "전기차": { companies: ["에너진"], extra: 4, desc: "전기차 관련 비상장 종목입니다." },
  "게임": { companies: ["크래프톤", "넥슨게임즈"], extra: 9, desc: "게임 관련 비상장 종목입니다." },
};

const DISCUSSIONS = [
  { id: 1, user: "투자마스터", userType: "주주", avatar: "#E8344E", time: "10분 전", content: "카나프테라퓨틱스 공모 청약 시작했는데, 경쟁률이 어떻게 될지 기대됩니다.", tag: "카나프테라퓨틱스" },
  { id: 2, user: "비상장전문가", userType: "일반", avatar: "#1976D2", time: "32분 전", content: "두나무 실적 발표 이후 거래량이 확 늘었네요. 암호화폐 시장 회복과 함께 긍정적인 흐름입니다.", tag: "두나무" },
  { id: 3, user: "장기투자자", userType: "주주", avatar: "#43A047", time: "1시간 전", content: "무신사 상장 준비 소식 들으셨나요? 패션 플랫폼 중에서는 독보적인 위치라 기대됩니다.", tag: "무신사" },
  { id: 4, user: "IPO분석가", userType: "일반", avatar: "#E65100", time: "2시간 전", content: "빗썸 거래량이 지속적으로 증가하고 있어요. 코인 시장 상승과 맞물려서 좋은 흐름입니다.", tag: "빗썸" },
  { id: 5, user: "에스엠랩팬", userType: "주주", avatar: "#9C27B0", time: "3시간 전", content: "에스엠랩 최근 실적 발표가 기대 이상이었네요. 비상장 중에서 주목해야 할 종목입니다.", tag: "에스엠랩" },
  { id: 6, user: "코람데오", userType: "일반", avatar: "#00695C", time: "4시간 전", content: "금요일 장 마감 후 에스엠랩 주가 흐름이 굉장히 좋았습니다. 다음 주도 기대해봅니다.", tag: "에스엠랩" },
];


const HOT_ROOMS = [
  { name: "카나프테라퓨틱스", tags: ["#IPO", "#바이오"], count: 1284 },
  { name: "빗썸", tags: ["#암호화폐", "#거래소"], count: 956 },
  { name: "오톰", tags: ["#AI", "#로봇"], count: 743 },
  { name: "현대엔지니어링", tags: ["#건설", "#플랜트"], count: 621 },
  { name: "이브이알스튜디오", tags: ["#VR", "#메타버스"], count: 512 },
];

const NAV_LINKS = [
  { label: "종목랭킹", href: "#rankings" },
  { label: "뉴스", href: "#news" },
  { label: "전문가리포트", href: "#reports" },
  { label: "테마", href: "#themes" },
  { label: "토론", href: "#discussions" },
  { label: "공모주 IPO 캘린더", href: "/ipo-calendar" },
];

function getTabStocks(tab: string): StockRow[] {
  return ALL_TAB_DATA[tab] ?? RANK_일반종목;
}

function useWatchlist(user: UserType | null) {
  const [localWatchlist, setLocalWatchlist] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem("wl") || "[]"); } catch { return []; }
  });

  const { data: serverWatchlist, refetch } = useQuery<Watchlist[]>({
    queryKey: ["/api/watchlist"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: !!user,
  });

  const addMutation = useMutation({
    mutationFn: (stockName: string) => apiRequest("POST", "/api/watchlist", { stockName }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/watchlist"] }); },
  });

  const removeMutation = useMutation({
    mutationFn: (stockName: string) => apiRequest("DELETE", `/api/watchlist/${encodeURIComponent(stockName)}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/watchlist"] }); },
  });

  const watchlistNames: string[] = user
    ? (serverWatchlist || []).map((w) => w.stockName)
    : localWatchlist;

  const toggleWatchlist = (stockName: string) => {
    if (user) {
      if (watchlistNames.includes(stockName)) {
        removeMutation.mutate(stockName);
      } else {
        addMutation.mutate(stockName);
      }
    } else {
      const next = localWatchlist.includes(stockName)
        ? localWatchlist.filter((n) => n !== stockName)
        : [...localWatchlist, stockName];
      setLocalWatchlist(next);
      localStorage.setItem("wl", JSON.stringify(next));
    }
  };

  return { watchlistNames, toggleWatchlist };
}

function BannerCarousel() {
  const [current, setCurrent] = useState(0);
  const total = BANNER_SLIDES.length;

  useEffect(() => {
    const t = setInterval(() => setCurrent((c) => (c + 1) % total), 3500);
    return () => clearInterval(t);
  }, [total]);

  const slide = BANNER_SLIDES[current];

  return (
    <div className="mb-4">
      <div
        className="relative rounded-2xl overflow-hidden h-28 flex items-center px-5 cursor-pointer select-none bg-white border border-[#eee] shadow-sm"
        onClick={() => setCurrent((c) => (c + 1) % total)}
        data-testid="banner-carousel"
      >
        <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl" style={{ background: slide.accent }} />
        <div className="flex-1 pl-2">
          <span className="inline-block text-xs font-bold rounded-full px-2 py-0.5 mb-1" style={{ background: slide.tagBg, color: slide.accent }}>
            {slide.tag}
          </span>
          <div className="text-[#222] font-bold text-base leading-tight">{slide.title}</div>
          <div className="text-[#888] text-sm">{slide.subtitle}</div>
        </div>
        <div className="ml-4 shrink-0">{slide.icon}</div>
        <div className="absolute bottom-3 right-4 flex gap-1">
          {BANNER_SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={(e) => { e.stopPropagation(); setCurrent(i); }}
              className={`h-1.5 rounded-full transition-all ${i === current ? "w-4" : "w-1.5 bg-gray-300"}`}
              style={i === current ? { background: slide.accent } : {}}
              data-testid={`banner-dot-${i}`}
            />
          ))}
        </div>
        <div className="absolute top-3 right-4 text-[#bbb] text-xs">{current + 1}/{total}</div>
      </div>

    </div>
  );
}

function WatchlistSection({
  user,
  watchlistNames,
  onToggleWatchlist,
}: {
  user: UserType | null;
  watchlistNames: string[];
  onToggleWatchlist: (name: string) => void;
}) {
  const [, setLocation] = useLocation();
  const allTabStocks = Object.values(ALL_TAB_DATA).flat();
  const seen = new Set<string>();
  const uniqueStocks = allTabStocks.filter((s) => {
    if (seen.has(s.name)) return false;
    seen.add(s.name);
    return true;
  });
  const watchedStocks = uniqueStocks.filter((s) => watchlistNames.includes(s.name));

  return (
    <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm" data-testid="watchlist-section">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
        <div className="flex items-center gap-2">
          <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
          <span className="font-bold text-sm text-gray-900">내 관심종목</span>
        </div>
        <span className="text-xs text-gray-400">{watchlistNames.length}개</span>
      </div>

      {!user && (
        <div className="px-4 py-5 text-center">
          <Star className="w-8 h-8 text-gray-200 mx-auto mb-2" />
          <p className="text-sm text-gray-500 mb-3">로그인하면<br />관심종목을 확인할 수 있습니다</p>
          <button
            onClick={() => setLocation("/login")}
            className="text-xs text-[#E8344E] font-semibold border border-[#E8344E] rounded-full px-4 py-1.5 hover:bg-[#E8344E] hover:text-white transition-colors"
            data-testid="watchlist-login-btn"
          >
            로그인하기
          </button>
        </div>
      )}

      {user && watchedStocks.length === 0 && (
        <div className="px-4 py-5 text-center">
          <Star className="w-8 h-8 text-gray-200 mx-auto mb-2" />
          <p className="text-sm text-gray-400">관심종목이 없습니다<br />종목 옆 ★를 눌러 추가하세요</p>
        </div>
      )}

      {user && watchedStocks.length > 0 && (
        <div className="divide-y divide-gray-50">
          {watchedStocks.map((s) => (
            <div key={s.name} className="flex items-center gap-3 px-4 py-2.5" data-testid={`watchlist-item-${s.name}`}>
              <StockIcon name={s.name} size={32} />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-gray-900 truncate">{s.name}</div>
                <div className="text-xs text-gray-400">{s.price !== null ? `${s.price.toLocaleString()}원` : "미제공"}</div>
              </div>
              <div className={`text-xs font-semibold ${s.change === null ? "text-gray-400" : s.change >= 0 ? "text-red-500" : "text-blue-500"}`}>
                {s.change === null ? "미제공" : `${s.change >= 0 ? "+" : ""}${s.change}%`}
              </div>
              <button
                onClick={() => onToggleWatchlist(s.name)}
                className="ml-1 text-yellow-400"
                data-testid={`watchlist-remove-${s.name}`}
              >
                <Star className="w-4 h-4 fill-yellow-400" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Header({ user }: { user: UserType | null }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await apiRequest("POST", "/api/auth/logout");
    queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
  };

  return (
    <header className="sticky top-0 z-[9999] bg-white border-b border-[#eee]" data-testid="header">
      <div className="max-w-[1200px] mx-auto px-4">
        <div className="flex items-center justify-between gap-4 h-14">
          <Link href="/" data-testid="link-home">
            <div className="flex items-center gap-1.5 shrink-0 cursor-pointer">
              <SiteLogoBadge size={28} />
              <span className="text-[#222] font-bold text-base whitespace-nowrap">증권플러스 <span className="text-[#E8344E]">비상장</span></span>
            </div>
          </Link>

          <div className="hidden md:flex flex-1 max-w-[360px] mx-4">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#999]" />
              <input
                type="text"
                placeholder="종목명·초성·코드 검색"
                className="w-full h-9 pl-9 pr-3 rounded-lg bg-[#f5f5f5] border-none text-sm text-[#222] placeholder-[#999] outline-none focus:ring-1 focus:ring-[#E8344E]"
                data-testid="input-search"
              />
            </div>
          </div>

          <nav className="hidden lg:flex items-center gap-3 shrink-0">
            {NAV_LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-[13px] text-[#666] px-1 py-1 whitespace-nowrap hover:text-[#222] transition-colors"
                data-testid={`link-nav-${link.label}`}
              >
                {link.label}
              </a>
            ))}
            <Link href="/my-stocks">
              <span className="text-[13px] text-[#E8344E] font-bold px-3 py-1.5 whitespace-nowrap border border-[#E8344E] rounded-full hover:bg-[#E8344E] hover:text-white transition-colors cursor-pointer" data-testid="link-nav-my-stocks">
                공모주 마이페이지
              </span>
            </Link>
          </nav>

          <div className="hidden md:flex items-center gap-2 shrink-0">
            {user ? (
              <>
                <Link href="/dashboard">
                  <span className="flex items-center gap-1 text-sm text-[#666] hover:text-[#222] cursor-pointer" data-testid="link-dashboard">
                    <User className="w-4 h-4" />
                    {user.fullName}
                  </span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1 text-sm text-[#666] hover:text-[#E8344E] transition-colors"
                  data-testid="button-logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            ) : (
              <>
                <Link href="/login">
                  <span className="flex items-center gap-1 text-sm text-white bg-[#E8344E] px-3 py-1.5 rounded-md hover:bg-[#d42e45] transition-colors cursor-pointer" data-testid="link-login">
                    <LogIn className="w-3.5 h-3.5" />
                    로그인
                  </span>
                </Link>
                <Link href="/register">
                  <span className="text-sm text-[#666] hover:text-[#222] cursor-pointer" data-testid="link-register">
                    회원가입
                  </span>
                </Link>
              </>
            )}
          </div>

          <button
            className="lg:hidden flex items-center justify-center w-9 h-9"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            data-testid="button-mobile-menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5 text-[#222]" /> : <Menu className="w-5 h-5 text-[#222]" />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-t border-[#eee] px-4 py-3 space-y-2">
          <div className="md:hidden mb-3">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#999]" />
              <input
                type="text"
                placeholder="종목명·초성·코드 검색"
                className="w-full h-9 pl-9 pr-3 rounded-lg bg-[#f5f5f5] border-none text-sm text-[#222] placeholder-[#999] outline-none"
                data-testid="input-search-mobile"
              />
            </div>
          </div>
          {NAV_LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="block text-sm text-[#666] py-2 hover:text-[#222]"
              data-testid={`link-mobile-nav-${link.label}`}
            >
              {link.label}
            </a>
          ))}
          <Link href="/my-stocks">
            <span className="inline-block text-sm text-[#E8344E] font-bold py-2 cursor-pointer" data-testid="link-mobile-nav-my-stocks">
              공모주 마이페이지
            </span>
          </Link>
          <div className="border-t border-[#eee] pt-3 flex items-center gap-3">
            {user ? (
              <>
                <Link href="/dashboard">
                  <span className="text-sm text-[#222] font-medium cursor-pointer" data-testid="link-mobile-dashboard">{user.fullName}</span>
                </Link>
                <button onClick={handleLogout} className="text-sm text-[#E8344E]" data-testid="button-mobile-logout">로그아웃</button>
              </>
            ) : (
              <>
                <Link href="/login">
                  <span className="text-sm text-white bg-[#E8344E] px-4 py-1.5 rounded-md cursor-pointer" data-testid="link-mobile-login">로그인</span>
                </Link>
                <Link href="/register">
                  <span className="text-sm text-[#666] cursor-pointer" data-testid="link-mobile-register">회원가입</span>
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

function fmtPrice(price: number | null): string {
  if (price === null) return "미제공";
  return price.toLocaleString() + "원";
}

function fmtChange(change: number | null): { text: string; cls: string } {
  if (change === null) return { text: "미제공", cls: "text-[#999]" };
  if (change === 0) return { text: "0%", cls: "text-[#999]" };
  return {
    text: `${change > 0 ? "+" : ""}${change}%`,
    cls: change > 0 ? "text-[#f04452]" : "text-[#3182f6]",
  };
}

function fmtOrders(orders: number | null): string {
  if (orders === null) return "미제공";
  return orders + "건";
}

type ColDef = { label: string; right?: boolean; info?: boolean };

function getColDefs(tab: string): ColDef[] {
  switch (tab) {
    case "상승률 높은":
      return [
        { label: "상승률", right: true, info: true },
        { label: "전체주문", right: true },
        { label: "구분", right: true },
      ];
    case "상장준비 시작":
      return [
        { label: "기준일자", right: true },
        { label: "심사유형", right: true, info: true },
        { label: "구분", right: true },
      ];
    case "예상시총 높은":
      return [
        { label: "예상시총", right: true, info: true },
        { label: "전체주문", right: true },
        { label: "구분", right: true },
      ];
    case "매출이 상승한":
      return [
        { label: "결산연도", right: true },
        { label: "매출상승률", right: true, info: true },
        { label: "구분", right: true },
      ];
    default:
      return [
        { label: "체결평균가", right: true, info: true },
        { label: "등락률", right: true },
        { label: "전체주문", right: true },
        { label: "구분", right: true },
      ];
  }
}

function getCells(stock: StockRow, tab: string): ReactNode[] {
  switch (tab) {
    case "상승률 높은":
      return [
        <span className="text-[#999]">미제공</span>,
        <span className="text-[#999]">미제공</span>,
        <span className="text-[#666]">{stock.category}</span>,
      ];
    case "상장준비 시작":
      return [
        <span className="text-[#999] tabular-nums">{stock.ipoDate ?? "—"}</span>,
        <span className="text-[#999]">{stock.reviewType ?? "—"}</span>,
        <span className="text-[#666]">{stock.category}</span>,
      ];
    case "예상시총 높은": {
      const capStr = stock.marketCapStr ?? "미제공";
      const capCls = capStr === "미제공" ? "text-[#999]" : "text-[#222] font-medium";
      return [
        <span className={`tabular-nums ${capCls}`}>{capStr}</span>,
        <span className={stock.orders !== null ? "text-[#666] tabular-nums" : "text-[#999]"}>{fmtOrders(stock.orders)}</span>,
        <span className="text-[#666]">{stock.category}</span>,
      ];
    }
    case "매출이 상승한":
      return [
        <span className="text-[#999] tabular-nums">{stock.fiscalYear ?? "—"}</span>,
        <span className="text-[#f04452] font-medium tabular-nums">{stock.revenueGrowthStr ?? "—"}</span>,
        <span className="text-[#666]">{stock.category}</span>,
      ];
    default: {
      const ch = fmtChange(stock.change);
      return [
        <span className={stock.price !== null ? "text-[#222] font-medium tabular-nums" : "text-[#999]"}>{fmtPrice(stock.price)}</span>,
        <span className={`tabular-nums font-medium ${ch.cls}`}>{ch.text}</span>,
        <span className={stock.orders !== null ? "text-[#666] tabular-nums" : "text-[#999]"}>{fmtOrders(stock.orders)}</span>,
        <span className="text-[#666]">{stock.category}</span>,
      ];
    }
  }
}

function getMobileSub(stock: StockRow, tab: string): ReactNode {
  switch (tab) {
    case "상승률 높은":
      return <span className="text-[11px] text-[#999]">상승률 미제공 · {stock.category}</span>;
    case "상장준비 시작":
      return <span className="text-[11px] text-[#999]">{stock.ipoDate ?? "—"} · {stock.reviewType} · {stock.category}</span>;
    case "예상시총 높은":
      return <span className="text-[11px] text-[#999]">{stock.marketCapStr ?? "미제공"} · {stock.category}</span>;
    case "매출이 상승한":
      return <span className="text-[11px] text-[#999]">{stock.fiscalYear} · {stock.category}</span>;
    default:
      return <span className="text-[11px] text-[#999]">{fmtOrders(stock.orders)} · {stock.category}</span>;
  }
}

function getMobileRight(stock: StockRow, tab: string): ReactNode {
  switch (tab) {
    case "상승률 높은":
      return <p className="text-sm text-[#999]">미제공</p>;
    case "상장준비 시작":
      return null;
    case "예상시총 높은": {
      const capStr = stock.marketCapStr ?? "미제공";
      return <p className={`text-sm tabular-nums ${capStr === "미제공" ? "text-[#999]" : "text-[#222] font-medium"}`}>{capStr}</p>;
    }
    case "매출이 상승한":
      return <p className="text-sm text-[#f04452] font-medium tabular-nums">{stock.revenueGrowthStr ?? "—"}</p>;
    default: {
      const ch = fmtChange(stock.change);
      return (
        <>
          <p className={`text-sm font-medium tabular-nums ${stock.price !== null ? "text-[#222]" : "text-[#999]"}`}>{fmtPrice(stock.price)}</p>
          <p className={`text-xs tabular-nums font-medium ${ch.cls}`}>{ch.text}</p>
        </>
      );
    }
  }
}

function StockRankings({
  watchlistNames,
  onToggleWatchlist,
}: {
  watchlistNames: string[];
  onToggleWatchlist: (name: string) => void;
}) {
  const [activeTab, setActiveTab] = useState("일반종목");
  const displayStocks = getTabStocks(activeTab);
  const [, navigate] = useLocation();
  const cols = getColDefs(activeTab);

  const now = new Date();
  const timeStr = `${String(now.getFullYear()).slice(2)}.${String(now.getMonth() + 1).padStart(2, "0")}.${String(now.getDate()).padStart(2, "0")} ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")} 기준`;

  const gridCols = cols.length === 4
    ? "grid-cols-[40px_1fr_110px_80px_70px_44px_36px]"
    : "grid-cols-[40px_1fr_130px_80px_70px_36px]";

  return (
    <section id="rankings" data-testid="section-stock-rankings">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-bold text-[#222]">종목 순위</h2>
          <span className="text-xs text-[#999]">{timeStr}</span>
        </div>
        <a href="#" className="text-sm text-[#999] flex items-center gap-0.5 hover:text-[#666]" data-testid="link-rankings-all">
          더보기 <ChevronRight className="w-3.5 h-3.5" />
        </a>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-3 scrollbar-none">
        {RANKING_TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors ${
              activeTab === tab
                ? "bg-[#333] text-white"
                : "bg-[#f5f5f5] text-[#666] hover:bg-[#eee]"
            }`}
            data-testid={`tab-ranking-${tab}`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === "상승률 높은" && (
        <div className="text-xs text-[#666] mb-2 flex items-center gap-1">
          <span>3개월 전 대비</span>
          <ChevronRight className="w-3 h-3" />
        </div>
      )}

      <div className="border border-[#eee] rounded-lg overflow-hidden">
        {/* Desktop header */}
        <div className={`hidden sm:grid ${gridCols} gap-0 px-4 py-2.5 bg-[#fafafa] text-xs text-[#999] border-b border-[#eee]`}>
          <span></span>
          <span className="font-medium">종목명</span>
          {cols.map((col, i) => (
            <span key={i} className={`${col.right ? "text-right" : ""} flex items-center ${col.right ? "justify-end" : ""} gap-0.5`}>
              {col.label}
              {col.info && <span className="text-[10px] ml-0.5">&#9660;</span>}
            </span>
          ))}
          <span></span>
        </div>

        {/* Desktop rows */}
        {displayStocks.map((stock, idx) => {
          const starred = watchlistNames.includes(stock.name);
          const cells = getCells(stock, activeTab);
          return (
            <div
              key={`d-${stock.name}-${idx}`}
              className={`hidden sm:grid ${gridCols} gap-0 px-4 py-3 border-b border-[#f5f5f5] last:border-b-0 hover:bg-[#fafafa] transition-colors items-center`}
              data-testid={`row-stock-${idx}`}
            >
              <span
                className="text-sm text-[#999] font-medium cursor-pointer"
                onClick={() => navigate(`/stock/${encodeURIComponent(stock.name)}`)}
              >{idx + 1}</span>
              <div
                className="flex items-center gap-2.5 cursor-pointer"
                onClick={() => navigate(`/stock/${encodeURIComponent(stock.name)}`)}
              >
                <StockIcon name={stock.name} size={32} />
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-medium text-[#222]">{stock.name}</span>
                  {stock.isIPO && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded border border-[#ccc] text-[#999] font-medium leading-none">IPO</span>
                  )}
                </div>
              </div>
              {cells.map((cell, ci) => (
                <div
                  key={ci}
                  className="text-sm text-right cursor-pointer"
                  onClick={() => navigate(`/stock/${encodeURIComponent(stock.name)}`)}
                >
                  {cell}
                </div>
              ))}
              <button
                onClick={(e) => { e.stopPropagation(); onToggleWatchlist(stock.name); }}
                className="flex items-center justify-end"
                data-testid={`btn-star-${idx}`}
                title={starred ? "관심종목 해제" : "관심종목 추가"}
              >
                <Star
                  className={`w-4 h-4 transition-colors ${starred ? "text-yellow-400 fill-yellow-400" : "text-gray-300 hover:text-yellow-300"}`}
                />
              </button>
            </div>
          );
        })}

        {/* Mobile rows */}
        {displayStocks.map((stock, idx) => {
          const starred = watchlistNames.includes(stock.name);
          return (
            <div
              key={`m-${stock.name}-${idx}`}
              className="sm:hidden flex items-center gap-3 px-3 py-3 border-b border-[#f5f5f5] last:border-b-0 hover:bg-[#fafafa] transition-colors"
              data-testid={`row-stock-mobile-${idx}`}
            >
              <span className="text-xs text-[#999] font-medium w-5 shrink-0 text-center">{idx + 1}</span>
              <div
                className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
                onClick={() => navigate(`/stock/${encodeURIComponent(stock.name)}`)}
              >
                <StockIcon name={stock.name} size={28} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-medium text-[#222] truncate">{stock.name}</span>
                    {stock.isIPO && (
                      <span className="text-[10px] px-1 py-0.5 rounded border border-[#ccc] text-[#999] font-medium leading-none shrink-0">IPO</span>
                    )}
                  </div>
                  {getMobileSub(stock, activeTab)}
                </div>
                <div className="text-right shrink-0">
                  {getMobileRight(stock, activeTab)}
                </div>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); onToggleWatchlist(stock.name); }}
                className="shrink-0 p-1"
                data-testid={`btn-star-mobile-${idx}`}
              >
                <Star
                  className={`w-4 h-4 transition-colors ${starred ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}`}
                />
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}

const PUBLISHER_DOMAINS: Record<string, string> = {
  "서울경제": "sedaily.com",
  "한국경제": "hankyung.com",
  "매일경제": "mk.co.kr",
  "조선비즈": "biz.chosun.com",
  "조선일보": "chosun.com",
  "머니투데이": "mt.co.kr",
  "네이트": "nate.com",
  "라이센스뉴스": "licensenews.kr",
  "중앙일보": "joongang.co.kr",
  "연합뉴스": "yna.co.kr",
  "연합인포맥스": "einfomax.co.kr",
  "시사저널": "sisajournal.com",
  "v.daum.net": "daum.net",
  "이데일리": "edaily.co.kr",
  "뉴스1": "news1.kr",
  "아시아경제": "asiae.co.kr",
  "파이낸셜뉴스": "fnnews.com",
  "헤럴드경제": "heraldcorp.com",
  "디지털데일리": "ddaily.co.kr",
  "블로터": "bloter.net",
};

function PublisherLogo({ publisher, size = 28 }: { publisher: string; size?: number }) {
  const domain = PUBLISHER_DOMAINS[publisher];
  const faviconUrl = domain
    ? `https://www.google.com/s2/favicons?domain=${domain}&sz=64`
    : null;

  if (faviconUrl) {
    return (
      <img
        src={faviconUrl}
        alt={publisher}
        className="rounded-full shrink-0 object-cover bg-white"
        style={{ width: size, height: size }}
        loading="lazy"
        decoding="async"
        onError={(e) => {
          const target = e.target as HTMLImageElement;
          target.style.display = "none";
          target.parentElement?.querySelector(".fallback")?.classList.remove("hidden");
        }}
      />
    );
  }

  const initial = publisher.charAt(0);
  return (
    <div
      className="rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0 bg-[#888]"
      style={{ width: size, height: size }}
    >
      {initial}
    </div>
  );
}

function MajorNews() {
  const { data: newsData } = useQuery<{ title: string; source: string; date: string; url?: string }[]>({
    queryKey: ["/api/stocks/news"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  const fallbackNews = [
    { title: "카나프테라퓨틱스, 공모 청약 시작...바이오 IPO 관심 집중", source: "한국경제", date: "2026.03.05", color: "#E8344E" },
    { title: "두나무, 4분기 영업이익 전년비 120% 증가", source: "매일경제", date: "2026.02.14", color: "#333" },
    { title: "무신사, 해외 시장 진출 가속화...동남아 공략", source: "조선비즈", date: "2026.02.13", color: "#111" },
    { title: "비상장 주식 거래, 2026년 규제 변화 전망", source: "서울경제", date: "2026.02.12", color: "#1976D2" },
    { title: "컬리, 흑자전환 성공...IPO 재시동", source: "머니투데이", date: "2026.02.11", color: "#5F0080" },
  ];

  const news = newsData || fallbackNews;

  return (
    <section id="news" data-testid="section-major-news">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-bold text-[#222]">주요 뉴스</h2>
        <a href="#" className="text-sm text-[#999] flex items-center gap-0.5 hover:text-[#666]" data-testid="link-news-all">
          더보기 <ChevronRight className="w-3.5 h-3.5" />
        </a>
      </div>
      <div className="space-y-0 border border-[#eee] rounded-lg overflow-hidden">
        {(news as any[]).slice(0, 5).map((item: any, i: number) => (
          <a
            key={i}
            href={item.url || item.link || `https://search.naver.com/search.naver?query=${encodeURIComponent(item.title)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-start gap-3 px-4 py-3.5 border-b border-[#f5f5f5] last:border-b-0 hover:bg-[#fafafa] transition-colors cursor-pointer"
            data-testid={`row-news-${i}`}
          >
            <div className="shrink-0 mt-0.5">
              <PublisherLogo publisher={item.publisher || item.source || ""} size={28} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-[#222] leading-snug line-clamp-2">{item.title}</p>
              <p className="text-xs text-[#999] mt-1">{item.publisher || item.source} · {item.publishedAt || item.date}</p>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-[#ccc] shrink-0 mt-1" />
          </a>
        ))}
      </div>
    </section>
  );
}

function ExpertReports() {
  return (
    <section id="reports" data-testid="section-expert-reports">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-bold text-[#222]">전문가 리포트</h2>
        <a href="#" className="text-sm text-[#999] flex items-center gap-0.5 hover:text-[#666]" data-testid="link-reports-all">
          더보기 <ChevronRight className="w-3.5 h-3.5" />
        </a>
      </div>
      <div className="space-y-0 border border-[#eee] rounded-lg overflow-hidden">
        {EXPERT_REPORTS.map((report, i) => (
          <div
            key={i}
            className="flex items-start gap-3 px-4 py-3.5 border-b border-[#f5f5f5] last:border-b-0 hover:bg-[#fafafa] transition-colors cursor-pointer"
            data-testid={`row-report-${i}`}
          >
            <div className="shrink-0 mt-0.5">
              <SiteLogoBadge size={28} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-[#222] leading-snug line-clamp-2">{report.title}</p>
              <p className="text-xs text-[#999] mt-1">{report.author} · {report.date}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function ThemeStocks() {
  const [activeTheme, setActiveTheme] = useState("일반종목");
  const themeData = THEME_COMPANIES[activeTheme] || THEME_COMPANIES["일반종목"];

  return (
    <section id="themes" data-testid="section-theme-stocks">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-bold text-[#222]">테마별 종목</h2>
        <a href="#" className="text-sm text-[#999] flex items-center gap-0.5 hover:text-[#666]" data-testid="link-themes-all">
          더보기 <ChevronRight className="w-3.5 h-3.5" />
        </a>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-3 scrollbar-none">
        {THEME_TAGS.map((tag) => (
          <button
            key={tag}
            onClick={() => setActiveTheme(tag)}
            className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors ${
              activeTheme === tag
                ? "bg-[#E8344E] text-white"
                : "bg-gradient-to-r from-[#fff3e0] to-[#fff8e1] text-[#996600] border border-[#ffe0b2] hover:from-[#ffe0b2] hover:to-[#fff3e0]"
            }`}
            data-testid={`tab-theme-${tag}`}
          >
            # {tag}
          </button>
        ))}
      </div>

      <div className="border border-[#eee] rounded-lg p-4">
        <p className="text-sm text-[#666] mb-3">{themeData.desc}</p>
        <div className="flex items-center flex-wrap gap-2">
          {themeData.companies.map((company) => (
            <span
              key={company}
              className="px-3 py-1.5 bg-[#f5f5f5] rounded-full text-sm text-[#222] hover:bg-[#eee] cursor-pointer transition-colors"
              data-testid={`tag-company-${company}`}
            >
              {company}
            </span>
          ))}
          {themeData.extra > 0 && (
            <span className="text-sm text-[#E8344E] font-medium">+{themeData.extra}개 기업</span>
          )}
        </div>
      </div>
    </section>
  );
}

function PopularDiscussions() {
  return (
    <section id="discussions" data-testid="section-popular-discussions">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-bold text-[#222]">인기 토론</h2>
        <a href="#" className="text-sm text-[#999] flex items-center gap-0.5 hover:text-[#666]" data-testid="link-discussions-all">
          더보기 <ChevronRight className="w-3.5 h-3.5" />
        </a>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
        {DISCUSSIONS.map((post) => (
          <div
            key={post.id}
            className="min-w-[200px] max-w-[200px] border border-[#eee] rounded-xl p-4 flex flex-col justify-between gap-2 cursor-pointer hover:border-[#ddd] hover:bg-[#fafafa] transition-colors shrink-0"
            data-testid={`card-discussion-${post.id}`}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] px-1.5 py-0.5 rounded font-medium"
                  style={{
                    backgroundColor: post.userType === "주주" ? "#FFF0F0" : "#F0F4FF",
                    color: post.userType === "주주" ? "#E8344E" : "#1976D2",
                  }}
                >
                  {post.userType}
                </span>
                <span className="text-[11px] text-[#bbb]">{post.time}</span>
              </div>
              <p className="text-sm font-medium text-[#222] leading-snug line-clamp-3">{post.content}</p>
            </div>
            <div className="flex items-center gap-1.5 pt-1 border-t border-[#f5f5f5]">
              <span className="text-xs text-[#666]">{post.tag}</span>
              <MessageCircle className="w-3 h-3 text-[#ccc] ml-auto" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function MyHoldings() {
  const { data: authData } = useQuery<{ user: UserType } | null>({
    queryKey: ["/api/auth/me"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  const { data: transactions } = useQuery<StockTransaction[]>({
    queryKey: ["/api/transactions/my"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: !!authData?.user,
  });

  const [priceData, setPriceData] = useState<Record<string, { currentPrice: number; changePercent: number }>>({});

  const txList = transactions || [];
  const holdingsMap: Record<string, { qty: number; totalCost: number }> = {};
  txList.forEach((tx) => {
    const key = tx.stockName;
    if (!holdingsMap[key]) holdingsMap[key] = { qty: 0, totalCost: 0 };
    if (tx.type === "in") {
      holdingsMap[key].qty += tx.quantity;
      holdingsMap[key].totalCost += tx.quantity * tx.pricePerShare;
    } else {
      const currentAvg = holdingsMap[key].qty > 0 ? holdingsMap[key].totalCost / holdingsMap[key].qty : 0;
      holdingsMap[key].qty -= tx.quantity;
      holdingsMap[key].totalCost = holdingsMap[key].qty * currentAvg;
    }
  });

  const holdingStockNames = Object.entries(holdingsMap).filter(([, v]) => v.qty > 0).map(([name]) => name);
  const holdingStockNamesKey = JSON.stringify(holdingStockNames);

  useEffect(() => {
    if (holdingStockNames.length > 0) {
      fetchStockPrices(holdingStockNames).then(setPriceData);
    }
  }, [holdingStockNamesKey]);

  const holdingsList = Object.entries(holdingsMap)
    .filter(([, v]) => v.qty > 0)
    .map(([name, v]) => {
      const avgPrice = Math.round(v.totalCost / v.qty);
      const market = priceData[name] || { currentPrice: avgPrice, changePercent: 0 };
      const currentPrice = market.currentPrice;
      const evalAmount = v.qty * currentPrice;
      const profitLoss = evalAmount - v.totalCost;
      const profitPct = v.totalCost > 0 ? ((profitLoss / v.totalCost) * 100) : 0;
      return { name, qty: v.qty, avgPrice, currentPrice, evalAmount, totalCost: v.totalCost, profitLoss, profitPct, changePercent: market.changePercent };
    });

  const totalEval = holdingsList.reduce((s, h) => s + h.evalAmount, 0);
  const totalCost = holdingsList.reduce((s, h) => s + h.totalCost, 0);
  const totalProfit = totalEval - totalCost;
  const totalProfitPct = totalCost > 0 ? ((totalProfit / totalCost) * 100) : 0;

  if (!authData?.user) {
    return (
      <div data-testid="section-my-holdings">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-[#222]">내 보유종목</h2>
        </div>
        <div className="border border-[#eee] rounded-lg p-6 text-center">
          <div className="w-12 h-12 rounded-full bg-[#f5f5f5] flex items-center justify-center mx-auto mb-3">
            <User className="w-6 h-6 text-[#ccc]" />
          </div>
          <p className="text-sm text-[#999] mb-3">로그인하면 보유종목을 확인할 수 있습니다</p>
          <a
            href="/login"
            className="inline-flex items-center gap-1.5 text-sm text-white bg-[#E8344E] rounded-full px-5 py-2 hover:bg-[#d42e45] transition-colors"
            data-testid="link-login-holdings"
          >
            <LogIn className="w-3.5 h-3.5" />
            로그인
          </a>
        </div>
      </div>
    );
  }

  return (
    <div data-testid="section-my-holdings">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-bold text-[#222]">내 보유종목</h2>
        <a href="/dashboard" className="text-xs text-[#E8344E] flex items-center gap-0.5 hover:underline" data-testid="link-my-dashboard">
          마이페이지 <ChevronRight className="w-3 h-3" />
        </a>
      </div>

      {holdingsList.length === 0 ? (
        <div className="border border-[#eee] rounded-lg p-6 text-center">
          <p className="text-sm text-[#999] mb-1">보유 중인 종목이 없습니다</p>
          <p className="text-xs text-[#ccc]">입고된 주식이 여기에 표시됩니다</p>
        </div>
      ) : (
        <>
          <div className="bg-[#f8f9fa] rounded-lg p-3.5 mb-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-[#999]">총 평가금액</span>
              <span className={`text-xs font-bold tabular-nums ${totalProfit > 0 ? "text-[#f04452]" : totalProfit < 0 ? "text-[#3182f6]" : "text-[#666]"}`}>
                {totalProfit > 0 ? "+" : ""}{totalProfitPct.toFixed(2)}%
              </span>
            </div>
            <p className="text-lg font-bold text-[#222] tabular-nums">{totalEval.toLocaleString()}원</p>
            <p className={`text-xs tabular-nums ${totalProfit > 0 ? "text-[#f04452]" : totalProfit < 0 ? "text-[#3182f6]" : "text-[#999]"}`}>
              {totalProfit > 0 ? "+" : ""}{totalProfit.toLocaleString()}원
            </p>
          </div>

          <div className="space-y-2.5">
            {holdingsList.map((h) => (
              <div
                key={h.name}
                className="border border-[#eee] rounded-lg p-3 hover:border-[#ddd] transition-colors cursor-pointer"
                data-testid={`card-holding-${h.name}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <StockIcon name={h.name} size={36} />
                    <div>
                      <span className="text-sm font-bold text-[#222]">{h.name}</span>
                      <p className="text-xs text-[#999]">{h.qty.toLocaleString()}주 · 평균 {h.avgPrice.toLocaleString()}원</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-[#222] tabular-nums">{h.currentPrice.toLocaleString()}원</p>
                    <p className={`text-xs font-medium tabular-nums ${h.profitPct > 0 ? "text-[#f04452]" : h.profitPct < 0 ? "text-[#3182f6]" : "text-[#999]"}`}>
                      {h.profitPct > 0 ? "+" : ""}{h.profitPct.toFixed(2)}%
                      <span className="ml-1 text-[10px]">({h.profitLoss > 0 ? "+" : ""}{h.profitLoss.toLocaleString()}원)</span>
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 text-center">
            <a href="/dashboard" className="inline-flex items-center gap-1 text-sm text-[#666] border border-[#eee] rounded-full px-5 py-2 hover:bg-[#fafafa] transition-colors" data-testid="link-more-holdings">
              상세보기 <ChevronRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </>
      )}
    </div>
  );
}

function Tips() {
  const [openTip, setOpenTip] = useState<number | null>(null);

  const tips = [
    {
      icon: <Award className="w-5 h-5 text-[#E8344E]" />,
      title: "이것만 따라하세요!",
      desc: "증권플러스 비상장 이용가이드",
      content: [
        { step: "1. 회원가입", detail: "증권플러스 비상장 사이트에서 간편하게 회원가입을 진행합니다. 이름, 아이디, 비밀번호, 계좌정보를 입력하면 완료됩니다." },
        { step: "2. 종목 탐색", detail: "메인 페이지에서 비상장 종목 순위, 테마별 종목, 전문가 리포트 등을 확인하며 관심 종목을 찾아보세요." },
        { step: "3. 매수/매도 신청", detail: "원하는 종목을 선택한 후, 수량과 가격을 입력하여 매수 또는 매도 신청을 합니다." },
        { step: "4. 거래 체결 확인", detail: "마이페이지에서 거래 현황을 실시간으로 확인할 수 있습니다. 입고/출고 내역도 한눈에 볼 수 있습니다." },
        { step: "5. 1:1 상담", detail: "거래 관련 문의사항은 1:1 상담을 통해 전문 상담사에게 문의하세요." },
      ],
    },
    {
      icon: <HelpCircle className="w-5 h-5 text-[#1976D2]" />,
      title: "비상장 거래, 궁금해요!",
      desc: "자주하는 질문",
      content: [
        { step: "비상장주식이란?", detail: "증권거래소에 상장되지 않은 기업의 주식을 말합니다. 상장 전 단계의 유망 기업에 투자할 수 있는 기회를 제공합니다." },
        { step: "거래는 어떻게 하나요?", detail: "증권플러스 비상장에서 매수/매도 신청을 하면, 매칭되는 상대방과 거래가 체결됩니다. 체결 후 주식 이동은 입고/출고를 통해 처리됩니다." },
        { step: "수수료가 있나요?", detail: "거래 수수료는 거래 금액의 일정 비율로 부과됩니다. 자세한 수수료율은 고객센터에 문의해 주세요." },
        { step: "안전한가요?", detail: "증권플러스 비상장은 안전한 거래 환경을 제공하며, 모든 거래는 실명 인증된 회원 간에 이루어집니다." },
      ],
    },
    {
      icon: <BookOpen className="w-5 h-5 text-[#43A047]" />,
      title: "꼭 알아야 할 비상장 기본상식!",
      desc: "비상장 주식 101",
      content: [
        { step: "비상장주식의 특징", detail: "비상장주식은 상장주식에 비해 유동성이 낮고, 기업 정보가 제한적일 수 있습니다. 하지만 상장 시 높은 수익을 기대할 수 있는 장점이 있습니다." },
        { step: "투자 시 주의사항", detail: "비상장주식은 가격 변동성이 크고, 환금성이 낮을 수 있으므로 여유 자금으로 분산 투자하는 것이 좋습니다." },
        { step: "IPO(기업공개)란?", detail: "기업이 주식을 일반 투자자에게 공개 판매하고 증권거래소에 상장하는 과정입니다. IPO를 통해 비상장주식이 상장주식으로 전환됩니다." },
        { step: "공모주 청약 방법", detail: "증권사 계좌를 통해 공모주 청약에 참여할 수 있습니다. 청약 증거금을 납입하고, 배정 결과에 따라 주식을 받게 됩니다." },
      ],
    },
  ];

  return (
    <div id="tips" data-testid="section-tips">
      <h2 className="text-base font-bold text-[#222] mb-3">비상장 꿀팁</h2>
      <div className="space-y-0 border border-[#eee] rounded-lg overflow-hidden">
        {tips.map((tip, i) => (
          <div key={i} className="border-b border-[#f5f5f5] last:border-b-0">
            <button
              onClick={() => setOpenTip(openTip === i ? null : i)}
              className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-[#fafafa] transition-colors cursor-pointer text-left"
              data-testid={`row-tip-${i}`}
            >
              <div className="w-9 h-9 rounded-lg bg-[#f5f5f5] flex items-center justify-center shrink-0">
                {tip.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#222]">{tip.title}</p>
                <p className="text-xs text-[#999]">{tip.desc}</p>
              </div>
              <ChevronRight className={`w-4 h-4 text-[#ccc] shrink-0 transition-transform ${openTip === i ? "rotate-90" : ""}`} />
            </button>
            {openTip === i && (
              <div className="px-4 pb-4 pt-1 bg-[#fafafa]">
                <div className="space-y-3">
                  {tip.content.map((item, j) => (
                    <div key={j} className="pl-12">
                      <p className="text-sm font-medium text-[#333] mb-0.5">{item.step}</p>
                      <p className="text-xs text-[#666] leading-relaxed">{item.detail}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

const DISCUSSION_COMMENTS: Record<string, { user: string; text: string; time: string }[]> = {
  "카나프테라퓨틱스": [
    { user: "바이오전문가", text: "공모가 밴드 16,000~20,000원이면 적정한 수준이라고 봅니다", time: "방금 전" },
    { user: "IPO분석가", text: "신약 파이프라인이 탄탄해서 장기적으로 긍정적입니다", time: "1분 전" },
    { user: "비상장고수", text: "바이오 섹터 IPO 중에서 올해 가장 기대되는 종목이에요", time: "2분 전" },
    { user: "투자왕김씨", text: "수요예측 결과가 좋으면 공모가 상단 확정될 것 같습니다", time: "3분 전" },
    { user: "장기투자자", text: "임상 진행 상황이 순조로워서 상장 후에도 기대해볼 만합니다", time: "5분 전" },
    { user: "공모주헌터", text: "청약 증거금 준비해야겠네요. 경쟁률 높을 것 같아요", time: "7분 전" },
    { user: "비상장매니아", text: "3월 17일 상장 예정이니까 일정 잘 체크해두세요", time: "8분 전" },
    { user: "경제전문가", text: "바이오 IPO 시장이 활기를 띄고 있어서 좋은 타이밍입니다", time: "10분 전" },
  ],
  "빗썸": [
    { user: "코인투자자", text: "빗썸 IPO 소식 들으셨나요? 올해 안에 상장 추진한다던데", time: "방금 전" },
    { user: "암호화폐분석", text: "거래소 수수료 수익이 안정적이라 밸류에이션 괜찮을 듯", time: "2분 전" },
    { user: "디지털자산", text: "업비트랑 비교하면 시장점유율은 좀 밀리지만 성장성은 있죠", time: "4분 전" },
    { user: "비상장투자", text: "현재 비상장 시장에서 거래가 활발한 편입니다", time: "6분 전" },
    { user: "크립토매니아", text: "가상자산법 시행 이후 규제 환경이 개선되면 수혜 볼 수 있을 것 같아요", time: "9분 전" },
  ],
  "오톰": [
    { user: "AI투자자", text: "로봇 AI 기술력은 인정하는데 수익화가 관건이죠", time: "방금 전" },
    { user: "테크분석", text: "B2B 시장에서 레퍼런스가 쌓이고 있어서 기대됩니다", time: "3분 전" },
    { user: "미래기술", text: "국내 로봇 기업 중에서 기술력 상위권이라고 봅니다", time: "5분 전" },
  ],
  "현대엔지니어링": [
    { user: "건설주전문", text: "현대건설 자회사인데 분리상장 가능성이 있다고 보시나요?", time: "방금 전" },
    { user: "플랜트분석", text: "해외 플랜트 수주가 늘어나고 있어서 실적 개선 기대", time: "4분 전" },
    { user: "가치투자자", text: "비상장 가격 대비 자산가치가 저평가 되어있다고 생각합니다", time: "8분 전" },
  ],
  "이브이알스튜디오": [
    { user: "VR매니아", text: "메타버스 시장이 다시 주목받으면서 기대감이 올라가고 있어요", time: "방금 전" },
    { user: "IT분석가", text: "VR 콘텐츠 제작 기술력은 국내 최고 수준이라고 봅니다", time: "5분 전" },
  ],
};

function HotDiscussionRooms() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [liveComments, setLiveComments] = useState<{ user: string; text: string; time: string }[]>([]);
  const commentsEndRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: "left" | "right") => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: dir === "left" ? -200 : 200, behavior: "smooth" });
    }
  };

  useEffect(() => {
    if (!selectedRoom) return;
    const base = DISCUSSION_COMMENTS[selectedRoom] || [];
    setLiveComments([...base]);

    const extraComments = [
      { user: "실시간유저1", text: "저도 이 종목 관심있게 보고 있습니다!" },
      { user: "투자고수", text: "장기적으로 좋은 종목이라고 생각해요" },
      { user: "초보투자자", text: "혹시 적정 매수가가 어느 정도일까요?" },
      { user: "분석전문가", text: "현재 가격이면 진입 타이밍 괜찮아 보입니다" },
      { user: "비상장팬", text: "비상장 투자는 인내심이 중요하죠" },
      { user: "시장관찰자", text: "최근 거래량이 늘어나고 있어서 주목할 만합니다" },
      { user: "주식연구원", text: "펀더멘탈 분석 결과 긍정적입니다" },
      { user: "경제학도", text: "업종 전망도 밝은 편이라 기대됩니다" },
    ];
    let idx = 0;
    const interval = setInterval(() => {
      if (idx < extraComments.length) {
        setLiveComments(prev => [{ ...extraComments[idx], time: "방금 전" }, ...prev.map(c => ({
          ...c,
          time: c.time === "방금 전" ? "1분 전" : c.time
        }))]);
        idx++;
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [selectedRoom]);

  useEffect(() => {
    if (commentsEndRef.current) {
      commentsEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [liveComments]);

  return (
    <div id="hot-rooms" data-testid="section-hot-rooms">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-bold text-[#222]">HOT 토론방</h2>
          <span className="text-xs text-[#999]">실시간</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => scroll("left")}
            className="w-7 h-7 rounded-full border border-[#eee] flex items-center justify-center hover:bg-[#f5f5f5] transition-colors"
            data-testid="button-hot-rooms-prev"
          >
            <ChevronLeft className="w-3.5 h-3.5 text-[#999]" />
          </button>
          <button
            onClick={() => scroll("right")}
            className="w-7 h-7 rounded-full border border-[#eee] flex items-center justify-center hover:bg-[#f5f5f5] transition-colors"
            data-testid="button-hot-rooms-next"
          >
            <ChevronRight className="w-3.5 h-3.5 text-[#999]" />
          </button>
        </div>
      </div>

      <div ref={scrollRef} className="flex gap-3 overflow-x-auto scrollbar-none pb-1">
        {HOT_ROOMS.map((room, i) => (
          <div
            key={i}
            onClick={() => setSelectedRoom(selectedRoom === room.name ? null : room.name)}
            className={`shrink-0 w-[160px] border rounded-lg p-3 transition-colors cursor-pointer ${
              selectedRoom === room.name ? "border-[#E8344E] bg-[#fef2f2]" : "border-[#eee] hover:border-[#ddd]"
            }`}
            data-testid={`card-hot-room-${i}`}
          >
            <div className="flex items-center gap-2 mb-2">
              <StockIcon name={room.name} size={28} />
              <span className="text-sm font-medium text-[#222] truncate">{room.name}</span>
            </div>
            <div className="flex flex-wrap gap-1 mb-2">
              {room.tags.map((tag) => (
                <span key={tag} className="text-[10px] text-[#E8344E] bg-[#fef2f2] px-1.5 py-0.5 rounded">{tag}</span>
              ))}
            </div>
            <div className="flex items-center gap-1 text-xs text-[#999]">
              <MessageCircle className="w-3 h-3" />
              <span>{room.count.toLocaleString()}</span>
            </div>
          </div>
        ))}
      </div>

      {selectedRoom && (
        <div className="mt-3 border border-[#eee] rounded-lg overflow-hidden" data-testid="discussion-panel">
          <div className="flex items-center justify-between px-4 py-2.5 bg-[#fafafa] border-b border-[#eee]">
            <div className="flex items-center gap-2">
              <StockIcon name={selectedRoom} size={22} />
              <span className="text-sm font-bold text-[#222]">{selectedRoom} 토론방</span>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#E8344E] opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#E8344E]" />
              </span>
              <span className="text-[10px] text-[#E8344E]">LIVE</span>
            </div>
            <button
              onClick={() => setSelectedRoom(null)}
              className="text-xs text-[#999] hover:text-[#666]"
              data-testid="button-close-discussion"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="max-h-[280px] overflow-y-auto px-4 py-2 space-y-2">
            {liveComments.map((comment, i) => (
              <div
                key={`${comment.user}-${i}`}
                className={`flex items-start gap-2 py-1.5 ${i === 0 ? "animate-fade-in" : ""}`}
                data-testid={`comment-${i}`}
              >
                <div className="w-6 h-6 rounded-full bg-[#f0f0f0] flex items-center justify-center shrink-0 mt-0.5">
                  <User className="w-3 h-3 text-[#999]" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-medium text-[#555]">{comment.user}</span>
                    <span className="text-[10px] text-[#bbb]">{comment.time}</span>
                  </div>
                  <p className="text-[13px] text-[#333] leading-snug">{comment.text}</p>
                </div>
              </div>
            ))}
            <div ref={commentsEndRef} />
          </div>
          <div className="px-4 py-2.5 border-t border-[#eee] bg-[#fafafa]">
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="토론에 참여하세요..."
                className="flex-1 h-8 px-3 rounded-lg bg-white border border-[#eee] text-xs outline-none focus:border-[#E8344E]"
                data-testid="input-discussion"
              />
              <button className="h-8 px-3 bg-[#E8344E] text-white text-xs rounded-lg hover:bg-[#d42e45] transition-colors" data-testid="button-send-discussion">
                전송
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Footer() {
  return (
    <footer className="bg-[#fafafa] border-t border-[#eee] mt-12" data-testid="footer">
      <div className="max-w-[1200px] mx-auto px-4 py-8">
        <div className="flex items-center gap-1.5 mb-4">
          <SiteLogoBadge size={22} />
          <span className="text-sm font-bold text-[#222]">증권플러스 <span className="text-[#E8344E]">비상장</span></span>
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mb-4 text-xs">
          <a href="#" className="text-[#666] hover:text-[#222]" data-testid="link-footer-terms">이용약관</a>
          <a href="#" className="text-[#666] hover:text-[#222]" data-testid="link-footer-policy">서비스 운영정책</a>
          <a href="#" className="text-[#222] font-bold hover:text-[#000]" data-testid="link-footer-privacy">개인정보처리방침</a>
          <a href="#" className="text-[#666] hover:text-[#222]" data-testid="link-footer-investment">투자 유의 안내</a>
          <a href="#" className="text-[#666] hover:text-[#222]" data-testid="link-footer-about">회사소개</a>
          <a href="#" className="text-[#666] hover:text-[#222]" data-testid="link-footer-careers">채용공고</a>
        </div>

        <p className="text-[11px] text-[#999] leading-relaxed mb-2">
          증권플러스 비상장은 비상장주식 거래 정보를 제공하며, 투자 판단에 대한 책임은 투자자 본인에게 있습니다.
          비상장주식은 상장주식에 비해 유동성이 낮고 가격 변동성이 클 수 있으니 투자에 유의하시기 바랍니다.
        </p>
        <p className="text-[11px] text-[#bbb]">
          © 2026 증권플러스 비상장. All rights reserved.
        </p>
      </div>
    </footer>
  );
}

export default function TradePage() {
  const { data: user } = useQuery<UserType | null>({
    queryKey: ["/api/auth/me"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  const { watchlistNames, toggleWatchlist } = useWatchlist(user ?? null);

  return (
    <div className="min-h-screen bg-white" data-testid="page-landing">
      <Header user={user ?? null} />

      <main className="max-w-[1200px] mx-auto px-4 py-4">
        {/* 모바일 검색바 */}
        <div className="lg:hidden mb-3">
          <div className="flex items-center gap-2 px-3 py-2.5 bg-[#f5f5f5] rounded-xl">
            <Search className="w-4 h-4 text-[#999] shrink-0" />
            <input
              type="text"
              placeholder="종목명·초성·코드 검색"
              className="bg-transparent text-sm text-[#222] placeholder-[#aaa] outline-none flex-1"
              data-testid="input-search-mobile-top"
            />
            <Bell className="w-4 h-4 text-[#999] shrink-0" />
          </div>
        </div>

        <BannerCarousel />

        <div className="flex flex-col lg:flex-row gap-6 mt-2">
          <div className="flex-1 min-w-0 space-y-8">
            {/* 모바일 관심종목 섹션 */}
            <div className="lg:hidden border border-[#eee] rounded-2xl overflow-hidden" data-testid="mobile-watchlist-section">
              <div className="px-4 py-3 flex items-center justify-between border-b border-[#f5f5f5]">
                <span className="text-sm font-bold text-[#222]">내 최근 관심종목</span>
              </div>
              {watchlistNames.length === 0 ? (
                <div className="px-4 py-3">
                  <a
                    href="#rankings"
                    className="flex items-center gap-2 text-sm text-[#666] hover:text-[#444]"
                    data-testid="mobile-watchlist-add"
                  >
                    <div className="w-7 h-7 rounded-full border-2 border-dashed border-[#ccc] flex items-center justify-center">
                      <Plus className="w-3.5 h-3.5 text-[#999]" />
                    </div>
                    <span>관심종목 추가하기</span>
                  </a>
                </div>
              ) : (
                <div className="flex gap-4 px-4 py-3 overflow-x-auto scrollbar-none">
                  {watchlistNames.slice(0, 5).map((name) => (
                    <div key={name} className="flex flex-col items-center gap-1 shrink-0">
                      <StockIcon name={name} size={36} />
                      <span className="text-[10px] text-[#444] font-medium max-w-[44px] text-center truncate">{name}</span>
                    </div>
                  ))}
                  <a href="#rankings" className="flex flex-col items-center gap-1 shrink-0 justify-center">
                    <div className="w-9 h-9 rounded-full border-2 border-dashed border-[#ccc] flex items-center justify-center">
                      <Plus className="w-4 h-4 text-[#999]" />
                    </div>
                    <span className="text-[10px] text-[#999]">추가</span>
                  </a>
                </div>
              )}
            </div>

            <StockRankings watchlistNames={watchlistNames} onToggleWatchlist={toggleWatchlist} />
            <MajorNews />
            <ThemeStocks />
            <ExpertReports />
            <PopularDiscussions />
          </div>

          <aside className="w-full lg:w-[340px] shrink-0 space-y-6">
            <WatchlistSection user={user ?? null} watchlistNames={watchlistNames} onToggleWatchlist={toggleWatchlist} />
            <MyHoldings />
            <Tips />
            <HotDiscussionRooms />
          </aside>
        </div>
      </main>

      <Footer />

      <style>{`
        .scrollbar-none::-webkit-scrollbar { display: none; }
        .scrollbar-none { -ms-overflow-style: none; scrollbar-width: none; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        .line-clamp-2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
        html { scroll-behavior: smooth; }
        [id] { scroll-margin-top: 70px; }
      `}</style>
    </div>
  );
}