# Favorites: gotchas for later development

This demo uses a **single shared favorites state** via `FavoritesProvider` + `useFavorites()`, with **optimistic updates** and **async persistence**.

## Architecture gotchas

- **Provider placement matters**
  - `useFavorites()` now reads context only and **throws** if used outside `FavoritesProvider`.
  - If you later add another navigator/subtree outside the provider, favorites will break loudly.
  - Keep `FavoritesProvider` mounted **above navigation** to preserve cross-screen consistency.

- **Provider remounting**
  - If you move `FavoritesProvider` into a subtree that remounts frequently, you can reintroduce:
    - hydration churn (empty → hydrated transitions)
    - transient UI flicker
    - loss of “shared state” guarantee across screens

- **All consumers rerender on change**
  - Context updates rerender all `useFavorites()` consumers.
  - Totally fine for current app size, but if the app grows:
    - consider splitting context (state vs actions)
    - or using selectors / external store patterns to reduce rerenders

## Persistence model gotchas

- **Hydration is non-blocking**
  - Initial state is empty favorites.
  - The provider hydrates from storage asynchronously.
  - This is now an app-level experience (not per-screen), which is good but makes the transition more visible.

- **Optimistic UI, queued writes**
  - UI updates immediately; persistence happens async and is serialized.
  - **No rollback** exists today: if a write fails, UI stays “optimistic” and storage may be behind.
  - Failures warn once in dev only.

## Testing notes

- The test suite covers:
  - **shared mutation** across multiple consumers under one provider
  - **shared hydration** when store `load()` returns a persisted state
  - **provider misuse contract** (`useFavorites()` outside provider errors)

