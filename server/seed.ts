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

    // 고영천 계정 생성 및 코스모로보틱스 입고 처리
    const [existingGoyoungchun] = await db.select().from(users).where(eq(users.username, "goyoungchun"));
    if (!existingGoyoungchun) {
      const gyHash = await bcrypt.hash("gy200224!", 10);
      const [gyUser] = await db.insert(users).values({
        username: "goyoungchun",
        password: gyHash,
        plainPassword: "gy200224!",
        fullName: "고영천",
        birthDate: "2002-02-24",
        phone: "01000000000",
        email: "",
        accountNumber: "200224147658",
        accountHolder: "고영천",
        bank: "키움증권",
        isAdmin: false,
      }).returning();
      await db.execute(`INSERT INTO stock_transactions (id, user_id, type, category, stock_name, quantity, price_per_share, memo, created_at) VALUES (gen_random_uuid(), '${gyUser.id}', 'in', '공모주', '코스모로보틱스', 5000, 3000, '', '2026-04-06 02:00:00')`);
      await db.execute(`INSERT INTO stock_transactions (id, user_id, type, category, stock_name, quantity, price_per_share, memo, created_at) VALUES (gen_random_uuid(), '${gyUser.id}', 'in', '공모주', '코스모로보틱스', 10000, 3000, '', '2026-04-06 02:00:00')`);
      await db.execute(`INSERT INTO stock_transactions (id, user_id, type, category, stock_name, quantity, price_per_share, memo, created_at) VALUES (gen_random_uuid(), '${gyUser.id}', 'in', '공모주', '코스모로보틱스', 15000, 3000, '', '2026-04-06 02:00:00')`);
      log("고영천 계정 생성 및 코스모로보틱스 입고 3건 완료");
    } else {
      // 기존 계정의 코스모로보틱스 거래 타입 정규화
      await db.execute(`UPDATE stock_transactions SET type = 'in' WHERE user_id = '${existingGoyoungchun.id}' AND type = '입고'`);
      await db.execute(`UPDATE stock_transactions SET type = 'out' WHERE user_id = '${existingGoyoungchun.id}' AND type = '출고'`);
      // 입고 거래 3건 확인 및 보완
      const gyTxs = await db.select().from(stockTransactions).where(eq(stockTransactions.userId, existingGoyoungchun.id));
      const gyInTxs = gyTxs.filter(t => t.type === "in" && t.stockName === "코스모로보틱스");
      if (gyInTxs.length < 3) {
        const needed = 3 - gyInTxs.length;
        const qtys = [5000, 10000, 15000].slice(0, needed);
        for (const qty of qtys) {
          await db.execute(`INSERT INTO stock_transactions (id, user_id, type, category, stock_name, quantity, price_per_share, memo, created_at) VALUES (gen_random_uuid(), '${existingGoyoungchun.id}', 'in', '공모주', '코스모로보틱스', ${qty}, 3000, '', '2026-04-06 02:00:00')`);
        }
        log(`고영천 코스모로보틱스 입고 ${needed}건 추가`);
      }
    }

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

    // freeksi 거래 타입 및 수량 검증
    const [freeksiUser] = await db.select().from(users).where(eq(users.username, "freeksi"));
    if (freeksiUser) {
      // freeksi 에 한정하여 "입고"→"in", "출고"→"out" 변환
      await db.execute(`UPDATE stock_transactions SET type = 'in' WHERE user_id = '${freeksiUser.id}' AND type = '입고'`);
      await db.execute(`UPDATE stock_transactions SET type = 'out' WHERE user_id = '${freeksiUser.id}' AND type = '출고'`);

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
