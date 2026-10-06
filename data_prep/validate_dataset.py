import json
import numpy as np

def validate():
    print("Validating dataset...")
    
    # 1. Check embeddings
    try:
        embeddings = np.load("../backend/data/embeddings.npy")
        print(f"✅ embeddings.npy loaded, shape: {embeddings.shape}")
        if embeddings.shape != (800, 512):
            print(f"❌ Warning: Expected shape (800, 512), got {embeddings.shape}")
    except Exception as e:
        print(f"❌ Error loading embeddings: {e}")
        
    # 2. Check photos.json
    try:
        with open("../backend/data/photos.json", "r") as f:
            photos = json.load(f)
            
        print(f"✅ photos.json loaded, count: {len(photos)}")
        if len(photos) != 800:
            print(f"❌ Warning: Expected 800 photos, got {len(photos)}")
            
        # 3. Check URLs
        missing_urls = sum(1 for p in photos if "cloudinary_url" not in p)
        if missing_urls > 0:
            print(f"❌ Error: {missing_urls} photos missing 'cloudinary_url'")
        else:
            print("✅ All photos have 'cloudinary_url'")
            
        # 4. Check Year Distribution
        years = {}
        for p in photos:
            years[p["year"]] = years.get(p["year"], 0) + 1
            
        print("Year distribution:")
        for y, count in sorted(years.items()):
            print(f"  {y}: {count}")
            
        # 5. Check duplicate IDs
        ids = [p["id"] for p in photos]
        if len(ids) != len(set(ids)):
            print(f"❌ Error: Found duplicate IDs! ({len(ids)} total, {len(set(ids))} unique)")
        else:
            print("✅ No duplicate IDs")
            
        print("\nPhase 1 Data Prep is valid! Keep raw_photos/ until project is fully done.")
        
    except Exception as e:
        print(f"❌ Error validating photos.json: {e}")

if __name__ == "__main__":
    validate()
