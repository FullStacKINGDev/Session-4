"""
Session 17 - Building the RAG Pipeline.
"Retrieve first. Generate second." The piece Session 16 was missing:
search.py could find relevant documents, but nothing read them and
answered in words. This does.

    Dashboard Data -> Chunking -> Ollama Embeddings -> ChromaDB
                                                            |
    User Question -> Embedding -------------------------- Retrieval
                                                            |
                                                   Relevant Context
                                                            |
                                                      Local Llama
                                                            |
                                                      AI Response

Run:  python rag.py                      (runs the Slide 19 test questions)
      python rag.py "your own question"   (ask one question, live)
"""

import sys

import chromadb
import ollama

from embeddings import embed
from prompts import SYSTEM_PROMPT

COLLECTION_NAME = "inventory_documents"
LLAMA_MODEL = "llama3.1:8b"


def get_collection():
    client = chromadb.PersistentClient(path="./chroma_data")
    return client.get_collection(name=COLLECTION_NAME)


# Slide 12: embed the question, search ChromaDB. This is the Retrieval
# half of RAG - no LLM involved yet. Returns metadata alongside the text
# so callers can report which project/supplier backed the answer (Slide
# 6's "sources" field) - ingest.py already stores that on every document.
def retrieve(question, n_results=3, source=None):
    collection = get_collection()
    query_embedding = embed(question)
    where = {"source": source} if source else None
    results = collection.query(query_embeddings=[query_embedding], n_results=n_results, where=where)
    return results["documents"][0], results["metadatas"][0]


# Slide 14: user question + retrieved context -> one grounded prompt.
def build_prompt(question, context_docs):
    context = "\n".join(context_docs) if context_docs else "(nothing retrieved)"
    return f"Context:\n{context}\n\nQuestion:\n{question}"


# Slide 17: "hide the complexity behind one function." Prints the
# retrieved context on its way through (Slide 13's "we only retrieved
# context, the LLM hasn't answered yet" is worth keeping visible, not
# hiding it, per this whole course's "verify, don't blindly trust" rule)
# and returns the answer plus which real records backed it (Session 18
# Slide 6's response shape) - api.py hands this straight back as JSON.
def ask_rag(question, n_results=3, source=None):
    context_docs, context_metadatas = retrieve(question, n_results=n_results, source=source)

    print("  Retrieved context:")
    if not context_docs:
        print("    (none - nothing in the collection matched)")
    for doc in context_docs:
        print(f"    - {doc}")

    prompt = build_prompt(question, context_docs)
    response = ollama.chat(
        model=LLAMA_MODEL,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": prompt}
        ],
        # Low temperature on purpose: this is grounded Q&A over real
        # numbers, not creative writing. Default sampling was caught live
        # adding a "$" to figures that have no currency unit in this
        # system - about 1 in 3 answers, inconsistently - because higher
        # temperature means less reliable adherence to a formatting rule,
        # not just more varied wording.
        options={"temperature": 0.1}
    )

    sources = [
        f"{'Project' if m['source'] == 'project' else 'Supplier'} {m['id']}"
        for m in context_metadatas
    ]
    return {"answer": response["message"]["content"], "sources": sources}


def run_and_print(question):
    print(f"\nQ: {question}")
    result = ask_rag(question)
    print("A:", result["answer"])
    print("   Sources:", ", ".join(result["sources"]) if result["sources"] else "(none)")


if __name__ == "__main__":
    if len(sys.argv) > 1:
        # python rag.py "your question" - ask exactly one, live
        run_and_print(" ".join(sys.argv[1:]))
    else:
        # Session 16/17's four practical-challenge questions
        for q in [
            "Which project has the highest stock value?",
            "Which project has aging inventory?",
            "Tell me about Project C.",
            "Which projects have inventory older than 365 days?"
        ]:
            run_and_print(q)

        # Slide 19's challenge: ask something the data has no answer for,
        # and see whether the model admits it instead of inventing one.
        run_and_print("What is the capital of France?")
