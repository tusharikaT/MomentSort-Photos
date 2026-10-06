# MomentSort — Metrics, Risks and Limitations
### Part 7: Define Success | For Google Photos Integration

---

## What We Are Measuring

Google's stated business goal is to increase the percentage of users who successfully retrieve a photo they remember but cannot precisely describe.

MomentSort addresses one specific failure point in that journey — the post-retrieval flood. The user searched. The results came back. But there are 500 similar photos with no way through. MomentSort clusters those results and surfaces labeled groups so the user can navigate by recognition instead of recall.

The metrics below track whether that mechanism actually works — first in the MVP demo, and then in production at Google Photos scale.

---

## North Star Metric

**Session Retrieval Success Rate for vague-query searches**

The percentage of search sessions where:
- The query was vague (emotional, contextual, not an exact name or date)
- Chips appeared above the result grid
- The user selected one or more chips and tapped Apply
- The user found and opened their target photo from the filtered set
- Without typing a new query and without manually scrolling through the raw flood before applying a filter

This is the one number that answers the core question: does MomentSort turn a dead end into a found photo?

---

## Leading Metrics

These are tracked week over week. A drop in any of them is an early warning before the North Star moves.

### 1 — Chip Engagement Rate
The percentage of eligible search sessions (result count over 30) where the user selected at least one chip AND tapped Apply.

Why it matters: If users are not selecting chips and tapping Apply, the mechanic is not being noticed, not being understood, or the labels are wrong. Just highlighting a chip without Apply means the user explored but did not commit — that is a partial engagement, not a filter.

Target: 60% or above of eligible sessions.

### 2 — First-Chip Success Rate
The percentage of chip-engaged sessions where the user selected exactly one chip, tapped Apply, and then opened a photo — with no additional chip changes, no retype, no flood scrolling.

Why it matters: One chip selected, Apply tapped, photo found. The cleanest possible signal. It means the first cluster label was recognizable and the filtered set was small enough to scan immediately.

Target: 40% or above of chip-engaged sessions.

### 3 — Retrieval Success Rate
The percentage of chip-engaged sessions that ended with a photo opened — regardless of how many chips were selected and how many times Apply was tapped — and with no retyping of the query.

Why it matters: Broader than First-Chip Success Rate. Includes users who selected two or three chips across multiple Apply taps before finding their photo. Still a success — MomentSort replaced retyping.

Target: 65% or above of chip-engaged sessions.

### 4 — Apply Tap Rate
The percentage of sessions where at least one chip was highlighted (chip_tapped) AND the user followed through with Apply.

Why it matters: A user who highlights a chip but does not tap Apply explored the option but did not commit. High explore-but-no-Apply rate means users are unsure of the mechanic, the chip labels are not convincing enough to commit to, or the Apply button is not prominent enough.

Target: Apply fires in 75% or more of sessions where at least one chip was highlighted.

---

## Diagnostic Metrics

These do not tell you if MomentSort is working. They tell you WHY it is or is not working.

### Average Chips Selected Per Successful Apply
How many chips selected on average before the user taps Apply and finds their photo.

What it tells you: 1 to 2 chips per Apply = labels are clear and clusters are well-separated. 4 or more chips selected before Apply = labels are confusing or clusters overlap too much.

### Post-Apply Result Count
How many photos remain after Apply fires, averaged across sessions.

What it tells you: 10–20 photos = good narrowing. If post-Apply count is still 50+, the chip dimensions are too broad and not separating the result set meaningfully.

### Explore-Only Rate (chip highlighted but no Apply)
The percentage of sessions where the user highlighted one or more chips but never tapped Apply.

What it tells you: Users looked at the chips but did not trust them enough to commit. Either the labels were unclear or the Apply button was not visible enough.

### Chip Deselect Rate
The percentage of chip highlights that were reversed (chip highlighted then un-highlighted) before Apply was tapped.

What it tells you: Users highlighting and then removing a chip is a normal part of the two-step model — they are building their selection. High deselect rate is acceptable and expected. However, if users deselect ALL chips and abandon without tapping Apply, the labels were misleading.

### Retype Rate After Apply
The percentage of sessions where the user tapped Apply but still typed a new query afterward.

What it tells you: Apply fired but the filtered set still did not contain the target photo. Either the cluster label was misleading or the upstream search missed the target photo.

---

## Guardrail Metrics

These are things MomentSort must not break while being optimized for the leading metrics.

### Apply Tap Latency
Time from the moment Apply is tapped to the filtered grid appearing.

Limit: Under 0.5 seconds. The filter is a client-side operation (photos already loaded) — if it takes longer than half a second the UI feels broken.

### Search Latency
Time from query submission to results appearing with chips.

Limit: Under 2 seconds. If chips load after the user has already started scrolling, they will never be noticed.

### Core Search Quality
The standard precision and recall of Google Photos search — measured separately from MomentSort.

Why it matters: MomentSort sits on top of existing search. If the underlying search degrades as a side effect of adding clustering, that is a problem regardless of chip engagement numbers.

### False Cluster Rate
The percentage of sessions where chips appeared but zero chips were tapped AND the user scrolled through the raw flood anyway.

Why it matters: Chips were present but completely ignored. This means the chips were so irrelevant that users treated them as invisible. High false cluster rate = clustering is producing junk groupings.

Limit: Under 20% of eligible sessions.

---

## How the MVP Demo Validates These Metrics

The 600-photo MVP cannot prove production-scale outcomes. But it can provide directional evidence for each leading metric.

