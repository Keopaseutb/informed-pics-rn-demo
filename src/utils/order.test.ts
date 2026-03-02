import { formatCurrencyFallback, sanitizeStake } from "./order";

describe("order utils", () => {
  it("sanitizeStake clamps to 2 decimals", () => {
    expect(sanitizeStake(" 10.999 ")).toBe("11.00");
  });

  it("formatCurrencyFallback formats to two decimals", () => {
    expect(formatCurrencyFallback(12.3)).toBe("$12.30");
  });
});
