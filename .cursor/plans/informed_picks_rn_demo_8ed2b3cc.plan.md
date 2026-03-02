---
name: Informed Picks RN Demo
overview: "Build a mini prediction-market UI demo in React Native (Expo 55): market list, market detail with odds history, order ticket, debug/parity screen with platform checks -- all from static JSON. Demonstrates cross-platform parity, FlatList performance posture, vig-removal transparency, explicit YES(Over)/NO(Under) mapping, order validation, and a baseline test suite."
todos:
  - id: babel-config
    content: Create babel.config.js with Reanimated plugin and verify app boots
    status: completed
  - id: scaffold-dirs
    content: Move JSON data files into src/data/ and create the full src/ directory structure (no state/ folder for MVP)
    status: completed
  - id: types
    content: Define Market, TimePoint (+ ParsedTimePoint), Side, RootStackParamList types (include DebugParity route), plus ValidationResult type for guards
    status: completed
  - id: theme
    content: Create theme files (colors, spacing, typography) including Platform.select shadow/elevation helper
    status: completed
  - id: utils
    content: Implement odds.ts (implied prob, normalize, format), format.ts, guards.ts (validate-once pattern)
    status: completed
  - id: utils-tests
    content: "Add odds.test.ts with jest-expo preset + jest.config.js: american implied prob (+110, -110), normalize sums to ~1.0, formatAmericanOdds sign prefix"
    status: pending
  - id: services
    content: "Build repository layer: marketRepository (validate-once + grouping), timeSeriesRepository (parse epoch once, sort), selectors"
    status: completed
  - id: navigation
    content: Set up RootNavigator with typed stack routes (Markets, MarketDetail, DebugParity) and update App.tsx
    status: completed
  - id: components
    content: Build MarketCard (React.memo + Platform.select shadows), OddsPill, SegmentedYesNo, PriceChart (phase 1 only), OrderTicketSheet (with validation)
    status: completed
  - id: screens
    content: Build MarketsScreen (perf-optimized SectionList, fixed-height cards with truncation), MarketDetailScreen (vig tooltip + raw/norm probs + YES(Over)/NO(Under) + O/U caption), DebugParityScreen (data parity + platform parity checks)
    status: completed
  - id: polish
    content: Add DEMO_LATENCY_MS knob, error boundary, accessibility labels, deterministic formatting
    status: completed
  - id: readme
    content: Add README with feature-to-JD mapping table
    status: pending
isProject: false
---

# Informed Picks RN Demo -- Implementation Plan

## Current State

- Fresh Expo 55 project (`react-native` 0.83.2, React 19.2)
- React Navigation (native + native-stack), Gesture Handler, Reanimated, Screens, Safe Area already in `package.json`
- **Missing:** `babel.config.js` (required for Reanimated plugin)
- **Missing:** `src/` directory (all code currently just `App.tsx` + `index.ts` at root)
- Two JSON data files at project root, need to move into `src/data/`

## Key Design Decisions

