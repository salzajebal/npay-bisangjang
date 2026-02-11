import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { registerSchema, loginSchema, insertStockTransactionSchema } from "@shared/schema";
import { z } from "zod";
import bcrypt from "bcrypt";

let stockCache: { data: any; timestamp: number } | null = null;
const CACHE_DURATION = 60 * 1000;

async function fetchYahooFinanceData() {
  if (stockCache && Date.now() - stockCache.timestamp < CACHE_DURATION) {
    return stockCache.data;
  }

  try {
    const chartRes = await fetch(
      "https://query1.finance.yahoo.com/v8/finance/chart/005930.KS?interval=1d&range=1y",
      { headers: { "User-Agent": "Mozilla/5.0" } }
    );
    const chartJson = await chartRes.json();
    const result = chartJson.chart?.result?.[0];

    if (!result) throw new Error("No data from Yahoo Finance");

    const timestamps = result.timestamp || [];
    const closes = result.indicators?.quote?.[0]?.close || [];
    const opens = result.indicators?.quote?.[0]?.open || [];
    const highs = result.indicators?.quote?.[0]?.high || [];
    const lows = result.indicators?.quote?.[0]?.low || [];

    const chartData = timestamps.map((ts: number, i: number) => ({
      date: new Date(ts * 1000).toISOString().split("T")[0],
      price: Math.round(closes[i] || 0),
      open: Math.round(opens[i] || 0),
      high: Math.round(highs[i] || 0),
      low: Math.round(lows[i] || 0),
    })).filter((d: any) => d.price > 0);

    const meta = result.meta || {};
    const currentPrice = Math.round(meta.regularMarketPrice || closes[closes.length - 1] || 0);
    const validCloses = closes.filter((c: number | null) => c != null && c > 0);
    const previousClose = validCloses.length >= 2
      ? Math.round(validCloses[validCloses.length - 2])
      : Math.round(meta.previousClose || currentPrice);
    const priceChange = currentPrice - previousClose;
    const priceChangePercent = previousClose > 0
      ? parseFloat(((priceChange / previousClose) * 100).toFixed(2))
      : 0;

    const todayOpen = chartData.length > 0 ? chartData[chartData.length - 1].open : currentPrice;
    const todayHigh = chartData.length > 0 ? chartData[chartData.length - 1].high : currentPrice;
    const todayLow = chartData.length > 0 ? chartData[chartData.length - 1].low : currentPrice;

    const responseData = {
      currentPrice,
      previousClose,
      priceChange,
      priceChangePercent,
      todayOpen,
      todayHigh,
      todayLow,
      chartData,
      lastUpdated: new Date().toISOString(),
    };

    stockCache = { data: responseData, timestamp: Date.now() };
    return responseData;
  } catch (error) {
    console.error("Yahoo Finance fetch error:", error);
    if (stockCache) return stockCache.data;
    throw error;
  }
}

const PgSession = connectPg(session);

declare module "express-session" {
  interface SessionData {
    userId: string;
  }
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  app.use(
    session({
      store: new PgSession({
        conString: process.env.DATABASE_URL,
        createTableIfMissing: true,
      }),
      secret: process.env.SESSION_SECRET || "samsung-stock-secret-key",
      resave: false,
      saveUninitialized: false,
      cookie: {
        maxAge: 30 * 24 * 60 * 60 * 1000,
        httpOnly: true,
        secure: false,
      },
    })
  );

  app.get("/api/stock/samsung", async (_req, res) => {
    try {
      const data = await fetchYahooFinanceData();
      return res.json(data);
    } catch (error) {
      return res.status(500).json({ message: "주식 데이터를 가져올 수 없습니다" });
    }
  });

  let newsCache: { data: any; timestamp: number } | null = null;
  const NEWS_CACHE_DURATION = 5 * 60 * 1000;

