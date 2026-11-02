// Test harness for the LSD API.
//
// Preview and Production share one Supabase project and one Resend key, so
// tests must never reach either. This swaps `src/store.js` for an in-memory
// fake before the app loads (routes destructure the store at require time),
// and blanks the env that would let a real .env fill in credentials.
const path = require("node:path");

process.env.SUPABASE_URL = "http://127.0.0.1:1"; // unroutable; nothing should call it
process.env.SUPABASE_ANON_KEY = "test";
process.env.RESEND_API_KEY = ""; // present-but-empty: dotenv won't override, routes skip email
process.env.ADMIN_SECRET = "test-admin-secret";
process.env.PORTAL_LOCATION_PRIVATE = "test location";
process.env.NODE_ENV = "test";

function createFakeStore() {
  const db = { participants: [], visitors: new Map(), rsvps: new Map(), settings: {} };
  let nextId = 1;
  const rsvpKey = (participantId, portalDate) => `${participantId}:${portalDate}`;
  const lower = (s) => (s || "").toLowerCase().trim();

  const store = {
    db,
    async ensureVisitor(id) {
      const v = { id };
      db.visitors.set(id, v);
      return v;
    },
    async findVisitorById(id) {
      return db.visitors.get(id) ?? null;
    },
    async findSessionWithUser() {
      return null;
    },
    async deleteSessionByTokenHash() {},
    async getSettings() {
      return db.settings;
    },
    async createParticipant({ name, email, referredBy }) {
      const p = { id: nextId++, name, email, referred_by: referredBy, referral_code: `ref${nextId}abcdefg` };
      db.participants.push(p);
      return p;
    },
    async findParticipant({ name, email }) {
      return db.participants.find((p) => lower(p.name) === lower(name) && lower(p.email) === lower(email)) ?? null;
    },
    async findParticipantByEmail(email) {
      return db.participants.find((p) => lower(p.email) === lower(email)) ?? null;
    },
    async findParticipantByName(name) {
      return db.participants.find((p) => lower(p.name) === lower(name)) ?? null;
    },
    async findParticipantByReferralCode(code) {
      return db.participants.find((p) => p.referral_code === code) ?? null;
    },
    async getAllParticipants() {
      return db.participants;
    },
    async getRsvp({ participantId, portalDate }) {
      return db.rsvps.get(rsvpKey(participantId, portalDate)) ?? null;
    },
    async upsertRsvp({ participantId, portalDate, status }) {
      db.rsvps.set(rsvpKey(participantId, portalDate), { participantId, portalDate, status });
    },
    async countAttending(portalDate) {
      return [...db.rsvps.values()].filter((r) => r.portalDate === portalDate && r.status === "attending").length;
    },
  };

  // Any store function a test didn't fake fails loudly instead of hitting Supabase.
  const real = require.resolve("../src/store");
  return new Proxy(store, {
    get(target, prop) {
      if (prop in target) return target[prop];
      if (typeof prop === "symbol") return undefined;
      return async () => {
        throw new Error(`fake store: ${String(prop)} not implemented (${path.basename(real)})`);
      };
    },
  });
}

const fakeStore = createFakeStore();
const storePath = require.resolve("../src/store");
require.cache[storePath] = { id: storePath, filename: storePath, loaded: true, exports: fakeStore };

const { createApp } = require("../src/app");

async function startServer() {
  const server = createApp().listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const request = (route, { method = "GET", body, headers = {} } = {}) =>
    fetch(base + route, {
      method,
      headers: { "Content-Type": "application/json", ...headers },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  return { server, request };
}

function resetStore() {
  fakeStore.db.participants.length = 0;
  fakeStore.db.visitors.clear();
  fakeStore.db.rsvps.clear();
  fakeStore.db.settings = {};
}

module.exports = { fakeStore, startServer, resetStore };
