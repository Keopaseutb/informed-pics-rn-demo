import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from "react";

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

export type UseFavoritesArgs = {
  store?: FavoritesStore;
  now?: () => string;
};

const FavoritesContext = createContext<UseFavoritesResult | null>(null);

function useFavoritesEngine({
  store: storeArg,
  now: nowArg,
}: UseFavoritesArgs = {}): UseFavoritesResult {
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

  const value = useMemo<UseFavoritesResult>(
    () => ({ favorites, isHydrated, toggleFavorite, clearFavorites }),
    [favorites, isHydrated, toggleFavorite, clearFavorites]
  );

  return value;
}

/**
 * Owns a single favorites snapshot + hydration for the subtree. Mount once above
 * navigation so list/detail screens share state (each screen must not call the
 * engine hook separately).
 *
 * Gotchas for later:
 * - Provider placement matters: any subtree outside this provider will hard-fail on `useFavorites()`.
 * - Context updates rerender all consumers; fine for demo scale, but keep in mind if the app grows.
 * - If this provider is moved into a subtree that remounts often, you'll reintroduce hydration churn.
 */
export const FavoritesProvider = ({
  children,
  store,
  now,
}: PropsWithChildren<UseFavoritesArgs>) => {
  const value = useFavoritesEngine({ store, now });
  return (
    <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>
  );
};

/**
 * Reads shared favorites from {@link FavoritesProvider}.
 *
 * Hydration + persistence model:
 * - Non-blocking hydration: default empty favorites, then apply persisted snapshot when loaded.
 * - Hydration never clobbers user toggles that happen before load completes.
 * - Optimistic updates: UI updates immediately; persistence happens asynchronously.
 * - Persistence writes are serialized (last-write-wins ordering), but failures may still leave storage behind UI state.
 * - Write failures warn once in dev; there is no user-facing rollback/error yet (demo scope).
 */
export const useFavorites = (): UseFavoritesResult => {
  const ctx = useContext(FavoritesContext);
  if (!ctx) {
    throw new Error(
      "useFavorites must be used within FavoritesProvider (wrap the navigator near App root)."
    );
  }
  return ctx;
};