- **YES = Over, NO = Under** -- made explicit everywhere in code and UI labels (e.g. "YES (Over)" / "NO (Under)"). A small caption on the detail screen explains: "Demo uses O/U markets mapped to YES (Over) / NO (Under)."
- **No global state for MVP** -- all state is screen-local via hooks; no `state/marketStore.ts`. Only add a store if filters/search or cross-screen ticket state is needed later.
- **No Phase 2 chart lib** -- charting libraries (victory-native, react-native-svg) risk native linking headaches and Metro issues in a demo. Phase 1 "latest price" + history table is the final deliverable.
- **Performance-first FlatList** -- demonstrate awareness of re-render traps up front.
- **One test file** -- avoid the "0 tests" smell; cover the odds utility functions with `jest-expo` preset.
- **Validate once, not per-render** -- JSON guards run at repository load time; validation results are stored and surfaced on DebugParityScreen.
- **Cross-platform parity proof** -- DebugParityScreen includes a Platform Parity Checks section showing runtime platform info + a real `Platform.select` shadow/elevation fix on MarketCard.
- **Fixed-height cards with truncation + fontScale guard** -- `getItemLayout` requires truly fixed heights; enforce via `numberOfLines` truncation on question text. However, Large Text / `fontScale > 1.1` can still break fixed-height assumptions. Staff-y fix: if `fontScale > 1.1`, disable `getItemLayout` (or increase the card height constant). Note the behavior in README and show `fontScale` on DebugParity.
- **removeClippedSubviews: Android only** -- on iOS it can clip shadows and cause visual artifacts with elevated cards. Since we highlight `cardShadow` parity, guard it: `removeClippedSubviews={Platform.OS === "android"}`.
- **Memoization correctness** -- `React.memo(MarketCard)` only helps if props are referentially stable. Pass **primitive props** (id, playername, category, odds numbers) rather than the full `Market` object. Repositories return module-scoped cached arrays (stable references) so `useMemo` in the screen holds across re-renders.
- **Timeseries epoch pre-parsing** -- parse `recordedAt` to numeric epoch once at repository load, not repeatedly in render.

## Data Shape Summary

**Markets** (75 items) -- key fields per entry:

```typescript
{
  id: string;             // "dk-prop-80681-12_5"
  propid: number;         // 80681 (FK to timeseries)
  line: number;           // 12.5
  unit: string | null;    // "yards", "receptions", null
  category: string;       // "Longest Reception", "Rushing Yards", etc.
  question: string;       // "A.J. Barner Longest Reception O/U 12.5"
  playername: string;     // "A.J. Barner"
  eventlabel: string;     // "SEA Seahawks @ NE Patriots"
  startsat: string;       // ISO datetime
  yesdecimalodds: number; // 1.860
  yesamericanodds: number;// -115
  nodecimalodds: number;  // 1.860
  noamericanodds: number; // -115
  sport: string;          // "NFL"
  gameid: number;         // 85
}
```

**Timeseries** (238 items) -- key fields per entry:

```typescript
{
  rn: number;             // row number within the prop+side group
  propId: number;         // FK to market.propid
  side: "over" | "under"; // maps to YES / NO
  line: number;
  unit: string;
  recordedAt: string;     // ISO timestamp
  oddsDecimal: number;
  oddsAmerican: number;
}
```

**Join:** `market.propid === timeseries.propId`. YES = "over", NO = "under".

---

## Step 0 -- Babel config + boot verification

Create `[babel.config.js](babel.config.js)` at project root:

```javascript
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    plugins: ["react-native-reanimated/plugin"],
  };
};
```

Then run `npx expo start` to confirm the app boots cleanly before writing any new code.

---

## Step 1 -- Move JSON data + scaffold `src/`

- Move `informed-picks-demo-markets.event23.game85.json` to `src/data/markets.json`
- Move `informed-picks-demo-timeseries.event23.game85.json` to `src/data/timeseries.json`
- Create the full directory tree (**no `state/` folder for MVP**):

```
src/
  data/          (markets.json, timeseries.json)
  types/         (market.ts, timeseries.ts, nav.ts)
  utils/         (odds.ts, odds.test.ts, format.ts, guards.ts)
  services/      (marketRepository.ts, timeSeriesRepository.ts, selectors.ts)
  navigation/    (RootNavigator.tsx)
  components/    (MarketCard, OddsPill, SegmentedYesNo, PriceChart, OrderTicketSheet, VigInfoTooltip)
  screens/       (MarketsScreen, MarketDetailScreen, DebugParityScreen)
  theme/         (colors.ts, spacing.ts, typography.ts)
```

---

## Step 2 -- Types (`src/types/`)

### `market.ts`

- `Market` interface matching the JSON shape above (all lowercase keys as-is from the export)
- Export a `MarketCategory` union type for the known categories if useful for filtering
- `ValidationResult` type: `{ valid: boolean; errors: string[] }` -- used by guards and surfaced on DebugParityScreen

