// Session 19 Slide 8-9: load .env before anything reads process.env.
// Node's own built-in loader (no `dotenv` package needed) - wrapped in a
// try/catch because production environments (e.g. hosting platforms that
// inject real env vars directly) won't have a .env file on disk, and that
// should mean "nothing to load," not a crash.
try {
    process.loadEnvFile();
} catch {
    // No .env file - fine, env vars are expected to come from elsewhere.
}

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dashboardRoutes = require("./routes/dashboardRoutes");
const aiRoutes = require("./routes/aiRoutes");
const authRoutes = require("./routes/authRoutes");
const { requireAuth } = require("./middleware/auth");

const app = express();

// Session 13: the Next.js dev server runs on a different origin
// (localhost:3000) than this API (localhost:5000) - without CORS the
// browser blocks the frontend's fetch() calls. Open to all origins here
// since this is local dev; restrict this in production (Slide 15).
app.use(cors());

app.use(express.json());

app.use((req, res, next) => {
    console.log(req.method, req.url);
    next();
});

const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/dashboardDB";

// Connect to MongoDB (Compass: mongodb://localhost:27017)
mongoose
    .connect(MONGODB_URI)
    .then(() => {
        console.log("Connected to MongoDB:", MONGODB_URI);
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    })
    .catch((err) => {
        console.error("MongoDB connection error:", err.message);
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
