// Vercel serverless entry point. Anything under backend/api/ is
// auto-detected as a serverless function; vercel.json's rewrite sends
// every incoming request here, and this Express app does its own
// internal routing from there (/api/auth, /api/dashboard, /api/ai) -
// nothing about those route definitions had to change.
module.exports = require("../app");
