import { Market } from "../types/market";
import {
  buildMarketListViewModel,
  deriveMarketListState,
  normalizeMarketSearchQuery,
} from "./marketListViewModel";

const makeMarket = (overrides: Partial<Market>): Market => ({
  id: "market",
  line: 1.5,
  unit: null,
  sport: "NFL",
  gameid: 1,
  propid: 1,
  category: "Receiving Yards",
  question: "Player Receiving Yards O/U 1.5",
  startsat: "2026-02-08T23:30:00",
  eventlabel: "SEA Seahawks @ NE Patriots",
  playername: "Player",
  nodecimalodds: 1.9,
  noamericanodds: -110,
  yesdecimalodds: 1.9,
  yesamericanodds: -110,
  ...overrides,
});

const receivingMarket = makeMarket({
  id: "receiving",
  propid: 101,
  category: "Receiving Yards",
  question: "A.J. Barner Receiving Yards O/U 25.5",
  playername: "A.J. Barner",
});

const receptionsMarket = makeMarket({
  id: "receptions",
  propid: 102,
  category: "Receptions",
  question: "Austin Hooper Receptions O/U 0.5",
  playername: "Austin Hooper",
});

const rushingMarket = makeMarket({
  id: "rushing",
  propid: 103,
  category: "Rushing Yards",
  question: "Kenneth Walker Rushing Yards O/U 65.5",
  playername: "Kenneth Walker",
});

const categories = ["Receiving Yards", "Receptions", "Rushing Yards"];
const markets = [receivingMarket, receptionsMarket, rushingMarket];
const grouped = {
  "Receiving Yards": [receivingMarket],
  Receptions: [receptionsMarket],
  "Rushing Yards": [rushingMarket],
};

const itemIds = (flatData: ReturnType<typeof buildMarketListViewModel>["flatData"]) =>
  flatData
    .filter((item) => item.type === "item")
    .map((item) => item.market.id);

const headerTitles = (
  flatData: ReturnType<typeof buildMarketListViewModel>["flatData"]
) =>
  flatData
    .filter((item) => item.type === "header")
    .map((item) => item.title);

describe("normalizeMarketSearchQuery", () => {
  it("trims and lowercases", () => {
    expect(normalizeMarketSearchQuery("  MixedCase  ")).toBe("mixedcase");
  });

  it("returns empty string for whitespace-only", () => {
    expect(normalizeMarketSearchQuery("   ")).toBe("");
  });
});

describe("buildMarketListViewModel", () => {
  it("with empty query returns all markets in category order", () => {
    const result = buildMarketListViewModel({
      markets,
      categories,
      grouped,
      query: "",
    });

    expect(headerTitles(result.flatData)).toEqual([
      "Receiving Yards",
      "Receptions",
      "Rushing Yards",
    ]);
    expect(itemIds(result.flatData)).toEqual([
      "receiving",
      "receptions",
      "rushing",
    ]);
    expect(result.stickyHeaderIndices).toEqual([0, 2, 4]);
  });

  it("filters by player name", () => {
    const result = buildMarketListViewModel({
      markets,
      categories,
      grouped,
      query: "barner",
    });

    expect(headerTitles(result.flatData)).toEqual(["Receiving Yards"]);
    expect(itemIds(result.flatData)).toEqual(["receiving"]);
  });

  it("filters by question text", () => {
    const result = buildMarketListViewModel({
      markets,
      categories,
      grouped,
      query: "kenneth walker rushing",
    });

    expect(headerTitles(result.flatData)).toEqual(["Rushing Yards"]);
    expect(itemIds(result.flatData)).toEqual(["rushing"]);
  });

  it("filters by category text", () => {
    const result = buildMarketListViewModel({
      markets,
      categories,
      grouped,
      query: "receiving yards",
    });

    expect(headerTitles(result.flatData)).toEqual(["Receiving Yards"]);
    expect(itemIds(result.flatData)).toEqual(["receiving"]);
  });

  it("filters by event label", () => {
    const result = buildMarketListViewModel({
      markets,
      categories,
      grouped,
      query: "patriots",
    });

    expect(headerTitles(result.flatData)).toEqual([
      "Receiving Yards",
      "Receptions",
      "Rushing Yards",
    ]);
    expect(itemIds(result.flatData)).toEqual([
      "receiving",
      "receptions",
      "rushing",
    ]);
  });

  it("produces stable output for identical inputs", () => {
    const args = {
      markets,
      categories,
      grouped,
      query: "hooper",
      selectedCategory: "Receptions" as const,
    };
    const a = buildMarketListViewModel(args);
    const b = buildMarketListViewModel(args);
    expect(a.flatData).toEqual(b.flatData);
    expect(a.stickyHeaderIndices).toEqual(b.stickyHeaderIndices);
    expect(Array.from(a.marketMeta.entries())).toEqual(
      Array.from(b.marketMeta.entries())
    );
  });

  it("filters to a selected category", () => {
    const result = buildMarketListViewModel({
      markets,
      categories,
      grouped,
      query: "",
      selectedCategory: "Receptions",
    });

    expect(headerTitles(result.flatData)).toEqual(["Receptions"]);
    expect(itemIds(result.flatData)).toEqual(["receptions"]);
    expect(result.stickyHeaderIndices).toEqual([0]);
  });

  it("treats null and omitted selectedCategory as All", () => {
    const nullCategory = buildMarketListViewModel({
      markets,
      categories,
      grouped,
      query: "",
      selectedCategory: null,
    });
    const omittedCategory = buildMarketListViewModel({
      markets,
      categories,
      grouped,
      query: "",
    });

    expect(itemIds(nullCategory.flatData)).toEqual([
      "receiving",
      "receptions",
      "rushing",
    ]);
    expect(nullCategory).toEqual(omittedCategory);
  });

  it("composes query and selected category filters", () => {
    const result = buildMarketListViewModel({
      markets,
      categories,
      grouped,
      query: "austin",
      selectedCategory: "Receptions",
    });

    expect(headerTitles(result.flatData)).toEqual(["Receptions"]);
    expect(itemIds(result.flatData)).toEqual(["receptions"]);
  });

  it("normalizes trimmed and case-insensitive queries", () => {
    const result = buildMarketListViewModel({
      markets,
      categories,
      grouped,
      query: " AUSTIN ",
    });

    expect(headerTitles(result.flatData)).toEqual(["Receptions"]);
    expect(itemIds(result.flatData)).toEqual(["receptions"]);
  });

  it("returns empty data and sticky headers when there are no matches", () => {
    const result = buildMarketListViewModel({
      markets,
      categories,
      grouped,
      query: "mahomes",
    });

    expect(result.flatData).toEqual([]);
    expect(result.stickyHeaderIndices).toEqual([]);
  });

  it("does not emit empty headers for categories without matches", () => {
    const result = buildMarketListViewModel({
      markets,
      categories,
      grouped,
      query: "receiving",
    });

    expect(headerTitles(result.flatData)).toEqual(["Receiving Yards"]);
    expect(itemIds(result.flatData)).toEqual(["receiving"]);
  });

  it("returns market metadata keyed by propid", () => {
    const result = buildMarketListViewModel({
      markets,
      categories,
      grouped,
      query: "",
    });

    expect(result.marketMeta.get(receivingMarket.propid)).toMatchObject({
      playerName: "A.J. Barner",
      displayTitle: "A.J. Barner Receiving Yards O/U 25.5",
      line: 1.5,
      unit: null,
    });
    expect(result.marketMeta.get(receptionsMarket.propid)).toBeDefined();
    expect(result.marketMeta.get(rushingMarket.propid)).toBeDefined();
  });
});

