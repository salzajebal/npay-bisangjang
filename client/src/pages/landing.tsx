import { useEffect, useState, useRef } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import {
  Search,
  ChevronRight,
  ChevronLeft,
  MessageCircle,
  Calendar,
  BookOpen,
  HelpCircle,
  Award,
  LogIn,
  LogOut,
  User,
  Menu,
  X,
  ExternalLink,
} from "lucide-react";
import { getQueryFn, apiRequest, queryClient } from "@/lib/queryClient";
import { StockIcon } from "@/components/stock-icon";
import { SiteLogoBadge } from "@/components/site-logo";
import type { User as UserType } from "@shared/schema";

const UNLISTED_STOCKS = [
  { name: "케이뱅크", code: "279570", price: 11600, change: -6.45, orders: 506, category: "일반", isIPO: true, marketCap: 52000, revenueGrowth: 18.5, ipoPrep: true },
  { name: "두나무", code: "389930", price: 307000, change: 1.99, orders: 120, category: "일반", isIPO: false, marketCap: 98000, revenueGrowth: 42.3, ipoPrep: false },
  { name: "빗썸", code: "341650", price: 214000, change: -3.17, orders: 50, category: "일반", isIPO: false, marketCap: 35000, revenueGrowth: 31.2, ipoPrep: false },
  { name: "무신사", code: "458860", price: 25700, change: 0, orders: 128, category: "일반", isIPO: true, marketCap: 45000, revenueGrowth: 22.1, ipoPrep: true },
  { name: "오아시스", code: "370190", price: 9600, change: -6.8, orders: 65, category: "일반", isIPO: false, marketCap: 8500, revenueGrowth: -5.3, ipoPrep: false },
  { name: "컬리", code: "408480", price: 20300, change: -1.46, orders: 49, category: "일반", isIPO: false, marketCap: 28000, revenueGrowth: 15.7, ipoPrep: false },
  { name: "에스엠랩", code: "419350", price: 1280, change: 4.07, orders: 37, category: "일반", isIPO: false, marketCap: 3200, revenueGrowth: 67.8, ipoPrep: false },
  { name: "야놀자", code: "350920", price: 26900, change: 0.37, orders: 54, category: "일반", isIPO: false, marketCap: 42000, revenueGrowth: 28.4, ipoPrep: false },
  { name: "케이솔루션", code: "413490", price: 7650, change: 10.87, orders: 16, category: "일반", isIPO: false, marketCap: 5600, revenueGrowth: 85.2, ipoPrep: true },
  { name: "에너진", code: "403680", price: 3560, change: 7.23, orders: 50, category: "일반", isIPO: false, marketCap: 4100, revenueGrowth: 53.6, ipoPrep: false },
  { name: "오톰", code: "378160", price: 15200, change: 2.35, orders: 42, category: "일반", isIPO: false, marketCap: 12000, revenueGrowth: 35.1, ipoPrep: false },
  { name: "현대엔지니어링", code: "064540", price: 68500, change: -0.87, orders: 28, category: "일반", isIPO: false, marketCap: 75000, revenueGrowth: 8.2, ipoPrep: true },
  { name: "이브이알스튜디오", code: "379660", price: 4350, change: 12.41, orders: 31, category: "일반", isIPO: false, marketCap: 2800, revenueGrowth: 120.5, ipoPrep: false },
  { name: "토스", code: "285240", price: 185000, change: 3.52, orders: 88, category: "일반", isIPO: false, marketCap: 130000, revenueGrowth: 45.8, ipoPrep: true },
  { name: "에스팀", code: "414260", price: 7500, change: 5.63, orders: 22, category: "전문", isIPO: true, marketCap: 1800, revenueGrowth: 92.3, ipoPrep: true },
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
  "일반종목": { companies: ["두나무", "케이뱅크", "오톰", "빗썸", "야놀자"], extra: 18, desc: "일반투자자와 전문투자자 모두 거래 가능한 일반종목입니다." },
  "핀테크": { companies: ["두나무", "빗썸", "케이뱅크", "토스"], extra: 12, desc: "금융과 기술의 융합, 핀테크 관련 비상장 종목입니다." },
  "2차전지": { companies: ["에너진", "케이솔루션"], extra: 8, desc: "2차전지 및 배터리 관련 비상장 종목입니다." },
  "제약/바이오": { companies: ["에임드바이오", "에스엠랩"], extra: 15, desc: "제약 및 바이오 관련 비상장 종목입니다." },
  "식품/딜리버리": { companies: ["컬리", "오아시스", "무신사"], extra: 7, desc: "식품 및 딜리버리 관련 비상장 종목입니다." },
  "여행/숙박": { companies: ["야놀자"], extra: 5, desc: "여행 및 숙박 관련 비상장 종목입니다." },
  "메타버스(VR·AR)": { companies: ["이브이알스튜디오"], extra: 6, desc: "메타버스, VR·AR 관련 비상장 종목입니다." },
  "전기차": { companies: ["에너진"], extra: 4, desc: "전기차 관련 비상장 종목입니다." },
  "게임": { companies: ["크래프톤", "넥슨게임즈"], extra: 9, desc: "게임 관련 비상장 종목입니다." },
};

