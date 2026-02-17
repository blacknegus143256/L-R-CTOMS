# CTOMS-LR — Centralized Tailoring Order and Management System (Laravel + React)

A Laravel + React version of [CTOMS](https://github.com/blacknegus143256/CTOMS). The backend is a Laravel API; the frontend is a React SPA built with Vite.

## Features

- **Tailor Comparison Tool:** Filter shops by attributes (e.g. fabrics, notions), select Shop A and Shop B, then see prices side-by-side (aligned with [CTOMS](https://github.com/blacknegus143256/CTOMS)).
- **Public:** Browse approved tailoring shops and view their services.
- **Shop dashboard (CRUD):** Logged-in shop staff get a sidebar menu to manage **Services**, **Customers**, and **Orders** for their shop(s). Multi-shop users can switch shops from the sidebar.
- **API:** REST endpoints for auth, categories, shops, compare, and dashboard CRUD (services, customers, orders) scoped by shop.
- **Stack:** Laravel 12, React 18, React Router, Vite, Tailwind CSS, Laravel Sanctum, SQLite (or MySQL).

## Requirements

- PHP 8.2+
- Composer
- Node.js 18+
- npm or pnpm

## Setup

1. **Install PHP dependencies**
   ```bash
   composer install
   ```

2. **Environment**
   ```bash
   cp .env.example .env
   php artisan key:generate
   ```
   Configure `.env` (e.g. `DB_*` if not using SQLite).

3. **Database**
   ```bash
   php artisan migrate
   php artisan db:seed
   ```
   This seeds shops, attributes, and a **dashboard user** (`shop@example.com` / `password`) linked to the first shop.

4. **Frontend**
   ```bash
   npm install
   npm run build
   ```

5. **Run**
   ```bash
   php artisan serve
   ```
   Open http://localhost:8000

**Shop dashboard:** Sign in with `shop@example.com` / `password`, then use **Dashboard** in the header. From the sidebar you can manage Services, Customers, and Orders for your shop.

## Development

- Backend: `php artisan serve`
- Frontend (Vite): `npm run dev` (in another terminal)

With both running, the app is at http://localhost:8000 with hot reload for React.

## API

- `GET /api/categories` — Attribute categories with attributes (for filters and comparison table).
- `GET /api/shops` — List approved, active shops. Optional: `?search=...`, `?attributes[]=1&attributes[]=2`.
- `GET /api/shops/compare?shop1=1&shop2=2` — Two shops with their attribute prices (for comparison).
- `GET /api/shops/{id}` — Single shop with services.

**Auth & dashboard (protected by `auth:sanctum`):**
- `POST /api/register`, `POST /api/login`, `POST /api/logout`, `GET /api/user`
- `GET /api/dashboard/shops` — Shops the user can manage
- `GET/POST /api/dashboard/shops/{shop}/services`, `PUT/DELETE .../services/{id}`
- Same pattern for `customers` and `orders`

## Project structure (CTOMS)

- **Models:** `TailoringShop`, `Service`, `Customer`, `Order`, `User` (with `shop_user` pivot).
- **Public UI:** Home (shop list), Shop detail (services).
- **Database:** Same domain as the [original CTOMS](https://github.com/blacknegus143256/CTOMS) (shops, services, customers, orders, multi-tenant users).

## License

MIT.
