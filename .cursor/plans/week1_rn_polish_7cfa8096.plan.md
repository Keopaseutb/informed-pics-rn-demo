---
name: Week1 RN Polish
overview: Plan Week 1 around search, filters, and complete product states while folding in the RN General Polish items that naturally touch list UX, screen state, selector contracts, and small navigation accessibility. Each commit is scoped so it can be reviewed and tested independently.
todos:
  - id: week1-doc-plan
    content: Document Week 1 branch scope, commit cadence, and deferred polish
    status: completed
  - id: week1-search-input
    content: Add MarketsScreen search input with local query state and accessibility labels
    status: completed
  - id: week1-debounce-filter
    content: Implement debounced search and memoized derived filtering
    status: completed
  - id: week1-filter-chips
    content: Add category filter chips and no-results UI
    status: completed
  - id: week1-viewmodel
    content: Refactor list reads into a coherent selector/view-model and clarify ordering contracts
    status: completed
  - id: week1-states
    content: Define state model, then add loading, empty, error, refresh cleanup, and dev invariant handling
    status: completed
  - id: week1-tests
    content: Add pure TypeScript tests for search/filter logic
    status: completed
  - id: week1-readme
    content: Update README and manual checklist for Week 1 product states
    status: completed
isProject: false
---

# Week 1 RN Product States Plan

## Branch
Use branch `feat/week1-rn-product-states`.

## Goal
Make the app feel more product-shaped by improving the market list experience: search, filters, loading/empty/error/no-results states, deterministic derived state, and small accessibility polish on touched surfaces.

## Week 1 delivery status

All eight commits in **Commit Cadence** are implemented on `feat/week1-rn-product-states`. The YAML todos above are **completed**.

| Planned item | Where it landed |
| --- | --- |
| Plan + scope (commit 1) | This file under `.cursor/plans/` |
| Search input + a11y | `src/screens/MarketsScreen.tsx` |
| Debounce + `buildMarketListViewModel` | `MarketsScreen.tsx`, `src/services/marketListViewModel.ts` |
| Category chips + no-results | `MarketsScreen.tsx`, view-model |
| `getMarketListData`, selector contract, Debug hint | `src/services/marketRepository.ts`, `src/services/selectors.ts`, `src/navigation/RootNavigator.tsx` |
| `deriveMarketListState`, full states, refresh + dev warning | `marketListViewModel.ts`, `MarketsScreen.tsx` |
| Pure TS tests | `src/services/marketListViewModel.test.ts` (plus existing `odds.test.ts`, `order.test.ts`) |
| README + manual checklist | `README.md` **Markets list (Week 1)** and **Testing checklist** |

**Optional (not required to close Week 1):** Capture new screenshots that include the markets search row; README already notes shots may predate that control. Revisit real-dataset **eventlabel** search noise if product feedback asks for it.

## Week 1 State Model
Define this explicitly before coding the state-handling commit:

- `loading`: the app is still simulating initial load with `DEMO_LATENCY_MS`.
- `empty`: the repository returned zero markets before any user search/filter is applied.
- `error`: repository/data validation failed or the list view-model cannot be built.
- `noResults`: market data exists, but the current query/category filter returns zero visible rows.
- `ready`: market data exists and the current query/category filter returns visible rows.

Do not collapse `empty` and `noResults`. No-results UI should render below the search and filter controls so users can recover quickly.

Control visibility rules:

- `loading`: show the existing loading treatment; search/filter controls do not need to render while initial data is simulated.
- `empty`: show a simple empty state; search/filter controls can be hidden because there is no base dataset to search.
- `error`: show an error state; search/filter controls should be hidden or disabled because source data is not trustworthy.
- `noResults`: keep search/filter controls visible and render the no-results message below them.
- `ready`: render controls and list normally.

Before coding this commit, confirm any state or design ambiguity with the user instead of guessing.

## Search And Filter Decisions

- Search is case-insensitive.
- Search trims leading/trailing whitespace.
- Internal whitespace is left as typed for Week 1.
- Collapsing repeated internal whitespace is optional only if it stays cheap and contained inside the pure normalization helper.
- No fuzzy search in Week 1.
- Search fields: `playername`, `category`, `question`, and `eventlabel`.
- Verify the real dataset once search lands to make sure `eventlabel` matching improves discovery rather than feeling noisy.
- Category chips come from the full dataset, not from search-filtered results.
- Category filtering supports `All` plus one selected category.
- No counts on chips in Week 1.
- Pull-to-refresh preserves the current query and selected category; it only simulates data refresh.