const DISCUSSIONS = [
  { id: 1, user: "투자마스터", avatar: "#E8344E", time: "10분 전", content: "케이뱅크 IPO 일정이 다시 잡힌 것 같은데, 이번에는 확실할까요? 공모가 밴드가 궁금합니다.", tag: "케이뱅크" },
  { id: 2, user: "비상장전문가", avatar: "#1976D2", time: "32분 전", content: "두나무 실적 발표 이후 거래량이 확 늘었네요. 암호화폐 시장 회복과 함께 긍정적인 흐름입니다.", tag: "두나무" },
  { id: 3, user: "장기투자자", avatar: "#43A047", time: "1시간 전", content: "무신사 상장 준비 소식 들으셨나요? 패션 플랫폼 중에서는 독보적인 위치라 기대됩니다.", tag: "무신사" },
  { id: 4, user: "IPO분석가", avatar: "#E65100", time: "2시간 전", content: "빗썸 거래량이 지속적으로 증가하고 있어요. 코인 시장 상승과 맞물려서 좋은 흐름입니다.", tag: "빗썸" },
];

const UPCOMING_IPOS = [
  { name: "케이뱅크", dDay: 5, date: "02.20 예정", priceRange: "7,000 ~ 8,500원", competition: "198.53:1", label: "매수가능" },
  { name: "에스팀", dDay: 8, date: "02.23 예정", priceRange: "7,000 ~ 8,500원", competition: "-" },
  { name: "엑스비스", dDay: 8, date: "02.23 예정", priceRange: "10,100 ~ 11,500원", competition: "-" },
];

const HOT_ROOMS = [
  { name: "케이뱅크", tags: ["#IPO", "#은행"], count: 1284 },
  { name: "빗썸", tags: ["#암호화폐", "#거래소"], count: 956 },
  { name: "오톰", tags: ["#AI", "#로봇"], count: 743 },
  { name: "현대엔지니어링", tags: ["#건설", "#플랜트"], count: 621 },
  { name: "이브이알스튜디오", tags: ["#VR", "#메타버스"], count: 512 },
];

const NAV_LINKS = [
  { label: "공모주 IPO 캘린더", href: "#" },
  { label: "서비스소개", href: "#" },
  { label: "자주하는 질문", href: "#" },
  { label: "이벤트", href: "#" },
  { label: "공지사항", href: "#" },
  { label: "회사소개", href: "#" },
  { label: "채용", href: "#" },
];

