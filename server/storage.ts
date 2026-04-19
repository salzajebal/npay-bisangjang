import { type User, type InsertUser, type StockTransaction, type InsertStockTransaction, type TransferRequest, type InsertTransferRequest, type ChatRoom, type ChatMessage, type InsertChatMessage, type IpoStock, type InsertIpoStock, type Watchlist, users, stockTransactions, transferRequests, chatRooms, chatMessages, ipoStocks, watchlist } from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  updateUser(id: string, data: Partial<Pick<User, "fullName" | "accountNumber" | "accountHolder" | "bank" | "password" | "isFrozen">>): Promise<User | undefined>;
  deleteUser(id: string): Promise<void>;
  getTransaction(id: string): Promise<StockTransaction | undefined>;
  getTransactionsByUserId(userId: string): Promise<StockTransaction[]>;
  getAllTransactions(): Promise<StockTransaction[]>;
  createTransaction(tx: InsertStockTransaction): Promise<StockTransaction>;
  updateTransaction(id: string, data: Partial<Pick<StockTransaction, "quantity" | "pricePerShare" | "memo" | "category" | "createdAt">>): Promise<StockTransaction | undefined>;
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
  getUnreadCountByRoom(roomId: string): Promise<number>;
  getTotalUnreadCountForAdmin(): Promise<number>;
  markMessagesAsReadByAdmin(roomId: string): Promise<void>;
  getAllIpoStocks(): Promise<IpoStock[]>;
  getActiveIpoStocks(): Promise<IpoStock[]>;
  createIpoStock(data: InsertIpoStock): Promise<IpoStock>;
  updateIpoStock(id: string, data: Partial<InsertIpoStock>): Promise<IpoStock | undefined>;
  deleteIpoStock(id: string): Promise<void>;
  getWatchlist(userId: string): Promise<Watchlist[]>;
  addToWatchlist(userId: string, stockName: string): Promise<Watchlist>;
  removeFromWatchlist(userId: string, stockName: string): Promise<void>;
  isInWatchlist(userId: string, stockName: string): Promise<boolean>;
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

  async getTransaction(id: string): Promise<StockTransaction | undefined> {
    const [tx] = await db.select().from(stockTransactions).where(eq(stockTransactions.id, id));
    return tx;
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

  async updateTransaction(id: string, data: Partial<Pick<StockTransaction, "quantity" | "pricePerShare" | "memo" | "category" | "createdAt">>): Promise<StockTransaction | undefined> {
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

  async getUnreadCountByRoom(roomId: string): Promise<number> {
    const result = await db.select({ count: sql<number>`count(*)::int` })
      .from(chatMessages)
      .where(and(eq(chatMessages.roomId, roomId), eq(chatMessages.senderRole, "user"), eq(chatMessages.isReadByAdmin, 0)));
    return result[0]?.count ?? 0;
  }

  async getTotalUnreadCountForAdmin(): Promise<number> {
    const result = await db.select({ count: sql<number>`count(*)::int` })
      .from(chatMessages)
      .where(and(eq(chatMessages.senderRole, "user"), eq(chatMessages.isReadByAdmin, 0)));
    return result[0]?.count ?? 0;
  }

  async markMessagesAsReadByAdmin(roomId: string): Promise<void> {
    await db.update(chatMessages)
      .set({ isReadByAdmin: 1 })
      .where(and(eq(chatMessages.roomId, roomId), eq(chatMessages.senderRole, "user"), eq(chatMessages.isReadByAdmin, 0)));
  }

  async getAllIpoStocks(): Promise<IpoStock[]> {
    return db.select().from(ipoStocks).orderBy(desc(ipoStocks.createdAt));
  }

  async getActiveIpoStocks(): Promise<IpoStock[]> {
    return db.select().from(ipoStocks).where(eq(ipoStocks.status, "active")).orderBy(desc(ipoStocks.createdAt));
  }

  async createIpoStock(data: InsertIpoStock): Promise<IpoStock> {
    const [stock] = await db.insert(ipoStocks).values(data).returning();
    return stock;
  }

  async updateIpoStock(id: string, data: Partial<InsertIpoStock>): Promise<IpoStock | undefined> {
    const [stock] = await db.update(ipoStocks).set(data).where(eq(ipoStocks.id, id)).returning();
    return stock;
  }

  async deleteIpoStock(id: string): Promise<void> {
    await db.delete(ipoStocks).where(eq(ipoStocks.id, id));
  }

  async getWatchlist(userId: string): Promise<Watchlist[]> {
    return db.select().from(watchlist).where(eq(watchlist.userId, userId)).orderBy(desc(watchlist.createdAt));
  }

  async addToWatchlist(userId: string, stockName: string): Promise<Watchlist> {
    const [item] = await db.insert(watchlist).values({ userId, stockName }).returning();
    return item;
  }

  async removeFromWatchlist(userId: string, stockName: string): Promise<void> {
    await db.delete(watchlist).where(and(eq(watchlist.userId, userId), eq(watchlist.stockName, stockName)));
  }

  async isInWatchlist(userId: string, stockName: string): Promise<boolean> {
    const [item] = await db.select().from(watchlist).where(and(eq(watchlist.userId, userId), eq(watchlist.stockName, stockName)));
    return !!item;
  }
}

export const storage = new DatabaseStorage();
