import rawMarkets from "../data/markets.json";

import type { MarketClient, RawMarketItem } from "./marketClient";

/** Bundled snapshot; not exported — consume via {@link staticJsonMarketClient} only. */
const bundledMarketRawRows: readonly RawMarketItem[] = rawMarkets as unknown[];

/**
 * Bundled static JSON adapter. `getSnapshotSync` exposes the same readonly array
 * `list()` resolves to (transport snapshot stays readonly; repo copies on validate).
 */
export const staticJsonMarketClient: MarketClient = {
  list: () => Promise.resolve(bundledMarketRawRows),

  getSnapshotSync: () => bundledMarketRawRows,
};
