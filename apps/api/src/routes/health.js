const { Router } = require("express");

function healthRouter() {
  const router = Router();
  router.get("/", (req, res) => {
    res.json({ ok: true, service: "api" });
  });
  return router;
}

module.exports = { healthRouter };