describe("deriveMarketListState", () => {
  it("returns loading when loading is true", () => {
    const state = deriveMarketListState({
      loading: true,
      hasError: true,
      marketCount: 0,
      flatDataCount: 0,
    });
    expect(state).toBe("loading");
  });

  it("returns error when hasError is true and not loading", () => {
    const state = deriveMarketListState({
      loading: false,
      hasError: true,
      marketCount: 0,
      flatDataCount: 0,
    });
    expect(state).toBe("error");
  });

  it("returns empty when no markets exist", () => {
    const state = deriveMarketListState({
      loading: false,
      hasError: false,
      marketCount: 0,
      flatDataCount: 0,
    });
    expect(state).toBe("empty");
  });

  it("returns noResults when markets exist but filtered rows are empty", () => {
    const state = deriveMarketListState({
      loading: false,
      hasError: false,
      marketCount: 3,
      flatDataCount: 0,
    });
    expect(state).toBe("noResults");
  });

  it("returns ready when data exists and filtered rows exist", () => {
    const state = deriveMarketListState({
      loading: false,
      hasError: false,
      marketCount: 3,
      flatDataCount: 5,
    });
    expect(state).toBe("ready");
  });

  it("applies precedence: error over ready when hasError is true", () => {
    const state = deriveMarketListState({
      loading: false,
      hasError: true,
      marketCount: 10,
      flatDataCount: 20,
    });
    expect(state).toBe("error");
  });

  it("applies precedence: loading > error > empty > noResults", () => {
    const loadingState = deriveMarketListState({
      loading: true,
      hasError: true,
      marketCount: 0,
      flatDataCount: 0,
    });
    const errorState = deriveMarketListState({
      loading: false,
      hasError: true,
      marketCount: 0,
      flatDataCount: 0,
    });
    const emptyState = deriveMarketListState({
      loading: false,
      hasError: false,
      marketCount: 0,
      flatDataCount: 0,
    });
    const noResultsState = deriveMarketListState({
      loading: false,
      hasError: false,
      marketCount: 2,
      flatDataCount: 0,
    });

    expect(loadingState).toBe("loading");
    expect(errorState).toBe("error");
    expect(emptyState).toBe("empty");
    expect(noResultsState).toBe("noResults");
  });

  it("returns mutually exclusive states: each input maps to exactly one list state", () => {
    const states = new Set<ReturnType<typeof deriveMarketListState>>([
      deriveMarketListState({
        loading: true,
        hasError: false,
        marketCount: 1,
        flatDataCount: 1,
      }),
      deriveMarketListState({
        loading: false,
        hasError: true,
        marketCount: 1,
        flatDataCount: 1,
      }),
      deriveMarketListState({
        loading: false,
        hasError: false,
        marketCount: 0,
        flatDataCount: 0,
      }),
      deriveMarketListState({
        loading: false,
        hasError: false,
        marketCount: 2,
        flatDataCount: 0,
      }),
      deriveMarketListState({
        loading: false,
        hasError: false,
        marketCount: 2,
        flatDataCount: 3,
      }),
    ]);

    expect(states).toEqual(
      new Set(["loading", "error", "empty", "noResults", "ready"])
    );
  });
});
