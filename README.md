# Lucid Sound Domain

This repo scaffolds a small PWA landing site with:
- Email + name sign-in (no password for MVP)
- “Remember me” via httpOnly session cookie
- Event tracking (page views + sign-in) stored in SQLite

## Local development

1. Copy env examples:
   - `apps/api/.env.example` -> `apps/api/.env`
   - `apps/web/.env.example` -> `apps/web/.env`
2. Install dependencies:
   - `npm install`
3. Run both apps:
   - `npm run dev`

Web dev server typically: `http://localhost:5173`
API dev server typically: `http://localhost:8787`

## Deploying (Vercel/Netlify)

This scaffold deploys as two parts:
- `apps/web` as a static site (Vite + PWA)
- `apps/api` as the backend (Express + Prisma)

Because the API currently uses SQLite (`DATABASE_URL=file:...`), production hosting on Vercel/Netlify will usually require switching to a hosted database (Postgres/MySQL) and deploying the API as either:
- a long-running Node service (simplest), or
- serverless functions (requires API adaptation + hosted DB).

For the frontend to talk to the API, ensure `VITE_API_BASE_URL` is set appropriately (for local we proxy `/api` to `apps/api`).

