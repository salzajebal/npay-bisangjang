import { useState, useMemo } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight, ChevronLeft, ChevronRight as ChevRight, ArrowLeft, Info, HelpCircle, ExternalLink } from "lucide-react";
import { SiteLogoBadge } from "@/components/site-logo";
import { StockIcon } from "@/components/stock-icon";
import type { IpoStock } from "@shared/schema";

type PageTab = "calendar" | "trade" | "faq";
type SidebarTab = "being" | "tobe";

interface NaverIpoItem {
  stockName: string;
  stockCode: string;
  logoUrl?: string | null;
  closedDate?: string;
  offeringStartAt?: string;
  minExpectedOfferPrice?: number;
  maxExpectedOfferPrice?: number;
  finalOfferPrice?: number | null;
  instCompetitiveness?: number | null;
  ipoDetailState?: string;
  hasSellBoard?: boolean;
  isAvail?: boolean;
}

interface NaverIpoCalendarData {
  beingIPOList: NaverIpoItem[];
  toBeIPOList: NaverIpoItem[];
  readyToIpoStocks: any[];
  ipoNews: any[];
  popularStocks: any[];
  newlyListedStocks: any[];
}

interface IpoCalendarApiResponse {
  naverData: NaverIpoCalendarData;
  lastUpdated: string | null;
}

interface CalEvent {
  name: string;
  start: Date;
  end: Date;
  color: string;
  bgColor: string;
  status: string;
  priceRange: string;
  competition: string;
  logoUrl?: string | null;
}

const STATUS_LEGEND = [
  { label: "주관사선정", color: "#E8F5E9", border: "#81C784" },
  { label: "기술평가가통과", color: "#E3F2FD", border: "#90CAF9" },
  { label: "심사청구", color: "#FFF3E0", border: "#FFCC02" },
  { label: "심사승인", color: "#FCE4EC", border: "#F48FB1" },
  { label: "신고서제출", color: "#F3E5F5", border: "#CE93D8" },
  { label: "수요예측", color: "#E8EAF6", border: "#9FA8DA" },
  { label: "공모청약", color: "#FCDDE1", border: "#EF9A9A" },
  { label: "상장", color: "#E0F2F1", border: "#80CBC4" },
  { label: "환불", color: "#FFF8E1", border: "#FFD54F" },
  { label: "배정", color: "#F1F8E9", border: "#AED581" },
];

const FAQ_ITEMS = [
  { q: "IPO, 공모주 청약이 무슨 뜻인가요?", a: "IPO(Initial Public Offering)는 기업이 처음으로 주식시장에 상장하여 일반 투자자에게 주식을 공개 판매하는 것을 말합니다. 공모주 청약은 상장 전 일정 기간 동안 투자자들이 해당 주식을 신청(청약)하는 과정입니다." },
  { q: "기업은 IPO(기업공개)를 왜 하나요?", a: "기업은 자금 조달, 기업 인지도 향상, 초기 투자자의 투자금 회수 등을 위해 IPO를 진행합니다. 상장을 통해 기업의 가치가 공개적으로 평가되며, 더 넓은 투자자층에 접근할 수 있습니다." },
  { q: "IPO 절차는 어떻게 진행되나요?", a: "IPO는 주관사 선정 → 기업실사 및 가치평가 → 증권신고서 제출 → 수요예측 → 공모가 확정 → 청약 → 배정 → 상장의 순서로 진행됩니다." },
  { q: "공모주 청약을 하고 싶은데, 공모가는 어떻게 정해지나요?", a: "공모가는 기관투자자를 대상으로 한 수요예측 결과를 바탕으로 결정됩니다. 희망 공모가 밴드를 설정한 뒤, 기관들의 수요를 파악하여 최종 공모가를 확정합니다." },
  { q: "공모주에 참여할지 말지 결정하는 데에 도움이 되는 기준이 있나요?", a: "기관 경쟁률, 의무보유 확약 비율, 기업의 재무 상태와 성장성, 동종 업계 대비 밸류에이션 등을 종합적으로 고려하여 판단하시는 것이 좋습니다." },
];

