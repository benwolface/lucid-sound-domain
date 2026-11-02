const { test, before, after, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const { fakeStore, startServer, resetStore } = require("./helpers");
const { PUBLIC_CAP } = require("../src/routes/rsvp");

let server;
let request;

before(async () => {
  ({ server, request } = await startServer());
});
after(() => server.close());
beforeEach(resetStore);

async function join(name, contact) {
  const res = await request("/api/waitlist", { method: "POST", body: { name, contact } });
  return res.json();
}

test("health responds", async () => {
  const res = await request("/api/health");
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { ok: true, service: "api" });
});

test("unknown routes are json 404s", async () => {
  const res = await request("/api/nope");
  assert.equal(res.status, 404);
  assert.deepEqual(await res.json(), { error: "not_found" });
});

test("waitlist: join, then the same person is already joined", async () => {
  const first = await join("Ada", "ada@example.com");
  assert.equal(first.status, "joined");

  const again = await join("Ada", "ADA@example.com");
  assert.equal(again.status, "already_joined");
  assert.equal(again.referralCode, first.referralCode);
  assert.equal(fakeStore.db.participants.length, 1);
});

test("waitlist: rejects a bad email", async () => {
  const res = await request("/api/waitlist", { method: "POST", body: { name: "Ada", contact: "nope" } });
  assert.equal(res.status, 400);
});

test("admin routes need the secret", async () => {
  assert.equal((await request("/api/admin/participants")).status, 401);
  assert.equal(
    (await request("/api/admin/participants", { headers: { "x-admin-secret": "wrong" } })).status,
    401,
  );
  const ok = await request("/api/admin/participants", { headers: { "x-admin-secret": "test-admin-secret" } });
  assert.equal(ok.status, 200);
});

test("private location only goes to a known referral code", async () => {
  assert.equal((await request("/api/settings/private")).status, 401);
  assert.equal((await request("/api/settings/private?ref=unknown")).status, 404);

  const { referralCode } = await join("Ada", "ada@example.com");
  const res = await request(`/api/settings/private?ref=${referralCode}`);
  assert.deepEqual(await res.json(), { portalLocation: "test location" });
});

test("rsvp is closed when no portal date is set", async () => {
  const res = await request("/api/rsvp/status");
  assert.equal((await res.json()).open, false);
});

test("rsvp: public capacity never leaks the real count, and caps at PUBLIC_CAP", async () => {
  fakeStore.db.settings = { next_portal_date: "2026-12-01" };
  const codes = [];
  for (let i = 0; i < PUBLIC_CAP + 1; i++) {
    codes.push((await join(`Guest ${i}`, `g${i}@example.com`)).referralCode);
  }

  for (const code of codes.slice(0, PUBLIC_CAP)) {
    const res = await request("/api/rsvp", { method: "POST", body: { referralCode: code, response: "attending" } });
    assert.equal((await res.json()).status, "ok");
  }

  const late = await request("/api/rsvp", {
    method: "POST",
    body: { referralCode: codes[PUBLIC_CAP], response: "attending" },
  });
  assert.equal((await late.json()).status, "full");

  const status = await (await request("/api/rsvp/status")).json();
  assert.equal(status.full, true);
  assert.equal(Object.keys(status).includes("count"), false);
});

test("rsvp: someone already attending can re-confirm when full", async () => {
  fakeStore.db.settings = { next_portal_date: "2026-12-01" };
  const codes = [];
  for (let i = 0; i < PUBLIC_CAP; i++) {
    const code = (await join(`Guest ${i}`, `g${i}@example.com`)).referralCode;
    codes.push(code);
    await request("/api/rsvp", { method: "POST", body: { referralCode: code, response: "attending" } });
  }

  const res = await request("/api/rsvp", { method: "POST", body: { referralCode: codes[0], response: "attending" } });
  assert.equal((await res.json()).status, "ok");
});
