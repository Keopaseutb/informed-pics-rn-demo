import { memo, type MutableRefObject } from "react";
import TestRenderer, { act } from "react-test-renderer";

import type { UseFavoritesResult } from "./useFavorites";
import { FavoritesProvider, useFavorites } from "./useFavorites";

const noopStore = {
  load: jest.fn().mockResolvedValue(null),
  save: jest.fn().mockResolvedValue(undefined),
  clear: jest.fn().mockResolvedValue(undefined),
};

function FavoritesProbe({
  sink,
}: {
  sink: MutableRefObject<UseFavoritesResult | null>;
}) {
  sink.current = useFavorites();
  return null;
}

describe("FavoritesProvider", () => {
  beforeEach(() => {
    noopStore.load.mockClear();
    noopStore.save.mockClear();
    noopStore.clear.mockClear();
    noopStore.load.mockResolvedValue(null);
  });

  it("does not rerender consumers when provider rerenders with unchanged value", () => {
    // Keep hydration from flipping isHydrated during this test.
    const pending = new Promise<null>(() => {});
    const store = {
      load: jest.fn().mockReturnValue(pending),
      save: jest.fn().mockResolvedValue(undefined),
      clear: jest.fn().mockResolvedValue(undefined),
    };

    let renders = 0;
    const RenderCounter = memo(function RenderCounter() {
      renders += 1;
      useFavorites();
      return null;
    });

    let renderer: TestRenderer.ReactTestRenderer;
    act(() => {
      renderer = TestRenderer.create(
        <FavoritesProvider store={store}>
          <RenderCounter />
        </FavoritesProvider>
      );
    });

    act(() => {
      renderer.update(
        <FavoritesProvider store={store}>
          <RenderCounter />
        </FavoritesProvider>
      );
    });

    expect(renders).toBe(1);
    act(() => {
      renderer.unmount();
    });
  });

  it("shares favorites state across multiple consumers (detail ↔ list consistency)", async () => {
    const refList = { current: null as UseFavoritesResult | null };
    const refDetail = { current: null as UseFavoritesResult | null };

    await act(async () => {
      TestRenderer.create(
        <FavoritesProvider store={noopStore}>
          <FavoritesProbe sink={refList} />
          <FavoritesProbe sink={refDetail} />
        </FavoritesProvider>
      );
    });

    await act(async () => {
      await Promise.resolve();
    });

    act(() => {
      refDetail.current!.toggleFavorite(9001);
    });

    expect(refList.current!.favorites.ids).toEqual([9001]);
    expect(refDetail.current!.favorites.ids).toEqual([9001]);
    expect(refList.current!.toggleFavorite).toBe(refDetail.current!.toggleFavorite);
  });

  it("shares hydrated persisted state across multiple consumers", async () => {
    const refList = { current: null as UseFavoritesResult | null };
    const refDetail = { current: null as UseFavoritesResult | null };

    noopStore.load.mockResolvedValueOnce({
      ids: [101],
      updatedAt: "2026-01-01T00:00:00.000Z",
    });

    await act(async () => {
      TestRenderer.create(
        <FavoritesProvider store={noopStore}>
          <FavoritesProbe sink={refList} />
          <FavoritesProbe sink={refDetail} />
        </FavoritesProvider>
      );
    });

    await act(async () => {
      await Promise.resolve();
    });
    await act(async () => {
      await Promise.resolve();
    });

    expect(refList.current!.favorites.ids).toEqual([101]);
    expect(refDetail.current!.favorites.ids).toEqual([101]);
    expect(refList.current!.isHydrated).toBe(true);
    expect(refDetail.current!.isHydrated).toBe(true);
  });

  it("errors if useFavorites is used outside FavoritesProvider", async () => {
    function Bad() {
      useFavorites();
      return null;
    }

    const consoleErrorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    try {
      await expect(async () => {
        await act(async () => {
          TestRenderer.create(<Bad />);
        });
      }).rejects.toThrow(/useFavorites must be used within FavoritesProvider/);
    } finally {
      consoleErrorSpy.mockRestore();
    }
  });
});
