import { useEffect, useRef, useState, useCallback } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Heart, Star, X, TrendingUp, TrendingDown, ExternalLink, MessageCircle, MessageSquare, Repeat2, Share2, Newspaper, Clock } from "lucide-react";
import { SamsungBadge } from "@/components/samsung-logo";

const KOREAN_STOCKS = [
  { name: "삼성전자", code: "005930", price: 56800, change: -200, pct: -0.35 },
  { name: "SK하이닉스", code: "000660", price: 178500, change: 2500, pct: 1.42 },
  { name: "LG에너지솔루션", code: "373220", price: 368000, change: -5000, pct: -1.34 },
  { name: "삼성바이오로직스", code: "207940", price: 812000, change: 12000, pct: 1.50 },
  { name: "현대자동차", code: "005380", price: 234500, change: 3500, pct: 1.52 },
  { name: "기아", code: "000270", price: 119800, change: -800, pct: -0.66 },
  { name: "셀트리온", code: "068270", price: 178900, change: 1200, pct: 0.67 },
  { name: "KB금융", code: "105560", price: 82400, change: 400, pct: 0.49 },
  { name: "POSCO홀딩스", code: "005490", price: 298000, change: -3500, pct: -1.16 },
  { name: "NAVER", code: "035420", price: 214500, change: 4500, pct: 2.14 },
  { name: "카카오", code: "035720", price: 48950, change: -650, pct: -1.31 },
  { name: "삼성SDI", code: "006400", price: 372000, change: 7000, pct: 1.92 },
  { name: "LG화학", code: "051910", price: 298500, change: -1500, pct: -0.50 },
  { name: "신한지주", code: "055550", price: 51200, change: 200, pct: 0.39 },
  { name: "현대모비스", code: "012330", price: 236500, change: 1500, pct: 0.64 },
  { name: "카카오뱅크", code: "323410", price: 27650, change: -350, pct: -1.25 },
  { name: "삼성물산", code: "028260", price: 125500, change: 500, pct: 0.40 },
  { name: "하나금융지주", code: "086790", price: 63700, change: 300, pct: 0.47 },
  { name: "카카오페이", code: "377300", price: 61100, change: -1100, pct: -1.76 },
  { name: "SK이노베이션", code: "096770", price: 118500, change: 2000, pct: 1.72 },
];

const MARKET_INDICES = [
  { name: "코스피", value: "2,610.42", change: "+18.37", pct: "+0.71%", up: true },
  { name: "코스닥", value: "752.18", change: "+5.24", pct: "+0.70%", up: true },
  { name: "코스피 200", value: "345.67", change: "+2.85", pct: "+0.83%", up: true },
  { name: "S&P 500", value: "6,068.50", change: "-23.01", pct: "-0.38%", up: false },
  { name: "나스닥", value: "19,643.86", change: "-52.38", pct: "-0.27%", up: false },
  { name: "다우 산업", value: "44,025.81", change: "+134.13", pct: "+0.31%", up: true },
  { name: "달러 환율", value: "1,455.05", change: "-2.65", pct: "-0.18%", up: false },
  { name: "WTI", value: "71.24", change: "+0.43", pct: "+0.61%", up: true },
  { name: "금", value: "2,912.30", change: "+15.40", pct: "+0.53%", up: true },
];

