import { Employee, RiskIndicators, UserSummary, toRiskLevel } from "@/types"

/**
 * Maps a raw UserSummary (from the API / useUsers hook) to the
 * fully-typed Employee shape expected by engine page components.
 *
 * This is a pure function -- no hooks, no side-effects.
 */
export function mapUserToEmployee(u: UserSummary): Employee {
  return {
    user_hash: u.user_hash,
    name: u.name || `User ${u.user_hash.slice(0, 4)}`,
    role: u.role || "Engineer",
    risk_level: toRiskLevel(u.risk_level),
    velocity: u.velocity || 0,
    confidence: u.confidence || 0,
    belongingness_score: u.belongingness_score ?? 0.5,
    circadian_entropy: u.circadian_entropy ?? 0.5,
    attrition_probability: u.attrition_probability ?? 0,
    sentiment_score: u.sentiment_score ?? null,
    sentiment_available: u.sentiment_available ?? false,
    updated_at: u.updated_at || new Date().toISOString(),
    persona: "Engineer",
    indicators: {
      chaotic_hours: u.chaotic_hours ?? false,
      social_withdrawal: u.social_withdrawal ?? false,
      sustained_intensity: u.sustained_intensity ?? false,
      has_explained_context: u.has_explained_context ?? false,
    },
  }
}

/**
 * Convenience helper: maps an entire array of UserSummary objects
 * to Employee[].  Drop this straight into a useMemo body.
 */
export function mapUsersToEmployees(users: readonly UserSummary[]): Employee[] {
  return users.map(mapUserToEmployee)
}
