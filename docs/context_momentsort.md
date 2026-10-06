# MomentSort MVP — Context Document
### Version 1.0 | For Approval Before Architecture

---

## 1. Overview of the Solution

MomentSort is a prototype that adds a semantic clustering layer on top of a keyword photo search experience.

When a user types a vague keyword — “Goa”, “birthday”, “café” — and receives a large, undifferentiated result set, MomentSort automatically groups those results into meaningful clusters and surfaces them as tappable chips. The user selects one or more chips and taps Apply. The results narrow to the relevant cluster. The user finds their photo without typing anything new.

Core mechanic: recognition replaces recall. The user does not retype. They look at the chip labels, recognise the right context (year, theme, people, place), and tap.

This is a simulation of the Google Photos search experience — built on a curated dataset of 800 real stock photos — designed for user testing to validate whether chip-based post-result narrowing helps Memory Keepers find a specific photo faster and with less frustration.

---

## 2. Objective

Primary:
Build a testable MVP where a real user can navigate from a keyword search on an 800-photo library to a specific target photo — using semantic cluster chips — without typing any additional query.

Secondary:
Validate that the chip-based narrowing mechanism reduces time-to-find and reduces frustration compared to scrolling through a raw result grid.

---

## 2b. The Core Product Insight — Why MomentSort Exists Alongside “Most Relevant”

Google Photos already has a “Most relevant” section. It shows 8–15 high-confidence matches at the top of every search. If that already works, why does MomentSort exist?

Because “Most relevant” is optimised for the wrong thing for Memory Keepers.

**How “Most relevant” actually ranks photos:**
Google’s relevance score is dominated by three signals:
- Recency: photos taken recently score higher than old photos
- Image quality: well-lit, sharp, clear photos score higher than dim or blurry ones
- Recognition confidence: photos where faces, objects, and locations are clearly identified score higher

This means “Most relevant” reliably surfaces your most recent, best-quality photos for any given query.

**The Memory Keeper’s problem:**
Memory Keepers are almost never looking for a recent, high-quality photo. They are looking for a specific past moment — a blurry photo from a beach trip in 2021, a dimly lit birthday shot from a restaurant in 2019, a candid college photo with no faces clearly visible. These photos score low on recency, quality, and recognition confidence. They do not appear in “Most relevant”. They are buried in position 89 to 150 of the flood below.

**The failure scenario that MomentSort solves:**
```
User searches “birthday”
        ↓
Most relevant: 12 photos from 2024 birthday (recent, clear, faces recognised)
User checks — their photo is NOT here
        ↓
Flood below: 280 more birthday photos, unsorted
User is now lost
        ↓
MomentSort chips: [2021] [Outdoor] [With friends] [2023]
User taps [2021] → Apply → 12 photos → finds it ✅
```

**What this means for the product:**
- “Most relevant” is not wrong — it works perfectly for users who want their most recent photos
- MomentSort is not a replacement — it is a navigation layer for the flood that “Most relevant” does not address
- The two features are complementary and serve different failure modes:

| | “Most relevant” | MomentSort chips |
|---|---|---|
| What it shows | Top 8–15 by AI confidence | Clustered groups within the flood |
| Optimised for | Recent + high quality photos | Any photo — by year, theme, people, vibe |
| Serves | Users searching for recent photos | Memory Keepers searching for a specific past moment |
| Fails when | Target photo is old or low quality | Chip labels are wrong or too broad |

This is not an edge case. Our user research (N=59) confirmed that Memory Keepers — a large and engaged segment — consistently find their target photo is NOT in the top results. The failure mode of “Most relevant” is the exact pain point our research uncovered as Gap 2 (post-retrieval flood).

“Most relevant” proves the flood problem exists. MomentSort solves what it cannot.

---

## 3. Target Users

Segment: Memory Keepers
Everyday smartphone users with 2,000–10,000+ photo libraries who search for specific past moments using vague, emotional, contextual keywords and get overwhelmed by the result set.

For MVP testing:
Recruit 5–6 users who match this profile. Give them a task: "Find a specific photo using the search bar." Observe natural behavior. No coaching on what to type.