function fmtMD(iso?: string): string {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    return `${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
  } catch { return ""; }
}

function fmtPrice(min?: number, max?: number, final?: number | null): string {
  if (final && final > 0) return `${final.toLocaleString()}원`;
  if (min && max && min !== max) return `${min.toLocaleString()} ~ ${max.toLocaleString()}원`;
  if (min) return `${min.toLocaleString()}원`;
  return "-";
}

function fmtDDay(dateStr?: string): string | null {
  if (!dateStr) return null;
  try {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const target = new Date(dateStr); target.setHours(0, 0, 0, 0);
    const diff = Math.ceil((target.getTime() - today.getTime()) / 86400000);
    return diff > 0 ? `D-${diff}` : diff === 0 ? "D-Day" : null;
  } catch { return null; }
}

function addDays(dateStr: string, days: number): Date {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d;
}

function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function dateInRange(d: Date, start: Date, end: Date) {
  const t = d.getTime(); return t >= start.getTime() && t <= end.getTime();
}

function getMonthWeeks(year: number, month: number): Date[][] {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const mon = new Date(firstDay);
  const dow = firstDay.getDay();
  mon.setDate(firstDay.getDate() - (dow === 0 ? 6 : dow - 1));
  const weeks: Date[][] = [];
  const cur = new Date(mon);
  while (true) {
    const week: Date[] = [];
    for (let i = 0; i < 5; i++) {
      week.push(new Date(cur));
      cur.setDate(cur.getDate() + 1);
    }
    weeks.push(week);
    cur.setDate(cur.getDate() + 2);
    if (week[4] >= lastDay) break;
    if (weeks.length > 6) break;
  }
  return weeks;
}

const IPO_STATE_MAP: Record<string, { label: string; color: string; bgColor: string }> = {
  "EXAMINATION_REQUESTED":     { label: "심사청구",   color: "#7d5a00", bgColor: "#FFF3E0" },
  "EXAMINATION_APPROVED":      { label: "심사승인",   color: "#880e4f", bgColor: "#FCE4EC" },
  "REPORT_SUBMITTED":          { label: "신고서제출", color: "#4a148c", bgColor: "#F3E5F5" },
  "DEMAND_FORECAST":           { label: "수요예측",   color: "#1a237e", bgColor: "#E8EAF6" },
  "OFFER_SUBSCRIPTION":        { label: "공모청약",   color: "#c0392b", bgColor: "#FCDDE1" },
  "TO_BE_OFFER_SUBSCRIPTION":  { label: "청약예정",   color: "#6c3483", bgColor: "#D7C8E8" },
  "REFUND":                    { label: "환불",       color: "#b7601e", bgColor: "#FFF8E1" },
  "ALLOCATION":                { label: "배정",       color: "#33691e", bgColor: "#F1F8E9" },
  "LISTING":                   { label: "상장",       color: "#004d40", bgColor: "#E0F2F1" },
};

function buildDbCalEvents(dbStocks: IpoStock[]): CalEvent[] {
  const events: CalEvent[] = [];
  for (const stock of dbStocks) {
    if (!stock.stockName || !stock.startDate || !stock.endDate) continue;
    const start = new Date(stock.startDate);
    const end = new Date(stock.endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) continue;

    let color = "#c0392b", bgColor = "#FCDDE1", status = "공모청약";
    if (stock.subscriptionStatus === "청약예정") {
      color = "#6c3483"; bgColor = "#D7C8E8"; status = "청약예정";
    } else if (stock.subscriptionStatus === "청약진행중") {
      color = "#c0392b"; bgColor = "#FCDDE1"; status = "공모청약";
    }

    events.push({
      name: stock.stockName, start, end,
      color, bgColor, status,
      priceRange: stock.priceMin && stock.priceMax
        ? `${stock.priceMin.toLocaleString()} ~ ${stock.priceMax.toLocaleString()}원`
        : "-",
      competition: stock.competitionRate || "-",
      logoUrl: null,
    });
  }
  return events;
}

function buildCalEvents(naverData: NaverIpoCalendarData): CalEvent[] {
  const events: CalEvent[] = [];

  for (const ipo of naverData.beingIPOList || []) {
    if (!ipo.stockName || !ipo.closedDate) continue;
    const end = new Date(ipo.closedDate);
    const start = addDays(ipo.closedDate, -1);
    events.push({
      name: ipo.stockName, start, end,
      color: "#c0392b", bgColor: "#FCDDE1", status: "공모청약",
      priceRange: fmtPrice(ipo.minExpectedOfferPrice, ipo.maxExpectedOfferPrice, ipo.finalOfferPrice),
      competition: ipo.instCompetitiveness ? `${ipo.instCompetitiveness.toLocaleString()}:1` : "-",
      logoUrl: ipo.logoUrl || null,
    });
  }

  for (const ipo of naverData.toBeIPOList || []) {
    if (!ipo.stockName || !ipo.offeringStartAt) continue;
    const start = new Date(ipo.offeringStartAt);
    const end = addDays(ipo.offeringStartAt, 1);
    events.push({
      name: ipo.stockName, start, end,
      color: "#6c3483", bgColor: "#D7C8E8", status: "청약예정",
      priceRange: fmtPrice(ipo.minExpectedOfferPrice, ipo.maxExpectedOfferPrice, ipo.finalOfferPrice),
      competition: ipo.instCompetitiveness ? `${ipo.instCompetitiveness.toLocaleString()}:1` : "-",
      logoUrl: ipo.logoUrl || null,
    });
  }

  for (const stock of naverData.readyToIpoStocks || []) {
    if (!stock.stockName || !stock.ipoDate) continue;
    const stateInfo = IPO_STATE_MAP[stock.ipoState as string] || { label: stock.ipoState || "준비중", color: "#555", bgColor: "#f5f5f5" };
    const start = new Date(stock.ipoDate);
    const end = new Date(stock.ipoDate);
    events.push({
      name: stock.stockName, start, end,
      color: stateInfo.color, bgColor: stateInfo.bgColor,
      status: stateInfo.label,
      priceRange: "-",
      competition: "-",
      logoUrl: stock.logoUrl || null,
    });
  }

  for (const stock of naverData.newlyListedStocks || []) {
    if (!stock.name || !stock.listingAt) continue;
    const start = new Date(stock.listingAt);
    const end = new Date(stock.listingAt);
    events.push({
      name: stock.name, start, end,
      color: "#004d40", bgColor: "#E0F2F1",
      status: "상장",
      priceRange: stock.finalOfferPrice ? `${stock.finalOfferPrice.toLocaleString()}원` : "-",
      competition: stock.changeRateFromLowestPrice != null ? `${stock.changeRateFromLowestPrice > 0 ? "+" : ""}${stock.changeRateFromLowestPrice}%` : "-",
      logoUrl: stock.logoUrl || null,
    });
  }

  return events;
}

function CalendarGrid({ year, month, events }: { year: number; month: number; events: CalEvent[] }) {
  const weeks = useMemo(() => getMonthWeeks(year, month), [year, month]);
  const dayNames = ["월", "화", "수", "목", "금"];
  const today = new Date(); today.setHours(0, 0, 0, 0);

  function getWeekLanes(week: Date[]) {
    const weekFirst = week[0].getTime();
    const weekLast = week[4].getTime();
    const applicable = events.filter(ev =>
      ev.start.getTime() <= weekLast && ev.end.getTime() >= weekFirst
    );
    const lanes: (CalEvent | null)[][] = [];
    for (const ev of applicable) {
      const evStart = ev.start.getTime() > weekFirst ? ev.start : week[0];
      const evEnd = ev.end.getTime() < weekLast ? ev.end : week[4];
      let placed = false;
      for (const lane of lanes) {
        let canPlace = true;
        for (let i = 0; i < 5; i++) {
          if (dateInRange(week[i], evStart, evEnd) && lane[i] !== null) { canPlace = false; break; }
        }
        if (canPlace) {
          for (let i = 0; i < 5; i++) {
            if (dateInRange(week[i], evStart, evEnd)) lane[i] = ev;
          }
          placed = true; break;
        }
      }
      if (!placed) {
        const newLane: (CalEvent | null)[] = [null, null, null, null, null];
        for (let i = 0; i < 5; i++) {
          if (dateInRange(week[i], evStart, evEnd)) newLane[i] = ev;
        }
        lanes.push(newLane);
      }
    }
    return lanes;
  }

  return (
    <div className="border border-[#E0E2E4] rounded-lg overflow-hidden" data-testid="calendar-grid">
      <div className="grid grid-cols-5 border-b border-[#E0E2E4]">
        {dayNames.map(d => (
          <div key={d} className="px-2 py-2.5 text-[13px] text-[#9D9FA0] font-medium text-center border-r border-[#E0E2E4] last:border-r-0 bg-white">{d}</div>
        ))}
      </div>
      {weeks.map((week, wi) => {
        const lanes = getWeekLanes(week);
        return (
          <div key={wi} className="border-b border-[#E0E2E4] last:border-b-0">
            <div className="grid grid-cols-5">
              {week.map((day, di) => {
                const isThisMonth = day.getMonth() === month;
                const isToday = sameDay(day, today);
                return (
                  <div key={di} className={`border-r border-[#E0E2E4] last:border-r-0 px-2 pt-1.5 pb-0.5 ${isToday ? "bg-[#F3F5F6]" : "bg-white"}`}>
                    <div className={`text-[12px] text-right leading-none py-0.5 ${isThisMonth ? "text-[#14181B]" : "text-[#C5C7CB]"}`}>
                      {isToday
                        ? <span className="inline-flex items-center justify-center w-[22px] h-[22px] rounded-full bg-[#14181B] text-white text-[11px] font-bold">{day.getDate()}</span>
                        : <span className="inline-flex items-center justify-center w-[22px] h-[22px]">{day.getDate()}</span>
                      }
                    </div>
                  </div>
                );
              })}
            </div>
            {lanes.length > 0 && (
              <div className="pb-1 px-0.5 bg-white" style={{ minHeight: lanes.length * 26 }}>
                {lanes.map((lane, li) => {
                  const cells: JSX.Element[] = [];
                  let col = 0;
                  while (col < 5) {
                    const ev = lane[col];
                    if (!ev) {
                      cells.push(<div key={col} style={{ flex: 1, minWidth: 0 }} />);
                      col++;
                    } else {
                      let span = 1;
                      while (col + span < 5 && lane[col + span] === ev) span++;
                      const isStart = col === 0 || lane[col - 1] !== ev;
                      const isEnd = col + span >= 5 || lane[col + span] !== ev;
                      cells.push(
                        <div
                          key={col}
                          style={{ flex: span, backgroundColor: ev.bgColor, borderRadius: isStart && isEnd ? 4 : isStart ? "4px 0 0 4px" : isEnd ? "0 4px 4px 0" : 0, marginLeft: isStart ? 1 : 0, marginRight: isEnd ? 1 : 0 }}
                          className="h-[22px] flex items-center px-1 gap-1 overflow-hidden"
                          title={`${ev.name} (${ev.status})`}
                        >
                          {isStart && (
                            <>
                              {ev.logoUrl ? (
                                <img
                                  src={ev.logoUrl}
                                  alt=""
                                  className="w-[14px] h-[14px] rounded-full object-cover shrink-0 bg-white"
                                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                                />
                              ) : (
                                <span className="w-[14px] h-[14px] rounded-full shrink-0 flex items-center justify-center text-[8px] font-bold" style={{ backgroundColor: ev.color + "33", color: ev.color }}>
                                  {ev.name.charAt(0)}
                                </span>
                              )}
                              <span className="text-[10px] font-medium truncate leading-none" style={{ color: ev.color }}>{ev.name}</span>
                            </>
                          )}
                        </div>
                      );
                      col += span;
                    }
                  }
                  return <div key={li} className="flex mb-[2px] bg-white">{cells}</div>;
                })}
              </div>
            )}
            {lanes.length === 0 && <div className="bg-white" style={{ minHeight: 36 }} />}
          </div>
        );
      })}
    </div>
  );
}

