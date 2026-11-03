// In-memory stand-in for `store.js`, shared by the tests and `npm run dev:sample`.
//
// Preview and Production share one Supabase project, so nothing here may reach
// it. Every export of the real store has an in-memory version below; a test
// keeps the two lists in sync.
const { randomUUID, randomBytes } = require("node:crypto");

function createSampleStore() {
  const db = {
    participants: [],
    visitors: new Map(),
    users: new Map(),
    sessions: new Map(),
    waitlist: [],
    events: [],
    rsvps: new Map(),
    archive: [],
    blastLogs: [],
    settings: {},
  };
  let nextId = 1;
  const rsvpKey = (participantId, portalDate) => `${participantId}:${portalDate}`;
  const lower = (s) => (s || "").toLowerCase().trim();
  const byCode = (code) => db.participants.find((p) => p.referral_code === code);

  return {
    db,

    // Visitors, users, sessions, events, waitlist (in memory in the real store too)
    async ensureVisitor(id) {
      if (!db.visitors.has(id)) db.visitors.set(id, { id, userId: null, createdAt: new Date() });
      return db.visitors.get(id);
    },
    async findVisitorById(id) {
      return db.visitors.get(id) ?? null;
    },
    async attachVisitorUser(visitorId, userId) {
      const visitor = db.visitors.get(visitorId);
      if (visitor) visitor.userId = userId;
      return visitor ?? null;
    },
    async upsertUser({ email, name, idFactory }) {
      const existing = [...db.users.values()].find((u) => u.email === email);
      if (existing) return Object.assign(existing, { name });
      const user = { id: idFactory(), email, name, createdAt: new Date() };
      db.users.set(user.id, user);
      return user;
    },
    async createSession({ id, tokenHash, userId, expiresAt }) {
      const session = { id, tokenHash, userId, expiresAt: new Date(expiresAt), createdAt: new Date() };
      db.sessions.set(tokenHash, session);
      return session;
    },
    async findSessionWithUser(tokenHash) {
      const session = db.sessions.get(tokenHash);
      const user = session && db.users.get(session.userId);
      return user ? { ...session, user } : null;
    },
    async deleteSessionByTokenHash(tokenHash) {
      db.sessions.delete(tokenHash);
    },
    async createEvent(event) {
      const row = { id: randomUUID(), createdAt: new Date(), ...event };
      db.events.push(row);
      return row;
    },
    async findWaitlistEntry({ email = null, phone = null }) {
      return db.waitlist.find((w) => (email && w.email === email) || (phone && w.phone === phone)) ?? null;
    },
    async createWaitlistEntry({ name = null, email = null, phone = null }) {
      const entry = { id: randomUUID(), name, email, phone, createdAt: new Date() };
      db.waitlist.push(entry);
      return entry;
    },
    async findWaitlistEntryByName(name) {
      return db.waitlist.find((w) => lower(w.name) === lower(name)) ?? null;
    },

    // Participants
    async createParticipant({ name, email, phone = null, referredBy = null }) {
      const p = {
        id: nextId++,
        name,
        email: email || null,
        phone_number: phone || null,
        referred_by: referredBy,
        referral_code: randomBytes(5).toString("hex"),
        email_confirmed_at: null,
        created_at: new Date().toISOString(),
      };
      db.participants.push(p);
      return p;
    },
    async findParticipant({ name, email }) {
      return db.participants.find((p) => lower(p.name) === lower(name) && lower(p.email) === lower(email)) ?? null;
    },
    async findParticipantByEmail(email) {
      return db.participants.find((p) => lower(p.email) === lower(email)) ?? null;
    },
    async findParticipantByPhone(phone) {
      return db.participants.find((p) => p.phone_number === phone) ?? null;
    },
    async findParticipantByName(name) {
      return db.participants.find((p) => lower(p.name) === lower(name)) ?? null;
    },
    async findParticipantByReferralCode(code) {
      return byCode(code) ?? null;
    },
    async confirmParticipantEmail(referralCode) {
      const p = byCode(referralCode);
      if (p && !p.email_confirmed_at) p.email_confirmed_at = new Date().toISOString();
    },
    async updateParticipantEmail({ referralCode, email }) {
      const p = byCode(referralCode);
      if (p) p.email = email;
    },
    async getAllParticipants() {
      return db.participants;
    },

    // Settings
    async getSettings() {
      return db.settings;
    },
    async updateImHereEnabled(enabled) {
      db.settings.im_here_enabled = enabled;
    },
    async updatePortalDates({ nextPortalDate, upcomingPortalDate, nextPortalGuest, upcomingPortalGuest }) {
      if (nextPortalDate !== undefined) db.settings.next_portal_date = nextPortalDate || null;
      if (upcomingPortalDate !== undefined) db.settings.upcoming_portal_date = upcomingPortalDate || null;
      if (nextPortalGuest !== undefined) db.settings.next_portal_guest = nextPortalGuest || null;
      if (upcomingPortalGuest !== undefined) db.settings.upcoming_portal_guest = upcomingPortalGuest || null;
    },
    async updateArtists({ artist1Name, artist1Bio, artist2Name, artist2Bio }) {
      if (artist1Name !== undefined) db.settings.artist1_name = artist1Name || null;
      if (artist1Bio !== undefined) db.settings.artist1_bio = artist1Bio || null;
      if (artist2Name !== undefined) db.settings.artist2_name = artist2Name || null;
      if (artist2Bio !== undefined) db.settings.artist2_bio = artist2Bio || null;
    },
    async updateArtistPhotoUrl({ artist, url }) {
      db.settings[artist === "1" ? "artist1_photo_url" : "artist2_photo_url"] = url || null;
    },

    // Blasts (the sample env has no Resend key, so nothing is ever sent)
    async logBlast({ message, sent, failed, total, dryRun, results }) {
      db.blastLogs.unshift({ id: randomUUID(), message, sent, failed, total, dry_run: dryRun, results, created_at: new Date().toISOString() });
    },
    async getBlastLogs() {
      return db.blastLogs.slice(0, 50);
    },

    // Archive (YouTube items only; there is no storage bucket here)
    async getArchiveItems() {
      return db.archive;
    },
    async createArchiveItem({ type, storagePath, caption = null }) {
      const item = {
        id: randomUUID(),
        type,
        caption,
        url: type === "youtube" ? `https://www.youtube.com/embed/${storagePath}` : `/sample-archive/${storagePath}`,
        thumb: type === "youtube" ? `https://img.youtube.com/vi/${storagePath}/hqdefault.jpg` : null,
      };
      db.archive.push(item);
      return item;
    },
    async updateArchiveCaption({ id, caption }) {
      const item = db.archive.find((a) => a.id === id);
      if (item) item.caption = caption || null;
    },
    async deleteArchiveItem(id) {
      db.archive = db.archive.filter((a) => a.id !== id);
    },

    // RSVPs
    async countAttending(portalDate) {
      return [...db.rsvps.values()].filter((r) => r.portalDate === portalDate && r.status === "attending").length;
    },
    async getRsvp({ participantId, portalDate }) {
      return db.rsvps.get(rsvpKey(participantId, portalDate)) ?? null;
    },
    async upsertRsvp({ participantId, portalDate, status }) {
      const key = rsvpKey(participantId, portalDate);
      const createdAt = db.rsvps.get(key)?.createdAt ?? new Date().toISOString();
      db.rsvps.set(key, { id: key, participantId, portalDate, status, createdAt });
    },
    async clearRsvps(portalDate) {
      for (const [key, r] of db.rsvps) if (r.portalDate === portalDate) db.rsvps.delete(key);
    },
    async getRsvpRoster(portalDate) {
      return [...db.rsvps.values()]
        .filter((r) => r.portalDate === portalDate)
        .map((r) => {
          const p = db.participants.find((x) => x.id === r.participantId) ?? {};
          return { id: r.id, status: r.status, respondedAt: r.createdAt, name: p.name ?? null, email: p.email ?? null, phone: p.phone_number ?? null };
        });
    },
  };
}

module.exports = { createSampleStore };
