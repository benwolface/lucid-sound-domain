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
      });
    } catch (err) {
      console.error("[settings]", err);
      return res.json({ imHereEnabled: false, nextPortalDate: null, upcomingPortalDate: null });
    }
  });

  return router;
}

module.exports = { settingsRouter };
