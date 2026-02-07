// Sentinel Mock Data for Dashboard

export type RiskLevel = "LOW" | "ELEVATED" | "CRITICAL" | "CALIBRATING"

export interface Employee {
  user_hash: string
  risk_level: RiskLevel
  velocity: number
  confidence: number
  belongingness_score: number
  circadian_entropy: number
  updated_at: string
  persona: string
  indicators: {
    overwork: boolean
    isolation: boolean
    fragmentation: boolean
    late_night_pattern: boolean
    weekend_work: boolean
    communication_decline: boolean
  }
}

export interface HistoryPoint {
  timestamp: string
  date: string
  risk_level: RiskLevel
  velocity: number
  confidence: number
  belongingness_score: number
}

export interface NetworkNode {
  id: string
  label: string
  risk_level: RiskLevel
  betweenness: number
  eigenvector: number
  unblocking_count: number
  is_hidden_gem: boolean
  x: number
  y: number
}

export interface NetworkEdge {
  source: string
  target: string
  weight: number
  edge_type: "collaboration" | "mentorship" | "blocking"
}

export interface NudgeData {
  user_hash: string
  nudge_type: string
  message: string
  risk_level: RiskLevel
  actions: { label: string; action: string }[]
}

export interface TeamMetrics {
  total_members: number
  healthy_count: number
  elevated_count: number
  critical_count: number
  calibrating_count: number
  avg_velocity: number
  graph_fragmentation: number
  comm_decay_rate: number
  contagion_risk: RiskLevel
}

export interface ActivityEvent {
  id: string
  timestamp: string
  event_type: string
  description: string
  risk_impact: "positive" | "negative" | "neutral"
}

// Employees
export const employees: Employee[] = [
  {
    user_hash: "8f3a2d9e",
    risk_level: "CRITICAL",
    velocity: 2.8,
    confidence: 0.94,
    belongingness_score: 0.25,
    circadian_entropy: 1.72,
    updated_at: "2026-02-07T08:30:00Z",
    persona: "Alex (Burnout Pattern)",
    indicators: {
      overwork: true,
      isolation: true,
      fragmentation: false,
      late_night_pattern: true,
      weekend_work: true,
      communication_decline: true,
    },
  },
  {
    user_hash: "b4c7e1f2",
    risk_level: "LOW",
    velocity: 0.3,
    confidence: 0.91,
    belongingness_score: 0.85,
    circadian_entropy: 0.42,
    updated_at: "2026-02-07T09:15:00Z",
    persona: "Sarah (Hidden Gem)",
    indicators: {
      overwork: false,
      isolation: false,
      fragmentation: false,
      late_night_pattern: false,
      weekend_work: false,
      communication_decline: false,
    },
  },
  {
    user_hash: "d6a9f3b1",
    risk_level: "LOW",
    velocity: 0.1,
    confidence: 0.88,
    belongingness_score: 0.72,
    circadian_entropy: 0.38,
    updated_at: "2026-02-07T09:00:00Z",
    persona: "Jordan (Steady)",
    indicators: {
      overwork: false,
      isolation: false,
      fragmentation: false,
      late_night_pattern: false,
      weekend_work: false,
      communication_decline: false,
    },
  },
  {
    user_hash: "e2f8c4d7",
    risk_level: "ELEVATED",
    velocity: 1.8,
    confidence: 0.87,
    belongingness_score: 0.45,
    circadian_entropy: 1.1,
    updated_at: "2026-02-07T07:45:00Z",
    persona: "Maria (Contagion Risk)",
    indicators: {
      overwork: true,
      isolation: false,
      fragmentation: true,
      late_night_pattern: true,
      weekend_work: false,
      communication_decline: true,
    },
  },
  {
    user_hash: "a1c3e5g7",
    risk_level: "LOW",
    velocity: 0.4,
    confidence: 0.82,
    belongingness_score: 0.68,
    circadian_entropy: 0.55,
    updated_at: "2026-02-07T08:00:00Z",
    persona: "Taylor (Stable)",
    indicators: {
      overwork: false,
      isolation: false,
      fragmentation: false,
      late_night_pattern: false,
      weekend_work: false,
      communication_decline: false,
    },
  },
  {
    user_hash: "f9b2d4e6",
    risk_level: "ELEVATED",
    velocity: 1.5,
    confidence: 0.79,
    belongingness_score: 0.52,
    circadian_entropy: 0.95,
    updated_at: "2026-02-07T06:30:00Z",
    persona: "Casey (Drift Pattern)",
    indicators: {
      overwork: false,
      isolation: true,
      fragmentation: false,
      late_night_pattern: true,
      weekend_work: false,
      communication_decline: false,
    },
  },
]

