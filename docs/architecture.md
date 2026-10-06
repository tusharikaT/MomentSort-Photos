# MomentSort MVP — Architecture Document
### Version 1.0 | Derived from context_momentsort.md | Awaiting Approval Before Implementation

---

## 1. System Overview

MomentSort runs in two completely separate phases.

Phase 1 — Offline Data Preparation (runs once on laptop, never again)
Phase 2 — Live Deployed App (runs entirely on cloud, laptop not involved)

```
PHASE 1 — OFFLINE (Laptop, one-time)
─────────────────────────────────────────────────────
Pexels/Unsplash API
       │
       ▼
download_photos.py ──► 800 photos (local, temp)
       │
       ▼
assign_metadata.py ──► year, month, category, variation tags
       │
       ▼
generate_embeddings.py ──► embeddings.npy (800 × 512 float32, ~1.6MB)
       │
       ▼
upload_to_cloudinary.py ──► photos on Cloudinary CDN + photos.json
       │
       ▼
DELETE local photos + CLIP vision model (~160MB freed)


PHASE 2 — LIVE APP (Cloud, always running)
─────────────────────────────────────────────────────

       USER BROWSER (1920×1080)
              │
              ▼
     ┌─────────────────────────────────────────────┐
     │  LEFT PANEL  │  MOBILE FRAME  │ RIGHT PANEL │
     │  How it works│  560 × 780px  │ Instructions│
     │  (static)    │  (React app)  │ + Suggestions│
     └─────────────────────────────────────────────┘
                         │
                    HTTP Requests
                         │
                         ▼
              RAILWAY BACKEND (FastAPI)
              ├── CLIP text encoder (runtime)
              ├── embeddings.npy (RAM)
              ├── photos.json (RAM)
              ├── FAISS cosine search
              ├── k-means clustering
              └── Chip labeling

              CLOUDINARY CDN
              └── 600 photo files served globally

              GOOGLE SHEETS
              └── Behavioral log (appended per event)
```

---

## 2. Component Map

| Component | Technology | Hosted On | Purpose |
|---|---|---|---|
| Frontend | React (Vite) | Vercel | Full UI — desktop wrapper, mobile frame, panels |
| Backend | Python FastAPI | Railway | Search, clustering, chip generation, logging |
| Photo Storage | Cloudinary free tier | Cloudinary CDN | Serves 800 photos via URL |
| Embeddings | embeddings.npy | Bundled in backend | 800×512 float32 — loaded into RAM on startup |
| Photo Metadata | photos.json | Bundled in backend | Category, year, month, tags, Cloudinary URL |
| Behavioral Log | Google Sheets API | Google Drive | Silent event logging per session |
| CLIP (prep only) | open_clip (local) | Laptop, one-time | Generates image embeddings during Phase 1 |
| CLIP (runtime) | open_clip text encoder | Railway | Encodes user queries at search time |

---

## 3. Folder Structure

```
momentsort/
│
├── frontend/                        # React app → deployed to Vercel
│   ├── src/
│   │   ├── components/
│   │   │   ├── DesktopWrapper.jsx   # Full 1920×1080 layout manager
│   │   │   ├── MobileFrame.jsx      # 560×780 phone bezel wrapper
│   │   │   ├── LeftPanel.jsx        # How it works guide (static)
│   │   │   ├── RightPanel.jsx       # Instructions + suggestion pills
│   │   │   ├── HomeScreen.jsx       # Year-grouped photo library grid
│   │   │   ├── SearchBar.jsx        # Search input + Ask Photos dummy icon
│   │   │   ├── ChipRow.jsx          # Horizontally scrollable chip selector
│   │   │   ├── PhotoGrid.jsx        # 3-column result thumbnail grid
│   │   │   ├── PhotoDetail.jsx      # Full-screen photo overlay within frame
│   │   │   └── EmptyState.jsx       # Zero results / low confidence messages
│   │   ├── pages/
│   │   │   ├── App.jsx              # Root — renders DesktopWrapper
│   │   │   └── Analytics.jsx        # /analytics — operator only
│   │   └── utils/
│   │       ├── api.js               # All backend HTTP calls
│   │       └── logger.js            # Session ID management + log event sender
│   └── package.json
│
├── backend/                         # FastAPI → deployed to Railway
│   ├── main.py                      # App entry point + route registration
│   ├── search.py                    # CLIP query encoding + FAISS similarity
│   ├── clustering.py                # k-means + chip label generation
│   ├── logging_service.py           # Google Sheets event appender
│   ├── analytics.py                 # Session summary aggregator
│   ├── data/
│   │   ├── embeddings.npy           # 800 × 512 float32 (~1.6MB)
│   │   └── photos.json              # Photo metadata array (~200KB)
│   └── requirements.txt
│
└── data_prep/                       # One-time scripts — run locally, never deployed
    ├── download_photos.py           # Fetches 600 photos from Pexels/Unsplash
    ├── assign_metadata.py           # Assigns year, month, variation tags
    ├── generate_embeddings.py       # Runs CLIP vision encoder, saves embeddings.npy
    ├── upload_to_cloudinary.py      # Uploads photos, saves URLs to photos.json
    └── validate_dataset.py          # Checks year spread, color diversity, embedding shape
```

