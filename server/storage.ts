import { type User, type InsertUser, type StockTransaction, type InsertStockTransaction, users, stockTransactions } from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  getTransactionsByUserId(userId: string): Promise<StockTransaction[]>;
  getAllTransactions(): Promise<StockTransaction[]>;
  createTransaction(tx: InsertStockTransaction): Promise<StockTransaction>;
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

  async deleteTransaction(id: string): Promise<void> {
    await db.delete(stockTransactions).where(eq(stockTransactions.id, id));
  }
}

export const storage = new DatabaseStorage();
