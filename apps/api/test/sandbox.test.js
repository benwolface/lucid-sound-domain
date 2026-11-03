const { test, before, after, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const { fakeStore, startServer, resetStore } = require("./helpers");
const { seed } = require("../src/sandbox");

let server;
let request;

before(async () => {
  ({ server, request } = await startServer());
});
after(() => server.close());
beforeEach(resetStore);

test("the sample store implements every export of the real store", () => {
  // The real store is swapped out of require's cache, so read its export list.
  const source = fs.readFileSync(path.join(__dirname, "../src/store.js"), "utf8");
  const block = source.slice(source.lastIndexOf("module.exports"));
  const realExports = [...block.matchAll(/^\s+(\w+),?$/gm)].map((m) => m[1]);

  assert.ok(realExports.length > 30);
  for (const name of realExports) {
    assert.equal(typeof fakeStore[name], "function", `sample store is missing ${name}`);
  }
});

test("seeded sample data serves the public and admin flows", async () => {
  const { guests } = await seed(fakeStore);

  const rsvp = await request(`/api/rsvp/status?ref=${guests[0].referral_code}`);
  assert.equal(rsvp.status, 200);

  const admin = await request("/api/admin/participants", { headers: { "x-admin-secret": process.env.ADMIN_SECRET } });
  assert.equal(admin.status, 200);
  assert.ok(JSON.stringify(await admin.json()).includes("ari@example.com"));
});

function startApi(env) {
  return spawnSync(process.execPath, [path.join(__dirname, "../src/index.js")], {
    env: { PATH: process.env.PATH, ...env },
    encoding: "utf8",
    timeout: 5000,
  });
}

test("an agent cannot start the API against live services", () => {
  const result = startApi({ CLAUDECODE: "1" });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /dev:sample/);
});
