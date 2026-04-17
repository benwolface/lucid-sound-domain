require("dotenv").config();
const { createApp } = require("./app");

// PORT is injected by Railway/Render; API_PORT for local dev
const port = Number(process.env.PORT || process.env.API_PORT || 8787);
const host = process.env.NODE_ENV === "production" ? "0.0.0.0" : "127.0.0.1";

try {
  const app = createApp();
  app.listen(port, host, () => {
    console.log(`[api] listening on http://${host}:${port}`);
  });
} catch (err) {
  console.error("[api] failed to start:", err);
  process.exit(1);
}

