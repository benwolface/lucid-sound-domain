const { Router } = require("express");
const { z } = require("zod");
const { Resend } = require("resend");
const {
  getAllParticipants,
  getBlastLogs,
  logBlast,
  getSettings,
  updateImHereEnabled,
  updatePortalDates,
  updateArtists,
  updateArtistPhotoUrl,
} = require("../store");
const { createClient } = require("@supabase/supabase-js");
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY,
);

const BATCH_SIZE = 10;
const FROM_EMAIL = process.env.FROM_EMAIL || "portal@lucidsounddomain.com";
const FROM_NAME = process.env.FROM_NAME || "trytab";

function wrapEmail(raw) {
  // Normalize contenteditable div-per-line output into clean line breaks
  const normalized = raw
    .replace(/<div><br\s*\/?><\/div>/gi, "<br>")
    .replace(/<\/div><div>/gi, "<br>")
    .replace(/<div>/gi, "")
    .replace(/<\/div>/gi, "<br>");

  // Plain text version — Gmail uses this for Promotions scoring
  const text =
    normalized
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<li>/gi, "- ")
      .replace(/<\/li>/gi, "\n")
      .replace(/<ul>|<\/ul>|<ol>|<\/ol>/gi, "")
      .replace(/<[^>]+>/g, "")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/\n{3,}/g, "\n\n")
      .trim() + '\n\n---\nTo opt out, reply with "stop".';

  // Minimal HTML — no background color, no newsletter-style container
  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body style="font-family:Georgia,serif;font-size:16px;line-height:1.6;color:#1a1a1a;padding:24px 16px"><div style="max-width:560px">${normalized}<p style="margin-top:32px;font-size:12px;color:#aaa;border-top:1px solid #eee;padding-top:12px">To opt out, reply with "stop".</p></div></body></html>`;

  return { html, text };
}

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
  subject: z.string().min(1).max(200),
  html: z.string().min(1),
  // optional allowlist — if omitted, sends to everyone with an email
  emails: z.array(z.string().email()).optional(),
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
        nextPortalGuest: settings.next_portal_guest ?? null,
        upcomingPortalGuest: settings.upcoming_portal_guest ?? null,
        artist1Name: settings.artist1_name ?? null,
        artist1Bio: settings.artist1_bio ?? null,
        artist2Name: settings.artist2_name ?? null,
        artist2Bio: settings.artist2_bio ?? null,
        artist1PhotoUrl: settings.artist1_photo_url ?? null,
        artist2PhotoUrl: settings.artist2_photo_url ?? null,
      });
    } catch (err) {
      console.error("[admin/settings]", err);
      return res.status(500).json({ error: "Failed to fetch settings." });
    }
  });

  // POST /api/admin/settings — update settings
  router.post("/settings", async (req, res) => {
    const {
      imHereEnabled,
      nextPortalDate,
      upcomingPortalDate,
      nextPortalGuest,
      upcomingPortalGuest,
      artist1Name,
      artist1Bio,
      artist2Name,
      artist2Bio,
    } = req.body;
    try {
      if (typeof imHereEnabled === "boolean") {
        await updateImHereEnabled(imHereEnabled);
      }
      if (
        nextPortalDate !== undefined ||
        upcomingPortalDate !== undefined ||
        nextPortalGuest !== undefined ||
        upcomingPortalGuest !== undefined
      ) {
        await updatePortalDates({ nextPortalDate, upcomingPortalDate, nextPortalGuest, upcomingPortalGuest });
      }
      if (
        artist1Name !== undefined ||
        artist1Bio !== undefined ||
        artist2Name !== undefined ||
        artist2Bio !== undefined
      ) {
        await updateArtists({
          artist1Name,
          artist1Bio,
          artist2Name,
          artist2Bio,
        });
      }
      const settings = await getSettings();
      return res.json({
        imHereEnabled: settings.im_here_enabled,
        nextPortalDate: settings.next_portal_date ?? null,
        upcomingPortalDate: settings.upcoming_portal_date ?? null,
        nextPortalGuest: settings.next_portal_guest ?? null,
        upcomingPortalGuest: settings.upcoming_portal_guest ?? null,
        artist1Name: settings.artist1_name ?? null,
        artist1Bio: settings.artist1_bio ?? null,
        artist2Name: settings.artist2_name ?? null,
        artist2Bio: settings.artist2_bio ?? null,
        artist1PhotoUrl: settings.artist1_photo_url ?? null,
        artist2PhotoUrl: settings.artist2_photo_url ?? null,
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

  // POST /api/admin/blast — send an email to selected participants
  // Body: { subject: string, html: string, emails?: string[], dryRun?: boolean }
  router.post("/blast", async (req, res) => {
    const parsed = blastSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "subject and html are required." });
    }

    const { subject, html, emails: targetEmails } = parsed.data;
    const dryRun = req.body.dryRun === true;

    if (!process.env.RESEND_API_KEY) {
      return res
        .status(503)
        .json({ error: "RESEND_API_KEY is not configured." });
    }

    let participants;
    try {
      const all = await getAllParticipants();
      const withEmail = all.filter((p) => p.email);
      participants =
        targetEmails && targetEmails.length > 0
          ? withEmail.filter((p) => targetEmails.includes(p.email))
          : withEmail;
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
        recipients: participants.map((p) => ({ name: p.name, email: p.email })),
        subject,
      });
    }

    const resend = new Resend(process.env.RESEND_API_KEY);
    const report = [];

    for (let i = 0; i < participants.length; i += BATCH_SIZE) {
      const chunk = participants.slice(i, i + BATCH_SIZE);
      const { html: htmlBody, text: textBody } = wrapEmail(html);
      const batch = chunk.map((p) => ({
        from: `${FROM_NAME} <${FROM_EMAIL}>`,
        to: p.email,
        reply_to: FROM_EMAIL,
        subject,
        html: htmlBody,
        text: textBody,
      }));

      try {
        const { data, error } = await resend.batch.send(batch);
        if (error) {
          chunk.forEach((p) =>
            report.push({
              name: p.name,
              email: p.email,
              status: "failed",
              error: error.message,
            }),
          );
        } else {
          chunk.forEach((p, j) =>
            report.push({
              name: p.name,
              email: p.email,
              id: data?.[j]?.id,
              status: "sent",
            }),
          );
        }
      } catch (err) {
        chunk.forEach((p) =>
          report.push({
            name: p.name,
            email: p.email,
            status: "failed",
            error: err.message,
          }),
        );
      }
    }

    const sent = report.filter((r) => r.status === "sent").length;
    const failed = report.filter((r) => r.status === "failed").length;

    console.log(
      `[admin/blast] sent=${sent} failed=${failed} total=${participants.length}`,
    );

    logBlast({
      message: subject,
      sent,
      failed,
      total: participants.length,
      dryRun: false,
      results: report,
    }).catch((err) => console.error("[admin/blast] logBlast:", err));

    return res.json({
      sent,
      failed,
      total: participants.length,
      results: report,
    });
  });

  // POST /api/admin/upload-artist-photo — upload base64 image to Supabase Storage
  router.post("/upload-artist-photo", async (req, res) => {
    const { artist, dataUrl, clear } = req.body || {};
    if (!artist) return res.status(400).json({ error: "artist required." });

    if (clear) {
      await updateArtistPhotoUrl({ artist: String(artist), url: null });
      return res.json({ url: null });
    }

    if (!dataUrl) return res.status(400).json({ error: "dataUrl required." });
    const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
    if (!match) return res.status(400).json({ error: "Invalid data URL." });

    const mimeType = match[1];
    const buffer = Buffer.from(match[2], "base64");
    const ext = mimeType.split("/")[1]?.replace("jpeg", "jpg") || "jpg";
    const filename = `artist-${artist}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("artist-photos")
      .upload(filename, buffer, { contentType: mimeType, upsert: true });

    if (uploadError) {
      console.error("[admin/upload-artist-photo]", uploadError);
      return res.status(500).json({ error: "Upload failed." });
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("artist-photos").getPublicUrl(filename);

    try {
      await updateArtistPhotoUrl({ artist: String(artist), url: publicUrl });
    } catch (err) {
      console.error("[admin/upload-artist-photo] save url:", err);
    }

    return res.json({ url: publicUrl });
  });

  return router;
}

module.exports = { adminRouter };
