import rawMarkets from "../data/markets.json";
import { Market } from "../types/market";
import { validateMarkets } from "../utils/guards";

export type MarketListData = {
  markets: Market[];
  categories: string[];
  grouped: Record<string, Market[]>;
};

let cachedMarkets: Market[] | null = null;
let cachedCategories: string[] | null = null;
let cachedGrouped: Record<string, Market[]> | null = null;
let cachedListData: MarketListData | null = null;
let validationErrors: string[] = [];

const loadMarkets = (): Market[] => {
  if (cachedMarkets) return cachedMarkets;
  const { markets, errors } = validateMarkets(rawMarkets as unknown[]);
  cachedMarkets = markets;
  validationErrors = errors;
  return cachedMarkets;
};

export const getMarkets = (): Market[] => loadMarkets();

export const getMarketById = (propId: number): Market | undefined =>
  loadMarkets().find((market) => market.propid === propId);

export const getMarketsByCategory = (category: string): Market[] =>
  loadMarkets().filter((market) => market.category === category);

export const getCategories = (): string[] => {
  if (cachedCategories) return cachedCategories;
  const categories = new Set(loadMarkets().map((market) => market.category));
  cachedCategories = Array.from(categories).sort();
  return cachedCategories;
};

export const getGroupedByCategory = (): Record<string, Market[]> => {
  if (cachedGrouped) return cachedGrouped;
  const grouped: Record<string, Market[]> = {};
  loadMarkets().forEach((market) => {
    if (!grouped[market.category]) grouped[market.category] = [];
    grouped[market.category].push(market);
  });
  cachedGrouped = grouped;
  return cachedGrouped;
};

export const getMarketListData = (): MarketListData => {
  if (cachedListData) return cachedListData;
  cachedListData = {
    markets: getMarkets(),
    categories: getCategories(),
    grouped: getGroupedByCategory(),
  };
  return cachedListData;
};

export const getValidationResults = () => {
  const total = (rawMarkets as unknown[]).length;
  return {
    total,
    valid: loadMarkets().length,
    errors: validationErrors,
  };
};
