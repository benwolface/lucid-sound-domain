const { Router } = require("express");
const { getArchiveItems } = require("../store");

function archiveRouter() {
  const router = Router();

  // Public list of archive photos/videos for the Archive section
  router.get("/", async (req, res) => {
    try {
      const items = await getArchiveItems();
      return res.json({
        photos: items.filter((i) => i.type === "photo"),
        videos: items.filter((i) => i.type === "video"),
      });
    } catch (err) {
      console.error("[archive]", err);
      return res.json({ photos: [], videos: [] });
    }
  });

  return router;
}

module.exports = { archiveRouter };
