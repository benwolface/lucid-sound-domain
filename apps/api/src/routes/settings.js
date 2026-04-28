const { Router } = require("express");
const { getSettings } = require("../store");

function settingsRouter() {
  const router = Router();

  router.get("/", async (req, res) => {
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
      console.error("[settings]", err);
      return res.json({ imHereEnabled: false, nextPortalDate: null, upcomingPortalDate: null, artist1Name: null, artist1Bio: null, artist2Name: null, artist2Bio: null });
    }
  });

  return router;
}

module.exports = { settingsRouter };
