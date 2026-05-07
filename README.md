# Informed Picks RN Demo

## Overview

The app uses static JSON exports for deterministic behavior and focuses on:
- correctness
- trust-sensitive UI
- cross-platform parity
- performance hygiene
- supportability / debug visibility

## What this project is

This demo is a frontend proof-point built to show production-shaped mobile product thinking, not just screen mockups.

It demonstrates:
- typed data boundaries
- repository / selector layering
- validate-once data loading
- probability normalization and trust cues
- mobile interaction patterns
- debug / parity surfaces for diagnosis

## Data contract

The repository layer owns data loading, validation, caching, and time ordering. Selectors receive repository data as already sorted and should only partition or shape it for presentation.

The markets list screen reads a single snapshot from `getMarketListData()` (markets, categories, grouped rows). **Filtering and flat list layout** are handled by the pure helper `buildMarketListViewModel(...)` in `src/services/marketListViewModel.ts`. **Which full-screen state to show** (`loading`, `error`, `empty`, `noResults`, `ready`) is decided by `deriveMarketListState(...)` from counts and a blocking-validation flag; the screen owns what counts as a blocking data error.

## Markets list (Week 1)

**Search**

- Debounced text search (typing does not rebuild the list on every keystroke).
- Case-insensitive match after trim; internal spacing is left as typed.
- Fields matched: player name, category, question, event label (substring match, no fuzzy search in Week 1).

**Category filters**

- Chips are **All** plus every category from the full dataset (not narrowed by the current search).
- Single-select: one category or All.

**Product states**

| State | When | Controls |
| --- | --- | --- |
| `loading` | Initial simulated load (`DEMO_LATENCY_MS`) | Search and chips hidden |
| `error` | Blocking validation: zero valid rows and validation errors | Full-screen message |
| `empty` | Repository returned no markets | Full-screen message |
| `noResults` | Data exists but search/category yields no rows | Search and chips stay visible; empty list shows “No markets found” |
| `ready` | At least one visible row | Normal list |

Partial validation issues are surfaced in **Debug parity**; they do not alone force the list into `error` if some markets are still valid.

**Pull-to-refresh**

- Preserves the current search text and selected category; only the refresh indicator is simulated.

## Runtime support model

**Primary supported setup:** Expo Go on **Expo SDK 54**

This is the main supported path because the project prioritizes:
- reproducible setup
- fast reviewer onboarding
- reliable demo execution

In other words, this repo favors a stable “works now” path over chasing the newest Expo runtime immediately.

## Experimental path

A newer Expo SDK / dev-build path may be explored separately, but that is **not** the primary supported setup for this repo right now.

If you are evaluating or running this project, use the Expo Go + SDK 54 path first.

## Why SDK 54 is the default

The app is intended to be easy to run in Expo Go without requiring:
- a custom native build
- full Xcode simulator setup
- EAS/dev-build-only workflow

That tradeoff is intentional. For this demo, reproducibility is more important than newest-SDK adoption.


## Quick start

```
npm i
npm start
```

Open Expo Go → Scan QR.

## Expo Go / SDK 54 setup notes

If your environment is on a newer Expo package set and you need to align to the supported runtime:

```
npx expo install expo@~54
npx expo install --fix
npx expo start -c --tunnel
```

## Alternate run paths

If you want to experiment with a newer Expo SDK or a custom dev build, treat that as a separate branch/workstream.

That path is currently considered experimental compared with the primary Expo Go setup above.

## Demo video

