import { useState, useMemo, useRef } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight, ChevronLeft, ChevronRight as ChevRight, Info, HelpCircle, ExternalLink } from "lucide-react";
import { SiteLogoBadge } from "@/components/site-logo";
import { StockIcon } from "@/components/stock-icon";
import { GlobalNav } from "@/components/global-nav";
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

interface RichIpoItem {
  code?: string;
  koreanName?: string;
  stockName?: string;
  logoUrl?: string | null;
  demandForecastStartDate?: string;
  demandForecastEndDate?: string;
  offeringStartAt?: string;
  offeringEndAt?: string;
  closedDate?: string;
  listingAt?: string;
  minExpectedOfferPrice?: number;
  maxExpectedOfferPrice?: number;
  finalOfferPrice?: number | null;
  instCompetitiveness?: number | null;
  offerSubscriptionCompetitiveness?: number | null;
  ipoDetailState?: string;
}

interface Ipo38Item {
  stockName: string;
  subscriptionStartDate: string;
  subscriptionEndDate: string;
  listingDate?: string;
  finalOfferPrice?: number | null;
  minOfferPrice?: number;
  maxOfferPrice?: number;
  competitionRate?: string;
  brokers?: string;
  type: 'subscription' | 'listing';
}

interface IpoCalendarApiResponse {
  naverData: NaverIpoCalendarData;
  richIpoList?: RichIpoItem[];
  ipo38?: Ipo38Item[];
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
  iconType: "square" | "circle" | "snowflake" | "dash" | "dot";
  isBar: boolean;
}

// Naver 스타일 2행 레전드
// Row 1: 상태 진행 단계 배지 (원형 도트 + 텍스트)
const BADGE_LEGEND = [
  { label: "주관사선정",   dotColor: "#FFFBC0", borderColor: "#E8D97C" },
  { label: "기술평가통과", dotColor: "#F1D5FC", borderColor: "#C78FE8" },
  { label: "심사청구",     dotColor: "#FCEAD5", borderColor: "#E8B87C" },
  { label: "심사승인",     dotColor: "#E1FEF6", borderColor: "#6FD9B8" },
  { label: "신고서제출",   dotColor: "#FCD5EF", borderColor: "#E87CC8" },
];
// Row 2: 이벤트 타입 아이콘 (기존 스타일 유지)
const ICON_LEGEND = [
  { label: "수요예측", icon: "○", color: "#3D5AFE", bg: "#E8EAF6", border: "#9FA8DA" },
  { label: "공모청약", icon: "■", color: "#c0392b", bg: "#FCDDE1", border: "#EF9A9A" },
  { label: "청약예정", icon: "■", color: "#6c3483", bg: "#D7C8E8", border: "#CE93D8" },
  { label: "환불",     icon: "─", color: "#b7601e", bg: "#FFF8E1", border: "#FFD54F" },
  { label: "배정",     icon: "✦", color: "#33691e", bg: "#F1F8E9", border: "#AED581" },
  { label: "상장",     icon: "●", color: "#14181B", bg: "#F3F5F6", border: "#C5C7CB" },
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
    const d = parseLocalDate(iso);
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
    const target = parseLocalDate(dateStr); target.setHours(0, 0, 0, 0);
    const diff = Math.ceil((target.getTime() - today.getTime()) / 86400000);
    return diff > 0 ? `D-${diff}` : diff === 0 ? "D-Day" : null;
  } catch { return null; }
}

// YYYY-MM-DD 형식을 로컬(KST) 자정으로 파싱 — new Date("YYYY-MM-DD")는 UTC 자정이라 하루 밀림
function parseLocalDate(dateStr: string): Date {
  const m = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return new Date(parseInt(m[1]), parseInt(m[2]) - 1, parseInt(m[3]));
  return new Date(dateStr);
}

function addDays(dateStr: string, days: number): Date {
  const d = parseLocalDate(dateStr);
  d.setDate(d.getDate() + days);
  return d;
}

function addBusinessDays(dateStr: string, days: number): Date {
  const d = parseLocalDate(dateStr);
  let count = 0;
  while (count < days) {
    d.setDate(d.getDate() + 1);
    const dow = d.getDay();
    if (dow !== 0 && dow !== 6) count++;
  }
  return d;
}

function dateToStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
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

const IPO_STATE_MAP: Record<string, { label: string; color: string; bgColor: string; iconType: CalEvent["iconType"]; isBar: boolean }> = {
  "UNDERWRITER_SELECTED":        { label: "주관사선정",   color: "#A08C10", bgColor: "#FFFBC0", iconType: "dot",       isBar: false },
  "TECHNICAL_EVALUATION_PASSED": { label: "기술평가통과", color: "#8B4FBF", bgColor: "#F1D5FC", iconType: "dot",       isBar: false },
  "EXAMINATION_REQUESTED":       { label: "심사청구",     color: "#B07840", bgColor: "#FCEAD5", iconType: "dot",       isBar: false },
  "EXAMINATION_APPROVED":        { label: "심사승인",     color: "#2D9B7A", bgColor: "#E1FEF6", iconType: "dot",       isBar: false },
  "EXAMINATION_ACCEPTED":        { label: "심사승인",     color: "#2D9B7A", bgColor: "#E1FEF6", iconType: "dot",       isBar: false },
  "REPORT_SUBMITTED":            { label: "신고서제출",   color: "#BF4FAA", bgColor: "#FCD5EF", iconType: "dot",       isBar: false },
  "SUBMIT_REPORT":               { label: "신고서제출",   color: "#BF4FAA", bgColor: "#FCD5EF", iconType: "dot",       isBar: false },
  "DEMAND_FORECAST":             { label: "수요예측",     color: "#5B4FCF", bgColor: "#D9D5FC", iconType: "circle",    isBar: true  },
  "OFFER_SUBSCRIPTION":          { label: "공모청약",     color: "#c0392b", bgColor: "#FCDBD5", iconType: "square",    isBar: true  },
  "TO_BE_OFFER_SUBSCRIPTION":    { label: "청약예정",     color: "#6c3483", bgColor: "#D7C8E8", iconType: "square",    isBar: true  },
  "REFUND_DATE":                 { label: "환불",         color: "#666666", bgColor: "#D6D6D6", iconType: "dash",      isBar: false },
  "REFUND":                      { label: "환불",         color: "#666666", bgColor: "#D6D6D6", iconType: "dash",      isBar: false },
  "ALLOTMENT_DATE":              { label: "배정",         color: "#2D6A1A", bgColor: "#E3FCD5", iconType: "snowflake", isBar: false },
  "ALLOCATION":                  { label: "배정",         color: "#2D6A1A", bgColor: "#E3FCD5", iconType: "snowflake", isBar: false },
  "TO_BE_LISTED":                { label: "상장",         color: "#1A4FA0", bgColor: "#E1EFFE", iconType: "dot",       isBar: false },
  "LISTING":                     { label: "상장",         color: "#1A4FA0", bgColor: "#E1EFFE", iconType: "dot",       isBar: false },
};

