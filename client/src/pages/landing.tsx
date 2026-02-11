import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { SamsungLogo, SamsungBadge } from "@/components/samsung-logo";
import samsungChartImg from "@assets/telegram-cloud-photo-size-4-5789658066277043974-y_1770731398499.jpg";

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

function generateOrderBookFromPrice(basePrice: number) {
  const step = 100;
  const asks: { price: number; quantity: number }[] = [];
  const bids: { price: number; quantity: number }[] = [];
  const tickOffsets = [-200, -100, 0, 100, 200];
  const tick = tickOffsets[Math.floor(Math.random() * tickOffsets.length)];
  const displayPrice = basePrice + tick;
  for (let i = 5; i >= 1; i--) {
    asks.push({ price: displayPrice + i * step, quantity: Math.floor(Math.random() * 50000) + 5000 });
  }
  for (let i = 0; i < 5; i++) {
    bids.push({ price: displayPrice - i * step, quantity: Math.floor(Math.random() * 50000) + 5000 });
  }
  return { asks, bids, currentPrice: displayPrice };
}

function StockChart({ data }: { data: { date: string; price: number }[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; date: string; price: number } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || data.length === 0) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    const padL = 70, padR = 16, padT = 16, padB = 36;
    const w = rect.width - padL - padR;
    const h = rect.height - padT - padB;
    const prices = data.map((d) => d.price);
    const minP = Math.min(...prices);
    const maxP = Math.max(...prices);
    const range = maxP - minP || 1;
    const minY = minP - range * 0.05;
    const maxY = maxP + range * 0.05;

    ctx.clearRect(0, 0, rect.width, rect.height);

    const gridColor = "rgba(128,128,128,0.12)";
    const textColor = "rgba(128,128,128,0.65)";
    ctx.font = "11px -apple-system, BlinkMacSystemFont, sans-serif";

    const gridLines = 5;
    for (let i = 0; i <= gridLines; i++) {
      const yVal = minY + ((maxY - minY) / gridLines) * i;
      const y = padT + h - ((yVal - minY) / (maxY - minY)) * h;
      ctx.beginPath();
      ctx.moveTo(padL, y);
      ctx.lineTo(padL + w, y);
      ctx.strokeStyle = gridColor;
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.fillStyle = textColor;
      ctx.textAlign = "right";
      ctx.textBaseline = "middle";
      ctx.fillText(Math.round(yVal).toLocaleString(), padL - 8, y);
    }

    const monthsSeen = new Set<string>();
    data.forEach((d, i) => {
      const m = d.date.substring(0, 7);
      if (!monthsSeen.has(m)) {
        monthsSeen.add(m);
        const x = padL + (i / (data.length - 1)) * w;
        ctx.beginPath();
        ctx.moveTo(x, padT);
        ctx.lineTo(x, padT + h);
        ctx.strokeStyle = gridColor;
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.fillStyle = textColor;
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        const parts = d.date.split("-");
        ctx.fillText(`${parts[0].slice(2)}.${parts[1]}`, x, padT + h + 8);
      }
    });

    const gradient = ctx.createLinearGradient(0, padT, 0, padT + h);
    gradient.addColorStop(0, "rgba(20, 40, 160, 0.18)");
    gradient.addColorStop(0.5, "rgba(20, 40, 160, 0.06)");
    gradient.addColorStop(1, "rgba(20, 40, 160, 0)");
    ctx.beginPath();
    data.forEach((d, i) => {
      const x = padL + (i / (data.length - 1)) * w;
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
    data.forEach((d, i) => {
      const x = padL + (i / (data.length - 1)) * w;
      const y = padT + h - ((d.price - minY) / (maxY - minY)) * h;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.strokeStyle = "#1428a0";
    ctx.lineWidth = 2;
    ctx.stroke();

    const lastD = data[data.length - 1];
    const lastX = padL + w;
    const lastY = padT + h - ((lastD.price - minY) / (maxY - minY)) * h;
    ctx.beginPath();
    ctx.arc(lastX, lastY, 4, 0, Math.PI * 2);
    ctx.fillStyle = "#1428a0";
    ctx.fill();
    ctx.beginPath();
    ctx.arc(lastX, lastY, 7, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(20,40,160,0.3)";
    ctx.lineWidth = 2;
    ctx.stroke();
  }, [data]);

  const handleMouseMove = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas || data.length === 0) return;
    const rect = canvas.getBoundingClientRect();
    const padL = 70, padR = 16, padT = 16, padB = 36;
    const w = rect.width - padL - padR;
    const mx = e.clientX - rect.left - padL;
    if (mx < 0 || mx > w) { setTooltip(null); return; }
    const idx = Math.round((mx / w) * (data.length - 1));
    const d = data[Math.max(0, Math.min(idx, data.length - 1))];
    const prices = data.map((dd) => dd.price);
    const minP = Math.min(...prices);
    const maxP = Math.max(...prices);
    const range = maxP - minP || 1;
    const minY = minP - range * 0.05;
    const maxY = maxP + range * 0.05;
    const h = rect.height - padT - padB;
    const x = padL + (idx / (data.length - 1)) * w;
    const y = padT + h - ((d.price - minY) / (maxY - minY)) * h;
    setTooltip({ x: e.clientX - rect.left, y, date: d.date, price: d.price });
  };

  return (
    <div ref={containerRef} className="relative w-full h-full" onMouseLeave={() => setTooltip(null)}>
      <canvas ref={canvasRef} className="w-full h-full" style={{ display: "block" }} onMouseMove={handleMouseMove} />
      {tooltip && (
        <>
          <div className="absolute top-0 pointer-events-none" style={{ left: tooltip.x, width: 1, height: "calc(100% - 36px)", background: "rgba(128,128,128,0.3)" }} />
          <div className="absolute pointer-events-none" style={{ left: 70, right: 16, top: tooltip.y, height: 1, background: "rgba(128,128,128,0.2)" }} />
          <div className="absolute pointer-events-none bg-foreground text-background px-2.5 py-1.5 rounded-md text-xs font-mono shadow-lg" style={{ left: tooltip.x + 12, top: tooltip.y - 36, whiteSpace: "nowrap" }}>
            <div className="text-[10px] opacity-70 mb-0.5">{tooltip.date}</div>
            <div className="font-bold">{tooltip.price.toLocaleString()}원</div>
          </div>
        </>
      )}
    </div>
  );
}

function AnimatedBar({ percent, color, side }: { percent: number; color: string; side: "left" | "right" }) {
  const barRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (barRef.current) {
      barRef.current.style.width = `${percent}%`;
    }
  }, [percent]);
  return (
    <div
      ref={barRef}
      className={`absolute top-0 bottom-0 ${side === "right" ? "right-0" : "left-0"}`}
      style={{
        width: "0%",
        background: color,
        transition: "width 0.6s cubic-bezier(0.22, 1, 0.36, 1)",
      }}
    />
  );
}

