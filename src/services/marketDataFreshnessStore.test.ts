import {
  createMarketDataFreshnessStore,
  MARKET_DATA_LAST_UPDATED_KEY,
} from "./marketDataFreshnessStore";

class FakeStorage {
  private map = new Map<string, string>();

  async getItem(key: string): Promise<string | null> {
    return this.map.get(key) ?? null;
  }

  async setItem(key: string, value: string): Promise<void> {
    this.map.set(key, value);
  }

  async removeItem(key: string): Promise<void> {
    this.map.delete(key);
  }

  seed(key: string, value: string) {
    this.map.set(key, value);
  }

  has(key: string) {
    return this.map.has(key);
  }
}

describe("marketDataFreshnessStore", () => {
  it("loadLastUpdatedAt returns null when empty", async () => {
    const storage = new FakeStorage();
    const store = createMarketDataFreshnessStore({
      storage,
      key: MARKET_DATA_LAST_UPDATED_KEY,
    });
    await expect(store.loadLastUpdatedAt()).resolves.toBeNull();
  });

  it("round-trips a valid ISO string", async () => {
    const storage = new FakeStorage();
    const store = createMarketDataFreshnessStore({
      storage,
      key: "freshness-test",
    });
    const iso = "2026-05-15T12:00:00.000Z";
    await store.saveLastUpdatedAt(iso);
    await expect(store.loadLastUpdatedAt()).resolves.toBe(iso);
  });

  it("clears invalid persisted values on load", async () => {
    const storage = new FakeStorage();
    storage.seed("freshness-test", "not-iso");
    const store = createMarketDataFreshnessStore({
      storage,
      key: "freshness-test",
    });
    await expect(store.loadLastUpdatedAt()).resolves.toBeNull();
    expect(storage.has("freshness-test")).toBe(false);
  });

  it("loadLastUpdatedAt returns null for blank or whitespace-only values and clears storage", async () => {
    const storage = new FakeStorage();
    storage.seed("freshness-test", "");
    const store = createMarketDataFreshnessStore({
      storage,
      key: "freshness-test",
    });
    await expect(store.loadLastUpdatedAt()).resolves.toBeNull();
    expect(storage.has("freshness-test")).toBe(false);

    storage.seed("freshness-test", "   ");
    await expect(store.loadLastUpdatedAt()).resolves.toBeNull();
    expect(storage.has("freshness-test")).toBe(false);
  });

  it("clears parseable but non-canonical timestamps on load", async () => {
    const storage = new FakeStorage();
    storage.seed("freshness-test", "2026-05-15");
    const store = createMarketDataFreshnessStore({
      storage,
      key: "freshness-test",
    });
    await expect(store.loadLastUpdatedAt()).resolves.toBeNull();
    expect(storage.has("freshness-test")).toBe(false);
  });

  it("saveLastUpdatedAt rejects invalid ISO", async () => {
    const storage = new FakeStorage();
    const store = createMarketDataFreshnessStore({
      storage,
      key: "freshness-test",
    });
    await expect(store.saveLastUpdatedAt("bad")).rejects.toThrow(
      /Invalid ISO timestamp/i
    );
  });

  it("saveLastUpdatedAt rejects parseable but non-canonical timestamps", async () => {
    const storage = new FakeStorage();
    const store = createMarketDataFreshnessStore({
      storage,
      key: "freshness-test",
    });
    await expect(store.saveLastUpdatedAt("2026-05-15")).rejects.toThrow(
      /Invalid ISO timestamp/i
    );
  });
});
