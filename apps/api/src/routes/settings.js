const { Router } = require("express");
const { findParticipantByReferralCode, getSettings } = require("../store");

function settingsRouter() {
  const router = Router();

  router.get("/", async (req, res) => {
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
      console.error("[settings]", err);
      return res.json({ imHereEnabled: false, nextPortalDate: null, upcomingPortalDate: null, nextPortalGuest: null, upcomingPortalGuest: null, artist1Name: null, artist1Bio: null, artist2Name: null, artist2Bio: null, artist1PhotoUrl: null, artist2PhotoUrl: null });
    }
  });

  router.get("/private", async (req, res) => {
    const ref = typeof req.query.ref === "string" ? req.query.ref.trim() : "";
    if (!ref) {
      return res.status(401).json({ error: "referral code required." });
    }

    try {
      const participant = await findParticipantByReferralCode(ref);
      if (!participant) {
        return res.status(404).json({ error: "entry not found." });
      }

      return res.json({
        portalLocation: process.env.PORTAL_LOCATION_PRIVATE || null,
      });
    } catch (err) {
      console.error("[settings/private]", err);
      return res.status(500).json({ error: "Failed to fetch private settings." });
    }
  });

  return router;
}

module.exports = { settingsRouter };
