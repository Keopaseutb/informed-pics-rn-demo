/**
 * Transport-layer row for markets before repository validation/normalization.
 * Intentionally `unknown` so UI types (`Market`) are not coupled to raw JSON.
 */
export type RawMarketItem = unknown;

/**
 * Minimal market data access boundary. Static JSON implements this today;
 * a remote client can swap in without changing repository normalization.
 *
 * **`list()`** — canonical async API (same rows a network client would return); used in tests
 * and intended as the primary surface once the repository supports async loading.
 *
 * **`getSnapshotSync()`** — optional bridge for the *current* synchronous repository: bundled
 * clients expose the same readonly snapshot `list()` resolves to. Omit it only when pairing
 * with a repository that loads via `await list()` (not implemented yet).
 */
export type MarketClient = {
  list(): Promise<readonly RawMarketItem[]>;
  getSnapshotSync?(): readonly RawMarketItem[] | null;
};
