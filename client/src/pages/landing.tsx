import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, ArrowUpRight, ArrowDownRight, BarChart3, Users, Shield } from "lucide-react";
import samsungBuildingImg from "@assets/telegram-cloud-photo-size-4-5789658066277043972-y_1770731405987.jpg";
import samsungInfoImg from "@assets/telegram-cloud-photo-size-4-5789658066277043973-y_1770731402444.jpg";

function generateOrderBook() {
  const basePrice = 83700;
  const asks: { price: number; quantity: number }[] = [];
  const bids: { price: number; quantity: number }[] = [];

  for (let i = 5; i >= 1; i--) {
    asks.push({
      price: basePrice + i * 100,
      quantity: Math.floor(Math.random() * 50000) + 5000,
    });
  }
  for (let i = 0; i < 5; i++) {
    bids.push({
      price: basePrice - i * 100,
      quantity: Math.floor(Math.random() * 50000) + 5000,
    });
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
    data.push({
      date: `${d.getMonth() + 1}/${d.getDate()}`,
      price: Math.round(price),
    });
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
    gradient.addColorStop(0, "rgba(59, 130, 246, 0.15)");
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
    ctx.strokeStyle = "#3b82f6";
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
          <div
            className="absolute right-0 top-0 bottom-0 bg-blue-500/10"
            style={{ width: `${(ask.quantity / maxQty) * 100}%` }}
          />
          <span className="text-xs text-muted-foreground z-10">매도{5 - i}</span>
          <span className="text-right text-blue-500 z-10 font-medium">
            {ask.price.toLocaleString()}
          </span>
          <span className="text-right z-10 text-muted-foreground">
            {ask.quantity.toLocaleString()}
          </span>
        </div>
      ))}

      <div className="grid grid-cols-3 gap-2 px-3 py-2 bg-muted/50 my-1">
        <span className="text-xs font-medium">현재가</span>
        <span className="text-right font-bold text-lg col-span-2 text-red-500">
          {orderBook.currentPrice.toLocaleString()}원
        </span>
      </div>

      {orderBook.bids.map((bid, i) => (
        <div key={`bid-${i}`} className="grid grid-cols-3 gap-2 px-3 py-1 relative">
          <div
            className="absolute right-0 top-0 bottom-0 bg-red-500/10"
            style={{ width: `${(bid.quantity / maxQty) * 100}%` }}
          />
          <span className="text-xs text-muted-foreground z-10">매수{i + 1}</span>
          <span className="text-right text-red-500 z-10 font-medium">
            {bid.price.toLocaleString()}
          </span>
          <span className="text-right z-10 text-muted-foreground">
            {bid.quantity.toLocaleString()}
          </span>
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
      <header className="border-b bg-background/95 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg tracking-tight">삼성전자 주식관리</span>
          </div>
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

      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={samsungBuildingImg}
            alt="Samsung"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/60 to-black/80" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 py-16 md:py-24">
          <div className="text-center mb-10">
            <Badge variant="outline" className="mb-4 text-white/80 border-white/30 bg-white/10 backdrop-blur">
              SAMSUNG 삼성전자
            </Badge>
            <h1 className="text-3xl md:text-5xl font-bold text-white mb-3 tracking-tight">
              삼성전자 보통주
            </h1>
            <p className="text-white/70 text-sm md:text-base max-w-lg mx-auto">
              실시간 주식 현황 확인 및 입출고 관리 시스템
            </p>
          </div>

          <div className="flex items-center justify-center gap-3 mb-8 flex-wrap">
            <span className="text-4xl md:text-5xl font-bold text-white">
              {currentPrice.toLocaleString()}
            </span>
            <span className="text-white/60 text-lg">KRW</span>
            <div className="flex items-center gap-1">
              <ArrowUpRight className="w-5 h-5 text-red-400" />
              <span className="text-red-400 font-semibold text-lg">
                +{priceChange.toLocaleString()} (+{priceChangePercent}%)
              </span>
            </div>
          </div>

          <div className="flex justify-center gap-3 flex-wrap">
            <Link href="/register">
              <Button size="lg" className="bg-white text-black border-white/80">
                신청하기
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" size="lg" className="text-white border-white/40 bg-white/10 backdrop-blur">
                로그인
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 p-0 overflow-hidden">
            <div className="p-4 border-b flex items-center justify-between gap-4 flex-wrap">
              <div>
                <h2 className="font-bold text-lg" data-testid="text-stock-name">삼성전자 보통주</h2>
                <p className="text-sm text-muted-foreground">005930 | KRX</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold" data-testid="text-current-price">
                  {currentPrice.toLocaleString()}원
                </span>
                <Badge variant="default" className="bg-red-500 border-red-500">
                  <TrendingUp className="w-3 h-3 mr-1" />+{priceChangePercent}%
                </Badge>
              </div>
            </div>
            <div className="p-4">
              <div className="h-[300px] md:h-[400px]">
                <MiniChart data={chartData} />
              </div>
              <div className="flex items-center justify-between mt-4 text-xs text-muted-foreground">
                <span>1년 차트</span>
                <div className="flex gap-3">
                  <span>시가: 82,500</span>
                  <span>고가: 84,200</span>
                  <span>저가: 82,100</span>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-0 overflow-hidden" data-testid="card-order-book">
            <div className="p-4 border-b">
              <h3 className="font-bold">호가창</h3>
              <p className="text-xs text-muted-foreground">실시간 매수/매도 호가</p>
            </div>
            <div className="p-2">
              <OrderBook orderBook={orderBook} />
            </div>
          </Card>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-6">
            <div className="flex flex-col gap-4">
              <h3 className="font-bold text-xl">공급물량 단가</h3>
              <p className="text-sm text-muted-foreground">선착순 물량 소진 시 마감됩니다</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-primary/10 rounded-md p-4 text-center">
                  <p className="text-xs text-muted-foreground mb-1">공급물량 단가</p>
                  <p className="text-2xl font-bold text-primary">50,000원</p>
                  <p className="text-xs text-muted-foreground">1주당</p>
                </div>
                <div className="bg-red-500/10 rounded-md p-4 text-center">
                  <p className="text-xs text-muted-foreground mb-1">52주 최고가</p>
                  <p className="text-2xl font-bold text-red-500">83,600원</p>
                  <p className="text-xs text-muted-foreground">1주당</p>
                </div>
              </div>
              <Link href="/register">
                <Button className="w-full" data-testid="button-apply">
                  지금 신청하기
                </Button>
              </Link>
            </div>
          </Card>

          <Card className="p-0 overflow-hidden">
            <img
              src={samsungInfoImg}
              alt="Samsung Info"
              className="w-full h-full object-cover object-top"
              style={{ maxHeight: "320px" }}
            />
          </Card>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6 text-center">
            <div className="w-12 h-12 rounded-md bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <BarChart3 className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-bold mb-2">실시간 현황</h3>
            <p className="text-sm text-muted-foreground">
              주식 입출고 현황을 실시간으로 확인하세요
            </p>
          </Card>
          <Card className="p-6 text-center">
            <div className="w-12 h-12 rounded-md bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Users className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-bold mb-2">회원 관리</h3>
            <p className="text-sm text-muted-foreground">
              개인 계좌와 주식 현황을 한눈에 관리합니다
            </p>
          </Card>
          <Card className="p-6 text-center">
            <div className="w-12 h-12 rounded-md bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Shield className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-bold mb-2">안전한 거래</h3>
            <p className="text-sm text-muted-foreground">
              안전하고 투명한 주식 거래 시스템을 제공합니다
            </p>
          </Card>
        </div>
      </section>

      <footer className="border-t mt-10">
        <div className="max-w-7xl mx-auto px-4 py-8 text-center text-sm text-muted-foreground">
          <p>삼성전자 주식관리 시스템</p>
          <p className="mt-1">본 서비스는 주식 입출고 관리를 위한 내부 시스템입니다.</p>
        </div>
      </footer>
    </div>
  );
}
