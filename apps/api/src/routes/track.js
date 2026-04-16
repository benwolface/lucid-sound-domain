const { Router } = require("express");
const { z } = require("zod");

const { createEvent } = require("../store");

function trackRouter() {
  const router = Router();

  router.post("/", async (req, res, next) => {
    try {
      const schema = z.object({
        type: z.string().min(1).max(64),
        properties: z.record(z.unknown()).optional()
      });

      const { type, properties } = schema.parse(req.body);

      const visitorId = req.visitor?.id;
      if (!visitorId) {
        return res.status(400).json({ error: "missing_visitor" });
      }

      await createEvent({
        visitorId,
        userId: req.user?.id ?? null,
        type,
        properties: properties ? JSON.stringify(properties) : null,
        ip: req.ip,
        userAgent: req.headers["user-agent"]
      });

      res.status(201).json({ ok: true });
    } catch (e) {
      next(e);
    }
  });

  return router;
}

module.exports = { trackRouter };
