import { Market } from "../types/market";
import { ParsedTimePoint } from "../types/timeseries";
import { decimalToImpliedProb, normalizeYesNo } from "../utils/odds";

export const selectMarketHeader = (market: Market) => {
  const yesProbRaw = decimalToImpliedProb(market.yesdecimalodds);
  const noProbRaw = decimalToImpliedProb(market.nodecimalodds);
  const normalized = normalizeYesNo(yesProbRaw, noProbRaw);

  return {
    yesProbRaw,
    noProbRaw,
    yesProbNorm: normalized.yes,
    noProbNorm: normalized.no,
    displayTitle: market.question,
    playerName: market.playername,
    line: market.line,
    unit: market.unit,
  };
};

export const selectSeriesBySide = (points: ParsedTimePoint[]) => {
  const overPoints = points.filter((point) => point.side === "over");
  const underPoints = points.filter((point) => point.side === "under");
  return { overPoints, underPoints };
};
