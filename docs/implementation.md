# MomentSort MVP - Implementation Plan
### Version 1.0 | Based on approved architecture.md and context_momentsort.md

---

## Overview

| Phase | Name | Where it runs | Est. time |
|---|---|---|---|
| 0 | Project Setup | Laptop | 1-2 hours |
| 1 | Data Preparation | Laptop (one-time) | 3-6 hours |
| 2 | Backend | Railway (FastAPI) | 4-6 hours |
| 3 | Frontend | Vercel (React/Vite) | 8-12 hours |
| 4 | Behavioral Logging | Local JSONL file | 1-2 hours |
| 5 | Integration and Testing | Local + deployed | 2-4 hours |
| 6 | Deployment | Vercel + Railway | 1-2 hours |

**Total estimated time: 21-35 hours**

---

## Phase 0 - Project Setup

### 0.1 Folder Structure

```
momentsort/
+-- frontend/
+-- backend/
+-- data_prep/
```

### 0.2 Initialize Frontend (Vite + React)

```bash
cd momentsort/frontend
npm create vite@latest . -- --template react
npm install
npm install axios uuid
```

### 0.3 Initialize Backend

```bash
cd momentsort/backend
python -m venv venv
pip install fastapi uvicorn open_clip_torch faiss-cpu scikit-learn numpy pillow requests cloudinary python-dotenv
pip freeze > requirements.txt
```

### 0.4 Create .env Files

