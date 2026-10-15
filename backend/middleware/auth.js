const jwt = require("jsonwebtoken");

// Deployment follow-up: switched from an in-memory token Set to signed
// JWTs so auth works on Vercel's serverless functions, which don't share
// memory between invocations - the in-memory Set only ever worked
// because this ran as one persistent local process. A JWT carries its
// own proof of validity (a signature only the server's JWT_SECRET could
// have produced), so there's nothing to look up server-side - "logged
// in" just means "presented a token that verifies," regardless of which
// serverless instance happens to check it.
//
// Real tradeoff, stated plainly: logout is client-side only now. There's
// no server-side state left to clear, so a token stays valid until it
// expires (TOKEN_TTL below) even if the client discards it - fine for
// one demo admin account on a teaching project; a real product wanting
// to revoke a specific compromised token early would need a denylist
// (Redis, a DB table) checked alongside the signature. Not built here.
const JWT_SECRET = process.env.JWT_SECRET;
const TOKEN_TTL = "24h";

function createSession(payload) {
    if (!JWT_SECRET) {
        throw new Error("JWT_SECRET is not set - check backend/.env");
    }
    return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_TTL });
}

// Slide 7: "authentication protects the application, not just the visual
// page" - this guards the API itself, independent of whatever the frontend
// does. Every /api/dashboard and /api/ai route requires a valid token.
function requireAuth(req, res, next) {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;

    if (!token) {
        return res.status(401).json({ success: false, message: "Not authenticated" });
    }

    try {
        jwt.verify(token, JWT_SECRET);
        next();
    } catch {
        // Covers both a tampered/invalid signature and a genuinely
        // expired token - same response either way, matching the
        // frontend's existing "session expired, please log in again"
        // handling (lib/api.ts / lib/auth.ts's SESSION_EXPIRED_EVENT).
        return res.status(401).json({ success: false, message: "Not authenticated" });
    }
}

module.exports = { createSession, requireAuth };
