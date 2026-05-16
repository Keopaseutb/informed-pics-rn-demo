import { isCanonicalIsoInstant } from "./isoInstant";

describe("isCanonicalIsoInstant", () => {
  it("accepts canonical UTC instants from toISOString()", () => {
    expect(isCanonicalIsoInstant("2026-05-15T12:00:00.000Z")).toBe(true);
  });

  it("rejects date-only strings that Date would parse", () => {
    expect(isCanonicalIsoInstant("2026-05-15")).toBe(false);
  });

  it("rejects garbage", () => {
    expect(isCanonicalIsoInstant("not-a-date")).toBe(false);
  });
});