| Production Metric | What the MVP Can Show |
|---|---|
| Chip Engagement Rate | Do users select chips and tap Apply when they appear? |
| First-Chip Success Rate | Does one chip + Apply narrow the set enough to find the photo? |
| Retrieval Success Rate | Do users find their photo without retyping? |
| Apply Tap Rate | Do users who highlight a chip follow through with Apply? |
| Explore-Only Rate | Do users look at chips but not commit? |
| Retype Rate After Apply | Do users apply a filter but still search again? |

What the MVP cannot validate:
- Behavior with a real personal library (10,000+ photos, real memories, real dates)
- Whether users remember the photo's year accurately (years are randomly assigned in the demo)
- Performance at scale
- Personalization signals

The MVP result is directional, not conclusive. If chip engagement is high and retype rate is low across 5 to 6 users, it is evidence worth building on — not proof of production readiness.

---

## Risks

### Risk 1 — Cluster Labels Are Not Recognizable
The chip label is generated from the most common tag in a cluster. If the label does not match what a user would naturally say about those photos, they will not tap it.

Example: A cluster of beach sunset photos is labeled "outdoor" instead of "Sunset". The user is looking for a sunset photo, does not see a sunset chip, and scrolls past.

Impact: Chip engagement rate drops. MomentSort becomes invisible.

Mitigation: Test chip label quality as a standalone metric. Prioritize visual descriptors (what the photo looks like) over categorical tags (what folder it belongs to). Use Gemini or a language model to generate natural chip labels from cluster content.

---

### Risk 2 — Upstream Search Misses the Target Photo
MomentSort clusters whatever the search returns. If the target photo is not in the result set at all, no chip can surface it.

Example: User searches "café Pune 2022". CLIP returns café photos but not the one from Pune. The correct photo was never retrieved. MomentSort clusters the wrong set. No chip helps.

Impact: Retrieval failure is blamed on chips, but the problem is actually the search layer.

Mitigation: Track upstream retrieval separately from chip success. If the target photo was not in the top 80 results, that is a search quality issue — not a MomentSort issue. The diagnostic metric for this is: was the target photo present in the result set before chip selection?

---

### Risk 3 — Over-Clustering Recreates the Flood
If the number of clusters (k) is too high, the chip row becomes as overwhelming as the result set itself. Instead of 80 similar photos, the user now has 8 chips to evaluate and compare before deciding which to select.

Impact: Users ignore chips and scroll the flat grid instead. Chip engagement rate drops.

Note: The two-step interaction model (select then Apply) partially mitigates this risk. Users can experiment with chips before committing. But if chip labels are too numerous and too similar, the evaluation burden still exists.

Mitigation: Cap chips at 6. Show only 4 without scrolling. Scale k dynamically — fewer clusters for smaller result sets. Run usability tests specifically to find the chip count where users stop reading them.

---

### Risk 4 — Users Do Not Trust or Notice the Chips
If chips appear above the results but users scroll past them without engaging, it is either a discoverability problem (chips are not visually prominent enough) or a trust problem (users do not believe the groupings will help).

Impact: Chip engagement rate stays low even if cluster quality is high.

Mitigation: Visual design — chips must be the most prominent element above the result grid. Chip labels must use natural language, not technical tags. Consider adding a one-line explanation: "We grouped your results. Tap to narrow."

---

### Risk 5 — Performance Degrades at Scale
The MVP runs k-means on 70 photos in milliseconds. At Google Photos scale, a vague query may return 50,000 candidate photos. Clustering that set in real time is a different engineering problem.

Impact: Search latency increases past 2 seconds. Users retype before chips appear.

Mitigation: Run clustering on a fixed top-N result set (e.g., top 200 by similarity score) regardless of total result count. Pre-cluster common query types offline. Use approximate clustering methods (mini-batch k-means, HDBSCAN) for large sets.

---

### Risk 6 — Privacy Concerns from AI Reading Personal Photos
MomentSort reads the content of personal photos to generate cluster labels. Users who discover this may feel their photos are being analyzed without consent.

Impact: Trust erosion. User backlash. Regulatory exposure in GDPR and DPDP Act markets.

Mitigation: All processing happens on-device or within Google's existing photo processing pipeline — no new third-party model access. MomentSort reuses embeddings already generated by Google Photos for search. No new photo data leaves the device. Communicate this clearly in the feature disclosure.

---

### Risk 7 — The Mechanic Works Only for Visual Queries, Not Contextual Ones
MomentSort clusters photos by visual similarity. A user searching for "the photo I took the day I got my job offer" is not describing visual content — they are describing a personal memory with no visual signal. CLIP cannot cluster that.

Impact: MomentSort fails silently for the most emotionally significant retrieval scenarios.

Mitigation: Scope MomentSort to visually-grounded queries. Do not show chips when the query contains strong personal/temporal context ("the day I", "when I was", "the year I"). Those queries need a different solution — likely Ask Photos or timeline-based navigation.

---

## Limitations to State Alongside the Numbers

The MVP numbers come from 5 to 6 users browsing a fixed library of 600 stock photos on a simulated mobile screen. Photos were browsed first, so users knew what they were searching for. Years are randomly assigned, not real. Results are capped at the top 80 by similarity score.

The production metrics above describe what would need to be true for Google to ship MomentSort. The MVP gives directional evidence. A full A/B test with real user libraries — comparing sessions with and without MomentSort chips — is what production validation requires.

---

*Connected to: context_momentsort.md, architecture.md | Problem Statement Part 7*
