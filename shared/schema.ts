import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull(),
  accountNumber: text("account_number").notNull(),
  accountHolder: text("account_holder").notNull(),
  bank: text("bank").notNull(),
  isAdmin: boolean("is_admin").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const stockTransactions = pgTable("stock_transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  type: text("type").notNull(), // 'in' (입고) or 'out' (출고)
  brand: text("brand").notNull().default("삼성전자"),
  category: text("category").notNull(),
  stockName: text("stock_name").notNull(),
  quantity: integer("quantity").notNull(),
  pricePerShare: integer("price_per_share").notNull(),
  memo: text("memo"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  isAdmin: true,
  createdAt: true,
});

export const registerSchema = insertUserSchema.extend({
  username: z.string().min(4, "아이디는 4자 이상이어야 합니다"),
  password: z.string().min(6, "비밀번호는 6자 이상이어야 합니다"),
  fullName: z.string().min(2, "성명을 입력해주세요"),
  accountNumber: z.string().min(1, "계좌번호를 입력해주세요"),
  accountHolder: z.string().min(1, "예금주를 입력해주세요"),
  bank: z.string().min(1, "은행을 선택해주세요"),
});

export const loginSchema = z.object({
  username: z.string().min(1, "아이디를 입력해주세요"),
  password: z.string().min(1, "비밀번호를 입력해주세요"),
});

export const insertStockTransactionSchema = createInsertSchema(stockTransactions).omit({
  id: true,
  createdAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type StockTransaction = typeof stockTransactions.$inferSelect;
export type InsertStockTransaction = z.infer<typeof insertStockTransactionSchema>;

export const KOREAN_BANKS = [
  "KB국민은행",
  "신한은행",
  "하나은행",
  "우리은행",
  "NH농협은행",
  "IBK기업은행",
  "SC제일은행",
  "씨티은행",
  "카카오뱅크",
  "케이뱅크",
  "토스뱅크",
  "DGB대구은행",
  "BNK부산은행",
  "BNK경남은행",
  "광주은행",
  "전북은행",
  "제주은행",
  "수협은행",
  "신협",
  "새마을금고",
  "우체국",
  "산업은행",
  "수출입은행",
] as const;

export const STOCK_CATEGORIES = [
  "보통주",
  "우선주",
  "공모주",
  "실권주",
  "기타",
] as const;

export const BRAND_SUBCATEGORIES: Record<string, string[]> = {
  "삼성전자": ["스마트폰", "반도체", "가전", "디스플레이", "네트워크"],
  "삼성SDI": ["배터리", "전자재료"],
  "삼성바이오로직스": ["바이오시밀러", "CMO/CDO"],
  "삼성물산": ["건설", "상사", "패션", "리조트"],
  "삼성생명": ["보험", "투자"],
  "삼성화재": ["손해보험", "자산운용"],
  "삼성SDS": ["IT서비스", "물류"],
  "삼성중공업": ["조선", "해양플랜트"],
  "삼성엔지니어링": ["플랜트", "건설"],
  "제일기획": ["광고", "마케팅"],
  "호텔신라": ["호텔", "면세"],
} as const;

export const BRANDS = Object.keys(BRAND_SUBCATEGORIES) as string[];
