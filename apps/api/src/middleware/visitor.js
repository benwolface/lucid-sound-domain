const cookieName = "lucid_visitor";

const { nanoid } = require("nanoid");
const { prisma } = require("../prisma");

function isProbablyId(v) {
  return typeof v === "string" && v.length >= 10;
}

function attachVisitor() {
  return async (req, res, next) => {
    try {
      const incomingVisitorId = req.cookies?.[cookieName];

      if (isProbablyId(incomingVisitorId)) {
        const existing = await prisma.visitor.findUnique({
          where: { id: incomingVisitorId }
        });
        if (existing) {
          req.visitor = existing;
          return next();
        }
      }

      const id = nanoid();
      const visitor = await prisma.visitor.create({
        data: { id }
      });

      // Store visitor id so we can link events consistently.
      res.cookie(cookieName, id, {
        httpOnly: false,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/"
      });

      req.visitor = visitor;
      return next();
    } catch (e) {
      return next(e);
    }
  };
}

module.exports = { attachVisitor };

