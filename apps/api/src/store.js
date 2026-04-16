const { randomUUID } = require("node:crypto");

function createStore() {
  return {
    usersById: new Map(),
    usersByEmail: new Map(),
    visitorsById: new Map(),
    sessionsByTokenHash: new Map(),
    waitlistByEmail: new Map(),
    waitlistByPhone: new Map(),
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

async function createWaitlistEntry({ email = null, phone = null }) {
  const entry = {
    id: randomUUID(),
    email,
    phone,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  if (email) store.waitlistByEmail.set(email, entry);
  if (phone) store.waitlistByPhone.set(phone, entry);
  return entry;
}

module.exports = {
  attachVisitorUser,
  createEvent,
  createSession,
  createWaitlistEntry,
  deleteSessionByTokenHash,
  ensureVisitor,
  findSessionWithUser,
  findVisitorById,
  findWaitlistEntry,
  upsertUser
};
