import os
import json
import random
import shutil

YEARS = [2021, 2022, 2023, 2024, 2025]
RAW_PHOTOS_DIR = "data_prep/raw_photos"

SMART_TAGS = {
    "beach_and_sea": [
        ["sunset", "waves", "friends talking"],
        ["red umbrella", "sandcastle", "sunny day"],
        ["swimming", "group of friends laughing", "water"],
        ["blurry", "running on beach", "candid"],
        ["sunglasses", "beach towel", "relaxing"]
    ],
    "birthday_and_celebrations": [
        ["cutting cake", "dim lighting", "candles"],
        ["balloons", "group photo", "smiling"],
        ["blurry", "laughing", "party hats"],
        ["indoor", "clinking glasses", "celebration"],
        ["gift boxes", "candid", "messy table"]
    ],
    "cafe_and_restaurant": [
        ["coffee cup", "sitting at table", "indoor"],
        ["food on table", "eating", "restaurant lighting"],
        ["talking with hands", "group of friends", "window seat"],
        ["candid", "laughing", "messy table"],
        ["menu", "drinks", "evening"]
    ],
    "mountains_and_trek": [
        ["hiking gear", "mountain view", "sunny"],
        ["group resting", "trees", "trail"],
        ["sunset", "silhouette", "landscape"],
        ["blurry", "walking", "backpack"],
        ["candid", "exhausted but happy", "nature"]
    ],
    "college_and_friends": [
        ["campus", "backpacks", "group of friends"],
        ["sitting on grass", "sunny day", "talking"],
        ["corridor", "indoor", "candid"],
        ["blurry", "laughing", "walking to class"],
        ["studying", "laptops", "messy desk"]
    ],
    "nature_and_parks": [
        ["picnic blanket", "trees", "sunny"],
        ["walking dog", "grass", "relaxing"],
        ["flowers", "group of friends", "outdoor"],
        ["candid", "cloudy", "park bench"],
        ["sunset", "lake", "scenic"]
    ],
    "transport": [
        ["inside car", "roadtrip", "friends"],
        ["bus", "looking out window", "traveling"],
        ["airport terminal", "luggage", "waiting"],
        ["candid", "sleeping", "blurry"],
        ["driving", "sunset", "dashboard"]
    ],
    "market_and_street": [
        ["crowded street", "shopping", "friends"],
        ["street food", "eating", "night market"],
        ["neon lights", "dim lighting", "walking"],
        ["blurry", "candid", "carrying bags"],
        ["vendors", "daytime", "busy"]
    ]
}

def main():
    metadata = []
    global_index = 0
    unique_photos_data = {}
    
    # Read unique photos
    for category in os.listdir(RAW_PHOTOS_DIR):
        cat_dir = os.path.join(RAW_PHOTOS_DIR, category)
        if not os.path.isdir(cat_dir): continue
        
        photos = [f for f in os.listdir(cat_dir) if f.endswith(".jpg") and not "_padded_" in f]
        photos.sort()
        unique_photos_data[category] = photos

    TARGET_PER_CAT = 100
    
    # Process, Tag, and Pad
    for category, unique_list in unique_photos_data.items():
        if not unique_list: continue
        cat_dir = os.path.join(RAW_PHOTOS_DIR, category)
        current_count = 0
        tag_sets = SMART_TAGS.get(category, [["photo", "memory"]])
        
        base_meta = []
        for i, photo_file in enumerate(unique_list):
            photo_id = f"{category}_{current_count:03d}"
            old_path = os.path.join(cat_dir, photo_file)
            new_path = os.path.join(cat_dir, f"{photo_id}.jpg")
            if old_path != new_path:
                os.rename(old_path, new_path)
                
            tags = tag_sets[i % len(tag_sets)]
            year = YEARS[global_index % len(YEARS)]
            month = random.randint(1, 12)
            global_index += 1
            
            meta = {
                "id": photo_id,
                "category": category,
                "year": year,
                "month": month,
                "variation_tags": tags,
                "file_path": new_path
            }
            metadata.append(meta)
            base_meta.append(meta)
            current_count += 1
            
        # Pad to 100
        idx = 0
        while current_count < TARGET_PER_CAT:
            b_meta = base_meta[idx % len(base_meta)]
            photo_id = f"{category}_{current_count:03d}"
            
            src_path = b_meta["file_path"]
            dst_path = os.path.join(cat_dir, f"{photo_id}.jpg")
            shutil.copy2(src_path, dst_path)
            
            year = YEARS[global_index % len(YEARS)]
            month = random.randint(1, 12)
            global_index += 1
            
            metadata.append({
                "id": photo_id,
                "category": category,
                "year": year,
                "month": month,
                "variation_tags": b_meta["variation_tags"],
                "file_path": dst_path
            })
            current_count += 1
            idx += 1
            
    with open("data_prep/metadata.json", "w") as f:
        json.dump(metadata, f, indent=2)

if __name__ == "__main__":
    main()
