// Local dev entry point only. Deployed on Vercel, api/index.js exports
// the same app (from app.js) directly instead - this file's app.listen()
// never runs there.
const app = require("./app");
const { ensureDbConnected, MONGODB_URI } = app;

const PORT = process.env.PORT || 5000;

ensureDbConnected()
    .then(() => {
        console.log("Connected to MongoDB:", MONGODB_URI);
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    })
    .catch((err) => {
        console.error("MongoDB connection error:", err.message);
    });
