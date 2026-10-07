"""
Session 16 follow-up - "ChromaDB, how do I SEE the data?"

MongoDB has Compass; ChromaDB doesn't ship an equivalent local GUI (its
`chroma run` server CLI didn't even start cleanly in this environment -
silently exits, no output, likely a Windows console quirk in its
typer/rich layer - not worth chasing for a viewer). This script is the
practical answer: print every row, grouped and readable, straight from
the same local collection ingest.py/search.py already use.

Doesn't need the backend running - unlike ingest.py, this only reads what
was already persisted to ./chroma_data on a previous `python ingest.py`.

Run:  python view_data.py            (everything)
      python view_data.py project     (only source="project")
      python view_data.py supplier    (only source="supplier")
"""

import sys

import chromadb

COLLECTION_NAME = "inventory_documents"


def main():
    client = chromadb.PersistentClient(path="./chroma_data")

    try:
        collection = client.get_collection(name=COLLECTION_NAME)
    except Exception:
        print(f"No '{COLLECTION_NAME}' collection found in ./chroma_data.")
        print("Run `python ingest.py` first.")
        return

    only_source = sys.argv[1] if len(sys.argv) > 1 else None
    where = {"source": only_source} if only_source else None

    data = collection.get(where=where)
    ids = data["ids"]
    documents = data["documents"]
    metadatas = data["metadatas"]

    if not ids:
        print(f"No documents found" + (f" with source='{only_source}'" if only_source else "") + ".")
        return

    rows = sorted(zip(ids, documents, metadatas), key=lambda r: (r[2].get("source", ""), -r[2].get("stockValue", 0)))

    current_source = None
    for doc_id, text, metadata in rows:
        source = metadata.get("source", "?")
        if source != current_source:
            current_source = source
            print(f"\n=== source: {source} ===")
        print(f"\n[{doc_id}]  stockValue={metadata.get('stockValue')}")
        print(f"  {text}")

    print(f"\n---\n{len(ids)} document(s) shown"
          + (f" (filtered to source='{only_source}')" if only_source else " (all sources)")
          + f". Collection total: {collection.count()}.")


if __name__ == "__main__":
    main()
