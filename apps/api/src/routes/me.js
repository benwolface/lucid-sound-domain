const { Router } = require("express");

function meRouter() {
  const router = Router();

  router.get("/", (req, res) => {
    if (!req.user) {
      return res.json({ user: null });
    }

    res.json({
      user: {
        id: req.user.id,
        email: req.user.email,
        name: req.user.name
      }
    });
  });

  return router;
}

module.exports = { meRouter };

