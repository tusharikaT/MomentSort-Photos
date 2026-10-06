import os
import json
import base64
import random
import requests
import time
import shutil

API_KEY = "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"
HEADERS = {
    "x-api-key": API_KEY,
    "anthropic-version": "2023-06-01",
    "content-type": "application/json"
}

YEARS = [2021, 2022, 2023, 2024, 2025]
RAW_PHOTOS_DIR = "data_prep/raw_photos"

PROMPT = """You are an expert AI assisting in building a semantic photo search engine. I am providing you with an image and its preliminary category: {category}.

Your task is to analyze the image exactly like a human "Memory Keeper" trying to recall a past moment.

Step 1: Category Verification
Does the photo actually belong in the provided category? If it does, keep it. If it clearly belongs somewhere else, recategorize it into the best fit from this list: [beach_and_sea, birthday_and_celebrations, cafe_and_restaurant, mountains_and_trek, college_and_friends, nature_and_parks, transport, market_and_street, everyday_random].

Step 2: Human-Recall Tagging
Extract 3 to 6 highly descriptive "variation tags" that a human would actually type in a search bar to find this specific photo. (e.g. "red umbrella", "sunset", "group of friends laughing", "blurry", "holding coffee cup", "dim lighting").

Output exactly in this JSON format (no markdown, just raw JSON):
{{
  "verified_category": "string",
  "variation_tags": ["tag1", "tag2", "tag3"]
}}"""

def encode_image(image_path):
    with open(image_path, "rb") as image_file:
        return base64.b64encode(image_file.read()).decode('utf-8')

def get_haiku_metadata(image_path, category):
    base64_image = encode_image(image_path)
    
    payload = {
        "model": "claude-haiku-4-5-20251001",
        "max_tokens": 300,
        "messages": [
            {
                "role": "user",
                "content": [
                    {
                        "type": "image",
                        "source": {
                            "type": "base64",
                            "media_type": "image/jpeg",
                            "data": base64_image
                        }
                    },
                    {
                        "type": "text",
                        "text": PROMPT.format(category=category)
                    }
                ]
            }
        ]
    }
    
    for attempt in range(3):
        try:
            response = requests.post("https://api.anthropic.com/v1/messages", headers=HEADERS, json=payload, timeout=15)
            response.raise_for_status()
            text_response = response.json()['content'][0]['text']
            
            if "```json" in text_response:
                text_response = text_response.split("```json")[1].split("```")[0].strip()
            elif "```" in text_response:
                text_response = text_response.split("```")[1].split("```")[0].strip()
                
            return json.loads(text_response)
        except Exception as e:
            print(f"Attempt {attempt+1} failed for {image_path}: {e}")
            time.sleep(2)
            
    return {
        "verified_category": category,
        "variation_tags": ["photo", "memory"]
    }

def main():
    import hashlib
    metadata = []
    global_index = 0
    
    unique_hashes = {} # hash -> haiku_data
    
    print("Hashing photos to find unique base images...")
    
    for category in os.listdir(RAW_PHOTOS_DIR):
        cat_dir = os.path.join(RAW_PHOTOS_DIR, category)
        if not os.path.isdir(cat_dir): continue
        
        photos = [f for f in os.listdir(cat_dir) if f.endswith(".jpg")]
        photos.sort()
        
        print(f"\nProcessing {category} ({len(photos)} photos total)...")
        
        for photo_file in photos:
            file_path = os.path.join(cat_dir, photo_file)
            
            with open(file_path, "rb") as f:
                file_hash = hashlib.md5(f.read()).hexdigest()
                
            if file_hash not in unique_hashes:
                print(f"New unique photo found: {photo_file}. Sending to Haiku...")
                haiku_data = get_haiku_metadata(file_path, category)
                unique_hashes[file_hash] = haiku_data
            else:
                # Use cached metadata for duplicate photos
                haiku_data = unique_hashes[file_hash]
                
            year = YEARS[global_index % len(YEARS)]
            month = random.randint(1, 12)
            global_index += 1
            
            photo_id = photo_file.replace(".jpg", "")
            
            metadata.append({
                "id": photo_id,
                "category": haiku_data["verified_category"],
                "year": year,
                "month": month,
                "variation_tags": haiku_data["variation_tags"],
                "file_path": file_path
            })
            
    with open("data_prep/metadata.json", "w") as f:
        json.dump(metadata, f, indent=2)
        
    print(f"\nGenerated metadata for {len(metadata)} photos.")
    print(f"Total unique base photos sent to Haiku: {len(unique_hashes)}")

if __name__ == "__main__":
    main()
