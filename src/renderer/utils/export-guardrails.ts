import { AccountConnection, PlatformType } from "../../shared/types";
import { getPlatformMeta, PlatformDisplayMeta } from "./platform-meta";

export interface SelectableExportDestination {
  platform: PlatformType | string;
  meta: PlatformDisplayMeta;
  accounts: AccountConnection[];
  primaryAccount?: AccountConnection;
}

/**
 * Filter and resolve selectable export platforms based on actually connected accounts.
 * Guardrail: A platform is only selectable if at least one account for it has been added.
 */
export function getSelectableExportPlatforms(
  accounts: AccountConnection[] = []
): SelectableExportDestination[] {
  if (!accounts || accounts.length === 0) return [];

  // Group accounts by platform
  const platformMap = new Map<string, AccountConnection[]>();
  for (const acc of accounts) {
    if (!acc.platform) continue;
    const existing = platformMap.get(acc.platform) || [];
    existing.push(acc);
    platformMap.set(acc.platform, existing);
  }

  const result: SelectableExportDestination[] = [];
  for (const [platform, accs] of platformMap.entries()) {
    result.push({
      platform,
      meta: getPlatformMeta(platform),
      accounts: accs,
      primaryAccount: accs[0],
    });
  }

  return result;
}

/**
 * Resolve effective target platform and account id with guardrail safety.
 * If current target platform has no connected account, fallback to first available account platform.
 */
export function resolveTargetExportSelection(
  accounts: AccountConnection[] = [],
  preferredPlatform?: string,
  preferredAccountId?: string,
  sourcePlatform?: string
): { targetPlatform: string; targetAccountId?: string } {
  if (!accounts || accounts.length === 0) {
    return { targetPlatform: preferredPlatform || "file", targetAccountId: undefined };
  }

  const selectable = getSelectableExportPlatforms(accounts);
  if (selectable.length === 0) {
    return { targetPlatform: preferredPlatform || "file", targetAccountId: undefined };
  }

  // 1. If preferredAccountId is valid and exists in accounts
  if (preferredAccountId) {
    const acc = accounts.find((a) => a.id === preferredAccountId);
    if (acc) {
      return { targetPlatform: acc.platform, targetAccountId: acc.id };
    }
  }

  // 2. If preferredPlatform has connected accounts
  if (preferredPlatform) {
    const matchingDest = selectable.find((d) => d.platform === preferredPlatform);
    if (matchingDest && matchingDest.accounts.length > 0) {
      return {
        targetPlatform: preferredPlatform,
        targetAccountId: matchingDest.primaryAccount?.id,
      };
    }
  }

  // 3. Fallback: pick first platform that differs from sourcePlatform (if possible)
  const diffFromSource = selectable.find((d) => d.platform !== sourcePlatform);
  const chosen = diffFromSource || selectable[0];

  return {
    targetPlatform: chosen.platform,
    targetAccountId: chosen.primaryAccount?.id,
  };
}
