import { useState, useMemo } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight, ChevronLeft, ChevronDown, ArrowLeft, Info, ExternalLink } from "lucide-react";
import { SiteLogoBadge } from "@/components/site-logo";
import { StockIcon } from "@/components/stock-icon";

type PageTab = "calendar" | "faq";

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
  status: string;
  priceRange: string;
  competition: string;
}

const STATUS_LEGEND = [
  { label: "청약예정", color: "#D7C8E8" },
  { label: "공모청약", color: "#FCDDE1" },
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
    return diff > 0 ? `D-${diff}` : diff === 0 ? "D-Day" : "완료";
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

function buildCalEvents(naverData: NaverIpoCalendarData): CalEvent[] {
  const events: CalEvent[] = [];

  for (const ipo of naverData.beingIPOList || []) {
    if (!ipo.stockName || !ipo.closedDate) continue;
    const end = new Date(ipo.closedDate);
    const start = addDays(ipo.closedDate, -1);
    events.push({
      name: ipo.stockName,
      start,
      end,
      color: "#FCDDE1",
      status: "공모청약",
      priceRange: fmtPrice(ipo.minExpectedOfferPrice, ipo.maxExpectedOfferPrice, ipo.finalOfferPrice),
      competition: ipo.instCompetitiveness ? `${ipo.instCompetitiveness.toLocaleString()}:1` : "-",
    });
  }

  for (const ipo of naverData.toBeIPOList || []) {
    if (!ipo.stockName || !ipo.offeringStartAt) continue;
    const start = new Date(ipo.offeringStartAt);
    const end = addDays(ipo.offeringStartAt, 1);
    events.push({
      name: ipo.stockName,
      start,
      end,
      color: "#D7C8E8",
      status: "청약예정",
      priceRange: fmtPrice(ipo.minExpectedOfferPrice, ipo.maxExpectedOfferPrice, ipo.finalOfferPrice),
      competition: ipo.instCompetitiveness ? `${ipo.instCompetitiveness.toLocaleString()}:1` : "-",
    });
  }

  return events;
}

function CalendarView({ year, month, events }: { year: number; month: number; events: CalEvent[] }) {
  const weeks = useMemo(() => getMonthWeeks(year, month), [year, month]);
  const dayNames = ["월", "화", "수", "목", "금"];

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

  const today = new Date(); today.setHours(0, 0, 0, 0);

  return (
    <div className="border border-[#E0E2E4] rounded-lg overflow-hidden" data-testid="calendar-grid">
      <div className="grid grid-cols-5 bg-[#fafafa] border-b border-[#E0E2E4]">
        {dayNames.map(d => (
          <div key={d} className="px-2 py-2.5 text-[13px] text-[#555] font-medium text-center border-r border-[#E0E2E4] last:border-r-0">{d}</div>
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
                  <div key={di} className="border-r border-[#E0E2E4] last:border-r-0 px-2 pt-2 pb-1">
                    <div className={`text-[12px] text-right ${isThisMonth ? "text-[#555]" : "text-[#ccc]"}`}>
                      {isToday
                        ? <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#03C75A] text-white text-[11px] font-bold">{day.getDate()}</span>
                        : day.getDate()
                      }
                    </div>
                  </div>
                );
              })}
            </div>
            {lanes.length > 0 && (
              <div className="pb-1 px-1" style={{ minHeight: lanes.length * 26 }}>
                {lanes.map((lane, li) => {
                  const cells: JSX.Element[] = [];
                  let col = 0;
                  while (col < 5) {
                    const ev = lane[col];
                    if (!ev) {
                      cells.push(<div key={col} style={{ flex: 1 }} />);
                      col++;
                    } else {
                      let span = 1;
                      while (col + span < 5 && lane[col + span] === ev) span++;
                      const isStart = col === 0 || lane[col - 1] !== ev;
                      const isEnd = col + span >= 5 || lane[col + span] !== ev;
                      cells.push(
                        <div
                          key={col}
                          style={{ flex: span, backgroundColor: ev.color, borderRadius: isStart && isEnd ? 4 : isStart ? "4px 0 0 4px" : isEnd ? "0 4px 4px 0" : 0, marginLeft: isStart ? 1 : 0, marginRight: isEnd ? 1 : 0 }}
                          className="h-[22px] flex items-center px-1.5 overflow-hidden"
                          title={`${ev.name} (${ev.status})`}
                        >
                          {isStart && <span className="text-[10px] text-[#333] font-medium truncate leading-none">{ev.name}</span>}
                        </div>
                      );
                      col += span;
                    }
                  }
                  return (
                    <div key={li} className="flex mb-[2px]">{cells}</div>
                  );
                })}
              </div>
            )}
            {lanes.length === 0 && <div style={{ minHeight: 32 }} />}
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

  const { data: ipoApiData, isLoading } = useQuery<IpoCalendarApiResponse>({
    queryKey: ["/api/market/ipo-calendar"],
    refetchInterval: 5 * 60 * 1000,
  });

  const naverData = ipoApiData?.naverData;

  const events = useMemo(() => {
    if (!naverData) return [];
    return buildCalEvents(naverData);
  }, [naverData]);

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

  const beingIPO = naverData?.beingIPOList || [];
  const toBeIPO = naverData?.toBeIPOList || [];
  const readyIPO = naverData?.readyToIpoStocks || [];
  const ipoNews = naverData?.ipoNews || [];
  const hasItems = beingIPO.length > 0 || toBeIPO.length > 0;

  return (
    <div className="max-w-[1200px] mx-auto px-4 py-6">
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-[#14181B]">{monthName}</h2>
              <Info className="w-4 h-4 text-[#BFC0C1]" />
            </div>
            <div className="flex items-center gap-1">
              <button onClick={prevMonth} className="px-2 py-1 rounded border border-[#E0E2E4] text-xs text-[#585B5E] hover:bg-[#F9FAFB]" data-testid="button-cal-prev">
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button onClick={goToday} className="px-3 py-1 rounded border border-[#E0E2E4] text-xs text-[#585B5E] hover:bg-[#F9FAFB]" data-testid="button-cal-today">오늘</button>
              <button onClick={nextMonth} className="px-2 py-1 rounded border border-[#E0E2E4] text-xs text-[#585B5E] hover:bg-[#F9FAFB]" data-testid="button-cal-next">
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 mb-4">
            {STATUS_LEGEND.map(({ label, color }) => (
              <span key={label} className="inline-flex items-center gap-1.5 text-[12px] text-[#585B5E] px-2.5 py-1 rounded-full border border-[#E0E2E4] bg-white">
                <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ backgroundColor: color }} />
                {label}
              </span>
            ))}
          </div>

          {isLoading ? (
            <div className="border border-[#E0E2E4] rounded-lg overflow-hidden animate-pulse">
              <div className="h-10 bg-[#fafafa] border-b border-[#E0E2E4]" />
              {[...Array(5)].map((_, i) => <div key={i} className="h-20 border-b border-[#E0E2E4] last:border-b-0 bg-white" />)}
            </div>
          ) : (
            <div className="min-w-0 overflow-x-auto">
              <div className="min-w-[480px]">
                <CalendarView year={calYear} month={calMonth} events={events} />
              </div>
            </div>
          )}

          {ipoNews.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-bold text-[#14181B] mb-3">IPO 뉴스</h3>
              <div className="space-y-2">
                {ipoNews.slice(0, 5).map((news: any, i: number) => (
                  <a
                    key={i}
                    href={news.landingUrl || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-start gap-3 p-3 border border-[#E0E2E4] rounded-lg hover:border-[#BFC0C1] hover:bg-[#F9FAFB] transition-colors"
                    data-testid={`ipo-news-${i}`}
                  >
                    {news.logoUrl ? (
                      <img src={news.logoUrl} alt="" className="w-8 h-8 rounded object-cover shrink-0 mt-0.5" />
                    ) : (
                      <div className="w-8 h-8 rounded bg-[#F3F5F6] flex items-center justify-center shrink-0 mt-0.5">
                        <span className="text-[10px] font-bold text-[#9D9FA0]">N</span>
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-[#14181B] line-clamp-2 leading-snug mb-0.5">{news.title}</p>
                      <p className="text-[11px] text-[#9D9FA0]">{news.mediaIssuerName} | {news.publishedAt ? new Date(news.publishedAt).toLocaleDateString("ko-KR") : ""}</p>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-[#BFC0C1] shrink-0 mt-1" />
                  </a>
                ))}
              </div>
            </div>
          )}

          <div className="mt-6 border-t border-[#E0E2E4] pt-4">
            <div className="flex items-center gap-1.5 mb-2 text-[#9D9FA0]">
              <Info className="w-3.5 h-3.5" />
              <span className="text-xs font-medium">유의사항</span>
            </div>
            <ul className="text-[11px] text-[#9D9FA0] space-y-1 list-disc pl-4">
              <li>모든 정보는 정보 제공을 위한 것으로, 투자 권유를 목적으로 하지 않습니다.</li>
              <li>제공되는 정보는 오류 또는 지연이 발생할 수 있으며, 책임을 지지 않습니다.</li>
              <li>데이터 출처: Npay 비상장 (ustock.naver.com)</li>
            </ul>
          </div>
        </div>

        <div className="lg:w-[300px] shrink-0">
          {beingIPO.length > 0 && (
            <div className="mb-5">
              <h3 className="text-base font-bold text-[#14181B] mb-3">공모청약 진행중</h3>
              <div className="space-y-2">
                {beingIPO.map((ipo, i) => {
                  const price = fmtPrice(ipo.minExpectedOfferPrice, ipo.maxExpectedOfferPrice, ipo.finalOfferPrice);
                  return (
                    <div key={i} className="border border-[#E0E2E4] rounded-lg p-3 hover:border-[#BFC0C1] transition-colors cursor-pointer" data-testid={`sidebar-being-${i}`}>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-[11px] font-bold px-1.5 py-0.5 rounded bg-[#FCDDE1] text-[#c0392b]">공모청약</span>
                        <span className="text-[11px] font-bold text-[#03C75A]">진행중</span>
                        {ipo.closedDate && <span className="text-[10px] text-[#9D9FA0] ml-auto">~{fmtMD(ipo.closedDate)}</span>}
                      </div>
                      <div className="flex items-center gap-2">
                        <StockIcon name={ipo.stockName} logoUrl={ipo.logoUrl || undefined} size={28} />
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-[#14181B] truncate">{ipo.stockName}</p>
                          {price !== "-" && <p className="text-[11px] text-[#585B5E]">공모가 {price}</p>}
                          {ipo.instCompetitiveness != null && (
                            <p className="text-[11px] text-[#9D9FA0]">기관경쟁률 {Number(ipo.instCompetitiveness).toLocaleString()}:1</p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {toBeIPO.length > 0 && (
            <div className="mb-5">
              <h3 className="text-base font-bold text-[#14181B] mb-3">청약예정</h3>
              <div className="space-y-2">
                {toBeIPO.slice(0, 6).map((ipo, i) => {
                  const price = fmtPrice(ipo.minExpectedOfferPrice, ipo.maxExpectedOfferPrice, ipo.finalOfferPrice);
                  const dday = fmtDDay(ipo.offeringStartAt);
                  return (
                    <div key={i} className="border border-[#E0E2E4] rounded-lg p-3 hover:border-[#BFC0C1] transition-colors cursor-pointer" data-testid={`sidebar-tobe-${i}`}>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-[11px] font-bold px-1.5 py-0.5 rounded bg-[#D7C8E8] text-[#6c3483]">청약예정</span>
                        {dday && <span className="text-[11px] font-bold text-[#03C75A]">{dday}</span>}
                        {ipo.offeringStartAt && <span className="text-[10px] text-[#9D9FA0] ml-auto">{fmtMD(ipo.offeringStartAt)} ~</span>}
                      </div>
                      <div className="flex items-center gap-2">
                        <StockIcon name={ipo.stockName} logoUrl={ipo.logoUrl || undefined} size={28} />
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-[#14181B] truncate">{ipo.stockName}</p>
                          {price !== "-" && <p className="text-[11px] text-[#585B5E]">희망가 {price}</p>}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {!isLoading && !hasItems && (
            <div className="border border-[#E0E2E4] rounded-lg p-6 text-center">
              <p className="text-sm text-[#9D9FA0]">현재 청약 일정이 없습니다</p>
            </div>
          )}

          {isLoading && (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="border border-[#E0E2E4] rounded-lg p-3 animate-pulse">
                  <div className="h-3 w-16 bg-gray-100 rounded mb-2" />
                  <div className="h-4 w-28 bg-gray-100 rounded mb-1" />
                  <div className="h-3 w-full bg-gray-100 rounded" />
                </div>
              ))}
            </div>
          )}

          {readyIPO.length > 0 && (
            <div className="mt-2">
              <h3 className="text-sm font-bold text-[#14181B] mb-2">상장 준비 중</h3>
              <div className="border border-[#E0E2E4] rounded-lg overflow-hidden">
                {readyIPO.slice(0, 6).map((ipo: any, i: number) => {
                  const stateLabel: Record<string, string> = {
                    "EXAMINATION_REQUESTED": "심사청구",
                    "DEMAND_FORECAST": "수요예측",
                    "APPROVED": "상장승인",
                  };
                  const label = stateLabel[ipo.ipoState] || ipo.ipoState || "준비중";
                  return (
                    <div key={i} className="flex items-center gap-2 px-3 py-2.5 border-b border-[#E0E2E4] last:border-b-0" data-testid={`ready-ipo-${i}`}>
                      <StockIcon name={ipo.stockName} logoUrl={ipo.logoUrl || undefined} size={24} />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-[#14181B] truncate">{ipo.stockName}</p>
                      </div>
                      <span className="text-[10px] text-[#9D9FA0] shrink-0 bg-[#F3F5F6] px-1.5 py-0.5 rounded">{label}</span>
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

function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const { data: ipoApiData } = useQuery<IpoCalendarApiResponse>({
    queryKey: ["/api/market/ipo-calendar"],
  });

  const ipoNews = ipoApiData?.naverData?.ipoNews || [];

  return (
    <div className="max-w-[1200px] mx-auto px-4 py-8" data-testid="section-faq">
      <h2 className="text-lg font-bold text-[#14181B] mb-6">IPO, 이런게 궁금해요!</h2>
      <div className="flex flex-col lg:flex-row gap-8">
        <div className="flex-1">
          <h3 className="text-sm font-bold text-[#14181B] mb-4">IPO 공모주 청약의 모든 것</h3>
          <div className="border border-[#E0E2E4] rounded-lg overflow-hidden">
            {FAQ_ITEMS.map((item, i) => (
              <div key={i} className="border-b border-[#E0E2E4] last:border-b-0">
                <button
                  onClick={() => setOpenIndex(openIndex === i ? null : i)}
                  className="w-full flex items-center justify-between px-4 py-3.5 text-left hover:bg-[#F9FAFB] transition-colors"
                  data-testid={`faq-toggle-${i}`}
                >
                  <span className="text-sm text-[#14181B]">{item.q}</span>
                  <ChevronDown className={`w-4 h-4 text-[#9D9FA0] shrink-0 transition-transform ${openIndex === i ? "rotate-180" : ""}`} />
                </button>
                {openIndex === i && (
                  <div className="px-4 pb-4">
                    <p className="text-sm text-[#585B5E] leading-relaxed">{item.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="lg:w-[380px]">
          <h3 className="text-sm font-bold text-[#14181B] mb-4">IPO News 모아보기</h3>
          <div className="space-y-3">
            {ipoNews.slice(0, 6).map((news: any, i: number) => (
              <a
                key={i}
                href={news.landingUrl || "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-3 py-2 hover:bg-[#F9FAFB] rounded px-2 transition-colors"
                data-testid={`faq-news-${i}`}
              >
                {news.logoUrl ? (
                  <img src={news.logoUrl} alt="" className="w-8 h-8 rounded object-cover shrink-0 mt-0.5" />
                ) : (
                  <div className="w-8 h-8 rounded bg-[#F3F5F6] flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-[10px] font-bold text-[#9D9FA0]">N</span>
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-sm text-[#14181B] line-clamp-2 leading-snug mb-0.5">{news.title}</p>
                  <p className="text-[11px] text-[#9D9FA0]">{news.mediaIssuerName} | {news.publishedAt ? new Date(news.publishedAt).toLocaleDateString("ko-KR") : ""}</p>
                </div>
              </a>
            ))}
            {ipoNews.length === 0 && (
              <p className="text-sm text-[#9D9FA0] text-center py-4">뉴스를 불러오는 중입니다...</p>
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
      <header className="border-b border-[#E0E2E4]">
        <div className="max-w-[1200px] mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/">
            <span className="flex items-center gap-1.5 cursor-pointer" data-testid="link-home">
              <SiteLogoBadge size={24} />
            </span>
          </Link>
          <Link href="/">
            <span className="flex items-center gap-1 text-sm text-[#585B5E] hover:text-[#14181B] cursor-pointer" data-testid="link-back-home">
              <ArrowLeft className="w-4 h-4" />
              홈으로
            </span>
          </Link>
        </div>
      </header>

      <div className="max-w-[1200px] mx-auto px-4">
        <div className="flex items-center gap-4 border-b border-[#E0E2E4]">
          <button
            onClick={() => setActivePageTab("calendar")}
            className={`py-4 text-sm sm:text-base font-bold border-b-2 transition-colors whitespace-nowrap ${activePageTab === "calendar" ? "border-[#14181B] text-[#14181B]" : "border-transparent text-[#9D9FA0]"}`}
            data-testid="tab-page-calendar"
          >
            공모주 IPO 캘린더
          </button>
          <button
            onClick={() => setActivePageTab("faq")}
            className={`py-4 text-sm sm:text-base border-b-2 transition-colors whitespace-nowrap ${activePageTab === "faq" ? "border-[#14181B] text-[#14181B] font-bold" : "border-transparent text-[#9D9FA0]"}`}
            data-testid="tab-page-faq"
          >
            FAQ
          </button>
        </div>
      </div>

      {activePageTab === "calendar" && <CalendarSection />}
      {activePageTab === "faq" && <FAQSection />}

      <footer className="border-t border-[#E0E2E4] mt-8 bg-[#F9FAFB]">
        <div className="max-w-[1200px] mx-auto px-4 py-8">
          <div className="flex items-center gap-1.5 mb-4">
            <SiteLogoBadge size={22} />
          </div>
          <p className="text-[11px] text-[#9D9FA0] leading-relaxed">
            Npay 비상장은 비상장주식 거래 정보를 제공하며, 투자 판단에 대한 책임은 투자자 본인에게 있습니다.
          </p>
          <p className="text-[11px] text-[#BFC0C1] mt-2">© 2026 Npay 비상장. All rights reserved.</p>
        </div>
      </footer>

      <style>{`
        .scrollbar-none::-webkit-scrollbar { display: none; }
        .scrollbar-none { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
