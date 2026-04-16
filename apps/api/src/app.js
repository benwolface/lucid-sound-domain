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

dotenv.config();

function createApp() {
  const app = express();

  app.use(express.json({ limit: "1mb" }));
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

  // Basic 404
  app.use((req, res) => {
    res.status(404).json({ error: "not_found" });
  });

  return app;
}

module.exports = { createApp };

