import { db } from "./db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";
import { log } from "./index";
import bcrypt from "bcrypt";

export async function seedDatabase() {
  try {
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
      log("Admin account created (admin / admin123)");
    } else {
      await db.update(users).set({ password: hashedPassword }).where(eq(users.username, "admin"));
      log("Admin password reset to admin123");
    }
  } catch (error) {
    log("Seed error: " + String(error));
  }
}