---

## 4. Phase 1 — Data Preparation Pipeline

Runs once. Produces two output files: `embeddings.npy` and `photos.json`.

### Step 1 — Download Photos (`download_photos.py`)

- Source: Pexels API + Unsplash API (both free, no cost)
- Target: 100 photos per category × 8 categories = 800 photos
- Categories: Beach and Sea / Birthday and Celebrations / Café and Restaurant / Mountains and Trek / College and Friends / Nature and Parks / Transport / Market and Street
- Filters applied per category: color diversity (no single dominant color), 2–4 elements per photo, JPEG or PNG only
- Output: 800 images saved locally in `/raw_photos/`

### Step 2 — Assign Metadata (`assign_metadata.py`)

For each photo:
- year: randomly assigned from [2021, 2022, 2023, 2024, 2025]
  - Rule: each year gets ~20 photos per category (proportional spread across 800 photos)
- month: randomly assigned from [1–12]
- variation_tags: manually or rule-assigned per photo (e.g., "with_umbrella", "sunset", "indoor", "with_people")
- category: inherited from download step
- Output: metadata.json with all 800 records

### Step 3 — Generate Embeddings (`generate_embeddings.py`)

- Model: `openai/clip-vit-base-patch32` via `open_clip` library
- For each of 800 photos: run through CLIP vision encoder → 512-dimensional vector
- Save all 800 vectors as a numpy array: shape (800, 512), dtype float32
- File size: ~1.6MB
- Output: `backend/data/embeddings.npy`
- Time: ~60–120 minutes on CPU (one-time only)

### Step 4 — Upload to Cloudinary (`upload_to_cloudinary.py`)

- Upload all 800 photos to Cloudinary free tier
- Cloudinary returns a permanent CDN URL per photo
- Build `photos.json`: array of 800 objects, each with:
  ```json
  {
    "id": "photo_001",
    "cloudinary_url": "https://res.cloudinary.com/...",
    "category": "beach_and_sea",
    "year": 2023,
    "month": 7,
    "variation_tags": ["with_umbrella", "with_people"]
  }
  ```
- Output: `backend/data/photos.json`

### Step 5 — Validate (`validate_dataset.py`)

Checks:
- embeddings.npy shape == (800, 512) ✓
- All 800 photos have Cloudinary URL ✓
- Year distribution: each year has 150–170 photos (proportional) ✓
- Each category has 5 years represented ✓
- Color diversity check (heuristic) ✓
- Delete local raw photos + CLIP vision model after validation ✓

---

## 5. Backend Architecture — FastAPI (Railway)

### Startup Sequence

On server start:
1. Load `embeddings.npy` → RAM (numpy array, ~1.6MB)
2. Load `photos.json` → RAM (Python list of dicts, ~200KB)
3. Load CLIP text encoder (`openai/clip-vit-base-patch32`, text side only, ~170MB)
4. Build FAISS index from embeddings (~instant for 800 vectors)
5. Server ready

Total RAM on Railway at runtime: ~221MB (well within 512MB free tier)

### API Endpoints

