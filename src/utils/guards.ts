import { Market, ValidationResult } from "../types/market";
import { Side, TimePoint } from "../types/timeseries";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const isNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

const isString = (value: unknown): value is string =>
  typeof value === "string";

const isSide = (value: unknown): value is Side =>
  value === "over" || value === "under";

export const isMarket = (value: unknown): value is Market => {
  if (!isRecord(value)) return false;
  return (
    isString(value.id) &&
    isNumber(value.line) &&
    (value.unit === null || isString(value.unit)) &&
    isString(value.sport) &&
    isNumber(value.gameid) &&
    isNumber(value.propid) &&
    isString(value.category) &&
    isString(value.question) &&
    isString(value.startsat) &&
    isString(value.eventlabel) &&
    isString(value.playername) &&
    isNumber(value.nodecimalodds) &&
    isNumber(value.noamericanodds) &&
    isNumber(value.yesdecimalodds) &&
    isNumber(value.yesamericanodds)
  );
};

const isTimePoint = (value: unknown): value is TimePoint => {
  if (!isRecord(value)) return false;
  return (
    isNumber(value.rn) &&
    isNumber(value.line) &&
    isSide(value.side) &&
    (value.unit === null || isString(value.unit)) &&
    isNumber(value.propId) &&
    isString(value.recordedAt) &&
    isNumber(value.oddsDecimal) &&
    isNumber(value.oddsAmerican)
  );
};

const pushError = (
  errors: string[],
  index: number,
  message: string
) => {
  errors.push(`Row ${index}: ${message}`);
};

export const validateMarkets = (
  data: unknown[]
): { markets: Market[]; errors: string[]; result: ValidationResult } => {
  const errors: string[] = [];
  const markets: Market[] = [];
  data.forEach((row, index) => {
    if (isMarket(row)) {
      markets.push(row);
    } else {
      pushError(errors, index, "Invalid market shape");
    }
  });
  const result: ValidationResult = {
    valid: errors.length === 0,
    errors,
  };
  return { markets, errors, result };
};

export const validateTimeSeries = (
  data: unknown[]
): { points: TimePoint[]; errors: string[]; result: ValidationResult } => {
  const errors: string[] = [];
  const points: TimePoint[] = [];
  data.forEach((row, index) => {
    if (isTimePoint(row)) {
      points.push(row);
    } else {
      pushError(errors, index, "Invalid time series shape");
    }
  });
  const result: ValidationResult = {
    valid: errors.length === 0,
    errors,
  };
  return { points, errors, result };
};
