// Throwaway environment for tests and `npm run dev:sample`.
//
// `configure()` blanks the credentials that would let a real .env reach the
// shared Supabase project or Resend, then swaps `store.js` for the in-memory
// sample store. It must run before `app.js` is required, because routes
// destructure the store at require time. dotenv never overrides a set
// variable, so present-but-empty values keep the real .env out.
const { createSampleStore } = require("./sampleStore");

const SAMPLE_PORT = 8788;
const SAMPLE_ADMIN_SECRET = "sample-admin";

function configure() {
  process.env.SUPABASE_URL = "http://127.0.0.1:1"; // unroutable; nothing should call it
  process.env.SUPABASE_ANON_KEY = "sample";
  process.env.RESEND_API_KEY = ""; // routes skip email without a key
  process.env.ADMIN_SECRET = SAMPLE_ADMIN_SECRET;
  process.env.PORTAL_LOCATION_PRIVATE = "Sample location (not the real one)";
  process.env.LSD_SANDBOX = "1";

  const store = createSampleStore();
  const storePath = require.resolve("./store");
  require.cache[storePath] = { id: storePath, filename: storePath, loaded: true, exports: store };
  return store;
}

function isoDate(daysFromNow) {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return d.toISOString().slice(0, 10);
}

// Ten sample guests, seven attending the next portal, one archive video, one
// past blast. Names are invented; emails use example.com.
async function seed(store) {
  const nextPortal = isoDate(14);
  Object.assign(store.db.settings, {
    im_here_enabled: false,
    next_portal_date: nextPortal,
    upcoming_portal_date: isoDate(42),
    next_portal_guest: "Sample Guest DJ",
    upcoming_portal_guest: null,
    artist1_name: "Sample Artist One",
    artist1_bio: "Placeholder bio for the sample env.",
    artist2_name: "Sample Artist Two",
    artist2_bio: "Placeholder bio for the sample env.",
    artist1_photo_url: null,
    artist2_photo_url: null,
  });

  const names = ["Ari", "Bea", "Cal", "Dev", "Eli", "Fen", "Gus", "Hana", "Ivo", "Juno"];
  const guests = [];
  for (const name of names) {
    const guest = await store.createParticipant({
      name: `${name} Sample`,
      email: `${name.toLowerCase()}@example.com`,
      referredBy: guests[0]?.referral_code ?? null,
    });
    guests.push(guest);
  }
  for (const guest of guests.slice(0, 7)) {
    await store.upsertRsvp({ participantId: guest.id, portalDate: nextPortal, status: "attending" });
  }
  await store.upsertRsvp({ participantId: guests[7].id, portalDate: nextPortal, status: "not_attending" });

  await store.createArchiveItem({ type: "youtube", storagePath: "dQw4w9WgXcQ", caption: "Sample archive video" });
  await store.logBlast({ message: "Sample blast (never sent)", sent: 0, failed: 0, total: 0, dryRun: true, results: [] });

  return { guests, nextPortal };
}

module.exports = { configure, seed, SAMPLE_PORT, SAMPLE_ADMIN_SECRET };
