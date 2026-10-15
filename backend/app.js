// Deployment follow-up: the Express app itself, extracted out of
// server.js so it can be reused two ways - server.js's traditional
// app.listen() for local dev, and api/index.js's exported handler for
// Vercel. Vercel's serverless runtime calls the exported app directly
// per-request; it never runs server.js's bootstrap at all.
try {
    process.loadEnvFile();
} catch {
    // No .env file - fine, env vars are expected to come from elsewhere
    // (e.g. injected directly by the hosting platform).
}

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dashboardRoutes = require("./routes/dashboardRoutes");
const aiRoutes = require("./routes/aiRoutes");
const authRoutes = require("./routes/authRoutes");
const { requireAuth } = require("./middleware/auth");

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/dashboardDB";

// Serverless-safe connection reuse: a traditional server connects once
// at startup and stays connected, but a serverless function has no
// "startup" - every invocation is its own call, and a cold one might
// land on a fresh instance with no connection yet. Caching the promise
// (not just the result) means concurrent requests on a cold instance
// share the same in-flight connect() instead of each starting their own.
let connectionPromise = null;
function ensureDbConnected() {
    if (mongoose.connection.readyState === 1) return Promise.resolve();
    if (!connectionPromise) {
        connectionPromise = mongoose.connect(MONGODB_URI);
    }
    return connectionPromise;
}

const app = express();

// Session 13: the Next.js dev server runs on a different origin than
// this API - without CORS the browser blocks the frontend's fetch()
// calls. Open to all origins here; restrict this to the real deployed
// frontend domain once that's known (Slide 15).
app.use(cors());

app.use(express.json());

app.use((req, res, next) => {
    console.log(req.method, req.url);
    next();
});

// Every request waits for the DB connection first. On a warm serverless
// instance (or always, locally, after the first request) this resolves
// immediately - mongoose.connection.readyState is already 1.
app.use(async (req, res, next) => {
    try {
        await ensureDbConnected();
        next();
    } catch (err) {
        console.error("MongoDB connection error:", err.message);
        res.status(503).json({ success: false, message: "Database unavailable" });
    }
});

app.get("/", (req, res) => {
    res.send("Full Stack AI Dashboard");
});

// Route -> Controller -> { email, password } -> token (Session 19). Not
// behind requireAuth - you can't need a token to get a token.
app.use("/api/auth", authRoutes);

// Slide 7: "authentication protects the application, not just the visual
// page" - every data-bearing route requires a valid token from here on.
app.use("/api/dashboard", requireAuth, dashboardRoutes);
app.use("/api/ai", requireAuth, aiRoutes);

// Vercel's zero-config Express detection (found live: it auto-picks this
// file at the project root and invokes it directly, bypassing the
// api/index.js + vercel.json rewrite setup entirely) requires the
// default export to BE the request handler, not a wrapper object -
// "Invalid export found... must be a function or server" otherwise.
// ensureDbConnected/MONGODB_URI are attached as properties on the same
// export so server.js and api/index.js can still reach them.
module.exports = app;
module.exports.ensureDbConnected = ensureDbConnected;
module.exports.MONGODB_URI = MONGODB_URI;
