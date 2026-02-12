# IBK기업증권 주식관리 시스템

## Overview
A stock inventory management system for IBK Investment Securities. Members can register, login, and view their stock transaction history in real-time. Administrators can manage members and process stock in/out (입고/출고) transactions. Features Samsung Electronics (005930) live stock data via Yahoo Finance.

## Architecture
- **Frontend**: React + Vite + TailwindCSS + shadcn/ui + wouter routing
- **Backend**: Express.js with session-based auth (bcrypt password hashing)
- **Database**: PostgreSQL with Drizzle ORM
- **Sessions**: connect-pg-simple for PostgreSQL session storage

## Key Pages
- `/` - Promotional home page (IBK branding, hero sections, CTAs linking to /trade and /register, login/register buttons, floating CTA bar)
- `/trade` - Trading page with Samsung stock chart (canvas-based), order book, community feed, news, stock info tabs
- `/login` - User login (frozen accounts blocked with message). After login redirects to /trade
- `/register` - User registration (username, password, name, bank, account info)
- `/dashboard` - User dashboard showing stock holdings and transaction history
- `/chat` - 1:1 customer service chat (logged-in members only, real-time WebSocket)
- `/admin` - Admin panel (login: admin / admin123) with comprehensive member management

## Admin Features
- **회원정보열람** - View member details, holdings summary, recent transactions
- **회원정보변경** - Edit member name, bank, account, password
- **회원동결/해제** - Freeze/unfreeze accounts (blocks login)
- **회원삭제** - Delete member with confirmation (also deletes transactions)
- **입고/출고 처리** - Stock in/out with real-time price fetching
- **입고량 수정** - Edit transaction quantity, price, category, memo
- **대체출고 관리** - Approve/reject/hold transfer-out requests from members
- **1:1 상담** - Real-time chat with members, sound notification on new messages, unread message count badges

## Transfer-Out Feature (타사 대체출고)
- Users can request stock transfer to other brokerages from the login page (after logging in)
- Transfer request form: account name, account number, quantity
- On submission: current position closes (out transaction created at current market price)
- Transfer request list shows status (pending/approved/rejected/held)
- Admin can manage requests from "대체출고 관리" sidebar section

## Database Schema
- `users` - Members with bank info, admin flag, isFrozen flag
- `stock_transactions` - Stock in/out records per user with category, quantity, price
- `transfer_requests` - Transfer-out requests with status (pending/approved/rejected/held), account info
- `chat_rooms` - 1:1 chat rooms per user with status (open/closed)
- `chat_messages` - Chat messages with roomId, senderId, senderRole (user/admin)
- `session` - Express sessions (auto-created by connect-pg-simple)

## API Routes
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login (blocks frozen accounts)
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user
- `GET /api/transactions/my` - Get user's transactions
- `POST /api/transfer-requests` - Submit transfer-out request (creates out transaction)
- `GET /api/transfer-requests/my` - Get user's transfer requests
- `GET /api/admin/users` - Get all users (admin only)
- `GET /api/admin/users/:id` - Get user details (admin only)
- `PUT /api/admin/users/:id` - Update user info (admin only)
- `PATCH /api/admin/users/:id/freeze` - Freeze/unfreeze user (admin only)
- `DELETE /api/admin/users/:id` - Delete user and transactions (admin only)
- `GET /api/admin/transactions` - Get all transactions (admin only)
- `POST /api/admin/transactions` - Create stock transaction (admin only)
- `PUT /api/admin/transactions/:id` - Update transaction (admin only)
- `DELETE /api/admin/transactions/:id` - Delete transaction (admin only)
- `GET /api/admin/transfer-requests` - Get all transfer requests (admin only)
- `PATCH /api/admin/transfer-requests/:id` - Update transfer request status (admin only)
- `POST /api/chat/rooms` - Create/get chat room for current user
- `GET /api/chat/rooms/my` - Get user's chat rooms
- `GET /api/chat/rooms` - Get all chat rooms with user info and unread counts (admin only)
- `GET /api/chat/unread-count` - Get total unread message count for admin (admin only)
- `POST /api/chat/rooms/:id/mark-read` - Mark all user messages in room as read (admin only)
- `GET /api/chat/rooms/:id/messages` - Get messages for a chat room
- `WebSocket /ws/chat` - Real-time chat via WebSocket (session-authenticated)
- `GET /api/stock/samsung` - Get live Samsung Electronics stock data from Yahoo Finance
- `GET /api/stock/samsung/news` - Get Korean news about Samsung Electronics

## Running
`npm run dev` starts both frontend (Vite) and backend (Express) on port 5000.
