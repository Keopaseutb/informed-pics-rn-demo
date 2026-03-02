export const decimalToImpliedProb = (decimal: number): number => {
  if (!Number.isFinite(decimal) || decimal <= 0) {
    return 0;
  }
  return 1 / decimal;
};

export const americanToImpliedProb = (american: number): number => {
  if (!Number.isFinite(american) || american === 0) {
    return 0;
  }
  if (american > 0) {
    return 100 / (american + 100);
  }
  const abs = Math.abs(american);
  return abs / (abs + 100);
};

export const normalizeYesNo = (
  yesProb: number,
  noProb: number
): { yes: number; no: number } => {
  const sum = yesProb + noProb;
  if (!Number.isFinite(sum) || sum <= 0) {
    return { yes: 0.5, no: 0.5 };
  }
  return {
    yes: yesProb / sum,
    no: noProb / sum,
  };
};

export const formatPct = (n: number, decimals = 1): string => {
  const pct = Number.isFinite(n) ? n * 100 : 0;
  return `${pct.toFixed(decimals)}%`;
};

export const formatAmericanOdds = (n: number): string => {
  if (!Number.isFinite(n)) {
    return "+0";
  }
  return n > 0 ? `+${Math.round(n)}` : `${Math.round(n)}`;
};
