// Replaces the Ollama + ChromaDB pipeline (Sessions 16-18) for the live
// /api/ai/ask path. Why: Vercel runs serverless functions, not persistent
// processes - there's no way to host a 5GB local LLM or a disk-backed
// vector database there. And it isn't just the chat model ("Local LLM")
// that's the problem: Session 18's embeddings also came from Ollama
// (nomic-embed-text), so keeping "real" vector search would have hit the
// exact same hosting wall. With 28 total records (14 projects, 14
// suppliers), a real vector database is arguably overkill anyway -
// this answers the same question types the AI search bar has always
// demoed, as deterministic queries over the live Project/Supplier
// collections instead of a similarity search + generated sentence.
//
// Real tradeoff, stated plainly: this only understands question
// *patterns*, not arbitrary phrasing the way an LLM did. It also has a
// genuine upside over the old pipeline - no cold starts, no "retrieved
// only 3 of 14 records" limitation (Session 17 documented this honestly
// for "older than 365 days"), and no prompt-injection surface at all,
// since there's no model reading anything that could be instructions.
const Project = require("../models/Project");
const Supplier = require("../models/Supplier");

const fmt = (n) => n.toFixed(2);

const GREETING_PATTERN = /^\s*(hi|hello|hey|good\s+(morning|afternoon|evening)|thanks?|thank\s+you)\b/i;
const GREETING_REPLIES = [
    "Hi there! I can help you look up projects and suppliers - what would you like to know?",
    "Hello! Ask me about stock levels or aging inventory for any project or supplier.",
    "Hey! Happy to help - ask about a specific project, a specific supplier, or stock levels in general."
];

function pickGreeting() {
    return GREETING_REPLIES[Math.floor(Math.random() * GREETING_REPLIES.length)];
}

// Same "entirely / mostly / partly" precision this project's old Ollama
// prompt had to be explicitly, repeatedly tuned to get right (Session
// 18-19's prompts.py) - here it's just a direct read of the numbers, so
// it can't drift or contradict itself the way a model's wording could.
function describeAging(row, label) {
    const buckets = [
        ["under 90 days old", row.under90],
        ["90 to 180 days old", row.over90],
        ["180 to 365 days old", row.over180],
        ["older than 365 days", row.over365]
    ];
    const nonzero = buckets.filter(([, v]) => v > 0);

    if (nonzero.length === 0) {
        return `${label} has a stock value of ${fmt(row.stockValue)}, with no aging breakdown recorded.`;
    }
    if (nonzero.length === 1) {
        return `${label}'s entire stock, ${fmt(row.stockValue)}, is ${nonzero[0][0]}.`;
    }

    const [topLabel, topValue] = nonzero.reduce((a, b) => (b[1] > a[1] ? b : a));
    const share = row.stockValue > 0 ? topValue / row.stockValue : 0;
    const qualifier = share >= 0.9 ? "Almost all" : share >= 0.5 ? "Most" : "A large part";
    return `${label} has a total stock value of ${fmt(row.stockValue)}. ${qualifier} of it, ${fmt(topValue)}, is ${topLabel}.`;
}

function findByLetter(projects, letter) {
    const needle = letter.toLowerCase();
    return projects.find((p) => p.projectName.toLowerCase() === needle);
}

function findBySupplierNumber(suppliers, number) {
    const needle = `sup-${number}`.toLowerCase();
    return suppliers.find((s) => s.supplierName.toLowerCase() === needle);
}

const AGING_BUCKETS = [
    { test: /90.*180|90\s*to\s*180/i, field: "over90", label: "90 to 180 days old" },
    { test: /180.*365|180\s*to\s*365/i, field: "over180", label: "180 to 365 days old" },
    { test: /under\s*90|less than 90/i, field: "under90", label: "under 90 days old" },
    { test: /.*/, field: "over365", label: "older than 365 days" } // default/fallback
];

/**
 * The retrieval + answer logic itself - no HTTP, no Express, so it's
 * easy to unit-test or reuse (e.g. from a future Next.js API route)
 * independent of how a request reached it.
 */
