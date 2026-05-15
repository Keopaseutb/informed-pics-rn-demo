const loadFavoritesModule = () =>
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require("./favoritesStore") as typeof import("./favoritesStore");

class FakeStorage {
  private map = new Map<string, string>();

  public getItemCalls: string[] = [];
  public setItemCalls: Array<{ key: string; value: string }> = [];
  public removeItemCalls: string[] = [];

  async getItem(key: string): Promise<string | null> {
    this.getItemCalls.push(key);
    return this.map.get(key) ?? null;
  }

  async setItem(key: string, value: string): Promise<void> {
    this.setItemCalls.push({ key, value });
    this.map.set(key, value);
  }

  async removeItem(key: string): Promise<void> {
    this.removeItemCalls.push(key);
    this.map.delete(key);
  }

  seed(key: string, value: string) {
    this.map.set(key, value);
  }
}

describe("favoritesStore", () => {
  beforeEach(() => {
    jest.resetModules();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("createEmptyFavoritesState returns empty state", () => {
    const { createEmptyFavoritesState } = loadFavoritesModule();
    expect(createEmptyFavoritesState()).toEqual({ ids: [], updatedAt: null });
  });

  it("toggleFavorite adds a new favorite and updates updatedAt", () => {
    const { createEmptyFavoritesState, toggleFavorite } = loadFavoritesModule();
    const nowIso = "2026-01-01T00:00:00.000Z";
    const next = toggleFavorite({
      favorites: createEmptyFavoritesState(),
      marketId: 101,
      nowIso,
    });

    expect(next.ids).toEqual([101]);
    expect(next.updatedAt).toBe(nowIso);
  });

  it("toggleFavorite removes an existing favorite and updates updatedAt", () => {
    const { toggleFavorite } = loadFavoritesModule();
    const next = toggleFavorite({
      favorites: { ids: [101], updatedAt: "2026-01-01T00:00:00.000Z" },
      marketId: 101,
      nowIso: "2026-01-02T00:00:00.000Z",
    });

    expect(next.ids).toEqual([]);
    expect(next.updatedAt).toBe("2026-01-02T00:00:00.000Z");
  });

  it("toggleFavorite sorts ids deterministically", () => {
    const { toggleFavorite } = loadFavoritesModule();
    const next = toggleFavorite({
      favorites: { ids: [200, 100], updatedAt: null },
      marketId: 150,
      nowIso: "2026-01-01T00:00:00.000Z",
    });

    expect(next.ids).toEqual([100, 150, 200]);
  });

  it("toggleFavorite normalizes duplicates/unsorted input ids", () => {
    const { toggleFavorite } = loadFavoritesModule();
    const next = toggleFavorite({
      favorites: { ids: [200, 100, 100], updatedAt: null },
      marketId: 150,
      nowIso: "2026-01-01T00:00:00.000Z",
    });

    expect(next.ids).toEqual([100, 150, 200]);
  });

  it("selectIsFavorite returns correct boolean", () => {
    const { selectIsFavorite } = loadFavoritesModule();
    expect(selectIsFavorite({ ids: [101], updatedAt: null }, 101)).toBe(true);
    expect(selectIsFavorite({ ids: [101], updatedAt: null }, 999)).toBe(false);
  });

  it("selectFavoriteCount returns count", () => {
    const { selectFavoriteCount } = loadFavoritesModule();
    expect(selectFavoriteCount({ ids: [], updatedAt: null })).toBe(0);
    expect(selectFavoriteCount({ ids: [101, 102], updatedAt: null })).toBe(2);
  });

  it("createFavoritesStore.load returns null when storage is empty", async () => {
    const { createFavoritesStore } = loadFavoritesModule();
    const storage = new FakeStorage();
    const store = createFavoritesStore({ storage, key: "favorites" });

    await expect(store.load()).resolves.toBeNull();
    expect(storage.getItemCalls).toEqual(["favorites"]);
  });

  it("createFavoritesStore.load returns null only when storage is missing", async () => {
    const { createFavoritesStore } = loadFavoritesModule();

    const emptyStorage = new FakeStorage();
    const emptyStore = createFavoritesStore({ storage: emptyStorage, key: "favorites" });
    await expect(emptyStore.load()).resolves.toBeNull();

    const malformedStorage = new FakeStorage();
    malformedStorage.seed("favorites", "{not-json");
    const malformedStore = createFavoritesStore({
      storage: malformedStorage,
      key: "favorites",
    });

    const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
    try {
      await expect(malformedStore.load()).resolves.toEqual({
        ids: [],
        updatedAt: null,
      });
    } finally {
      warnSpy.mockRestore();
    }
  });

  it("createFavoritesStore.load parses and normalizes valid persisted state", async () => {
    const { createFavoritesStore } = loadFavoritesModule();
    const storage = new FakeStorage();
    storage.seed(
      "favorites",
      JSON.stringify({
        ids: [103, 101, 103],
        updatedAt: "2026-01-01T00:00:00.000Z",
      })
    );
    const store = createFavoritesStore({ storage, key: "favorites" });

    await expect(store.load()).resolves.toEqual({
      ids: [101, 103],
      updatedAt: "2026-01-01T00:00:00.000Z",
    });
    expect(storage.removeItemCalls).toEqual([]);
  });

  it("createFavoritesStore.load clears invalid JSON and returns empty state", async () => {
    const { createFavoritesStore } = loadFavoritesModule();
    const storage = new FakeStorage();
    storage.seed("favorites", "{not-json");
    const store = createFavoritesStore({ storage, key: "favorites" });

    const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
    try {
      await expect(store.load()).resolves.toEqual({ ids: [], updatedAt: null });
      expect(warnSpy).toHaveBeenCalledTimes(1);
      expect(warnSpy.mock.calls[0]?.[0]).toContain(
        "[favorites] Failed to parse persisted state for key favorites; clearing."
      );
      expect(storage.removeItemCalls).toEqual(["favorites"]);
    } finally {
      warnSpy.mockRestore();
    }
  });

  it("createFavoritesStore.load clears invalid shape and returns empty state", async () => {
    const { createFavoritesStore } = loadFavoritesModule();
    const storage = new FakeStorage();
    storage.seed(
      "favorites",
      JSON.stringify({ ids: ["bad"], updatedAt: 123 })
    );
    const store = createFavoritesStore({ storage, key: "favorites" });

    const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
    try {
      await expect(store.load()).resolves.toEqual({ ids: [], updatedAt: null });
      expect(warnSpy).toHaveBeenCalledTimes(1);
      expect(warnSpy.mock.calls[0]?.[0]).toContain(
        "[favorites] Invalid persisted state shape for key favorites; clearing."
      );
      expect(storage.removeItemCalls).toEqual(["favorites"]);
    } finally {
      warnSpy.mockRestore();
    }
  });

  it("createFavoritesStore.load does not clear valid empty state", async () => {
    const { createFavoritesStore } = loadFavoritesModule();
    const storage = new FakeStorage();
    storage.seed(
      "favorites",
      JSON.stringify({ ids: [], updatedAt: "2026-01-01T00:00:00.000Z" })
    );
    const store = createFavoritesStore({ storage, key: "favorites" });

    await expect(store.load()).resolves.toEqual({
      ids: [],
      updatedAt: "2026-01-01T00:00:00.000Z",
    });
    expect(storage.removeItemCalls).toEqual([]);
  });

  it("createFavoritesStore.save sanitizes ids before persisting", async () => {
    const { createFavoritesStore } = loadFavoritesModule();
    const storage = new FakeStorage();
    const store = createFavoritesStore({ storage, key: "favorites" });

    await store.save({
      ids: [200, 100, 100],
      updatedAt: 123 as unknown as string,
    });

    expect(storage.setItemCalls).toHaveLength(1);
    const persisted = JSON.parse(storage.setItemCalls[0]!.value) as unknown;
    expect(persisted).toEqual({ ids: [100, 200], updatedAt: null });
  });

  it("createFavoritesStore.save round-trips normalized ids through load", async () => {
    const { createFavoritesStore } = loadFavoritesModule();
    const storage = new FakeStorage();
    const store = createFavoritesStore({ storage, key: "favorites" });

    await store.save({
      ids: [200, 100, 100],
      updatedAt: "2026-01-03T00:00:00.000Z",
    });

    await expect(store.load()).resolves.toEqual({
      ids: [100, 200],
      updatedAt: "2026-01-03T00:00:00.000Z",
    });
  });
});

describe("favorites list/detail composition", () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it("maps each market row to isFavorite from favorites state", () => {
    const {
      createEmptyFavoritesState,
      toggleFavorite,
      selectIsFavorite,
    } = loadFavoritesModule();

    const markets = [{ propid: 101 }, { propid: 102 }, { propid: 103 }];
    let favorites = createEmptyFavoritesState();
    favorites = toggleFavorite({
      favorites,
      marketId: 102,
      nowIso: "2026-01-01T00:00:00.000Z",
    });
    favorites = toggleFavorite({
      favorites,
      marketId: 103,
      nowIso: "2026-01-02T00:00:00.000Z",
    });

    const rows = markets.map((m) => ({
      propid: m.propid,
      isFavorite: selectIsFavorite(favorites, m.propid),
    }));

    expect(rows).toEqual([
      { propid: 101, isFavorite: false },
      { propid: 102, isFavorite: true },
      { propid: 103, isFavorite: true },
    ]);
  });

  it("detail surface uses selectIsFavorite for the active prop id", () => {
    const {
      createEmptyFavoritesState,
      toggleFavorite,
      selectIsFavorite,
    } = loadFavoritesModule();

    let favorites = createEmptyFavoritesState();
    favorites = toggleFavorite({
      favorites,
      marketId: 55,
      nowIso: "2026-01-01T00:00:00.000Z",
    });

    const detailPropId = 55;
    expect(selectIsFavorite(favorites, detailPropId)).toBe(true);
    expect(selectIsFavorite(favorites, 56)).toBe(false);
  });
});

