// Session 18 Slide 5: the Node API never talks to ChromaDB or Ollama
// itself ("don't do this: Next.js -> ChromaDB -> Llama" is the slide's
// own crossed-out diagram). It delegates to the Python RAG service built
// in Sessions 16-17 (backend/rag/api.py, running on :8001) - this
// controller is just the bridge, same role Slide 8 describes: "we are
// not rebuilding RAG, we are exposing our existing RAG pipeline."
// Session 19 Slide 8: no longer hardcoded - comes from .env, defaults to
// the same local port this has always used.
const RAG_SERVICE_URL = process.env.RAG_SERVICE_URL || "http://localhost:8001";

// Session 19 Slide 13: found live, not hypothetical - Ollama's own server
// got wedged mid-session (confirmed by calling ollama.embed() directly,
// bypassing every line of our own code, and watching it hang with no
// response and no error). Without a timeout here, that kind of downstream
// hang had no ceiling: fetch() would wait forever, the frontend's
// "Thinking..." spinner would spin forever, and nothing would ever tell
// the user it had failed. Session 17 measured Ollama's cold-load at
// ~20-28s; after restarting the hung Ollama process, this same session
// measured an actual end-to-end response at ~40s - slower than that
// baseline, presumably the restart itself being heavier than an idle
// model reload. 60s leaves real headroom above the slowest cold start
// actually observed, while still guaranteeing the request ends.
const RAG_TIMEOUT_MS = 60000;

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

    let response;
    try {
        response = await fetch(`${RAG_SERVICE_URL}/ask`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ question }),
            signal: AbortSignal.timeout(RAG_TIMEOUT_MS)
        });
    } catch (error) {
        if (error.name === "TimeoutError") {
            console.error("askAI timeout: RAG service did not respond within", RAG_TIMEOUT_MS, "ms");
            return res.status(504).json({
                success: false,
                message: "The AI service took too long to respond. Please try again."
            });
        }
        // Slide 15's list (Ollama down, ChromaDB unavailable, RAG service
        // unreachable) all surface as a fetch() failure here - the RAG
        // service process itself didn't answer.
        console.error("askAI error:", error.message);
        return res.status(503).json({
            success: false,
            message: "AI service is unavailable. Is backend/rag/api.py running?"
        });
    }

    const body = await response.json().catch(() => ({}));

    if (!response.ok) {
        return res.status(502).json({ success: false, message: body.error || "AI service returned an error" });
    }

    res.status(200).json({ success: true, data: { answer: body.answer, sources: body.sources || [] } });
};

module.exports = { askAI };
