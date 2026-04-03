import type { Employee } from "@/types"

export function formatDate(): string {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).toUpperCase()
}

/** Deterministic sparkline points from user_hash + velocity. */
export function sparkPoints(emp: Employee): string {
  const base = Math.min(emp.velocity || 0, 5) / 5
  const seed = emp.user_hash
    .split("")
    .reduce((acc, c) => acc + c.charCodeAt(0), 0)
  const pts: number[] = []
  for (let i = 0; i < 7; i++) {
    const jitter = (((seed * (i + 1) * 2654435761) >>> 0) % 1000) / 1000 * 0.3 - 0.15
    pts.push(Math.max(0.05, Math.min(1, base + jitter)))
  }
  const w = 48
  const h = 16
  return pts.map((v, i) => `${(i / 6) * w},${h - v * h}`).join(" ")
}

/**
 * Generate a 30-day wellbeing trend derived from real employee data.
 *
 * Each employee contributes a "health score" between 0 and 100 based on their
 * actual velocity and risk_level. We then produce 30 data points where the
 * final point matches today's real average and earlier points show a realistic
 * progression seeded deterministically from the employee data, so the same set
 * of employees always produces the same chart shape.
 *
 * This is NOT historical data from the API — it is a forward-projection
 * approximation derived from current real measurements. The "Wellbeing Trend"
 * chart title reflects this with a "(Derived)" label in the UI.
 */
export function buildTrendData(employees: readonly Employee[]): Array<{ day: number; score: number }> {
  if (employees.length === 0) return []

  // Compute per-employee health score: velocity maps 0→5 to 0→100, penalise risk levels
  const scoreMap: Record<string, number> = { CRITICAL: -25, ELEVATED: -12, LOW: 0 }
  const rawScores = employees.map(e => {
    const velScore = Math.min(e.velocity || 0, 5) / 5 * 100
    const riskPenalty = scoreMap[e.risk_level] ?? 0
    return Math.max(0, Math.min(100, velScore + riskPenalty))
  })

  // Today's real average across all employees
  const todayScore = rawScores.reduce((a, b) => a + b, 0) / rawScores.length

  // Deterministic per-employee hash seed for variance (same employees → same chart)
  const hashSeed = employees.reduce((acc, e) => {
    return acc + e.user_hash.split("").reduce((a, c) => a + c.charCodeAt(0), 0)
  }, 0)

  return Array.from({ length: 30 }, (_, i) => {
    // Interpolate: earlier days trend slightly away from today using a mild slope
    // derived from the ratio of critical/elevated employees (more at-risk → declining trend)
    const critRatio = employees.filter(e => e.risk_level === "CRITICAL").length / employees.length
    const elevRatio = employees.filter(e => e.risk_level === "ELEVATED").length / employees.length
    const trendSlope = (critRatio * 8 + elevRatio * 3) // points below today at day-1
    const daysFromToday = 29 - i
    const trendBase = todayScore + (daysFromToday / 29) * trendSlope

    // Deterministic per-day variance derived from the employee hash seed
    const noise = (((hashSeed * (i + 1) * 2654435761) >>> 0) % 1000) / 1000 * 6 - 3
    return { day: i + 1, score: Math.round(Math.max(10, Math.min(100, trendBase + noise))) }
  })
}
