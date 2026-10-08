"""
Session 18 - putting an HTTP door on the RAG pipeline.

Slide 5's architecture is explicit about this: Next.js never talks to
ChromaDB or Ollama directly, and neither does the Node.js API - both sit
behind a "RAG Service." rag.py's ask_rag() already *is* that service in
every way except one: it's a Python function, and the dashboard's API is
Node.js. This file is the bridge - a small Flask app that gives
ask_rag() an HTTP address (:8001) so server.js's /api/ai/ask route can
call it like any other network service.

Kept as its own long-running process rather than running `python rag.py`
per request: Session 17 measured ~20-28s to cold-load the Ollama models
vs ~0.3s once warm, and a fresh interpreter + fresh model load on every
dashboard question would make the search bar feel broken. Run this once,
leave it running, and every request after the first is fast.

Run:  python api.py    (listens on :8001 - start this, then the backend
                         on :5000, then the frontend on :3000)
"""

from flask import Flask, jsonify, request

from rag import ask_rag

app = Flask(__name__)


@app.route("/ask", methods=["POST"])
def ask():
    body = request.get_json(silent=True) or {}
    question = (body.get("question") or "").strip()

    # Slide 16: don't let an empty question reach the LLM.
    if not question:
        return jsonify({"error": "question is required"}), 400

    try:
        result = ask_rag(question)
    except Exception as exc:
        # Slide 15's error list (Ollama not running, model missing,
        # ChromaDB unavailable) all land here. Log the real reason on this
        # side; the Node layer turns this into a generic message rather
        # than forwarding a Python traceback to the browser.
        print("ask_rag failed:", exc)
        return jsonify({"error": "Failed to generate an answer"}), 500

    return jsonify(result)


if __name__ == "__main__":
    app.run(port=8001)