---

## 4. Scope of Work

IN SCOPE:
- Keyword search bar that searches across a fixed 600-photo dataset
- Semantic search using CLIP embeddings (natural language, not exact keyword matching)
- Result grid showing matching photos as a normal flat grid (60–80 photos) — familiar Google Photos-style display
- Background clustering of result set — invisible to user until they interact with chips
- Chip row above results: up to 6 chips generated, 4 visible without scrolling, 5th partially visible as scroll hint
- Two-step chip filter: user selects one or more chips — grid stays frozen — user taps Apply — grid filters once
- Subtle “Refine results” prompt above chip row — disappears after first use
- Photo tap → full screen view within the mobile frame
- Deployable web app (Vercel frontend + Railway/Render backend + Cloudinary photo storage)

OUT OF SCOPE FOR V1:
- Real Google Photos API integration
- Ask Photos or any conversational AI layer
- User authentication or personal library access
- Video support
- Document and screenshot photo types
- Offline mode
- Mobile app (web responsive only)
- Live photo ingestion or dynamic dataset updates

---

## 5. Dataset Design

Source:
800 real stock photos from Pexels and Unsplash free APIs. Not AI-generated. Real-looking photos so users feel like they are searching an actual photo library.

Why 800:
Designed to ensure chips trigger reliably for both vague and moderately specific queries. 800 photos across 8 categories = ~100 photos per category. A vague query like “beach” returns 80–100 results (chips appear). A moderate query like “beach sunset” returns 30–50 results (chips still appear at threshold=20). A specific query returns < 20 results (chips don’t appear, but user can scan directly — they don’t need chips).

Structure:
8 categories. Each category has ~100 photos with controlled internal variation — 2 to 4 identifiable elements per photo, enough variation within each category to produce meaningful chips.

Categories:
- Beach and Sea (umbrella, sunset, boat, food stall, people, alone)
- Birthday and Celebrations (cake, candles, balloons, indoor, outdoor, group)
- Café and Restaurant (coffee cup, food on table, interior, outdoor seating)
- Mountains and Trek (landscape, tent, with person, sunset, snow)
- College and Friends (group sitting, classroom, corridor, outdoors)
- Nature and Parks (trees, flowers, animals, rivers)
- Transport (car interior, bus, bike, airport terminal)
- Market and Street (vegetables, clothes stall, street food, crowd)

Why 8 categories and not 6:
Adds two everyday-life categories (Transport, Market) that are common real-world Memory Keeper search scenarios. More category diversity = more varied chip labels across different user searches.

Why this structure:
Same-category photos with slight variation is what allows meaningful clustering. If a user searches “beach” and gets 80–100 photos, the chips can distinguish: With umbrella / Sunset / With people / With boat. Without variation, chips have nothing to separate.

Year Metadata:
Each photo is assigned a random year from 2021 to 2025 during the metadata prep phase.
Rule: Every category must be spread proportionally across all 5 years. 100 photos per category = 20 photos per year per category.
Month: Also randomly assigned per photo (January to December) for sorting purposes. Days are not used.
Year is a chip dimension: When search results span multiple years, year chips (e.g., 2022, 2024) appear as selectable filters.

Home Screen Library Sorting:
Photos displayed on the home screen are sorted newest year first (2025 at top), then by month within each year. Exactly mirrors how Google Photos organises a timeline. No day-level sorting needed.

Color Diversity Rule:
When pulling from Pexels/Unsplash, explicitly curate for color diversity within each category. No single color should dominate a category. Every major color family (warm, cool, neutral, dark, bright) should be represented. This ensures color-based searches like “red umbrella” or “orangish bag” have matching photos.



## 6. Technical Stack

ONE-TIME PREP (runs on laptop, done once):
- Download 800 photos from Pexels/Unsplash API
- Run CLIP model to generate embeddings for all 800 photos
- Save embeddings as a ~1.6MB numpy file
- Upload photos to Cloudinary
- Delete photos and CLIP model from laptop after (~160MB freed)

