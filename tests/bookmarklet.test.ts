import { describe, it, expect } from "vitest";
import {
  generateYouTubeMobileSyncScript,
  generateAppleMobileSyncScript,
} from "../src/renderer/utils/bookmarklet-generator.js";

describe("Mobile Sync Bookmarklet Generator", () => {
  it("generates valid syntax for YouTube Music mobile sync script", () => {
    const origin = "http://192.168.1.50:3080";
    const alias = "YouTube (HP Orang B)";
    const script = generateYouTubeMobileSyncScript(origin, alias);

    expect(script).toContain("SAPISID");
    expect(script).toContain("playforgex-mobile-sync");
    expect(script).toContain(`${origin}/api/auth/web-catch`);
    expect(script).toContain("YouTube (HP Orang B)");

    // Ensure valid JS syntax by parsing with Function constructor
    expect(() => new Function(script)).not.toThrow();
  });

  it("generates valid syntax for Apple Music sync script", () => {
    const origin = "http://192.168.1.50:3080";
    const alias = "Apple Music (Car)";
    const script = generateAppleMobileSyncScript(origin, alias);

    expect(script).toContain("media-user-token");
    expect(script).toContain(`${origin}/api/auth/web-catch`);
    expect(script).toContain("Apple Music (Car)");

    // Ensure valid JS syntax
    expect(() => new Function(script)).not.toThrow();
  });
});