```
GET  /photos
     → Returns all 800 photos sorted by year DESC, month ASC
     → Used by HomeScreen to render the library timeline

POST /search
     Body: { "query": "beach with umbrella" }
     → Encodes query with CLIP text encoder (512-dim vector)
     → Cosine similarity against all 600 embeddings (FAISS)
     → Returns top N results sorted by similarity score
     → If confidence of top result < 0.15 → flag low_confidence: true
     → Always runs k-means clustering on result set in background (invisible to user)
     → Stores cluster_id per photo_id in response
     → Response: { results: [{...photo, cluster_id}], chips: [...], low_confidence: bool, result_count: int }

POST /filter
     Body: { "photo_ids": [...], "selected_chips": ["sunset", "2023"] }
     → Called only when user taps Apply button (not on individual chip tap)
     → Filters photo_ids by selected chip labels
     → Same dimension: union (OR). Different dimensions: intersection (AND)
     → Response: { results: [...], result_count: int }

POST /log
     Body: { session_id, session_number, event_type, event_detail,
             result_count, chips_shown, time_since_start, path_taken }
     → Appends one row to Google Sheets via gspread
     → Response: { ok: true }

GET  /analytics
     → Aggregates all sessions from Google Sheets
     → Returns: { sessions: [...], avg_chips_tapped, avg_time_to_find,
                  success_rate, natural_vs_prompted_ratio }
     → Protected — only called from /analytics page
```

### Search Logic (`search.py`)

```
query_text → CLIP text encoder → query_vector (512-dim)
query_vector → FAISS cosine similarity → top N (photo_id, score) pairs
If top score < 0.15 → return low_confidence flag
Filter to top 80 results max (prevents returning the whole library)
Return sorted list of photo objects
```

### Clustering Logic (`clustering.py`)

```
Input: embeddings of top N result photos
Chip trigger: N > 20 (MVP threshold — lower than production because dataset is 800 photos)
k = max(2, min(6, N // 12))   # 2–6 clusters, scales with result size
Run k-means (scikit-learn) on the N embeddings
For each cluster:
  - Collect variation_tags of photos in that cluster
  - Most common tag = chip label (rule-based)
  - If year is dominant signal → add year chip (e.g., "2023")
  - Max 6 chips total
Return: list of { chip_label, photo_ids_in_cluster }
```

### Confidence Threshold Handling

| Cosine similarity of top result | Action |
|---|---|
| ≥ 0.20 | Normal results returned |
| 0.15 – 0.20 | Results returned + banner: "These are the closest matches we found" |
| < 0.15 | No results shown + message: "We couldn't find photos matching this." |

---

## 6. Frontend Architecture — React (Vercel)

### Layout Architecture

```
DesktopWrapper (1920 × 1080)
├── LeftPanel (680px wide, fixed)
│   ├── MomentSort logo + name
│   └── 3-step How It Works guide
│
├── MobileFrame (560px × 780px, centered, CSS phone bezel)
│   └── PhoneApp (560px × 780px, scrollable internally)
│       ├── [STATE: home]   → HomeScreen
│       ├── [STATE: search] → SearchScreen
│       └── [STATE: detail] → PhotoDetail (overlay)
│
└── RightPanel (680px wide, fixed)
    ├── "How to use this demo" — 4-step instruction
    ├── Divider
    └── 6 tappable suggestion pills
```

### Screen States (inside MobileFrame)

**HomeScreen:**
- Displays all 800 photos grouped by year (2025 at top, 2021 at bottom)
- Within each year: sorted by month
- Year header label between groups (e.g., "2023")
- 3 columns of thumbnails
- Search bar pinned to top — tapping activates SearchScreen

**SearchScreen:**
- Search bar at top (active, with cursor)
- Ask Photos dummy icon at right of search bar
- Results display as normal flat 3-column grid — familiar Google Photos style
- Result count shown prominently: "68 results" — makes the flood visible to the user
- Contextual nudge below count when results > 20: "Too many? Narrow them down →" (disappears after first Apply tap)
- "Refine results" in small gray text above chip row
- Chip row: 4 chips fully visible, 5th partially visible as scroll hint
- Chip row appears after search returns, populated by background clustering (invisible to user)
- Chips highlight on tap — grid stays completely frozen (no rearrangement)
- Apply button: grayed out by default, activates (colored) after at least one chip is tapped
- After Apply: grid re-renders ONCE with only filtered photos. Chip row shows selected chip(s) + Clear option
- EmptyState shown when results = 0 or confidence < threshold