DEPLOYED APP (runs entirely on cloud):
- Photo storage: Cloudinary free tier (25GB limit, using ~160MB)
- Backend: Railway or Render free tier — Python FastAPI
  - CLIP text encoder for embedding user queries at search time
  - FAISS for vector similarity search
  - k-means via scikit-learn for clustering results
  - Gemini free tier or rule-based labeling for chip names
- Frontend: Vercel — React app
- Embeddings file: ~1.6MB numpy file bundled into backend repo

Total cost: Zero rupees.

---

## 7. How Search Works (User Journey)

Step 1: User types any natural language query — “blue bottle”, “sunset beach”, “birthday cake” — no predefined keywords required.

Step 2: Backend embeds the query using CLIP text encoder. Runs cosine similarity against 600 pre-computed photo embeddings. Returns top N matching photos.

Step 3: Backend runs k-means clustering on the result embeddings in the background. Produces 4–6 clusters. Labels each cluster. Stores cluster assignment per photo. This is invisible to the user.

Step 4: UI displays results as a normal flat grid (familiar Google Photos style). Above the grid: a “Refine results” prompt in small gray text and a chip row with up to 6 chips (4 visible, 5th partially visible as scroll hint).

Step 5: User selects one or more chips. Grid stays completely frozen — no rearrangement. Selected chips highlight. Apply button activates.

Step 6: User taps Apply. Grid updates ONCE to show only photos belonging to the selected cluster(s). Grid rearranges a single time, intentionally, at the user’s command.

Step 7: User scans the filtered set. Taps thumbnail → full photo view. Back button returns to filtered grid.

---

## 8. Product Requirements

Search:
- Single search bar, prominent at top
- Accepts natural language queries of any length — single word, multi-word, descriptive phrase
- No keyword count restriction — CLIP handles the full query as one semantic meaning
- Maximum character limit: 100 characters (prevents paragraph-length inputs)
- Powered by CLIP semantic similarity, not keyword matching
- Ask Photos icon present in the UI (non-functional dummy, exactly as it appears in Google Photos Android). Tapping it shows: "Ask Photos is not available in this demo."

Chip Generation:
- Runs in background immediately after search results return — user never sees this happening
- Chip trigger threshold: results > 20 (MVP threshold — lower than production because dataset is smaller)
- Produces 4–6 chips maximum
- 4 chips fully visible in chip row, 5th partially visible (scroll hint per UX convention)
- Chips labeled semantically — event type, time era, location vibe, year
- Chip row sits above the flat result grid with “Refine results” label in small gray text above it
- Contextual nudge appears below result count when results > 20: “Too many? Narrow them down →” — disappears after first Apply tap

Chip Interaction (Two-Step):
- Step 1: User taps chip(s) — chips highlight, grid stays completely frozen
- Step 2: User taps Apply button — grid updates ONCE to show only photos from selected cluster(s)
- Apply button: grayed out before any chip is tapped, active (colored) after at least one chip is tapped
- Multi-chip selection supported — user builds full selection before committing
- If two chips from same dimension selected: show union (OR logic)
- If two chips from different dimensions: show intersection (AND logic)
- After Apply: chip row shows selected chip(s) with a “Clear” option + result count shown
- Clear returns to full unfiltered flat grid

Result Display:
- Default: normal flat grid — 3 columns, familiar Google Photos style
- After Apply: filtered flat grid — same 3-column layout, fewer photos
- Tap thumbnail → full photo view fills mobile frame
- Photo metadata on full view: Formatted natural Date (e.g. "August 2025"). Internal AI tags and confidence scores are hidden to preserve the illusion of a real personal photo library.
- Back button returns to same scroll position in the filtered grid

---

## 9. Edge Cases and What We Are Not Handling