function buildDbCalEvents(dbStocks: IpoStock[]): CalEvent[] {
  const events: CalEvent[] = [];
  const today = new Date(); today.setHours(0, 0, 0, 0);
  for (const stock of dbStocks) {
    if (!stock.stockName || !stock.startDate || !stock.endDate) continue;
    const start = parseLocalDate(stock.startDate);
    const end = parseLocalDate(stock.endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) continue;

    // 심사청구 → 점(dot) 이벤트
    if (stock.subscriptionStatus === "심사청구") {
      events.push({
        name: stock.stockName, start, end,
        color: "#B07840", bgColor: "#FCEAD5", status: "심사청구",
        priceRange: "-", competition: "-",
        logoUrl: null, iconType: "dot", isBar: false,
      });
      continue;
    }

    const isPast = end < today;
    const isOngoing = !isPast && start <= today && today <= end;
    const color = isPast ? "#9D9FA0" : isOngoing ? "#c0392b" : "#6c3483";
    const bgColor = isPast ? "#F3F5F6" : isOngoing ? "#FCDDE1" : "#D7C8E8";
    const status = isPast ? "청약완료" : isOngoing ? "공모청약" : "청약예정";

    events.push({
      name: stock.stockName, start, end,
      color, bgColor, status,
      priceRange: stock.priceMin && stock.priceMax
        ? `${stock.priceMin.toLocaleString()} ~ ${stock.priceMax.toLocaleString()}원`
        : "-",
      competition: stock.competitionRate || "-",
      logoUrl: null,
      iconType: "square",
      isBar: true,
    });
  }
  return events;
}

// 이벤트 상태를 마일스톤 버킷으로 분류 — 서로 다른 출처 간 중복 제거 시
// 같은 종목이라도 마일스톤 유형(수요예측/청약/상장 등)이 다르면 별개 이벤트로 취급
function bucketOf(status: string): string {
  if (status === "수요예측") return "demand";
  if (status === "공모청약" || status === "청약예정" || status === "청약완료") return "subscription";
  if (status === "배정") return "allot";
  if (status === "환불") return "refund";
  if (status === "상장") return "listing";
  return "review"; // 심사청구/심사승인/신고서제출/주관사선정/기술평가통과 등
}

function buildCalEvents(naverData: NaverIpoCalendarData): CalEvent[] {
  const events: CalEvent[] = [];

  // 공모청약 진행중 (pink bar) — Korean IPO subscription typically 2 trading days
  for (const ipo of naverData.beingIPOList || []) {
    if (!ipo.stockName || !ipo.closedDate) continue;
    const end = parseLocalDate(ipo.closedDate);
    const start = addDays(ipo.closedDate, -1);
    events.push({
      name: ipo.stockName, start, end,
      color: "#c0392b", bgColor: "#FCDDE1", status: "공모청약",
      priceRange: fmtPrice(ipo.minExpectedOfferPrice, ipo.maxExpectedOfferPrice, ipo.finalOfferPrice),
      competition: ipo.instCompetitiveness ? `${ipo.instCompetitiveness.toLocaleString()}:1` : "-",
      logoUrl: ipo.logoUrl || null,
      iconType: "square",
      isBar: true,
    });
  }

  // 청약예정 (purple bar) — show as 2-day bar from start
  for (const ipo of naverData.toBeIPOList || []) {
    if (!ipo.stockName || !ipo.offeringStartAt) continue;
    const start = parseLocalDate(ipo.offeringStartAt);
    const end = addDays(ipo.offeringStartAt, 1);
    events.push({
      name: ipo.stockName, start, end,
      color: "#6c3483", bgColor: "#D7C8E8", status: "청약예정",
      priceRange: fmtPrice(ipo.minExpectedOfferPrice, ipo.maxExpectedOfferPrice, ipo.finalOfferPrice),
      competition: ipo.instCompetitiveness ? `${ipo.instCompetitiveness.toLocaleString()}:1` : "-",
      logoUrl: ipo.logoUrl || null,
      iconType: "square",
      isBar: true,
    });
  }

  // 상장 준비 중 종목 — dot events per state
  for (const stock of naverData.readyToIpoStocks || []) {
    if (!stock.stockName || !stock.ipoDate) continue;
    const stateInfo = IPO_STATE_MAP[stock.ipoState as string] || {
      label: stock.ipoState || "준비중",
      color: "#9D9FA0",
      bgColor: "transparent",
      iconType: "dot" as const,
      isBar: false,
    };
    const start = parseLocalDate(stock.ipoDate);
    const end = stateInfo.isBar ? addDays(stock.ipoDate, 1) : parseLocalDate(stock.ipoDate);
    events.push({
      name: stock.stockName, start, end,
      color: stateInfo.color, bgColor: stateInfo.bgColor,
      status: stateInfo.label,
      priceRange: "-",
      competition: "-",
      logoUrl: stock.logoUrl || null,
      iconType: stateInfo.iconType,
      isBar: stateInfo.isBar,
    });
  }

  // 신규 상장 종목 — dot events
  for (const stock of naverData.newlyListedStocks || []) {
    if (!stock.name || !stock.listingAt) continue;
    const start = parseLocalDate(stock.listingAt);
    events.push({
      name: stock.name, start, end: parseLocalDate(stock.listingAt),
      color: "#1b5e20", bgColor: "#E8F5E9",
      status: "상장",
      priceRange: stock.finalOfferPrice ? `${stock.finalOfferPrice.toLocaleString()}원` : "-",
      competition: stock.changeRateFromLowestPrice != null ? `${stock.changeRateFromLowestPrice > 0 ? "+" : ""}${stock.changeRateFromLowestPrice}%` : "-",
      logoUrl: stock.logoUrl || null,
      iconType: "dot",
      isBar: false,
    });
  }

  return events;
}