### `timeseries.ts`

- `TimePoint` interface matching the JSON shape
- `Side = "over" | "under"` literal union
- `ParsedTimePoint` extends `TimePoint` with `epochMs: number` -- pre-parsed from `recordedAt`

### `nav.ts`

- `RootStackParamList` with strongly typed routes:
  - `Markets: undefined`
  - `MarketDetail: { propId: number }`
  - `DebugParity: undefined`

---

## Step 3 -- Theme (`src/theme/`)

### `colors.ts`

- Dark-mode-first palette (DraftKings-inspired):
  - `background: "#0D0D0D"`, `surface: "#1A1A1A"`, `surfaceElevated: "#262626"`
  - `yesGreen: "#00C781"`, `noRed: "#FF4D4D"`
  - `textPrimary: "#FFFFFF"`, `textSecondary: "#999999"`
  - `border: "#333333"`

### `spacing.ts`

- 4-point scale: `xs: 4, sm: 8, md: 16, lg: 24, xl: 32`

### `typography.ts`

- Font size + weight presets: `title`, `subtitle`, `body`, `caption`, `pill`

### Cross-platform shadow helper (in `colors.ts` or separate `shadows.ts`)

```typescript
import { Platform } from "react-native";

export const cardShadow = Platform.select({
  ios: {
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  android: {
    elevation: 4,
  },
  default: {},
});
```

This is the **one real iOS vs Android styling fix** that proves cross-platform parity awareness.

---

## Step 4 -- Utility functions (`src/utils/`)

### `odds.ts`

- `decimalToImpliedProb(decimal: number): number` -- `1 / decimal`
- `americanToImpliedProb(american: number): number` -- handles +/- correctly
- `normalizeYesNo(yesProb, noProb): { yes: number; no: number }` -- removes vig, sums to 1.0
- `formatPct(n: number, decimals = 1): string` -- e.g. "52.6%"
- `formatAmericanOdds(n: number): string` -- always prefixes "+" for positive

### `odds.test.ts` (baseline test suite)

Covers three critical cases to avoid the "0 tests" smell:

- `americanToImpliedProb` handles both +110 and -110 correctly
- `normalizeYesNo` output sums to approximately 1.0 (within floating point tolerance)
- `formatAmericanOdds` always prefixes "+" for positive values, "-" for negative

**Jest setup (gotcha-aware):**

- Add dev dep: `jest-expo` (includes TS transform via Expo preset)
- Create `jest.config.js`: `module.exports = { preset: "jest-expo" };`
- Add script: `"test": "jest --watch=false"`
- No TypeScript path aliases in this demo -- avoids Jest module mapping headaches
- Tests are **pure TS utility tests only** (odds.ts) -- no RN component rendering to sidestep RN/Jest integration issues

### `format.ts`

- `formatGameTime(iso: string): string` -- e.g. "Sun, Feb 8 - 6:30 PM"
- `formatRelativeTime(iso: string): string` -- e.g. "2h ago"

### `guards.ts`

- `isMarket(x: unknown): x is Market` -- runtime guard for JSON parsing safety
- `validateMarkets(data: unknown[]): { markets: Market[]; errors: string[] }` -- validates the full array once
- `validateTimeSeries(data: unknown[]): { points: TimePoint[]; errors: string[] }` -- validates the full array once
- **Staff pattern:** validation runs once at repository load time, NOT per render. Validation results (pass/fail counts, error messages) are stored in module scope and exposed for DebugParityScreen.

---

## Step 5 -- Repository layer (`src/services/`)

### `marketRepository.ts`