## Helper Boundaries

Use two small pure boundaries unless implementation proves they are unnecessary:

- `buildMarketListViewModel(...)`: shapes list data. It should return filtered/grouped rows, `flatData`, `stickyHeaderIndices`, and any category metadata needed by the UI.
- `deriveMarketListState(...)`: decides the product state: `loading`, `empty`, `error`, `ready`, or `noResults`.

Keep these concerns separate: one helper shapes the list, the other decides which state UI should render. This gives tests a stable target without mixing filtering, sticky header math, and state decisions directly in [`src/screens/MarketsScreen.tsx`](/Users/bo/Dev/dk-prop-tracker/informed-picks-rn-demo/src/screens/MarketsScreen.tsx).

Timer cleanup should use one consistent pattern for debounce and refresh:

- Store timer ids in `useRef`.
- Clear any existing timer before scheduling a new one.
- Clear timers in effect cleanup on unmount.

Development-only invariants should be isolated behind a tiny helper or clearly named function. Production behavior should degrade gracefully; development behavior should warn loudly without crashing unless a later commit explicitly chooses a hard fail.

## Commit Cadence

1. `docs: plan week 1 search filter and screen-state approach`
   - Keep this commit tiny and internal: branch scope, review cadence, and deferred-items note only.
   - If the README support-model clarification is already the first branch commit, skip this commit or make it a very small planning note rather than another README rewrite.
   - Include the selector contract: the time series repository owns chronological ordering; selectors only partition/present already-ordered data.

2. `feat(markets): add search input and local query state`
   - Add a search input to [`src/screens/MarketsScreen.tsx`](/Users/bo/Dev/dk-prop-tracker/informed-picks-rn-demo/src/screens/MarketsScreen.tsx).
   - Keep query state screen-local.
   - Wire only `value` and `onChangeText`; do not filter rows in this commit.
   - Add accessible labels/hints for the search input.
   - Keep this commit intentionally dumb: UI, local state, and a11y only.

3. `feat(markets): implement debounced search and derived filtering`
   - Add a small debounce hook or local effect for the search query.
   - Keep derived filtering memoized so the list does not recompute unnecessarily.
   - Treat pure helper extraction as the default outcome unless the code stays genuinely tiny.
   - Prefer the `buildMarketListViewModel(...)` boundary from the Helper Boundaries section so later chip, state, and test commits stay smaller.
   - Search against product-relevant fields: player name, category, question, and event label.
   - Clean up debounce timers with the same timer-ref pattern used later for refresh cleanup.
   - Avoid adding global state; Week 1 stays local to the list screen.

4. `feat(markets): add filter chips and no-results state`
   - Add category filter chips derived from the full repository-backed category set.
   - Support `All` plus single-category selection.
   - Do not add chip counts in Week 1.
   - Add a clear no-results state when search/filter combinations return zero rows.
   - Preserve search/filter controls above the no-results message.
   - Add labels/hints for the chips while touching list a11y.

5. `refactor(markets): clarify list screen selectors and data contracts`
   - Consolidate the three list reads in [`src/screens/MarketsScreen.tsx`](/Users/bo/Dev/dk-prop-tracker/informed-picks-rn-demo/src/screens/MarketsScreen.tsx): `getMarkets()`, `getGroupedByCategory()`, and `getCategories()` into a clearer selector/view-model boundary.
   - Prefer a small repository/selector method that returns a single coherent list view model.
   - If this commit grows too large, split it into:
     - `refactor(markets): extract list view-model helper`
     - `docs/selectors: clarify ordering contract and debug button hint`
   - Keep `flatData` and `stickyHeaderIndices` derived from the same filtered source to avoid header index drift.
   - Keep `getItemLayout` gated by `fontScale <= 1.1`, and avoid variable-height rows under that path.
   - Update [`src/services/selectors.ts`](/Users/bo/Dev/dk-prop-tracker/informed-picks-rn-demo/src/services/selectors.ts) comments/types to make ordering ownership explicit: repository returns sorted points; selectors preserve order.
   - Add `accessibilityHint` to the Debug header button in [`src/navigation/RootNavigator.tsx`](/Users/bo/Dev/dk-prop-tracker/informed-picks-rn-demo/src/navigation/RootNavigator.tsx). Extract the header button only if it grows beyond the current simple inline config.

