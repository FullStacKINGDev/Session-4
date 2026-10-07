"""
Session 17 - one shared place for the embedding model name and the actual
Ollama call. Slide 11's warning made structural rather than just a comment:
"Use the same embedding model when indexing documents and querying
questions" - ingest.py and search.py/rag.py both import embed() from here,
so there's exactly one place that could ever drift out of sync.
"""

import ollama

EMBEDDING_MODEL = "nomic-embed-text"


def embed(text):
    response = ollama.embed(model=EMBEDDING_MODEL, input=text)
    return response["embeddings"][0]
