import { describe, it, expect } from "vitest";
import {
  humanDelay,
  circuitBreaker,
  getBrowserStealthHeaders,
  CHROME_USER_AGENT,
} from "../src/core/stealth";

describe("Stealth & Anti-Ban Utilities", () => {
  it("provides complete modern Chrome stealth headers", () => {
    const headers = getBrowserStealthHeaders("https://music.youtube.com");
    expect(headers["User-Agent"]).toBe(CHROME_USER_AGENT);
    expect(headers["sec-ch-ua"]).toBeDefined();
    expect(headers["sec-ch-ua-platform"]).toBe('"macOS"');
    expect(headers["sec-fetch-dest"]).toBe("empty");
    expect(headers["sec-fetch-mode"]).toBe("cors");
  });

  it("humanDelay produces duration within specified bounds", async () => {
    const start = Date.now();
    await humanDelay(30, 80);
    const elapsed = Date.now() - start;
    expect(elapsed).toBeGreaterThanOrEqual(25);
    expect(elapsed).toBeLessThanOrEqual(200);
  });

  it("circuitBreaker triggers and reports cooldown accurately", () => {
    expect(circuitBreaker.isCoolingDown("youtube")).toBe(false);

    circuitBreaker.triggerCooldown("youtube", 500);
    expect(circuitBreaker.isCoolingDown("youtube")).toBe(true);
    expect(circuitBreaker.getRemainingCooldownMs("youtube")).toBeGreaterThan(0);
  });
});
