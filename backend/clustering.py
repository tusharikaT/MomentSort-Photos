import numpy as np
from sklearn.cluster import KMeans
from collections import Counter

def generate_chips(result_photo_ids, embeddings_matrix, photos_lookup):
    N = len(result_photo_ids)
    if N <= 20:
        return []

    # 2 to 6 clusters
    k = max(2, min(6, N // 12))
    
    # Get embeddings for the returned photos
    result_embeddings = np.array([embeddings_matrix[photos_lookup[pid]['index']] for pid in result_photo_ids])

    # Suppress sklearn convergence warnings
    import warnings
    with warnings.catch_warnings():
        warnings.simplefilter("ignore")
        kmeans = KMeans(n_clusters=k, random_state=42, n_init=10)
        labels = kmeans.fit_predict(result_embeddings)

    chips = []
    used_labels = set()
    
    for cluster_id in range(k):
        cluster_photo_ids = [result_photo_ids[i] for i, l in enumerate(labels) if l == cluster_id]
        if not cluster_photo_ids:
            continue
            
        label = get_chip_label(cluster_photo_ids, photos_lookup)
        
        if label not in used_labels:
            chips.append({
                "chip_label": label,
                "photo_ids": cluster_photo_ids
            })
            used_labels.add(label)

    # Max 6 chips
    return chips[:6]

def get_chip_label(photo_ids, photos_lookup):
    all_tags = []
    
    for pid in photo_ids:
        photo = photos_lookup[pid]
        all_tags.extend(photo.get("variation_tags", []))
        
    if not all_tags:
        return "Misc"
        
    # Use most common variation tag
    tag_counts = Counter(all_tags)
    top_tag = tag_counts.most_common(1)[0][0]
    # Format label: "with_umbrella" -> "With Umbrella"
    return top_tag.replace("_", " ").title()
