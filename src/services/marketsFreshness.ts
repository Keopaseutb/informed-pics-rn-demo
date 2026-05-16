import { isCanonicalIsoInstant } from "../utils/isoInstant";

/**
 * Markets list freshness copy. Does not cover network load failures or cached-data error banners;
 * those belong to a future async market-data path.
 */

/** In-session flag resets on cold start; until the user refreshes, data is treated as cached. */
export const deriveIsMarketsStale = (
  hasRefreshedThisSession: boolean
): boolean => !hasRefreshedThisSession;

const MS_MIN = 60_000;
const MS_HOUR = 60 * MS_MIN;
const MS_DAY = 24 * MS_HOUR;

export type FormatMarketsLastUpdatedLabelArgs = {
  lastUpdatedAtIso: string | null;
  nowMs: number;
};

/**
 * Human-readable freshness line for the markets list header (deterministic when `nowMs` is fixed).
 *
 * The label only updates when the component rerenders (e.g. refresh, navigation); it does not tick by the clock.
 */
export const formatMarketsLastUpdatedLabel = ({
  lastUpdatedAtIso,
  nowMs,
}: FormatMarketsLastUpdatedLabelArgs): string => {
  if (!lastUpdatedAtIso) {
    return "Pull to refresh to confirm latest data";
  }
  if (!isCanonicalIsoInstant(lastUpdatedAtIso)) {
    return "Pull to refresh to confirm latest data";
  }
  const thenMs = new Date(lastUpdatedAtIso).getTime();
  const diff = Math.max(0, nowMs - thenMs);
  if (diff < MS_MIN) return "Last updated just now";
  if (diff < MS_HOUR) {
    const m = Math.floor(diff / MS_MIN);
    return `Last updated ${m}m ago`;
  }
  if (diff < MS_DAY) {
    const h = Math.floor(diff / MS_HOUR);
    return `Last updated ${h}h ago`;
  }
  const d = Math.floor(diff / MS_DAY);
  return `Last updated ${d}d ago`;
};
