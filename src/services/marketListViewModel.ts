import { Market } from "../types/market";
import { selectMarketHeader } from "./selectors";

export type MarketListItem =
  | { type: "header"; key: string; title: string }
  | { type: "item"; key: string; market: Market };

export type MarketListState =
  | "loading"
  | "empty"
  | "error"
  | "noResults"
  | "ready";

type BuildMarketListViewModelArgs = {
  markets: Market[];
  categories: string[];
  grouped: Record<string, Market[]>;
  query: string;
  selectedCategory?: string | null;
};

export const normalizeMarketSearchQuery = (query: string): string =>
  query.trim().toLowerCase();

export const deriveMarketListState = ({
  loading,
  hasError,
  marketCount,
  flatDataCount,
}: {
  loading: boolean;
  hasError: boolean;
  marketCount: number;
  flatDataCount: number;
}): MarketListState => {
  if (loading) return "loading";
  if (hasError) return "error";
  if (marketCount === 0) return "empty";
  if (flatDataCount === 0) return "noResults";
  return "ready";
};

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
  markets,
  categories,
  grouped,
  query,
  selectedCategory,
}: BuildMarketListViewModelArgs) => {
  const normalizedQuery = normalizeMarketSearchQuery(query);
  const marketMeta = new Map<number, ReturnType<typeof selectMarketHeader>>();
  const flatData: MarketListItem[] = [];
  const stickyHeaderIndices: number[] = [];

  markets.forEach((market) => {
    marketMeta.set(market.propid, selectMarketHeader(market));
  });

  categories.forEach((category) => {
    if (selectedCategory && category !== selectedCategory) return;

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

  return { flatData, stickyHeaderIndices, marketMeta };
};
