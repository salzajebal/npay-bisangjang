import { useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import {
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  ExternalLink,
  ArrowLeft,
  Info,
} from "lucide-react";
import { SiteLogoBadge } from "@/components/site-logo";
import { StockIcon } from "@/components/stock-icon";
import { getQueryFn } from "@/lib/queryClient";

type PageTab = "calendar" | "pretrade" | "faq";

const IPO_STATUS_LEGEND = [
  { label: "주관사선정", dot: "#FFC107" },
  { label: "기술평가통과", dot: "#CE93D8" },
  { label: "심사청구", dot: "#E57373" },
  { label: "심사승인", dot: "#EF5350" },
  { label: "신고서제출", dot: "#EC407A" },
  { label: "수요예측", dot: "#4CAF50" },
  { label: "공모청약", dot: "#E53935" },
  { label: "상장", dot: "#1565C0" },
  { label: "환불", dot: "#9E9E9E" },
  { label: "배정", dot: "#8BC34A" },
];

const MARCH_CALENDAR_EVENTS = [
  { name: "카나프테라퓨틱스", day: 2, endDay: 4, color: "#D7C8E8", status: "수요예측" },
  { name: "에스팀", day: 3, endDay: 4, color: "#FCDDE1", status: "공모청약" },
  { name: "엑스비스", day: 3, endDay: 4, color: "#FCDDE1", status: "공모청약" },
  { name: "카나프테라퓨틱스", day: 5, endDay: 6, color: "#FCDDE1", status: "공모청약" },
  { name: "에스팀", day: 5, endDay: 5, color: "#9E9E9E", status: "환불" },
  { name: "엑스비스", day: 5, endDay: 5, color: "#9E9E9E", status: "환불" },
  { name: "에스팀", day: 6, endDay: 6, color: "#8BC34A", status: "배정" },
  { name: "엑스비스", day: 6, endDay: 6, color: "#8BC34A", status: "배정" },
  { name: "한패스", day: 9, endDay: 13, color: "#D7C8E8", status: "수요예측" },
  { name: "아이엠바이오로직스", day: 9, endDay: 10, color: "#D7C8E8", status: "수요예측" },
  { name: "에스팀", day: 10, endDay: 10, color: "#1565C0", status: "상장" },
  { name: "아이엠바이오로직스", day: 11, endDay: 12, color: "#FCDDE1", status: "공모청약" },
  { name: "엑스비스", day: 11, endDay: 11, color: "#1565C0", status: "상장" },
  { name: "카나프테라퓨틱스", day: 9, endDay: 9, color: "#9E9E9E", status: "환불" },
  { name: "카나프테라퓨틱스", day: 10, endDay: 10, color: "#8BC34A", status: "배정" },
  { name: "한패스", day: 16, endDay: 17, color: "#FCDDE1", status: "공모청약" },
  { name: "아이엠바이오로직스", day: 13, endDay: 13, color: "#9E9E9E", status: "환불" },
  { name: "카나프테라퓨틱스", day: 17, endDay: 17, color: "#1565C0", status: "상장" },
  { name: "아이엠바이오로직스", day: 16, endDay: 16, color: "#8BC34A", status: "배정" },
  { name: "스카이랩스", day: 16, endDay: 20, color: "#E8E8E8", status: "심사청구" },
  { name: "한패스", day: 19, endDay: 19, color: "#9E9E9E", status: "환불" },
  { name: "한패스", day: 20, endDay: 20, color: "#8BC34A", status: "배정" },
  { name: "리센스메디컬", day: 16, endDay: 18, color: "#D7C8E8", status: "수요예측" },
  { name: "리센스메디컬", day: 19, endDay: 20, color: "#FCDDE1", status: "공모청약" },
  { name: "신한제17호기업인수목적", day: 19, endDay: 20, color: "#FCDDE1", status: "공모청약" },
  { name: "레메디", day: 23, endDay: 27, color: "#D7C8E8", status: "수요예측" },
  { name: "아이엠바이오로직스", day: 24, endDay: 24, color: "#1565C0", status: "상장" },
  { name: "인벤테라", day: 23, endDay: 24, color: "#FCDDE1", status: "공모청약" },
  { name: "교보20호기업인수목적", day: 25, endDay: 26, color: "#FCDDE1", status: "공모청약" },
  { name: "파워큐브세미", day: 25, endDay: 27, color: "#E8E8E8", status: "심사청구" },
  { name: "레메디", day: 30, endDay: 31, color: "#FCDDE1", status: "공모청약" },
];

const APRIL_CALENDAR_EVENTS = [
  // Week 1 (Apr 1~3): 채비 청약, 레메디/리센스메디컬/인벤테라 마무리
  { name: "채비", day: 1, endDay: 2, color: "#FCDDE1", status: "공모청약" },
  { name: "레메디", day: 1, endDay: 1, color: "#9E9E9E", status: "환불" },
  { name: "레메디", day: 2, endDay: 2, color: "#8BC34A", status: "배정" },
  { name: "리센스메디컬", day: 2, endDay: 2, color: "#1565C0", status: "상장" },
  { name: "채비", day: 3, endDay: 3, color: "#9E9E9E", status: "환불" },
  { name: "인벤테라", day: 3, endDay: 3, color: "#1565C0", status: "상장" },
  // Week 2 (Apr 6~10): 키움히어로 청약, 채비 배정/상장, 코스모로보틱스 청약
  { name: "신한제17호기업인수목적", day: 6, endDay: 6, color: "#1565C0", status: "상장" },
  { name: "키움히어로제2호기업인수목적", day: 6, endDay: 7, color: "#FCDDE1", status: "공모청약" },
  { name: "채비", day: 7, endDay: 7, color: "#8BC34A", status: "배정" },
  { name: "교보20호기업인수목적", day: 8, endDay: 8, color: "#1565C0", status: "상장" },
  { name: "레메디", day: 9, endDay: 9, color: "#1565C0", status: "상장" },
  { name: "키움히어로제2호기업인수목적", day: 9, endDay: 9, color: "#9E9E9E", status: "환불" },
  { name: "코스모로보틱스", day: 9, endDay: 10, color: "#FCDDE1", status: "공모청약" },
  { name: "채비", day: 10, endDay: 10, color: "#1565C0", status: "상장" },
  { name: "키움히어로제2호기업인수목적", day: 10, endDay: 10, color: "#8BC34A", status: "배정" },
  // Week 3 (Apr 13~17): 코스모로보틱스 환불/배정, 키움히어로 상장
  { name: "코스모로보틱스", day: 14, endDay: 14, color: "#9E9E9E", status: "환불" },
  { name: "코스모로보틱스", day: 15, endDay: 15, color: "#8BC34A", status: "배정" },
  { name: "키움히어로제2호기업인수목적", day: 17, endDay: 17, color: "#1565C0", status: "상장" },
  // Week 4 (Apr 20~24): 코스모로보틱스 상장
  { name: "코스모로보틱스", day: 22, endDay: 22, color: "#1565C0", status: "상장" },
];

const UPCOMING_IPO_LIST = [
  { name: "리센스메디컬", dDay: 1, date: "03.19 ~ 03.20", priceRange: "11,000원", competition: "1352.63:1", status: "청약예정" },
  { name: "신한제17호기업인수목적", dDay: 1, date: "03.19 ~ 03.20", priceRange: "2,000원", competition: "1343.8:1", status: "청약예정" },
  { name: "인벤테라", dDay: 5, date: "03.23 예정", priceRange: "12,100 ~ 16,600원", competition: "-", status: "청약예정" },
  { name: "교보20호기업인수목적", dDay: 5, date: "03.23 예정", priceRange: "2,000원", competition: "-", status: "청약예정" },
  { name: "레메디", dDay: 12, date: "03.30 예정", priceRange: "12,000 ~ 15,000원", competition: "-", status: "청약예정" },
  { name: "채비", dDay: 14, date: "04.01 ~ 04.02", priceRange: "12,300 ~ 15,300원", competition: "-", status: "청약예정" },
  { name: "키움히어로제2호기업인수목적", dDay: 19, date: "04.06 예정", priceRange: "2,000원", competition: "-", status: "청약예정" },
  { name: "코스모로보틱스", dDay: 22, date: "04.09 ~ 04.10", priceRange: "5,300 ~ 6,000원", competition: "-", status: "청약예정" },
];

const TOP5_IPO_STOCKS = [
  { rank: 1, name: "무신사", category: "일반", tag: "IPO", price: 24400, change: -0.41, tradable: true, tradeTime: "15분 전 체결" },
  { rank: 2, name: "레몬헬스케어", category: "전문", tag: "IPO", price: 0, change: 0, tradable: true, tradeTime: "4시간 전 체결" },
  { rank: 3, name: "스트라드비젼", category: "전문", tag: "IPO", price: 0, change: 0, tradable: true, tradeTime: "4시간 전 체결" },
  { rank: 4, name: "덕산넵코어스", category: "전문", tag: "IPO", price: 0, change: 0, tradable: true, tradeTime: "1시간 전 체결" },
  { rank: 5, name: "케이피항공산업", category: "전문", tag: "IPO", price: 0, change: 0, tradable: true, tradeTime: "44분 전 체결" },
];

const IPO_PREP_STOCKS = [
  { name: "스카이랩스", category: "전문", date: "26.01.30 심사청구", tradable: true },
  { name: "레메디", category: "전문", date: "26.01.30 심사청구", tradable: true },
  { name: "파워큐브세미", category: "전문", date: "26.01.16 심사청구", tradable: false },
  { name: "넥스트젠바이오사이언스", category: "전문", date: "25.12.23 심사청구", tradable: false },
  { name: "피스피스스튜디오", category: "전문", date: "25.12.17 심사청구", tradable: false },
  { name: "빅웨이브로보틱스", category: "전문", date: "25.12.16 심사청구", tradable: false },
  { name: "메타넷엑스", category: "전문", date: "25.12.09 심사청구", tradable: false },
];

const FAQ_ITEMS = [
  { q: "IPO, 공모주 청약이 무슨 뜻인가요?", a: "IPO(Initial Public Offering)는 기업이 처음으로 주식시장에 상장하여 일반 투자자에게 주식을 공개 판매하는 것을 말합니다. 공모주 청약은 상장 전 일정 기간 동안 투자자들이 해당 주식을 신청(청약)하는 과정입니다." },
  { q: "기업은 IPO(기업공개)를 왜 하나요?", a: "기업은 자금 조달, 기업 인지도 향상, 초기 투자자의 투자금 회수 등을 위해 IPO를 진행합니다. 상장을 통해 기업의 가치가 공개적으로 평가되며, 더 넓은 투자자층에 접근할 수 있습니다." },
  { q: "IPO 절차는 어떻게 진행되나요?", a: "IPO는 주관사 선정 → 기업실사 및 가치평가 → 증권신고서 제출 → 수요예측 → 공모가 확정 → 청약 → 배정 → 상장의 순서로 진행됩니다." },
  { q: "공모주 청약을 하고 싶은데, 공모가는 어떻게 정해지나요?", a: "공모가는 기관투자자를 대상으로 한 수요예측 결과를 바탕으로 결정됩니다. 희망 공모가 밴드를 설정한 뒤, 기관들의 수요를 파악하여 최종 공모가를 확정합니다." },
  { q: "공모주에 참여할지 말지 결정하는 데에 도움이 되는 기준이 있나요?", a: "기관 경쟁률, 의무보유 확약 비율, 기업의 재무 상태와 성장성, 동종 업계 대비 밸류에이션 등을 종합적으로 고려하여 판단하시는 것이 좋습니다." },
];

const IPO_NEWS = [
  { title: "에스팀·엑스비스 청약 마감, 경쟁률 400대 1 돌파", publisher: "매일경제", date: "2026.03.04" },
  { title: "카나프테라퓨틱스, 수요예측 흥행…공모가 상단 확정", publisher: "블로터", date: "2026.03.03" },
  { title: "카나프테라퓨틱스, 공모 청약 시작...바이오 IPO 흥행", publisher: "파이낸셜뉴스", date: "2026.03.05" },
  { title: "아이엠바이오로직스 수요예측 3월 시작…기관 관심 집중", publisher: "한국경제", date: "2026.03.02" },
  { title: "레메디, 3월말 공모청약 앞두고 기업가치 재평가", publisher: "더스탁(The Stock)", date: "2026.03.01" },
];

function CalendarView({ month }: { month: number }) {
  const dayNames = ["월", "화", "수", "목", "금"];
  const MARCH_WEEKS = [
    [2, 3, 4, 5, 6],
    [9, 10, 11, 12, 13],
    [16, 17, 18, 19, 20],
    [23, 24, 25, 26, 27],
    [30, 31, 0, 0, 0],
  ];
  const APRIL_WEEKS = [
    [0, 0, 1, 2, 3],
    [6, 7, 8, 9, 10],
    [13, 14, 15, 16, 17],
    [20, 21, 22, 23, 24],
    [27, 28, 29, 30, 0],
  ];
  const weekRows = month === 4 ? APRIL_WEEKS : MARCH_WEEKS;
  const calendarEvents = month === 4 ? APRIL_CALENDAR_EVENTS : MARCH_CALENDAR_EVENTS;

  function getEventsForWeek(week: number[]) {
    const weekEvents = calendarEvents.filter(e =>
      week.some(d => d > 0 && d >= e.day && d <= e.endDay)
    );
    const lanes: (typeof MARCH_CALENDAR_EVENTS[0] | null)[][] = [];
    weekEvents.forEach(ev => {
      const evStart = Math.max(ev.day, week[0]);
      const evEnd = Math.min(ev.endDay, week[week.length - 1]);
      let placed = false;
      for (const lane of lanes) {
        let canPlace = true;
        for (let d = evStart; d <= evEnd; d++) {
          const idx = week.indexOf(d);
          if (idx >= 0 && lane[idx] !== null) { canPlace = false; break; }
        }
        if (canPlace) {
          for (let d = evStart; d <= evEnd; d++) {
            const idx = week.indexOf(d);
            if (idx >= 0) lane[idx] = ev;
          }
          placed = true;
          break;
        }
      }
      if (!placed) {
        const newLane: (typeof CALENDAR_EVENTS[0] | null)[] = week.map(() => null);
        for (let d = evStart; d <= evEnd; d++) {
          const idx = week.indexOf(d);
          if (idx >= 0) newLane[idx] = ev;
        }
        lanes.push(newLane);
      }
    });
    return lanes;
  }

  return (
    <div className="border border-[#e0e0e0]" data-testid="calendar-grid">
      <div className="grid grid-cols-5 bg-[#fafafa] border-b border-[#e0e0e0]">
        {dayNames.map(d => (
          <div key={d} className="px-3 py-2.5 text-[13px] text-[#555] font-medium text-center border-r border-[#e0e0e0] last:border-r-0">{d}</div>
        ))}
      </div>
      {weekRows.map((week, wi) => {
        const lanes = getEventsForWeek(week);
        return (
          <div key={wi} className="border-b border-[#e0e0e0] last:border-b-0">
            <div className="grid grid-cols-5">
              {week.map((day, di) => (
                <div key={di} className="border-r border-[#e0e0e0] last:border-r-0 px-3 pt-2">
                  <div className="text-[13px] text-[#555] text-right">{day > 0 ? day : ""}</div>
                </div>
              ))}
            </div>
            <div className="py-1 px-1" style={{ minHeight: Math.max(lanes.length * 26 + 4, 50) }}>
              {lanes.map((lane, li) => (
                <div key={li} className="flex h-[24px] mb-[2px]">
                  {(() => {
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
                        cells.push(
                          <div
                            key={col}
                            className="flex items-center gap-1 px-1.5 rounded-sm truncate mx-[1px]"
                            style={{ backgroundColor: ev.color, flex: span, height: 22 }}
                            title={`${ev.name} - ${ev.status}`}
                          >
                            <StockIcon name={ev.name} size={16} />
                            <span className="text-[11px] text-[#333] font-medium truncate">{ev.name}</span>
                          </div>
                        );
                        col += span;
                      }
                    }
                    return cells;
                  })()}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function UpcomingSidebar() {
  const [activeTab, setActiveTab] = useState("청약예정");
  const filtered = UPCOMING_IPO_LIST.filter(i => i.status === activeTab);
  const upcomingCount = UPCOMING_IPO_LIST.filter(i => i.status === "청약예정").length;
  const ongoingCount = UPCOMING_IPO_LIST.filter(i => i.status === "청약진행중").length;

  return (
    <div data-testid="upcoming-sidebar">
      <h3 className="text-base font-bold text-[#222] mb-3">다가오는 청약 종목</h3>
      <div className="flex items-center gap-0 border-b border-[#eee] mb-3">
        <button
          onClick={() => setActiveTab("청약진행중")}
          className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-1 ${
            activeTab === "청약진행중" ? "border-[#E8344E] text-[#E8344E]" : "border-transparent text-[#999]"
          }`}
          data-testid="tab-sidebar-ongoing"
        >
          청약진행중
          {ongoingCount > 0 && <span className="text-[10px] bg-[#E8344E] text-white rounded-full w-4 h-4 flex items-center justify-center">{ongoingCount}</span>}
        </button>
        <button
          onClick={() => setActiveTab("청약예정")}
          className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-1 ${
            activeTab === "청약예정" ? "border-[#E8344E] text-[#E8344E]" : "border-transparent text-[#999]"
          }`}
          data-testid="tab-sidebar-upcoming"
        >
          청약예정
          <span className="text-[10px] bg-[#E8344E] text-white rounded-full w-4 h-4 flex items-center justify-center">{upcomingCount}</span>
        </button>
      </div>
      <div className="space-y-3">
        {filtered.map((ipo, i) => (
          <div key={i} className="border border-[#eee] rounded-lg p-3 hover:border-[#ddd] transition-colors cursor-pointer" data-testid={`sidebar-ipo-${i}`}>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-bold text-[#E8344E]">{ipo.status === "청약진행중" ? "진행중" : `D-${ipo.dDay}`}</span>
              <span className="text-[11px] text-[#999]">{ipo.date}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <StockIcon name={ipo.name} size={32} />
                <div>
                  <div className="flex items-center gap-1 mb-0.5">
                    <span className="text-sm font-bold text-[#222]">{ipo.name}</span>
                    {ipo.label && <span className="text-[10px] text-[#E8344E] font-medium">{ipo.label}</span>}
                  </div>
                  <p className="text-[11px] text-[#666]">공모가 {ipo.priceRange}</p>
                  <p className="text-[11px] text-[#999]">기관경쟁률 {ipo.competition}</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-[#ccc] shrink-0" />
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="text-sm text-[#999] text-center py-6">해당 종목이 없습니다</p>
        )}
      </div>
    </div>
  );
}

function PreTradeSection() {
  return (
    <div data-testid="section-pretrade">
      <div className="bg-[#f8f9fa] py-8 px-4 mb-8">
        <div className="max-w-[1200px] mx-auto">
          <h2 className="text-base sm:text-lg font-bold text-[#222] mb-6">청약 전에도 비상장 주식으로 미리 거래할 수 있어요!</h2>
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="flex-1 bg-white rounded-lg p-4 sm:p-5 border border-[#eee]">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-[#222]">지금 거래 많은 IPO 종목 TOP5</h3>
                <span className="text-[11px] text-[#999]">02.15 14:55 기준</span>
              </div>
              <div className="space-y-3">
                {TOP5_IPO_STOCKS.map((stock) => (
                  <div key={stock.rank} className="flex items-center justify-between" data-testid={`top5-stock-${stock.rank}`}>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-[#222] w-5 text-center">{stock.rank}</span>
                      <StockIcon name={stock.name} size={32} />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-medium text-[#222]">{stock.name}</span>
                          <span className="text-[10px] text-[#E8344E] border border-[#E8344E] rounded px-1">{stock.tag}</span>
                        </div>
                        <div className="flex items-center gap-1 text-[11px] text-[#666]">
                          <span>{stock.category}</span>
                          {stock.price > 0 && (
                            <>
                              <span>{stock.price.toLocaleString()}원</span>
                              <span className={stock.change < 0 ? "text-[#3182f6]" : stock.change > 0 ? "text-[#f04452]" : "text-[#666]"}>
                                {stock.change > 0 ? "+" : ""}{stock.change}%
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      {stock.tradable && (
                        <span className="text-[10px] text-[#E8344E] font-medium">지금 매수가능</span>
                      )}
                      <p className="text-[10px] text-[#999]">{stock.tradeTime}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:w-[380px] bg-white rounded-lg p-4 sm:p-5 border-2 border-[#E8344E]">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-[#222]">비상장 주식일 때 미리 샀다면?</h3>
                <div className="flex items-center gap-1">
                  <button className="w-6 h-6 rounded border border-[#eee] flex items-center justify-center" data-testid="button-compare-prev">
                    <ChevronLeft className="w-3 h-3 text-[#999]" />
                  </button>
                  <button className="w-6 h-6 rounded border border-[#eee] flex items-center justify-center" data-testid="button-compare-next">
                    <ChevronRight className="w-3 h-3 text-[#999]" />
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <StockIcon name="코스모로보틱스" size={28} />
                  <span className="text-sm font-medium text-[#222]">더핑크퐁컴퍼니</span>
                </div>
                <span className="text-[11px] text-[#999]">25.11.18 상장</span>
              </div>
              <div className="flex flex-col items-center py-4">
                <p className="text-xs text-[#999] mb-1">공모가 대비</p>
                <p className="text-3xl font-bold text-[#E8344E] mb-1">153.33%</p>
                <p className="text-xs text-[#666]">더 저렴했어요!</p>
              </div>
              <div className="flex items-end justify-between px-2 mt-4">
                <div className="flex flex-col items-center">
                  <div className="w-10 h-8 bg-[#FFE0E6] rounded-t" />
                  <p className="text-[10px] text-[#666] mt-1">비상장 가격</p>
                  <p className="text-xs font-bold text-[#E8344E]">15,000원</p>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-10 h-16 bg-[#FFCDD2] rounded-t" />
                  <p className="text-[10px] text-[#666] mt-1">확정 공모가</p>
                  <p className="text-xs font-bold text-[#E8344E]">38,000원</p>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-10 h-24 bg-[#EF9A9A] rounded-t" />
                  <p className="text-[10px] text-[#666] mt-1">상장 후 최고가</p>
                  <p className="text-xs font-bold text-[#E8344E]">61,500원</p>
                </div>
              </div>
              <p className="text-[9px] text-[#bbb] mt-4 leading-relaxed">
                ※ 비상장 가격은 증권플러스 비상장의 최저가 기준이며, 상장 후 최고가는 최근 52주 내 가격 기준입니다.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-4 mb-8">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm sm:text-base font-bold text-[#222]">이제 막 상장준비를 시작한, 눈여겨 볼 종목</h3>
            <span className="text-[11px] text-[#999]">02.15 14:30 기준</span>
            <Info className="w-3.5 h-3.5 text-[#ccc]" />
          </div>
          <div className="flex items-center gap-1">
            <button className="w-6 h-6 rounded border border-[#eee] flex items-center justify-center" data-testid="button-prep-prev">
              <ChevronLeft className="w-3 h-3 text-[#999]" />
            </button>
            <button className="w-6 h-6 rounded border border-[#eee] flex items-center justify-center" data-testid="button-prep-next">
              <ChevronRight className="w-3 h-3 text-[#999]" />
            </button>
          </div>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2">
          {IPO_PREP_STOCKS.map((stock, i) => (
            <div
              key={i}
              className="min-w-[140px] border border-[#eee] rounded-lg p-3 hover:border-[#ddd] transition-colors cursor-pointer shrink-0"
              data-testid={`prep-stock-${i}`}
            >
              <div className="flex items-center justify-center mb-2">
                <StockIcon name={stock.name} size={36} />
              </div>
              {stock.tradable && (
                <div className="flex justify-center mb-1">
                  <span className="text-[9px] text-[#E8344E] border border-[#E8344E] rounded px-1.5 py-0.5 font-medium">지금 매수가능</span>
                </div>
              )}
              <p className="text-xs font-medium text-[#222] text-center truncate mb-0.5">{stock.name}</p>
              <p className="text-[10px] text-[#999] text-center">{stock.category}</p>
              <p className="text-[10px] text-[#999] text-center mt-1">{stock.date}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const { data: newsItems } = useQuery<any[]>({
    queryKey: ["/api/stocks/news"],
  });

  return (
    <div className="max-w-[1200px] mx-auto px-4 py-8" data-testid="section-faq">
      <h2 className="text-lg font-bold text-[#222] mb-6">IPO, 이런게 궁금해요!</h2>
      <div className="flex flex-col lg:flex-row gap-8">
        <div className="flex-1">
          <h3 className="text-sm font-bold text-[#222] mb-4">IPO 공모주 청약의 모든 것</h3>
          <div className="border border-[#eee] rounded-lg overflow-hidden">
            {FAQ_ITEMS.map((item, i) => (
              <div key={i} className="border-b border-[#eee] last:border-b-0">
                <button
                  onClick={() => setOpenIndex(openIndex === i ? null : i)}
                  className="w-full flex items-center justify-between px-4 py-3.5 text-left hover:bg-[#fafafa] transition-colors"
                  data-testid={`faq-toggle-${i}`}
                >
                  <span className="text-sm text-[#222]">{item.q}</span>
                  <ChevronDown className={`w-4 h-4 text-[#999] shrink-0 transition-transform ${openIndex === i ? "rotate-180" : ""}`} />
                </button>
                {openIndex === i && (
                  <div className="px-4 pb-4">
                    <p className="text-sm text-[#666] leading-relaxed">{item.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="lg:w-[380px]">
          <h3 className="text-sm font-bold text-[#222] mb-4">IPO News 모아보기</h3>
          <div className="space-y-3">
            {(newsItems || IPO_NEWS.map((n, i) => ({ ...n, id: i }))).slice(0, 5).map((news: any, i: number) => (
              <a
                key={i}
                href={news.link || "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-3 py-2 hover:bg-[#fafafa] rounded px-2 transition-colors"
                data-testid={`ipo-news-${i}`}
              >
                <div className="w-8 h-8 rounded bg-[#f5f5f5] flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-[10px] font-bold text-[#999]">N</span>
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-[#222] line-clamp-2 leading-snug mb-0.5">{news.title}</p>
                  <p className="text-[11px] text-[#999]">{news.publisher} | {news.publishedAt || news.date}</p>
                </div>
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function IPOCalendarPage() {
  const [activePageTab, setActivePageTab] = useState<PageTab>("calendar");
  const [calMonth, setCalMonth] = useState(3);

  return (
    <div className="min-h-screen bg-white" data-testid="page-ipo-calendar">
      <header className="border-b border-[#eee]">
        <div className="max-w-[1200px] mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/">
              <span className="flex items-center gap-1.5 cursor-pointer" data-testid="link-home">
                <SiteLogoBadge size={24} />
                <span className="text-[#222] font-bold text-base">증권플러스 <span className="text-[#E8344E]">비상장</span></span>
              </span>
            </Link>
          </div>
          <Link href="/">
            <span className="flex items-center gap-1 text-sm text-[#666] hover:text-[#222] cursor-pointer" data-testid="link-back-home">
              <ArrowLeft className="w-4 h-4" />
              홈으로
            </span>
          </Link>
        </div>
      </header>

      <div className="max-w-[1200px] mx-auto px-4">
        <div className="flex items-center gap-2 sm:gap-4 border-b border-[#eee] overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActivePageTab("calendar")}
            className={`py-4 text-sm sm:text-base font-bold border-b-2 transition-colors whitespace-nowrap ${
              activePageTab === "calendar" ? "border-[#222] text-[#222]" : "border-transparent text-[#999]"
            }`}
            data-testid="tab-page-calendar"
          >
            공모주 IPO 캘린더
          </button>
          <button
            onClick={() => setActivePageTab("pretrade")}
            className={`py-4 text-sm sm:text-base border-b-2 transition-colors whitespace-nowrap ${
              activePageTab === "pretrade" ? "border-[#222] text-[#222] font-bold" : "border-transparent text-[#999]"
            }`}
            data-testid="tab-page-pretrade"
          >
            청약 전 거래
          </button>
          <button
            onClick={() => setActivePageTab("faq")}
            className={`py-4 text-sm sm:text-base border-b-2 transition-colors whitespace-nowrap ${
              activePageTab === "faq" ? "border-[#222] text-[#222] font-bold" : "border-transparent text-[#999]"
            }`}
            data-testid="tab-page-faq"
          >
            FAQ
          </button>
        </div>
      </div>

      {activePageTab === "calendar" && (
        <div className="max-w-[1200px] mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-[#222]">2026년 {calMonth}월</h2>
              <Info className="w-4 h-4 text-[#ccc]" />
            </div>
            <div className="flex items-center gap-1">
              <button
                className="px-2 py-1 rounded border border-[#eee] text-xs text-[#666] disabled:opacity-40"
                data-testid="button-cal-prev"
                onClick={() => setCalMonth(m => Math.max(3, m - 1))}
                disabled={calMonth === 3}
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                className="px-3 py-1 rounded border border-[#eee] text-xs text-[#666]"
                data-testid="button-cal-today"
                onClick={() => setCalMonth(3)}
              >오늘</button>
              <button
                className="px-2 py-1 rounded border border-[#eee] text-xs text-[#666] disabled:opacity-40"
                data-testid="button-cal-next"
                onClick={() => setCalMonth(m => Math.min(4, m + 1))}
                disabled={calMonth === 4}
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 mb-5">
            {IPO_STATUS_LEGEND.map(({ label, dot }) => (
              <span
                key={label}
                className="inline-flex items-center gap-1 text-[12px] text-[#555] px-2.5 py-1 rounded-full border border-[#e0e0e0] bg-white"
              >
                <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: dot }} />
                {label}
              </span>
            ))}
          </div>

          <div className="min-w-0 overflow-x-auto">
            <div className="min-w-[500px]">
              <CalendarView month={calMonth} />
            </div>
          </div>

          <div className="mt-8 border-t border-[#eee] pt-6">
            <div className="flex items-center gap-1.5 mb-2 text-[#999]">
              <Info className="w-3.5 h-3.5" />
              <span className="text-xs font-medium">유의사항</span>
            </div>
            <ul className="text-[11px] text-[#999] space-y-1 list-disc pl-4">
              <li>모든 정보는 정보 제공을 위한 것으로, 투자 권유를 목적으로 하지 않습니다.</li>
              <li>제공되는 정보는 오류 또는 지연이 발생할 수 있으며, 증권플러스비상장 주식회사는 제공된 정보에 의한 투자 결과에 대해 법적인 책임을 지지 않습니다.</li>
            </ul>
          </div>
        </div>
      )}

      {activePageTab === "pretrade" && <PreTradeSection />}

      {activePageTab === "faq" && <FAQSection />}

      <footer className="border-t border-[#eee] mt-8 bg-[#fafafa]">
        <div className="max-w-[1200px] mx-auto px-4 py-8">
          <div className="flex items-center gap-1.5 mb-4">
            <SiteLogoBadge size={22} />
            <span className="text-sm font-bold text-[#222]">증권플러스 <span className="text-[#E8344E]">비상장</span></span>
          </div>
          <p className="text-[11px] text-[#999] leading-relaxed">
            증권플러스 비상장은 비상장주식 거래 정보를 제공하며, 투자 판단에 대한 책임은 투자자 본인에게 있습니다.
          </p>
          <p className="text-[11px] text-[#bbb] mt-2">© 2026 증권플러스 비상장. All rights reserved.</p>
        </div>
      </footer>

      <style>{`
        .scrollbar-none::-webkit-scrollbar { display: none; }
        .scrollbar-none { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
