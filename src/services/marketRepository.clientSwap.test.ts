/**
 * Covers module-level `setMarketRepositoryClient` / `resetMarketRepositoryClient`.
 *
 * **Discipline:** Any suite that calls `setMarketRepositoryClient` must reset in `afterEach`
 * (or equivalent) so Jest order does not leak module-level `activeMarketClient` across files.
 *
 * **Future:** If many suites swap clients, consider a shared test helper such as
 * `withMarketRepositoryClient(fake, () => { ... })` that always resets on exit.
 */
import { isMarket } from "../utils/guards";
import type { MarketClient, RawMarketItem } from "./marketClient";
import {
  getMarkets,
  getValidationResults,
  resetMarketRepositoryClient,
  setMarketRepositoryClient,
} from "./marketRepository";

describe("marketRepository client injection", () => {
  afterEach(() => {
    resetMarketRepositoryClient();
  });

  it("rebuilds normalized markets when the client is swapped", () => {
    const validRow: RawMarketItem = {
      id: "test-prop-1",
      line: 1.5,
      unit: null,
      sport: "NFL",
      gameid: 1,
      propid: 999001,
      category: "Test Category",
      question: "Test question",
      startsat: "2026-02-08T23:30:00",
      eventlabel: "Test @ Test",
      playername: "Tester",
      nodecimalodds: 1.9,
      noamericanodds: -110,
      yesdecimalodds: 1.9,
      yesamericanodds: -110,
    };

    const fakeClient: MarketClient = {
      list: () => Promise.resolve([validRow, { not: "a market" }]),
      getSnapshotSync: () => [validRow, { not: "a market" }],
    };

    setMarketRepositoryClient(fakeClient);

    expect(getValidationResults().total).toBe(2);
    expect(getMarkets()).toHaveLength(1);
    expect(getMarkets()[0]!.propid).toBe(999001);
  });

  it("getMarkets returns only rows that satisfy isMarket", () => {
    for (const m of getMarkets()) {
      expect(isMarket(m)).toBe(true);
    }
  });

  it("throws a clear error when the client has list() but no getSnapshotSync()", () => {
    const asyncShapeOnlyClient: MarketClient = {
      list: () => Promise.resolve([]),
    };

    setMarketRepositoryClient(asyncShapeOnlyClient);

    expect(() => getMarkets()).toThrow(
      /Active MarketClient must implement getSnapshotSync/i
    );
    expect(() => getValidationResults()).toThrow(
      /Active MarketClient must implement getSnapshotSync/i
    );
  });

  it("resetMarketRepositoryClient restores reads against the default bundled client", () => {
    const defaultCount = getMarkets().length;
    expect(defaultCount).toBeGreaterThan(10);

    const validRow: RawMarketItem = {
      id: "reset-test-prop",
      line: 2,
      unit: null,
      sport: "NFL",
      gameid: 99,
      propid: 888001,
      category: "Reset Test",
      question: "Reset test question",
      startsat: "2026-02-08T23:30:00",
      eventlabel: "A @ B",
      playername: "ResetTester",
      nodecimalodds: 1.9,
      noamericanodds: -110,
      yesdecimalodds: 1.9,
      yesamericanodds: -110,
    };

    const fakeClient: MarketClient = {
      list: () => Promise.resolve([validRow]),
      getSnapshotSync: () => [validRow],
    };

    setMarketRepositoryClient(fakeClient);
    expect(getMarkets()).toHaveLength(1);
    expect(getMarkets()[0]!.propid).toBe(888001);

    resetMarketRepositoryClient();

    expect(getMarkets()).toHaveLength(defaultCount);
    expect(getValidationResults().valid).toBe(defaultCount);
    expect(getMarkets().some((m) => m.propid === 888001)).toBe(false);
  });
});
