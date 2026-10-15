const { createSession } = require("../middleware/auth");

/**
 * POST /api/auth/login
 *
 * Body: { email, password }
 * Checks against the one demo admin account in .env (ADMIN_EMAIL/
 * ADMIN_PASSWORD) - see middleware/auth.js for why this is a plain
 * env-var check and a signed JWT, not a Users collection + bcrypt.
 */
const login = (req, res) => {
    const email = typeof req.body?.email === "string" ? req.body.email.trim() : "";
    const password = typeof req.body?.password === "string" ? req.body.password : "";

    if (!email || !password) {
        return res.status(400).json({ success: false, message: "Email and password are required" });
    }

    if (email !== process.env.ADMIN_EMAIL || password !== process.env.ADMIN_PASSWORD) {
        return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    const token = createSession({ email });
    res.status(200).json({ success: true, data: { token } });
};

/**
 * POST /api/auth/logout
 *
 * JWTs are stateless (middleware/auth.js) - there's nothing server-side
 * left to invalidate, so this is a no-op that just confirms the call.
 * Signing out happens on the client (frontend/lib/auth.ts's
 * clearToken()). Kept as a real endpoint rather than removed so the
 * frontend's existing call doesn't need special-casing, and so a future
 * denylist-based revocation would have a natural place to live.
 */
const logout = (_req, res) => {
    res.status(200).json({ success: true });
};

module.exports = { login, logout };
