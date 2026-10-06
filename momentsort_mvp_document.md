# MomentSort MVP: Functional Overview & User Flows

## 1. What This MVP Proves (Core Hypothesis)
The MomentSort MVP is built to validate a specific hypothesis: **Users recall photos based on contextual fragments ("vibes", objects, locations) rather than exact dates or perfect keywords.** 

This prototype proves that presenting users with **contextual suggestion chips** after a broad text search drastically reduces cognitive load, eliminates scrolling fatigue, and leads to faster photo retrieval compared to traditional chronological scrolling or complex text-based boolean searches.

---

## 2. Core User Flows Demonstrated

### Flow A: The "Vibe" Retrieval (Single-Chip)
* **Goal:** Find a specific photo using a broad memory and a single contextual clue.
* **Step 1:** User types a broad category (e.g., "Beach") into the search bar.
* **Step 2:** The system returns a massive "flood" of chronological results.
* **Step 3:** User spots the contextual chips (e.g., "Sunset", "Family", "2022") directly below the search bar.
* **Step 4:** User taps "Sunset". The grid instantly filters. The target photo is found immediately without manual scrolling.

### Flow B: Intersecting Memories (Multi-Chip)
* **Goal:** Find a highly specific photo by intersecting two disparate contextual clues.
* **Step 1:** User types "Party" into the search bar.
* **Step 2:** User taps the "Outdoor" chip. The grid filters to all outdoor parties.
* **Step 3:** Recognizing the grid is still too broad, the user taps a second chip, "Balloons".
* **Step 4:** The system applies AND-logic, hyper-refining the grid to exactly 8 photos of outdoor parties with balloons. The target is found.

### Flow C: Text Search Fallback
* **Goal:** Recover gracefully when a user overestimates the text search capabilities.
* **Step 1:** User types a complex query like "Food Pizza". The text search struggles to parse it perfectly, returning mixed results.
* **Step 2:** User backspaces, leaving only the broad term "Food".
* **Step 3:** The UI surfaces the "Pizza" chip. 
* **Step 4:** User taps the chip, successfully falling back to the UI's guided filtering to complete the task.

---

## 3. Key MVP UX Decisions

To ensure the examiner understands what was intentionally designed for *this specific prototype* (separate from any broader Google Photos integration concepts), we highlight these MVP-specific UX decisions:

* **Instant Filtering (No "Apply" Button):** Modern users expect immediate feedback. Tapping a chip instantly refines the grid, removing a redundant click and making the app feel highly responsive.
* **Chip Prominence Over Advanced Syntax:** Instead of teaching users how to type `category:beach AND time:sunset`, we offload the cognitive work to the UI by visually presenting those options as tapable chips.
* **Proximity of Chips to Search:** The chips are placed immediately beneath the search bar. When a text search fails or returns too many results, the user's eyes naturally drop down to the chips, creating a seamless fallback mechanism.

---

## 4. Boundaries of the MVP
* **Focus on Retrieval:** This MVP strictly demonstrates the *retrieval* and *filtering* interface. 
* **Simulated Backend:** The tagging and AI categorization that powers the chips is assumed to have already happened; the MVP focuses entirely on how the user *interacts* with those generated tags.