function useTickerPrices() {
  const [prices, setPrices] = useState(() =>
    KOREAN_STOCKS.map((s) => ({ ...s }))
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setPrices((prev) =>
        prev.map((s) => {
          const base = KOREAN_STOCKS.find((k) => k.code === s.code)!;
          const fluctuation = Math.round((Math.random() - 0.5) * base.price * 0.004);
          const stepRound = base.price >= 100000 ? 500 : base.price >= 50000 ? 100 : 50;
          const newPrice = Math.round((base.price + fluctuation) / stepRound) * stepRound;
          const newChange = newPrice - (base.price - base.change);
          const newPct = parseFloat(((newChange / (base.price - base.change)) * 100).toFixed(2));
          return { ...s, price: newPrice, change: newChange, pct: newPct };
        })
      );
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  return prices;
}

function ScrollingTicker() {
  const stocks = useTickerPrices();
  const items = [...stocks, ...stocks, ...stocks];

  return (
    <div className="bg-muted/30 border-b overflow-hidden h-10 flex items-center" data-testid="scrolling-ticker">
      <div className="shrink-0 px-4 text-sm font-bold text-muted-foreground border-r h-full flex items-center bg-background z-10">
        국내주식
      </div>
      <div className="overflow-hidden flex-1 relative">
        <div className="flex items-center gap-0 whitespace-nowrap will-change-transform animate-ticker">
          {items.map((s, i) => (
            <div key={i} className="flex items-center gap-2 px-4 shrink-0">
              <span className="text-base font-semibold text-foreground">{s.name}</span>
              <span className="text-sm tabular-nums font-bold text-foreground">{s.price.toLocaleString()}</span>
              <span className={`text-sm tabular-nums font-semibold ${s.change >= 0 ? "text-red-500" : "text-blue-500"}`}>
                {s.change >= 0 ? "+" : ""}{s.change.toLocaleString()} ({s.change >= 0 ? "+" : ""}{s.pct}%)
              </span>
            </div>
          ))}
        </div>
      </div>
      <style>{`
        @keyframes tickerScroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-33.333%); }
        }
        .animate-ticker {
          animation: tickerScroll 15s linear infinite;
        }
      `}</style>
    </div>
  );
}

function MarketIndexTicker() {
  return (
    <div className="flex items-center gap-4 overflow-x-auto whitespace-nowrap text-[13px] py-1.5 px-4 scrollbar-none">
      <span className="text-muted-foreground/60 font-medium shrink-0">투자 유의사항</span>
      {MARKET_INDICES.map((idx) => (
        <span key={idx.name} className="flex items-center gap-1 shrink-0">
          <span className="text-muted-foreground">{idx.name}</span>
          <b className="text-foreground tabular-nums">{idx.value}</b>
          <span className={`tabular-nums ${idx.up ? "text-red-500" : "text-blue-500"}`}>{idx.change} ({idx.pct})</span>
        </span>
      ))}
    </div>
  );
}

interface StockData {
  currentPrice: number;
  previousClose: number;
  priceChange: number;
  priceChangePercent: number;
  todayOpen: number;
  todayHigh: number;
  todayLow: number;
  chartData: { date: string; price: number }[];
  lastUpdated: string;
}

function generateOrderBook(currentPrice: number) {
  const step = 100;
  const asks: { price: number; quantity: number; totalVol: number }[] = [];
  const bids: { price: number; quantity: number; totalVol: number }[] = [];
  for (let i = 15; i >= 1; i--) {
    const q = Math.floor(Math.random() * 80000) + 3000;
    asks.push({ price: currentPrice + i * step, quantity: q, totalVol: Math.floor(Math.random() * 2000000) + 500000 });
  }
  for (let i = 0; i < 15; i++) {
    const q = Math.floor(Math.random() * 80000) + 3000;
    bids.push({ price: currentPrice - i * step, quantity: q, totalVol: Math.floor(Math.random() * 2000000) + 500000 });
  }
  return { asks, bids, currentPrice };
}

function generateDisplayPrice(basePrice: number): number {
  const tickOffsets = [-200, -100, 0, 100, 200];
  const tick = tickOffsets[Math.floor(Math.random() * tickOffsets.length)];
  return basePrice + tick;
}

function generateTrades(basePrice: number) {
  const trades: { price: number; change: number; changePct: number; quantity: number; volume: number; time: string }[] = [];
  const now = new Date();
  for (let i = 0; i < 15; i++) {
    const offset = Math.floor(Math.random() * 5 - 2) * 100;
    const p = basePrice + offset;
    const prevClose = basePrice - 200;
    const ch = p - prevClose;
    const pct = parseFloat(((ch / prevClose) * 100).toFixed(2));
    const t = new Date(now.getTime() - i * 3000);
    trades.push({
      price: p,
      change: ch,
      changePct: pct,
      quantity: Math.floor(Math.random() * 50) + 1,
      volume: Math.floor(Math.random() * 2000000) + 800000,
      time: `${t.getHours().toString().padStart(2, "0")}:${t.getMinutes().toString().padStart(2, "0")}:${t.getSeconds().toString().padStart(2, "0")}`,
    });
  }
  return trades;
}

function generateInvestorData() {
  const personal = Math.floor(Math.random() * 20000) - 10000;
  const foreign = Math.floor(Math.random() * 20000) - 5000;
  const inst = -(personal + foreign);
  return { personal, foreign, institutional: inst };
}

function StockChart({ data, chartRange, currentPrice }: { data: { date: string; price: number }[]; chartRange: string; currentPrice?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; date: string; price: number } | null>(null);

  const filteredData = (() => {
    let base = data;
    if (chartRange !== "1y" && data.length > 0) {
      const now = new Date(data[data.length - 1].date);
      let cutoff = new Date(now);
      if (chartRange === "1m") cutoff.setMonth(cutoff.getMonth() - 1);
      else if (chartRange === "3m") cutoff.setMonth(cutoff.getMonth() - 3);
      else if (chartRange === "6m") cutoff.setMonth(cutoff.getMonth() - 6);
      base = data.filter((d) => new Date(d.date) >= cutoff);
    }
    if (currentPrice && currentPrice > 0 && base.length > 0) {
      const updated = [...base];
      updated[updated.length - 1] = { ...updated[updated.length - 1], price: currentPrice };
      return updated;
    }
    return base;
  })();

  const drawChart = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || filteredData.length === 0) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    const padL = 0, padR = 50, padT = 10, padB = 28;
    const w = rect.width - padL - padR;
    const h = rect.height - padT - padB;
    const prices = filteredData.map((d) => d.price);
    const minP = Math.min(...prices);
    const maxP = Math.max(...prices);
    const range = maxP - minP || 1;
    const minY = minP - range * 0.05;
    const maxY = maxP + range * 0.05;

    ctx.clearRect(0, 0, rect.width, rect.height);

    const gridColor = "rgba(128,128,128,0.08)";
    const textColor = "rgba(128,128,128,0.5)";
    ctx.font = "10px -apple-system, sans-serif";

    for (let i = 0; i <= 4; i++) {
      const yVal = minY + ((maxY - minY) / 4) * i;
      const y = padT + h - ((yVal - minY) / (maxY - minY)) * h;
      ctx.beginPath();
      ctx.moveTo(padL, y);
      ctx.lineTo(padL + w, y);
      ctx.strokeStyle = gridColor;
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.fillStyle = textColor;
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText(Math.round(yVal).toLocaleString(), padL + w + 6, y);
    }

    const monthsSeen = new Set<string>();
    filteredData.forEach((d, i) => {
      const m = d.date.substring(0, 7);
      if (!monthsSeen.has(m) && i > 0) {
        monthsSeen.add(m);
        const x = padL + (i / (filteredData.length - 1)) * w;
        ctx.fillStyle = textColor;
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        const parts = d.date.split("-");
        ctx.fillText(`${parseInt(parts[1])}월`, x, padT + h + 6);
      }
    });

    const isPositive = filteredData[filteredData.length - 1].price >= filteredData[0].price;
    const lineColor = isPositive ? "#f04452" : "#3182f6";
    const fillColorStart = isPositive ? "rgba(240,68,82,0.12)" : "rgba(49,130,246,0.12)";

    const gradient = ctx.createLinearGradient(0, padT, 0, padT + h);
    gradient.addColorStop(0, fillColorStart);
    gradient.addColorStop(1, "rgba(0,0,0,0)");
    ctx.beginPath();
    filteredData.forEach((d, i) => {
      const x = padL + (i / (filteredData.length - 1)) * w;
      const y = padT + h - ((d.price - minY) / (maxY - minY)) * h;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.lineTo(padL + w, padT + h);
    ctx.lineTo(padL, padT + h);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();

    ctx.beginPath();
    filteredData.forEach((d, i) => {
      const x = padL + (i / (filteredData.length - 1)) * w;
      const y = padT + h - ((d.price - minY) / (maxY - minY)) * h;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.strokeStyle = lineColor;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    const lastD = filteredData[filteredData.length - 1];
    const lastX = padL + w;
    const lastY = padT + h - ((lastD.price - minY) / (maxY - minY)) * h;

    ctx.fillStyle = lineColor;
    ctx.fillRect(padL + w + 1, lastY - 10, padR - 2, 20);
    ctx.fillStyle = "#fff";
    ctx.font = "bold 10px -apple-system, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(Math.round(lastD.price).toLocaleString(), padL + w + padR / 2, lastY);

    ctx.beginPath();
    ctx.setLineDash([3, 3]);
    ctx.moveTo(padL, lastY);
    ctx.lineTo(padL + w, lastY);
    ctx.strokeStyle = lineColor + "40";
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.setLineDash([]);
  }, [filteredData]);

  useEffect(() => { drawChart(); }, [drawChart]);

  const handleMouseMove = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas || filteredData.length === 0) return;
    const rect = canvas.getBoundingClientRect();
    const padL = 0, padR = 50, padT = 10, padB = 28;
    const w = rect.width - padL - padR;
    const mx = e.clientX - rect.left - padL;
    if (mx < 0 || mx > w) { setTooltip(null); return; }
    const idx = Math.round((mx / w) * (filteredData.length - 1));
    const d = filteredData[Math.max(0, Math.min(idx, filteredData.length - 1))];
    const prices = filteredData.map((dd) => dd.price);
    const minP = Math.min(...prices);
    const maxP = Math.max(...prices);
    const range = maxP - minP || 1;
    const minY = minP - range * 0.05;
    const maxY = maxP + range * 0.05;
    const h = rect.height - padT - padB;
    const y = padT + h - ((d.price - minY) / (maxY - minY)) * h;
    setTooltip({ x: e.clientX - rect.left, y, date: d.date, price: d.price });
  };

  return (
    <div ref={containerRef} className="relative w-full h-full" onMouseLeave={() => setTooltip(null)}>
      <canvas ref={canvasRef} className="w-full h-full" style={{ display: "block" }} onMouseMove={handleMouseMove} />
      {tooltip && (
        <>
          <div className="absolute top-0 pointer-events-none" style={{ left: tooltip.x, width: 1, height: "calc(100% - 28px)", background: "rgba(128,128,128,0.25)" }} />
          <div className="absolute pointer-events-none bg-foreground text-background px-2 py-1 rounded text-[13px] font-mono" style={{ left: Math.min(tooltip.x + 10, (containerRef.current?.offsetWidth ?? 300) - 120), top: Math.max(tooltip.y - 40, 0), whiteSpace: "nowrap" }}>
            <span className="opacity-60 mr-2">{tooltip.date}</span>
            <span className="font-bold">{tooltip.price.toLocaleString()}원</span>
          </div>
        </>
      )}
    </div>
  );
}

