import os
import shutil
import requests
import time

CATEGORIES = {
    "beach_and_sea": "beach,friends",
    "birthday_and_celebrations": "birthday,party",
    "cafe_and_restaurant": "cafe,friends",
    "mountains_and_trek": "hiking,mountains",
    "college_and_friends": "college,students",
    "nature_and_parks": "park,picnic",
    "transport": "roadtrip,car",
    "market_and_street": "market,crowd"
}

OUT_DIR = "data_prep/flickr_photos"
TARGET_PHOTOS_PER_CAT = 100

def get_burst_from_user(user_id, count=5):
    # This grabs the recent photos from a specific user.
    # Users upload batches of photos from the same event, so this returns perfect "bursts"
    url = f"https://www.flickr.com/services/feeds/photos_public.gne?id={user_id}&format=json&nojsoncallback=1"
    try:
        res = requests.get(url, timeout=10).json()
        items = res.get("items", [])
        # Get the large version of the photo
        return [item["media"]["m"].replace("_m.jpg", "_b.jpg") for item in items][:count]
    except Exception as e:
        return []

def generate():
    if os.path.exists(OUT_DIR):
        shutil.rmtree(OUT_DIR)
    os.makedirs(OUT_DIR, exist_ok=True)
    
    for cat, tags in CATEGORIES.items():
        print(f"Processing Flickr bursts for {cat}...")
        cat_dir = os.path.join(OUT_DIR, cat)
        os.makedirs(cat_dir, exist_ok=True)
        
        # Step 1: Search for recent photos to find seed users
        url = f"https://www.flickr.com/services/feeds/photos_public.gne?tags={tags}&format=json&nojsoncallback=1"
        try:
            res = requests.get(url, timeout=10).json()
            items = res.get("items", [])
        except:
            items = []
            
        downloaded = 0
        seen_users = set()
        
        # Step 2: Extract bursts from those users
        for item in items:
            if downloaded >= TARGET_PHOTOS_PER_CAT: break
            
            author_id = item.get("author_id")
            if not author_id or author_id in seen_users: 
                continue
                
            seen_users.add(author_id)
            
            burst_urls = get_burst_from_user(author_id, count=5)
            
            for img_url in burst_urls:
                if downloaded >= TARGET_PHOTOS_PER_CAT: break
                try:
                    img_data = requests.get(img_url, timeout=5).content
                    with open(os.path.join(cat_dir, f"{cat}_{downloaded:03d}.jpg"), "wb") as f:
                        f.write(img_data)
                    downloaded += 1
                except:
                    pass
            
            # Be polite to the public API
            time.sleep(1) 
            
        print(f"Successfully generated {downloaded} burst photos for {cat}")
            
if __name__ == "__main__":
    generate()
    print("Flickr burst extraction complete!")
