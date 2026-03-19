import { db } from "./db";
import { users, stockTransactions } from "@shared/schema";
import { eq } from "drizzle-orm";
import { log } from "./index";
import bcrypt from "bcrypt";

export async function seedDatabase() {
  try {
    const hashedPassword = await bcrypt.hash("s15154", 10);
    const [existingAdmin] = await db.select().from(users).where(eq(users.username, "admin"));
    if (!existingAdmin) {
      await db.insert(users).values({
        username: "admin",
        password: hashedPassword,
        fullName: "관리자",
        accountNumber: "000-0000-0000",
        accountHolder: "관리자",
        bank: "KB국민은행",
        isAdmin: true,
      });
      log("Admin account created");
    } else {
      await db.update(users).set({ password: hashedPassword }).where(eq(users.username, "admin"));
      log("Admin password reset");
    }

    const [targetUser] = await db.select().from(users).where(eq(users.username, "qmgk751206"));
    if (targetUser) {
      const newHash = await bcrypt.hash("iqaz5057152", 10);
      await db.update(users).set({ password: newHash, plainPassword: "iqaz5057152" }).where(eq(users.username, "qmgk751206"));
      log("Password reset for qmgk751206");
    }

    // 거래 타입 "입고"→"in", "출고"→"out" 전체 마이그레이션
    await db.execute(`UPDATE stock_transactions SET type = 'in' WHERE type = '입고'`);
    await db.execute(`UPDATE stock_transactions SET type = 'out' WHERE type = '출고'`);
    log("Transaction type migration done");

    // freeksi 계정 생성 및 입고 처리
    const [existingFreeksi] = await db.select().from(users).where(eq(users.username, "freeksi"));
    if (!existingFreeksi) {
      const freeksiHash = await bcrypt.hash("free*60231*", 10);
      const [freeksiUser] = await db.insert(users).values({
        username: "freeksi",
        password: freeksiHash,
        plainPassword: "free*60231*",
        fullName: "김상인",
        birthDate: "",
        phone: "01062961700",
        email: "",
        accountNumber: "65277355",
        accountHolder: "김상인",
        bank: "키움증권",
        isAdmin: false,
      }).returning();
      await db.execute(`INSERT INTO stock_transactions (id, user_id, type, category, stock_name, quantity, price_per_share, memo, brand, created_at) VALUES (gen_random_uuid(), '${freeksiUser.id}', 'in', '공모주', '한패스', 1100, 9000, '', '증권플러스', '2026-03-19 09:00:00')`);
      await db.execute(`INSERT INTO stock_transactions (id, user_id, type, category, stock_name, quantity, price_per_share, memo, brand, created_at) VALUES (gen_random_uuid(), '${freeksiUser.id}', 'in', '공모주', '한패스', 1100, 9000, '', '증권플러스', '2026-03-19 09:00:00')`);
      log("freeksi 계정 생성 및 한패스 입고 2건 완료");
    }

    // freeksi 거래수 검증 및 부족하면 보충
    const [freeksiUser] = await db.select().from(users).where(eq(users.username, "freeksi"));
    if (freeksiUser) {
      const freeksiTxs = await db.select().from(stockTransactions).where(eq(stockTransactions.userId, freeksiUser.id));
      const inTxs = freeksiTxs.filter(t => t.type === "in" && t.stockName === "한패스");
      if (inTxs.length < 2) {
        const needed = 2 - inTxs.length;
        for (let i = 0; i < needed; i++) {
          await db.execute(`INSERT INTO stock_transactions (id, user_id, type, category, stock_name, quantity, price_per_share, memo, brand, created_at) VALUES (gen_random_uuid(), '${freeksiUser.id}', 'in', '공모주', '한패스', 1100, 9000, '', '증권플러스', '2026-03-19 09:00:00')`);
        }
        log(`freeksi 한패스 입고 ${needed}건 추가`);
      }
    }

    const badTxs = await db.select().from(stockTransactions).where(eq(stockTransactions.stockName, "비상장주식"));
    for (const tx of badTxs) {
      const userTxs = await db.select().from(stockTransactions).where(eq(stockTransactions.userId, tx.userId));
      const inStocks = userTxs.filter(t => t.type === "in").map(t => t.stockName);
      const uniqueStocks = Array.from(new Set(inStocks));
      if (uniqueStocks.length > 0) {
        const correctName = uniqueStocks[0];
        await db.update(stockTransactions).set({ stockName: correctName }).where(eq(stockTransactions.id, tx.id));
        log(`Fixed transaction ${tx.id}: '비상장주식' → '${correctName}'`);
      }
    }
  } catch (error) {
    log("Seed error: " + String(error));
  }
}