6. `feat(markets): add loading empty and error state handling`
   - Before coding, lock down the state model from the `Week 1 State Model` section above.
   - Add or use `deriveMarketListState(...)` as the separate state boundary rather than embedding all state decisions in render.
   - Keep simulated loading with `DEMO_LATENCY_MS`, but add complete state handling for:
     - loading
     - empty data
     - repository/data error or validation issue
     - no-results from user filtering
   - Fix `onRefresh` timer cleanup in [`src/screens/MarketsScreen.tsx`](/Users/bo/Dev/dk-prop-tracker/informed-picks-rn-demo/src/screens/MarketsScreen.tsx) with a timer ref and effect cleanup.
   - Pull-to-refresh preserves query and selected category.
   - Surface missing list metadata as a dev-only non-crashing invariant/warning instead of silently returning `null`.
   - Keep static-JSON error handling at the state/view-model boundary; tests can simulate failure without forcing runtime JSON errors.

7. `test(markets): add search and filter logic coverage`
   - Target pure helpers such as `filterMarkets(...)` or `buildMarketListViewModel(...)`.
   - Add tests covering:
     - empty query returns all items
     - query filters by player name
     - query filters by question
     - query filters by category
     - query filters by event label
     - category-only filtering works
     - selected category and query compose correctly
     - `All` category behaves as expected
     - trimming and case-insensitive search work
     - no-results output is explicit and stable
     - headers are only included for categories with results
     - no empty section headers are emitted
     - loading/empty/error/no-results states are mutually exclusive in the state builder
   - Keep tests pure TypeScript to avoid React Native/Jest fragility.

8. `docs: update README for week 1 product states`
   - Update [`README.md`](/Users/bo/Dev/dk-prop-tracker/informed-picks-rn-demo/README.md) with Week 1 behavior notes and manual test checklist.
   - Keep this user-facing and only after the UI settles.
   - Mention search, filters, loading/empty/error/no-results states, and selector/view-model ownership.
   - Add or refresh screenshots only after the UI is stable.

## Deferred Polish
Keep these out of Week 1 unless they become necessary while implementing the above:

- [`src/components/OrderTicketSheet.tsx`](/Users/bo/Dev/dk-prop-tracker/informed-picks-rn-demo/src/components/OrderTicketSheet.tsx): reset side/stake on close/open, switch `keyboardType` to `decimal-pad`, and add close/input/CTA accessibility labels. This is good polish, but it fits a ticket UX pass better than the Week 1 list-state branch.
- [`src/screens/MarketDetailScreen.tsx`](/Users/bo/Dev/dk-prop-tracker/informed-picks-rn-demo/src/screens/MarketDetailScreen.tsx): move market-not-found guard earlier, add trade button labels/hints, and consolidate `series/latestOver/latestUnder/lastUpdatedIso/latest odds` into a detail view-model. This should be Week 2 detail-screen cleanup.
- [`src/services/timeSeriesRepository.ts`](/Users/bo/Dev/dk-prop-tracker/informed-picks-rn-demo/src/services/timeSeriesRepository.ts): repository instance factory is worth documenting as a future live-API direction, but module-global cache is acceptable for static JSON demo scope.

## Review And Test Expectations
Each commit should pass `npm run typecheck` and relevant tests before review. UI commits should also get a quick Expo Go smoke test focused on the changed behavior.

## Natural Test Expansion

- Week 1: pure list-state logic.
- Week 2: data-layer and persistence logic, including favorites round-trip, freshness/stale timestamp logic, and cache fallback behavior.
- Week 3: reliability and supportability, including selector invariants, repository validation edge cases, order-ticket parsing edge cases, one list-to-detail integration/component test, and stable DebugParity outputs.
- Week 4: artifact confidence: build/install instructions, screenshots, video, and manual validation updates rather than broad new test-suite work.
