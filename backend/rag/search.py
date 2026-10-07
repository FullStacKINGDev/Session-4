"""
Session 16 Slide 18 -> Session 17 Slides 11-13.
Session 17 upgrade: the question is now embedded explicitly with Ollama
(same model as ingest.py, via embeddings.py) and the collection is queried
with query_embeddings=[...] instead of letting Chroma embed query_texts
for us. Mechanically different call, same retrieval idea as Session 16.

Run:  python search.py
"""

import chromadb

from embeddings import embed

COLLECTION_NAME = "inventory_documents"


def get_collection():
    client = chromadb.PersistentClient(path="./chroma_data")
    return client.get_collection(name=COLLECTION_NAME)


# Slide 19 (Session 16) stretch goal, still here: a reusable search
# function. `source` maps to Slide 15's metadata filter - pass "project" or
# "supplier" to search only one document type, or leave it unset for both.
def search_inventory(question, n_results=3, source=None):
    collection = get_collection()
    query_embedding = embed(question)  # Slide 11: question -> vector, same model as ingestion
    where = {"source": source} if source else None
    return collection.query(query_embeddings=[query_embedding], n_results=n_results, where=where)


def show(question, results):
    print(f'\nQ: "{question}"')
    ids = results["ids"][0]
    documents = results["documents"][0]
    distances = results["distances"][0]
    for doc_id, text, distance in zip(ids, documents, distances):
        print(f"  [{doc_id}] (distance={distance:.3f})")
        print(f"    {text}")


if __name__ == "__main__":
    # The four questions from Session 16 Slide 19 / Session 17 Slide 19
    questions = [
        "Which project has the highest stock?",
        "Which projects have aging inventory?",
        "Tell me about Project C.",
        "Which project has inventory older than 365 days?"
    ]
    for q in questions:
        show(q, search_inventory(q))

    # Metadata filter demo, same as Session 16 - same question, narrowed
    # to suppliers only.
    print("\n--- Same question, filtered to suppliers only ---")
    show("Which has aging inventory?", search_inventory("Which has aging inventory?", source="supplier"))
