import { db } from "./db";
import { users, stockTransactions } from "@shared/schema";
import { eq, and } from "drizzle-orm";
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
