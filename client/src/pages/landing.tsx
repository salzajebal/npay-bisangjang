import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, ArrowUpRight, BarChart3, Users, Shield } from "lucide-react";
import { SamsungLogo } from "@/components/samsung-logo";
import samsungInfoImg from "@assets/telegram-cloud-photo-size-4-5789658066277043973-y_1770731402444.jpg";
import samsungChartImg from "@assets/telegram-cloud-photo-size-4-5789658066277043974-y_1770731398499.jpg";

function generateOrderBook() {
  const basePrice = 83700;
  const asks: { price: number; quantity: number }[] = [];
  const bids: { price: number; quantity: number }[] = [];
  for (let i = 5; i >= 1; i--) {
    asks.push({ price: basePrice + i * 100, quantity: Math.floor(Math.random() * 50000) + 5000 });
  }
  for (let i = 0; i < 5; i++) {
    bids.push({ price: basePrice - i * 100, quantity: Math.floor(Math.random() * 50000) + 5000 });
  }
  return { asks, bids, currentPrice: basePrice };
}

function generateChartData() {
  const data: { date: string; price: number }[] = [];
  let price = 55000;
  const now = new Date();
  for (let i = 365; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    price = price + (Math.random() - 0.45) * 1200;
    price = Math.max(50000, Math.min(90000, price));
    data.push({ date: `${d.getMonth() + 1}/${d.getDate()}`, price: Math.round(price) });
  }
  return data;
}

function MiniChart({ data }: { data: { date: string; price: number }[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    const w = rect.width;
    const h = rect.height;
    const prices = data.map((d) => d.price);
    const min = Math.min(...prices) - 2000;
    const max = Math.max(...prices) + 2000;
    ctx.clearRect(0, 0, w, h);
    const gradient = ctx.createLinearGradient(0, 0, 0, h);
    gradient.addColorStop(0, "rgba(59, 130, 246, 0.12)");
    gradient.addColorStop(1, "rgba(59, 130, 246, 0)");
    ctx.beginPath();
    ctx.moveTo(0, h);
    data.forEach((d, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - ((d.price - min) / (max - min)) * h;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.lineTo(w, h);
    ctx.lineTo(0, h);
    ctx.fillStyle = gradient;
    ctx.fill();
    ctx.beginPath();
    data.forEach((d, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - ((d.price - min) / (max - min)) * h;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.strokeStyle = "#1428a0";
    ctx.lineWidth = 2;
    ctx.stroke();
  }, [data]);
  return <canvas ref={canvasRef} className="w-full h-full" style={{ display: "block" }} />;
}

function OrderBook({ orderBook }: { orderBook: ReturnType<typeof generateOrderBook> }) {
  const maxQty = Math.max(
    ...orderBook.asks.map((a) => a.quantity),
    ...orderBook.bids.map((b) => b.quantity)
  );
  return (
    <div className="space-y-0.5 text-sm font-mono">
      <div className="grid grid-cols-3 gap-2 px-3 pb-2 text-xs text-muted-foreground border-b mb-2">
        <span>호가</span>
        <span className="text-right">가격(원)</span>
        <span className="text-right">수량(주)</span>
      </div>
      {orderBook.asks.reverse().map((ask, i) => (
        <div key={`ask-${i}`} className="grid grid-cols-3 gap-2 px-3 py-1 relative">
          <div className="absolute right-0 top-0 bottom-0 bg-blue-500/8" style={{ width: `${(ask.quantity / maxQty) * 100}%` }} />
          <span className="text-xs text-muted-foreground z-10">매도{5 - i}</span>
          <span className="text-right text-blue-600 z-10 font-medium">{ask.price.toLocaleString()}</span>
          <span className="text-right z-10 text-muted-foreground">{ask.quantity.toLocaleString()}</span>
        </div>
      ))}
      <div className="grid grid-cols-3 gap-2 px-3 py-2.5 bg-muted/40 my-1 rounded-md">
        <span className="text-xs font-semibold">현재가</span>
        <span className="text-right font-bold text-lg col-span-2 text-red-500">{orderBook.currentPrice.toLocaleString()}원</span>
      </div>
      {orderBook.bids.map((bid, i) => (
        <div key={`bid-${i}`} className="grid grid-cols-3 gap-2 px-3 py-1 relative">
          <div className="absolute right-0 top-0 bottom-0 bg-red-500/8" style={{ width: `${(bid.quantity / maxQty) * 100}%` }} />
          <span className="text-xs text-muted-foreground z-10">매수{i + 1}</span>
          <span className="text-right text-red-500 z-10 font-medium">{bid.price.toLocaleString()}</span>
          <span className="text-right z-10 text-muted-foreground">{bid.quantity.toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
}

export default function LandingPage() {
  const [chartData] = useState(generateChartData);
  const [orderBook, setOrderBook] = useState(generateOrderBook);

  useEffect(() => {
    const interval = setInterval(() => {
      setOrderBook(generateOrderBook());
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const currentPrice = 83700;
  const priceChange = 1200;
  const priceChangePercent = 1.45;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-background/95 backdrop-blur sticky top-0 z-[999]">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between gap-4 flex-wrap">
          <Link href="/">
            <div className="flex items-center gap-3 cursor-pointer">
              <SamsungLogo className="h-5 w-auto text-foreground" />
              <div className="h-5 w-px bg-border" />
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
            <span className="text-4xl md:text-6xl font-bold text-white tracking-tight">
              {currentPrice.toLocaleString()}
            </span>
            <span className="text-white/40 text-xl font-light">KRW</span>
            <div className="flex items-center gap-1.5 bg-red-500/20 backdrop-blur px-3 py-1.5 rounded-md border border-red-400/20">
              <ArrowUpRight className="w-4 h-4 text-red-400" />
              <span className="text-red-400 font-semibold text-base">
                +{priceChange.toLocaleString()} (+{priceChangePercent}%)
              </span>
            </div>
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
                <span className="text-2xl font-bold tracking-tight" data-testid="text-current-price">
                  {currentPrice.toLocaleString()}원
                </span>
                <Badge variant="default" className="bg-red-500 border-red-500">
                  <TrendingUp className="w-3 h-3 mr-1" />+{priceChangePercent}%
                </Badge>
              </div>
            </div>
            <div className="p-5">
              <div className="h-[300px] md:h-[400px]">
                <MiniChart data={chartData} />
              </div>
              <div className="flex items-center justify-between mt-4 text-xs text-muted-foreground px-1">
                <span>1년 차트</span>
                <div className="flex gap-4">
                  <span>시가 <b className="text-foreground">82,500</b></span>
                  <span>고가 <b className="text-red-500">84,200</b></span>
                  <span>저가 <b className="text-blue-500">82,100</b></span>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-0 overflow-hidden" data-testid="card-order-book">
            <div className="p-5 border-b">
              <h3 className="font-bold">호가창</h3>
              <p className="text-xs text-muted-foreground">실시간 매수/매도 호가</p>
            </div>
            <div className="p-3">
              <OrderBook orderBook={orderBook} />
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
                  <p className="text-xs text-muted-foreground mb-2">52주 최고가</p>
                  <p className="text-2xl font-bold text-red-500">83,600원</p>
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
