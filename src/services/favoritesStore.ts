import AsyncStorage from "@react-native-async-storage/async-storage";

import { Market } from "../types/market";

export type FavoriteId = Market["propid"];

export type FavoritesState = {
  ids: FavoriteId[];
  updatedAt: string | null;
};

export type FavoritesStore = {
  load(): Promise<FavoritesState | null>;
  save(next: FavoritesState): Promise<void>;
  clear(): Promise<void>;
};

type KeyValueStorage = {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
};

export const FAVORITES_STORAGE_KEY = "@market-demo:favorites:v1";

export const createEmptyFavoritesState = (): FavoritesState => ({
  ids: [],
  updatedAt: null,
});

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const isFavoriteId = (value: unknown): value is FavoriteId =>
  typeof value === "number" && Number.isInteger(value);

const isIsoStringOrNull = (value: unknown): value is string | null =>
  value === null || typeof value === "string";

const parseFavoritesState = (value: unknown): FavoritesState | null => {
  if (!isRecord(value)) return null;

  const idsRaw = value.ids;
  const updatedAtRaw = value.updatedAt ?? null;
  if (!Array.isArray(idsRaw) || !isIsoStringOrNull(updatedAtRaw)) return null;

  const ids: FavoriteId[] = [];
  for (const id of idsRaw) {
    if (!isFavoriteId(id)) return null;
    ids.push(id);
  }

  const uniqueSortedIds = Array.from(new Set(ids)).sort((a, b) => a - b);
  return { ids: uniqueSortedIds, updatedAt: updatedAtRaw };
};

let hasLoggedInvalidFavorites = false;
const logInvalidFavoritesOnce = (message: string, error?: unknown) => {
  if (!__DEV__ || hasLoggedInvalidFavorites) return;
  hasLoggedInvalidFavorites = true;
  console.warn(message, error);
};

export const createFavoritesStore = ({
  storage,
  key = FAVORITES_STORAGE_KEY,
}: {
  storage: KeyValueStorage;
  key?: string;
}): FavoritesStore => {
  return {
    async load() {
      const raw = await storage.getItem(key);
      if (raw == null) return null;

      try {
        const parsed = JSON.parse(raw) as unknown;
        const state = parseFavoritesState(parsed);
        if (state) return state;
        logInvalidFavoritesOnce(
          `[favorites] Invalid persisted state shape for key ${key}; clearing.`
        );
      } catch (err) {
        logInvalidFavoritesOnce(
          `[favorites] Failed to parse persisted state for key ${key}; clearing.`,
          err
        );
      }

      await storage.removeItem(key);
      return createEmptyFavoritesState();
    },

    async save(next) {
      const safe = parseFavoritesState(next) ?? {
        ids: Array.from(new Set(next.ids.filter(isFavoriteId))).sort(
          (a, b) => a - b
        ),
        updatedAt: isIsoStringOrNull(next.updatedAt) ? next.updatedAt : null,
      };
      await storage.setItem(key, JSON.stringify(safe));
    },

    async clear() {
      await storage.removeItem(key);
    },
  };
};

let cachedStore: FavoritesStore | null = null;
export const getFavoritesStore = (): FavoritesStore => {
  if (cachedStore) return cachedStore;
  cachedStore = createFavoritesStore({ storage: AsyncStorage });
  return cachedStore;
};

export const selectIsFavorite = (
  favorites: FavoritesState,
  marketId: FavoriteId
): boolean => favorites.ids.includes(marketId);

export const selectFavoriteCount = (favorites: FavoritesState): number =>
  favorites.ids.length;

export const toggleFavorite = ({
  favorites,
  marketId,
  nowIso,
}: {
  favorites: FavoritesState;
  marketId: FavoriteId;
  nowIso: string;
}): FavoritesState => {
  const nextIds = new Set(favorites.ids);
  if (nextIds.has(marketId)) nextIds.delete(marketId);
  else nextIds.add(marketId);
  return {
    ids: Array.from(nextIds).sort((a, b) => a - b),
    updatedAt: nowIso,
  };
};