async function smartSearch(question) {
    const q = question.trim();

    if (GREETING_PATTERN.test(q)) {
        return { answer: pickGreeting(), sources: [] };
    }

    const [projects, suppliers] = await Promise.all([Project.find().lean(), Supplier.find().lean()]);

    // "Tell me about Project C" / "what about Sup-8"
    const projectMatch = q.match(/project\s+([a-z])\b/i);
    const supplierMatch = q.match(/sup[-\s]?(\d+)/i);

    if (projectMatch) {
        const row = findByLetter(projects, projectMatch[1]);
        if (row) {
            return { answer: describeAging(row, `Project ${row.projectName}`), sources: [`Project ${row.projectName}`] };
        }
    }
    if (supplierMatch) {
        const row = findBySupplierNumber(suppliers, supplierMatch[1]);
        if (row) {
            return {
                answer: `${row.supplierName} has a committed stock value of ${fmt(row.stockValue)}.`,
                sources: [row.supplierName]
            };
        }
    }

    const wantsSupplier = /supplier/i.test(q);
    const wantsProject = !wantsSupplier;

    if (/highest|largest|biggest|maximum|\bmost\b/i.test(q)) {
        if (wantsSupplier) {
            const top = [...suppliers].sort((a, b) => b.stockValue - a.stockValue)[0];
            return { answer: `${top.supplierName} has the highest stock value at ${fmt(top.stockValue)}.`, sources: [top.supplierName] };
        }
        if (wantsProject) {
            const top = [...projects].sort((a, b) => b.stockValue - a.stockValue)[0];
            return {
                answer: `Project ${top.projectName} has the highest stock value at ${fmt(top.stockValue)}.`,
                sources: [`Project ${top.projectName}`]
            };
        }
    }

    if (/lowest|smallest|minimum|\bleast\b/i.test(q)) {
        if (wantsSupplier) {
            const bottom = [...suppliers].sort((a, b) => a.stockValue - b.stockValue)[0];
            return { answer: `${bottom.supplierName} has the lowest stock value at ${fmt(bottom.stockValue)}.`, sources: [bottom.supplierName] };
        }
        if (wantsProject) {
            const bottom = [...projects].sort((a, b) => a.stockValue - b.stockValue)[0];
            return {
                answer: `Project ${bottom.projectName} has the lowest stock value at ${fmt(bottom.stockValue)}.`,
                sources: [`Project ${bottom.projectName}`]
            };
        }
    }

    if (/average/i.test(q)) {
        const rows = wantsSupplier ? suppliers : projects;
        const avg = rows.reduce((s, r) => s + r.stockValue, 0) / rows.length;
        return {
            answer: `The average stock value across all ${rows.length} ${wantsSupplier ? "suppliers" : "projects"} is ${fmt(avg)}.`,
            sources: []
        };
    }

    if (/\btotal\b/i.test(q)) {
        const rows = wantsSupplier ? suppliers : projects;
        const total = rows.reduce((s, r) => s + r.stockValue, 0);
        return {
            answer: `The total stock value across all ${rows.length} ${wantsSupplier ? "suppliers" : "projects"} is ${fmt(total)}.`,
            sources: []
        };
    }

    if (/aging|older than|over\s*\d{2,3}/i.test(q)) {
        const bucket = AGING_BUCKETS.find((b) => b.test.test(q));
        const rows = wantsSupplier ? suppliers : projects;
        const matches = rows
            .filter((r) => r[bucket.field] > 0)
            .sort((a, b) => b[bucket.field] - a[bucket.field]);

        const noun = wantsSupplier ? "supplier" : "project";
        if (matches.length === 0) {
            return { answer: `No ${noun}s have stock ${bucket.label}.`, sources: [] };
        }

        const names = matches.map((r) => (wantsSupplier ? r.supplierName : `Project ${r.projectName}`));
        const shown = names.length <= 6 ? names : names.slice(0, 6);
        const list = names.length <= 6 ? shown.join(", ") : `${shown.join(", ")}, and ${names.length - 6} more`;
        return {
            answer: `${matches.length} ${noun}${matches.length === 1 ? "" : "s"} ${matches.length === 1 ? "has" : "have"} stock ${bucket.label}: ${list}.`,
            sources: names
        };
    }

    return {
        answer:
            "I don't have an answer for that. Try asking about the highest or lowest stock value, aging inventory, or a specific project or supplier by name.",
        sources: []
    };
}

module.exports = { smartSearch };