// History for Alex (critical user)
export function generateHistory(employee: Employee): HistoryPoint[] {
  const points: HistoryPoint[] = []
  const now = new Date("2026-02-07")

  for (let i = 30; i >= 0; i--) {
    const date = new Date(now)
    date.setDate(date.getDate() - i)

    let velocity: number
    let belongingness: number
    let risk_level: RiskLevel

    if (employee.risk_level === "CRITICAL") {
      // Alex burnout trajectory
      if (i > 20) {
        velocity = 0.2 + Math.random() * 0.3
        belongingness = 0.75 + Math.random() * 0.1
        risk_level = "LOW"
      } else if (i > 10) {
        velocity = 0.8 + (20 - i) * 0.1 + Math.random() * 0.2
        belongingness = 0.6 - (20 - i) * 0.02 + Math.random() * 0.05
        risk_level = "ELEVATED"
      } else {
        velocity = 2.0 + (10 - i) * 0.08 + Math.random() * 0.3
        belongingness = 0.35 - (10 - i) * 0.01 + Math.random() * 0.03
        risk_level = i < 5 ? "CRITICAL" : "ELEVATED"
      }
    } else if (employee.risk_level === "ELEVATED") {
      velocity = 0.8 + Math.sin(i / 5) * 0.5 + Math.random() * 0.3
      belongingness = 0.5 + Math.cos(i / 7) * 0.1 + Math.random() * 0.05
      risk_level = velocity > 1.5 ? "ELEVATED" : "LOW"
    } else {
      velocity = 0.1 + Math.random() * 0.3
      belongingness = 0.65 + Math.random() * 0.15
      risk_level = "LOW"
    }

    points.push({
      timestamp: date.toISOString(),
      date: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      risk_level,
      velocity: Math.round(velocity * 100) / 100,
      confidence: 0.7 + Math.random() * 0.25,
      belongingness_score: Math.round(belongingness * 100) / 100,
    })
  }

  return points
}

// Nudge for critical user
export const nudges: Record<string, NudgeData> = {
  "8f3a2d9e": {
    user_hash: "8f3a2d9e",
    nudge_type: "urgent_wellbeing",
    message:
      "Your focus sessions have been extending significantly this week. Consider protecting tomorrow morning for recovery and deep work.",
    risk_level: "CRITICAL",
    actions: [
      { label: "Schedule Break", action: "suggest_break" },
      { label: "Block Focus Time", action: "block_calendar" },
    ],
  },
  "e2f8c4d7": {
    user_hash: "e2f8c4d7",
    nudge_type: "gentle_reminder",
    message:
      "Your team communication patterns suggest high intensity this sprint. Consider suggesting an async retro.",
    risk_level: "ELEVATED",
    actions: [
      { label: "Suggest Retro", action: "schedule_retro" },
      { label: "Snooze", action: "snooze" },
    ],
  },
}

// Team metrics
export const teamMetrics: TeamMetrics = {
  total_members: 6,
  healthy_count: 3,
  elevated_count: 2,
  critical_count: 1,
  calibrating_count: 0,
  avg_velocity: 1.15,
  graph_fragmentation: 0.42,
  comm_decay_rate: 0.18,
  contagion_risk: "ELEVATED",
}