// Rich IPO 데이터(ustockplus)로 수요예측·공모청약·상장 이벤트 생성
function buildRichCalEvents(richIpoList: RichIpoItem[]): CalEvent[] {
  const events: CalEvent[] = [];
  for (const ipo of richIpoList) {
    const name = ipo.koreanName || ipo.stockName;
    if (!name) continue;
    const logo = ipo.logoUrl || null;
    const price = fmtPrice(ipo.minExpectedOfferPrice, ipo.maxExpectedOfferPrice, ipo.finalOfferPrice);
    const comp = ipo.offerSubscriptionCompetitiveness || ipo.instCompetitiveness;
    const compStr = comp ? `${comp.toLocaleString()}:1` : "-";

    // 수요예측 bar
    if (ipo.demandForecastStartDate && ipo.demandForecastEndDate) {
      const s = parseLocalDate(ipo.demandForecastStartDate);
      const e = parseLocalDate(ipo.demandForecastEndDate);
      if (!isNaN(s.getTime()) && !isNaN(e.getTime())) {
        events.push({
          name, start: s, end: e,
          color: "#5B4FCF", bgColor: "#D9D5FC", status: "수요예측",
          priceRange: price, competition: compStr,
          logoUrl: logo, iconType: "circle", isBar: true,
        });
      }
    }
    // 공모청약 bar
    const subStart = ipo.offeringStartAt;
    const subEnd = ipo.offeringEndAt || ipo.closedDate;
    if (subStart && subEnd) {
      const s = parseLocalDate(subStart);
      const e = parseLocalDate(subEnd);
      if (!isNaN(s.getTime()) && !isNaN(e.getTime())) {
        const isOngoing = ipo.ipoDetailState === "OFFER_SUBSCRIPTION";
        events.push({
          name, start: s, end: e,
          color: isOngoing ? "#c0392b" : "#6c3483",
          bgColor: isOngoing ? "#FCDBD5" : "#D7C8E8",
          status: isOngoing ? "공모청약" : "청약예정",
          priceRange: price, competition: compStr,
          logoUrl: logo, iconType: "square", isBar: true,
        });
      }
    }
    // 배정 dot = 청약종료 후 1 영업일, 환불 dot = 2 영업일
    if (subEnd) {
      const allotDate = addBusinessDays(subEnd, 1);
      const refundDate = addBusinessDays(subEnd, 2);
      events.push({
        name, start: allotDate, end: allotDate,
        color: "#2D6A1A", bgColor: "#E3FCD5", status: "배정",
        priceRange: price, competition: compStr,
        logoUrl: logo, iconType: "snowflake", isBar: false,
      });
      events.push({
        name, start: refundDate, end: refundDate,
        color: "#666666", bgColor: "#D6D6D6", status: "환불",
        priceRange: price, competition: compStr,
        logoUrl: logo, iconType: "dash", isBar: false,
      });
    }

    // 상장 dot
    if (ipo.listingAt) {
      const d = parseLocalDate(ipo.listingAt);
      if (!isNaN(d.getTime())) {
        events.push({
          name, start: d, end: d,
          color: "#1A4FA0", bgColor: "#E1EFFE", status: "상장",
          priceRange: price, competition: compStr,
          logoUrl: logo, iconType: "dot", isBar: false,
        });
      }
    }
  }
  return events;
}

function buildIpo38CalEvents(ipo38: Ipo38Item[]): CalEvent[] {
  const events: CalEvent[] = [];
  const today = new Date(); today.setHours(0, 0, 0, 0);
  for (const item of ipo38) {
    const name = item.stockName;
    if (!name) continue;
    const price = fmtPrice(item.minOfferPrice, item.maxOfferPrice, item.finalOfferPrice);
    const compStr = item.competitionRate || "-";

    if (item.subscriptionStartDate && item.subscriptionEndDate) {
      const start = parseLocalDate(item.subscriptionStartDate);
      const end = parseLocalDate(item.subscriptionEndDate);
      if (isNaN(start.getTime()) || isNaN(end.getTime())) continue;
      const isOngoing = start <= today && today <= end;
      const isPast = end < today;
      const color = isOngoing ? "#c0392b" : isPast ? "#888" : "#6c3483";
      const bgColor = isOngoing ? "#FCDBD5" : isPast ? "#F3F5F6" : "#D7C8E8";
      const status = isOngoing ? "공모청약" : isPast ? "청약완료" : "청약예정";
      events.push({
        name, start, end, color, bgColor, status,
        priceRange: price, competition: compStr,
        logoUrl: null, iconType: "square", isBar: true,
      });
    }
    // 배정 (+1 영업일), 환불 (+2 영업일) — 청약종료일이 있을 때만
    if (item.subscriptionEndDate) {
      const allotDate = addBusinessDays(item.subscriptionEndDate, 1);
      const refundDate = addBusinessDays(item.subscriptionEndDate, 2);
      events.push({
        name, start: allotDate, end: allotDate,
        color: "#33691e", bgColor: "#F1F8E9", status: "배정",
        priceRange: price, competition: compStr,
        logoUrl: null, iconType: "snowflake", isBar: false,
      });
      events.push({
        name, start: refundDate, end: refundDate,
        color: "#b7601e", bgColor: "#FFF1E0", status: "환불",
        priceRange: price, competition: compStr,
        logoUrl: null, iconType: "dash", isBar: false,
      });
    }

    if (item.listingDate) {
      const d = parseLocalDate(item.listingDate);
      if (!isNaN(d.getTime())) {
        const isPast = d < today;
        events.push({
          name, start: d, end: d,
          color: isPast ? "#555" : "#1b5e20",
          bgColor: isPast ? "#EFEFEF" : "#E8F5E9",
          status: "상장",
          priceRange: price, competition: compStr,
          logoUrl: null, iconType: "dot", isBar: false,
        });
      }
    }
  }
  return events;
}

function IpoEventIcon({ type, color }: { type: CalEvent["iconType"]; color: string }) {
  switch (type) {
    case "square":    return <span style={{ color }} className="text-[8px] leading-none shrink-0 mr-0.5">■</span>;
    case "circle":    return <span style={{ color }} className="text-[9px] leading-none shrink-0 mr-0.5">○</span>;
    case "snowflake": return <span style={{ color }} className="text-[9px] leading-none shrink-0 mr-0.5">✦</span>;
    case "dash":      return <span style={{ color }} className="text-[10px] leading-none shrink-0 mr-0.5 font-bold">─</span>;
    default:          return <span className="inline-block w-[6px] h-[6px] rounded-full shrink-0 mr-0.5 mt-[1px]" style={{ backgroundColor: color || "#BFC0C1" }} />;
  }
}

