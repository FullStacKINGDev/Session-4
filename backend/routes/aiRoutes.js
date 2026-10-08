const express = require("express");
const { askAI } = require("../controllers/aiController");

const router = express.Router();

// POST /api/ai/ask -> { question } in, { answer, sources } out (Session 18)
router.post("/ask", askAI);

module.exports = router;