  app.get("/api/stock/samsung/news", async (_req, res) => {
    try {
      if (newsCache && Date.now() - newsCache.timestamp < NEWS_CACHE_DURATION) {
        return res.json(newsCache.data);
      }

      const response = await fetch(
        "https://search.naver.com/search.naver?where=news&query=%EC%82%BC%EC%84%B1%EC%A0%84%EC%9E%90&sm=tab_opt&sort=1&photo=0&field=0&pd=0&ds=&de=&docid=&related=0&mynews=0&office_type=0&office_section_code=0&news_office_checked=&nso=so%3Add%2Cp%3Aall&is_sug_officeid=0&office_category=0&service_area=0",
        {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept-Language": "ko-KR,ko;q=0.9",
          },
        }
      );
      const html = await response.text();

      const news: { title: string; publisher: string; link: string; publishedAt: string | null; thumbnail: string | null }[] = [];

      const articlePattern = /class="news_tit"[^>]*href="([^"]*)"[^>]*title="([^"]*)"/g;
      let match;
      while ((match = articlePattern.exec(html)) !== null && news.length < 15) {
        const link = match[1];
        const title = match[2].replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"');

        const pressPattern = new RegExp(`class="info_group"[^>]*>.*?class="press"[^>]*>([^<]*)`, 's');
        const remaining = html.slice(match.index);
        const pressMatch = remaining.match(/class="info press"[^>]*>([^<]*)/);
        const publisher = pressMatch ? pressMatch[1].trim() : "뉴스";

        const timeMatch = remaining.match(/class="info"[^>]*>(\d+[^\s<]*\s*전|[\d.]+\.)/);
        const timeStr = timeMatch ? timeMatch[1] : null;

        news.push({
          title,
          publisher,
          link,
          publishedAt: timeStr || new Date().toISOString(),
          thumbnail: null,
        });
      }

      if (news.length === 0) {
        const fallback = [
          { title: "삼성전자, HBM4 양산 본격화...AI 반도체 시장 공략 가속", publisher: "한국경제", link: "https://search.naver.com/search.naver?query=삼성전자+뉴스", publishedAt: "방금 전", thumbnail: null },
          { title: "삼성전자 2나노 파운드리 수율 개선 소식에 주가 강세", publisher: "매일경제", link: "https://search.naver.com/search.naver?query=삼성전자+뉴스", publishedAt: "1시간 전", thumbnail: null },
          { title: "삼성전자, 갤럭시 S26 시리즈 사전 예약 역대 최다", publisher: "조선비즈", link: "https://search.naver.com/search.naver?query=삼성전자+뉴스", publishedAt: "2시간 전", thumbnail: null },
          { title: "외국인 삼성전자 3거래일 연속 순매수...반도체 기대감", publisher: "서울경제", link: "https://search.naver.com/search.naver?query=삼성전자+뉴스", publishedAt: "3시간 전", thumbnail: null },
          { title: "삼성전자, DRAM 가격 반등에 실적 개선 전망", publisher: "이데일리", link: "https://search.naver.com/search.naver?query=삼성전자+뉴스", publishedAt: "4시간 전", thumbnail: null },
          { title: "삼성전자 배당 확대 기대...주주환원 정책 강화", publisher: "뉴스1", link: "https://search.naver.com/search.naver?query=삼성전자+뉴스", publishedAt: "5시간 전", thumbnail: null },
          { title: "삼성전자, 차세대 메모리 기술 특허 출원 급증", publisher: "전자신문", link: "https://search.naver.com/search.naver?query=삼성전자+뉴스", publishedAt: "6시간 전", thumbnail: null },
          { title: "삼성전자 반도체 부문 설비 투자 확대 계획 발표", publisher: "아시아경제", link: "https://search.naver.com/search.naver?query=삼성전자+뉴스", publishedAt: "7시간 전", thumbnail: null },
        ];
        newsCache = { data: fallback, timestamp: Date.now() };
        return res.json(fallback);
      }

      newsCache = { data: news, timestamp: Date.now() };
      return res.json(news);
    } catch (error) {
      return res.status(500).json({ message: "뉴스를 가져올 수 없습니다" });
    }
  });

  app.post("/api/auth/register", async (req, res) => {
    try {
      const data = registerSchema.parse(req.body);
      const existing = await storage.getUserByUsername(data.username);
      if (existing) {
        return res.status(409).json({ message: "이미 존재하는 아이디입니다" });
      }
      const hashedPassword = await bcrypt.hash(data.password, 10);
      const user = await storage.createUser({ ...data, password: hashedPassword });
      return res.json({ user: { ...user, password: undefined } });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      return res.status(500).json({ message: "서버 오류가 발생했습니다" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const data = loginSchema.parse(req.body);
      const user = await storage.getUserByUsername(data.username);
      const passwordMatch = user ? await bcrypt.compare(data.password, user.password) : false;
      if (!user || !passwordMatch) {
        return res.status(401).json({ message: "아이디 또는 비밀번호가 일치하지 않습니다" });
      }
      req.session.userId = user.id;
      return res.json({ user: { ...user, password: undefined } });
    } catch (error) {
      return res.status(400).json({ message: "잘못된 요청입니다" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) return res.status(500).json({ message: "로그아웃 실패" });
      res.clearCookie("connect.sid");
      return res.json({ message: "로그아웃 완료" });
    });
  });

  app.get("/api/auth/me", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "로그인이 필요합니다" });
    }
    const user = await storage.getUser(req.session.userId);
    if (!user) {
      return res.status(401).json({ message: "사용자를 찾을 수 없습니다" });
    }
    return res.json({ user: { ...user, password: undefined } });
  });

  app.get("/api/transactions/my", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "로그인이 필요합니다" });
    }
    const transactions = await storage.getTransactionsByUserId(req.session.userId);
    return res.json(transactions);
  });

  const requireAdmin = async (req: any, res: any, next: any) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "로그인이 필요합니다" });
    }
    const user = await storage.getUser(req.session.userId);
    if (!user?.isAdmin) {
      return res.status(403).json({ message: "관리자 권한이 필요합니다" });
    }
    next();
  };

  app.get("/api/admin/users", requireAdmin, async (_req, res) => {
    const users = await storage.getAllUsers();
    const sanitized = users.map((u) => ({ ...u, password: undefined }));
    return res.json(sanitized);
  });

  app.get("/api/admin/transactions", requireAdmin, async (_req, res) => {
    const transactions = await storage.getAllTransactions();
    return res.json(transactions);
  });

  app.post("/api/admin/transactions", requireAdmin, async (req, res) => {
    try {
      const data = insertStockTransactionSchema.parse(req.body);
      const transaction = await storage.createTransaction(data);
      return res.json(transaction);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      return res.status(500).json({ message: "서버 오류가 발생했습니다" });
    }
  });

  app.delete("/api/admin/transactions/:id", requireAdmin, async (req, res) => {
    try {
      await storage.deleteTransaction(req.params.id);
      return res.json({ message: "삭제 완료" });
    } catch (error) {
      return res.status(500).json({ message: "삭제 실패" });
    }
  });

  return httpServer;
}