**PhotoDetail:**
- Full-screen overlay within the mobile frame
- Photo fills the frame
- Metadata shown at bottom: category, year, month, variation tags
- Back arrow top-left returns to SearchScreen
- Keeps search state intact on return

### Session and Logging (`logger.js`)

- On first user interaction: generate UUID as session_id, store in sessionStorage
- session_number: fetched from backend /analytics (count of existing sessions + 1)
- Every user action calls `POST /log` with full event payload
- path_taken: "natural" if user typed own query, "prompted" if they tapped a suggestion pill

### Instructions (RightPanel)

- Heading: "How to use this demo"
- 4-step instruction block:
  - Step 1: Scroll through the photo library on the screen.
  - Step 2: Find a photo you'd like to search for.
  - Step 3: Now imagine you forgot when or where it was taken. How would you roughly describe it? Type that in the search bar.
  - Step 4: See if MomentSort helps you find it.
- Note: This specific phrasing (Step 3) ensures users enter vague queries so the result set is large enough to trigger chips.

### Suggestion Pills (RightPanel)

- 6 pills: "a beach trip" / "birthday with candles" / "evening in the mountains" / "café we visited" / "college hangout" / "trek with friends"
- On tap: fills search bar with pill text, triggers search, sets path_taken = "prompted"
- User can edit the filled text before submitting

---

## 7. Behavioral Logging Architecture (Google Sheets)

### Sheet Schema

Each row = one event

| Column | Type | Example |
|---|---|---|
| session_id | UUID string | a3f2b1c4-... |
| session_number | integer | 7 |
| timestamp | ISO datetime | 2026-10-02T14:32:01 |
| path_taken | string | natural / prompted |
| event_type | string | cluster_entered |
| event_detail | string | "Goa 2023" or photo_id_112 |
| cluster_id | integer | 1 (1 = most relevant cluster) |
| result_count | integer | 68 |
| chips_shown | string | "Goa 2023, Goa 2022, Dubai" |
| time_since_start | float (seconds) | 4.2 |


### Event Types

| Event | Logged When |
|---|---|
| search_typed | User submits a search query |
| chip_shown | Chips appear above results (background clustering complete) |
| chip_tapped | User taps a chip (grid still frozen) |
| chip_deselected | User taps an already-selected chip to remove it |
| apply_tapped | User taps Apply — grid filters now |
| chip_cleared | User taps Clear — returns to full unfiltered grid |
| photo_opened | User taps a thumbnail (after or without Apply) |
| photo_closed | User returns from full view |
| search_cleared | User clears the search bar |
| suggestion_tapped | User taps a suggestion pill on right panel |
| manual_scroll | User scrolls past 2 full screens in the flat result grid without tapping any chip |

### Analytics (/analytics page)

Operator-only. Not linked from the main UI. Shows:
- Total sessions recorded
- Session table: session number, timestamp, task type, chips tapped, time to find, found/not found
- Averages: chips per session, time to find, success rate
- natural vs prompted split
- CSV download button

---

## 8. Deployment Architecture

### Frontend → Vercel

- Build: `npm run build` (Vite)
- Deploy: Push to GitHub → Vercel auto-deploys
- Environment variable: `VITE_BACKEND_URL` = Railway backend URL
- No server-side rendering — purely static React

### Backend → Railway

- Runtime: Python 3.11
- Start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
- Environment variables stored in Railway dashboard:
  - `CLOUDINARY_URL`
  - `GOOGLE_SHEETS_CREDENTIALS` (JSON string of service account key)
  - `GEMINI_API_KEY` (optional — for chip labeling if rule-based is insufficient)
- Persistent service (not serverless) — embeddings stay in RAM between requests
- RAM usage at runtime: ~221MB (within 512MB free tier)

### Photo Storage → Cloudinary

- 600 photos uploaded in Phase 1 — never re-uploaded
- Served via Cloudinary CDN URLs (global edge delivery)
- No Cloudinary API calls at runtime — just static URL references from photos.json
- Free tier: 25GB storage (using ~120MB), 25GB bandwidth/month

---

## 9. Data Flow — End to End

