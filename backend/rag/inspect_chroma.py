"""
Session 16, Slide 16 - "We shouldn't blindly assume ingestion worked."
Runs the trainer's own verification checklist against the real collection
instead of eyeballing collection.get() output.

Session 17 fix: this used to query with query_texts, which asks Chroma's
built-in 384-dim default embedder to embed the search string. Once
ingest.py switched to explicit 768-dim Ollama embeddings (Session 17),
that raised chromadb.errors.InvalidArgumentError - "expecting embedding
with dimension of 768, got 384." A real consequence of the upgrade, not a
hypothetical: this script hit it on the first run after ingest.py changed.
Fixed the same way search.py/rag.py do it - embed the query ourselves with
the same model and pass query_embeddings.

Run:  python inspect_chroma.py
"""

import chromadb

from embeddings import embed

COLLECTION_NAME = "inventory_documents"


def check(label, passed, detail=""):
    mark = "PASS" if passed else "FAIL"
    print(f"[{mark}] {label}" + (f" - {detail}" if detail else ""))
    return passed


def main():
    client = chromadb.PersistentClient(path="./chroma_data")

    names = [c.name for c in client.list_collections()]
    exists = COLLECTION_NAME in names
    check("Collection exists", exists, f"collections on disk: {names}")
    if not exists:
        print("\nRun `python ingest.py` first.")
        return

    collection = client.get_collection(name=COLLECTION_NAME)
    data = collection.get()
    ids = data["ids"]
    documents = data["documents"]
    metadatas = data["metadatas"]

    check("Documents were added", len(ids) > 0, f"{len(ids)} documents")
    check("IDs are unique", len(ids) == len(set(ids)), f"{len(set(ids))} unique of {len(ids)}")

    sources = {m.get("source") for m in metadatas}
    has_required_keys = all("source" in m and "id" in m for m in metadatas)
    check("Metadata is correct", has_required_keys, f"source values present: {sorted(sources)}")

    results = collection.query(query_embeddings=[embed("aging inventory")], n_results=3)
    returned = len(results["ids"][0])
    check("Query returns results", returned > 0, f"{returned} results for 'aging inventory'")

    print("\nSample row:")
    print(" id:      ", ids[0])
    print(" document:", documents[0])
    print(" metadata:", metadatas[0])

    print(f"\n{len(ids)} total documents "
          f"({sum(1 for m in metadatas if m.get('source') == 'project')} project, "
          f"{sum(1 for m in metadatas if m.get('source') == 'supplier')} supplier).")


if __name__ == "__main__":
    main()
