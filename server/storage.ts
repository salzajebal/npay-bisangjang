import { type User, type InsertUser, type StockTransaction, type InsertStockTransaction, users, stockTransactions } from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  updateUser(id: string, data: Partial<Pick<User, "fullName" | "accountNumber" | "accountHolder" | "bank" | "password" | "isFrozen">>): Promise<User | undefined>;
  deleteUser(id: string): Promise<void>;
  getTransactionsByUserId(userId: string): Promise<StockTransaction[]>;
  getAllTransactions(): Promise<StockTransaction[]>;
  createTransaction(tx: InsertStockTransaction): Promise<StockTransaction>;
  updateTransaction(id: string, data: Partial<Pick<StockTransaction, "quantity" | "pricePerShare" | "memo" | "category">>): Promise<StockTransaction | undefined>;
  deleteTransaction(id: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return db.select().from(users);
  }

  async getTransactionsByUserId(userId: string): Promise<StockTransaction[]> {
    return db.select().from(stockTransactions).where(eq(stockTransactions.userId, userId)).orderBy(desc(stockTransactions.createdAt));
  }

  async getAllTransactions(): Promise<StockTransaction[]> {
    return db.select().from(stockTransactions).orderBy(desc(stockTransactions.createdAt));
  }

  async createTransaction(tx: InsertStockTransaction): Promise<StockTransaction> {
    const [transaction] = await db.insert(stockTransactions).values(tx).returning();
    return transaction;
  }

  async updateUser(id: string, data: Partial<Pick<User, "fullName" | "accountNumber" | "accountHolder" | "bank" | "password" | "isFrozen">>): Promise<User | undefined> {
    const [user] = await db.update(users).set(data).where(eq(users.id, id)).returning();
    return user;
  }

  async deleteUser(id: string): Promise<void> {
    await db.delete(stockTransactions).where(eq(stockTransactions.userId, id));
    await db.delete(users).where(eq(users.id, id));
  }

  async updateTransaction(id: string, data: Partial<Pick<StockTransaction, "quantity" | "pricePerShare" | "memo" | "category">>): Promise<StockTransaction | undefined> {
    const [tx] = await db.update(stockTransactions).set(data).where(eq(stockTransactions.id, id)).returning();
    return tx;
  }

  async deleteTransaction(id: string): Promise<void> {
    await db.delete(stockTransactions).where(eq(stockTransactions.id, id));
  }
}

export const storage = new DatabaseStorage();
