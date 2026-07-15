# Lucid Sound Domain

The homebase for the Lucid sound series — a PWA landing site with a waitlist,
welcome/confirmation emails, an admin panel, and a time-capsule archive.

**Site sections:** Regulation (portal dates + calendar buttons) · Arrival ·
Program · Selectors · Archive · Participate

**Core flows:**
- Waitlist join (name + email + optional referrer) → welcome email
  ("oh hey you") with a "Confirm and Step Through" link that stamps
  `email_confirmed_at` — an engagement signal for inbox placement, not a gate
- Returning visitors are looked up by name; phone-only entries can add an
  email inline (keyed by `referral_code`)
- Archive: photos as draggable polaroids (tap to enlarge), videos as film
  reels that open a projector overlay
- Admin panel at `/admin` (gated by `ADMIN_SECRET` as `x-admin-secret`
  header): portal dates + guests, artist names/bios/photos, archive
  photo/video uploads with captions, email blasts to participants. Text
  fields autosave; archive/artist media uploads go straight from the browser
  to Supabase storage (videos exceed the API's 4mb body limit).

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

Local email sending is a no-op unless `RESEND_API_KEY` is set in
`apps/api/.env`. Set `SITE_URL=http://localhost:5173` locally too, or the
confirm links in welcome emails will point at production.

## Stack

- `apps/web` — Vite + React PWA
- `apps/api` — Express; data in Supabase (Postgres + storage buckets
  `artist-photos` and `archive`), email via Resend
- Inbound mail to `portal@lucidsounddomain.com` forwards via ImprovMX
  (MX records on the root domain; DNS is on Vercel)

## Deploying (Vercel)

This scaffold deploys as two Vercel projects:
- `apps/web` — static site (Vite + PWA), domain `lucidsounddomain.com`
- `apps/api` — Express backend, deployed separately and reached via a `vercel.json` rewrite (`/api/:path*`)

Merges to `lsd-scaffold` deploy production; pushes to `staging-branch` create
preview deploys (branch alias URLs). Working flow: commit to
`staging-branch`, open a PR into `lsd-scaffold`, merge, verify prod.

There's no separate staging environment for this project — Preview and Production deploys point at the same Supabase project and the same `RESEND_API_KEY`. Testing is done by sending real waitlist joins to your own inbox on a branch deploy; there's no isolated test data or test inbox, so treat anything you submit as a real row in the live `participants` table.

For the frontend to talk to the API, ensure `VITE_API_BASE_URL` is set appropriately (for local we proxy `/api` to `apps/api`).

## Config

- [x] `RESEND_API_KEY` set in Vercel (Preview scoped to `staging-branch` +
  Production) — the same key as local `.env`. Env vars are Sensitive
  (write-only); if lost, replace rather than recover.
- [x] `ADMIN_SECRET` set in Vercel (Preview scoped to `staging-branch` +
  Production), matching local `.env`.
- [x] Sending domain verified in Resend: DKIM (`resend._domainkey.lucidsounddomain.com`) + SPF/MX (`send.lucidsounddomain.com`) are live.
- [x] DMARC record added (`_dmarc.lucidsounddomain.com`, `p=none`) so Gmail/Yahoo have an alignment signal instead of just DKIM.

Note: welcome emails tend to land in Gmail's Promotions tab for now — the
modal copy tells people to check there, and the confirm-link click is the
engagement signal meant to improve placement over time.

## Feature TODO

- [x] Lucid Sound Domain archive — time-capsule section: draggable polaroids with captions + film-reel video projector, managed from the admin panel.
- [ ] Food deposit — a way for people to put down a deposit for food.
- [ ] RSVP with remaining spots — an RSVP flow that tracks and displays how many spots are left.
