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
  { name: "케이뱅크", dDay: 5, date: "02.20 예정", priceRange: "7,000 ~ 8,500원", competition: "198.53:1", label: "매수가능", status: "청약예정" as const },
  { name: "에스팀", dDay: 8, date: "02.23 예정", priceRange: "7,000 ~ 8,500원", competition: "-", status: "청약예정" as const },
  { name: "엑스비스", dDay: 8, date: "02.23 예정", priceRange: "10,100 ~ 11,500원", competition: "-", status: "청약예정" as const },
  { name: "무신사", dDay: 0, date: "02.14 ~ 02.15", priceRange: "24,000 ~ 25,700원", competition: "312.7:1", label: "청약중", status: "청약진행중" as const },
  { name: "두나무", dDay: 0, date: "02.13 ~ 02.16", priceRange: "280,000 ~ 310,000원", competition: "87.2:1", label: "청약중", status: "청약진행중" as const },
];

const HOT_ROOMS = [
  { name: "케이뱅크", tags: ["#IPO", "#은행"], count: 1284 },
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

function StockRankings() {
  const allStocks = useTickerPrices();
  const [activeTab, setActiveTab] = useState("일반종목");
  const displayStocks = getSortedStocks(allStocks, activeTab);

  const now = new Date();
  const timeStr = `${String(now.getFullYear()).slice(2)}.${String(now.getMonth() + 1).padStart(2, "0")}.${String(now.getDate()).padStart(2, "0")} ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")} 기준`;

  return (
    <section id="rankings" data-testid="section-stock-rankings">
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
    { title: "케이뱅크, IPO 재추진...올해 상반기 상장 목표", source: "한국경제", date: "2026.02.15", color: "#E8344E" },
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
          전체보기 <ChevronRight className="w-3.5 h-3.5" />
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
    <div id="ipos" data-testid="section-upcoming-ipos">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-bold text-[#222]">다가오는 청약 종목</h2>
        <a href="/ipo-calendar" className="text-xs text-[#E8344E] flex items-center gap-0.5 hover:underline" data-testid="link-ipo-calendar">
          IPO 캘린더 보기 <ChevronRight className="w-3 h-3" />
        </a>
      </div>

      <div className="flex items-center gap-0 border-b border-[#eee] mb-3">
        <button
          onClick={() => setActiveIPOTab("청약진행중")}
          className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-1 ${
            activeIPOTab === "청약진행중"
              ? "border-[#E8344E] text-[#E8344E]"
              : "border-transparent text-[#999]"
          }`}
          data-testid="tab-ipo-ongoing"
        >
          청약진행중
          <span className="text-[10px] bg-[#E8344E] text-white rounded-full w-4 h-4 flex items-center justify-center leading-none">{UPCOMING_IPOS.filter(i => i.status === "청약진행중").length}</span>
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
          <span className="text-[10px] bg-[#E8344E] text-white rounded-full w-4 h-4 flex items-center justify-center leading-none">{UPCOMING_IPOS.filter(i => i.status === "청약예정").length}</span>
        </button>
      </div>

      <div className="space-y-3">
        {UPCOMING_IPOS.filter(ipo => ipo.status === activeIPOTab).map((ipo, i) => (
          <div
            key={i}
            className="border border-[#eee] rounded-lg p-3.5 hover:border-[#ddd] transition-colors cursor-pointer"
            data-testid={`card-ipo-${i}`}
          >
            <div className="flex items-center gap-2 mb-2.5">
              <span className="text-[10px] font-bold text-[#E8344E] leading-none">{ipo.status === "청약진행중" ? "진행중" : `D-${ipo.dDay}`}</span>
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
        <a href="/ipo-calendar" className="inline-flex items-center gap-1 text-sm text-[#666] border border-[#eee] rounded-full px-5 py-2 hover:bg-[#fafafa] transition-colors" data-testid="link-more-ipos">
          종목 더보기 <ChevronRight className="w-3.5 h-3.5" />
        </a>
      </div>
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
  "케이뱅크": [
    { user: "투자왕김씨", text: "IPO 공모가 8300원이면 적정한 것 같은데, 다들 어떻게 생각하세요?", time: "방금 전" },
    { user: "비상장고수", text: "기관경쟁률이 198:1이면 꽤 높은 편이죠. 긍정적으로 봅니다", time: "1분 전" },
    { user: "주식초보", text: "PBR 1.38배면 은행주 중에서는 어떤 수준인가요?", time: "2분 전" },
    { user: "장기투자자", text: "카카오뱅크 상장 때랑 비교하면 밸류에이션이 합리적이라고 봅니다", time: "3분 전" },
    { user: "분석가A", text: "FI 지분 매각 이슈가 해소되면 주가 상승 여력 충분합니다", time: "5분 전" },
    { user: "비상장매니아", text: "비상장에서 11,600원에 거래되고 있으니 공모가 대비 프리미엄이 있네요", time: "7분 전" },
    { user: "공모주헌터", text: "이번에 꼭 청약 성공하고 싶네요. 증거금 얼마나 넣어야 할까요?", time: "8분 전" },
    { user: "경제전문가", text: "올해 상반기 최대 IPO가 될 것 같습니다. 시장 관심도가 높아요", time: "10분 전" },
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

  return (
    <div className="min-h-screen bg-white" data-testid="page-landing">
      <Header user={user ?? null} />

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
        html { scroll-behavior: smooth; }
        [id] { scroll-margin-top: 70px; }
      `}</style>
    </div>
  );
}