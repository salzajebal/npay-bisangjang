import { db } from "./db";
import { users } from "@shared/schema";
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
  } catch (error) {
    log("Seed error: " + String(error));
  }
}
