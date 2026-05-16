import { getValidationResults, getMarkets } from "./marketRepository";
import { staticJsonMarketClient } from "./staticJsonMarketClient";

describe("staticJsonMarketClient", () => {
  it("list() resolves the same snapshot as getSnapshotSync()", async () => {
    const sync = staticJsonMarketClient.getSnapshotSync!();
    const rows = await staticJsonMarketClient.list();
    expect(rows).toBe(sync);
    expect(rows.length).toBeGreaterThan(0);
  });
});

describe("market data client boundary", () => {
  it("repository validation total matches client list length", async () => {
    const rows = await staticJsonMarketClient.list();
    expect(getValidationResults().total).toBe(rows.length);
  });

  it("getMarkets length matches valid rows after normalization", () => {
    expect(getMarkets().length).toBe(getValidationResults().valid);
  });
});
