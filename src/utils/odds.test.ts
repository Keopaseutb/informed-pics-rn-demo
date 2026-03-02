import {
  americanToImpliedProb,
  formatAmericanOdds,
  normalizeYesNo,
} from "./odds";

describe("odds utilities", () => {
  it("americanToImpliedProb handles +110", () => {
    const prob = americanToImpliedProb(110);
    expect(prob).toBeCloseTo(100 / 210, 6);
  });

  it("americanToImpliedProb handles -110", () => {
    const prob = americanToImpliedProb(-110);
    expect(prob).toBeCloseTo(110 / 210, 6);
  });

  it("normalizeYesNo sums to ~1.0", () => {
    const norm = normalizeYesNo(0.55, 0.6);
    expect(norm.yes + norm.no).toBeCloseTo(1, 6);
  });

  it("formatAmericanOdds always has + for positive", () => {
    expect(formatAmericanOdds(120)).toBe("+120");
    expect(formatAmericanOdds(-120)).toBe("-120");
  });
});