function OrderBook({ orderBook }: { orderBook: ReturnType<typeof generateOrderBookFromPrice> }) {
  const maxQty = Math.max(
    ...orderBook.asks.map((a) => a.quantity),
    ...orderBook.bids.map((b) => b.quantity)
  );
  const totalAsk = orderBook.asks.reduce((s, a) => s + a.quantity, 0);
  const totalBid = orderBook.bids.reduce((s, b) => s + b.quantity, 0);
  const intensityPercent = totalBid + totalAsk > 0 ? Math.round((totalBid / (totalBid + totalAsk)) * 100) : 50;

  return (
    <div className="text-sm font-mono">
      <div className="grid grid-cols-[1fr_auto_1fr] gap-0 px-2 pb-2 text-[10px] text-muted-foreground border-b mb-1">
        <span>수량(주)</span>
        <span className="text-center px-3">가격(원)</span>
        <span className="text-right">수량(주)</span>
      </div>
      {[...orderBook.asks].reverse().map((ask, i) => (
        <div key={`ask-${i}`} className="grid grid-cols-[1fr_auto_1fr] gap-0 px-2 py-[5px] relative" data-testid={`row-ask-${i}`}>
          <AnimatedBar percent={(ask.quantity / maxQty) * 100} color="rgba(59,130,246,0.1)" side="left" />
          <span className="text-right z-10 text-muted-foreground text-xs tabular-nums">{ask.quantity.toLocaleString()}</span>
          <span className="text-center z-10 text-blue-600 dark:text-blue-400 font-medium px-3 text-xs tabular-nums">{ask.price.toLocaleString()}</span>
          <span className="z-10 text-[10px] text-muted-foreground/50">매도{5 - i}</span>
        </div>
      ))}

      <div className="px-2 py-2 my-0.5 bg-muted/30 rounded-md">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] font-semibold text-muted-foreground">현재가</span>
          <span className="font-bold text-base text-red-500 tabular-nums" data-testid="text-orderbook-price">{orderBook.currentPrice.toLocaleString()}원</span>
        </div>
      </div>

      {orderBook.bids.map((bid, i) => (
        <div key={`bid-${i}`} className="grid grid-cols-[1fr_auto_1fr] gap-0 px-2 py-[5px] relative" data-testid={`row-bid-${i}`}>
          <AnimatedBar percent={(bid.quantity / maxQty) * 100} color="rgba(239,68,68,0.1)" side="right" />
          <span className="z-10 text-[10px] text-muted-foreground/50 text-right">매수{i + 1}</span>
          <span className="text-center z-10 text-red-500 font-medium px-3 text-xs tabular-nums">{bid.price.toLocaleString()}</span>
          <span className="text-right z-10 text-muted-foreground text-xs tabular-nums">{bid.quantity.toLocaleString()}</span>
        </div>
      ))}

      <div className="mt-3 px-2">
        <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1.5">
          <span>매도 체결강도</span>
          <span className="font-bold text-xs text-foreground">{intensityPercent}%</span>
          <span>매수 체결강도</span>
        </div>
        <div className="h-2.5 rounded-full overflow-hidden flex bg-muted/30">
          <div
            className="h-full rounded-l-full"
            style={{
              width: `${100 - intensityPercent}%`,
              background: "linear-gradient(90deg, rgba(59,130,246,0.6), rgba(59,130,246,0.3))",
              transition: "width 0.8s cubic-bezier(0.22, 1, 0.36, 1)",
            }}
          />
          <div
            className="h-full rounded-r-full"
            style={{
              width: `${intensityPercent}%`,
              background: "linear-gradient(90deg, rgba(239,68,68,0.3), rgba(239,68,68,0.6))",
              transition: "width 0.8s cubic-bezier(0.22, 1, 0.36, 1)",
            }}
          />
        </div>
        <div className="flex items-center justify-between text-[10px] text-muted-foreground mt-1">
          <span className="text-blue-500 tabular-nums">{totalAsk.toLocaleString()}</span>
          <span className="text-red-500 tabular-nums">{totalBid.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
}

export default function LandingPage() {
  const { data: stockData, isLoading } = useQuery<StockData>({
    queryKey: ["/api/stock/samsung"],
    refetchInterval: 30 * 1000,
  });

  const basePrice = stockData?.currentPrice ?? 0;
  const basePriceChange = stockData?.priceChange ?? 0;
  const previousClose = stockData?.previousClose ?? 0;

  const [orderBook, setOrderBook] = useState(() => generateOrderBookFromPrice(83700));
  const displayPrice = orderBook.currentPrice;
  const displayChange = previousClose > 0 ? displayPrice - previousClose : basePriceChange;
  const displayChangePercent = previousClose > 0
    ? parseFloat(((displayChange / previousClose) * 100).toFixed(2))
    : stockData?.priceChangePercent ?? 0;
  const isUp = displayChange >= 0;

  useEffect(() => {
    if (basePrice > 0) {
      setOrderBook(generateOrderBookFromPrice(basePrice));
    }
  }, [basePrice]);

  useEffect(() => {
    if (basePrice <= 0) return;
    const interval = setInterval(() => {
      setOrderBook(generateOrderBookFromPrice(basePrice));
    }, 2000);
    return () => clearInterval(interval);
  }, [basePrice]);

  const lastUpdatedText = stockData?.lastUpdated
    ? new Date(stockData.lastUpdated).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
    : "";

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-background/95 backdrop-blur sticky top-0 z-[999]">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between gap-4 flex-wrap">
          <Link href="/">
            <div className="flex items-center gap-2.5 cursor-pointer">
              <SamsungBadge size={32} />
              <SamsungLogo className="h-4 w-auto text-foreground" />
              <div className="h-4 w-px bg-border" />
              <span className="font-semibold text-sm tracking-wide text-muted-foreground">주식관리</span>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/login">
              <Button variant="ghost" size="sm" data-testid="link-login">
                로그인
              </Button>
            </Link>
            <Link href="/register">
              <Button size="sm" data-testid="link-register">
                회원가입
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden" style={{ minHeight: "520px" }}>
        <div className="absolute inset-0">
          <img
            src="/images/samsung-building-hero.png"
            alt="Samsung Electronics Headquarters"
            className="w-full h-full object-cover scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0c1b3a]/80 via-[#0c1b3a]/65 to-[#0c1b3a]/85" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 md:px-6 py-20 md:py-28">
          <div className="text-center mb-12">
            <div className="inline-block mb-6">
              <SamsungLogo className="h-8 md:h-10 w-auto text-white mx-auto" />
            </div>
            <h1 className="text-3xl md:text-5xl font-bold text-white mb-3 tracking-tight">
              삼성전자
            </h1>
            <p className="text-white/60 text-sm md:text-base max-w-md mx-auto tracking-wide">
              실시간 주식 현황 확인 및 입출고 관리 시스템
            </p>
          </div>

          <div className="flex items-center justify-center gap-4 mb-10 flex-wrap">
            {isLoading ? (
              <Skeleton className="h-16 w-64 bg-white/10" />
            ) : (
              <>
                <span className="text-4xl md:text-6xl font-bold text-white tracking-tight">
                  {displayPrice.toLocaleString()}
                </span>
                <span className="text-white/40 text-xl font-light">KRW</span>
                <div className={`flex items-center gap-1.5 backdrop-blur px-3 py-1.5 rounded-md border ${isUp ? "bg-red-500/20 border-red-400/20" : "bg-blue-500/20 border-blue-400/20"}`}>
                  {isUp ? <ArrowUpRight className="w-4 h-4 text-red-400" /> : <ArrowDownRight className="w-4 h-4 text-blue-400" />}
                  <span className={`font-semibold text-base ${isUp ? "text-red-400" : "text-blue-400"}`}>
                    {isUp ? "+" : ""}{displayChange.toLocaleString()} ({isUp ? "+" : ""}{displayChangePercent}%)
                  </span>
                </div>
              </>
            )}
          </div>

          <div className="flex justify-center gap-4 flex-wrap">
            <Link href="/register">
              <Button size="lg" className="bg-white text-[#1428a0] border-white font-semibold px-8">
                신청하기
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" size="lg" className="text-white border-white/30 bg-white/5 backdrop-blur px-8">
                로그인
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 md:px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 p-0 overflow-hidden">
            <div className="p-5 border-b flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                <SamsungLogo className="h-3.5 w-auto text-foreground opacity-70" />
                <div>
                  <h2 className="font-bold text-lg" data-testid="text-stock-name">삼성전자 보통주</h2>
                  <p className="text-xs text-muted-foreground">005930 | KRX</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {isLoading ? (
                  <Skeleton className="h-8 w-40" />
                ) : (
                  <>
                    <span className="text-2xl font-bold tracking-tight" data-testid="text-current-price">
                      {displayPrice.toLocaleString()}원
                    </span>
                    <Badge variant="default" className={isUp ? "bg-red-500 border-red-500" : "bg-blue-500 border-blue-500"}>
                      {isUp ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                      {isUp ? "+" : ""}{displayChangePercent}%
                    </Badge>
                  </>
                )}
              </div>
            </div>
            <div className="p-5">
              <div className="h-[300px] md:h-[400px]">
                {isLoading || !stockData ? (
                  <div className="w-full h-full flex items-center justify-center">
                    <Skeleton className="w-full h-full" />
                  </div>
                ) : (
                  <StockChart data={stockData.chartData} />
                )}
              </div>
              <div className="flex items-center justify-between mt-4 text-xs text-muted-foreground px-1 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span>1년 차트 (Yahoo Finance)</span>
                  {lastUpdatedText && (
                    <span className="text-muted-foreground/60" data-testid="text-last-updated">업데이트 {lastUpdatedText}</span>
                  )}
                </div>
                {stockData && (
                  <div className="flex gap-4">
                    <span>시가 <b className="text-foreground">{stockData.todayOpen.toLocaleString()}</b></span>
                    <span>고가 <b className="text-red-500">{stockData.todayHigh.toLocaleString()}</b></span>
                    <span>저가 <b className="text-blue-500">{stockData.todayLow.toLocaleString()}</b></span>
                  </div>
                )}
              </div>
            </div>
          </Card>

          <Card className="p-0 overflow-hidden" data-testid="card-order-book">
            <div className="p-5 border-b">
              <h3 className="font-bold">호가창</h3>
              <p className="text-xs text-muted-foreground">현재가 기준 매수/매도 호가</p>
            </div>
            <div className="p-3">
              {isLoading ? (
                <div className="space-y-2 p-3">
                  {Array.from({ length: 11 }).map((_, i) => (
                    <Skeleton key={i} className="h-6 w-full" />
                  ))}
                </div>
              ) : (
                <OrderBook orderBook={orderBook} />
              )}
            </div>
          </Card>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-6">
            <div className="flex flex-col gap-5">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <SamsungLogo className="h-3 w-auto text-foreground opacity-50" />
                </div>
                <h3 className="font-bold text-xl mt-2">공급물량 단가</h3>
                <p className="text-sm text-muted-foreground mt-1">선착순 물량 소진 시 마감됩니다</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#1428a0]/8 rounded-md p-5 text-center border border-[#1428a0]/10">
                  <p className="text-xs text-muted-foreground mb-2">공급물량 단가</p>
                  <p className="text-2xl font-bold text-[#1428a0]">50,000원</p>
                  <p className="text-xs text-muted-foreground mt-1">1주당</p>
                </div>
                <div className="bg-red-500/8 rounded-md p-5 text-center border border-red-500/10">
                  <p className="text-xs text-muted-foreground mb-2">현재 시세</p>
                  <p className="text-2xl font-bold text-red-500" data-testid="text-market-price">
                    {isLoading ? "---" : `${displayPrice.toLocaleString()}원`}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">1주당</p>
                </div>
              </div>
              <Link href="/register">
                <Button className="w-full bg-[#1428a0] border-[#1428a0]" data-testid="button-apply">
                  지금 신청하기
                </Button>
              </Link>
            </div>
          </Card>

          <Card className="p-0 overflow-hidden">
            <img
              src={samsungChartImg}
              alt="Samsung Stock Info"
              className="w-full h-full object-cover object-top"
              style={{ maxHeight: "340px" }}
            />
          </Card>
        </div>
      </section>

      <section className="relative overflow-hidden my-4" style={{ minHeight: "320px" }}>
        <div className="absolute inset-0">
          <img
            src="/images/samsung-factory.png"
            alt="Samsung Factory"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0c1b3a]/85 via-[#0c1b3a]/70 to-[#0c1b3a]/85" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 md:px-6 py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
            <div>
              <SamsungLogo className="h-5 w-auto text-white/40 mb-5" />
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-4 leading-snug">
                진화된 기술,<br />새로운 아이덴티티
              </h2>
              <p className="text-white/60 text-sm leading-relaxed mb-5">
                삼성전자는 세계 최초의 64M DRAM, 디지털 TV, MP3 플레이어 등 전 세계에 많은 것을 최초로 소개했습니다.
                글로벌 고객에게 특별한 인상을 남기기 위해 브랜드 이미지를 완전히 새롭게 바꾸었습니다.
              </p>
              <p className="text-white/40 text-xs">
                2023년 3분기말 기준 삼성전자 총발행주식수는 6,792,669,250주입니다.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/8 backdrop-blur-sm rounded-md p-5 text-center border border-white/10">
                <p className="text-xs text-white/50 mb-2">보통주</p>
                <p className="text-2xl font-bold text-white">87.9%</p>
                <p className="text-xs text-white/40 mt-1">5,969,782,550주</p>
              </div>
              <div className="bg-white/8 backdrop-blur-sm rounded-md p-5 text-center border border-white/10">
                <p className="text-xs text-white/50 mb-2">우선주</p>
                <p className="text-2xl font-bold text-white">12.1%</p>
                <p className="text-xs text-white/40 mt-1">822,886,700주</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t mt-8">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-10">
          <div className="flex flex-col items-center gap-4">
            <SamsungLogo className="h-4 w-auto text-muted-foreground/50" />
            <div className="text-center text-sm text-muted-foreground">
              <p>삼성전자 주식관리 시스템</p>
              <p className="mt-1 text-xs">본 서비스는 주식 입출고 관리를 위한 내부 시스템입니다.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
