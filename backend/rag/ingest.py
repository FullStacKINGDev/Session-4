"""
Session 16 ChromaDB Hands-On -> Session 17 Building the RAG Pipeline
Pulls REAL rows from our own Node API (GET /api/dashboard/projects and
/suppliers, built in Sessions 13-14) and turns each one into a document +
metadata pair, same as Session 16.

Session 17 upgrade: embeddings are now generated explicitly with Ollama
(Slide 9-10) instead of letting Chroma's built-in default embedding
function handle it. Same reason Slide 11 gives: the embedding model used
here has to match the one search.py/rag.py use when embedding a question,
or similarity search is comparing vectors from two different spaces. See
embeddings.py - the one shared place that names the model.

On chunking (Slides 5-6): our source data doesn't need splitting - one
project row or one supplier row is already exactly one useful, focused
piece of knowledge. The "chunk" IS the document; there's no large blob to
divide further. Worth saying out loud in class: chunking is a real
decision, not a mandatory step, and the right chunk size here is "one
record."

Two document types (project + supplier) share one collection on purpose -
see Slide 15's metadata filter, which needs more than one `source` value
to demonstrate anything.

Run:  python ingest.py          (requires the backend running on :5000)
      python ingest.py --reset   (wipe the collection first, then reload -
                                   required once when upgrading from a
                                   collection built with Chroma's 384-dim
                                   default embedder to nomic-embed-text's
                                   768-dim vectors; Chroma locks a
                                   collection's dimension at creation)
"""

import sys

import chromadb
import requests

from embeddings import EMBEDDING_MODEL, embed

API_URL = "http://localhost:5000"
COLLECTION_NAME = "inventory_documents"


def fetch_json(path):
    try:
        response = requests.get(f"{API_URL}{path}", timeout=10)
    except requests.exceptions.ConnectionError:
        print(f"Could not reach the API at {API_URL}. Is the backend running? (cd backend && npm start)")
        sys.exit(1)

    if not response.ok:
        print(f"API request failed: {response.status_code} {response.reason}")
        sys.exit(1)

    body = response.json()
    if not body.get("success"):
        print(f"API returned an error: {body.get('message')}")
        sys.exit(1)

    return body["data"]


def project_document(project):
    text = (
        f"Project {project['projectName']} has a stock value of {project['stockValue']:.2f}. "
        f"Of that, {project['under90']:.2f} is under 90 days old, {project['over90']:.2f} is "
        f"90 to 180 days old, {project['over180']:.2f} is 180 to 365 days old, and "
        f"{project['over365']:.2f} is older than 365 days."
    )
    metadata = {
        "source": "project",
        "id": project["projectName"],
        "stockValue": float(project["stockValue"])
    }
    return f"project-{project['projectName']}", text, metadata


def supplier_document(supplier):
    text = (
        f"Supplier {supplier['supplierName']} has a committed stock value of "
        f"{supplier['stockValue']:.2f}."
    )
    metadata = {
        "source": "supplier",
        "id": supplier["supplierName"],
        "stockValue": float(supplier["stockValue"])
    }
    return f"supplier-{supplier['supplierName']}", text, metadata


def main():
    client = chromadb.PersistentClient(path="./chroma_data")

    if "--reset" in sys.argv:
        try:
            client.delete_collection(COLLECTION_NAME)
            print(f"--reset: cleared existing '{COLLECTION_NAME}' collection")
        except Exception:
            pass  # didn't exist yet - nothing to clear

    collection = client.get_or_create_collection(name=COLLECTION_NAME)

    projects = fetch_json("/api/dashboard/projects")["projects"]
    suppliers = fetch_json("/api/dashboard/suppliers")["suppliers"]
    print(f"Fetched {len(projects)} projects and {len(suppliers)} suppliers from {API_URL}")

    ids, documents, metadatas = [], [], []
    for project in projects:
        doc_id, text, metadata = project_document(project)
        ids.append(doc_id)
        documents.append(text)
        metadatas.append(metadata)

    for supplier in suppliers:
        doc_id, text, metadata = supplier_document(supplier)
        ids.append(doc_id)
        documents.append(text)
        metadatas.append(metadata)

    print(f"Generating {len(documents)} embeddings with Ollama ({EMBEDDING_MODEL})...")
    embeddings = [embed(text) for text in documents]

    # upsert (not add) so re-running after a data refresh updates existing
    # rows instead of erroring on duplicate IDs
    collection.upsert(ids=ids, documents=documents, metadatas=metadatas, embeddings=embeddings)

    print(f"Added/updated {len(ids)} documents in '{COLLECTION_NAME}' "
          f"({len(projects)} project docs, {len(suppliers)} supplier docs)")
    print(f"Collection now holds {collection.count()} documents total.")
    print("\nSample document:")
    print(" ", documents[0])
    print(" ", metadatas[0])
    print(" embedding dimensions:", len(embeddings[0]))


if __name__ == "__main__":
    main()
