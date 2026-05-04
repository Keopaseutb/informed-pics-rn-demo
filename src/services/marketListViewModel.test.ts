import { Market } from "../types/market";
import { buildMarketListViewModel } from "./marketListViewModel";

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

describe("buildMarketListViewModel", () => {
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
