const { Router } = require("express");
const { z } = require("zod");
const { getAllParticipants, getBlastLogs, logBlast, getSettings, updateImHereEnabled, updatePortalDates, updateArtists } = require("../store");

function requireAdminSecret(req, res, next) {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) {
    return res.status(503).json({ error: "Admin routes are not configured." });
  }
  const provided = req.headers["x-admin-secret"];
  if (!provided || provided !== secret) {
    return res.status(401).json({ error: "Unauthorized." });
  }
  next();
}

const blastSchema = z.object({
  message: z.string().min(1).max(1600),
  // optional allowlist — if omitted, sends to everyone
  phoneNumbers: z.array(z.string()).optional(),
});

function adminRouter() {
  const router = Router();

  router.use(requireAdminSecret);

  // GET /api/admin/participants — list everyone in the DB
  router.get("/participants", async (req, res) => {
    try {
      const participants = await getAllParticipants();
      return res.json({ count: participants.length, participants });
    } catch (err) {
      console.error("[admin/participants]", err);
      return res.status(500).json({ error: "Failed to fetch participants." });
    }
  });

  // GET /api/admin/settings — current settings
  router.get("/settings", async (req, res) => {
    try {
      const settings = await getSettings();
      return res.json({
        imHereEnabled: settings.im_here_enabled,
        nextPortalDate: settings.next_portal_date ?? null,
        upcomingPortalDate: settings.upcoming_portal_date ?? null,
        artist1Name: settings.artist1_name ?? null,
        artist1Bio: settings.artist1_bio ?? null,
        artist2Name: settings.artist2_name ?? null,
        artist2Bio: settings.artist2_bio ?? null,
      });
    } catch (err) {
      console.error("[admin/settings]", err);
      return res.status(500).json({ error: "Failed to fetch settings." });
    }
  });

  // POST /api/admin/settings — update settings
  router.post("/settings", async (req, res) => {
    const { imHereEnabled, nextPortalDate, upcomingPortalDate, artist1Name, artist1Bio, artist2Name, artist2Bio } = req.body;
    try {
      if (typeof imHereEnabled === "boolean") {
        await updateImHereEnabled(imHereEnabled);
      }
      if (nextPortalDate !== undefined || upcomingPortalDate !== undefined) {
        await updatePortalDates({ nextPortalDate, upcomingPortalDate });
      }
      if (artist1Name !== undefined || artist1Bio !== undefined || artist2Name !== undefined || artist2Bio !== undefined) {
        await updateArtists({ artist1Name, artist1Bio, artist2Name, artist2Bio });
      }
      const settings = await getSettings();
      return res.json({
        imHereEnabled: settings.im_here_enabled,
        nextPortalDate: settings.next_portal_date ?? null,
        upcomingPortalDate: settings.upcoming_portal_date ?? null,
        artist1Name: settings.artist1_name ?? null,
        artist1Bio: settings.artist1_bio ?? null,
        artist2Name: settings.artist2_name ?? null,
        artist2Bio: settings.artist2_bio ?? null,
      });
    } catch (err) {
      console.error("[admin/settings]", err);
      return res.status(500).json({ error: "Failed to update settings." });
    }
  });

  // GET /api/admin/blasts — blast history
  router.get("/blasts", async (req, res) => {
    try {
      const logs = await getBlastLogs();
      return res.json({ logs });
    } catch (err) {
      console.error("[admin/blasts]", err);
      return res.status(500).json({ error: "Failed to fetch blast logs." });
    }
  });

  // POST /api/admin/blast — send an SMS to selected participants
  // Body: { message: string, phoneNumbers?: string[], dryRun?: boolean }
  router.post("/blast", async (req, res) => {
    const parsed = blastSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "message is required (max 1600 chars)." });
    }

    const { message, phoneNumbers } = parsed.data;
    const dryRun = req.body.dryRun === true;

    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
      return res.status(503).json({ error: "Twilio credentials are not configured." });
    }
    if (!process.env.TWILIO_FROM) {
      return res.status(503).json({ error: "TWILIO_FROM is not configured." });
    }

    let participants;
    try {
      const all = await getAllParticipants();
      participants =
        phoneNumbers && phoneNumbers.length > 0
          ? all.filter((p) => phoneNumbers.includes(p.phone_number))
          : all;
    } catch (err) {
      console.error("[admin/blast] fetch participants:", err);
      return res.status(500).json({ error: "Failed to fetch participants." });
    }

    if (participants.length === 0) {
      return res.json({ sent: 0, failed: 0, dryRun, results: [] });
    }

    if (dryRun) {
      return res.json({
        dryRun: true,
        count: participants.length,
        recipients: participants.map((p) => ({ name: p.name, phone: p.phone_number })),
        message,
      });
    }

    const twilio = require("twilio")(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );

    const results = await Promise.allSettled(
      participants.map((p) =>
        twilio.messages
          .create({ to: p.phone_number, from: process.env.TWILIO_FROM, body: message })
          .then((msg) => ({ name: p.name, phone: p.phone_number, sid: msg.sid, status: "sent" }))
      )
    );

    const report = results.map((r, i) => {
      if (r.status === "fulfilled") return r.value;
      return {
        name: participants[i].name,
        phone: participants[i].phone_number,
        status: "failed",
        error: r.reason?.message ?? String(r.reason),
      };
    });

    const sent = report.filter((r) => r.status === "sent").length;
    const failed = report.filter((r) => r.status === "failed").length;

    console.log(`[admin/blast] sent=${sent} failed=${failed} total=${participants.length}`);

    // Fire-and-forget log to Supabase
    logBlast({ message, sent, failed, total: participants.length, dryRun: false, results: report })
      .catch((err) => console.error("[admin/blast] logBlast:", err));

    return res.json({ sent, failed, total: participants.length, results: report });
  });

  return router;
}

module.exports = { adminRouter };
