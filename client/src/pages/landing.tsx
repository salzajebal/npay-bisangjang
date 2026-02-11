import { useEffect, useRef, useState, useCallback } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Heart, Star, X, TrendingUp, TrendingDown, ExternalLink, MessageCircle } from "lucide-react";
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
  const scrollRef = useRef<HTMLDivElement>(null);
  const stocks = useTickerPrices();

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    let animId: number;
    let pos = 0;
    const speed = 0.6;
    const tick = () => {
      pos -= speed;
      const halfW = el.scrollWidth / 2;
      if (Math.abs(pos) >= halfW) pos = 0;
      el.style.transform = `translateX(${pos}px)`;
      animId = requestAnimationFrame(tick);
    };
    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, []);

  const items = [...stocks, ...stocks];

  return (
    <div className="bg-muted/30 border-b overflow-hidden h-10 flex items-center" data-testid="scrolling-ticker">
      <div className="shrink-0 px-4 text-xs font-bold text-muted-foreground border-r h-full flex items-center bg-background z-10">
        국내주식
      </div>
      <div className="overflow-hidden flex-1 relative">
        <div ref={scrollRef} className="flex items-center gap-0 whitespace-nowrap will-change-transform">
          {items.map((s, i) => (
            <div key={i} className="flex items-center gap-2 px-4 shrink-0">
              <span className="text-[13px] font-semibold text-foreground">{s.name}</span>
              <span className="text-[13px] tabular-nums font-bold text-foreground">{s.price.toLocaleString()}</span>
              <span className={`text-[12px] tabular-nums font-semibold ${s.change >= 0 ? "text-red-500" : "text-blue-500"}`}>
                {s.change >= 0 ? "+" : ""}{s.change.toLocaleString()} ({s.change >= 0 ? "+" : ""}{s.pct}%)
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MarketIndexTicker() {
  return (
    <div className="flex items-center gap-4 overflow-x-auto whitespace-nowrap text-[11px] py-1.5 px-4 scrollbar-none">
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

function StockChart({ data, chartRange }: { data: { date: string; price: number }[]; chartRange: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; date: string; price: number } | null>(null);

  const filteredData = (() => {
    if (chartRange === "1y" || data.length === 0) return data;
    const now = new Date(data[data.length - 1].date);
    let cutoff = new Date(now);
    if (chartRange === "1m") cutoff.setMonth(cutoff.getMonth() - 1);
    else if (chartRange === "3m") cutoff.setMonth(cutoff.getMonth() - 3);
    else if (chartRange === "6m") cutoff.setMonth(cutoff.getMonth() - 6);
    else return data;
    return data.filter((d) => new Date(d.date) >= cutoff);
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
          <div className="absolute pointer-events-none bg-foreground text-background px-2 py-1 rounded text-[11px] font-mono" style={{ left: Math.min(tooltip.x + 10, (containerRef.current?.offsetWidth ?? 300) - 120), top: Math.max(tooltip.y - 40, 0), whiteSpace: "nowrap" }}>
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
    <div className="text-xs font-mono">
      <div className="grid grid-cols-[1fr_80px_1fr] gap-0 px-3 py-1.5 text-[10px] text-muted-foreground border-b">
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
          <span className="font-bold text-sm text-red-500 tabular-nums" data-testid="text-orderbook-price">{orderBook.currentPrice.toLocaleString()}</span>
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
        <button onClick={() => setTab("realtime")} className={`px-3 py-2 text-xs font-medium border-b-2 transition-colors ${tab === "realtime" ? "border-foreground text-foreground" : "border-transparent text-muted-foreground"}`} data-testid="tab-realtime">실시간</button>
        <button onClick={() => setTab("daily")} className={`px-3 py-2 text-xs font-medium border-b-2 transition-colors ${tab === "daily" ? "border-foreground text-foreground" : "border-transparent text-muted-foreground"}`} data-testid="tab-daily">일별</button>
      </div>
      <div className="text-xs font-mono">
        <div className="grid grid-cols-[70px_40px_52px_1fr_62px] gap-0 px-3 py-1.5 text-[10px] text-muted-foreground border-b">
          <span>현재가</span>
          <span className="text-right">체결량</span>
          <span className="text-right">등락률</span>
          <span className="text-right">거래량</span>
          <span className="text-right">시간</span>
        </div>
        <div className="max-h-[240px] overflow-y-auto">
          {trades.map((t, i) => (
            <div key={i} className="grid grid-cols-[70px_40px_52px_1fr_62px] gap-0 px-3 py-[3px] text-[11px]">
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
            <span className="text-xs text-muted-foreground w-10 shrink-0">{item.label}</span>
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
            <span className={`text-xs font-medium tabular-nums w-16 text-right ${item.value >= 0 ? "text-red-500" : "text-blue-500"}`}>
              {item.value >= 0 ? "+" : ""}{item.value.toLocaleString()}
            </span>
          </div>
        ))}
      </div>

      <div className="border-t mt-2">
        <div className="grid grid-cols-4 gap-0 px-3 py-1.5 text-[10px] text-muted-foreground border-b">
          <span>일자</span>
          <span className="text-right">개인</span>
          <span className="text-right">외국인</span>
          <span className="text-right">기관</span>
        </div>
        {historyRows.map((row) => (
          <div key={row.date} className="grid grid-cols-4 gap-0 px-3 py-[4px] text-[11px]">
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
  { name: "니은미음", profit: 295611339, pct: 28.93, avatar: "NM" },
  { name: "하준빠더", profit: 259864836, pct: 404.65, avatar: "HJ" },
  { name: "플라타나스나무", profit: 215533861, pct: 157.42, avatar: "PT" },
  { name: "얼쑨이", profit: 194427696, pct: 6.80, avatar: "ES" },
  { name: "망월동의현인", profit: 193724247, pct: 19.77, avatar: "MW" },
];

function TopInvestorsPanel() {
  return (
    <div className="divide-y">
      {TOP_INVESTORS.map((inv, i) => (
        <div key={inv.name} className="flex items-center gap-3 px-3 py-2.5">
          <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground shrink-0">
            {inv.avatar}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-foreground truncate">{inv.name}</p>
            <p className="text-[11px] text-red-500 tabular-nums font-medium">
              +{inv.profit.toLocaleString()}원 ({inv.pct}%)
            </p>
          </div>
          <Button size="sm" variant="outline" className="text-[11px] px-3 shrink-0" data-testid={`btn-follow-${i}`}>
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
            <span className="text-xs font-semibold text-foreground">{post.user}</span>
            {post.badge && (
              <span className="text-[9px] px-1.5 py-0.5 rounded-sm bg-red-500/10 text-red-500 font-medium">{post.badge}</span>
            )}
            <span className="text-[10px] text-muted-foreground/50 ml-auto">{post.time}</span>
          </div>
          <p className="text-[11px] text-foreground/80 leading-relaxed">{post.content}</p>
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground/50">
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
                <span className="font-bold text-sm">삼성증권</span>
              </div>
            </Link>
            <nav className="hidden md:flex items-center gap-1">
              {["홈", "피드", "주식 골라보기", "내 계좌"].map((item) => (
                <Link key={item} href={item === "내 계좌" ? "/dashboard" : "/"}>
                  <button className="px-3 py-1.5 text-sm text-muted-foreground rounded-md transition-colors" data-testid={`nav-${item}`}>
                    {item}
                  </button>
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center bg-muted/50 rounded-md px-3 gap-2">
              <Search className="w-3.5 h-3.5 text-muted-foreground" />
              <input type="text" placeholder="종목 검색하세요" className="bg-transparent border-0 outline-none text-sm py-1.5 w-36 placeholder:text-muted-foreground/50" data-testid="input-search" />
            </div>
            <Link href="/login">
              <Button size="sm" data-testid="link-login">로그인</Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-[1400px] mx-auto w-full px-4 py-3">
        <div className="flex items-center gap-3 mb-1">
          <SamsungBadge size={36} />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-base" data-testid="text-stock-name">삼성전자</h1>
              <span className="text-xs text-muted-foreground">005930</span>
            </div>
          </div>
        </div>
        <div className="flex items-baseline gap-2 mt-1 flex-wrap">
          {isLoading ? (
            <Skeleton className="h-8 w-40" />
          ) : (
            <>
              <span className="text-[28px] font-bold tabular-nums" data-testid="text-current-price">{displayPrice.toLocaleString()}원</span>
              <span className={`text-sm font-medium ${isUp ? "text-red-500" : "text-blue-500"}`}>
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
            { id: "info", label: "종목정보" },
            { id: "news", label: "뉴스·공시" },
            { id: "trade", label: "거래현황" },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${activeTab === t.id ? "border-foreground text-foreground" : "border-transparent text-muted-foreground"}`}
              data-testid={`tab-${t.id}`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

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
                      className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${chartRange === r ? "bg-foreground text-background" : "text-muted-foreground"}`}
                      data-testid={`range-${r}`}
                    >
                      {r === "1m" ? "1개월" : r === "3m" ? "3개월" : r === "6m" ? "6개월" : "1년"}
                    </button>
                  ))}
                </div>
                {stockData?.lastUpdated && (
                  <span className="text-[10px] text-muted-foreground/50">
                    {new Date(stockData.lastUpdated).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })} 기준
                  </span>
                )}
              </div>
              <div className="h-[300px] px-2 pb-2">
                {isLoading || !stockData ? (
                  <Skeleton className="w-full h-full" />
                ) : (
                  <StockChart data={stockData.chartData} chartRange={chartRange} />
                )}
              </div>
              {stockData && (
                <div className="px-4 pb-3 flex gap-4 text-[11px] text-muted-foreground border-t pt-2 flex-wrap">
                  {infoItems.map((item) => (
                    <span key={item.label}>{item.label} <b className="text-foreground">{item.value}</b></span>
                  ))}
                </div>
              )}
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="p-0 overflow-hidden">
                <div className="px-3 py-2 border-b flex items-center justify-between gap-2">
                  <span className="text-sm font-bold">시세</span>
                  <X className="w-3.5 h-3.5 text-muted-foreground/40" />
                </div>
                <TradesPanel trades={trades} />
              </Card>

              <Card className="p-0 overflow-hidden">
                <div className="px-3 py-2 border-b flex items-center justify-between gap-2">
                  <span className="text-sm font-bold">투자자 동향</span>
                  <X className="w-3.5 h-3.5 text-muted-foreground/40" />
                </div>
                <InvestorPanel data={investor} />
              </Card>

              <Card className="p-0 overflow-hidden" data-testid="card-community">
                <div className="px-3 py-2 border-b flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span className="text-sm font-bold">커뮤니티</span>
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
              <span className="text-sm font-bold">호가</span>
              <X className="w-3.5 h-3.5 text-muted-foreground/40" />
            </div>
            <div className="flex-1 overflow-y-auto">
              <OrderBookPanel orderBook={orderBook} isLoading={isLoading} />
            </div>
          </Card>

          <Card className="p-0 overflow-hidden flex flex-col">
            <div className="px-3 py-2 border-b flex items-center justify-between gap-2">
              <span className="text-sm font-bold">주문하기</span>
            </div>
            <div className="p-3 space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground w-16 shrink-0">주문 유형</span>
                <div className="flex-1 bg-muted/30 rounded-md p-0.5 flex">
                  <div className="flex-1 text-center text-xs py-1.5 bg-background rounded font-medium shadow-sm">일반 주문</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground w-16 shrink-0">구매 가격</span>
                <div className="flex-1 flex items-center gap-1">
                  <button className="px-2 py-1 text-xs rounded bg-muted/50 font-medium" data-testid="btn-price-type-limit">지정가</button>
                  <button className="px-2 py-1 text-xs rounded text-muted-foreground" data-testid="btn-price-type-market">시장가</button>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground w-16 shrink-0"></span>
                <div className="flex-1 flex items-center border rounded-md">
                  <button className="px-2 py-1.5 text-muted-foreground border-r" data-testid="btn-price-minus">-</button>
                  <input type="text" value={displayPrice > 0 ? displayPrice.toLocaleString() : ""} readOnly className="flex-1 text-center text-sm font-medium bg-transparent outline-none py-1.5 tabular-nums" data-testid="input-price" />
                  <span className="text-xs text-muted-foreground pr-1">원</span>
                  <button className="px-2 py-1.5 text-muted-foreground border-l" data-testid="btn-price-plus">+</button>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground w-16 shrink-0">수량</span>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <span>수량 입력</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground w-16 shrink-0"></span>
                <div className="flex-1 flex items-center border rounded-md">
                  <button className="px-2 py-1.5 text-muted-foreground border-r" data-testid="btn-qty-minus">-</button>
                  <input type="text" placeholder="0" className="flex-1 text-center text-sm bg-transparent outline-none py-1.5 tabular-nums" data-testid="input-qty" />
                  <button className="px-2 py-1.5 text-muted-foreground border-l" data-testid="btn-qty-plus">+</button>
                </div>
              </div>
              <div className="flex items-center gap-1 flex-wrap">
                {["10%", "25%", "50%", "최대"].map((pct) => (
                  <button key={pct} className="flex-1 text-xs py-1.5 rounded-md border text-muted-foreground font-medium" data-testid={`btn-pct-${pct}`}>{pct}</button>
                ))}
              </div>
              <div className="space-y-1 pt-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">구매가능 금액</span>
                  <span className="font-medium">0원</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">총 주문 금액</span>
                  <span className="font-medium">0원</span>
                </div>
              </div>
              <Link href="/login">
                <Button className="w-full bg-red-500 border-red-500 text-white font-medium" data-testid="btn-buy">
                  로그인하고 구매하기
                </Button>
              </Link>
            </div>
          </Card>

          <Card className="p-0 overflow-hidden" data-testid="card-top-investors">
            <div className="px-3 py-2 border-b">
              <span className="text-sm font-bold">수익금 상위 투자자 TOP5</span>
              <p className="text-[10px] text-muted-foreground mt-0.5">최근 1주일 기준</p>
            </div>
            <TopInvestorsPanel />
          </Card>
        </div>
      </div>

    </div>
  );
}
