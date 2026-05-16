# Markets repository: gotchas for later development

## Transitional contract (Week 2)

- The repository API is **still synchronous** (`getMarkets()`, `getMarketListData()`, etc.).
- Injected `MarketClient` implementations must therefore supply **`getSnapshotSync()`** alongside `list()` until the repository gains an async load path.
- **`list()`** is the long-term canonical async API; **`getSnapshotSync()`** is a deliberate bridge for bundled/offline data and sync callers.
- A client with **only** `list()` (no snapshot) will throw a clear error — this is documented and covered by tests, not a silent failure.

## `getValidationResults()` and the same bridge

- **`getValidationResults()`** uses the same raw snapshot path as **`getMarkets()`** (via `getSnapshotSync()`). Both assume the sync bridge exists.
- When moving to async loads, revisit validation totals vs. normalized counts together.

## Module-level client + test discipline

- **`activeMarketClient`** is **module-level mutable state**.
- Any Jest file that calls **`setMarketRepositoryClient`** must **`resetMarketRepositoryClient()`** in **`afterEach`** (or a scoped helper) so other suites do not see a swapped client.
- If this pattern spreads, a shared **`withMarketRepositoryClient(fake, fn)`** helper in test utilities can enforce reset automatically.
