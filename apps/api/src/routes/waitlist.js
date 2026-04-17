const { Router } = require("express");
const { z } = require("zod");
const {
  createParticipant,
  findParticipant,
  findParticipantByPhone,
  findParticipantByName,
  findParticipantByReferralCode,
} = require("../store");

const twilioClient =
  process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN
    ? require("twilio")(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
    : null;

async function notifyOwner(name, phone, referredBy) {
  if (!twilioClient || !process.env.TWILIO_TO || !process.env.TWILIO_FROM) return;
  const ref = referredBy ? ` (referred by ${referredBy})` : "";
  await twilioClient.messages.create({
    to: process.env.TWILIO_TO,
    from: process.env.TWILIO_FROM,
    body: `LSD: ${name} (${phone}) just joined the domain${ref}.`,
  });
}

const joinSchema = z.object({
  name: z.string().min(1),
  contact: z.string().min(1),
  referredBy: z.string().optional(),
});

function waitlistRouter() {
  const router = Router();

  // Join waitlist with name + phone + optional referral
  router.post("/", async (req, res) => {
    const parsed = joinSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Please enter a valid name and phone number." });
    }

    const { name, contact, referredBy } = parsed.data;
    const phoneRe = /^\+?[\d\s\-().]{7,20}$/;
    if (!phoneRe.test(contact)) {
      return res.status(400).json({ error: "Please enter a valid phone number." });
    }

    const phone = contact.replace(/\s/g, "");

    try {
      // If name + phone both match an existing row, they're already in — skip referral entirely
      const exactMatch = await findParticipant({ name, phone });
      if (exactMatch) {
        return res.json({ status: "already_joined" });
      }

      // If phone exists under a different name, still already registered
      const byPhone = await findParticipantByPhone(phone);
      if (byPhone) {
        return res.json({ status: "already_joined" });
      }

      // New participant — insert (DB trigger handles updating referrer's array)
      const participant = await createParticipant({ name, phone, referredBy: referredBy || null });

      // Fire-and-forget SMS to owner — don't block the response
      notifyOwner(name, phone, referredBy).catch((err) =>
        console.error("[waitlist/sms]", err)
      );

      return res.json({ status: "joined", referralCode: participant.referral_code });
    } catch (err) {
      console.error("[waitlist]", err);
      return res.status(500).json({ error: "Something went wrong." });
    }
  });

  // Check if a referrer name exists — also returns their referral code
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
      });
    } catch (err) {
      console.error("[waitlist/check-referrer]", err);
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
