import { describe, it, expect } from "vitest";
import {
  generateYouTubeMobileSyncScript,
  generateAppleMobileSyncScript,
  generateDirectLoginScript,
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

  it("generates valid direct login script for YouTube and Apple without syntax errors", () => {
    const origin = "http://localhost:3080";
    const ytLogin = generateDirectLoginScript(origin, "youtube", "Akun Utama YT", "token_123");
    expect(ytLogin).toContain("document.cookie");
    expect(ytLogin).toContain(`${origin}/api/auth/web-catch`);
    expect(ytLogin).toContain("token_123");
    expect(() => new Function(ytLogin)).not.toThrow();

    const appleLogin = generateDirectLoginScript(origin, "apple", "Akun Utama Apple", "token_123");
    expect(appleLogin).toContain("media-user-token");
    expect(appleLogin).toContain(`${origin}/api/auth/web-catch`);
    expect(appleLogin).toContain("token_123");
    expect(() => new Function(appleLogin)).not.toThrow();
  });
});
