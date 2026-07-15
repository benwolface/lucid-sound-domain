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

async function findParticipant({ name, email }) {
  const { data } = await supabase
    .from("participants")
    .select("id, name, email, referral_code, referrals, referred_by")
    .eq("email", email)
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

async function findParticipantByEmail(email) {
  const { data } = await supabase
    .from("participants")
    .select("id, name, email, referrals, referred_by")
    .eq("email", email)
    .maybeSingle();
  return data ?? null;
}

async function findParticipantByName(name) {
  const { data } = await supabase
    .from("participants")
    .select("id, name, email, referral_code")
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

async function confirmParticipantEmail(referralCode) {
  const { error } = await supabase
    .from("participants")
    .update({ email_confirmed_at: new Date().toISOString() })
    .eq("referral_code", referralCode)
    .is("email_confirmed_at", null);
  if (error) throw error;
}

async function createParticipant({ name, email, phone = null, referredBy = null }) {
  const referral_code = generateReferralCode();
  const { data, error } = await supabase
    .from("participants")
    .insert({ name, email: email || null, phone_number: phone || null, referred_by: referredBy, referral_code })
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function updateParticipantEmail({ referralCode, email }) {
  const { error } = await supabase
    .from("participants")
    .update({ email })
    .eq("referral_code", referralCode);
  if (error) throw error;
}

async function getAllParticipants() {
  const { data, error } = await supabase
    .from("participants")
    .select("id, name, email, phone_number, referral_code, referred_by, created_at")
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

async function getSettings() {
  const { data, error } = await supabase
    .from("app_settings")
    .select("im_here_enabled, next_portal_date, upcoming_portal_date, next_portal_guest, upcoming_portal_guest, artist1_name, artist1_bio, artist2_name, artist2_bio, artist1_photo_url, artist2_photo_url")
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

async function updatePortalDates({ nextPortalDate, upcomingPortalDate, nextPortalGuest, upcomingPortalGuest }) {
  const updates = {};
  if (nextPortalDate !== undefined) updates.next_portal_date = nextPortalDate || null;
  if (upcomingPortalDate !== undefined) updates.upcoming_portal_date = upcomingPortalDate || null;
  if (nextPortalGuest !== undefined) updates.next_portal_guest = nextPortalGuest || null;
  if (upcomingPortalGuest !== undefined) updates.upcoming_portal_guest = upcomingPortalGuest || null;
  const { error } = await supabase
    .from("app_settings")
    .update(updates)
    .eq("id", true);
  if (error) throw error;
}

async function updateArtists({ artist1Name, artist1Bio, artist2Name, artist2Bio }) {
  const updates = {};
  if (artist1Name !== undefined) updates.artist1_name = artist1Name || null;
  if (artist1Bio !== undefined) updates.artist1_bio = artist1Bio || null;
  if (artist2Name !== undefined) updates.artist2_name = artist2Name || null;
  if (artist2Bio !== undefined) updates.artist2_bio = artist2Bio || null;
  const { error } = await supabase.from("app_settings").update(updates).eq("id", true);
  if (error) throw error;
}

async function updateArtistPhotoUrl({ artist, url }) {
  const field = artist === "1" ? "artist1_photo_url" : "artist2_photo_url";
  const { error } = await supabase
    .from("app_settings")
    .update({ [field]: url || null })
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

// ---------- Archive (Supabase) ----------

function archivePublicUrl(storagePath) {
  const {
    data: { publicUrl },
  } = supabase.storage.from("archive").getPublicUrl(storagePath);
  return publicUrl;
}

async function getArchiveItems() {
  const { data, error } = await supabase
    .from("archive_items")
    .select("id, type, storage_path, caption, created_at")
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((item) => ({
    id: item.id,
    type: item.type,
    caption: item.caption,
    url: archivePublicUrl(item.storage_path),
  }));
}

async function createArchiveItem({ type, storagePath, caption = null }) {
  const { data, error } = await supabase
    .from("archive_items")
    .insert({ type, storage_path: storagePath, caption })
    .select()
    .single();
  if (error) throw error;
  return { id: data.id, type: data.type, caption: data.caption, url: archivePublicUrl(data.storage_path) };
}

async function updateArchiveCaption({ id, caption }) {
  const { error } = await supabase
    .from("archive_items")
    .update({ caption: caption || null })
    .eq("id", id);
  if (error) throw error;
}

async function deleteArchiveItem(id) {
  const { data, error } = await supabase
    .from("archive_items")
    .delete()
    .eq("id", id)
    .select()
    .maybeSingle();
  if (error) throw error;
  if (data?.storage_path) {
    const { error: storageError } = await supabase.storage
      .from("archive")
      .remove([data.storage_path]);
    if (storageError) console.error("[deleteArchiveItem] storage:", storageError);
  }
}

// ---------- RSVPs (Supabase) ----------

async function countAttending(portalDate) {
  const { count, error } = await supabase
    .from("rsvps")
    .select("id", { count: "exact", head: true })
    .eq("portal_date", portalDate)
    .eq("status", "attending");
  if (error) throw error;
  return count ?? 0;
}

async function getRsvp({ participantId, portalDate }) {
  const { data, error } = await supabase
    .from("rsvps")
    .select("id, status")
    .eq("participant_id", participantId)
    .eq("portal_date", portalDate)
    .maybeSingle();
  if (error) throw error;
  return data ?? null;
}

async function upsertRsvp({ participantId, portalDate, status }) {
  const { error } = await supabase
    .from("rsvps")
    .upsert(
      {
        participant_id: participantId,
        portal_date: portalDate,
        status,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "participant_id,portal_date" }
    );
  if (error) throw error;
}

async function getRsvpRoster(portalDate) {
  const { data, error } = await supabase
    .from("rsvps")
    .select("id, status, created_at, updated_at, participants(name, email, phone_number)")
    .eq("portal_date", portalDate)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((r) => ({
    id: r.id,
    status: r.status,
    respondedAt: r.created_at,
    name: r.participants?.name ?? null,
    email: r.participants?.email ?? null,
    phone: r.participants?.phone_number ?? null,
  }));
}

module.exports = {
  attachVisitorUser,
  countAttending,
  confirmParticipantEmail,
  createArchiveItem,
  createEvent,
  createParticipant,
  createSession,
  createWaitlistEntry,
  deleteArchiveItem,
  deleteSessionByTokenHash,
  ensureVisitor,
  findParticipant,
  findParticipantByEmail,
  findParticipantByName,
  findParticipantByPhone,
  findParticipantByReferralCode,
  findSessionWithUser,
  findVisitorById,
  findWaitlistEntry,
  findWaitlistEntryByName,
  getAllParticipants,
  getArchiveItems,
  getBlastLogs,
  getRsvp,
  getRsvpRoster,
  getSettings,
  logBlast,
  upsertRsvp,
  updateArchiveCaption,
  updateArtistPhotoUrl,
  updateArtists,
  updateImHereEnabled,
  updateParticipantEmail,
  updatePortalDates,
  upsertUser
};
