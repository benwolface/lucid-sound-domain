const { Router } = require("express");
const { z } = require("zod");
const { Resend } = require("resend");
const {
  createParticipant,
  findParticipant,
  findParticipantByEmail,
  findParticipantByName,
  findParticipantByReferralCode,
  updateParticipantEmail,
} = require("../store");

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;
const FROM_EMAIL = process.env.FROM_EMAIL || "portal@lucidsounddomain.com";
const FROM_NAME = process.env.FROM_NAME || "lucid sound domain";

async function sendWelcomeEmail(email) {
  if (!resend) return;
  const text = [
    "welcome to the lucid sound domain.",
    "",
    "this is how we'll reach you about our upcoming portals and entry instructions.",
    "",
    'if this landed in promotions, moving it to your inbox (or replying "message recieved" once) helps keep it there so that you don\'t miss the next one.',
    "",
    "see you inside.",
    "",
    '---',
    'To opt out, reply with "stop".',
  ].join("\n");

  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body style="font-family:Georgia,serif;font-size:16px;line-height:1.6;color:#1a1a1a;padding:24px 16px"><div style="max-width:560px"><p>welcome to the lucid sound domain.</p><p>this is how we'll reach you about our upcoming portals and entry instructions.</p><p>if this landed in promotions, moving it to your inbox (or replying "message recieved" once) helps keep it there so that you don't miss the next one.</p><p>see you inside.</p><p style="margin-top:32px;font-size:12px;color:#aaa;border-top:1px solid #eee;padding-top:12px">To opt out, reply with "stop".</p></div></body></html>`;

  await resend.emails.send({
    from: `${FROM_NAME} <${FROM_EMAIL}>`,
    to: email,
    reply_to: FROM_EMAIL,
    subject: "welcome to the lucid sound domain",
    text,
    html,
  });
}

const twilioClient =
  process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN
    ? require("twilio")(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
    : null;

async function notifyOwner(name, email, referredBy) {
  if (!twilioClient || !process.env.TWILIO_TO || !process.env.TWILIO_FROM) return;
  const ref = referredBy ? ` (referred by ${referredBy})` : "";
  await twilioClient.messages.create({
    to: process.env.TWILIO_TO,
    from: process.env.TWILIO_FROM,
    body: `LSD: ${name} (${email}) just joined the domain${ref}.`,
  });
}

const joinSchema = z.object({
  name: z.string().min(1),
  contact: z.string().email(),
  referredBy: z.string().optional(),
});

const updateEmailSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
});

function waitlistRouter() {
  const router = Router();

  // Join waitlist with name + email + optional referral
  router.post("/", async (req, res) => {
    const parsed = joinSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Please enter a valid name and email address." });
    }

    const { name, contact: email, referredBy } = parsed.data;

    try {
      // If name + email both match an existing row, they're already in
      const exactMatch = await findParticipant({ name, email });
      if (exactMatch) {
        return res.json({ status: "already_joined", referralCode: exactMatch.referral_code });
      }

      // If email exists under a different name, already registered
      const byEmail = await findParticipantByEmail(email);
      if (byEmail) {
        return res.json({ status: "already_joined", referralCode: byEmail.referral_code });
      }

      // New participant
      const participant = await createParticipant({ name, email, referredBy: referredBy || null });

      notifyOwner(name, email, referredBy).catch((err) =>
        console.error("[waitlist/sms]", err)
      );

      sendWelcomeEmail(email).catch((err) =>
        console.error("[waitlist/welcome-email]", err)
      );

      return res.json({ status: "joined", referralCode: participant.referral_code });
    } catch (err) {
      console.error("[waitlist]", err);
      return res.status(500).json({ error: "Something went wrong." });
    }
  });

  // Check if a referrer name exists — also returns their referral code and whether they have email
  router.post("/check-referrer", async (req, res) => {
    const { name } = req.body || {};
    if (!name || typeof name !== "string") {
      return res.status(400).json({ error: "Name required." });
    }

    try {
      const entry = await findParticipantByName(name);
      return res.json({
        found: !!entry,
        referralCode: entry?.referral_code ?? null,
        hasEmail: !!(entry?.email),
      });
    } catch (err) {
      console.error("[waitlist/check-referrer]", err);
      return res.status(500).json({ error: "Something went wrong." });
    }
  });

  // Update email for a returning participant who didn't have one
  router.post("/update-email", async (req, res) => {
    const parsed = updateEmailSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Please enter a valid email address." });
    }

    const { name, email } = parsed.data;

    try {
      // Check email isn't already taken by someone else
      const byEmail = await findParticipantByEmail(email);
      if (byEmail) {
        const isSamePerson = byEmail.name.toLowerCase().trim() === name.toLowerCase().trim();
        if (!isSamePerson) {
          return res.status(409).json({ error: "That email is already registered." });
        }
        return res.json({ status: "ok" });
      }

      await updateParticipantEmail({ name, email });
      return res.json({ status: "ok" });
    } catch (err) {
      console.error("[waitlist/update-email]", err);
      return res.status(500).json({ error: "Something went wrong." });
    }
  });

  // Look up who owns a referral code (used when landing with ?ref=)
  router.get("/referral/:code", async (req, res) => {
    try {
      const entry = await findParticipantByReferralCode(req.params.code);
      if (!entry) return res.json({ found: false });
      return res.json({ found: true, name: entry.name, referralCode: entry.referral_code });
    } catch (err) {
      console.error("[waitlist/referral]", err);
      return res.status(500).json({ error: "Something went wrong." });
    }
  });

  return router;
}

module.exports = { waitlistRouter };
