import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { registerSchema, loginSchema, insertStockTransactionSchema, updateUserSchema, insertTransferRequestSchema } from "@shared/schema";
import { z } from "zod";
import bcrypt from "bcrypt";
import { WebSocketServer, WebSocket } from "ws";
import { log } from "./index";

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
      secret: process.env.SESSION_SECRET || "securities-plus-secret-key",
      resave: false,
      saveUninitialized: false,
      cookie: {
        maxAge: 30 * 24 * 60 * 60 * 1000,
        httpOnly: true,
        secure: false,
      },
    })
  );

  // WebSocket server for real-time chat and transaction notifications
  const wssSessionStore = new PgSession({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: true,
  });

  const wss = new WebSocketServer({ noServer: true });

  interface AuthenticatedWebSocket extends WebSocket {
    userId?: string;
    isAdmin?: boolean;
    roomId?: string;
  }

  function broadcastTransactionUpdate(targetUserId: string) {
    const outgoing = JSON.stringify({ type: "transaction_update", userId: targetUserId });
    wss.clients.forEach((client) => {
      const authClient = client as AuthenticatedWebSocket;
      if (client.readyState === WebSocket.OPEN) {
        if (authClient.userId === targetUserId || authClient.isAdmin) {
          client.send(outgoing);
        }
      }
    });
  }

  function broadcastTransferUpdate(targetUserId: string, data?: any) {
    const outgoing = JSON.stringify({ type: "transfer_update", userId: targetUserId, data });
    wss.clients.forEach((client) => {
      const authClient = client as AuthenticatedWebSocket;
      if (client.readyState === WebSocket.OPEN) {
        if (authClient.userId === targetUserId || authClient.isAdmin) {
          client.send(outgoing);
        }
      }
    });
  }

  let newsCache: { data: any; timestamp: number } | null = null;
  const NEWS_CACHE_DURATION = 5 * 60 * 1000;

  app.get("/api/stocks/news", async (_req, res) => {
    try {
      if (newsCache && Date.now() - newsCache.timestamp < NEWS_CACHE_DURATION) {
        return res.json(newsCache.data);
      }

      const rssUrl = "https://news.google.com/rss/search?q=%EB%B9%84%EC%83%81%EC%9E%A5+%EC%A3%BC%EC%8B%9D&hl=ko&gl=KR&ceid=KR:ko";
      const response = await fetch(rssUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          "Accept-Language": "ko-KR,ko;q=0.9",
        },
      });
      const xml = await response.text();

      const news: { title: string; publisher: string; link: string; publishedAt: string; color: string }[] = [];
      const brandColors = ["#E8344E", "#333", "#5F0080", "#1976D2", "#43A047", "#E65100", "#FF6D00", "#00838F"];

      const itemPattern = /<item>([\s\S]*?)<\/item>/g;
      let itemMatch;
      while ((itemMatch = itemPattern.exec(xml)) !== null && news.length < 10) {
        const item = itemMatch[1];
        const titleMatch = item.match(/<title><!\[CDATA\[(.*?)\]\]>|<title>(.*?)<\/title>/);
        const linkMatch = item.match(/<link>(.*?)<\/link>/);
        const pubDateMatch = item.match(/<pubDate>(.*?)<\/pubDate>/);
        const sourceMatch = item.match(/<source[^>]*>(.*?)<\/source>/);

        const title = (titleMatch?.[1] || titleMatch?.[2] || "").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/<[^>]*>/g, "");
        const link = linkMatch?.[1] || "";
        const publisher = sourceMatch?.[1] || "뉴스";
        const pubDate = pubDateMatch?.[1] || null;

        if (title && link) {
          let dateStr = "방금 전";
          if (pubDate) {
            const d = new Date(pubDate);
            dateStr = `${d.getFullYear()}.${String(d.getMonth()+1).padStart(2,'0')}.${String(d.getDate()).padStart(2,'0')}`;
          }
          news.push({ title, publisher, link, publishedAt: dateStr, color: brandColors[news.length % brandColors.length] });
        }
      }

      if (news.length === 0) {
        const fallback = [
          { title: "[단독] 토스, 해외 코인 거래소 인수 검토...美 기관 플랫폼과 접촉", publisher: "한국경제", link: "#", publishedAt: "2026.02.13", color: "#E8344E" },
          { title: "'IPO 삼수생' 케이뱅크, 공모가 8300원 확정...내달 5일 상장 예정", publisher: "파이낸셜뉴스", link: "#", publishedAt: "2026.02.13", color: "#333" },
          { title: "놀유니버스, 부산관광공사·SM C&C와 '부산원아시아페스티벌' MOU 체결", publisher: "한국경제", link: "#", publishedAt: "2026.02.13", color: "#43A047" },
          { title: "빗썸 사업자 면허 갱신, 무기한 연기될 듯", publisher: "한국경제", link: "#", publishedAt: "2026.02.13", color: "#E65100" },
          { title: "네이버-두나무 결합, '대주주 지분 제한'에 막히나", publisher: "뉴시스", link: "#", publishedAt: "2026.02.13", color: "#5F0080" },
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
      if (user.isAdmin) {
        return res.status(403).json({ message: "관리자는 관리자 전용 로그인을 이용해주세요" });
      }
      if (user.isFrozen) {
        return res.status(403).json({ message: "계정이 동결되었습니다. 관리자에게 문의하세요." });
      }
      req.session.userId = user.id;
      return res.json({ user: { ...user, password: undefined } });
    } catch (error) {
      return res.status(400).json({ message: "잘못된 요청입니다" });
    }
  });

  app.post("/api/auth/admin-login", async (req, res) => {
    try {
      const data = loginSchema.parse(req.body);
      const user = await storage.getUserByUsername(data.username);
      const passwordMatch = user ? await bcrypt.compare(data.password, user.password) : false;
      if (!user || !passwordMatch) {
        return res.status(401).json({ message: "아이디 또는 비밀번호가 일치하지 않습니다" });
      }
      if (!user.isAdmin) {
        return res.status(403).json({ message: "관리자 권한이 없는 계정입니다" });
      }
      if (user.isFrozen) {
        return res.status(403).json({ message: "계정이 동결되었습니다. 관리자에게 문의하세요." });
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
      broadcastTransactionUpdate(data.userId);
      return res.json(transaction);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      return res.status(500).json({ message: "서버 오류가 발생했습니다" });
    }
  });

  app.get("/api/admin/users/:id", requireAdmin, async (req, res) => {
    const user = await storage.getUser(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "사용자를 찾을 수 없습니다" });
    }
    return res.json({ ...user, password: undefined });
  });

  app.put("/api/admin/users/:id", requireAdmin, async (req, res) => {
    try {
      const data = updateUserSchema.parse(req.body);
      const updateData: any = { ...data };
      if (data.password) {
        updateData.password = await bcrypt.hash(data.password, 10);
      } else {
        delete updateData.password;
      }
      const user = await storage.updateUser(req.params.id, updateData);
      if (!user) {
        return res.status(404).json({ message: "사용자를 찾을 수 없습니다" });
      }
      return res.json({ ...user, password: undefined });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      return res.status(500).json({ message: "회원 정보 수정에 실패했습니다" });
    }
  });

  app.patch("/api/admin/users/:id/freeze", requireAdmin, async (req, res) => {
    try {
      const { isFrozen } = req.body;
      const user = await storage.updateUser(req.params.id, { isFrozen: !!isFrozen });
      if (!user) {
        return res.status(404).json({ message: "사용자를 찾을 수 없습니다" });
      }
      return res.json({ ...user, password: undefined });
    } catch (error) {
      return res.status(500).json({ message: "회원 상태 변경에 실패했습니다" });
    }
  });

  app.delete("/api/admin/users/:id", requireAdmin, async (req, res) => {
    try {
      await storage.deleteUser(req.params.id);
      return res.json({ message: "회원 삭제 완료" });
    } catch (error) {
      return res.status(500).json({ message: "회원 삭제에 실패했습니다" });
    }
  });

  app.put("/api/admin/transactions/:id", requireAdmin, async (req, res) => {
    try {
      const { quantity, pricePerShare, memo, category } = req.body;
      const updateData: any = {};
      if (quantity !== undefined) updateData.quantity = parseInt(quantity);
      if (pricePerShare !== undefined) updateData.pricePerShare = parseInt(pricePerShare);
      if (memo !== undefined) updateData.memo = memo;
      if (category !== undefined) updateData.category = category;
      const tx = await storage.updateTransaction(req.params.id, updateData);
      if (!tx) {
        return res.status(404).json({ message: "거래를 찾을 수 없습니다" });
      }
      broadcastTransactionUpdate(tx.userId);
      return res.json(tx);
    } catch (error) {
      return res.status(500).json({ message: "거래 수정에 실패했습니다" });
    }
  });

  app.delete("/api/admin/transactions/:id", requireAdmin, async (req, res) => {
    try {
      const tx = await storage.getTransaction(req.params.id);
      await storage.deleteTransaction(req.params.id);
      if (tx) broadcastTransactionUpdate(tx.userId);
      return res.json({ message: "삭제 완료" });
    } catch (error) {
      return res.status(500).json({ message: "삭제 실패" });
    }
  });

  app.post("/api/transfer-requests", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "로그인이 필요합니다" });
    }
    try {
      const data = insertTransferRequestSchema.parse(req.body);
      const user = await storage.getUser(req.session.userId);
      if (!user) {
        return res.status(404).json({ message: "사용자를 찾을 수 없습니다" });
      }
      const transactions = await storage.getTransactionsByUserId(req.session.userId);
      const totalIn = transactions.filter(t => t.type === "in").reduce((sum, t) => sum + t.quantity, 0);
      const totalOut = transactions.filter(t => t.type === "out").reduce((sum, t) => sum + t.quantity, 0);
      const currentHolding = totalIn - totalOut;
      if (data.quantity > currentHolding) {
        return res.status(400).json({ message: `보유 수량(${currentHolding}주)을 초과할 수 없습니다` });
      }
      const transferRequest = await storage.createTransferRequest({ ...data, userId: req.session.userId });
      const currentPrice = 0;
      await storage.createTransaction({
        userId: req.session.userId,
        type: "out",
        category: "타사대체출고",
        stockName: data.stockName || "비상장주식",
        quantity: data.quantity,
        pricePerShare: currentPrice,
        memo: `타사대체출고 신청 - ${data.accountName} (${data.accountNumber})`,
      });
      broadcastTransactionUpdate(req.session.userId);
      broadcastTransferUpdate(req.session.userId, { action: "new_request", request: transferRequest, userName: user.fullName });
      return res.json(transferRequest);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      return res.status(500).json({ message: "출고 신청에 실패했습니다" });
    }
  });

  app.get("/api/transfer-requests/my", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "로그인이 필요합니다" });
    }
    const requests = await storage.getTransferRequestsByUserId(req.session.userId);
    return res.json(requests);
  });

  app.get("/api/admin/transfer-requests", requireAdmin, async (_req, res) => {
    const requests = await storage.getAllTransferRequests();
    return res.json(requests);
  });

  app.patch("/api/admin/transfer-requests/:id", requireAdmin, async (req, res) => {
    try {
      const { status, adminMemo } = req.body;
      if (!["pending", "approved", "rejected", "held"].includes(status)) {
        return res.status(400).json({ message: "유효하지 않은 상태입니다" });
      }
      const updated = await storage.updateTransferRequestStatus(req.params.id, status, adminMemo);
      if (!updated) {
        return res.status(404).json({ message: "신청을 찾을 수 없습니다" });
      }
      const statusLabels: Record<string, string> = { approved: "승인", rejected: "반려", held: "보류", pending: "대기" };
      broadcastTransferUpdate(updated.userId, { action: "status_change", request: updated, statusLabel: statusLabels[status] || status });
      return res.json(updated);
    } catch (error) {
      return res.status(500).json({ message: "상태 변경에 실패했습니다" });
    }
  });

  // Chat API routes
  app.post("/api/chat/rooms", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "로그인이 필요합니다" });
    }
    const room = await storage.getOrCreateChatRoom(req.session.userId);
    return res.json(room);
  });

  app.get("/api/chat/rooms/my", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "로그인이 필요합니다" });
    }
    const rooms = await storage.getChatRoomsByUserId(req.session.userId);
    return res.json(rooms);
  });

  app.get("/api/chat/rooms", requireAdmin, async (_req, res) => {
    const rooms = await storage.getAllChatRooms();
    const allUsers = await storage.getAllUsers();
    const roomsWithUser = await Promise.all(rooms.map(async (room) => {
      const user = allUsers.find(u => u.id === room.userId);
      const unreadCount = await storage.getUnreadCountByRoom(room.id);
      return {
        ...room,
        userName: user?.fullName || "알 수 없음",
        userUsername: user?.username || "unknown",
        unreadCount,
      };
    }));
    return res.json(roomsWithUser);
  });

  app.get("/api/chat/unread-count", requireAdmin, async (_req, res) => {
    const count = await storage.getTotalUnreadCountForAdmin();
    return res.json({ count });
  });

  app.post("/api/chat/rooms/:id/mark-read", requireAdmin, async (req, res) => {
    await storage.markMessagesAsReadByAdmin(req.params.id);
    return res.json({ success: true });
  });

  app.get("/api/chat/rooms/:id/messages", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "로그인이 필요합니다" });
    }
    const user = await storage.getUser(req.session.userId);
    if (!user) return res.status(404).json({ message: "사용자를 찾을 수 없습니다" });

    const rooms = user.isAdmin
      ? await storage.getAllChatRooms()
      : await storage.getChatRoomsByUserId(req.session.userId);

    const room = rooms.find(r => r.id === req.params.id);
    if (!room) return res.status(403).json({ message: "접근 권한이 없습니다" });

    const messages = await storage.getChatMessages(req.params.id);
    return res.json(messages);
  });

  // WebSocket upgrade handler
  httpServer.on("upgrade", (request, socket, head) => {
    if (request.url !== "/ws/chat" && request.url !== "/ws") {
      return;
    }

    const cookieHeader = request.headers.cookie || "";
    const sidMatch = cookieHeader.match(/connect\.sid=s%3A([^.]+)/);
    if (!sidMatch) {
      socket.destroy();
      return;
    }

    const sessionId = sidMatch[1];
    wssSessionStore.get(sessionId, (err: any, sessionData: any) => {
      if (err || !sessionData || !sessionData.userId) {
        socket.destroy();
        return;
      }

      wss.handleUpgrade(request, socket, head, (ws) => {
        (ws as AuthenticatedWebSocket).userId = sessionData.userId;
        wss.emit("connection", ws, request, sessionData);
      });
    });
  });

  wss.on("connection", async (ws: AuthenticatedWebSocket, _request: any, sessionData: any) => {
    const userId = sessionData.userId;
    const user = await storage.getUser(userId);
    if (!user) {
      ws.close();
      return;
    }

    ws.userId = userId;
    ws.isAdmin = user.isAdmin;

    log(`WebSocket connected: ${user.username} (${user.isAdmin ? "admin" : "member"})`);

    ws.on("message", async (rawData) => {
      try {
        const data = JSON.parse(rawData.toString());

        if (data.type === "join") {
          ws.roomId = data.roomId;
          return;
        }

        if (data.type === "message" && data.roomId && data.message) {
          const roomId = data.roomId;
          const senderRole = ws.isAdmin ? "admin" : "user";

          const msg = await storage.createChatMessage({
            roomId,
            senderId: userId,
            senderRole,
            message: data.message,
          });
          await storage.updateChatRoomLastMessage(roomId);

          const outgoing = JSON.stringify({
            type: "message",
            data: msg,
          });

          wss.clients.forEach((client) => {
            const authClient = client as AuthenticatedWebSocket;
            if (client.readyState === WebSocket.OPEN) {
              if (authClient.isAdmin || authClient.roomId === roomId) {
                client.send(outgoing);
              }
            }
          });

          if (senderRole === "user") {
            const notification = JSON.stringify({
              type: "notification",
              data: {
                roomId,
                userName: user.fullName,
                userUsername: user.username,
                message: data.message,
              },
            });
            wss.clients.forEach((client) => {
              const authClient = client as AuthenticatedWebSocket;
              if (client.readyState === WebSocket.OPEN && authClient.isAdmin) {
                client.send(notification);
              }
            });
          }
        }
      } catch (e) {
        log(`WebSocket message error: ${e}`);
      }
    });

    ws.on("close", () => {
      log(`WebSocket disconnected: ${user.username}`);
    });
  });

  return httpServer;
}
