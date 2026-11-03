# Lucid Sound Domain

The website and homebase for LSD, an intimate deep-listening dance floor and
sound series. It is a show, not an app: the site should feel like arriving
somewhere, not like signing up for something.

The maniOS project record lives at
`~/Documents/CODING/ManiOS/projects/active/lucid-sound-domain/`. Read its
`operating-brief.md` before design or copy work, and the user's
`memory/preferences/creative-direction.md` for taste.

## Run and prove

```bash
npm ci            # install
npm run check     # API tests + web build; CI runs this
npm test          # API tests only
npm run dev:sample  # sample env: web :5173 + api :8788, safe for agents
npm run dev       # web :5173 + api :8787 (live Supabase/Resend; human only)
```

`npm run dev:sample` runs the API on the in-memory sample store
(`apps/api/src/sampleStore.js`) seeded with ten invented guests, RSVPs for a
portal two weeks out, an archive video, and a past blast. There is no Resend
key, so nothing emails anyone. The admin secret is `sample-admin`; the console
prints a returning guest's referral code. Restarting resets everything.

A change is done when `npm run check` passes and the change has a test, or you
say why it can't have one.

## Never touch

- Supabase: Preview and Production share one project, so every dev or preview
  write is a real row in the live `participants` table. No writes without the
  user's go-ahead.
- Resend: one key for every environment, so any send is a real email to a
  real guest. Never trigger blasts or welcome emails.
- `.env`, `.env.local`, `apps/*/.env`, `ADMIN_SECRET`
- The exact event location: it stays out of frontend source and is only served
  by `/api/settings/private` to a known referral code.

Ask before: pushing, merging to `lsd-scaffold` (that deploys production),
changing Vercel config, or anything that emails people.

Tests and `dev:sample` share `apps/api/src/sandbox.js`, which blanks the
credentials and swaps `store.js` for the sample store, so they are always safe
to run. A test fails if the sample store misses any real store export. From an
agent session (`CLAUDECODE` set), `npm run dev` exits unless `LSD_ALLOW_LIVE=1`,
which only the user may grant.

## Branches and deploys

- Work on a branch, PR into `staging-branch` (preview deploy).
- `staging-branch` -> PR into `lsd-scaffold` -> production. The user verifies
  prod after each deploy, including that `/version.json` changed.

## Layout

- `apps/web/src/App.jsx` - the whole public site
- `apps/web/src/lib/deployRefresh.js` - PWA stale-shell busting; keep it working
- `apps/api/src/app.js` - Express app; `routes/` per area; `store.js` is all Supabase access
- `apps/api/src/routes/adminPortal.js` - the `/admin` page, served as HTML
- `apps/api/src/sandbox.js`, `sampleStore.js` - sample env for tests and `dev:sample`
- `apps/api/test/` - node:test API tests

## Philosophy

- **Presence over conversion.** Preserve intimacy and the deep-listening
  atmosphere. No growth-hack patterns, generic nightlife copy, or urgency tricks.
- **Guests are real people.** Their names, emails, and RSVPs are private. Never
  expose counts, rosters, or the location publicly; admin data stays behind
  `ADMIN_SECRET`.
- **Capacity is felt, not counted.** The public sees "nearing capacity" or
  "full" at 15; real numbers (18 hard cap) live in admin only.
- **Never stale.** A friend who opens the site after a deploy must get the new
  build. Cache headers and the version check are part of the product.
- **High production, low ceremony.** The public experience is intentional and
  crafted; returning guests shouldn't have to redo the whole ritual.

## TODO

- [ ] A separate Supabase project for Vercel preview deploys, so previews never write live rows (local dev is covered by `dev:sample`)
- [ ] A test Resend key or a dry-run mode for Vercel previews (local dev is covered by `dev:sample`)
- [ ] Tests for admin settings, archive, attendance, and the blast route (with email stubbed)
- [ ] Tests for auth sessions and the visitor cookie
- [ ] Web tests: a Playwright smoke test of arrival -> waitlist join -> RSVP against a stubbed API
- [ ] A test that the built web bundle never contains `PORTAL_LOCATION_PRIVATE` or admin secrets
- [ ] Real lint for `apps/web` and `apps/api` (both are stubs today), then add it to `npm run check`
- [ ] Split `App.jsx` and `adminPortal.js` into smaller pieces once tests cover them
