const crypto = require("crypto");

// Session 19 Slide 5-7: "basic" authentication on purpose - one demo admin
// account (env vars, see controllers/authController.js), opaque tokens kept
// in memory on the server rather than a signed JWT or a Users collection.
// That's a real, explainable tradeoff, not a shortcut pretending to be more
// than it is: restarting this server logs everyone out, and it only works
// because this course runs one Node process, not several behind a load
// balancer. A session store (Redis, a DB-backed Sessions collection) or
// stateless JWTs are the natural next step for something that has to survive
// a restart or scale past one process - noted as not-done in SESSION_19_NOTES.
const sessions = new Set();

function createSession() {
    const token = crypto.randomBytes(24).toString("hex");
    sessions.add(token);
    return token;
}

function destroySession(token) {
    sessions.delete(token);
}

// Slide 7: "authentication protects the application, not just the visual
// page" - this guards the API itself, independent of whatever the frontend
// does. Every /api/dashboard and /api/ai route requires a valid token.
function requireAuth(req, res, next) {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;

    if (!token || !sessions.has(token)) {
        return res.status(401).json({ success: false, message: "Not authenticated" });
    }

    next();
}

module.exports = { createSession, destroySession, requireAuth };