function OrderBookPanel({ orderBook, isLoading }: { orderBook: ReturnType<typeof generateOrderBook> | null; isLoading: boolean }) {
  if (isLoading || !orderBook) {
    return (
      <div className="p-4 space-y-2">
        {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-5 w-full" />)}
      </div>
    );
  }

  const maxQty = Math.max(...orderBook.asks.map((a) => a.quantity), ...orderBook.bids.map((b) => b.quantity));

  return (
    <div className="text-sm font-mono">
      <div className="grid grid-cols-[1fr_80px_1fr] gap-0 px-3 py-1.5 text-sm text-muted-foreground border-b">
        <span>잔량</span>
        <span className="text-center">호가</span>
        <span className="text-right">잔량</span>
      </div>
      <div>
        {[...orderBook.asks].reverse().map((ask, i) => (
          <div key={`a-${i}`} className="grid grid-cols-[1fr_80px_1fr] gap-0 px-3 py-[3px] relative" data-testid={`row-ask-${i}`}>
            <div className="absolute left-0 top-0 bottom-0" style={{ width: `${(ask.quantity / maxQty) * 50}%`, background: "rgba(49,130,246,0.08)", transition: "width 0.5s ease" }} />
            <span className="z-10 text-muted-foreground tabular-nums text-right pr-2">{ask.quantity.toLocaleString()}</span>
            <span className="z-10 text-center text-blue-500 font-medium tabular-nums">{ask.price.toLocaleString()}</span>
            <span className="z-10 text-right text-muted-foreground/40 tabular-nums"></span>
          </div>
        ))}
        <div className="px-3 py-1.5 bg-muted/30 text-center">
          <span className="font-bold text-base text-red-500 tabular-nums" data-testid="text-orderbook-price">{orderBook.currentPrice.toLocaleString()}</span>
        </div>
        {orderBook.bids.map((bid, i) => (
          <div key={`b-${i}`} className="grid grid-cols-[1fr_80px_1fr] gap-0 px-3 py-[3px] relative" data-testid={`row-bid-${i}`}>
            <div className="absolute right-0 top-0 bottom-0" style={{ width: `${(bid.quantity / maxQty) * 50}%`, background: "rgba(240,68,82,0.08)", transition: "width 0.5s ease" }} />
            <span className="z-10 text-muted-foreground/40 tabular-nums"></span>
            <span className="z-10 text-center text-red-500 font-medium tabular-nums">{bid.price.toLocaleString()}</span>
            <span className="z-10 text-right text-muted-foreground tabular-nums">{bid.quantity.toLocaleString()}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function TradesPanel({ trades }: { trades: ReturnType<typeof generateTrades> }) {
  const [tab, setTab] = useState<"realtime" | "daily">("realtime");
  return (
    <div>
      <div className="flex items-center gap-0 border-b px-3">
        <button onClick={() => setTab("realtime")} className={`px-3 py-2 text-base font-medium border-b-2 transition-colors ${tab === "realtime" ? "border-foreground text-foreground" : "border-transparent text-muted-foreground"}`} data-testid="tab-realtime">실시간</button>
        <button onClick={() => setTab("daily")} className={`px-3 py-2 text-base font-medium border-b-2 transition-colors ${tab === "daily" ? "border-foreground text-foreground" : "border-transparent text-muted-foreground"}`} data-testid="tab-daily">일별</button>
      </div>
      <div className="text-sm font-mono">
        <div className="grid grid-cols-[70px_40px_52px_1fr_62px] gap-0 px-3 py-1.5 text-sm text-muted-foreground border-b">
          <span>현재가</span>
          <span className="text-right">체결량</span>
          <span className="text-right">등락률</span>
          <span className="text-right">거래량</span>
          <span className="text-right">시간</span>
        </div>
        <div className="max-h-[240px] overflow-y-auto">
          {trades.map((t, i) => (
            <div key={i} className="grid grid-cols-[70px_40px_52px_1fr_62px] gap-0 px-3 py-[3px] text-[13px]">
              <span className={`tabular-nums ${t.change >= 0 ? "text-red-500" : "text-blue-500"}`}>{t.price.toLocaleString()}</span>
              <span className="text-right tabular-nums text-muted-foreground">{t.quantity}</span>
              <span className={`text-right tabular-nums ${t.change >= 0 ? "text-red-500" : "text-blue-500"}`}>{t.change >= 0 ? "+" : ""}{t.changePct}%</span>
              <span className="text-right tabular-nums text-muted-foreground truncate">{t.volume.toLocaleString()}</span>
              <span className="text-right tabular-nums text-muted-foreground/60">{t.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const DAILY_INVESTOR_HISTORY = [
  { date: "오늘", personal: 0, foreign: 0, institutional: 0 },
  { date: "02.10", personal: 11329, foreign: -21451, institutional: 31297 },
  { date: "02.09", personal: -232316, foreign: -206951, institutional: -15747 },
  { date: "02.06", personal: 53609, foreign: -76895, institutional: 22663 },
  { date: "02.05", personal: -18742, foreign: 42318, institutional: -8953 },
  { date: "02.04", personal: 67234, foreign: -31567, institutional: -12445 },
];

function InvestorPanel({ data }: { data: ReturnType<typeof generateInvestorData> }) {
  const maxVal = Math.max(Math.abs(data.personal), Math.abs(data.foreign), Math.abs(data.institutional), 1);
  const items = [
    { label: "개인", value: data.personal },
    { label: "외국인", value: data.foreign },
    { label: "기관", value: data.institutional },
  ];

  const historyRows = DAILY_INVESTOR_HISTORY.map((row, i) =>
    i === 0 ? { ...row, personal: data.personal, foreign: data.foreign, institutional: data.institutional } : row
  );

  return (
    <div>
      <div className="px-3 py-3 space-y-3">
        {items.map((item) => (
          <div key={item.label} className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground w-10 shrink-0">{item.label}</span>
            <div className="flex-1 flex items-center h-4">
              <div className="w-1/2 flex justify-end">
                {item.value < 0 && (
                  <div className="h-full rounded-l-sm" style={{ width: `${(Math.abs(item.value) / maxVal) * 100}%`, background: "#3182f6", transition: "width 0.6s ease", minWidth: 2, maxWidth: "100%" }} />
                )}
              </div>
              <div className="w-px h-full bg-border shrink-0" />
              <div className="w-1/2 flex justify-start">
                {item.value > 0 && (
                  <div className="h-full rounded-r-sm" style={{ width: `${(Math.abs(item.value) / maxVal) * 100}%`, background: "#f04452", transition: "width 0.6s ease", minWidth: 2, maxWidth: "100%" }} />
                )}
              </div>
            </div>
            <span className={`text-sm font-medium tabular-nums w-16 text-right ${item.value >= 0 ? "text-red-500" : "text-blue-500"}`}>
              {item.value >= 0 ? "+" : ""}{item.value.toLocaleString()}
            </span>
          </div>
        ))}
      </div>

      <div className="border-t mt-2">
        <div className="grid grid-cols-4 gap-0 px-3 py-1.5 text-sm text-muted-foreground border-b">
          <span>일자</span>
          <span className="text-right">개인</span>
          <span className="text-right">외국인</span>
          <span className="text-right">기관</span>
        </div>
        {historyRows.map((row) => (
          <div key={row.date} className="grid grid-cols-4 gap-0 px-3 py-[4px] text-[13px]">
            <span className="text-muted-foreground tabular-nums">{row.date}</span>
            <span className={`text-right tabular-nums ${row.personal >= 0 ? "text-red-500" : "text-blue-500"}`}>
              {row.personal >= 0 ? "+" : ""}{row.personal.toLocaleString()}
            </span>
            <span className={`text-right tabular-nums ${row.foreign >= 0 ? "text-red-500" : "text-blue-500"}`}>
              {row.foreign >= 0 ? "+" : ""}{row.foreign.toLocaleString()}
            </span>
            <span className={`text-right tabular-nums ${row.institutional >= 0 ? "text-red-500" : "text-blue-500"}`}>
              {row.institutional >= 0 ? "+" : ""}{row.institutional.toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

const TOP_INVESTORS = [
  { name: "니은미음", profit: 295611339, pct: 28.93, bg: "#FFE066", face: "^_^" },
  { name: "하준빠더", profit: 259864836, pct: 404.65, bg: "#A0D8EF", face: "B)" },
  { name: "플라타나스나무", profit: 215533861, pct: 157.42, bg: "#FFB347", face: ":3" },
  { name: "얼쑨이", profit: 194427696, pct: 6.80, bg: "#C3B1E1", face: ">.<" },
  { name: "망월동의현인", profit: 193724247, pct: 19.77, bg: "#77DD77", face: "~_~" },
];

function TopInvestorsPanel() {
  return (
    <div className="divide-y">
      {TOP_INVESTORS.map((inv, i) => (
        <div key={inv.name} className="flex items-center gap-3 px-3 py-2.5">
          <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm shrink-0 select-none" style={{ backgroundColor: inv.bg }}>
            {inv.face}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-base font-semibold text-foreground truncate">{inv.name}</p>
            <p className="text-[13px] text-red-500 tabular-nums font-medium">
              +{inv.profit.toLocaleString()}원 ({inv.pct}%)
            </p>
          </div>
          <Button size="sm" variant="outline" className="text-[13px] px-3 shrink-0" data-testid={`btn-follow-${i}`}>
            팔로우
          </Button>
        </div>
      ))}
    </div>
  );
}

const COMMUNITY_POSTS = [
  { user: "주식고수김", badge: "수익률 상위 5%", time: "방금 전", content: "삼성전자 지금 눌림목 구간이라 분할매수 들어갔습니다. 반도체 사이클 바닥 지났다고 봅니다.", likes: 42 },
  { user: "반도체전문가", badge: "", time: "2분 전", content: "HBM4 양산 소식 나오면 한번 더 갈 수 있을 듯. AI 수혜주로 재평가 받는 중.", likes: 38 },
  { user: "장기투자러", badge: "", time: "5분 전", content: "배당도 나쁘지 않고 PBR 1배 미만이면 안 살 이유가 없죠. 꾸준히 모아가는 중.", likes: 27 },
  { user: "데이트레이더", badge: "수익률 상위 10%", time: "8분 전", content: "오늘 외국인 순매수 들어오네요. 단기 반등 나올 수 있는 자리입니다.", likes: 56 },
  { user: "초보주식", badge: "", time: "12분 전", content: "이 가격이면 싼 건가요? 처음 시작하려는데 삼성전자부터 해도 될까요?", likes: 15 },
  { user: "가치투자자", badge: "", time: "15분 전", content: "실적 기대감 있고, 파운드리 수주도 늘고 있어서 중장기적으로 긍정적으로 봅니다.", likes: 33 },
  { user: "차트분석가", badge: "수익률 상위 3%", time: "18분 전", content: "20일선 지지 확인 후 반등 중. 거래량 동반 상승이면 추가 상승 여력 있어 보입니다.", likes: 71 },
  { user: "배당킹", badge: "", time: "22분 전", content: "삼성전자 분기배당 받으려면 지금 사두는 게 좋습니다. 배당락일 체크하세요.", likes: 29 },
  { user: "월급투자자", badge: "", time: "25분 전", content: "매달 10주씩 적립식으로 사고 있어요. 5년 뒤를 봅니다.", likes: 44 },
  { user: "뉴스봇", badge: "", time: "30분 전", content: "삼성전자, 차세대 2나노 공정 투자 확대 발표. 시장 반응 긍정적.", likes: 88 },
  { user: "기관분석", badge: "수익률 상위 7%", time: "35분 전", content: "외국인 3일 연속 순매수 중. 기관도 매수세 전환. 수급 좋아지고 있습니다.", likes: 62 },
  { user: "삼전홀더", badge: "", time: "40분 전", content: "3년째 홀딩 중인데 이제야 빛을 보는 건가... 조금만 더 힘내자 삼전!", likes: 51 },
];

const FEED_POSTS = [
  {
    channel: "미국주식이야기",
    date: "2월 3일",
    author: "환상감자",
    title: "무심코 주식 산 30대가 인생 꼬이는 과정",
    content: "안녕하세요 환상감자입니다.\n직장 생활 5~7년 차, 어느 정도 목돈이 모이고 월급만으로는 답이 없다는 걸 깨닫는 나이가 보통 30대입니다.\n\n이 시기에 많은 이들이 '재테크'라는 이름의 링 위에 오릅니다.",
    likes: 5649, comments: 836, reposts: 20,
  },
  {
    channel: "미국주식이야기",
    date: "2월 5일 (수정됨)",
    author: "돈을부르는고양이",
    title: "당신이 정말 주식 시장에서 끝까지 살아남고 싶다면",
    content: "이 원칙만 지켜보세요. 닷컴버블 코로나 금융위기 시절같은 폭락장이 찾아와도 살아남을 수 있을 겁니다.\n\n1. 중소형주 투자하지 않기\n2. 급등주 하지 않기",
    likes: 1081, comments: 111, reposts: 6,
  },
  {
    channel: "미국주식이야기",
    date: "1일 (수정됨)",
    author: "돈을부르는고양이",
    title: "명심하자",
    content: "신용거래(빚투) 하지말기\n중소형주 및 이상한 종목 매수하지 말기\n레버리지도 하지말기(중소형주 및 잡종목이라면 더욱 하지말기 정말 레버리지가 너무 하고싶은 도파민의 노예라면 나스닥 에센피 다우지수 추종 etf 2배까지만 하도록 하자)\nM7 빅테크대형주 지수추종을 투자하자(특히나 지수추종은 정말 무적이다)",
    likes: 593, comments: 54, reposts: 3,
  },
  {
    channel: "삼성전자 토론방",
    date: "방금 전",
    author: "주식고수김",
    title: "",
    content: "삼성전자 지금 눌림목 구간이라 분할매수 들어갔습니다. 반도체 사이클 바닥 지났다고 봅니다.",
    likes: 42, comments: 8, reposts: 2,
  },
  {
    channel: "삼성전자 토론방",
    date: "2분 전",
    author: "반도체전문가",
    title: "",
    content: "HBM4 양산 소식 나오면 한번 더 갈 수 있을 듯. AI 수혜주로 재평가 받는 중.",
    likes: 38, comments: 12, reposts: 1,
  },
  {
    channel: "삼성전자 토론방",
    date: "8분 전",
    author: "데이트레이더",
    title: "",
    content: "오늘 외국인 순매수 들어오네요. 단기 반등 나올 수 있는 자리입니다.",
    likes: 56, comments: 15, reposts: 4,
  },
  {
    channel: "삼성전자 토론방",
    date: "18분 전",
    author: "차트분석가",
    title: "",
    content: "20일선 지지 확인 후 반등 중. 거래량 동반 상승이면 추가 상승 여력 있어 보입니다.",
    likes: 71, comments: 22, reposts: 5,
  },
  {
    channel: "삼성전자 토론방",
    date: "30분 전",
    author: "뉴스봇",
    title: "",
    content: "삼성전자, 차세대 2나노 공정 투자 확대 발표. 시장 반응 긍정적.",
    likes: 88, comments: 31, reposts: 7,
  },
];

function FeedView() {
  return (
    <div className="max-w-[1400px] mx-auto w-full px-4 py-4 flex-1">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Star className="w-4 h-4 text-amber-500" />
            <h2 className="text-lg font-bold">주간 인기글</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-4">한 주간 가장 주목 받은 글만 쏙~옥 모았어요</p>
          <div className="space-y-0 divide-y">
            {FEED_POSTS.map((post, i) => (
              <div key={i} className="py-4 first:pt-0">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-1.5 flex-wrap">
                      <span className="font-medium text-foreground">{post.channel}</span>
                      <span>{post.date}</span>
                      <span>·</span>
                      <span>{post.author}님이 남긴 글</span>
                    </div>
                    {post.title && (
                      <h3 className="text-base font-bold mb-1.5">{post.title}</h3>
                    )}
                    <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-line line-clamp-4">{post.content}</p>
                    {post.content.length > 100 && (
                      <button className="text-sm text-blue-500 mt-1">... 더 보기</button>
                    )}
                    <div className="flex items-center gap-4 mt-2.5">
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Heart className="w-3.5 h-3.5" />
                        <span>{post.likes.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>{post.comments}</span>
                      </div>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Repeat2 className="w-3.5 h-3.5" />
                        <span>{post.reposts}</span>
                      </div>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Share2 className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </div>
                  <Button size="sm" variant="outline" className="text-[13px] px-3 shrink-0 mt-1">팔로우</Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="mb-1">
            <h2 className="text-lg font-bold">수익금 상위 투자자 TOP5</h2>
            <p className="text-sm text-muted-foreground mt-0.5">최근 1주일 기준</p>
          </div>
          <Card className="p-0 overflow-hidden mt-3">
            <TopInvestorsPanel />
          </Card>
        </div>
      </div>
    </div>
  );
}

const REVENUE_SEGMENTS = [
  { label: "TV, 모니터, 냉장고, 세탁기, 에어컨, 스마트폰, 네트워크시스템, PC 등", pct: 58.13, color: "#3182f6" },
  { label: "DRAM, NAND Flash, 모바일AP 등", pct: 36.91, color: "#77DD77" },
  { label: "스마트폰용 OLED패널 등", pct: 9.69, color: "#A0D8EF" },
  { label: "디지털 콕핏, 카오디오, 포터블 스피커 등", pct: 4.74, color: "#FFE066" },
  { label: "부문간 내부거래 제거 등", pct: -9.48, color: "#C3B1E1" },
];

const QUARTERLY_DATA = [
  { q: "23년 3월", rev: "63.7조원", ni: "1.6조원", margin: "2.47%", growth: "-93.40%" },
  { q: "23년 6월", rev: "60.0조원", ni: "1.7조원", margin: "2.87%", growth: "9.46%" },
  { q: "23년 9월", rev: "67.4조원", ni: "5.8조원", margin: "8.67%", growth: "239.07%" },
  { q: "23년 12월", rev: "67.8조원", ni: "6.3조원", margin: "9.36%", growth: "8.57%" },
  { q: "24년 3월", rev: "71.9조원", ni: "6.8조원", margin: "9.39%", growth: "6.46%" },
  { q: "24년 6월", rev: "74.1조원", ni: "9.8조원", margin: "13.29%", growth: "45.70%" },
  { q: "24년 9월", rev: "79.1조원", ni: "10.1조원", margin: "12.77%", growth: "2.64%" },
  { q: "24년 12월", rev: "75.8조원", ni: "7.8조원", margin: "10.23%", growth: "-23.23%" },
  { q: "25년 3월", rev: "79.1조원", ni: "8.2조원", margin: "10.39%", growth: "6.04%" },
  { q: "25년 6월", rev: "74.6조원", ni: "5.1조원", margin: "6.86%", growth: "-37.78%" },
  { q: "25년 9월", rev: "86.1조원", ni: "12.2조원", margin: "14.21%", growth: "138.95%" },
  { q: "25년 12월", rev: "93.8조원", ni: "19.6조원", margin: "20.93%", growth: "60.65%" },
];

function DonutChart({ segments }: { segments: typeof REVENUE_SEGMENTS }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = 180 * dpr;
    canvas.height = 180 * dpr;
    ctx.scale(dpr, dpr);
    const cx = 90, cy = 90, r = 70, inner = 45;
    const total = segments.reduce((s, seg) => s + Math.abs(seg.pct), 0);
    let angle = -Math.PI / 2;
    segments.forEach((seg) => {
      const sweep = (Math.abs(seg.pct) / total) * Math.PI * 2;
      ctx.beginPath();
      ctx.arc(cx, cy, r, angle, angle + sweep);
      ctx.arc(cx, cy, inner, angle + sweep, angle, true);
      ctx.closePath();
      ctx.fillStyle = seg.color;
      ctx.fill();
      angle += sweep;
    });
  }, [segments]);
  return <canvas ref={canvasRef} className="w-[180px] h-[180px]" />;
}

function StockInfoView() {
  return (
    <div className="max-w-[1400px] mx-auto w-full px-4 py-6 flex-1 space-y-8">
      <Card className="p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-bold">삼성전자</h2>
              <span className="text-sm text-muted-foreground">국내 · 005930 · 코스피</span>
            </div>
            <p className="text-[13px] text-muted-foreground mt-0.5">출처: FnGuide 및 기업 IR자료</p>
          </div>
          <Button size="sm" variant="outline" className="text-sm" data-testid="btn-homepage">
            <ExternalLink className="w-3 h-3 mr-1" />홈페이지
          </Button>
        </div>
        <div className="bg-muted/30 rounded-md p-3 text-sm text-foreground/80 mb-5">
          동사는 1969년 설립되어 1975년 유가증권시장에 상장하였으며, 2017년 Harman 인수로 전장부품 사업을 확장함.
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-border">
          {[
            { label: "시가총액", value: "1,078조 8,856억원" },
            { label: "실제 기업 가치", value: "459조 467억원" },
            { label: "기업명", value: "Samsung Electronics" },
            { label: "대표이사", value: "전영현, 노태문" },
            { label: "상장일", value: "1975년 6월 11일" },
            { label: "발행주식수", value: "6,735,612,586주" },
          ].map((item) => (
            <div key={item.label} className="bg-background p-3">
              <p className="text-sm text-muted-foreground">{item.label}</p>
              <p className="text-base font-semibold mt-1 tabular-nums">{item.value}</p>
            </div>
          ))}
        </div>
      </Card>

      <div>
        <h2 className="text-xl font-bold mb-1">매출·산업 구성</h2>
        <p className="text-sm text-muted-foreground mb-4">24년 12월 기준 (출처: FnGuide 및 기업 IR자료)</p>
        <Card className="p-6">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <DonutChart segments={REVENUE_SEGMENTS} />
            <div className="space-y-2 flex-1">
              {REVENUE_SEGMENTS.map((seg) => (
                <div key={seg.label} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: seg.color }} />
                  <span className="text-sm text-foreground/80">{seg.label}</span>
                  <span className="text-base font-semibold ml-auto tabular-nums">{seg.pct}%</span>
                </div>
              ))}
            </div>
          </div>
          <p className="text-sm text-muted-foreground mt-4">마이너스 매출비중 : 계열사간 내부거래 등에 따른 조정</p>
        </Card>
      </div>

      <div>
        <h2 className="text-xl font-bold mb-1">주요 사업</h2>
        <Card className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: "📱", title: "스마트폰제조", rank: "시가총액 2위" },
              { icon: "🔧", title: "종합반도체", rank: "시가총액 1위" },
              { icon: "💻", title: "컴퓨터와 주변기기", rank: "시가총액 3위" },
              { icon: "❄️", title: "냉방가전", rank: "시가총액 1위" },
            ].map((item) => (
              <div key={item.title} className="flex items-center gap-3 p-2">
                <div className="w-10 h-10 rounded-md bg-muted/50 flex items-center justify-center text-lg">{item.icon}</div>
                <div>
                  <p className="text-base font-semibold">{item.title}</p>
                  <p className="text-sm text-muted-foreground">{item.rank}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div>
        <h2 className="text-xl font-bold mb-1">투자 지표</h2>
        <p className="text-sm text-muted-foreground mb-3">12:04 기준</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-4">
            <h3 className="text-base font-bold mb-3">가치평가</h3>
            <div className="space-y-2">
              {[
                { label: "PER", value: "34.6배" },
                { label: "PSR", value: "3.6배" },
                { label: "PBR", value: "2.7배" },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{item.label}</span>
                  <span className="text-base font-semibold tabular-nums">{item.value}</span>
                </div>
              ))}
            </div>
          </Card>
          <Card className="p-4">
            <h3 className="text-base font-bold mb-3">수익</h3>
            <div className="space-y-2">
              {[
                { label: "EPS", value: "4,815원" },
                { label: "BPS", value: "60,632원" },
                { label: "ROE", value: "8.4%" },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{item.label}</span>
                  <span className="text-base font-semibold tabular-nums">{item.value}</span>
                </div>
              ))}
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-bold">배당</h3>
              <span className="text-sm text-muted-foreground">최근 12개월</span>
            </div>
            <div className="space-y-2">
              {[
                { label: "횟수", value: "4번", sub: "12월, 3월, 6월, 9월" },
                { label: "주당 배당금", value: "연 1,465원" },
                { label: "수익률", value: "연 0.88%" },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{item.label}</span>
                  <div className="text-right">
                    <span className="text-base font-semibold tabular-nums">{item.value}</span>
                    {item.sub && <p className="text-[13px] text-muted-foreground">{item.sub}</p>}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-bold mb-1">재무</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { label: "부채비율", value: "26.64%" },
            { label: "유동비율", value: "262.94%" },
            { label: "이자보상비율", value: "10,494.86%" },
          ].map((item) => (
            <Card key={item.label} className="p-4">
              <p className="text-sm text-muted-foreground mb-1">{item.label}</p>
              <p className="text-2xl font-bold tabular-nums">{item.value}</p>
            </Card>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-xl font-bold mb-1">수익성</h2>
        <p className="text-sm text-muted-foreground mb-1">매출·순이익 성장률</p>
        <p className="text-sm text-foreground/80 mb-4">2025년 4분기 삼성전자의 순이익은 19.6조원으로 <b>직전 분기 대비 60.65% 더 높아요.</b></p>
        <Card className="p-0 overflow-x-auto">
          <table className="w-full text-sm min-w-[700px]">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="text-left px-3 py-2 font-semibold text-muted-foreground">항목</th>
                {QUARTERLY_DATA.map((q) => (
                  <th key={q.q} className="text-right px-2 py-2 font-medium text-muted-foreground whitespace-nowrap">{q.q}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="px-3 py-2 font-semibold flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-blue-500" />매출</td>
                {QUARTERLY_DATA.map((q) => (
                  <td key={q.q} className="text-right px-2 py-2 tabular-nums">{q.rev}</td>
                ))}
              </tr>
              <tr className="border-b">
                <td className="px-3 py-2 font-semibold flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-blue-300" />순이익</td>
                {QUARTERLY_DATA.map((q) => (
                  <td key={q.q} className="text-right px-2 py-2 tabular-nums">{q.ni}</td>
                ))}
              </tr>
              <tr className="border-b">
                <td className="px-3 py-2 font-semibold flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-amber-400" />순이익률</td>
                {QUARTERLY_DATA.map((q) => (
                  <td key={q.q} className="text-right px-2 py-2 tabular-nums">{q.margin}</td>
                ))}
              </tr>
              <tr>
                <td className="px-3 py-2 font-semibold">순이익 성장률</td>
                {QUARTERLY_DATA.map((q) => (
                  <td key={q.q} className={`text-right px-2 py-2 tabular-nums font-medium ${q.growth.startsWith("-") ? "text-blue-500" : "text-red-500"}`}>{q.growth}</td>
                ))}
              </tr>
            </tbody>
          </table>
        </Card>
      </div>
    </div>
  );
}

function NewsView() {
  const { data: newsData, isLoading } = useQuery<{ title: string; publisher: string; link: string; publishedAt: string | null; thumbnail: string | null }[]>({
    queryKey: ["/api/stock/samsung/news"],
    refetchInterval: 5 * 60 * 1000,
  });

  const FALLBACK_NEWS = [
    { title: "삼성전자, HBM4 양산 본격화...AI 반도체 시장 공략 가속", publisher: "한국경제", link: "https://search.naver.com/search.naver?query=삼성전자+뉴스", publishedAt: "방금 전", thumbnail: null },
    { title: "삼성전자 2나노 파운드리 수율 개선 소식에 주가 강세", publisher: "매일경제", link: "https://search.naver.com/search.naver?query=삼성전자+뉴스", publishedAt: "1시간 전", thumbnail: null },
    { title: "삼성전자, 갤럭시 S26 시리즈 사전 예약 역대 최다", publisher: "조선비즈", link: "https://search.naver.com/search.naver?query=삼성전자+뉴스", publishedAt: "2시간 전", thumbnail: null },
    { title: "외국인 삼성전자 3거래일 연속 순매수...반도체 기대감", publisher: "서울경제", link: "https://search.naver.com/search.naver?query=삼성전자+뉴스", publishedAt: "3시간 전", thumbnail: null },
    { title: "삼성전자, DRAM 가격 반등에 실적 개선 전망", publisher: "이데일리", link: "https://search.naver.com/search.naver?query=삼성전자+뉴스", publishedAt: "4시간 전", thumbnail: null },
    { title: "삼성전자 배당 확대 기대...주주환원 정책 강화", publisher: "뉴스1", link: "https://search.naver.com/search.naver?query=삼성전자+뉴스", publishedAt: "5시간 전", thumbnail: null },
    { title: "삼성전자, 차세대 메모리 기술 특허 출원 급증", publisher: "전자신문", link: "https://search.naver.com/search.naver?query=삼성전자+뉴스", publishedAt: "6시간 전", thumbnail: null },
    { title: "삼성전자 반도체 부문 설비 투자 확대 계획 발표", publisher: "아시아경제", link: "https://search.naver.com/search.naver?query=삼성전자+뉴스", publishedAt: "7시간 전", thumbnail: null },
  ];

  const news = (newsData && newsData.length > 0) ? newsData : (isLoading ? [] : FALLBACK_NEWS);

  function timeAgo(dateStr: string | null) {
    if (!dateStr) return "";
    if (dateStr.includes("전") || dateStr.includes("분") || dateStr.includes("시간") || dateStr.includes("일")) return dateStr;
    try {
      const diff = Date.now() - new Date(dateStr).getTime();
      const mins = Math.floor(diff / 60000);
      if (mins < 60) return `${mins}분 전`;
      const hours = Math.floor(mins / 60);
      if (hours < 24) return `${hours}시간 전`;
      const days = Math.floor(hours / 24);
      return `${days}일 전`;
    } catch {
      return dateStr;
    }
  }

  return (
    <div className="max-w-[1400px] mx-auto w-full px-4 py-6 flex-1">
      <div className="flex items-center gap-2 mb-1">
        <Newspaper className="w-4 h-4" />
        <h2 className="text-lg font-bold">뉴스·공시</h2>
      </div>
      <p className="text-sm text-muted-foreground mb-4">삼성전자 관련 최신 뉴스 및 공시</p>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : (
        <div className="divide-y">
          {news.map((item, i) => (
            <a
              key={i}
              href={item.link}
              target="_blank"
              rel="noopener noreferrer"
              className="block py-4 first:pt-0 group"
              data-testid={`link-news-${i}`}
            >
              <div className="flex gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold group-hover:text-blue-500 transition-colors leading-snug mb-1.5">{item.title}</h3>
                  <div className="flex items-center gap-2 text-[13px] text-muted-foreground">
                    <span className="font-medium">{item.publisher}</span>
                    {item.publishedAt && (
                      <>
                        <span>·</span>
                        <div className="flex items-center gap-0.5">
                          <Clock className="w-3 h-3" />
                          <span>{timeAgo(item.publishedAt)}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
                {item.thumbnail && (
                  <div className="w-20 h-14 rounded-md overflow-hidden shrink-0 bg-muted">
                    <img src={item.thumbnail} alt="" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

function CommunityPanel() {
  const [visiblePosts, setVisiblePosts] = useState(COMMUNITY_POSTS.slice(0, 5));
  const [postIndex, setPostIndex] = useState(5);

  useEffect(() => {
    const interval = setInterval(() => {
      setPostIndex((prev) => {
        const next = prev >= COMMUNITY_POSTS.length ? 0 : prev;
        const newPost = { ...COMMUNITY_POSTS[next], time: "방금 전", likes: Math.floor(Math.random() * 50) + 5 };
        setVisiblePosts((posts) => [newPost, ...posts.slice(0, 4)]);
        return next + 1;
      });
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="divide-y max-h-[300px] overflow-y-auto">
      {visiblePosts.map((post, i) => (
        <div key={`${post.user}-${i}`} className="px-3 py-2.5 space-y-1" style={{ animation: i === 0 ? "fadeIn 0.4s ease" : "none" }}>
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-base font-semibold text-foreground">{post.user}</span>
            {post.badge && (
              <span className="text-[13px] px-1.5 py-0.5 rounded-sm bg-red-500/10 text-red-500 font-medium">{post.badge}</span>
            )}
            <span className="text-sm text-muted-foreground/50 ml-auto">{post.time}</span>
          </div>
          <p className="text-[13px] text-foreground/80 leading-relaxed">{post.content}</p>
          <div className="flex items-center gap-1 text-sm text-muted-foreground/50">
            <Heart className="w-3 h-3" />
            <span>{post.likes}</span>
          </div>
        </div>
      ))}
      <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }`}</style>
    </div>
  );
}

export default function LandingPage() {
  const { data: stockData, isLoading } = useQuery<StockData>({
    queryKey: ["/api/stock/samsung"],
    refetchInterval: 30 * 1000,
  });

  const basePrice = stockData?.currentPrice ?? 0;
  const previousClose = stockData?.previousClose ?? 0;

  const [displayPrice, setDisplayPrice] = useState(0);
  const [orderBook, setOrderBook] = useState<ReturnType<typeof generateOrderBook> | null>(null);
  const [trades, setTrades] = useState<ReturnType<typeof generateTrades>>([]);
  const [investor, setInvestor] = useState(() => generateInvestorData());
  const [chartRange, setChartRange] = useState("1y");
  const [activeTab, setActiveTab] = useState("chart");

  const displayChange = previousClose > 0 ? displayPrice - previousClose : (stockData?.priceChange ?? 0);
  const displayChangePct = previousClose > 0 ? parseFloat(((displayChange / previousClose) * 100).toFixed(2)) : (stockData?.priceChangePercent ?? 0);
  const isUp = displayChange >= 0;

  useEffect(() => {
    if (basePrice > 0) {
      const price = generateDisplayPrice(basePrice);
      setDisplayPrice(price);
      setOrderBook(generateOrderBook(price));
      setTrades(generateTrades(price));
    }
  }, [basePrice]);

  useEffect(() => {
    if (basePrice <= 0) return;
    const interval = setInterval(() => {
      const price = generateDisplayPrice(basePrice);
      setDisplayPrice(price);
      setOrderBook(generateOrderBook(price));
      setTrades(generateTrades(price));
      setInvestor(generateInvestorData());
    }, 2000);
    return () => clearInterval(interval);
  }, [basePrice]);

  const infoItems = stockData ? [
    { label: "1일 최고", value: stockData.todayHigh.toLocaleString() },
    { label: "1일 최저", value: stockData.todayLow.toLocaleString() },
    { label: "52주 최고", value: stockData.chartData.length > 0 ? Math.max(...stockData.chartData.map(d => d.price)).toLocaleString() : "-" },
    { label: "52주 최저", value: stockData.chartData.length > 0 ? Math.min(...stockData.chartData.map(d => d.price)).toLocaleString() : "-" },
  ] : [];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <ScrollingTicker />
      <header className="border-b bg-background sticky top-0 z-[999]">
        <div className="max-w-[1400px] mx-auto px-4 h-12 flex items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <Link href="/">
              <div className="flex items-center gap-2 cursor-pointer" data-testid="link-home">
                <SamsungBadge size={24} />
                <span className="font-bold text-base">IBK기업증권</span>
              </div>
            </Link>
            <nav className="hidden md:flex items-center gap-1">
              {["홈", "피드", "주식 골라보기", "내 계좌"].map((item) => (
                item === "피드" ? (
                  <button key={item} onClick={() => setActiveTab("feed")} className="px-3 py-1.5 text-base text-muted-foreground rounded-md transition-colors" data-testid={`nav-${item}`}>
                    {item}
                  </button>
                ) : item === "홈" ? (
                  <button key={item} onClick={() => setActiveTab("chart")} className="px-3 py-1.5 text-base text-muted-foreground rounded-md transition-colors" data-testid={`nav-${item}`}>
                    {item}
                  </button>
                ) : (
                  <Link key={item} href={item === "내 계좌" ? "/dashboard" : "/"}>
                    <button className="px-3 py-1.5 text-base text-muted-foreground rounded-md transition-colors" data-testid={`nav-${item}`}>
                      {item}
                    </button>
                  </Link>
                )
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/login">
              <Button size="sm" variant="outline" data-testid="link-login">로그인</Button>
            </Link>
            <Link href="/register">
              <Button size="sm" data-testid="link-register">비대면 계좌개설</Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-[1400px] mx-auto w-full px-4 py-3">
        <div className="flex items-center gap-3 mb-1">
          <SamsungBadge size={36} />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-lg" data-testid="text-stock-name">삼성전자</h1>
              <span className="text-sm text-muted-foreground">005930</span>
            </div>
          </div>
        </div>
        <div className="flex items-baseline gap-2 mt-1 flex-wrap">
          {isLoading ? (
            <Skeleton className="h-8 w-40" />
          ) : (
            <>
              <span className="text-[32px] font-bold tabular-nums" data-testid="text-current-price">{displayPrice.toLocaleString()}원</span>
              <span className={`text-base font-medium ${isUp ? "text-red-500" : "text-blue-500"}`}>
                어제보다 {isUp ? "+" : ""}{displayChange.toLocaleString()}원 ({isUp ? "+" : ""}{displayChangePct}%)
              </span>
            </>
          )}
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto w-full px-4">
        <div className="flex items-center gap-0 border-b">
          {[
            { id: "chart", label: "차트·호가" },
            { id: "feed", label: "피드" },
            { id: "info", label: "종목정보" },
            { id: "news", label: "뉴스·공시" },
            { id: "trade", label: "거래현황" },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`px-4 py-2.5 text-base font-medium border-b-2 transition-colors ${activeTab === t.id ? "border-foreground text-foreground" : "border-transparent text-muted-foreground"}`}
              data-testid={`tab-${t.id}`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === "feed" ? (
        <FeedView />
      ) : activeTab === "info" ? (
        <StockInfoView />
      ) : activeTab === "news" ? (
        <NewsView />
      ) : (
      <div className="max-w-[1400px] mx-auto w-full px-4 py-4 flex-1">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px_280px] gap-4">

          <div className="space-y-4">
            <Card className="p-0 overflow-hidden">
              <div className="px-4 pt-3 pb-2 flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-1">
                  {["1m", "3m", "6m", "1y"].map((r) => (
                    <button
                      key={r}
                      onClick={() => setChartRange(r)}
                      className={`px-2.5 py-1 text-sm rounded-md font-medium transition-colors ${chartRange === r ? "bg-foreground text-background" : "text-muted-foreground"}`}
                      data-testid={`range-${r}`}
                    >
                      {r === "1m" ? "1개월" : r === "3m" ? "3개월" : r === "6m" ? "6개월" : "1년"}
                    </button>
                  ))}
                </div>
                {stockData?.lastUpdated && (
                  <span className="text-sm text-muted-foreground/50">
                    {new Date(stockData.lastUpdated).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })} 기준
                  </span>
                )}
              </div>
              <div className="h-[300px] px-2 pb-2">
                {isLoading || !stockData ? (
                  <Skeleton className="w-full h-full" />
                ) : (
                  <StockChart data={stockData.chartData} chartRange={chartRange} currentPrice={displayPrice} />
                )}
              </div>
              {stockData && (
                <div className="px-4 pb-3 flex gap-4 text-[13px] text-muted-foreground border-t pt-2 flex-wrap">
                  {infoItems.map((item) => (
                    <span key={item.label}>{item.label} <b className="text-foreground">{item.value}</b></span>
                  ))}
                </div>
              )}
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="p-0 overflow-hidden">
                <div className="px-3 py-2 border-b flex items-center justify-between gap-2">
                  <span className="text-base font-bold">시세</span>
                  <X className="w-3.5 h-3.5 text-muted-foreground/40" />
                </div>
                <TradesPanel trades={trades} />
              </Card>

              <Card className="p-0 overflow-hidden">
                <div className="px-3 py-2 border-b flex items-center justify-between gap-2">
                  <span className="text-base font-bold">투자자 동향</span>
                  <X className="w-3.5 h-3.5 text-muted-foreground/40" />
                </div>
                <InvestorPanel data={investor} />
              </Card>

              <Card className="p-0 overflow-hidden" data-testid="card-community">
                <div className="px-3 py-2 border-b flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span className="text-base font-bold">커뮤니티</span>
                  </div>
                  <a href="https://www.tossinvest.com/stocks/A005930/community" target="_blank" rel="noopener noreferrer" className="text-muted-foreground/40">
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
                <CommunityPanel />
              </Card>
            </div>
          </div>

          <Card className="p-0 overflow-hidden flex flex-col" data-testid="card-order-book">
            <div className="px-3 py-2 border-b flex items-center justify-between gap-2">
              <span className="text-base font-bold">호가</span>
              <X className="w-3.5 h-3.5 text-muted-foreground/40" />
            </div>
            <div className="flex-1 overflow-y-auto">
              <OrderBookPanel orderBook={orderBook} isLoading={isLoading} />
            </div>
          </Card>

          <Card className="p-0 overflow-hidden flex flex-col">
            <div className="px-3 py-2 border-b flex items-center justify-between gap-2">
              <span className="text-base font-bold">주문하기</span>
            </div>
            <div className="p-3 space-y-2.5 text-sm">
              <div className="grid grid-cols-[56px_1fr] items-center gap-x-3">
                <span className="text-muted-foreground">주문 유형</span>
                <div className="bg-muted/30 rounded-md p-0.5 flex">
                  <div className="flex-1 text-center py-1.5 bg-background rounded font-medium shadow-sm">일반 주문</div>
                </div>
              </div>
              <div className="grid grid-cols-[56px_1fr] items-center gap-x-3">
                <span className="text-muted-foreground">구매 가격</span>
                <div className="flex items-center gap-1">
                  <button className="px-2.5 py-1 rounded bg-muted/50 font-medium" data-testid="btn-price-type-limit">지정가</button>
                  <button className="px-2.5 py-1 rounded text-muted-foreground" data-testid="btn-price-type-market">시장가</button>
                </div>
              </div>
              <div className="grid grid-cols-[56px_1fr] items-center gap-x-3">
                <span></span>
                <div className="flex items-center border rounded-md">
                  <button className="px-2.5 py-1.5 text-muted-foreground border-r" data-testid="btn-price-minus">-</button>
                  <input type="text" value={displayPrice > 0 ? displayPrice.toLocaleString() : ""} readOnly className="flex-1 text-center text-base font-medium bg-transparent outline-none py-1.5 min-w-0 tabular-nums" data-testid="input-price" />
                  <button className="px-2.5 py-1.5 text-muted-foreground border-l" data-testid="btn-price-plus">+</button>
                </div>
              </div>
              <div className="grid grid-cols-[56px_1fr] items-center gap-x-3">
                <span className="text-muted-foreground">수량</span>
                <span className="text-muted-foreground">수량 입력</span>
              </div>
              <div className="grid grid-cols-[56px_1fr] items-center gap-x-3">
                <span></span>
                <div className="flex items-center border rounded-md">
                  <button className="px-2.5 py-1.5 text-muted-foreground border-r" data-testid="btn-qty-minus">-</button>
                  <input type="text" placeholder="0" className="flex-1 text-center text-base bg-transparent outline-none py-1.5 min-w-0 tabular-nums" data-testid="input-qty" />
                  <button className="px-2.5 py-1.5 text-muted-foreground border-l" data-testid="btn-qty-plus">+</button>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                {["10%", "25%", "50%", "최대"].map((pct) => (
                  <button key={pct} className="flex-1 py-1.5 rounded-md border text-muted-foreground font-medium" data-testid={`btn-pct-${pct}`}>{pct}</button>
                ))}
              </div>
              <div className="space-y-1 pt-1 border-t">
                <div className="flex items-center justify-between gap-2 pt-2">
                  <span className="text-muted-foreground">구매가능 금액</span>
                  <span className="font-medium tabular-nums">0원</span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-muted-foreground">총 주문 금액</span>
                  <span className="font-medium tabular-nums">0원</span>
                </div>
              </div>
              <Link href="/login">
                <Button className="w-full bg-red-500 border-red-500 text-white font-medium" data-testid="btn-buy">
                  로그인하고 구매하기
                </Button>
              </Link>
            </div>
            <div className="border-t" data-testid="card-top-investors">
              <div className="px-3 py-2 border-b">
                <span className="text-lg font-bold">수익금 상위 투자자 TOP5</span>
                <p className="text-sm text-muted-foreground mt-0.5">최근 1주일 기준</p>
              </div>
              <TopInvestorsPanel />
            </div>
          </Card>
        </div>
      </div>
      )}

    </div>
  );
}