- All data is validated once via `validateMarkets()` and cached in **module-scoped** variables -- stable references across calls, so downstream `useMemo` and `React.memo` work correctly
- `getMarkets(): Market[]` -- returns the cached, validated array (same reference every call)
- `getMarketById(propId: number): Market | undefined` -- find by propid
- `getMarketsByCategory(category: string): Market[]`
- `getCategories(): string[]` -- unique sorted category list for filtering
- `getGroupedByCategory(): Record<string, Market[]>` -- precomputed grouping for the list screen (called once, not inside render)
- `getValidationResults(): { total: number; valid: number; errors: string[] }` -- exposed for DebugParityScreen

### `timeSeriesRepository.ts`

- All `TimePoint` entries are parsed to `ParsedTimePoint` at load time: `epochMs = new Date(recordedAt).getTime()` -- **parsed once, never re-parsed in render**
- `getTimeSeriesForProp(propId: number): ParsedTimePoint[]` -- filtered + sorted by `epochMs`
- `getLatestPoint(propId: number, side: Side): ParsedTimePoint | undefined`
- `getValidationResults()` -- exposed for DebugParityScreen

### `selectors.ts`

- `selectMarketHeader(market: Market)` -- returns `{ yesProbRaw, noProbRaw, yesProbNorm, noProbNorm, displayTitle, playerName, line, unit }`
  - Includes **both** raw implied prob and vig-removed normalized prob
- `selectSeriesBySide(points: ParsedTimePoint[])` -- returns `{ overPoints: ParsedTimePoint[], underPoints: ParsedTimePoint[] }`

---

## Step 6 -- Navigation (`src/navigation/RootNavigator.tsx`)

- `createNativeStackNavigator<RootStackParamList>()`
- Three screens: `Markets`, `MarketDetail`, `DebugParity`
- Dark theme header styling (transparent header, white text)
- `DebugParity` accessible via a small gear/debug icon in the Markets header

### Update `App.tsx`

- Wrap in `GestureHandlerRootView` (flex: 1)
- `NavigationContainer` with dark theme
- Render `<RootNavigator />`

---

## Step 7 -- UI Components (`src/components/`)

### `MarketCard.tsx`

- **Wrapped in `React.memo`** to prevent re-renders when parent list scrolls
- **Props are primitives, not a full `Market` object** -- receives `id`, `propid`, `playername`, `category`, `question`, `line`, `unit`, `yesamericanodds`, `noamericanodds`, `yesdecimalodds`, `nodecimalodds`. This ensures `React.memo` shallow comparison actually works (passing the whole object would defeat memoization if the reference changes).
- Card showing: `playername`, `category`, `question` (**with `numberOfLines={2}` truncation** for fixed card height), line
- Two `OddsPill` components side by side: **"YES (Over)"** / **"NO (Under)"**
- `onPress` handler wrapped in `useCallback` with stable `propId` dep
- Navigates to `MarketDetail` with `propId`
- `**Platform.select` shadow/elevation** via the `cardShadow` theme helper (iOS: shadowColor/Opacity/Radius/Offset, Android: elevation)
- Subtle border, elevated surface background

### `OddsPill.tsx`

- Compact pill: label ("YES (Over)"/"NO (Under)"), american odds, normalized probability
- Green tint for YES, red tint for NO
- Large touch target (min 44pt height)
- `accessibilityLabel` like "Yes over, plus 105, 48.8 percent"

### `SegmentedYesNo.tsx`

- Toggle between YES (Over) and NO (Under) for the order ticket
- Animated underline indicator using Reanimated

### `VigInfoTooltip.tsx`

- Small "info" icon button that toggles a tooltip/popover
- Text: "Probabilities shown are normalized from DK odds (vig removed)."
- Used on MarketDetailScreen next to the probability display

### `PriceChart.tsx` (Phase 1 only -- no chart lib)

- **Phase 1 is the final deliverable.** Do NOT invest in a chart library for this demo. A full chart lib can backfire in a demo setting (native linking, Metro issues, time sink).
- "Latest price" displayed prominently (large text, color-coded)
- History table below: rows showing `recordedAt`, `oddsAmerican`, `oddsDecimal` with the most recent entry visually emphasized (bold / highlight)
- Optional: tiny inline sparkline feel via styled row heights or background bars -- pure View-based, no SVG

