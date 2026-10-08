const { createSession, destroySession } = require("../middleware/auth");

/**
 * POST /api/auth/login
 *
 * Body: { email, password }
 * Checks against the one demo admin account in .env (ADMIN_EMAIL/
 * ADMIN_PASSWORD) - see middleware/auth.js for why this is a plain
 * env-var check and an in-memory token, not a Users collection + bcrypt.
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

    const token = createSession();
    res.status(200).json({ success: true, data: { token } });
};

/**
 * POST /api/auth/logout
 *
 * Invalidates the caller's own token (if any). Always succeeds - logging
 * out an already-invalid token isn't an error.
 */
const logout = (req, res) => {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    if (token) destroySession(token);
    res.status(200).json({ success: true });
};

module.exports = { login, logout };