[iOS demo](https://drive.google.com/file/d/1v1twY8M87pcGgIHmnK4od6YjbCRfrCkk/view?usp=sharing) — walkthrough of the app running in Expo Go.

## Feature → Why → JD Mapping

| Feature | Why it matters | JD mapping |
| --- | --- | --- |
| Vig removal tooltip | Pricing transparency | Trust |
| DebugParity data checks | Data diagnosis and confidence | Troubleshoot |
| DebugParity platform checks | Runtime environment diagnosis | Compatibility |
| FlatList hygiene (memo, useCallback, getItemLayout, windowSize) | Perf and scalability | Performance |
| Platform.select shadows | iOS vs Android styling | Cross-platform parity |
| Order validation (disable CTA + inline error) | Product/UX maturity | User experience |
| odds.test.ts | Baseline correctness | Quality |
| Validate-once guards | Efficient data loading | Architecture |
| fontScale-aware getItemLayout | Accessible Large Text behavior | Accessibility |
| removeClippedSubviews Android-only | Avoid iOS shadow clipping | Cross-platform parity |
| Primitive props to MarketCard | Correct memoization | Performance |
| Debounced search + category chips | Scalable list UX | Product / performance |
| Explicit list states (loading, empty, error, no-results, ready) | Clear unhappy-path behavior | Product thinking |
| `buildMarketListViewModel` + unit tests | Testable list logic | Quality / architecture |

## Accessibility note

`getItemLayout` is enabled only when `fontScale <= 1.1`. With Large Text enabled, the list disables `getItemLayout` to avoid scroll-position issues from variable heights. This is intentional and ensures accurate list behavior under accessibility settings.

## Testing checklist

**Markets (Week 1)**

- Initial loading state, then list populates
- Search narrows results after debounce; clear search shows full list again
- Category chip filters to one section; **All** shows every category with data
- No matches: “No markets found” appears **below** search and chips; change query or chip to recover
- Pull-to-refresh runs without clearing search or selected category

**Existing flows**

- Market detail opens from the list
- Vig tooltip appears on detail
- Order ticket validation works (empty stake, etc.)
- Debug parity screen loads (validation + platform checks)

Automated checks: `npm run typecheck` and `npm test` (includes `marketListViewModel` search/state coverage).

## Screenshots

### Week 1 — Markets search, filters, and no-results (manual verification)

These PNGs show the current markets header search row, category chips, and list / empty states.

| What it shows | File |
| --- | --- |
| Search **“austin”** with **All** selected — player match across multiple categories (e.g. Austin Hooper) | [Open](docs/screenshots/week1-markets-search-austin-all-categories.png) |
| **Longest Reception** chip only, empty search — category-scoped list and section header | [Open](docs/screenshots/week1-markets-category-longest-reception.png) |
| **No results** — query **“Austin”** with **Interceptions Thrown** selected; message stays below search and chips | [Open](docs/screenshots/week1-markets-no-results-austin-vs-interceptions.png) |
| **No results** — query **“maye”** with **Longest Reception** selected; iOS keyboard with search return key | [Open](docs/screenshots/week1-markets-no-results-maye-longest-reception.png) |

### Earlier captures (list, detail, ticket, debug, history)

Older JPGs predate Week 1 list polish but still illustrate detail and supporting flows.

- [Markets list (legacy)](docs/screenshots/IMG_1701-2fa663fc-1472-4a8f-87dc-9178bab88ae2.jpg)
- [Market detail](docs/screenshots/IMG_1707-4e14100b-4454-4c25-a8bc-248c334541ba.jpg)
- [Order ticket](docs/screenshots/IMG_1706-83df22d0-6609-4ba7-bd78-fbc1f119d423.jpg)
- [Debug parity](docs/screenshots/IMG_1710-e155fe7a-cc91-4cf0-a6be-6cb9de6dd5c6.jpg)
- [Price history](docs/screenshots/IMG_1703-f72566c0-d53d-4d5a-bd3a-3ad4137dd890.jpg)

## Troubleshooting

- **Project incompatible with this version of Expo Go** → SDK mismatch (align SDK or downgrade via `expo install`).
- **Worklets mismatch** → Reanimated mismatch (fix with `npx expo install react-native-reanimated`).
- If you ever hit a Metro/Babel issue around Reanimated, try removing the explicit `react-native-reanimated/plugin` entry and rely on Expo's preset.
