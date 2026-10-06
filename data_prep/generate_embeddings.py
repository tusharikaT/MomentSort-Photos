import json
import numpy as np
import pickle
from sklearn.feature_extraction.text import TfidfVectorizer

def generate_embeddings():
    print("Using TF-IDF (Lightweight) instead of CLIP to prevent memory crashes...")
    
    with open("data_prep/metadata.json", "r") as f:
        metadata = json.load(f)
        
    print(f"Generating embeddings for {len(metadata)} photos...")
    
    # We will use the category + variation tags as the "document" for each photo
    documents = []
    for photo in metadata:
        category_text = photo["category"].replace("_", " ")
        tags_text = " ".join(photo["variation_tags"])
        # Give category more weight by repeating it
        doc = f"{category_text} {category_text} {tags_text}"
        documents.append(doc)
        
    # Create and train TF-IDF Vectorizer
    # Max features set to 512 to mimic the CLIP embedding size so the rest of the app doesn't need to change much
    vectorizer = TfidfVectorizer(max_features=512, stop_words='english')
    embeddings = vectorizer.fit_transform(documents).toarray()
    
    # Pad to exactly 512 dimensions if the vocabulary is smaller
    if embeddings.shape[1] < 512:
        padding = np.zeros((embeddings.shape[0], 512 - embeddings.shape[1]))
        embeddings = np.hstack((embeddings, padding))
        
    # Normalize for cosine similarity
    row_norms = np.linalg.norm(embeddings, axis=1, keepdims=True)
    # Avoid division by zero
    row_norms[row_norms == 0] = 1.0
    embeddings = embeddings / row_norms
    
    embeddings_arr = np.array(embeddings, dtype=np.float32)
    
    np.save("backend/data/embeddings.npy", embeddings_arr)
    
    # Save the vectorizer so the backend can use it for the search query
    with open("backend/data/vectorizer.pkl", "wb") as f:
        pickle.dump(vectorizer, f)
        
    print(f"Saved embeddings.npy with shape {embeddings_arr.shape}")
    print("Saved vectorizer.pkl for backend search endpoint.")

if __name__ == "__main__":
    generate_embeddings()
