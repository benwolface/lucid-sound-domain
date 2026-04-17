const { Router } = require("express");
const { z } = require("zod");
const { randomUUID: nanoid } = require("node:crypto");

const { sha256, randomToken } = require("../lib/crypto");
const {
  attachVisitorUser,
  createEvent,
  createSession,
  deleteSessionByTokenHash,
  upsertUser
} = require("../store");

const sessionCookieName = "lucid_session";
const SESSION_DAYS = process.env.SESSION_DAYS
  ? Number(process.env.SESSION_DAYS)
  : 7;

function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60 * 1000
  };
}

function authRouter() {
  const router = Router();

  router.post("/signin", async (req, res, next) => {
    try {
      const schema = z.object({
        email: z.string().email(),
        name: z.string().min(1).max(120)
      });

      const { email, name } = schema.parse(req.body);
      const normalizedEmail = email.trim().toLowerCase();

      const user = await upsertUser({
        email: normalizedEmail,
        name,
        idFactory: nanoid
      });

      const rawToken = randomToken(32);
      const tokenHash = sha256(rawToken);
      const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);

      await createSession({
        id: nanoid(),
        tokenHash,
        userId: user.id,
        expiresAt
      });

      // Link visitor -> user for continuity.
      if (req.visitor?.id) {
        await attachVisitorUser(req.visitor.id, user.id);
      }

      // Record sign-in event.
      if (req.visitor?.id) {
        await createEvent({
          id: nanoid(),
          visitorId: req.visitor.id,
          userId: user.id,
          type: "sign_in",
          properties: JSON.stringify({ provider: "email_name" }),
          ip: req.ip,
          userAgent: req.headers["user-agent"]
        });
      }

      res.cookie(sessionCookieName, rawToken, sessionCookieOptions());

      res.json({
        user: {
          id: user.id,
          email: user.email,
          name: user.name
        }
      });
    } catch (e) {
      next(e);
    }
  });

  router.post("/signout", async (req, res, next) => {
    try {
      const rawSessionToken = req.cookies?.[sessionCookieName];
      if (rawSessionToken && typeof rawSessionToken === "string") {
        const tokenHash = sha256(rawSessionToken);
        await deleteSessionByTokenHash(tokenHash);
      }

      res.clearCookie(sessionCookieName, { path: "/" });
      res.status(200).json({ ok: true });
    } catch (e) {
      next(e);
    }
  });

  return router;
}

module.exports = { authRouter };
