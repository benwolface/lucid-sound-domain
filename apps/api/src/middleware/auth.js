const cookieName = "lucid_session";

const { sha256 } = require("../lib/crypto");
const { deleteSessionByTokenHash, findSessionWithUser } = require("../store");

function attachUser() {
  return async (req, res, next) => {
    try {
      const rawSessionToken = req.cookies?.[cookieName];
      if (!rawSessionToken || typeof rawSessionToken !== "string") {
        req.user = null;
        return next();
      }

      const tokenHash = sha256(rawSessionToken);
      const session = await findSessionWithUser(tokenHash);

      if (!session) {
        req.user = null;
        return next();
      }

      if (session.expiresAt.getTime() <= Date.now()) {
        await deleteSessionByTokenHash(tokenHash);
        res.clearCookie(cookieName, { path: "/" });
        req.user = null;
        return next();
      }

      req.user = session.user;
      return next();
    } catch (e) {
      return next();
    }
  };
}

module.exports = { attachUser };
