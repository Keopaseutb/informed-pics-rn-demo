import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type {
  FavoriteId,
  FavoritesState,
  FavoritesStore,
} from "../services/favoritesStore";
import {
  createEmptyFavoritesState,
  getFavoritesStore,
  toggleFavorite as toggleFavoriteState,
} from "../services/favoritesStore";

export type UseFavoritesResult = {
  favorites: FavoritesState;
  isHydrated: boolean;
  toggleFavorite: (marketId: FavoriteId) => void;
  clearFavorites: () => void;
};

type UseFavoritesArgs = {
  store?: FavoritesStore;
  now?: () => string;
};

/**
 * Favorites hydration + persistence model:
 * - Non-blocking hydration: default empty favorites, then apply persisted snapshot when loaded.
 * - Hydration never clobbers user toggles that happen before load completes.
 * - Optimistic updates: UI updates immediately; persistence happens asynchronously.
 * - Persistence writes are serialized (last-write-wins ordering), but failures may still leave storage behind UI state.
 * - Write failures warn once in dev; there is no user-facing rollback/error yet (demo scope).
 */
export const useFavorites = ({
  store: storeArg,
  now: nowArg,
}: UseFavoritesArgs = {}): UseFavoritesResult => {
  const store = useMemo(() => storeArg ?? getFavoritesStore(), [storeArg]);
  const now = useMemo(() => nowArg ?? (() => new Date().toISOString()), [nowArg]);

  const [favorites, setFavorites] = useState<FavoritesState>(() =>
    createEmptyFavoritesState()
  );
  const [isHydrated, setIsHydrated] = useState(false);

  const didMutateRef = useRef(false);
  const saveQueueRef = useRef(Promise.resolve());
  const hasWarnedWriteFailureRef = useRef(false);
  const isMountedRef = useRef(true);

  const warnWriteFailureOnce = useCallback((action: string, error: unknown) => {
    if (!__DEV__ || hasWarnedWriteFailureRef.current) return;
    hasWarnedWriteFailureRef.current = true;
    console.warn(`[favorites] Failed to persist (${action}).`, error);
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const persisted = await store.load();
        if (cancelled || !isMountedRef.current) return;

        if (!didMutateRef.current && persisted) {
          setFavorites(persisted);
        }
      } finally {
        if (!cancelled && isMountedRef.current) {
          setIsHydrated(true);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [store]);

  const toggleFavorite = useCallback(
    (marketId: FavoriteId) => {
      didMutateRef.current = true;

      setFavorites((prev) => {
        const next = toggleFavoriteState({
          favorites: prev,
          marketId,
          nowIso: now(),
        });

        saveQueueRef.current = saveQueueRef.current
          .then(() => store.save(next))
          .catch((err) => warnWriteFailureOnce("save", err));
        return next;
      });
    },
    [now, store, warnWriteFailureOnce]
  );

  const clearFavorites = useCallback(() => {
    didMutateRef.current = true;
    setFavorites(createEmptyFavoritesState());
    saveQueueRef.current = saveQueueRef.current
      .then(() => store.clear())
      .catch((err) => warnWriteFailureOnce("clear", err));
  }, [store, warnWriteFailureOnce]);

  return { favorites, isHydrated, toggleFavorite, clearFavorites };
};

