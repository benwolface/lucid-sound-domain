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

## Deploying (Vercel)

This scaffold deploys as two Vercel projects:
- `apps/web` — static site (Vite + PWA), domain `lucidsounddomain.com`
- `apps/api` — Express backend, deployed separately and reached via a `vercel.json` rewrite (`/api/:path*`)

The API uses Supabase (Postgres) in every environment, not SQLite/Prisma — `DATABASE_URL` in `.env` is unused legacy config and can be ignored/removed.

There's no separate staging environment for this project — Preview and Production deploys point at the same Supabase project and the same `RESEND_API_KEY`. Testing is done by sending real waitlist joins to your own inbox on a branch deploy; there's no isolated test data or test inbox, so treat anything you submit as a real row in the live `participants` table.

For the frontend to talk to the API, ensure `VITE_API_BASE_URL` is set appropriately (for local we proxy `/api` to `apps/api`).

## Config TODO

- [x] `RESEND_API_KEY` is set in Vercel (Preview + Production) — welcome emails send in those environments. Add it to `apps/api/.env` too if you want it sending locally.
- [x] Sending domain verified in Resend: DKIM (`resend._domainkey.lucidsounddomain.com`) + SPF/MX (`send.lucidsounddomain.com`) are live.
- [x] DMARC record added (`_dmarc.lucidsounddomain.com`, `p=none`) so Gmail/Yahoo have an alignment signal instead of just DKIM.

## Feature TODO

- [ ] Lucid Sound Domain archive — a page linking photos/videos from past portals into the site, laid out nicely.
- [ ] Food deposit — a way for people to put down a deposit for food.
- [ ] RSVP with remaining spots — an RSVP flow that tracks and displays how many spots are left.