// Network nodes
export const networkNodes: NetworkNode[] = [
  { id: "8f3a2d9e", label: "User_8f3a", risk_level: "CRITICAL", betweenness: 0.15, eigenvector: 0.3, unblocking_count: 2, is_hidden_gem: false, x: 350, y: 200 },
  { id: "b4c7e1f2", label: "User_b4c7", risk_level: "LOW", betweenness: 0.82, eigenvector: 0.18, unblocking_count: 12, is_hidden_gem: true, x: 200, y: 150 },
  { id: "d6a9f3b1", label: "User_d6a9", risk_level: "LOW", betweenness: 0.25, eigenvector: 0.42, unblocking_count: 5, is_hidden_gem: false, x: 300, y: 350 },
  { id: "e2f8c4d7", label: "User_e2f8", risk_level: "ELEVATED", betweenness: 0.35, eigenvector: 0.55, unblocking_count: 7, is_hidden_gem: false, x: 480, y: 300 },
  { id: "a1c3e5g7", label: "User_a1c3", risk_level: "LOW", betweenness: 0.12, eigenvector: 0.28, unblocking_count: 3, is_hidden_gem: false, x: 150, y: 320 },
  { id: "f9b2d4e6", label: "User_f9b2", risk_level: "ELEVATED", betweenness: 0.2, eigenvector: 0.35, unblocking_count: 4, is_hidden_gem: false, x: 450, y: 120 },
]

export const networkEdges: NetworkEdge[] = [
  { source: "b4c7e1f2", target: "8f3a2d9e", weight: 0.7, edge_type: "collaboration" },
  { source: "b4c7e1f2", target: "d6a9f3b1", weight: 0.9, edge_type: "mentorship" },
  { source: "b4c7e1f2", target: "a1c3e5g7", weight: 0.8, edge_type: "mentorship" },
  { source: "b4c7e1f2", target: "e2f8c4d7", weight: 0.6, edge_type: "collaboration" },
  { source: "8f3a2d9e", target: "e2f8c4d7", weight: 0.4, edge_type: "collaboration" },
  { source: "d6a9f3b1", target: "a1c3e5g7", weight: 0.5, edge_type: "collaboration" },
  { source: "e2f8c4d7", target: "f9b2d4e6", weight: 0.65, edge_type: "collaboration" },
  { source: "f9b2d4e6", target: "8f3a2d9e", weight: 0.3, edge_type: "blocking" },
  { source: "b4c7e1f2", target: "f9b2d4e6", weight: 0.55, edge_type: "collaboration" },
]

// Activity events
export const activityEvents: ActivityEvent[] = [
  { id: "1", timestamp: "2026-02-07T02:14:00Z", event_type: "commit", description: "Late-night commit detected (2:14 AM)", risk_impact: "negative" },
  { id: "2", timestamp: "2026-02-06T23:45:00Z", event_type: "commit", description: "After-hours PR submitted", risk_impact: "negative" },
  { id: "3", timestamp: "2026-02-06T14:30:00Z", event_type: "pr_review", description: "Code review completed for team", risk_impact: "positive" },
  { id: "4", timestamp: "2026-02-06T11:00:00Z", event_type: "slack_message", description: "DM response rate dropped below 30%", risk_impact: "negative" },
  { id: "5", timestamp: "2026-02-05T22:30:00Z", event_type: "commit", description: "Weekend work session detected", risk_impact: "negative" },
  { id: "6", timestamp: "2026-02-05T10:15:00Z", event_type: "slack_message", description: "Team standup participation", risk_impact: "positive" },
  { id: "7", timestamp: "2026-02-04T16:00:00Z", event_type: "unblocked", description: "Unblocked 2 team members via PR review", risk_impact: "positive" },
  { id: "8", timestamp: "2026-02-04T01:20:00Z", event_type: "commit", description: "Late-night commit detected (1:20 AM)", risk_impact: "negative" },
]
