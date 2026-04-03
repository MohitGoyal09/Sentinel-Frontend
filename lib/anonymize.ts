/**
 * Get a deterministic Dev-XX code from a user hash.
 * Uses the last 2 characters of the hash, uppercased.
 */
export function getDevCode(userHash: string): string {
  if (!userHash || userHash.length < 2) return "Dev-00";
  return `Dev-${userHash.slice(-2).toUpperCase()}`;
}

/**
 * Get display name based on anonymization setting.
 * Returns Dev-XX code when anonymized, real name otherwise.
 */
export function getDisplayName(
  userHash: string,
  realName: string,
  isAnonymized: boolean
): string {
  if (isAnonymized) return getDevCode(userHash);
  return realName || getDevCode(userHash);
}
