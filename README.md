# VendorBridge

Smart Procurement. Faster Decisions.

This repository scaffolds VendorBridge — a procurement & vendor management ERP (hackathon-grade starter).

Core tech:
- Backend: Node.js, Express, TypeScript, Prisma, PostgreSQL
- Frontend: React (Vite), TypeScript, Tailwind
- Auth: JWT, bcrypt
- Real-time: Socket.io
- PDF: PDFKit
- Email: Nodemailer

Quick start (development):

1) Create .env files for backend and set `DATABASE_URL` and `JWT_SECRET`.

2) Run database (local Postgres) or use Docker Compose:

```bash
docker-compose up -d
```

3) Backend (from `/backend`):

```bash
cd backend
pnpm install
npx prisma generate
npx prisma db push
pnpm run seed
pnpm run dev
```

4) Frontend (from `/frontend`):

```bash
cd frontend
pnpm install
pnpm run dev
```

Docker: see `docker-compose.yml` and `backend/Dockerfile` for containerized setup.

Contributions: create feature branches per module (e.g. `feature/auth`, `feature/vendors`).
