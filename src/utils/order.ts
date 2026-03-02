export const sanitizeStakeInput = (value: string) => {
  const trimmed = value.trim();
  let sanitized = trimmed.replace(/[^0-9.]/g, "");
  const parts = sanitized.split(".");
  if (parts.length > 2) {
    sanitized = `${parts[0]}.${parts.slice(1).join("")}`;
  }
  return sanitized;
};

export const sanitizeStake = (value: string) => {
  const sanitized = sanitizeStakeInput(value);
  if (!sanitized.length) return "";
  const numeric = Number(sanitized);
  if (!Number.isFinite(numeric)) return "";
  return numeric.toFixed(2);
};

export const formatCurrencyFallback = (value: number) => {
  return `$${value.toFixed(2)}`;
};

export const formatCurrency = (value: number) => {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value);
  } catch {
    return formatCurrencyFallback(value);
  }
};