### `OrderTicketSheet.tsx`

- Bottom sheet / modal (simple `Modal` or animated view for MVP)
- Shows: selected side (YES/NO via `SegmentedYesNo`), current odds
- Stake `TextInput` (numeric keyboard)
- Computed display: implied probability, estimated payout (`stake * decimalOdds`)
- **Order validation (UX maturity signal):**
  - Disable "Place Order" CTA if stake is empty, zero, or non-numeric
  - Show inline error text below the input: "Enter a valid stake amount"
  - Only enable CTA when `stake > 0` and a side is selected
- "Place Order" button (no-op for demo, show confirmation alert)

---

## Step 8 -- Screens (`src/screens/`)

### `MarketsScreen.tsx`

Performance-optimized `SectionList`:

- `keyExtractor` using stable `market.id`
- `**getItemLayout` with fontScale guard:** safe because we enforce `numberOfLines={2}` truncation, making card height deterministic at default font scale. However, if `PixelRatio.getFontScale() > 1.1` (Large Text), disable `getItemLayout` entirely (or increase the height constant) to avoid scroll-position bugs. Check `fontScale` once in the component body and conditionally pass the prop.
- `initialNumToRender={10}`, `windowSize={5}`
- `**removeClippedSubviews={Platform.OS === "android"}`** -- on iOS it can clip shadows and cause visual artifacts with our `cardShadow` elevated cards. Android-only is the safe default.
- `maxToRenderPerBatch={10}`
- **Grouping precomputed outside render** via `getGroupedByCategory()` from repository, memoized with `useMemo`. Repository returns stable module-scoped references, so `useMemo` deps don't change spuriously.
- `renderItem` uses `useCallback`; destructures market into primitive props before passing to `MarketCard` to ensure `React.memo` shallow comparison works

Content:

- `SectionList` grouped by `category`
- Optional: horizontal filter chips for categories at top
- **Configurable latency simulation:** `const DEMO_LATENCY_MS = 250;` (not hardcoded) -- allows discussion of perceived performance and skeleton UI during demo
- `ActivityIndicator` during simulated load
- Pull-to-refresh gesture (reloads same static data, demonstrates the pattern)
- Header right: small debug icon to navigate to `DebugParity`

### `MarketDetailScreen.tsx`

- Header: `eventlabel`, `startsat` formatted, `playername` + `category`
- **O/U semantics caption** (small text near top): "Demo uses O/U markets mapped to YES (Over) / NO (Under)." -- prevents a reviewer thinking you misunderstand prediction-market YES/NO semantics
- Current odds: large YES/NO pills showing:
  - **Normalized probability** (primary, large text) -- e.g. "52.6%"
  - **Raw implied probability** (secondary, smaller text below) -- e.g. "Raw: 53.8%"
  - `VigInfoTooltip` next to the probability section
- Labels explicitly show **"YES (Over)"** / **"NO (Under)"** to remove mapping confusion
- Price history section: `PriceChart` component (Phase 1 table)
- Bottom CTA: "Trade" button opens `OrderTicketSheet`
- Error boundary: if `propId` not found in data, show a "Market not found" state

### `DebugParityScreen.tsx`

Two sections, proving both data integrity and cross-platform awareness:

**Section 1: Data Parity Checks**

- Total markets count, total timeseries points count
- Validation results from repository load (pass/fail counts, any error messages from guards)
- For each market: number of timeseries points found (over + under)
- Highlight any markets with **zero** timeseries matches (orphaned markets)
- Highlight any timeseries `propId` values with **no** matching market (orphaned series)
- Show sum of raw implied probabilities for each market (should be > 1.0 due to vig)
- Show sum of normalized probabilities (should be ~1.0)
- Simple `FlatList` with green/red row coloring for pass/fail