| Scenario | Decision |
|---|---|
| Result set is under 30 photos | Do not show chips — set is small enough to scan directly |
| All photos cluster into one group | Do not show chips — single cluster is not useful |
| Zero results after chip combination | Show: "No photos match all selected filters — try removing one" |
| Zero results from initial search | Show: "No photos found. Try a broader word — like 'beach' instead of 'rocky beach at sunset'" |
| User types a very generic word ("photo", "image") | No special handling in v1 — noted as edge case |
| Photos with no readable metadata | Excluded during one-time prep phase |
| Non-English input detected | Show nudge: "Search works best in English. Try describing the photo in English." Search still runs — not blocked |
| Gibberish input (random characters) | CLIP similarity threshold check applied. If top result confidence is below threshold, show: "We couldn't find photos matching this. Try describing what you remember — a place, color, or moment." |
| Vague color description ("orangish red", "reddish brown") | CLIP handles color descriptions semantically — finds closest visual match. If confidence is low, show closest results with banner: "These are the closest matches we found." |
| Query matches nothing in dataset | Show zero state with suggestion. Do not show unrelated results. |

---

## 10. UI Look and Feel

- Clean and minimal — resembles Google Photos aesthetic
- White background, light card-based grid
- Search bar at the top, full width
- Chips row below search bar, above results — horizontally scrollable
- Selected chip: filled highlight state
- Unselected chip: outlined state
- Result grid: 3 photos per row (~171px each at 560px frame width)
- Thumbnail tap → full photo view fills the mobile frame
- No heavy sidebars, no complex panels — everything inline
- Ask Photos dummy icon visible in the UI, non-functional

Screen and Frame Dimensions:
- Mobile frame size: 560px wide × 780px tall
- Test screen: 1920 × 1080 (full HD laptop or external monitor)
- The app renders as a fixed mobile frame centered on the desktop browser
- No scroll exists outside the mobile frame — only the mobile frame scrolls internally
- Blank space on left and right of mobile frame: ~680px each side — finalized below

Left Panel — How It Works (permanent, always visible):
  MomentSort logo and name at top.
  Three-step guide explaining the mechanic — not what to type:
  Step 1: Type what you remember — a place, a person, a moment.
  Step 2: Tap a chip to narrow down — we group your results, you just recognise and tap.
  Step 3: Find your photo — no retyping, no scrolling, just tap and land.

