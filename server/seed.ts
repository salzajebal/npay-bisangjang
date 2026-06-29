import { db } from "./db";
import { users, transferRequests, stockTransactions } from "@shared/schema";
import { eq, and, inArray } from "drizzle-orm";
import { log } from "./index";
import bcrypt from "bcrypt";

export async function repairApprovedTransfers() {
  try {
    const approved = await db.select().from(transferRequests).where(eq(transferRequests.status, "approved"));
    let created = 0;
    for (const tr of approved) {
      const [existing] = await db.select().from(stockTransactions).where(
        and(
          eq(stockTransactions.userId, tr.userId),
          eq(stockTransactions.type, "out"),
          eq(stockTransactions.stockName, tr.stockName),
          eq(stockTransactions.memo, `출고신청#${tr.id}`)
        )
      );
      if (!existing) {
        await db.insert(stockTransactions).values({
          userId: tr.userId,
          type: "out",
          category: "일반",
          stockName: tr.stockName,
          quantity: tr.quantity,
          pricePerShare: tr.currentPrice || tr.purchasePrice || 0,
          memo: `출고신청#${tr.id}`,
          createdAt: tr.approvedAt || tr.createdAt,
        });
        created++;
      }
    }
    if (created > 0) log(`Repaired ${created} approved transfer(s): out transactions created`);
  } catch (error) {
    log("repairApprovedTransfers error: " + String(error));
  }
}

export async function seedDatabase() {
  try {
    // session 테이블이 없으면 자동 생성
    await db.execute(`
      CREATE TABLE IF NOT EXISTS "session" (
        "sid" varchar NOT NULL COLLATE "default",
        "sess" json NOT NULL,
        "expire" timestamp(6) NOT NULL,
        CONSTRAINT "session_pkey" PRIMARY KEY ("sid") NOT DEFERRABLE INITIALLY IMMEDIATE
      ) WITH (OIDS=FALSE)
    `);
    await db.execute(`CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "session" ("expire")`);

    const hashedPassword = await bcrypt.hash("admin123", 10);
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
  } catch (error) {
    log("Seed error: " + String(error));
  }
}
