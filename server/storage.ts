import { type User, type InsertUser, type StockTransaction, type InsertStockTransaction, type TransferRequest, type InsertTransferRequest, type ChatRoom, type ChatMessage, type InsertChatMessage, users, stockTransactions, transferRequests, chatRooms, chatMessages } from "@shared/schema";
import { db } from "./db";
import { eq, desc, and } from "drizzle-orm";

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
  createTransferRequest(data: InsertTransferRequest): Promise<TransferRequest>;
  getTransferRequestsByUserId(userId: string): Promise<TransferRequest[]>;
  getAllTransferRequests(): Promise<TransferRequest[]>;
  updateTransferRequestStatus(id: string, status: string, adminMemo?: string): Promise<TransferRequest | undefined>;
  getOrCreateChatRoom(userId: string): Promise<ChatRoom>;
  getChatRoomsByUserId(userId: string): Promise<ChatRoom[]>;
  getAllChatRooms(): Promise<ChatRoom[]>;
  getChatMessages(roomId: string): Promise<ChatMessage[]>;
  createChatMessage(data: InsertChatMessage): Promise<ChatMessage>;
  updateChatRoomLastMessage(roomId: string): Promise<void>;
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

  async createTransferRequest(data: InsertTransferRequest): Promise<TransferRequest> {
    const [req] = await db.insert(transferRequests).values(data).returning();
    return req;
  }

  async getTransferRequestsByUserId(userId: string): Promise<TransferRequest[]> {
    return db.select().from(transferRequests).where(eq(transferRequests.userId, userId)).orderBy(desc(transferRequests.createdAt));
  }

  async getAllTransferRequests(): Promise<TransferRequest[]> {
    return db.select().from(transferRequests).orderBy(desc(transferRequests.createdAt));
  }

  async updateTransferRequestStatus(id: string, status: string, adminMemo?: string): Promise<TransferRequest | undefined> {
    const updateData: any = { status };
    if (adminMemo !== undefined) updateData.adminMemo = adminMemo;
    const [req] = await db.update(transferRequests).set(updateData).where(eq(transferRequests.id, id)).returning();
    return req;
  }

  async getOrCreateChatRoom(userId: string): Promise<ChatRoom> {
    const [existing] = await db.select().from(chatRooms)
      .where(and(eq(chatRooms.userId, userId), eq(chatRooms.status, "open")));
    if (existing) return existing;
    const [room] = await db.insert(chatRooms).values({ userId }).returning();
    return room;
  }

  async getChatRoomsByUserId(userId: string): Promise<ChatRoom[]> {
    return db.select().from(chatRooms).where(eq(chatRooms.userId, userId)).orderBy(desc(chatRooms.lastMessageAt));
  }

  async getAllChatRooms(): Promise<ChatRoom[]> {
    return db.select().from(chatRooms).orderBy(desc(chatRooms.lastMessageAt));
  }

  async getChatMessages(roomId: string): Promise<ChatMessage[]> {
    return db.select().from(chatMessages).where(eq(chatMessages.roomId, roomId)).orderBy(chatMessages.createdAt);
  }

  async createChatMessage(data: InsertChatMessage): Promise<ChatMessage> {
    const [msg] = await db.insert(chatMessages).values(data).returning();
    return msg;
  }

  async updateChatRoomLastMessage(roomId: string): Promise<void> {
    await db.update(chatRooms).set({ lastMessageAt: new Date() }).where(eq(chatRooms.id, roomId));
  }
}

export const storage = new DatabaseStorage();
