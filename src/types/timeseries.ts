export type Side = "over" | "under";

export type TimePoint = {
  rn: number;
  line: number;
  side: Side;
  unit: string | null;
  propId: number;
  recordedAt: string;
  oddsDecimal: number;
  oddsAmerican: number;
};

export type ParsedTimePoint = TimePoint & {
  epochMs: number;
};
