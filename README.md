# Lawareeg – Digital Asset Marketplace

Professional marketplace for buying and selling digital assets (social accounts, websites, domains, apps, SaaS, and more). Lawareeg acts as a **manual escrow middleman**: buyers pay the platform, admins verify receipts, sellers transfer assets, then funds are released minus commission.

## Stack

| Layer | Technology |
|-------|------------|
| Frontend | React (Vite) + Tailwind CSS v4 |
| Backend | Laravel 12 REST API + Sanctum |
| Database | MySQL (Docker / production) or local MySQL |
| Deploy | Docker Compose + host Nginx (HTTPS) on Contabo |

## Security highlights

- Email verification required before dashboard access
- Sanctum Bearer tokens, hashed passwords, role middleware
- Manual escrow (admin reviews payments — no direct buyer→seller payout)
- Upload mime/size limits; listing chat blocks contact sharing
- See [docs/SECURITY.md](docs/SECURITY.md) and [docs/DEPLOY_CONTABO.md](docs/DEPLOY_CONTABO.md)

## Manual escrow flow (MVP)

1. Seller lists an asset → admin approves
2. Buyer clicks **Buy Now** → order `pending_payment`
3. Buyer pays Lawareeg (bank / mobile money) and uploads receipt → `payment_under_review`
4. Admin confirms money received → `payment_confirmed`
5. Seller transfers the asset → `seller_transferring`
6. Buyer confirms receipt → `buyer_confirmation`
7. Admin releases funds to seller wallet (minus commission) → `completed`

Also supported: `cancelled`, `disputed` (admin refunds buyer or releases to seller).

**No real payment gateway** — you check bank/mobile money manually, then mark the order paid in admin.

## Quick start

### Prerequisites

- PHP 8.2+ with extensions: `openssl`, `pdo_sqlite` (or `pdo_mysql`), `mbstring`, `curl`, `fileinfo`, `zip`, `gd`
- Composer
- Node.js 20+

### 1. Backend API

```bash
cd backend
cp .env.example .env   # already configured for SQLite + FRONTEND_URL
composer install
php artisan key:generate
# Ensure database/database.sqlite exists (SQLite default)
php artisan migrate --seed
php artisan storage:link
php artisan serve
```

API: [http://127.0.0.1:8000](http://127.0.0.1:8000)

### 2. Frontend

```bash
cd frontend
cp .env.example .env   # VITE_API_URL=http://127.0.0.1:8000/api
npm install
npm run dev
```

App: [http://localhost:5173](http://localhost:5173)

### Demo accounts (password: `password`)

| Role | Email |
|------|--------|
| Admin | `admin@lawareeg.com` |
| Buyer | `buyer@lawareeg.com` |
| Seller | `seller@lawareeg.com` |

Default commission: **10%** (configurable in Admin → Settings).

Demo accounts are **email-verified** by the seeder. New registrations must verify email before the dashboard opens (configure SMTP in `.env`).

## Docker (recommended for Contabo VPS)

```bash
cp .env.docker.example .env.docker
# Edit secrets, APP_URL, FRONTEND_URL, VITE_API_URL, MAIL_*
docker compose --env-file .env.docker up -d --build
```

Stack listens on `127.0.0.1:8088`. Put host Nginx + Let's Encrypt in front on a **subdomain** so it sits beside your existing Contabo app. Full steps: [docs/DEPLOY_CONTABO.md](docs/DEPLOY_CONTABO.md).

## MySQL (production)

In `backend/.env`:

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=lawareeg
DB_USERNAME=your_user
DB_PASSWORD=your_password
```

Then:

```bash
php artisan migrate --seed
```

## Project structure

```
Lawareeg/
├── backend/          # Laravel 12 API
│   ├── app/Http/Controllers/Api/
│   ├── app/Services/ # OrderService, WalletService, NotificationService
│   ├── database/migrations/
│   └── routes/api.php
├── frontend/         # React + Tailwind SPA
│   └── src/pages/    # public, auth, dashboard, checkout, admin
└── docs/nginx/       # sample Nginx configs
```

## Order statuses

`pending_payment` → `payment_under_review` → `payment_confirmed` → `seller_transferring` → `buyer_confirmation` → `completed`

Also: `cancelled`, `disputed`

## Wallet (ledger only)

Each user has:

- Available balance
- Pending balance
- Total earnings
- Withdrawal history
- Transaction history

Admin pays sellers out-of-band (bank / mobile money), then marks withdrawals as paid.

## Nginx

See `docs/nginx/` for sample configs serving the React build and proxying `/api` to PHP-FPM.

## Security notes

- Role-based access (`buyer` / `seller` / `admin`)
- Sanctum bearer tokens
- Suspended users blocked
- Auth rate limiting
- Validated form requests
- Secure file uploads to `storage/app/public`

## License

Proprietary – Lawareeg