function useTickerPrices() {
  const [stocks, setStocks] = useState(() =>
    UNLISTED_STOCKS.map((s) => ({ ...s }))
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setStocks((prev) =>
        prev.map((s) => {
          const base = UNLISTED_STOCKS.find((k) => k.code === s.code)!;
          const fluctuation = (Math.random() - 0.5) * 0.04;
          const newPrice = Math.round(base.price * (1 + fluctuation));
          const baseOriginal = Math.round(base.price / (1 + base.change / 100));
          const newChange = parseFloat((((newPrice - baseOriginal) / baseOriginal) * 100).toFixed(2));
          return { ...s, price: newPrice, change: newChange };
        })
      );
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return stocks;
}

function getSortedStocks(stocks: typeof UNLISTED_STOCKS, tab: string) {
  let sorted = [...stocks];
  switch (tab) {
    case "거래많은":
      sorted.sort((a, b) => b.orders - a.orders);
      break;
    case "상승률 높은":
      sorted.sort((a, b) => b.change - a.change);
      break;
    case "상장준비 시작":
      sorted = sorted.filter((s) => s.ipoPrep || s.isIPO);
      break;
    case "예상시총 높은":
      sorted.sort((a, b) => b.marketCap - a.marketCap);
      break;
    case "매출이 상승한":
      sorted = sorted.filter((s) => s.revenueGrowth > 0).sort((a, b) => b.revenueGrowth - a.revenueGrowth);
      break;
    default:
      sorted.sort((a, b) => b.orders - a.orders);
      break;
  }
  return sorted.slice(0, 10).map((s, i) => ({ ...s, rank: i + 1 }));
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

          <nav className="hidden lg:flex items-center gap-1 shrink-0">
            {NAV_LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-[13px] text-[#666] px-2 py-1 whitespace-nowrap hover:text-[#222] transition-colors"
                data-testid={`link-nav-${link.label}`}
              >
                {link.label}
              </a>
            ))}
            <div className="ml-1 cursor-pointer" data-testid="button-notification">
              <SiteLogoBadge size={28} />
            </div>
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

function StockRankings() {
  const allStocks = useTickerPrices();
  const [activeTab, setActiveTab] = useState("일반종목");
  const displayStocks = getSortedStocks(allStocks, activeTab);

  const now = new Date();
  const timeStr = `${String(now.getFullYear()).slice(2)}.${String(now.getMonth() + 1).padStart(2, "0")}.${String(now.getDate()).padStart(2, "0")} ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")} 기준`;

  return (
    <section data-testid="section-stock-rankings">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-bold text-[#222]">종목 순위</h2>
          <span className="text-xs text-[#999]">{timeStr}</span>
        </div>
        <a href="#" className="text-sm text-[#999] flex items-center gap-0.5 hover:text-[#666]" data-testid="link-rankings-all">
          전체보기 <ChevronRight className="w-3.5 h-3.5" />
        </a>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-3 scrollbar-none">
        {RANKING_TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors ${
              activeTab === tab
                ? "bg-[#E8344E] text-white"
                : "bg-[#f5f5f5] text-[#666] hover:bg-[#eee]"
            }`}
            data-testid={`tab-ranking-${tab}`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="border border-[#eee] rounded-lg overflow-hidden">
        <div className="grid grid-cols-[40px_1fr_100px_80px_70px_50px] gap-0 px-4 py-2.5 bg-[#fafafa] text-xs text-[#999] border-b border-[#eee]">
          <span></span>
          <span>종목명</span>
          <span className="text-right flex items-center justify-end gap-0.5">체결평균가 <span className="text-[10px]">&#9660;</span></span>
          <span className="text-right">등락률</span>
          <span className="text-right">전체주문</span>
          <span className="text-right">구분</span>
        </div>
        {displayStocks.map((stock) => (
          <div
            key={stock.code}
            className="grid grid-cols-[40px_1fr_100px_80px_70px_50px] gap-0 px-4 py-3 border-b border-[#f5f5f5] last:border-b-0 hover:bg-[#fafafa] transition-colors cursor-pointer items-center"
            data-testid={`row-stock-${stock.code}`}
          >
            <span className="text-sm text-[#999] font-medium">{stock.rank}</span>
            <div className="flex items-center gap-2.5">
              <StockIcon name={stock.name} size={32} />
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-medium text-[#222]">{stock.name}</span>
                {stock.isIPO && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#E8344E] text-white font-medium leading-none">IPO</span>
                )}
              </div>
            </div>
            <span className="text-sm text-[#222] text-right tabular-nums font-medium">{stock.price.toLocaleString()}원</span>
            <span className={`text-sm text-right tabular-nums font-medium ${stock.change > 0 ? "text-[#f04452]" : stock.change < 0 ? "text-[#3182f6]" : "text-[#999]"}`}>
              {stock.change > 0 ? "+" : ""}{stock.change.toFixed(2)}%
            </span>
            <span className="text-sm text-[#666] text-right tabular-nums">{stock.orders}건</span>
            <span className="text-xs text-[#999] text-right">{stock.category}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function MajorNews() {
  const { data: newsData } = useQuery<{ title: string; source: string; date: string; url?: string }[]>({
    queryKey: ["/api/stocks/news"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  const fallbackNews = [
    { title: "케이뱅크, IPO 재추진...올해 상반기 상장 목표", source: "한국경제", date: "2026.02.15", color: "#E8344E" },
    { title: "두나무, 4분기 영업이익 전년비 120% 증가", source: "매일경제", date: "2026.02.14", color: "#333" },
    { title: "무신사, 해외 시장 진출 가속화...동남아 공략", source: "조선비즈", date: "2026.02.13", color: "#111" },
    { title: "비상장 주식 거래, 2026년 규제 변화 전망", source: "서울경제", date: "2026.02.12", color: "#1976D2" },
    { title: "컬리, 흑자전환 성공...IPO 재시동", source: "머니투데이", date: "2026.02.11", color: "#5F0080" },
  ];

  const news = newsData || fallbackNews;

  return (
    <section data-testid="section-major-news">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-bold text-[#222]">주요 뉴스</h2>
        <a href="#" className="text-sm text-[#999] flex items-center gap-0.5 hover:text-[#666]" data-testid="link-news-all">
          전체보기 <ChevronRight className="w-3.5 h-3.5" />
        </a>
      </div>
      <div className="space-y-0 border border-[#eee] rounded-lg overflow-hidden">
        {(news as any[]).slice(0, 5).map((item: any, i: number) => (
          <div
            key={i}
            className="flex items-start gap-3 px-4 py-3.5 border-b border-[#f5f5f5] last:border-b-0 hover:bg-[#fafafa] transition-colors cursor-pointer"
            data-testid={`row-news-${i}`}
          >
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0 mt-0.5"
              style={{ backgroundColor: item.color || "#E8344E" }}
            >
              N
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-[#222] leading-snug line-clamp-2">{item.title}</p>
              <p className="text-xs text-[#999] mt-1">{item.source} · {item.date}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function ExpertReports() {
  return (
    <section data-testid="section-expert-reports">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-bold text-[#222]">전문가 리포트</h2>
        <a href="#" className="text-sm text-[#999] flex items-center gap-0.5 hover:text-[#666]" data-testid="link-reports-all">
          전체보기 <ChevronRight className="w-3.5 h-3.5" />
        </a>
      </div>
      <div className="space-y-0 border border-[#eee] rounded-lg overflow-hidden">
        {EXPERT_REPORTS.map((report, i) => (
          <div
            key={i}
            className="flex items-start gap-3 px-4 py-3.5 border-b border-[#f5f5f5] last:border-b-0 hover:bg-[#fafafa] transition-colors cursor-pointer"
            data-testid={`row-report-${i}`}
          >
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0 mt-0.5"
              style={{ backgroundColor: report.color }}
            >
              <BookOpen className="w-3.5 h-3.5" />
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
    <section data-testid="section-theme-stocks">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-bold text-[#222]">테마별 종목</h2>
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
    <section data-testid="section-popular-discussions">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-bold text-[#222]">인기 토론</h2>
        <a href="#" className="text-sm text-[#999] flex items-center gap-0.5 hover:text-[#666]" data-testid="link-discussions-all">
          전체보기 <ChevronRight className="w-3.5 h-3.5" />
        </a>
      </div>
      <div className="space-y-0 border border-[#eee] rounded-lg overflow-hidden">
        {DISCUSSIONS.map((post) => (
          <div
            key={post.id}
            className="px-4 py-3.5 border-b border-[#f5f5f5] last:border-b-0 hover:bg-[#fafafa] transition-colors cursor-pointer"
            data-testid={`row-discussion-${post.id}`}
          >
            <div className="flex items-center gap-2 mb-2">
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold"
                style={{ backgroundColor: post.avatar }}
              >
                {post.user.charAt(0)}
              </div>
              <span className="text-sm font-medium text-[#222]">{post.user}</span>
              <span className="text-xs text-[#999]">{post.time}</span>
            </div>
            <p className="text-sm text-[#444] leading-relaxed mb-2">{post.content}</p>
            <div className="flex items-center gap-2">
              <span className="text-xs px-2 py-0.5 bg-[#f5f5f5] rounded text-[#666]">{post.tag}</span>
              <MessageCircle className="w-3.5 h-3.5 text-[#999]" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function UpcomingIPOs() {
  const [activeIPOTab, setActiveIPOTab] = useState("청약예정");

  return (
    <div data-testid="section-upcoming-ipos">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-bold text-[#222]">다가오는 청약 종목</h2>
        <a href="#" className="text-xs text-[#E8344E] flex items-center gap-0.5 hover:underline" data-testid="link-ipo-calendar">
          IPO 캘린더 보기 <ChevronRight className="w-3 h-3" />
        </a>
      </div>

      <div className="flex items-center gap-0 border-b border-[#eee] mb-3">
        <button
          onClick={() => setActiveIPOTab("청약진행중")}
          className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeIPOTab === "청약진행중"
              ? "border-[#E8344E] text-[#E8344E]"
              : "border-transparent text-[#999]"
          }`}
          data-testid="tab-ipo-ongoing"
        >
          청약진행중
        </button>
        <button
          onClick={() => setActiveIPOTab("청약예정")}
          className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-1 ${
            activeIPOTab === "청약예정"
              ? "border-[#E8344E] text-[#E8344E]"
              : "border-transparent text-[#999]"
          }`}
          data-testid="tab-ipo-upcoming"
        >
          청약예정
          <span className="text-[10px] bg-[#E8344E] text-white rounded-full w-4 h-4 flex items-center justify-center leading-none">9</span>
        </button>
      </div>

      <div className="space-y-3">
        {UPCOMING_IPOS.map((ipo, i) => (
          <div
            key={i}
            className="border border-[#eee] rounded-lg p-3.5 hover:border-[#ddd] transition-colors cursor-pointer"
            data-testid={`card-ipo-${i}`}
          >
            <div className="flex items-center gap-2 mb-2.5">
              <span className="text-[10px] font-bold text-[#E8344E] leading-none">D-{ipo.dDay}</span>
              <span className="text-xs text-[#999]">{ipo.date}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <StockIcon name={ipo.name} size={36} />
                <div>
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="text-sm font-bold text-[#222]">{ipo.name}</span>
                    {"label" in ipo && (ipo as any).label && (
                      <span className="text-[10px] text-[#E8344E] font-medium">{(ipo as any).label}</span>
                    )}
                  </div>
                  <p className="text-xs text-[#666]">공모가 {ipo.priceRange}</p>
                  <p className="text-xs text-[#999]">기관경쟁률 {ipo.competition}</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-[#ccc] shrink-0" />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 text-center">
        <a href="#" className="inline-flex items-center gap-1 text-sm text-[#666] border border-[#eee] rounded-full px-5 py-2 hover:bg-[#fafafa] transition-colors" data-testid="link-more-ipos">
          종목 더보기 <ChevronRight className="w-3.5 h-3.5" />
        </a>
      </div>
    </div>
  );
}

function Tips() {
  const tips = [
    { icon: <Award className="w-5 h-5 text-[#E8344E]" />, title: "이것만 따라하세요!", desc: "증권플러스 비상장 이용가이드" },
    { icon: <HelpCircle className="w-5 h-5 text-[#1976D2]" />, title: "비상장 거래, 궁금해요!", desc: "자주하는 질문" },
    { icon: <BookOpen className="w-5 h-5 text-[#43A047]" />, title: "꼭 알아야 할 비상장 기본상식!", desc: "비상장 주식 101" },
  ];

  return (
    <div data-testid="section-tips">
      <h2 className="text-base font-bold text-[#222] mb-3">비상장 꿀팁</h2>
      <div className="space-y-0 border border-[#eee] rounded-lg overflow-hidden">
        {tips.map((tip, i) => (
          <div
            key={i}
            className="flex items-center gap-3 px-4 py-3.5 border-b border-[#f5f5f5] last:border-b-0 hover:bg-[#fafafa] transition-colors cursor-pointer"
            data-testid={`row-tip-${i}`}
          >
            <div className="w-9 h-9 rounded-lg bg-[#f5f5f5] flex items-center justify-center shrink-0">
              {tip.icon}
            </div>
            <div>
              <p className="text-sm font-medium text-[#222]">{tip.title}</p>
              <p className="text-xs text-[#999]">{tip.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function HotDiscussionRooms() {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: "left" | "right") => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: dir === "left" ? -200 : 200, behavior: "smooth" });
    }
  };

  return (
    <div data-testid="section-hot-rooms">
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
            className="shrink-0 w-[160px] border border-[#eee] rounded-lg p-3 hover:border-[#ddd] transition-colors cursor-pointer"
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

  return (
    <div className="min-h-screen bg-white" data-testid="page-landing">
      <Header user={user ?? null} />

      <div className="flex justify-center py-2">
        <span className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-[#E8344E] text-white text-xs font-medium rounded-full cursor-pointer hover:bg-[#d42e45] transition-colors" data-testid="banner-update">
          업데이트 됐어요!
        </span>
      </div>

      <main className="max-w-[1200px] mx-auto px-4 py-4">
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1 min-w-0 space-y-8">
            <StockRankings />
            <MajorNews />
            <ExpertReports />
            <ThemeStocks />
            <PopularDiscussions />
          </div>

          <aside className="w-full lg:w-[340px] shrink-0 space-y-8">
            <UpcomingIPOs />
            <Tips />
            <HotDiscussionRooms />
          </aside>
        </div>
      </main>

      <Footer />

      <style>{`
        .scrollbar-none::-webkit-scrollbar { display: none; }
        .scrollbar-none { -ms-overflow-style: none; scrollbar-width: none; }
        .line-clamp-2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
      `}</style>
    </div>
  );
}