backend/.env:
```
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

frontend/.env:
```
VITE_BACKEND_URL=http://localhost:8000
```

**Phase 0 done when:** Both dev servers start without errors.

---

## Phase 1 - Data Preparation (Laptop, One-Time)

Run once. Produces embeddings.npy and photos.json. Raw photos are kept locally until you decide to delete them.

### 1.1 download_photos.py

Downloads 100 photos x 8 categories = 800 photos from Pexels and Unsplash free APIs.
Saves to data_prep/raw_photos/{category}/.

Categories:
- beach_and_sea
- birthday_and_celebrations
- cafe_and_restaurant
- mountains_and_trek
- college_and_friends
- nature_and_parks
- transport
- market_and_street

Per-category filters: color diversity, JPEG/PNG only, min 800x600 resolution.
Output: 800 photos (~160MB)

### 1.2 assign_metadata.py

Reads 800 existing photos, identifies exactly 246 unique base photos via hashing, and sends only the unique ones to the Haiku API for variation tagging to save time and API costs. Maps the resulting tags to all duplicates. Assigns year (2021-2025) and month (random 1-12).
Writes data_prep/metadata.json.

Variation tag rules:
- beach_and_sea: with_umbrella, sunset, with_people, with_boat, alone
- birthday_and_celebrations: with_cake, with_balloons, indoor, outdoor, group
- cafe_and_restaurant: coffee_cup, food_on_table, interior, outdoor_seating
- mountains_and_trek: landscape, with_tent, with_person, sunset, snow
- college_and_friends: group_sitting, classroom, corridor, outdoors
- nature_and_parks: trees, flowers, animals, river
- transport: car_interior, bus, bike, airport
- market_and_street: vegetables, clothes_stall, street_food, crowd

Output schema per photo:
```json
{
  "id": "photo_001",
  "category": "beach_and_sea",
  "year": 2023,
  "month": 7,
  "variation_tags": ["with_umbrella", "sunset"]
}
```

### 1.3 generate_embeddings.py

Runs CLIP vision encoder (ViT-B-32) on all 800 photos.
Normalizes vectors for cosine similarity.
Saves as shape (800, 512) float32 to backend/data/embeddings.npy.
Expected time: 60-120 minutes on CPU.

### 1.4 upload_to_cloudinary.py

Uploads all 800 photos to Cloudinary to get CDN URLs. If Cloudinary credentials (API keys) are missing, it automatically falls back to copying the images into `backend/data/static/` for local serving via FastAPI.
Merges URLs into metadata and writes `backend/data/photos.json`.

### 1.5 validate_dataset.py

Checks before cleanup:
- embeddings.npy shape == (800, 512)
- All 800 photos have cloudinary_url
- Year distribution: 150-170 photos per year
- All 5 years represented per category
- No duplicate IDs

After passing: raw_photos/ stays on disk.
Do NOT delete yet. You will manually remove raw_photos/ and the CLIP model cache after the project is fully done and tested.

**Phase 1 done when:** embeddings.npy and photos.json in backend/data/ with all 800 records.

---

## Phase 2 - Backend (FastAPI)

### 2.1 main.py - Startup Loading

Load into RAM on server start (stays loaded between requests):
- embeddings.npy -> numpy array (800, 512)
- photos.json -> list of 800 dicts, indexed by photo_id
- FAISS IndexFlatIP (inner product = cosine sim on normalized vectors)
- CLIP text encoder (ViT-B-32 text side only, ~170MB)

Total RAM: ~222MB. Within Railway 512MB free tier.

### 2.2 POST /search

Input: { "query": "beach sunset" }

Steps:
1. Encode query with CLIP text encoder -> 512-dim normalized vector
2. FAISS cosine similarity vs all 800 embeddings
3. Top 80 results (hard cap)
4. Confidence check: top score < 0.15 -> low_confidence: true
5. Run clustering internally -> generate chips
6. Return results + chips

Confidence thresholds:
- >= 0.20: Normal results
- 0.15-0.20: Results + low_confidence: true (frontend shows banner)
- < 0.15: Empty results + low_confidence: true

Output:
```json
{
  "results": [{ "id": "photo_042", "cloudinary_url": "...", "category": "beach_and_sea",
                "year": 2023, "month": 7, "variation_tags": ["sunset", "with_people"], "score": 0.31 }],
  "chips": [{ "chip_label": "Sunset", "photo_ids": ["photo_042", "photo_107"] }],
  "result_count": 68,
  "low_confidence": false
}
```

### 2.3 clustering.py - Chip Generation

Called by /search internally. Not exposed as an endpoint.

Chip trigger: N > 20 required.
k = max(2, min(6, N // 12))  -> 2-6 clusters.

Chip label logic:
1. Collect variation_tags of all photos in cluster
2. If one year appears in >60% -> use that year as label (e.g. "2023")
3. Otherwise -> most common variation_tag, title-cased
4. Deduplicate chip labels
5. Return max 6 chips

### 2.4 POST /filter

Input: { "photo_ids": [...], "selected_chips": ["Sunset", "2023"] }
Logic: AND (intersection) - photo must belong to ALL selected chips.
ONLY called when user taps Apply. Never on chip tap.
Output: { "results": [...], "result_count": 12 }

### 2.5 GET /photos

Returns all 800 photos sorted year DESC, month ASC. Used by HomeScreen on load.

### 2.6 POST /log

Appends one event row to a local JSONL log file. See Phase 4 for full schema.

### 2.7 GET /analytics

Operator-only page. Aggregates all sessions from the local JSONL file. Returns session summaries.

**Phase 2 done when:** All endpoints respond correctly at localhost:8000/docs.

---

## Phase 3 - Frontend (React/Vite)

### Build Order (follow this sequence exactly)

1. DesktopWrapper - 3-panel layout shell
2. HomeScreen - year-grouped photo grid from GET /photos
3. SearchBar - input + triggers POST /search
4. SearchScreen - results grid + chip row
5. ChipRow - chip display + Apply button
6. Chip state machine - tap/select/apply/clear
7. PhotoDetail - full-screen photo overlay
8. RightPanel - instructions + suggestion pills
9. EmptyState - zero results / low confidence messages
10. LeftPanel - static How It Works guide

### 3.1 DesktopWrapper.jsx (Root Component)

Root component mapped directly in `main.jsx` (bypassing the default Vite `App.jsx`).
Fixed 3-panel layout at 1920x1080.
Left panel: 680px. Center (MobileFrame): 560px. Right panel: 680px.
Background: Dark ambient gradient (e.g. linear-gradient from #0f172a to #1e1b4b) to provide visual contrast for the central phone frame.

MobileFrame styling:
- border-radius: 40px
- border: 2px solid #2a2a2a
- box-shadow: 0 0 60px rgba(0,0,0,0.9)
- overflow: hidden

### 3.2 MobileFrame.jsx - State Hub

All app state lives here. Children receive state via props.

State:
- screen: 'home' | 'search' | 'detail'
- searchQuery, searchResults, chips
- selectedChips: [] (chips tapped but not yet applied - grid stays frozen)
- filteredResults: null (null = full results, array = filtered)
- selectedPhoto, lowConfidence, pathTaken

Layout addition:
- Contains the floating bottom navigation bar (Home pill button) globally available.

### 3.3 HomeScreen.jsx

GET /photos on mount.
Group by year descending (2025 first, 2021 last).
Render year header + 3-col grid per year group.
Search bar pinned at top. Tap -> switch to SearchScreen.

### 3.4 SearchBar.jsx

On submit: POST /search -> store results + chips in MobileFrame state -> screen = 'search'.
Crucially, on form submit, it triggers `.blur()` on the input reference to drop focus, instantly hiding the dim background overlay.
Ask Photos dummy icon: tapping shows "Ask Photos is not available in this demo."

### 3.5 ChipRow.jsx - Core Feature Component

Sits above PhotoGrid inside SearchScreen.

Layout:
1. "Refine results" in small gray text above row (hidden after first Apply)
2. Horizontal scrollable chip row: [chip1] [chip2] [chip3] [chip4] [chip5-partial...] [Apply]
3. After Apply: [selected-chip] [Clear] still visible

Chip CSS:
- Unselected: transparent background, 1px #555 border, white text, border-radius 20px, padding 6px 14px
- Selected: white background, black text, white border
- Apply inactive: #333 bg, #777 text
- Apply active: #1a73e8 blue bg, white text

### 3.6 Chip State Machine (in MobileFrame.jsx)

States:
```
[idle]
  -> chip tapped          -> [selected]       (chip highlights, grid FROZEN)
  -> another chip tapped  -> [multi-selected] (both highlight, grid STILL FROZEN)
  -> Apply tapped         -> POST /filter     -> [filtered] (grid updates ONCE)
  -> Clear tapped         -> [idle]           (full results restore)
  -> selected chip tapped -> [fewer selected] (de-highlight)
