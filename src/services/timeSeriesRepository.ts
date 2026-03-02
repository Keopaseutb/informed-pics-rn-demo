import rawSeries from "../data/timeseries.json";
import { ParsedTimePoint, Side, TimePoint } from "../types/timeseries";
import { validateTimeSeries } from "../utils/guards";

let cachedPoints: ParsedTimePoint[] | null = null;
let cachedByProp: Map<number, ParsedTimePoint[]> | null = null;
let cachedLatestByProp:
  | Map<number, { over?: ParsedTimePoint; under?: ParsedTimePoint }>
  | null = null;
let validationErrors: string[] = [];

const parsePoint = (point: TimePoint): ParsedTimePoint => {
  const epoch = new Date(point.recordedAt).getTime();
  return {
    ...point,
    epochMs: Number.isNaN(epoch) ? 0 : epoch,
  };
};

const buildDerivedCaches = (points: ParsedTimePoint[]) => {
  cachedByProp = new Map();
  cachedLatestByProp = new Map();
  points.forEach((point) => {
    if (!cachedByProp) return;
    const list = cachedByProp.get(point.propId) ?? [];
    list.push(point);
    cachedByProp.set(point.propId, list);
  });
  cachedByProp.forEach((list, propId) => {
    list.sort((a, b) => a.epochMs - b.epochMs);
    cachedByProp?.set(propId, list);
    const latest: { over?: ParsedTimePoint; under?: ParsedTimePoint } = {};
    list.forEach((point) => {
      if (point.side === "over") latest.over = point;
      if (point.side === "under") latest.under = point;
    });
    cachedLatestByProp?.set(propId, latest);
  });
};

const loadPoints = (): ParsedTimePoint[] => {
  if (cachedPoints && cachedByProp && cachedLatestByProp) return cachedPoints;
  if (cachedPoints && (!cachedByProp || !cachedLatestByProp)) {
    buildDerivedCaches(cachedPoints);
    return cachedPoints;
  }
  const { points, errors } = validateTimeSeries(rawSeries as unknown[]);
  validationErrors = errors;
  cachedPoints = points.map(parsePoint);
  buildDerivedCaches(cachedPoints);
  return cachedPoints;
};

export const getTimeSeriesForProp = (propId: number): ParsedTimePoint[] => {
  loadPoints();
  return cachedByProp?.get(propId) ?? [];
};

export const getAllTimeSeries = (): ParsedTimePoint[] => loadPoints();

export const getLatestPoint = (
  propId: number,
  side: Side
): ParsedTimePoint | undefined => {
  loadPoints();
  const latest = cachedLatestByProp?.get(propId);
  if (!latest) return undefined;
  return side === "over" ? latest.over : latest.under;
};

export const getValidationResults = () => {
  const total = (rawSeries as unknown[]).length;
  return {
    total,
    valid: loadPoints().length,
    errors: validationErrors,
  };
};
