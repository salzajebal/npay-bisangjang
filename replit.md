# Samsung Stock Management System (삼성전자 주식관리 시스템)

## Overview
A stock inventory management system for Samsung Electronics shares. Members can register, login, and view their stock transaction history in real-time. Administrators can manage members and process stock in/out (입고/출고) transactions.

## Architecture
- **Frontend**: React + Vite + TailwindCSS + shadcn/ui + wouter routing
- **Backend**: Express.js with session-based auth (bcrypt password hashing)
- **Database**: PostgreSQL with Drizzle ORM
- **Sessions**: connect-pg-simple for PostgreSQL session storage

## Key Pages
- `/` - Landing page with Samsung stock chart (canvas-based) and order book
- `/login` - User login
- `/register` - User registration (username, password, name, bank, account info)
- `/dashboard` - User dashboard showing stock holdings and transaction history
- `/admin` - Admin panel (login: admin / admin123) with member management and stock transaction CRUD

## Database Schema
- `users` - Members with bank info, admin flag
- `stock_transactions` - Stock in/out records per user with category, quantity, price
- `session` - Express sessions (auto-created by connect-pg-simple)

## API Routes
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user
- `GET /api/transactions/my` - Get user's transactions
- `GET /api/admin/users` - Get all users (admin only)
- `GET /api/admin/transactions` - Get all transactions (admin only)
- `POST /api/admin/transactions` - Create stock transaction (admin only)
- `DELETE /api/admin/transactions/:id` - Delete transaction (admin only)

## Running
`npm run dev` starts both frontend (Vite) and backend (Express) on port 5000.
