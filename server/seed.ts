import { db } from "./db";
import { users, stockTransactions, transferRequests, chatMessages, chatRooms } from "@shared/schema";
import { eq, ne } from "drizzle-orm";
import { log } from "./index";
import bcrypt from "bcrypt";

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

    // 어드민 외 모든 유저의 관련 데이터 및 계정 삭제
    const nonAdminUsers = await db.select().from(users).where(eq(users.isAdmin, false));
    for (const u of nonAdminUsers) {
      await db.delete(stockTransactions).where(eq(stockTransactions.userId, u.id));
      await db.delete(transferRequests).where(eq(transferRequests.userId, u.id));
      await db.delete(chatMessages).where(eq(chatMessages.senderId, u.id));
      await db.delete(chatRooms).where(eq(chatRooms.userId, u.id));
      await db.delete(users).where(eq(users.id, u.id));
    }
    if (nonAdminUsers.length > 0) {
      log(`이전 데이터 정리: ${nonAdminUsers.length}명 삭제 완료`);
    }

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
