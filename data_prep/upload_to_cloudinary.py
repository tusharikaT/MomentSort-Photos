import json
import os
import shutil
import cloudinary.uploader
from dotenv import load_dotenv

load_dotenv("backend/.env")

def process_photos():
    with open("data_prep/metadata.json", "r") as f:
        metadata = json.load(f)
        
    has_cloudinary = all(os.environ.get(k) and os.environ.get(k) != f"your_{k.split('_')[-1].lower()}" 
                         for k in ["CLOUDINARY_CLOUD_NAME", "CLOUDINARY_API_KEY", "CLOUDINARY_API_SECRET"])

    if not has_cloudinary:
        print("Cloudinary credentials not configured or using defaults. Using local serving fallback.")
        os.makedirs("backend/data/static", exist_ok=True)
    
    results = []
    
    for i, photo in enumerate(metadata):
        if has_cloudinary:
            try:
                if i % 10 == 0:
                    print(f"Uploading {i}/{len(metadata)} to Cloudinary...")
                res = cloudinary.uploader.upload(
                    photo["file_path"],
                    public_id=photo["id"],
                    folder="momentsort"
                )
                photo["cloudinary_url"] = res["secure_url"]
            except Exception as e:
                print(f"Cloudinary upload failed for {photo['id']}: {e}. Falling back to local.")
                has_cloudinary = False
                os.makedirs("backend/data/static", exist_ok=True)
                
        if not has_cloudinary:
            # Copy to static folder for FastAPI to serve
            dest = f"backend/data/static/{photo['id']}.jpg"
            shutil.copy(photo["file_path"], dest)
            photo["cloudinary_url"] = f"http://localhost:8000/static/{photo['id']}.jpg"
            
        # Clean up the file path from metadata as it's not needed in frontend
        photo.pop("file_path", None)
        # Add a sequential index so clustering logic can map photo_id -> embedding index
        photo["index"] = i
        results.append(photo)
        
    with open("backend/data/photos.json", "w") as f:
        json.dump(results, f, indent=2)
        
    print(f"Processed and saved {len(results)} photos to photos.json")

if __name__ == "__main__":
    process_photos()
