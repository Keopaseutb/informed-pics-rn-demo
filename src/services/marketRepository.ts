import type { MarketClient } from "./marketClient";
import { Market } from "../types/market";
import { validateMarkets } from "../utils/guards";
import { staticJsonMarketClient } from "./staticJsonMarketClient";

/**
 * Normalizes market rows from the active {@link MarketClient} (no direct JSON imports here).
 *
 * **Sync vs async:** `MarketClient.list()` is the long-term canonical API (async, network-ready).
 * The repository’s current sync API still uses `getSnapshotSync()` as a temporary bridge until
 * an async load path exists; a client without `getSnapshotSync` will throw (see tests).
 *
 * Architecture notes: `docs/markets-repository-gotchas.md`.
 */

export type MarketListData = {
  markets: Market[];
  categories: string[];
  grouped: Record<string, Market[]>;
};

let activeMarketClient: MarketClient = staticJsonMarketClient;

let cachedMarkets: Market[] | null = null;
let cachedCategories: string[] | null = null;
let cachedGrouped: Record<string, Market[]> | null = null;
let cachedListData: MarketListData | null = null;
let validationErrors: string[] = [];

/** Drops all normalized / derived caches (they belong to the previous client snapshot). */
const clearRepositoryCache = () => {
  cachedMarkets = null;
  cachedCategories = null;
  cachedGrouped = null;
  cachedListData = null;
  validationErrors = [];
};

/**
 * Sets the active market data client (e.g. in tests). Always clears caches: normalized markets,
 * categories, grouped map, and list bundle were built from the old client and must not leak.
 */
export const setMarketRepositoryClient = (client: MarketClient) => {
  activeMarketClient = client;
  clearRepositoryCache();
};

/**
 * Restores the default bundled client and clears caches. Any test file that calls
 * `setMarketRepositoryClient` should `afterEach(resetMarketRepositoryClient)` to avoid
 * cross-suite contamination (state is module-level).
 */
export const resetMarketRepositoryClient = () => {
  activeMarketClient = staticJsonMarketClient;
  clearRepositoryCache();
};

const getRawRowsForValidation = (): unknown[] => {
  const snap = activeMarketClient.getSnapshotSync?.();
  if (snap == null) {
    throw new Error(
      "[markets] Active MarketClient must implement getSnapshotSync() until the repository supports async loads."
    );
  }
  return [...snap];
};

const loadMarkets = (): Market[] => {
  if (cachedMarkets) return cachedMarkets;
  const { markets, errors } = validateMarkets(getRawRowsForValidation());
  cachedMarkets = markets;
  validationErrors = errors;
  return cachedMarkets;
};

export const getMarkets = (): Market[] => loadMarkets();

export const getMarketById = (propId: number): Market | undefined =>
  loadMarkets().find((market) => market.propid === propId);

export const getMarketsByCategory = (category: string): Market[] =>
  loadMarkets().filter((market) => market.category === category);

export const getCategories = (): string[] => {
  if (cachedCategories) return cachedCategories;
  const categories = new Set(loadMarkets().map((market) => market.category));
  cachedCategories = Array.from(categories).sort();
  return cachedCategories;
};

export const getGroupedByCategory = (): Record<string, Market[]> => {
  if (cachedGrouped) return cachedGrouped;
  const grouped: Record<string, Market[]> = {};
  loadMarkets().forEach((market) => {
    if (!grouped[market.category]) grouped[market.category] = [];
    grouped[market.category].push(market);
  });
  cachedGrouped = grouped;
  return cachedGrouped;
};

export const getMarketListData = (): MarketListData => {
  if (cachedListData) return cachedListData;
  cachedListData = {
    markets: getMarkets(),
    categories: getCategories(),
    grouped: getGroupedByCategory(),
  };
  return cachedListData;
};

export const getValidationResults = () => {
  const total = getRawRowsForValidation().length;
  return {
    total,
    valid: loadMarkets().length,
    errors: validationErrors,
  };
};
