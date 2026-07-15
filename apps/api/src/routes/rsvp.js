const { Router } = require("express");
const {
  countAttending,
  findParticipantByReferralCode,
  getRsvp,
  getSettings,
  upsertRsvp,
} = require("../store");

// 18 total, but guests only ever see "full" at 15 — the last 3 are held
// back as a buffer (guest DJ plus-ones, etc.). Real numbers live in admin.
const PUBLIC_CAP = 15;
const HARD_CAP = 18;

function capacityCopy(count) {
  if (count >= PUBLIC_CAP) return "Registration is currently full.";
  if (count >= 13) return "A few spaces remain.";
  if (count >= 11) return "The Domain is nearing capacity.";
  return null;
}

async function currentPortalDate() {
  const settings = await getSettings();
  return settings.next_portal_date ?? null;
}

function rsvpRouter() {
  const router = Router();

  // Public capacity state (+ the caller's own response when ?ref= is supplied).
  // Never exposes real counts.
  router.get("/status", async (req, res) => {
    try {
      const portalDate = await currentPortalDate();
      if (!portalDate) {
        return res.json({ open: false, full: false, copy: null, myStatus: null });
      }
      const count = await countAttending(portalDate);
      let myStatus = null;
      const ref = req.query.ref;
      if (ref && typeof ref === "string") {
        const participant = await findParticipantByReferralCode(ref);
        if (participant) {
          const rsvp = await getRsvp({ participantId: participant.id, portalDate });
          myStatus = rsvp?.status ?? null;
        }
      }
      return res.json({
        open: true,
        full: count >= PUBLIC_CAP,
        copy: capacityCopy(count),
        myStatus,
      });
    } catch (err) {
      console.error("[rsvp/status]", err);
      return res.json({ open: false, full: false, copy: null, myStatus: null });
    }
  });

  // Respond: attending | not_attending | waitlist
  router.post("/", async (req, res) => {
    const { referralCode, response } = req.body || {};
    if (!referralCode || typeof referralCode !== "string") {
      return res.status(400).json({ error: "referralCode required." });
    }
    if (!["attending", "not_attending", "waitlist"].includes(response)) {
      return res.status(400).json({ error: "Invalid response." });
    }

    try {
      const portalDate = await currentPortalDate();
      if (!portalDate) {
        return res.status(400).json({ error: "No portal is currently open." });
      }

      const participant = await findParticipantByReferralCode(referralCode);
      if (!participant) {
        return res.status(404).json({ error: "We couldn't find you." });
      }

      if (response === "attending") {
        const existing = await getRsvp({ participantId: participant.id, portalDate });
        const alreadyAttending = existing?.status === "attending";
        const count = await countAttending(portalDate);
        // Re-check capacity at write time (their own existing spot doesn't count against them)
        if (!alreadyAttending && count >= PUBLIC_CAP) {
          return res.json({ status: "full", full: true, copy: capacityCopy(count) });
        }
      }

      await upsertRsvp({ participantId: participant.id, portalDate, status: response });

      const count = await countAttending(portalDate);
      return res.json({
        status: "ok",
        myStatus: response,
        full: count >= PUBLIC_CAP,
        copy: capacityCopy(count),
      });
    } catch (err) {
      console.error("[rsvp]", err);
      return res.status(500).json({ error: "Something went wrong." });
    }
  });

  return router;
}

module.exports = { rsvpRouter, PUBLIC_CAP, HARD_CAP };
