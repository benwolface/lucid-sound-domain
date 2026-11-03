// Test harness for the LSD API.
//
// Preview and Production share one Supabase project and one Resend key, so
// tests must never reach either. `src/sandbox.js` blanks the credentials and
// swaps `src/store.js` for the in-memory sample store before the app loads.
const { configure } = require("../src/sandbox");

const fakeStore = configure();
process.env.ADMIN_SECRET = "test-admin-secret";
process.env.PORTAL_LOCATION_PRIVATE = "test location";
process.env.NODE_ENV = "test";

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
  const { db } = fakeStore;
  for (const key of Object.keys(db)) {
    if (Array.isArray(db[key])) db[key].length = 0;
    else if (db[key] instanceof Map) db[key].clear();
  }
  db.settings = {};
}

module.exports = { fakeStore, startServer, resetStore };
