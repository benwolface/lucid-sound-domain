const { Router } = require("express");
const { z } = require("zod");
const {
  createParticipant,
  findParticipant,
  findParticipantByEmail,
  findParticipantByName,
  findParticipantByReferralCode,
  updateParticipantEmail,
} = require("../store");

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
