# Batsirai

Full-stack services marketplace monorepo for customer, provider, and admin experiences.

## Stack
- Web/Admin: React 18 + TypeScript + Vite + TailwindCSS
- API: Node.js + Express + TypeScript + Prisma
- DB: PostgreSQL 15
- Cache/queue: Redis
- Storage: S3/MinIO

## Quick Start
1. Install Node.js 20+ and npm 10+
2. Copy `.env.example` to `.env`
3. Ensure local PostgreSQL and Redis are running
4. Run `npm install`
5. Run `npm run db:migrate`
6. Run `npm run db:seed`
7. Run `npm run dev`

## Monorepo Structure
- `apps/web` customer + provider web app
- `apps/admin` admin console
- `packages/api` backend API
- `packages/database` Prisma schema, migrations and seeds
- `packages/shared` shared types/constants
- `packages/config` env config

## Google Maps (Web)
1. Copy `apps/web/.env.example` to `apps/web/.env.local`
2. Set `VITE_GOOGLE_MAPS_API_KEY` with a newly generated Google Maps JavaScript API key
3. Restrict the key in Google Cloud Console:
	- Application restrictions: `HTTP referrers`
	- Allowed referrers for local dev: `http://localhost:3000/*` and `http://127.0.0.1:3000/*`
	- API restrictions: `Maps JavaScript API`
4. Restart the web dev server

Batsirai is a web platform (customer + provider) plus a private admin console.