```

Key rule: Grid ONLY changes on Apply. Never on chip tap.

handleApply:
1. Collect all photo_ids from searchResults
2. POST /filter { photo_ids, selected_chips }
3. setFilteredResults(response)
4. logEvent('apply_tapped', chips.join('+'), count)

handleClear:
1. setSelectedChips([])
2. setFilteredResults(null)
3. logEvent('chip_cleared')

### 3.7 PhotoGrid.jsx

CSS grid, 3 columns, 2px gap.
Each cell: img, width 100%, aspect-ratio 1:1, objectFit cover.
overflowY: auto (scrolls inside MobileFrame).

### 3.8 PhotoDetail.jsx

Full 560x780 overlay.
Back arrow top-left -> return to SearchScreen (state preserved, scroll position preserved).
Photo: objectFit contain, 72% height, black background.
Top right overlay: Cleanly formatted Date (e.g. "August 2025") replacing technical tags to preserve library authenticity. Internal AI variation tags and confidence scores are NOT shown to the user.

### 3.9 RightPanel.jsx

Contains ONLY the fallback search section (since instructions were moved to LeftPanel).

Heading: "Don't want to browse? Try searching for:"
6 suggestion pills (exact text):
- a beach trip
- birthday with candles
- evening in the mountains
- cafe we visited
- college hangout
- trek with friends

Pill tap: fill search bar + trigger search + set pathTaken = 'prompted'

### 3.10 EmptyState.jsx

| Condition | Message |
|---|---|
| low_confidence < 0.15 | "We couldn't find photos matching this. Try describing what you remember - a place, color, or moment." |
| zero results, query too specific | "No photos found. Try a broader word - like 'beach' instead of 'rocky beach at sunset'." |
| zero results after Apply | "No photos match all selected filters - try removing one." |
| non-English input | "Search works best in English. Try describing the photo in English." |

### 3.11 LeftPanel.jsx (static content)

MomentSort logo at top.

How it works:
Step 1 - Type what you remember: A place, a person, a moment - anything.
Step 2 - Tap a chip to narrow down: We group your results. You just recognise and tap.
Step 3 - Find your photo: No retyping. No scrolling. Just tap and land.

### 3.12 ResultsInfo (inside SearchScreen, below chip row)

Shows: "{count} results"
If results > 20 AND not yet filtered: shows "Too many? Narrow them down ->" (disappears after first Apply)

**Phase 3 done when:**
- HomeScreen loads 800 photos grouped by year
- Search + chips work end-to-end
- Chip tap freezes grid, Apply filters once
- Back from PhotoDetail preserves scroll position

---

## Phase 4 - Behavioral Logging

### 4.1 Local JSONL Setup

1. Create a log file at `backend/data/behavior_logs.jsonl`
2. Each line will represent one logged event as a JSON object.

### 4.2 backend/logging_service.py

Uses standard Python file I/O to append JSON strings.
Appends one JSON line per event to the log file.
Called by POST /log endpoint.

### 4.3 frontend/src/utils/logger.js

- Session ID: UUID generated once per session, stored in sessionStorage
- Session start time: Date.now() on load
- logEvent(type, detail, count, chips, path): fires POST /log
- Silent catch on error - logging must never block UX

### 4.4 Complete Event List

| Event | Triggered when | event_detail |
|---|---|---|
| search_typed | Search submitted | query string |
| chip_shown | Chips appear | chip labels comma-joined |
| chip_tapped | Chip tapped | chip label |
| chip_deselected | Selected chip untapped | chip label |
| apply_tapped | Apply button pressed | selected chips joined with + |
| chip_cleared | Clear button pressed | empty |
| photo_opened | Thumbnail tapped | photo_id |
| photo_closed | Back from PhotoDetail | photo_id |
| search_cleared | Search bar cleared | empty |
| suggestion_tapped | Suggestion pill tapped | pill text |
| manual_scroll | Scrolled 2+ screens without chip interaction | empty |

**Phase 4 done when:** One full session creates correct JSON lines in `behavior_logs.jsonl`.

---

## Phase 5 - Integration and Testing

### 5.1 Full Flow Test (run for each of 6 suggestion pills)

1. App opens -> HomeScreen with 800 photos grouped by year
2. Tap pill "a beach trip" -> search fires (pathTaken = prompted)
3. Results > 20 -> chips appear with "Refine results" label
4. "Too many? Narrow them down ->" visible below count
5. Tap chip -> highlights, grid FROZEN (no change)
6. Tap Apply -> grid re-renders ONCE with filtered photos
7. Tap thumbnail -> PhotoDetail opens with category/year/month
8. Back -> filtered grid at same scroll position
9. Tap Clear -> full grid restores
10. Local JSONL file -> all 10+ events logged with correct values

### 5.2 Edge Case Tests

| Test | Expected behavior |
|---|---|
| Search gibberish (asdfgh) | EmptyState with low confidence message |
| Search returns < 20 results | No chips shown, flat grid only |
| 2 different chips selected, Apply | AND intersection, fewer results |
| Tap Apply with no chip selected | Apply grayed out, cannot tap |
| All results fall in one cluster | No chips shown (single cluster = useless) |
| Filter returns 0 results | "No photos match all selected filters - try removing one." |

### 5.3 Performance Targets

| Endpoint | Target |
|---|---|
| GET /photos response | < 500ms |
| POST /search response | < 2 seconds |
| POST /filter response | < 300ms |
| POST /log response | < 500ms (non-blocking) |
| Frontend initial load | < 3 seconds |

---

## Phase 6 - Deployment

### 6.1 Backend -> Railway

1. Create Procfile in backend/: `web: uvicorn main:app --host 0.0.0.0 --port $PORT`
2. Push to GitHub
3. railway.app -> New Project -> Deploy from GitHub -> select backend/ folder
4. Add all env vars in Railway dashboard:
   - CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET
5. Enable Always On (prevents sleep between requests)

Post-deploy check: https://your-app.railway.app/docs shows Swagger UI.

### 6.2 Frontend -> Vercel

1. Update frontend/.env: VITE_BACKEND_URL=https://your-app.railway.app
2. Push to GitHub
3. vercel.com -> New Project -> import repo -> root directory: frontend/
4. Add VITE_BACKEND_URL env var in Vercel dashboard
5. Deploy

Post-deploy check: App loads at https://your-app.vercel.app on a 1920x1080 browser.

### 6.3 Final Deployment Checklist

- [ ] GET /photos works on Railway URL (returns 800 photos)
- [ ] POST /search returns results + chips for "beach"
- [ ] Chips appear (>20 results trigger confirmed)
- [ ] Apply filters correctly in production
- [ ] Local JSONL logging works in production (requires persistent volume on Railway)
- [ ] App renders correctly on 1920x1080 screen
- [ ] No CORS errors in browser console
- [ ] /analytics page accessible and shows session rows

---

## What Is NOT Built in This MVP

- No user authentication
- No real Google Photos API
- No Ask Photos conversational AI (dummy icon only - tapping shows "Ask Photos is not available in this demo.")
- No video or GIF support
- No mobile-responsive layout (fixed 560x780 frame only)
- No dynamic photo ingestion after Phase 1
- No personalisation or user accounts
- No search history per user

---

Status: READY FOR IMPLEMENTATION.
