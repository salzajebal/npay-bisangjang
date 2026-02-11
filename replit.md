# IBK기업증권 주식관리 시스템

## Overview
A stock inventory management system for IBK Investment Securities. Members can register, login, and view their stock transaction history in real-time. Administrators can manage members and process stock in/out (입고/출고) transactions. Features Samsung Electronics (005930) live stock data via Yahoo Finance.

## Architecture
- **Frontend**: React + Vite + TailwindCSS + shadcn/ui + wouter routing
- **Backend**: Express.js with session-based auth (bcrypt password hashing)
- **Database**: PostgreSQL with Drizzle ORM
- **Sessions**: connect-pg-simple for PostgreSQL session storage

## Key Pages
- `/` - Landing page with Samsung stock chart (canvas-based), order book, community feed, news, stock info tabs
- `/login` - User login (frozen accounts blocked with message)
- `/register` - User registration (username, password, name, bank, account info)
- `/dashboard` - User dashboard showing stock holdings and transaction history
- `/admin` - Admin panel (login: admin / admin123) with comprehensive member management

## Admin Features
- **회원정보열람** - View member details, holdings summary, recent transactions
- **회원정보변경** - Edit member name, bank, account, password
- **회원동결/해제** - Freeze/unfreeze accounts (blocks login)
- **회원삭제** - Delete member with confirmation (also deletes transactions)
- **입고/출고 처리** - Stock in/out with real-time price fetching
- **입고량 수정** - Edit transaction quantity, price, category, memo

## Database Schema
- `users` - Members with bank info, admin flag, isFrozen flag
- `stock_transactions` - Stock in/out records per user with category, quantity, price
- `session` - Express sessions (auto-created by connect-pg-simple)

## API Routes
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login (blocks frozen accounts)
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user
- `GET /api/transactions/my` - Get user's transactions
- `GET /api/admin/users` - Get all users (admin only)
- `GET /api/admin/users/:id` - Get user details (admin only)
- `PUT /api/admin/users/:id` - Update user info (admin only)
- `PATCH /api/admin/users/:id/freeze` - Freeze/unfreeze user (admin only)
- `DELETE /api/admin/users/:id` - Delete user and transactions (admin only)
- `GET /api/admin/transactions` - Get all transactions (admin only)
- `POST /api/admin/transactions` - Create stock transaction (admin only)
- `PUT /api/admin/transactions/:id` - Update transaction (admin only)
- `DELETE /api/admin/transactions/:id` - Delete transaction (admin only)
- `GET /api/stock/samsung` - Get live Samsung Electronics stock data from Yahoo Finance
- `GET /api/stock/samsung/news` - Get Korean news about Samsung Electronics

## Running
`npm run dev` starts both frontend (Vite) and backend (Express) on port 5000.