Right Panel — Instructions + Soft Fallback (always visible):
  Section 1 — Primary instruction (transparent, honest):
    Heading: "How to use this demo"
    Subtext: "This is an MVP. Here's what we'd like you to do:"
    Step 1: Scroll through the photo library on the screen.
    Step 2: Find a photo you'd like to search for.
    Step 3: Now imagine you forgot when or where it was taken. How would you roughly describe it? Type that in the search bar.
    Step 4: See if MomentSort helps you find it.
    Note: Deliberately instructs vague search — ensures result set is large enough for chips to trigger.

  Section 2 — Fallback (for users who don't want to browse):
    Divider line.
    Heading: "Don't want to browse? Try searching for:"
    Six tappable suggestion pills — tapping any one fills the search bar. User can edit or ignore.
    Suggestions: "a beach trip" / "birthday with candles" / "evening in the mountains" / "café we visited" / "college hangout" / "trek with friends"

  Log records which path was taken — natural (user typed own query) vs prompted (user tapped a suggestion pill).


- Wireframe or screenshot from user to be incorporated when shared

---

## 11. Constraints

| Constraint | Detail |
|---|---|
| Dataset size | Fixed 800 photos — no dynamic addition |
| No Google Photos API | Simulated experience only |
| Free deployment tiers | Vercel + Railway/Render + Cloudinary — all free |
| Laptop usage | Heavy CLIP prep runs once on laptop, then cloud takes over |
| Laptop disk impact | ~160MB during prep (800 photos × ~200KB), freed after upload |
| Search scope | Classic search only — Ask Photos out of scope for v1 |
| Runtime compute | CLIP text encoder only at query time — lightweight |
| Image format | JPEG or PNG only — no video, no GIF |
| Language | English queries only |
| Mobile frame | Fixed 560×780px — not responsive, not a real phone app |

---

## 12. Behavioral Logging System

Purpose:
Silently record every user interaction in the background. Invisible to the user. Used for Part 6 user testing analysis and slide data.

What is logged per event:
- session_id: unique ID per user session
- session_number: 1 to 30
- timestamp: exact datetime of each action
- task_used: whether user tapped a suggestion pill or typed their own query (distinguishes natural vs prompted behavior)
- event_type: search_typed / chip_shown / chip_tapped / photo_opened / photo_closed / search_cleared / manual_scroll
- event_detail: the exact query typed, chip name tapped, or photo ID opened
- result_count: number of photos at that moment

Storage:
Google Sheets via API (free). Every event appends a new row automatically. Operator opens the Sheet to view, filter by session_number or timestamp, and export as CSV/Excel.

Capacity:
Up to 30 sessions stored. Unlimited events per session. Free tier handles this easily.

Analytics page (/analytics — hidden from users):
Operator-only URL. Shows session summaries: average chips tapped, average time to find, success rate, whether suggestion pills were used. CSV download button.

How Part 6 is served:
After collecting sessions from real users, operator filters the Sheet by timestamp, selects 3 representative sessions, and builds the slide table from those rows. The remaining sessions serve as supplementary evidence.


1. Deployed web app with a live public URL — testable on 1920×1080 screen
2. 600 curated photos across 6 categories stored on Cloudinary
3. Pre-computed CLIP embeddings for all 600 photos (~tiny file)
4. Working end-to-end flow: search → flood (60–80 photos) → chips → filter → 10–15 photos
5. Photo tap → full view within mobile frame
6. Clean, minimal UI ready for user testing sessions

---

## 13. Success Criteria

| Metric | Target |
|---|---|
| Photo found in Cluster 1 (no scroll past it) | Primary success — clustering order was correct |
| Photo found in Cluster 2 or 3 | Partial success — clustering worked but order needs tuning |
| User scrolled all clusters then retyped | Failure — clustering did not help |
| User taps chip on first attempt | Navigation is intuitive |
| User does not retype a new query | Chips + clusters replace the second search entirely |
| App loads and responds | Under 2 seconds per search on free tier |

---

## 14. Summary

MomentSort MVP is a simulated photo search experience built on 800 curated real-looking stock photos across 8 categories. It uses CLIP semantic search to handle any natural language query the user types, clusters the result set automatically in the background, and surfaces tappable chips that filter the flood down to a manageable set.

The chip trigger threshold is set at 20 results for this MVP (lower than production because the dataset is smaller). The chips use a two-step interaction — user selects chips, then taps Apply — so the grid rearranges only once, intentionally, at the user’s command.

The entire heavy compute (embedding generation) runs once on the laptop during prep and is then deployed as a static file. The live app is lightweight, free to run, and ready for user testing.

The MVP is scoped to classic keyword search only. Ask Photos, personal library integration, and document retrieval are out of scope for v1.

Pending from user: UI wireframe or screenshot for look and feel reference.

---

Status: APPROVED. Architecture and Implementation documents to follow.

---

## 15. Production Design Reference — Google Photos Integration

> **NOT FOR IMPLEMENTATION.** This section describes how MomentSort would be designed when integrated into real Google Photos at production scale. It is included here for slide context (Parts 7–8 of the problem statement) and future roadmap reference only.

### Current Google Photos Search Behavior (Baseline)

When a user searches in Google Photos today:
- A “Most relevant” section appears at the top — a dynamically sized set of the highest-confidence matches (not a fixed count — Google’s relevance model determines how many, typically 8–15 photos)
- Below it: the rest of the matching results in a flat chronological grid
- No chip filtering or cluster grouping exists today
- Users must manually scroll or retype to narrow down

### Where MomentSort Fits In the Production App

MomentSort does not replace the “Most relevant” section. It is a navigation layer for the flood that “Most relevant” cannot address.

**Why “Most relevant” is not enough for Memory Keepers:**
Google’s relevance ranking is biased toward recency and image quality. A search for “birthday” surfaces the most recent, clearest birthday photos first. But the Memory Keeper’s target photo is almost always older — less clear, less recent, less recognisable by the AI. It scores low on confidence and sits buried in position 89–150 of the results below “Most relevant.”

“Most relevant” proves the photo exists in the library. It just cannot surface it at the top.

**What MomentSort adds:**
Instead of asking the user to scroll through 280 remaining photos below “Most relevant,” MomentSort clusters those 280 by context (year, theme, people, place) and surfaces the clusters as chips. The user taps the right context — not the right individual photo — and the set narrows instantly.

The chip trigger is the flood BELOW “Most relevant,” not the “Most relevant” section itself. If the user found their photo in “Most relevant,” chips are irrelevant and remain untapped.

```
[Search bar]
————————————————————————
  Most relevant                     ← existing Google Photos section (unchanged)
  [photo][photo][photo][photo] →
————————————————————————
  312 results • Refine results       ← MomentSort addition
  [Goa] [Sunset] [People] [2023] [Beach] ···   [Apply]
————————————————————————
  [flat result grid — all 312 photos]
```

### Production Design Numbers

| Parameter | Production Value | Rationale |
|---|---|---|
| Library size | 10,000+ photos | Typical active Google Photos user |
| Chip trigger threshold | Results > 60 | Below 60, a flat grid is still scannable (20 rows of 3). Above 60, it becomes a flood |
| Max chips generated | 8 | More photo diversity in personal libraries = more meaningful cluster dimensions |
| Chips visible without scrolling | 5 (6th partially visible as scroll hint) | Miller’s Law — 5±2 items before cognitive load increases |
| Count badge on chip | No | Labels are clean text only: [Sunset] [Festive moments] |
| Post-Apply result count (1 chip) | 40–80 photos | Personal libraries have more variation per cluster than curated datasets |
| Post-Apply result count (2 chips AND) | 10–25 photos | Two intersecting clusters narrow aggressively |
| Contextual nudge | Appears when results > 60: “Too many? Narrow them down →” | Only shown when relevant |
| “Most relevant” section | Unchanged — Google’s existing section remains above chips | MomentSort does not replace existing relevance ranking |
| Apply button | Same two-step model — select chips, tap Apply, grid updates once | Prevents accidental rearrangement |

### Why 60 and Not 30 (Production vs MVP)

In production, user libraries have 10,000+ diverse photos. Even a moderately specific search like “beach Goa” might return 60–200 photos from real personal libraries with real travel history. Setting threshold too low (30) would make chips appear even for small result sets where scrolling is still manageable. 60 is the point where a mobile user would typically give up scrolling and need help.

In the MVP, threshold is 20 because the dataset has only 800 photos — even the most vague query returns at most ~100 results, so the scale is compressed.

### What Changes Between MVP and Production

| Aspect | MVP (800 photos) | Production (10k+ photos) |
|---|---|---|
| Chip trigger | > 20 results | > 60 results |
| Max chips visible | 4 (5th partial) | 5 (6th partial) |
| Post-Apply count (1 chip) | 15–25 photos | 40–80 photos |
| Post-Apply count (2 chips) | 5–10 photos | 10–25 photos |
| Clustering scope | Top 80 results | Top 200 results (prevents clustering 1,000+ photos at once) |
| Chip label source | Variation tags (rule-based) | CLIP + Gemini label generation (richer personal context) |

---

## 16. Competitive Landscape — MomentSort vs Ask Photos

> **NOT FOR IMPLEMENTATION.** This section documents the competitive positioning of MomentSort relative to Google's own Ask Photos feature. Included for slide context (Parts 7–8 of the problem statement).

### The Current State of Google Photos Search (Late 2026)

Google Photos now ships two distinct search modes:

| Mode | Entry Point | Works On |
|---|---|---|
| Ask Photos (AI) | Default if enabled — conversational, Gemini-powered | Mobile + Desktop |
| Classic Search | Fallback when Ask Photos is toggled off | Mobile + Desktop |

**On mobile:** If Ask Photos is enabled, tapping Search goes directly to the Ask Photos interface. Classic search is only accessible after disabling Ask Photos in Settings (Photos settings → Preferences → Gemini features in Photos → Toggle off). On desktop, both tabs are visible side-by-side.

**The toggle was added because of user backlash.** Google originally pushed Ask Photos as a hard replacement for classic search. User complaints about losing precision forced them to re-introduce the classic search toggle. This is a documented, public signal that Ask Photos does not satisfy all search intents.

---

### Why Ask Photos Does Not Solve the Memory Keeper Problem

Ask Photos is a storytelling engine. It answers questions like:
- “What did I eat in Barcelona?”
- “Show me photos of my dog playing outside”
- “Who was at my birthday in 2023?”

It is slow, requires Gemini to process the entire library, generates a text summary + a curated collage, and uses “Related” chips as conversation follow-ups — not as filters on a result grid.

The Memory Keeper’s problem is fundamentally different:
- They already know the photo exists
- They have a rough context in mind (year, event, place)
- They typed a keyword into classic search and got 280 results
- They need to **narrow a grid they are already looking at**, not start a conversation

Ask Photos does not touch classic search results at all. It is a parallel product, not a solution to the classic search flood.

---

### Direct Comparison

| | Ask Photos “Related” chips | MomentSort chips |
|---|---|---|
| **Lives inside** | Conversational AI session | Classic keyword search |
| **Tapping a chip does** | Starts a new AI query (new conversation turn) | Highlights the chip, grid stays frozen |
| **Multi-select + combine?** | No | Yes — AND/OR logic, then Apply |
| **Shows count before tapping?** | No | No (clean label only) |
| **Grid rearranges on tap?** | N/A — launches a new query | No — only rearranges on Apply |
| **Requires internet + Gemini?** | Yes — cloud AI call required | No — k-means runs locally in backend |
| **Works without Ask Photos enabled?** | No | Yes — sits on classic search |
| **Speed** | Slow (AI processing time) | Instant (pre-computed clusters) |
| **User intent served** | Storytelling, discovery | Retrieval — finding a specific known photo |

---

### The Strategic Opportunity

Google is actively pulling engineering resources toward Ask Photos (Gemini integration). Classic search’s result page has received **no meaningful UX investment** in years. The flood problem is getting worse, not better, because:

1. Phone cameras are shooting more photos than ever (12–20 photos per moment on burst/Live)
2. Library sizes are growing (average active user: 8,000–12,000 photos)
3. Ask Photos has a slow adoption curve (opt-in, requires Gemini subscription in some markets)
4. Classic search is still the **default experience for the majority of Google Photos users**

MomentSort targets the gap that Google is not currently investing in: **post-retrieval navigation on classic search**.

**One-line positioning:**
> Ask Photos is for users who want to have a conversation with their photos. MomentSort is for users who just want to find one.

---

### Risk: When Does This Gap Close?

The gap closes if Google makes Ask Photos:
- Fast enough for retrieval queries (currently it’s too slow for “find me the beach photo” use cases)
- The default for classic search (not just a parallel tab)
- Available offline (currently cloud-dependent)

Estimated timeline: **2–3 years** based on current trajectory. Until then, classic search with 800 million monthly active Google Photos users remains an unsolved UX problem at scale.

---

## 17. Search Feature Adoption Banner (Tooltip)

To drive feature adoption, a "New Improved Search" floating tooltip is attached to the search bar. This mimics how Google introduces new features to users.

### Production Behavior (How it works in the real world)
- **Happy Path:** The user opens the app, sees the banner, uses the search bar properly, and **taps the MomentSort chips**. Once they successfully engage with the feature, we are good — the banner is **never shown again**.
- **Ignored Path:** If a user sees the banner, closes it, and starts scrolling without using the feature, we hide the banner and wait. We will show the banner again the **following week** (second week) to try and convert them. We repeat this weekly and keep tracking if the person is using the feature properly or not.

### MVP Testing Behavior
In the current MVP app, the 1-week cooldown is **disabled**. The banner will be shown **once per session** every time a person loads the MVP. This ensures test users and stakeholders can reliably see the feature without needing to clear their cache or wait a week.

### Adoption Metrics (Check for these metrics later)
This banner enables the following critical adoption metrics:
- **`search_banner_shown`**: How many times the feature was advertised to users.
- **`search_banner_converted`**: Users who saw the banner, used the search bar, and successfully tapped chips.
- **`search_banner_dismissed`**: Users who actively closed the tooltip without searching.
- **Scroll Ignorers (Calculated)**: Sessions that contain a `search_banner_shown` event followed by heavy `manual_scroll` events (indicating the user closed the banner and chose to scroll the flood instead).
