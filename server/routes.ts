import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { registerSchema, loginSchema, insertStockTransactionSchema } from "@shared/schema";
import { z } from "zod";
import bcrypt from "bcrypt";

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
