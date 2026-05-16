import {
  deriveIsMarketsStale,
  formatMarketsLastUpdatedLabel,
} from "./marketsFreshness";

describe("marketsFreshness", () => {
  describe("deriveIsMarketsStale", () => {
    it("is stale until the user completes a refresh this session", () => {
      expect(deriveIsMarketsStale(false)).toBe(true);
      expect(deriveIsMarketsStale(true)).toBe(false);
    });
  });

  describe("formatMarketsLastUpdatedLabel", () => {
    const base = Date.parse("2026-05-15T12:00:00.000Z");

    it("prompts refresh when no timestamp is known", () => {
      expect(
        formatMarketsLastUpdatedLabel({ lastUpdatedAtIso: null, nowMs: base })
      ).toBe("Pull to refresh to confirm latest data");
    });

    it("returns just now for sub-minute age", () => {
      expect(
        formatMarketsLastUpdatedLabel({
          lastUpdatedAtIso: "2026-05-15T11:59:30.000Z",
          nowMs: base,
        })
      ).toBe("Last updated just now");
    });

    it("formats minutes", () => {
      expect(
        formatMarketsLastUpdatedLabel({
          lastUpdatedAtIso: "2026-05-15T11:55:00.000Z",
          nowMs: base,
        })
      ).toBe("Last updated 5m ago");
    });

    it("formats hours", () => {
      expect(
        formatMarketsLastUpdatedLabel({
          lastUpdatedAtIso: "2026-05-15T06:00:00.000Z",
          nowMs: base,
        })
      ).toBe("Last updated 6h ago");
    });

    it("formats days", () => {
      expect(
        formatMarketsLastUpdatedLabel({
          lastUpdatedAtIso: "2026-05-12T12:00:00.000Z",
          nowMs: base,
        })
      ).toBe("Last updated 3d ago");
    });

    it("treats invalid ISO like unknown", () => {
      expect(
        formatMarketsLastUpdatedLabel({
          lastUpdatedAtIso: "not-a-date",
          nowMs: base,
        })
      ).toBe("Pull to refresh to confirm latest data");
    });

    it("treats parseable but non-canonical timestamps like unknown", () => {
      expect(
        formatMarketsLastUpdatedLabel({
          lastUpdatedAtIso: "2026-05-15",
          nowMs: base,
        })
      ).toBe("Pull to refresh to confirm latest data");
    });

    it("clamps future timestamps to just now", () => {
      expect(
        formatMarketsLastUpdatedLabel({
          lastUpdatedAtIso: "2026-05-15T12:30:00.000Z",
          nowMs: base,
        })
      ).toBe("Last updated just now");
    });
  });
});
