const { randomUUID, randomBytes } = require("node:crypto");

function generateReferralCode() {
  return randomBytes(5).toString("hex"); // 10-char hex, e.g. "a3f8b29c1d"
}
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

function createStore() {
  return {
    usersById: new Map(),
    usersByEmail: new Map(),
    visitorsById: new Map(),
    sessionsByTokenHash: new Map(),
    waitlistByEmail: new Map(),
    waitlistByPhone: new Map(),
    waitlistByName: new Map(),
    events: []
  };
}

const globalStore = globalThis;
const store = globalStore.__lucidStore || createStore();

if (!globalStore.__lucidStore) {
  globalStore.__lucidStore = store;
}

function createVisitor(id) {
  const visitor = {
    id,
    userId: null,
    createdAt: new Date(),
    updatedAt: new Date()
  };
  store.visitorsById.set(id, visitor);
  return visitor;
}

async function findVisitorById(id) {
  return store.visitorsById.get(id) ?? null;
}

async function ensureVisitor(id) {
  return (await findVisitorById(id)) || createVisitor(id);
}

async function attachVisitorUser(visitorId, userId) {
  const visitor = await findVisitorById(visitorId);
  if (!visitor) return null;
  visitor.userId = userId;
  visitor.updatedAt = new Date();
  return visitor;
}

async function upsertUser({ email, name, idFactory }) {
  const existingId = store.usersByEmail.get(email);
  if (existingId) {
    const user = store.usersById.get(existingId);
    user.name = name;
    user.updatedAt = new Date();
    return user;
  }

  const user = {
    id: idFactory(),
    email,
    name,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  store.usersById.set(user.id, user);
  store.usersByEmail.set(email, user.id);
  return user;
}

async function createSession({ id, tokenHash, userId, expiresAt }) {
  const session = {
    id,
    tokenHash,
    userId,
    expiresAt: new Date(expiresAt),
    createdAt: new Date()
  };
  store.sessionsByTokenHash.set(tokenHash, session);
  return session;
}

async function findSessionWithUser(tokenHash) {
  const session = store.sessionsByTokenHash.get(tokenHash);
  if (!session) return null;

  const user = store.usersById.get(session.userId);
  if (!user) return null;

  return {
    ...session,
    user
  };
}

async function deleteSessionByTokenHash(tokenHash) {
  store.sessionsByTokenHash.delete(tokenHash);
}

async function createEvent({
  id = randomUUID(),
  visitorId,
  userId = null,
  type,
  properties = null,
  ip,
  userAgent
}) {
  const event = {
    id,
    visitorId,
    userId,
    type,
    properties,
    ip: ip ?? null,
    userAgent: userAgent ?? null,
    createdAt: new Date()
  };
  store.events.push(event);
  return event;
}

async function findWaitlistEntry({ email = null, phone = null }) {
  if (email) return store.waitlistByEmail.get(email) ?? null;
  if (phone) return store.waitlistByPhone.get(phone) ?? null;
  return null;
}

async function createWaitlistEntry({ name = null, email = null, phone = null }) {
  const entry = {
    id: randomUUID(),
    name,
    email,
    phone,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  if (email) store.waitlistByEmail.set(email, entry);
  if (phone) store.waitlistByPhone.set(phone, entry);
  if (name) store.waitlistByName.set(name.toLowerCase().trim(), entry);
  return entry;
}

async function findWaitlistEntryByName(name) {
  return store.waitlistByName.get(name.toLowerCase().trim()) ?? null;
}

// ---------- Participants (Supabase) ----------

async function findParticipant({ name, phone }) {
  const { data } = await supabase
    .from("participants")
    .select("id, name, phone_number, referrals, referred_by")
    .eq("phone_number", phone)
    .ilike("name", name)
    .maybeSingle();
  return data ?? null;
}

async function findParticipantByPhone(phone) {
  const { data } = await supabase
    .from("participants")
    .select("id, name, phone_number, referrals, referred_by")
    .eq("phone_number", phone)
    .maybeSingle();
  return data ?? null;
}

async function findParticipantByName(name) {
  const { data } = await supabase
    .from("participants")
    .select("id, name, referral_code")
    .ilike("name", name)
    .maybeSingle();
  return data ?? null;
}

async function findParticipantByReferralCode(code) {
  const { data } = await supabase
    .from("participants")
    .select("id, name, referral_code")
    .eq("referral_code", code)
    .maybeSingle();
  return data ?? null;
}

async function createParticipant({ name, phone, referredBy = null }) {
  const referral_code = generateReferralCode();
  const { data, error } = await supabase
    .from("participants")
    .insert({ name, phone_number: phone, referred_by: referredBy, referral_code })
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function getAllParticipants() {
  const { data, error } = await supabase
    .from("participants")
    .select("id, name, phone_number, referral_code, referred_by, created_at")
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

async function getSettings() {
  const { data, error } = await supabase
    .from("app_settings")
    .select("im_here_enabled, next_portal_date, upcoming_portal_date")
    .single();
  if (error) throw error;
  return data;
}

async function updateImHereEnabled(enabled) {
  const { error } = await supabase
    .from("app_settings")
    .update({ im_here_enabled: enabled })
    .eq("id", true);
  if (error) throw error;
}

async function updatePortalDates({ nextPortalDate, upcomingPortalDate }) {
  const updates = {};
  if (nextPortalDate !== undefined) updates.next_portal_date = nextPortalDate || null;
  if (upcomingPortalDate !== undefined) updates.upcoming_portal_date = upcomingPortalDate || null;
  const { error } = await supabase
    .from("app_settings")
    .update(updates)
    .eq("id", true);
  if (error) throw error;
}

async function logBlast({ message, sent, failed, total, dryRun, results }) {
  const { error } = await supabase
    .from("blast_logs")
    .insert({ message, sent, failed, total, dry_run: dryRun, results });
  if (error) console.error("[logBlast]", error);
}

async function getBlastLogs() {
  const { data, error } = await supabase
    .from("blast_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw error;
  return data ?? [];
}

module.exports = {
  attachVisitorUser,
  createEvent,
  createParticipant,
  createSession,
  createWaitlistEntry,
  deleteSessionByTokenHash,
  ensureVisitor,
  findParticipant,
  findParticipantByName,
  findParticipantByPhone,
  findParticipantByReferralCode,
  findSessionWithUser,
  findVisitorById,
  findWaitlistEntry,
  findWaitlistEntryByName,
  getAllParticipants,
  getBlastLogs,
  getSettings,
  logBlast,
  updateImHereEnabled,
  updatePortalDates,
  upsertUser
};
