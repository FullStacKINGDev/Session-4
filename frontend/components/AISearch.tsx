"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import Icon from "@/components/Icon";
import { askAI, type AskAIResult } from "@/lib/api";

// Session 18 Slide 18: give users a starting point instead of a blank
// box - real questions, verified against the live pipeline in Session 17.
const SUGGESTED_QUESTIONS = [
  "Which project has the highest stock value?",
  "Which project has aging inventory?",
  "Tell me about Project C",
  "Which projects have inventory older than 365 days?"
];

// Session 18 Slide 17: "AI should enhance the dashboard, not replace it" -
// one card among the others, not a separate page or a chat-app look.
export default function AISearch() {
  const [question, setQuestion] = useState("");
  const [result, setResult] = useState<AskAIResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ask = async (raw: string) => {
    const trimmed = raw.trim();
    // Slide 16: don't send empty questions.
    if (!trimmed || loading) return;

    setLoading(true);
    setError(null);
    try {
      setResult(await askAI(trimmed));
    } catch (err) {
      setResult(null);
      setError(err instanceof Error ? err.message : "Unable to get an AI response.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    ask(question);
  };

  const handleSuggestion = (q: string) => {
    setQuestion(q);
    ask(q);
  };

  return (
    <div className="mb-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-white">
          <Icon name="auto_awesome" className="text-[18px]" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Ask AI</h2>
          <p className="text-sm text-gray-500">Ask anything about your projects and suppliers.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex items-center gap-3">
        <div className="relative flex-1">
          <Icon
            name="search"
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-gray-400"
          />
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask anything about your data..."
            className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
        <button
          type="submit"
          disabled={loading || !question.trim()}
          className="shrink-0 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-gray-300"
        >
          {loading ? "Thinking..." : "Ask AI"}
        </button>
      </form>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="text-xs text-gray-400">Try:</span>
        {SUGGESTED_QUESTIONS.map((q) => (
          <button
            key={q}
            type="button"
            onClick={() => handleSuggestion(q)}
            disabled={loading}
            className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs text-gray-600 transition-colors hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {q}
          </button>
        ))}
      </div>

      {loading && (
        <div className="mt-4 flex items-center gap-2 rounded-lg bg-gray-50 p-4 text-sm text-gray-500">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-gray-200 border-t-indigo-600" />
          Thinking...
        </div>
      )}

      {!loading && error && (
        <div className="mt-4 flex items-start gap-2 rounded-lg border border-red-100 bg-red-50 p-4 text-sm">
          <Icon name="error" className="mt-0.5 text-[18px] text-red-500" />
          <div>
            <p className="font-medium text-red-700">Unable to get an AI response.</p>
            <p className="mt-0.5 text-xs text-red-500">{error}</p>
          </div>
        </div>
      )}

      {!loading && !error && result && (
        <div className="mt-4 rounded-lg bg-indigo-50 p-4">
          <div className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-indigo-700">
            <Icon name="auto_awesome" className="text-[14px]" />
            AI Answer
          </div>
          <p className="text-sm text-gray-800">{result.answer}</p>
          {result.sources.length > 0 && (
            <p className="mt-2 text-xs text-gray-500">Sources: {result.sources.join(", ")}</p>
          )}
        </div>
      )}
    </div>
  );
}