function CalendarGrid({ year, month, events }: { year: number; month: number; events: CalEvent[] }) {
  const weeks = useMemo(() => getMonthWeeks(year, month), [year, month]);
  const dayNames = ["월", "화", "수", "목", "금"];
  const today = new Date(); today.setHours(0, 0, 0, 0);

  const barEvents = useMemo(() => events.filter(ev => ev.isBar), [events]);
  const dotEvents = useMemo(() => events.filter(ev => !ev.isBar), [events]);

  function getWeekBarLanes(week: Date[]) {
    const weekFirst = week[0].getTime();
    const weekLast = week[4].getTime();
    const applicable = barEvents.filter(ev =>
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
      {/* Day headers */}
      <div className="grid grid-cols-5 border-b border-[#E0E2E4]">
        {dayNames.map(d => (
          <div key={d} className="px-2 py-2.5 text-[13px] text-[#9D9FA0] font-medium text-center border-r border-[#E0E2E4] last:border-r-0 bg-[#FAFBFC]">{d}</div>
        ))}
      </div>

      {weeks.map((week, wi) => {
        const lanes = getWeekBarLanes(week);
        const weekDots = week.map(day => dotEvents.filter(ev => sameDay(ev.start, day)));
        const hasDots = weekDots.some(dots => dots.length > 0);
        const minHeight = Math.max(52, lanes.length * 26 + 30);

        return (
          <div key={wi} className="border-b border-[#E0E2E4] last:border-b-0">

            {/* Date numbers row */}
            <div className="grid grid-cols-5">
              {week.map((day, di) => {
                const isThisMonth = day.getMonth() === month;
                const isToday = sameDay(day, today);
                return (
                  <div key={di} className={`border-r border-[#E0E2E4] last:border-r-0 px-2 pt-1.5 pb-0 ${isToday ? "bg-[#F5F7FA]" : "bg-white"}`}>
                    <div className={`text-right leading-none py-0.5 ${isThisMonth ? "text-[#14181B]" : "text-[#C5C7CB]"}`}>
                      {isToday
                        ? <span className="inline-flex items-center justify-center w-[22px] h-[22px] rounded-full bg-[#14181B] text-white text-[11px] font-bold">{day.getDate()}</span>
                        : <span className="inline-flex items-center justify-center w-[22px] h-[22px] text-[12px]">{day.getDate()}</span>
                      }
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bar events (horizontal spanning pills) */}
            <div className="bg-white" style={{ minHeight: lanes.length > 0 ? lanes.length * 26 + 4 : 4 }}>
              {lanes.map((lane, li) => {
                const cells: JSX.Element[] = [];
                let col = 0;
                while (col < 5) {
                  const ev = lane[col];
                  if (!ev) {
                    cells.push(<div key={col} style={{ flex: 1, minWidth: 0 }} className="h-[22px]" />);
                    col++;
                  } else {
                    let span = 1;
                    while (col + span < 5 && lane[col + span] === ev) span++;
                    const isStart = col === 0 || lane[col - 1] !== ev;
                    const isEnd = col + span >= 5 || lane[col + span] !== ev;
                    cells.push(
                      <div
                        key={col}
                        style={{
                          flex: span,
                          backgroundColor: ev.bgColor,
                          borderRadius: isStart && isEnd ? 3 : isStart ? "3px 0 0 3px" : isEnd ? "0 3px 3px 0" : 0,
                          marginLeft: isStart ? 2 : 0,
                          marginRight: isEnd ? 2 : 0,
                        }}
                        className="h-[22px] flex items-center px-1.5 overflow-hidden"
                        title={`${ev.name} (${ev.status})`}
                      >
                        {isStart && (
                          <>
                            {ev.logoUrl
                              ? <img src={ev.logoUrl} alt="" className="w-[14px] h-[14px] rounded-sm object-cover shrink-0 mr-0.5" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                              : <span className="inline-flex items-center justify-center w-[14px] h-[14px] rounded-sm shrink-0 mr-0.5 text-[8px] font-bold text-white" style={{ backgroundColor: ev.color }}>{ev.name.charAt(0)}</span>
                            }
                            <span className="text-[11px] font-medium truncate leading-none" style={{ color: ev.color }}>{ev.name}</span>
                          </>
                        )}
                        {!isStart && !isEnd && <span className="text-transparent text-[11px] leading-none">·</span>}
                      </div>
                    );
                    col += span;
                  }
                }
                return <div key={li} className="flex mb-[2px]">{cells}</div>;
              })}
            </div>

            {/* Dot events — per-column stacked items */}
            {hasDots && (
              <div className="grid grid-cols-5 border-t border-[#F3F5F6]">
                {weekDots.map((dots, di) => {
                  const isToday = sameDay(week[di], today);
                  return (
                    <div
                      key={di}
                      className={`border-r border-[#E0E2E4] last:border-r-0 px-1.5 py-1 ${isToday ? "bg-[#F5F7FA]" : "bg-white"}`}
                    >
                      {dots.slice(0, 6).map((ev, ei) => (
                        <div
                          key={ei}
                          className="flex items-center gap-0.5 py-[2px] min-w-0"
                          title={`${ev.name} (${ev.status})`}
                        >
                          {ev.logoUrl
                            ? <img src={ev.logoUrl} alt="" className="w-[13px] h-[13px] rounded-sm object-cover shrink-0" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                            : <IpoEventIcon type={ev.iconType} color={ev.color} />
                          }
                          <span className="text-[11px] text-[#585B5E] truncate leading-snug">{ev.name}</span>
                        </div>
                      ))}
                      {dots.length > 6 && (
                        <span className="text-[10px] text-[#9D9FA0]">+{dots.length - 6}개</span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
            {!hasDots && lanes.length === 0 && <div className="bg-white" style={{ minHeight: 28 }} />}
          </div>
        );
      })}
    </div>
  );
}

const MONTH_OPTIONS = [
  { label: "5월", src: "/naver-ipo-may.html" },
  { label: "6월", src: "/naver-ipo-jun.html" },
  { label: "7월", src: "/naver-ipo-jul.html" },
  { label: "8월", src: "/naver-ipo.html" },
];

function CalendarIframeSection() {
  const today = new Date();
  const todayMonth = today.getMonth() + 1;
  const defaultIdx = MONTH_OPTIONS.findIndex((m) =>
    m.label === `${todayMonth}월`
  );
  const [monthIdx, setMonthIdx] = useState(defaultIdx >= 0 ? defaultIdx : MONTH_OPTIONS.length - 1);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const goTo = (idx: number) => {
    const clamped = Math.max(0, Math.min(MONTH_OPTIONS.length - 1, idx));
    setMonthIdx(clamped);
  };

  const handleIframeLoad = () => {
    const doc = iframeRef.current?.contentDocument;
    if (!doc) return;

    const prev = doc.querySelector(".fc-customPrev-button");
    const next = doc.querySelector(".fc-customNext-button");
    const todayBtn = doc.querySelector(".fc-customToday-button");

    if (prev) {
      prev.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        setMonthIdx((cur) => Math.max(0, cur - 1));
      });
    }
    if (next) {
      next.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        setMonthIdx((cur) => Math.min(MONTH_OPTIONS.length - 1, cur + 1));
      });
    }
    if (todayBtn) {
      todayBtn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        const ti = MONTH_OPTIONS.findIndex((m) => m.label === `${todayMonth}월`);
        setMonthIdx(ti >= 0 ? ti : MONTH_OPTIONS.length - 1);
      });
    }
  };

  return (
    <div>
      <iframe
        ref={iframeRef}
        key={MONTH_OPTIONS[monthIdx].src}
        src={MONTH_OPTIONS[monthIdx].src}
        className="w-full border-0"
        style={{ height: "calc(100vh - 160px)", minHeight: 700 }}
        title="공모주 IPO 캘린더"
        onLoad={handleIframeLoad}
      />
    </div>
  );
}

function CalendarSection() {
  const today = new Date(); today.setHours(0, 0, 0, 0);
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
  const richIpoList: RichIpoItem[] = ipoApiData?.richIpoList || [];
  const ipo38Raw: Ipo38Item[] = ipoApiData?.ipo38 || [];

  // 네이버 캘린더 기준 누락 종목 보완 데이터
  const STATIC_IPO_SUPPLEMENTS: Ipo38Item[] = [
    // 기존 ipo38에 있지만 listingDate 없는 종목에 상장일 추가
    { stockName: "져스텍",      subscriptionStartDate: "2026-06-18", subscriptionEndDate: "2026-06-19", listingDate: "2026-06-29", type: "subscription" },
    { stockName: "스트라드비젼", subscriptionStartDate: "2026-06-18", subscriptionEndDate: "2026-06-19", listingDate: "2026-06-30", type: "subscription" },
    { stockName: "한국스팩16호", subscriptionStartDate: "2026-06-22", subscriptionEndDate: "2026-06-23", listingDate: "2026-06-30", type: "subscription" },
    { stockName: "매드업",      subscriptionStartDate: "2026-06-23", subscriptionEndDate: "2026-06-24", listingDate: "2026-07-01", type: "subscription" },
    { stockName: "레몬헬스케어", subscriptionStartDate: "2026-06-24", subscriptionEndDate: "2026-06-25", listingDate: "2026-07-06", type: "subscription" },
    // ipo38에 없는 누락 상장 종목
    { stockName: "에프엠더불유",   subscriptionStartDate: "", subscriptionEndDate: "", listingDate: "2026-06-30", type: "listing" },
    { stockName: "엠디에스코리아", subscriptionStartDate: "", subscriptionEndDate: "", listingDate: "2026-07-02", type: "listing" },
    { stockName: "(주)진코스텍",   subscriptionStartDate: "", subscriptionEndDate: "", listingDate: "2026-07-06", type: "listing" },
    { stockName: "스카이펌스",    subscriptionStartDate: "", subscriptionEndDate: "", listingDate: "2026-07-07", type: "listing" },
    { stockName: "네오사파이언스", subscriptionStartDate: "", subscriptionEndDate: "", listingDate: "2026-07-09", type: "listing" },
    { stockName: "엔키화이토햇",  subscriptionStartDate: "", subscriptionEndDate: "", listingDate: "2026-07-09", type: "listing" },
  ];

  // supplement + 서버 ipo38 병합: 서버 데이터 우선, listingDate는 서버에 없으면 supplement 사용
  const ipo38 = useMemo(() => {
    const suppMap = new Map<string, Ipo38Item>(STATIC_IPO_SUPPLEMENTS.map(i => [i.stockName, { ...i }]));
    const merged: Ipo38Item[] = [];
    for (const item of ipo38Raw) {
      const supp = suppMap.get(item.stockName);
      if (supp) {
        merged.push({ ...supp, ...item, listingDate: item.listingDate || supp.listingDate });
        suppMap.delete(item.stockName);
      } else {
        merged.push(item);
      }
    }
    for (const item of suppMap.values()) merged.push(item);
    return merged;
  }, [ipo38Raw]);

  const events = useMemo(() => {
    const norm = (s: string) => s.replace(/\s/g, "").replace(/져/g, "저").replace(/쟤/g, "재").toLowerCase();
    // 종목명 + 마일스톤 버킷(수요예측/청약/배정/환불/상장/심사 등) 조합으로 키를 만들어
    // 같은 종목이라도 서로 다른 일정(예: 8월 청약 vs 7월 수요예측)은 중복 제거되지 않도록 함
    const evKey = (e: CalEvent) => `${norm(e.name)}|${bucketOf(e.status)}`;

    const dbEvents = buildDbCalEvents(dbStocks);
    const dbKeys = new Set(dbEvents.map(evKey));

    // 38.co.kr 이벤트 (가장 최신/풍부한 공모주 일정)
    const ipo38Events = ipo38.length > 0 ? buildIpo38CalEvents(ipo38) : [];
    const ipo38Keys = new Set(ipo38Events.map(evKey));

    // Rich 데이터가 있으면 우선 사용 (수요예측+공모청약+상장 전부 포함)
    const richEvents = richIpoList.length > 0 ? buildRichCalEvents(richIpoList) : [];
    // Naver 이벤트 (rich에 없는 종목 보완)
    const naverEvents = naverData ? buildCalEvents(naverData) : [];
    const richKeys = new Set(richEvents.map(evKey));

    // 동일 종목이라도 마일스톤 유형이 다르면 유지, 완전히 같은 유형만 중복 제거
    const filtered38 = ipo38Events.filter(e => !dbKeys.has(evKey(e)));
    const filteredRich = richEvents.filter(e => !dbKeys.has(evKey(e)) && !ipo38Keys.has(evKey(e)));
    const filteredNaver = naverEvents.filter(e => !richKeys.has(evKey(e)) && !dbKeys.has(evKey(e)) && !ipo38Keys.has(evKey(e)));
    return [...dbEvents, ...filtered38, ...filteredRich, ...filteredNaver];
  }, [naverData, dbStocks, richIpoList, ipo38]);

  const beingIPO = naverData?.beingIPOList || [];
  const toBeIPO = naverData?.toBeIPOList || [];
  const naverReadyIPO: any[] = naverData?.readyToIpoStocks || [];
  const ipoNews = naverData?.ipoNews || [];

  // Naver 로고 맵 (종목명 정규화 → logoUrl)
  const norm = (s: string) => s.replace(/\s/g, "").replace(/져/g, "저").toLowerCase();
  const naverLogoMap = useMemo(() => {
    const m: Record<string, string> = {};
    for (const s of naverReadyIPO) {
      if (s.stockName && s.logoUrl) m[norm(s.stockName)] = s.logoUrl;
    }
    return m;
  }, [naverReadyIPO]);

  // DB 심사청구 종목을 사이드바 형식으로 변환 (Naver 로고 매칭)
  const dbReadyIPO = useMemo(() => {
    return dbStocks
      .filter(s => s.subscriptionStatus === "심사청구")
      .sort((a, b) => (b.startDate || "").localeCompare(a.startDate || ""))
      .map(s => ({
        stockName: s.stockName,
        ipoDate: s.startDate,
        ipoState: "EXAMINATION_REQUESTED",
        logoUrl: naverLogoMap[norm(s.stockName)] || "",
        _fromDb: true,
      }));
  }, [dbStocks, naverLogoMap]);

  // Naver readyIPO에서 DB에 없는 종목만 추가
  const dbReadyNames = useMemo(() => new Set(dbReadyIPO.map(s => norm(s.stockName))), [dbReadyIPO]);
  const readyIPO = useMemo(() => [
    ...dbReadyIPO,
    ...naverReadyIPO.filter(s => !dbReadyNames.has(norm(s.stockName))),
  ], [dbReadyIPO, naverReadyIPO, dbReadyNames]);

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

  // DB 종목을 사이드바 형식으로 변환 (마감일이 지난 과거 항목은 진행중/예정 집계에서 제외)
  const dbBeingIPO = dbStocks
    .filter(s => s.subscriptionStatus === "청약진행중" && s.endDate && parseLocalDate(s.endDate) >= today)
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
    .filter(s => s.subscriptionStatus === "청약예정" && s.endDate && parseLocalDate(s.endDate) >= today)
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

  // 38.co.kr 데이터를 사이드바 형식으로 변환
  const todayMidnight = new Date(); todayMidnight.setHours(0, 0, 0, 0);
  const ipo38Being = ipo38.filter(x => {
    if (!x.subscriptionStartDate || !x.subscriptionEndDate) return false;
    const s = parseLocalDate(x.subscriptionStartDate);
    const e = parseLocalDate(x.subscriptionEndDate);
    return s <= todayMidnight && todayMidnight <= e;
  }).map(x => ({
    stockName: x.stockName,
    stockCode: null,
    closedDate: x.subscriptionEndDate,
    offeringStartAt: x.subscriptionStartDate,
    minExpectedOfferPrice: x.minOfferPrice,
    maxExpectedOfferPrice: x.maxOfferPrice,
    finalOfferPrice: x.finalOfferPrice,
    instCompetitiveness: x.competitionRate ? parseFloat(x.competitionRate) : null,
    logoUrl: null,
    brokers: x.brokers,
    _from38: true,
  }));
  const ipo38ToBe = ipo38.filter(x => {
    if (!x.subscriptionStartDate) return false;
    const s = parseLocalDate(x.subscriptionStartDate);
    return s > todayMidnight;
  }).map(x => ({
    stockName: x.stockName,
    stockCode: null,
    closedDate: x.subscriptionEndDate,
    offeringStartAt: x.subscriptionStartDate,
    minExpectedOfferPrice: x.minOfferPrice,
    maxExpectedOfferPrice: x.maxOfferPrice,
    finalOfferPrice: x.finalOfferPrice,
    instCompetitiveness: x.competitionRate ? parseFloat(x.competitionRate) : null,
    logoUrl: null,
    brokers: x.brokers,
    listingDate: x.listingDate,
    _from38: true,
  }));

  // Naver 데이터와 합치되 DB에 있는 종목은 제외
  const dbBeingNames = new Set(dbBeingIPO.map(s => s.stockName));
  const dbToBeNames = new Set(dbToBeIPO.map(s => s.stockName));
  const ipo38BeingNames = new Set(ipo38Being.map(s => s.stockName));
  const ipo38ToBeNames = new Set(ipo38ToBe.map(s => s.stockName));
  const mergedBeingIPO = [
    ...dbBeingIPO,
    ...ipo38Being.filter(s => !dbBeingNames.has(s.stockName)),
    ...beingIPO.filter((s: any) => !dbBeingNames.has(s.stockName) && !ipo38BeingNames.has(s.stockName)),
  ];
  const mergedToBeIPO = [
    ...dbToBeIPO,
    ...ipo38ToBe.filter(s => !dbToBeNames.has(s.stockName)),
    ...toBeIPO.filter((s: any) => !dbToBeNames.has(s.stockName) && !ipo38ToBeNames.has(s.stockName)),
  ];

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

          {/* Naver 스타일 2행 레전드 */}
          <div className="flex flex-col gap-1.5 mb-4">
            {/* Row 1: 단계 배지 - Naver와 동일: 흰 배경 + 회색 테두리 + 컬러 도트 */}
            <div className="flex flex-wrap gap-1.5">
              {BADGE_LEGEND.map(({ label, dotColor }) => (
                <span key={label} className="inline-flex items-center gap-1.5 text-[12px] px-3 py-1 rounded-full border border-[#E0E2E4] bg-white" style={{ color: "#585B5E" }}>
                  <span className="w-3 h-3 rounded-full shrink-0 inline-block" style={{ backgroundColor: dotColor }} />
                  {label}
                </span>
              ))}
            </div>
            {/* Row 2: 이벤트 아이콘 */}
            <div className="flex flex-wrap gap-1.5">
              {ICON_LEGEND.map(({ label, icon, color, bg, border }) => (
                <span key={label} className="inline-flex items-center gap-1 text-[12px] px-2.5 py-1 rounded-full border" style={{ backgroundColor: bg, borderColor: border, color: "#585B5E" }}>
                  <span style={{ color }} className="text-[10px] leading-none font-bold">{icon}</span>
                  {label}
                </span>
              ))}
            </div>
          </div>

          {isLoading ? (
            <div className="border border-[#E0E2E4] rounded-lg overflow-hidden animate-pulse">
              <div className="h-10 bg-[#fafafa] border-b border-[#E0E2E4]" />
              {[...Array(5)].map((_, i) => <div key={i} className="h-24 border-b border-[#E0E2E4] last:border-b-0 bg-white" />)}
            </div>
          ) : (
            <div className="overflow-x-auto -mx-4 px-4">
              <div className="min-w-[340px]">
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
              <li>데이터 출처: 38커뮤니케이션 (www.38.co.kr), Npay 비상장 (ustock.naver.com)</li>
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

function TradeSection() {
  const [chartIdx, setChartIdx] = useState(0);

  const { data: ipoApiData, isLoading } = useQuery<IpoCalendarApiResponse>({
    queryKey: ["/api/market/ipo-calendar"],
    refetchInterval: 5 * 60 * 1000,
  });

  const naverData = ipoApiData?.naverData;
  const popularStocks: any[] = naverData?.popularStocks || [];
  const newlyListed: any[] = naverData?.newlyListedStocks || [];
  const readyToIpo: any[] = naverData?.readyToIpoStocks || [];

  function fmtTimeAgo(iso?: string): string {
    if (!iso) return "";
    try {
      const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
      if (diff < 1) return "방금";
      if (diff < 60) return `${diff}분`;
      const h = Math.floor(diff / 60);
      if (h < 24) return `${h}시간`;
      return `${Math.floor(h / 24)}일`;
    } catch { return ""; }
  }

  function fmtIpoDate(iso?: string): string {
    if (!iso) return "";
    try {
      const d = parseLocalDate(iso);
      const yy = String(d.getFullYear()).slice(2);
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      return `${yy}.${mm}.${dd}`;
    } catch { return ""; }
  }

  const chartStock = newlyListed.find(s => s.ustockLowestPrice && s.finalOfferPrice && s.high52wPrice) || newlyListed[chartIdx];
  const chartStocks = newlyListed.filter(s => s.ustockLowestPrice && s.finalOfferPrice);
  const currentChart = chartStocks[chartIdx % Math.max(chartStocks.length, 1)] || chartStock;

  const baseDt = ipoApiData?.lastUpdated
    ? new Date(ipoApiData.lastUpdated).toLocaleDateString("ko-KR", { month: "2-digit", day: "2-digit" }).replace(". ", ".").replace(".", "").trim() + " " +
      new Date(ipoApiData.lastUpdated).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", hour12: false })
    : "";

  return (
    <div className="max-w-[1200px] mx-auto px-4 py-6" data-testid="section-trade">

      {/* 헤더 */}
      <h2 className="text-[16px] sm:text-[20px] font-bold text-[#14181B] mb-4 sm:mb-6">청약 전에도 비상장 주식으로 미리 거래할 수 있어요!</h2>

      {/* TOP5 + 차트 2컬럼 */}
      {isLoading ? (
        <div className="flex flex-col lg:flex-row gap-4 mb-10 animate-pulse">
          <div className="flex-1 border border-[#E0E2E4] rounded-2xl h-64 bg-[#F9FAFB]" />
          <div className="lg:w-[340px] border border-[#E0E2E4] rounded-2xl h-64 bg-[#F9FAFB]" />
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-4 mb-10">
          {/* LEFT: TOP5 랭킹 */}
          {popularStocks.length > 0 && (
            <div className="flex-1 border border-[#E0E2E4] rounded-2xl bg-white overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-[#F3F5F6]">
                <h3 className="text-[14px] font-bold text-[#14181B]">지금 거래 많은 IPO 종목 TOP5</h3>
                {baseDt && <span className="text-[11px] text-[#9D9FA0]">{baseDt} 기준</span>}
              </div>
              <div>
                {popularStocks.slice(0, 5).map((s: any, i: number) => (
                  <div key={i} className="flex items-center gap-3 px-5 py-3.5 border-b border-[#F9FAFB] last:border-b-0 hover:bg-[#FAFAFA] cursor-pointer transition-colors" data-testid={`popular-stock-${i}`}>
                    <span className="text-[15px] font-bold text-[#14181B] w-5 shrink-0 text-center">{i + 1}</span>
                    <StockIcon name={s.stockName} logoUrl={s.logoUrl} size={36} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[14px] font-bold text-[#14181B] truncate">{s.stockName}</span>
                        <span className="text-[10px] text-[#9D9FA0] bg-[#F3F5F6] px-1.5 py-px rounded font-medium shrink-0">IPO</span>
                      </div>
                      {s.currentPrice != null ? (
                        <p className="text-[12px] text-[#585B5E] mt-0.5">
                          일반 {s.currentPrice.toLocaleString()}원
                          {s.changeRate != null && (
                            <span className={`ml-1.5 font-semibold ${s.changeRate > 0 ? "text-[#f04452]" : s.changeRate < 0 ? "text-[#3182f6]" : "text-[#9D9FA0]"}`}>
                              {s.changeRate > 0 ? "+" : ""}{s.changeRate.toFixed(2)}%
                            </span>
                          )}
                        </p>
                      ) : (
                        <p className="text-[12px] text-[#9D9FA0]">전문</p>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      {s.hasSellBoard && (
                        <p className="text-[12px] font-bold text-[#f04452]">지금 매수가능</p>
                      )}
                      {s.lastTradedAt && (
                        <p className="text-[11px] text-[#9D9FA0] mt-0.5">{fmtTimeAgo(s.lastTradedAt)} 전 체결</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* RIGHT: 비상장 주식일 때 미리 샀다면? */}
          {chartStocks.length > 0 && currentChart && (
            <div className="lg:w-[340px] border border-[#E0E2E4] rounded-2xl bg-white overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-[#F3F5F6]">
                <h3 className="text-[14px] font-bold text-[#14181B]">비상장 주식일 때 미리 샀다면?</h3>
                <div className="flex items-center gap-1">
                  <button onClick={() => setChartIdx(i => (i - 1 + chartStocks.length) % chartStocks.length)} className="w-6 h-6 rounded-full border border-[#E0E2E4] flex items-center justify-center hover:bg-[#F3F5F6] transition-colors" data-testid="chart-prev"><ChevronLeft className="w-3.5 h-3.5 text-[#585B5E]" /></button>
                  <button onClick={() => setChartIdx(i => (i + 1) % chartStocks.length)} className="w-6 h-6 rounded-full border border-[#E0E2E4] flex items-center justify-center hover:bg-[#F3F5F6] transition-colors" data-testid="chart-next"><ChevRight className="w-3.5 h-3.5 text-[#585B5E]" /></button>
                </div>
              </div>
              <div className="px-5 pt-4 pb-2">
                <div className="flex items-baseline gap-2 mb-4">
                  <span className="text-[15px] font-bold text-[#14181B]">{currentChart.name}</span>
                  {currentChart.listingAt && <span className="text-[11px] text-[#9D9FA0]">{fmtIpoDate(currentChart.listingAt)} 상장</span>}
                </div>
                {/* 바 차트 */}
                {(() => {
                  const v1 = currentChart.ustockLowestPrice || 0;
                  const v2 = currentChart.finalOfferPrice || 0;
                  const v3 = currentChart.high52wPrice || 0;
                  const maxV = Math.max(v1, v2, v3, 1);
                  const h1 = Math.round((v1 / maxV) * 140);
                  const h2 = Math.round((v2 / maxV) * 140);
                  const h3 = Math.round((v3 / maxV) * 140);
                  return (
                    <div className="relative">
                      {currentChart.changeRateFromLowestPrice != null && (
                        <div className="absolute top-0 left-0 bg-[#f04452] text-white text-[11px] font-bold px-2.5 py-1.5 rounded-lg leading-tight z-10">
                          공모가 대비<br />{currentChart.changeRateFromLowestPrice.toFixed(2)}%<br />더 저렴했어요!
                        </div>
                      )}
                      <div className="flex items-end justify-around h-[160px] pb-1 gap-3 px-2">
                        {[
                          { h: h1, color: "#FBD5D8", label: "비상장 가격", val: v1 },
                          { h: h2, color: "#F8A8B0", label: "확정 공모가", val: v2 },
                          { h: h3, color: "#F47480", label: "상장 후 최고가", val: v3 },
                        ].map((bar, bi) => (
                          <div key={bi} className="flex flex-col items-center gap-1 flex-1">
                            <div className="w-full rounded-t-md transition-all" style={{ height: bar.h, backgroundColor: bar.color, minHeight: 8 }} />
                            <span className="text-[10px] text-[#585B5E] font-bold">{bar.val.toLocaleString()}원</span>
                            <span className="text-[10px] text-[#9D9FA0] text-center leading-tight">{bar.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}
                <p className="text-[10px] text-[#BFC0C1] mt-3 leading-relaxed">※ 비상장 가격은 Npay 비상장의 최저가 기준이며, 상장 후 최고가는 최근 52주 내 가격 기준입니다.</p>
              </div>
              {/* 캐러셀 도트 */}
              {chartStocks.length > 1 && (
                <div className="flex justify-center gap-1 pb-3">
                  {chartStocks.slice(0, 8).map((_: any, di: number) => (
                    <button key={di} onClick={() => setChartIdx(di)} className={`w-1.5 h-1.5 rounded-full transition-colors ${di === chartIdx % chartStocks.length ? "bg-[#14181B]" : "bg-[#E0E2E4]"}`} />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 이제 막 상장준비를 시작한, 눈여겨 볼 종목 */}
      {readyToIpo.length > 0 && (
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mb-4">
            <h3 className="text-[14px] sm:text-[15px] font-bold text-[#14181B]">이제 막 상장준비를 시작한, 눈여겨 볼 종목</h3>
            {baseDt && <span className="text-[11px] text-[#9D9FA0]">{baseDt} 기준</span>}
          </div>
          <div className="overflow-x-auto -mx-4 px-4">
            <div className="flex gap-3 pb-2" style={{ minWidth: "max-content" }}>
              {readyToIpo.map((s: any, i: number) => {
                const stateInfo = IPO_STATE_MAP[s.ipoState as string] || { label: s.ipoState || "준비중", color: "#9D9FA0", bgColor: "#F3F5F6" };
                return (
                  <div key={i} className="w-[128px] border border-[#E0E2E4] rounded-xl p-3 bg-white hover:border-[#C5C7CB] hover:shadow-sm transition-all cursor-pointer shrink-0" data-testid={`ready-ipo-${i}`}>
                    <div className="flex justify-center mb-2">
                      <StockIcon name={s.stockName} logoUrl={s.logoUrl} size={36} />
                    </div>
                    <p className="text-[12px] font-bold text-[#14181B] text-center truncate leading-tight mb-0.5">{s.stockName}</p>
                    <p className="text-[11px] text-[#9D9FA0] text-center mb-2">전문</p>
                    <div className="text-center">
                      <span className="text-[10px] text-[#9D9FA0]">{fmtIpoDate(s.ipoDate)} </span>
                      <span className="text-[10px] font-semibold" style={{ color: stateInfo.color }}>{stateInfo.label}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

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
      <GlobalNav />

      <div className="max-w-[1200px] mx-auto px-4 pt-4 sm:pt-8 pb-0">
        <div className="flex items-center gap-0 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActivePageTab("calendar")}
            className={`text-[16px] sm:text-[22px] font-bold transition-colors whitespace-nowrap ${activePageTab === "calendar" ? "text-[#14181B]" : "text-[#9D9FA0]"}`}
            data-testid="tab-page-calendar"
          >
            공모주 IPO 캘린더
          </button>
          <span className="mx-2 sm:mx-3 text-[#C5C7CB] text-[16px] sm:text-[18px]">|</span>
          <button
            onClick={() => setActivePageTab("trade")}
            className={`text-[16px] sm:text-[22px] font-bold transition-colors whitespace-nowrap ${activePageTab === "trade" ? "text-[#14181B]" : "text-[#9D9FA0]"}`}
            data-testid="tab-page-trade"
          >
            청약 전 거래
          </button>
          <span className="mx-2 sm:mx-3 text-[#C5C7CB] text-[16px] sm:text-[18px]">|</span>
          <button
            onClick={() => setActivePageTab("faq")}
            className={`text-[16px] sm:text-[22px] font-bold transition-colors whitespace-nowrap ${activePageTab === "faq" ? "text-[#14181B]" : "text-[#9D9FA0]"}`}
            data-testid="tab-page-faq"
          >
            FAQ
          </button>
        </div>
      </div>

      {activePageTab === "calendar" && (
        <CalendarIframeSection />
      )}
      {activePageTab === "trade" && <TradeSection />}
      {activePageTab === "faq" && <FAQSection />}

      <footer className="border-t border-[#E0E2E4] mt-12 bg-[#F9FAFB]">
        <div className="max-w-[1200px] mx-auto px-4 py-6 sm:py-8">
          <div className="flex items-center gap-1.5 mb-3">
            <SiteLogoBadge size={20} />
          </div>
          <p className="text-[11px] text-[#9D9FA0] leading-relaxed">
            Npay 비상장은 비상장주식 거래 정보를 제공하며, 투자 판단에 대한 책임은 투자자 본인에게 있습니다.
          </p>
          <p className="text-[11px] text-[#C5C7CB] mt-1.5">© 2026 Npay 비상장. All rights reserved.</p>
        </div>
      </footer>
      <style>{`
        .scrollbar-none::-webkit-scrollbar { display: none; }
        .scrollbar-none { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
