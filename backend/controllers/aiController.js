// Session 19 follow-up: previously proxied to the Python RAG service
// (backend/rag/api.py -> ChromaDB -> Ollama, Sessions 16-18). Replaced
// with backend/lib/smartSearch.js - direct MongoDB queries, no LLM, no
// vector DB - specifically so this works on Vercel. Ollama and ChromaDB
// both need a persistent process (and ChromaDB needs persistent disk);
// neither exists on serverless infrastructure, and that's true of
// Ollama's *embedding* model too, not just the chat model - there was
// no way to keep "real" vector search without also keeping something
// that can't be hosted there. See the top of smartSearch.js for the
// full reasoning, and backend/rag/ for the original pipeline, which
// still works locally - it's just no longer what this route calls.
const { smartSearch } = require("../lib/smartSearch");

/**
 * POST /api/ai/ask
 *
 * Body: { question: string }
 * Success: { success: true, data: { answer, sources } }
 * Failure: { success: false, message }
 */
const askAI = async (req, res) => {
    const question = typeof req.body?.question === "string" ? req.body.question.trim() : "";

    // Slide 16: reject an empty question here too, not just in the
    // frontend - the API has to be safe to call directly (Slide 9's
    // "test the AI API first, before connecting the frontend").
    if (!question) {
        return res.status(400).json({ success: false, message: "question is required" });
    }

    try {
        const { answer, sources } = await smartSearch(question);
        res.status(200).json({ success: true, data: { answer, sources } });
    } catch (error) {
        // A MongoDB failure is the only realistic way this throws now -
        // smartSearch itself is pure in-memory logic once the data is
        // fetched, there's no network call to a separate AI service
        // left to time out or go unreachable.
        console.error("askAI error:", error.message);
        res.status(500).json({ success: false, message: "Could not search project and supplier data" });
    }
};

module.exports = { askAI };