```
User types "beach umbrella"
        │
        ▼
Frontend sends POST /search { query: "beach umbrella" }
        │
        ▼
Backend: CLIP text encoder → 512-dim vector
        │
        ▼
Backend: FAISS cosine similarity vs 800 embeddings
        │
        ▼
Backend: Returns top 68 results + runs k-means silently
Backend: k = max(2, min(6, 68//12)) = 5 clusters
Backend: Labels chips: ["With umbrella", "Sunset", "With people", "2023", "Alone"]
        │
        ▼
Frontend: Renders 68 photos as flat grid
Frontend: Shows result count "68 results" + nudge "Too many? Narrow them down →"
Frontend: Shows chip row above grid
Frontend: Logs event: { search_typed, "beach umbrella", result_count: 68 }
        │
        ▼
User taps chip "With umbrella" → chip highlights, grid STAYS frozen
User taps chip "2023" → second chip highlights, grid STILL frozen
Frontend: Logs events: { chip_tapped, "With umbrella" }, { chip_tapped, "2023" }
        │
        ▼
User taps Apply
        │
        ▼
Frontend sends POST /filter { photo_ids: [...68], chips: ["with_umbrella", "2023"] }
        │
        ▼
Backend: AND logic — filters to photos with both tags
Backend: Returns 8 photos
        │
        ▼
Frontend: Re-renders grid ONCE with 8 photos
Frontend: Logs event: { apply_tapped, "with_umbrella + 2023", result_count: 8 }
        │
        ▼
User taps a thumbnail
        │
        ▼
Frontend: Opens PhotoDetail overlay — full photo + metadata
Frontend: Logs event: { photo_opened, photo_id_223 }
```

---

## 10. RAM and Storage Budget

| Resource | Size | Where |
|---|---|---|
| CLIP text encoder | ~170MB | Railway RAM |
| embeddings.npy | ~1.6MB | Railway RAM |
| photos.json | ~200KB | Railway RAM |
| App + FastAPI overhead | ~50MB | Railway RAM |
| **Total Railway RAM** | **~222MB** | Within 512MB free tier ✓ |
| Photos on Cloudinary | ~160MB | Cloudinary free tier ✓ |
| Google Sheets (30 sessions) | ~500KB | Google Drive free ✓ |
| **Total cost** | **₹0** | All free tiers |

---

## 11. Risk Flags

| Risk | Mitigation |
|---|---|
| Railway free tier sleeps after inactivity | Use Railway's always-on setting or Render (which has no sleep on free tier for web services) |
| CLIP text encoder takes >2 sec on cold start | Pre-warm by loading model at startup, not per request |
| k-means produces poor cluster labels | Fallback: use variation_tags directly as chip labels (rule-based, always works) |
| Google Sheets API rate limit | Log events in a queue, batch-write every 5 events instead of per event |
| Cloudinary CDN slow in India | Use Cloudinary's India edge node (automatically selected) |

---

## 12. What Is NOT in This Architecture

- No user authentication
- No real Google Photos API
- No video or document handling
- No Ask Photos implementation (dummy icon only)
- No mobile-responsive layout (fixed 560×780 frame only)
- No dynamic photo ingestion
- No search history saved per user
- No personalisation

---

## 13. Production Design Reference (Most Relevant)

> **Note:** The MVP does not contain a "Most relevant" section because it operates on a small 800-photo dataset. This section documents how MomentSort fits into the production Google Photos app.

**How it fits:**
MomentSort does **not** replace the existing "Most relevant" section in Google Photos. Instead, it serves as a navigation layer for the flood of photos *below* it.

1. **"Most relevant" (Google's existing layer):** Sits at the top of results. Surfaces 8–15 high-confidence photos (heavily biased toward recency and image quality).
2. **The Flood:** The hundreds of remaining photos that matched the keyword but scored lower on confidence (older, dimmer, less recognizable). This is where Memory Keepers' photos usually are.
3. **MomentSort (Our layer):** Only appears if the flood is > 60 photos. Clusters those remaining photos and sits below the "Most relevant" section.

*Insight:* "Most relevant" proves the photo is in the library but cannot surface it at the top. MomentSort solves what "Most relevant" cannot.

---

Status: APPROVED. Implementation document to follow.
