import { isCanonicalIsoInstant } from "../utils/isoInstant";

type KeyValueStorage = {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
};

export type MarketDataFreshnessStore = {
  loadLastUpdatedAt(): Promise<string | null>;
  saveLastUpdatedAt(iso: string): Promise<void>;
};

/**
 * Persisted value must be canonical `toISOString()` output; legacy shapes are cleared on load.
 * Bump the key if you add a new persisted format.
 */
export const MARKET_DATA_LAST_UPDATED_KEY =
  "@market-demo:markets-last-updated-at:v1";

export const createMarketDataFreshnessStore = ({
  storage,
  key = MARKET_DATA_LAST_UPDATED_KEY,
}: {
  storage: KeyValueStorage;
  key?: string;
}): MarketDataFreshnessStore => ({
  async loadLastUpdatedAt() {
    const raw = await storage.getItem(key);
    if (raw == null) return null;
    const trimmed = raw.trim();
    if (trimmed === "") {
      await storage.removeItem(key);
      return null;
    }
    if (!isCanonicalIsoInstant(trimmed)) {
      await storage.removeItem(key);
      return null;
    }
    return trimmed;
  },

  async saveLastUpdatedAt(iso: string) {
    const trimmed = iso.trim();
    if (!isCanonicalIsoInstant(trimmed)) {
      throw new Error(`[markets-freshness] Invalid ISO timestamp: ${iso}`);
    }
    await storage.setItem(key, trimmed);
  },
});

let cachedStore: MarketDataFreshnessStore | null = null;

export const getMarketDataFreshnessStore = (): MarketDataFreshnessStore => {
  if (cachedStore) return cachedStore;
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const asyncStorageModule = require("@react-native-async-storage/async-storage");
  const AsyncStorage = asyncStorageModule.default ?? asyncStorageModule;
  cachedStore = createMarketDataFreshnessStore({ storage: AsyncStorage });
  return cachedStore;
};