**Section 2: Platform Parity Checks**

Proves the ability to "diagnose cross-browser/cross-platform compatibility issues":

- **Platform/OS:** `Platform.OS` + `Platform.Version`
- **Safe area insets:** top/bottom/left/right from `useSafeAreaInsets()`
- **Font scale:** `PixelRatio.getFontScale()`
- **Reduce motion:** `AccessibilityInfo.isReduceMotionEnabled()` (async, show result)
- **Color scheme:** `useColorScheme()` (light/dark/null)
- **Shadow method:** display which shadow approach is active (iOS shadowX props vs Android elevation) -- confirms `Platform.select` is working

Each row shows label + runtime value. This section is a diagnostic dashboard, not just data validation.

---

## Step 9 -- Polish and trust signals

- **Latency simulation:** `const DEMO_LATENCY_MS = 250;` configurable knob, used in `useEffect` with `setTimeout` to show skeleton/spinner. Allows demo discussion of perceived performance.
- **Error boundary:** A lightweight `ErrorBoundary` component wrapping the navigator
- **Deterministic formatting:** All odds always show sign prefix; all probabilities to 1 decimal place
- **Vig transparency:** Tooltip on detail screen explaining normalized probabilities; raw implied % always visible alongside
- **YES/NO mapping:** Every UI surface that says YES or NO also shows "(Over)" or "(Under)" in a secondary label. Caption on detail screen: "Demo uses O/U markets mapped to YES (Over) / NO (Under)."
- **Order validation:** Stake must be > 0 and numeric; CTA disabled with inline error otherwise. Shows product/UX maturity.
- **Accessibility:** `accessibilityRole="button"` on tappable elements, descriptive `accessibilityLabel` on odds pills, minimum 44pt touch targets
- **StatusBar:** Light content on dark background
- **Fixed-height cards with fontScale awareness:** `numberOfLines` truncation on question text so `getItemLayout` is accurate at default scale. If `fontScale > 1.1`, `getItemLayout` is disabled to prevent scroll bugs. Behavior documented in README.

---

## Step 10 -- README

Add a short `README.md` with a feature-to-JD mapping table:

- **Vig removal tooltip** -- pricing transparency -- maps to "trust"
- **DebugParity data checks** -- data diagnosis and confidence -- maps to "troubleshoot"
- **DebugParity platform checks** -- runtime environment diagnosis -- maps to "compatibility"
- **FlatList hygiene** (memo, useCallback, getItemLayout, windowSize) -- perf and scalability -- maps to "performance"
- **Platform.select shadows** -- iOS vs Android styling -- maps to "cross-platform parity"
- **Order validation** -- disable CTA + inline error -- maps to "user experience"
- **odds.test.ts** -- baseline correctness -- maps to "quality"
- **Validate-once guards** -- efficient data loading -- maps to "architecture"
- **fontScale-aware getItemLayout** -- graceful degradation under Large Text -- maps to "accessibility"
- **removeClippedSubviews Android-only** -- avoids iOS shadow clipping -- maps to "cross-platform parity"
- **Primitive props to MarketCard** -- correct memoization -- maps to "performance"

---

## Dependencies

**No new runtime packages** for Phase 1. Everything uses the already-installed deps (Expo 55, React Navigation, Reanimated, Gesture Handler, Screens, Safe Area Context).

**New dev dependency for testing:**

- `jest-expo` -- Expo's Jest preset (includes TS transform)
- Create `jest.config.js`: `module.exports = { preset: "jest-expo" };`
- Add script: `"test": "jest --watch=false"`
- No TypeScript path aliases in this demo -- avoids Jest module mapping headaches
- Tests are **pure TS utility only** (odds.ts) -- no RN component rendering to sidestep RN/Jest integration issues

**Explicitly NOT adding:** `victory-native`, `react-native-svg`, or any chart library. Phase 1 table/list is the final chart deliverable for this demo.