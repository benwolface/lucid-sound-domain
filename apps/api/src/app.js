const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const dotenv = require("dotenv");

const { attachVisitor } = require("./middleware/visitor");
const { attachUser } = require("./middleware/auth");
const { authRouter } = require("./routes/auth");
const { trackRouter } = require("./routes/track");
const { meRouter } = require("./routes/me");
const { healthRouter } = require("./routes/health");
const { waitlistRouter } = require("./routes/waitlist");
const { adminRouter } = require("./routes/admin");
const { adminPortalRouter } = require("./routes/adminPortal");
const { archiveRouter } = require("./routes/archive");
const { rsvpRouter } = require("./routes/rsvp");
const { settingsRouter } = require("./routes/settings");

dotenv.config();

function createApp() {
  const app = express();

  // 4mb accounts for base64 inflating photo uploads by ~37% while staying under
  // Vercel's serverless function request body ceiling (~4.5mb).
  app.use(express.json({ limit: "4mb" }));
  app.use(cookieParser());

  // In dev we proxy the frontend to this API, but keeping CORS for safety.
  const webOrigin = process.env.WEB_ORIGIN;
  if (webOrigin) {
    app.use(
      cors({
        origin: webOrigin,
        credentials: true
      })
    );
  }

  // Ensure visitor cookie + visitor row always exists.
  app.use(attachVisitor());

  // Attach req.user (nullable) if session cookie is present.
  app.use(attachUser());

  app.use("/api/health", healthRouter());
  app.use("/api/auth", authRouter());
  app.use("/api/track", trackRouter());
  app.use("/api/me", meRouter());
  app.use("/api/waitlist", waitlistRouter());
  app.use("/api/admin", adminRouter());
  app.use("/api/archive", archiveRouter());
  app.use("/api/rsvp", rsvpRouter());
  app.use("/api/settings", settingsRouter());
  app.use("/api/admin-portal", adminPortalRouter());
  app.use("/admin", adminPortalRouter());

  // Basic 404
  app.use((req, res) => {
    res.status(404).json({ error: "not_found" });
  });

  // Body-parser errors (e.g. payload too large) land here instead of Express's default HTML page.
  app.use((err, req, res, next) => {
    if (err?.type === "entity.too.large") {
      return res.status(413).json({ error: "File is too large." });
    }
    console.error("[app]", err);
    return res.status(500).json({ error: "Something went wrong." });
  });

  return app;
}

module.exports = { createApp };

