import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";
import compression from "compression";

const app = express();
const httpServer = createServer(app);

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

app.use(compression());

app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false }));

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        const jsonStr = JSON.stringify(capturedJsonResponse);
        logLine += ` :: ${jsonStr.length > 200 ? jsonStr.slice(0, 200) + "..." : jsonStr}`;
      }
      log(logLine);
    }
  });

  next();
});

(async () => {
  const { seedDatabase, repairApprovedTransfers, repairWrongPurchasePrices } = await import("./seed");
  await registerRoutes(httpServer, app);

  // 새 환경에서 첫 부팅 시 GitHub db-seed.sql 자동 복원
  if (process.env.GITHUB_PERSONAL_TOKEN && !process.env.DB_SEEDED) {
    try {
      const pg = await import("pg");
      const pool = new pg.default.Pool({ connectionString: process.env.DATABASE_URL });
      const check = await pool.query("SELECT COUNT(*) as cnt FROM users");
      await pool.end();
      if (parseInt(check.rows[0].cnt) === 0) {
        log("첫 부팅 감지 — GitHub에서 DB 복원 시도...");
        const { restoreFromGitHub } = await import("./db-export");
        const ok = await restoreFromGitHub();
        if (ok) log("DB 복원 완료 ✓");
        else log("DB 복원 건너뜀 (db-seed.sql 없음)");
      }
    } catch (e) {
      log("DB 복원 확인 중 오류: " + String(e));
    }
  }

  await seedDatabase();
  await repairApprovedTransfers();
  await repairWrongPurchasePrices();

  app.use((err: any, _req: Request, res: Response, next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    console.error("Internal Server Error:", err);

    if (res.headersSent) {
      return next(err);
    }

    return res.status(status).json({ message });
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || "5000", 10);
  httpServer.listen(
    {
      port,
      host: "0.0.0.0",
      reusePort: true,
    },
    () => {
      log(`serving on port ${port}`);
    },
  );
})();