function CalendarSection() {
  const today = new Date();
  const [calYear, setCalYear] = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth());
  const [sidebarTab, setSidebarTab] = useState<SidebarTab>("being");

  const { data: ipoApiData, isLoading } = useQuery<IpoCalendarApiResponse>({
    queryKey: ["/api/market/ipo-calendar"],
    refetchInterval: 5 * 60 * 1000,
  });

  const { data: dbStocks = [] } = useQuery<IpoStock[]>({
    queryKey: ["/api/ipo-stocks"],
  });

  const naverData = ipoApiData?.naverData;

  const events = useMemo(() => {
    const naverEvents = naverData ? buildCalEvents(naverData) : [];
    const dbEvents = buildDbCalEvents(dbStocks);
    // 중복 제거: DB 종목명이 Naver에도 있으면 DB 우선
    const naverNames = new Set(dbEvents.map(e => e.name));
    const filteredNaver = naverEvents.filter(e => !naverNames.has(e.name));
    return [...dbEvents, ...filteredNaver];
  }, [naverData, dbStocks]);

  const beingIPO = naverData?.beingIPOList || [];
  const toBeIPO = naverData?.toBeIPOList || [];
  const readyIPO = naverData?.readyToIpoStocks || [];
  const ipoNews = naverData?.ipoNews || [];

  const monthName = `${calYear}년 ${calMonth + 1}월`;

  function prevMonth() {
    if (calMonth === 0) { setCalYear(y => y - 1); setCalMonth(11); }
    else setCalMonth(m => m - 1);
  }
  function nextMonth() {
    if (calMonth === 11) { setCalYear(y => y + 1); setCalMonth(0); }
    else setCalMonth(m => m + 1);
  }
  function goToday() { setCalYear(today.getFullYear()); setCalMonth(today.getMonth()); }

  // DB 종목을 사이드바 형식으로 변환
  const dbBeingIPO = dbStocks
    .filter(s => s.subscriptionStatus === "청약진행중")
    .map(s => ({
      stockName: s.stockName,
      stockCode: s.id,
      closedDate: s.endDate,
      offeringStartAt: s.startDate,
      minExpectedOfferPrice: s.priceMin,
      maxExpectedOfferPrice: s.priceMax,
      finalOfferPrice: null,
      instCompetitiveness: s.competitionRate ? parseFloat(s.competitionRate) : null,
      logoUrl: null,
      _fromDb: true,
    }));

  const dbToBeIPO = dbStocks
    .filter(s => s.subscriptionStatus === "청약예정")
    .map(s => ({
      stockName: s.stockName,
      stockCode: s.id,
      closedDate: s.endDate,
      offeringStartAt: s.startDate,
      minExpectedOfferPrice: s.priceMin,
      maxExpectedOfferPrice: s.priceMax,
      finalOfferPrice: null,
      instCompetitiveness: s.competitionRate ? parseFloat(s.competitionRate) : null,
      logoUrl: null,
      _fromDb: true,
    }));

  // Naver 데이터와 합치되 DB에 있는 종목은 제외
  const dbBeingNames = new Set(dbBeingIPO.map(s => s.stockName));
  const dbToBeNames = new Set(dbToBeIPO.map(s => s.stockName));
  const mergedBeingIPO = [...dbBeingIPO, ...beingIPO.filter((s: any) => !dbBeingNames.has(s.stockName))];
  const mergedToBeIPO = [...dbToBeIPO, ...toBeIPO.filter((s: any) => !dbToBeNames.has(s.stockName))];

  const currentSidebarItems = sidebarTab === "being" ? mergedBeingIPO : mergedToBeIPO;

  return (
    <div className="max-w-[1200px] mx-auto px-4 py-6">
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5">
              <span className="text-base font-bold text-[#14181B]">{monthName}</span>
              <button className="text-[#9D9FA0]"><HelpCircle className="w-4 h-4" /></button>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={prevMonth} className="w-8 h-8 flex items-center justify-center rounded border border-[#E0E2E4] text-[#585B5E] hover:bg-[#F9FAFB] transition-colors" data-testid="button-cal-prev">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button onClick={goToday} className="h-8 px-3 rounded border border-[#E0E2E4] text-[13px] text-[#585B5E] hover:bg-[#F9FAFB] transition-colors" data-testid="button-cal-today">오늘</button>
              <button onClick={nextMonth} className="w-8 h-8 flex items-center justify-center rounded border border-[#E0E2E4] text-[#585B5E] hover:bg-[#F9FAFB] transition-colors" data-testid="button-cal-next">
                <ChevRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5 mb-4">
            {STATUS_LEGEND.map(({ label, bgColor, border }: any) => (
              <span key={label} className="inline-flex items-center gap-1 text-[11px] text-[#585B5E] px-2 py-0.5 rounded-full border" style={{ backgroundColor: bgColor || "#F9FAFB", borderColor: border || "#E0E2E4" }}>
                {label}
              </span>
            ))}
          </div>

          {isLoading ? (
            <div className="border border-[#E0E2E4] rounded-lg overflow-hidden animate-pulse">
              <div className="h-10 bg-[#fafafa] border-b border-[#E0E2E4]" />
              {[...Array(5)].map((_, i) => <div key={i} className="h-24 border-b border-[#E0E2E4] last:border-b-0 bg-white" />)}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <div className="min-w-[460px]">
                <CalendarGrid year={calYear} month={calMonth} events={events} />
              </div>
            </div>
          )}

          {ipoNews.length > 0 && (
            <div className="mt-8">
              <h3 className="text-[15px] font-bold text-[#14181B] mb-3">IPO 뉴스</h3>
              <div className="divide-y divide-[#F3F5F6]">
                {ipoNews.slice(0, 5).map((news: any, i: number) => (
                  <a
                    key={i}
                    href={news.landingUrl || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-start gap-3 py-3 hover:bg-[#F9FAFB] px-1 rounded transition-colors"
                    data-testid={`ipo-news-${i}`}
                  >
                    {news.logoUrl ? (
                      <img src={news.logoUrl} alt="" className="w-9 h-9 rounded object-cover shrink-0" />
                    ) : (
                      <div className="w-9 h-9 rounded bg-[#E6E8EA] flex items-center justify-center shrink-0">
                        <span className="text-[11px] font-bold text-[#9D9FA0]">N</span>
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] text-[#14181B] line-clamp-2 leading-snug mb-0.5 font-medium">{news.title}</p>
                      <p className="text-[11px] text-[#9D9FA0]">{news.mediaIssuerName} · {news.publishedAt ? new Date(news.publishedAt).toLocaleDateString("ko-KR", { month: "long", day: "numeric" }) : ""}</p>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-[#C5C7CB] shrink-0 mt-0.5" />
                  </a>
                ))}
              </div>
            </div>
          )}

          <div className="mt-6 pt-4 border-t border-[#E0E2E4]">
            <div className="flex items-center gap-1.5 mb-2">
              <Info className="w-3.5 h-3.5 text-[#BFC0C1]" />
              <span className="text-[11px] font-medium text-[#9D9FA0]">유의사항</span>
            </div>
            <ul className="text-[11px] text-[#BFC0C1] space-y-1 list-disc pl-4">
              <li>모든 정보는 정보 제공을 위한 것으로, 투자 권유를 목적으로 하지 않습니다.</li>
              <li>제공되는 정보는 오류 또는 지연이 발생할 수 있으며, 책임을 지지 않습니다.</li>
              <li>데이터 출처: Npay 비상장 (ustock.naver.com)</li>
            </ul>
          </div>
        </div>

        <div className="lg:w-[296px] shrink-0">
          <h3 className="text-[15px] font-bold text-[#14181B] mb-3">다가오는 청약 종목</h3>

          <div className="flex border-b border-[#E0E2E4] mb-4">
            <button
              onClick={() => setSidebarTab("being")}
              className={`flex-1 py-2.5 text-[13px] font-bold border-b-2 transition-colors ${sidebarTab === "being" ? "border-[#14181B] text-[#14181B]" : "border-transparent text-[#9D9FA0]"}`}
              data-testid="sidebar-tab-being"
            >
              청약진행중 {mergedBeingIPO.length}
            </button>
            <button
              onClick={() => setSidebarTab("tobe")}
              className={`flex-1 py-2.5 text-[13px] font-bold border-b-2 transition-colors ${sidebarTab === "tobe" ? "border-[#14181B] text-[#14181B]" : "border-transparent text-[#9D9FA0]"}`}
              data-testid="sidebar-tab-tobe"
            >
              청약예정 {mergedToBeIPO.length}
            </button>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="border border-[#E0E2E4] rounded-xl p-4 animate-pulse">
                  <div className="h-3 w-24 bg-[#F3F5F6] rounded mb-3" />
                  <div className="flex gap-2">
                    <div className="w-10 h-10 bg-[#F3F5F6] rounded-full" />
                    <div className="flex-1">
                      <div className="h-4 w-20 bg-[#F3F5F6] rounded mb-1.5" />
                      <div className="h-3 w-28 bg-[#F3F5F6] rounded" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : currentSidebarItems.length === 0 ? (
            <div className="border border-[#E0E2E4] rounded-xl p-6 text-center">
              <p className="text-[13px] text-[#9D9FA0]">해당 청약 종목이 없습니다</p>
            </div>
          ) : (
            <div className="space-y-2">
              {currentSidebarItems.map((ipo, i) => {
                const isOngoing = sidebarTab === "being";
                const dateLabel = isOngoing
                  ? ipo.closedDate ? `${fmtMD(ipo.closedDate)} 마감` : "마감일 미정"
                  : ipo.offeringStartAt ? `${fmtMD(ipo.offeringStartAt)} 시작` : "일정 미정";
                const dday = !isOngoing ? fmtDDay(ipo.offeringStartAt) : null;
                const price = fmtPrice(ipo.minExpectedOfferPrice, ipo.maxExpectedOfferPrice, ipo.finalOfferPrice);
                return (
                  <div key={i} className="border border-[#E0E2E4] rounded-xl overflow-hidden" data-testid={`sidebar-ipo-${i}`}>
                    <div className="flex items-center gap-1.5 px-4 py-2 bg-[#F9FAFB] border-b border-[#E0E2E4]">
                      <span className={`text-[11px] font-bold ${isOngoing ? "text-[#03C75A]" : "text-[#9D9FA0]"}`}>
                        {isOngoing ? "진행중" : (dday || "예정")}
                      </span>
                      <span className="text-[11px] text-[#9D9FA0]">{dateLabel}</span>
                    </div>
                    <div className="flex items-center gap-3 px-4 py-3">
                      <StockIcon name={ipo.stockName} logoUrl={ipo.logoUrl || undefined} size={36} />
                      <div className="min-w-0 flex-1">
                        <p className="text-[14px] font-bold text-[#14181B] truncate">{ipo.stockName}</p>
                        {price !== "-" && (
                          <p className="text-[12px] text-[#585B5E] mt-0.5">
                            {isOngoing ? "공모가" : "희망가"} {price}
                          </p>
                        )}
                        {ipo.instCompetitiveness != null && (
                          <p className="text-[11px] text-[#9D9FA0]">기관경쟁률 {Number(ipo.instCompetitiveness).toLocaleString()}:1</p>
                        )}
                      </div>
                      <ChevRight className="w-4 h-4 text-[#C5C7CB] shrink-0" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {readyIPO.length > 0 && (
            <div className="mt-6">
              <h3 className="text-[14px] font-bold text-[#14181B] mb-2">상장 준비 중</h3>
              <div className="border border-[#E0E2E4] rounded-xl overflow-hidden">
                {readyIPO.slice(0, 6).map((ipo: any, i: number) => {
                  const labels: Record<string, string> = {
                    EXAMINATION_REQUESTED: "심사청구",
                    DEMAND_FORECAST: "수요예측",
                    APPROVED: "상장승인",
                    REGISTRATION_STATEMENT: "신고서제출",
                  };
                  const label = labels[ipo.ipoState] || "준비중";
                  return (
                    <div key={i} className="flex items-center gap-2 px-3 py-2.5 border-b border-[#F3F5F6] last:border-b-0" data-testid={`ready-ipo-${i}`}>
                      <StockIcon name={ipo.stockName} logoUrl={ipo.logoUrl || undefined} size={24} />
                      <p className="text-[12px] font-medium text-[#14181B] truncate flex-1">{ipo.stockName}</p>
                      <span className="text-[10px] text-[#9D9FA0] bg-[#F3F5F6] px-1.5 py-0.5 rounded shrink-0">{label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

type TradeTab = "being" | "tobe" | "listed";

function TradeSection() {
  const [tradeTab, setTradeTab] = useState<TradeTab>("being");

  const { data: ipoApiData, isLoading } = useQuery<IpoCalendarApiResponse>({
    queryKey: ["/api/market/ipo-calendar"],
    refetchInterval: 5 * 60 * 1000,
  });

  const naverData = ipoApiData?.naverData;
  const popularStocks: any[] = naverData?.popularStocks || [];
  const beingIPO: NaverIpoItem[] = naverData?.beingIPOList || [];
  const toBeIPO: NaverIpoItem[] = naverData?.toBeIPOList || [];
  const newlyListed: any[] = naverData?.newlyListedStocks || [];

  const popularMap = useMemo(() => {
    const m: Record<string, any> = {};
    for (const s of popularStocks) m[s.stockCode] = s;
    return m;
  }, [popularStocks]);

  const currentTab = tradeTab === "being" ? beingIPO : tradeTab === "tobe" ? toBeIPO : newlyListed;

  function fmtTimeAgo(iso?: string): string {
    if (!iso) return "";
    try {
      const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
      if (diff < 1) return "방금";
      if (diff < 60) return `${diff}분 전`;
      const h = Math.floor(diff / 60);
      if (h < 24) return `${h}시간 전`;
      return `${Math.floor(h / 24)}일 전`;
    } catch { return ""; }
  }

  return (
    <div className="max-w-[1200px] mx-auto px-4 py-6" data-testid="section-trade">
      {popularStocks.length > 0 && (
        <div className="mb-8">
          <h2 className="text-[15px] font-bold text-[#14181B] mb-3">인기 청약 전 종목</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {popularStocks.map((s: any, i: number) => (
              <div key={i} className="border border-[#E0E2E4] rounded-xl p-4 bg-white hover:border-[#14181B] transition-colors" data-testid={`popular-stock-${i}`}>
                <div className="flex items-center gap-2 mb-3">
                  <StockIcon name={s.stockName} logoUrl={s.logoUrl} size={32} />
                  <div className="min-w-0">
                    <p className="text-[13px] font-bold text-[#14181B] truncate">{s.stockName}</p>
                    {s.isRegistered && (
                      <span className="text-[10px] text-[#03C75A] font-medium">상장완료</span>
                    )}
                  </div>
                </div>
                <p className="text-[16px] font-bold text-[#14181B]">
                  {s.currentPrice != null ? s.currentPrice.toLocaleString() + "원" : "-"}
                </p>
                {s.changeRate != null && (
                  <p className={`text-[13px] font-medium ${s.changeRate > 0 ? "text-[#f04452]" : s.changeRate < 0 ? "text-[#3182f6]" : "text-[#9D9FA0]"}`}>
                    {s.changeRate > 0 ? "▲" : s.changeRate < 0 ? "▼" : ""}{" "}
                    {Math.abs(s.changeRate).toFixed(2)}%
                  </p>
                )}
                <p className="text-[10px] text-[#BFC0C1] mt-1">{fmtTimeAgo(s.lastTradedAt)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1 min-w-0">
          <div className="flex border-b border-[#E0E2E4] mb-4">
            {(["being", "tobe", "listed"] as TradeTab[]).map((tab) => {
              const labels = { being: `청약진행중 ${beingIPO.length}`, tobe: `청약예정 ${toBeIPO.length}`, listed: `최근상장 ${newlyListed.length}` };
              return (
                <button
                  key={tab}
                  onClick={() => setTradeTab(tab)}
                  className={`px-4 py-2.5 text-[13px] font-bold border-b-2 transition-colors ${tradeTab === tab ? "border-[#14181B] text-[#14181B]" : "border-transparent text-[#9D9FA0]"}`}
                  data-testid={`trade-tab-${tab}`}
                >
                  {labels[tab]}
                </button>
              );
            })}
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="border border-[#E0E2E4] rounded-xl p-4 animate-pulse">
                  <div className="flex gap-3">
                    <div className="w-10 h-10 bg-[#F3F5F6] rounded-full" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-28 bg-[#F3F5F6] rounded" />
                      <div className="h-3 w-40 bg-[#F3F5F6] rounded" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : currentTab.length === 0 ? (
            <div className="border border-[#E0E2E4] rounded-xl p-10 text-center">
              <p className="text-[13px] text-[#9D9FA0]">해당 종목이 없습니다</p>
            </div>
          ) : (
            <div className="space-y-2">
              {(tradeTab === "being" || tradeTab === "tobe") && (currentTab as NaverIpoItem[]).map((ipo, i) => {
                const pop = popularMap[ipo.stockCode];
                const isOngoing = tradeTab === "being";
                const dateStr = isOngoing ? ipo.closedDate : ipo.offeringStartAt;
                const dateFmt = dateStr ? fmtMD(dateStr) + (isOngoing ? " 마감" : " 시작") : "일정 미정";
                const dday = !isOngoing ? fmtDDay(ipo.offeringStartAt) : null;
                return (
                  <div key={i} className="border border-[#E0E2E4] rounded-xl overflow-hidden bg-white" data-testid={`trade-ipo-${i}`}>
                    <div className="flex items-center gap-1.5 px-4 py-2 bg-[#F9FAFB] border-b border-[#E0E2E4]">
                      <span className={`text-[11px] font-bold ${isOngoing ? "text-[#03C75A]" : "text-[#585B5E]"}`}>
                        {isOngoing ? "진행중" : (dday || "예정")}
                      </span>
                      <span className="text-[11px] text-[#9D9FA0]">{dateFmt}</span>
                      {ipo.hasSellBoard && (
                        <span className="ml-auto text-[10px] text-white bg-[#03C75A] px-1.5 py-0.5 rounded font-medium">청약 전 거래</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 px-4 py-3">
                      <StockIcon name={ipo.stockName} logoUrl={ipo.logoUrl || undefined} size={40} />
                      <div className="min-w-0 flex-1">
                        <p className="text-[15px] font-bold text-[#14181B] truncate">{ipo.stockName}</p>
                        <p className="text-[12px] text-[#585B5E] mt-0.5">
                          {isOngoing ? "공모가" : "희망가"}{" "}
                          {fmtPrice(ipo.minExpectedOfferPrice, ipo.maxExpectedOfferPrice, ipo.finalOfferPrice)}
                        </p>
                        {ipo.instCompetitiveness != null && (
                          <p className="text-[11px] text-[#9D9FA0]">기관경쟁률 {Number(ipo.instCompetitiveness).toLocaleString()}:1</p>
                        )}
                      </div>
                      {pop && (
                        <div className="text-right shrink-0">
                          <p className="text-[15px] font-bold text-[#14181B]">{pop.currentPrice?.toLocaleString()}원</p>
                          {pop.changeRate != null && (
                            <p className={`text-[12px] font-medium ${pop.changeRate > 0 ? "text-[#f04452]" : pop.changeRate < 0 ? "text-[#3182f6]" : "text-[#9D9FA0]"}`}>
                              {pop.changeRate > 0 ? "▲" : pop.changeRate < 0 ? "▼" : ""} {Math.abs(pop.changeRate).toFixed(2)}%
                            </p>
                          )}
                          <p className="text-[10px] text-[#BFC0C1]">{fmtTimeAgo(pop.lastTradedAt)}</p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              {tradeTab === "listed" && (currentTab as any[]).map((s, i) => (
                <div key={i} className="border border-[#E0E2E4] rounded-xl overflow-hidden bg-white" data-testid={`trade-listed-${i}`}>
                  <div className="flex items-center gap-1.5 px-4 py-2 bg-[#F9FAFB] border-b border-[#E0E2E4]">
                    <span className="text-[11px] font-bold text-[#585B5E]">상장완료</span>
                    <span className="text-[11px] text-[#9D9FA0]">{s.listingAt ? fmtMD(s.listingAt) + " 상장" : ""}</span>
                  </div>
                  <div className="flex items-center gap-3 px-4 py-3">
                    <StockIcon name={s.name} logoUrl={s.logoUrl || undefined} size={40} />
                    <div className="min-w-0 flex-1">
                      <p className="text-[15px] font-bold text-[#14181B] truncate">{s.name}</p>
                      <p className="text-[12px] text-[#585B5E] mt-0.5">공모가 {s.finalOfferPrice ? s.finalOfferPrice.toLocaleString() + "원" : "-"}</p>
                      {s.keywords?.length > 0 && (
                        <div className="flex gap-1 mt-1 flex-wrap">
                          {s.keywords.slice(0, 2).map((k: string, ki: number) => (
                            <span key={ki} className="text-[10px] text-[#9D9FA0] bg-[#F3F5F6] px-1.5 py-0.5 rounded">{k}</span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      {s.changeRateFromLowestPrice != null && (
                        <p className={`text-[15px] font-bold ${s.changeRateFromLowestPrice > 0 ? "text-[#f04452]" : s.changeRateFromLowestPrice < 0 ? "text-[#3182f6]" : "text-[#9D9FA0]"}`}>
                          {s.changeRateFromLowestPrice > 0 ? "+" : ""}{s.changeRateFromLowestPrice.toFixed(1)}%
                        </p>
                      )}
                      <p className="text-[11px] text-[#9D9FA0]">최저가 대비</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="lg:w-[320px] shrink-0">
          <h3 className="text-[15px] font-bold text-[#14181B] mb-3">청약 전 거래란?</h3>
          <div className="border border-[#E0E2E4] rounded-xl p-5 bg-white space-y-4">
            <div className="flex gap-3">
              <span className="w-6 h-6 rounded-full bg-[#E8F0FE] flex items-center justify-center shrink-0 text-[12px] font-bold text-[#14181B]">1</span>
              <div>
                <p className="text-[13px] font-bold text-[#14181B] mb-1">청약 전 거래 가능 종목</p>
                <p className="text-[12px] text-[#585B5E] leading-relaxed">공모주 청약 기간 전에 비상장 시장에서 미리 매매할 수 있는 종목입니다.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <span className="w-6 h-6 rounded-full bg-[#E8F0FE] flex items-center justify-center shrink-0 text-[12px] font-bold text-[#14181B]">2</span>
              <div>
                <p className="text-[13px] font-bold text-[#14181B] mb-1">가격 변동성 주의</p>
                <p className="text-[12px] text-[#585B5E] leading-relaxed">공모가 확정 전이므로 가격 변동성이 클 수 있습니다. 신중한 투자 판단이 필요합니다.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <span className="w-6 h-6 rounded-full bg-[#E8F0FE] flex items-center justify-center shrink-0 text-[12px] font-bold text-[#14181B]">3</span>
              <div>
                <p className="text-[13px] font-bold text-[#14181B] mb-1">실시간 시세 제공</p>
                <p className="text-[12px] text-[#585B5E] leading-relaxed">인기 청약 전 종목의 현재가 및 등락률을 실시간으로 확인할 수 있습니다.</p>
              </div>
            </div>
          </div>

          {popularStocks.filter((s: any) => s.hasSellBoard).length > 0 && (
            <div className="mt-6">
              <h3 className="text-[14px] font-bold text-[#14181B] mb-2">청약 전 거래 가능</h3>
              <div className="border border-[#E0E2E4] rounded-xl overflow-hidden">
                {popularStocks.filter((s: any) => s.hasSellBoard).map((s: any, i: number) => (
                  <div key={i} className="flex items-center gap-2.5 px-3 py-2.5 border-b border-[#F3F5F6] last:border-b-0" data-testid={`trade-popular-${i}`}>
                    <StockIcon name={s.stockName} logoUrl={s.logoUrl} size={28} />
                    <p className="text-[12px] font-medium text-[#14181B] truncate flex-1">{s.stockName}</p>
                    <div className="text-right shrink-0">
                      <p className="text-[12px] font-bold text-[#14181B]">{s.currentPrice?.toLocaleString()}</p>
                      {s.changeRate != null && (
                        <p className={`text-[10px] font-medium ${s.changeRate > 0 ? "text-[#f04452]" : s.changeRate < 0 ? "text-[#3182f6]" : "text-[#9D9FA0]"}`}>
                          {s.changeRate > 0 ? "▲" : "▼"}{Math.abs(s.changeRate).toFixed(2)}%
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const { data: ipoApiData } = useQuery<IpoCalendarApiResponse>({
    queryKey: ["/api/market/ipo-calendar"],
  });
  const ipoNews = ipoApiData?.naverData?.ipoNews || [];

  return (
    <div className="max-w-[1200px] mx-auto px-4 py-8" data-testid="section-faq">
      <div className="flex flex-col lg:flex-row gap-8">
        <div className="flex-1">
          <h3 className="text-[15px] font-bold text-[#14181B] mb-4">IPO 공모주 청약의 모든 것</h3>
          <div className="border border-[#E0E2E4] rounded-xl overflow-hidden">
            {FAQ_ITEMS.map((item, i) => (
              <div key={i} className="border-b border-[#E0E2E4] last:border-b-0">
                <button
                  onClick={() => setOpenIndex(openIndex === i ? null : i)}
                  className="w-full flex items-center justify-between px-4 py-4 text-left hover:bg-[#F9FAFB] transition-colors"
                  data-testid={`faq-toggle-${i}`}
                >
                  <span className="text-[13px] text-[#14181B] font-medium">{item.q}</span>
                  <ChevronLeft className={`w-4 h-4 text-[#9D9FA0] shrink-0 transition-transform ${openIndex === i ? "-rotate-90" : "rotate-[270deg]"}`} style={{ transform: openIndex === i ? "rotate(-90deg)" : "rotate(90deg)" }} />
                </button>
                {openIndex === i && (
                  <div className="px-4 pb-4">
                    <p className="text-[13px] text-[#585B5E] leading-relaxed">{item.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="lg:w-[340px]">
          <h3 className="text-[15px] font-bold text-[#14181B] mb-4">IPO News 모아보기</h3>
          <div className="divide-y divide-[#F3F5F6]">
            {ipoNews.slice(0, 6).map((news: any, i: number) => (
              <a
                key={i}
                href={news.landingUrl || "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-3 py-3 hover:bg-[#F9FAFB] px-1 rounded transition-colors"
                data-testid={`faq-news-${i}`}
              >
                {news.logoUrl ? (
                  <img src={news.logoUrl} alt="" className="w-9 h-9 rounded object-cover shrink-0" />
                ) : (
                  <div className="w-9 h-9 rounded bg-[#E6E8EA] flex items-center justify-center shrink-0">
                    <span className="text-[11px] font-bold text-[#9D9FA0]">N</span>
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-[13px] text-[#14181B] line-clamp-2 leading-snug mb-0.5">{news.title}</p>
                  <p className="text-[11px] text-[#9D9FA0]">{news.mediaIssuerName} · {news.publishedAt ? new Date(news.publishedAt).toLocaleDateString("ko-KR", { month: "long", day: "numeric" }) : ""}</p>
                </div>
              </a>
            ))}
            {ipoNews.length === 0 && (
              <p className="text-[13px] text-[#9D9FA0] text-center py-6">뉴스를 불러오는 중입니다...</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function IPOCalendarPage() {
  const [activePageTab, setActivePageTab] = useState<PageTab>("calendar");

  return (
    <div className="min-h-screen bg-white" data-testid="page-ipo-calendar">
      <header className="border-b border-[#E0E2E4] bg-white">
        <div className="max-w-[1200px] mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/">
            <span className="flex items-center gap-1.5 cursor-pointer" data-testid="link-home">
              <SiteLogoBadge size={24} />
            </span>
          </Link>
          <Link href="/">
            <span className="flex items-center gap-1 text-[13px] text-[#585B5E] hover:text-[#14181B] cursor-pointer" data-testid="link-back-home">
              <ArrowLeft className="w-4 h-4" />
              홈으로
            </span>
          </Link>
        </div>
      </header>

      <div className="max-w-[1200px] mx-auto px-4 pt-8 pb-0">
        <div className="flex items-center gap-0">
          <button
            onClick={() => setActivePageTab("calendar")}
            className={`text-[22px] font-bold transition-colors ${activePageTab === "calendar" ? "text-[#14181B]" : "text-[#9D9FA0]"}`}
            data-testid="tab-page-calendar"
          >
            공모주 IPO 캘린더
          </button>
          <span className="mx-3 text-[#C5C7CB] text-[18px]">|</span>
          <button
            onClick={() => setActivePageTab("trade")}
            className={`text-[22px] font-bold transition-colors ${activePageTab === "trade" ? "text-[#14181B]" : "text-[#9D9FA0]"}`}
            data-testid="tab-page-trade"
          >
            청약 전 거래
          </button>
          <span className="mx-3 text-[#C5C7CB] text-[18px]">|</span>
          <button
            onClick={() => setActivePageTab("faq")}
            className={`text-[22px] font-bold transition-colors ${activePageTab === "faq" ? "text-[#14181B]" : "text-[#9D9FA0]"}`}
            data-testid="tab-page-faq"
          >
            FAQ
          </button>
        </div>
      </div>

      {activePageTab === "calendar" && <CalendarSection />}
      {activePageTab === "trade" && <TradeSection />}
      {activePageTab === "faq" && <FAQSection />}

      <footer className="border-t border-[#E0E2E4] mt-12 bg-[#F9FAFB]">
        <div className="max-w-[1200px] mx-auto px-4 py-8">
          <div className="flex items-center gap-1.5 mb-3">
            <SiteLogoBadge size={20} />
          </div>
          <p className="text-[11px] text-[#9D9FA0] leading-relaxed">
            Npay 비상장은 비상장주식 거래 정보를 제공하며, 투자 판단에 대한 책임은 투자자 본인에게 있습니다.
          </p>
          <p className="text-[11px] text-[#C5C7CB] mt-1.5">© 2026 Npay 비상장. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
