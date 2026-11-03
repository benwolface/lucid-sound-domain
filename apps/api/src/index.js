require("dotenv").config();

// Agents (Claude Code sets CLAUDECODE) run `npm run dev:sample`, never the live
// Supabase project or Resend. LSD_ALLOW_LIVE=1 is the human's override.
if (process.env.CLAUDECODE && !process.env.LSD_SANDBOX && !process.env.LSD_ALLOW_LIVE) {
  console.error(
    "[api] Refusing to start against live Supabase/Resend from an agent session. " +
      "Use `npm run dev:sample`, or set LSD_ALLOW_LIVE=1 with the user's OK."
  );
  process.exit(1);
}
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

