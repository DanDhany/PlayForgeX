import { PlatformType } from "../shared/types.js";

/**
 * Anti-Ban & Stealth Throttling Utilities
 * Protects user accounts from automated bot detection, IP rate-limits, and session invalidation.
 */

export function humanDelay(minMs = 500, maxMs = 1200): Promise<void> {
  const duration = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
  return new Promise((resolve) => setTimeout(resolve, duration));
}

// Global Circuit Breaker to enforce cooldowns across concurrent requests
class ServiceCircuitBreaker {
  private cooldowns = new Map<string, number>();

  public isCoolingDown(service: PlatformType | string): boolean {
    const until = this.cooldowns.get(service);
    if (!until) return false;
    if (Date.now() < until) return true;
    this.cooldowns.delete(service);
    return false;
  }

  public getRemainingCooldownMs(service: PlatformType | string): number {
    const until = this.cooldowns.get(service);
    if (!until) return 0;
    return Math.max(0, until - Date.now());
  }

  public triggerCooldown(service: PlatformType | string, durationMs = 20000): void {
    const until = Date.now() + durationMs;
    this.cooldowns.set(service, until);
    console.warn(
      `[Anti-Ban Guard] 429 detected on ${service}. Activating ${Math.round(durationMs / 1000)}s stealth cooldown to protect session.`
    );
  }

  public async waitIfCoolingDown(service: PlatformType | string): Promise<void> {
    const remaining = this.getRemainingCooldownMs(service);
    if (remaining > 0) {
      console.log(`[Anti-Ban Guard] Pausing request for ${service} during active cooldown (${Math.round(remaining / 1000)}s remaining)...`);
      await new Promise((r) => setTimeout(r, remaining));
    }
  }
}

export const circuitBreaker = new ServiceCircuitBreaker();

export const CHROME_USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36";

export function getBrowserStealthHeaders(origin: string): Record<string, string> {
  return {
    "User-Agent": CHROME_USER_AGENT,
    "sec-ch-ua": '"Not(A:Brand";v="99", "Google Chrome";v="133", "Chromium";v="133"',
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": '"macOS"',
    "sec-fetch-dest": "empty",
    "sec-fetch-mode": "cors",
    "sec-fetch-site": origin.includes("apple.com") ? "same-site" : "same-origin",
    Accept: "*/*",
    "Accept-Language": "en-US,en;q=0.9,id;q=0.8,ja;q=0.7",
  };
}
