# import chromadb # Disabled for demo stability
import uuid
from typing import List

# Simple in-memory storage for the demo
# This avoids complex dependency issues with ChromaDB/Pydantic on some systems.
documents = []

def add_policy_document(text: str, source: str = "manual_entry"):
    """
    Adds a document to the knowledge base (In-Memory List).
    """
    doc_id = str(uuid.uuid4())
    documents.append({"id": doc_id, "text": text, "source": source})
    print(f"Added document {doc_id} from {source}")

def query_policies(query_text: str, n_results: int = 2) -> str:
    """
    Simple keyword search for the demo.
    """
    query_words = query_text.lower().split()
    results = []
    
    for doc in documents:
        score = 0
        doc_lower = doc["text"].lower()
        for word in query_words:
            if word in doc_lower:
                score += 1
        
        if score > 0:
            results.append((score, doc["text"]))
    
    # Sort by score
    results.sort(key=lambda x: x[0], reverse=True)
    
    # Take top N
    top_results = [r[1] for r in results[:n_results]]
    
    if not top_results:
        return ""
    
    # Combine the top results
    context = "\n\n".join(top_results)
    return f"RELEVANT COMPANY POLICIES:\n{context}\n"

# Seed with some initial knowledge for the demo
if __name__ == "__main__":
    # Example usage
    sample_policy = """
    RETURN POLICY:
    Customers can return items within 30 days of purchase. 
    Items must be in original condition. 
    Refunds are processed to the original payment method within 5-7 business days.
    """
    add_policy_document(sample_policy, "init_script")
    print(f"Knowledge base seeded with {len(documents)} documents.")
