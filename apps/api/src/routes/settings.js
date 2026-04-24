const { Router } = require("express");
const { getSettings } = require("../store");

function settingsRouter() {
  const router = Router();

  // Public — frontend polls this to know whether to show the "i'm here" button
  router.get("/", async (req, res) => {
    try {
      const settings = await getSettings();
      return res.json({ imHereEnabled: settings.im_here_enabled });
    } catch (err) {
      console.error("[settings]", err);
      // Fail safe — hide the button if DB is unreachable
      return res.json({ imHereEnabled: false });
    }
  });

  return router;
}

module.exports = { settingsRouter };
