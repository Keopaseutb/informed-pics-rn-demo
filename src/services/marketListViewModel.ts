import { Market } from "../types/market";

export type MarketListItem =
  | { type: "header"; key: string; title: string }
  | { type: "item"; key: string; market: Market };

type BuildMarketListViewModelArgs = {
  categories: string[];
  grouped: Record<string, Market[]>;
  query: string;
};

export const normalizeMarketSearchQuery = (query: string): string =>
  query.trim().toLowerCase();

const marketMatchesQuery = (market: Market, query: string): boolean => {
  if (!query) return true;

  return [
    market.playername,
    market.category,
    market.question,
    market.eventlabel,
  ].some((value) => String(value ?? "").toLowerCase().includes(query));
};

export const buildMarketListViewModel = ({
  categories,
  grouped,
  query,
}: BuildMarketListViewModelArgs) => {
  const normalizedQuery = normalizeMarketSearchQuery(query);
  const flatData: MarketListItem[] = [];
  const stickyHeaderIndices: number[] = [];

  categories.forEach((category) => {
    const categoryMarkets = grouped[category] ?? [];
    const filteredMarkets = categoryMarkets.filter((market) =>
      marketMatchesQuery(market, normalizedQuery)
    );

    if (!filteredMarkets.length) return;

    stickyHeaderIndices.push(flatData.length);
    flatData.push({
      type: "header",
      key: `header-${category}`,
      title: category,
    });

    filteredMarkets.forEach((market) => {
      flatData.push({
        type: "item",
        key: market.id,
        market,
      });
    });
  });

  return { flatData, stickyHeaderIndices };
};
