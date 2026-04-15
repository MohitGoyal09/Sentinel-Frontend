"use client"

import { Brain, AlertTriangle, TrendingUp, MessageSquare, Clock, CheckCircle2, Calendar, Users } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { Employee, RiskLevel } from "@/types"
import { cn } from "@/lib/utils"
import { useMemo } from "react"

interface AiInsightCardProps {
  employee: Employee
  className?: string
}

interface ActionItem {
  icon: typeof TrendingUp
  title: string
  description: string
  priority: "critical" | "elevated" | "routine"
}

function generateNarrative(employee: Employee): string {
  const { risk_level, velocity, belongingness_score, circadian_entropy, indicators, name } = employee
  const firstName = name.split(" ")[0]

  if (risk_level === "CRITICAL") {
    const parts: string[] = []

    if (velocity > 2.5) {
      parts.push(`${firstName}'s work intensity has reached ${velocity.toFixed(1)}x baseline, well above the critical threshold.`)
    } else if (velocity > 2.0) {
      parts.push(`${firstName}'s work velocity is running at ${velocity.toFixed(1)}x baseline, indicating sustained overwork.`)
    } else {
      parts.push(`${firstName} is flagged at critical risk based on combined signal analysis.`)
    }

    if (belongingness_score < 0.3) {
      parts.push(`Social engagement has dropped to ${(belongingness_score * 100).toFixed(0)}%, suggesting withdrawal from team interactions.`)
    } else if (belongingness_score < 0.5) {
      parts.push(`Behavioral sentiment is declining at ${(belongingness_score * 100).toFixed(0)}%, below the healthy range.`)
    }

    if (indicators?.chaotic_hours) {
      parts.push("Schedule patterns have become erratic with irregular work hours detected.")
    }

    parts.push("Immediate intervention is recommended before patterns become entrenched.")
    return parts.join(" ")
  }

  if (risk_level === "ELEVATED") {
    const parts: string[] = []

    if (velocity > 1.5) {
      parts.push(`Early warning signals detected for ${firstName}: work velocity is trending up at ${velocity.toFixed(1)}x baseline.`)
    } else {
      parts.push(`${firstName} is showing early warning signals that warrant closer monitoring.`)
    }

    if (belongingness_score < 0.5) {
      parts.push(`Team engagement is slightly below normal at ${(belongingness_score * 100).toFixed(0)}%.`)
    }

    if (circadian_entropy > 1.0) {
      parts.push("Schedule regularity has decreased, which often precedes more serious patterns.")
    }

    parts.push("Monitor closely over the next 7 days and consider preventive check-in.")
    return parts.join(" ")
  }

  return `${firstName}'s signals are within healthy ranges. Work velocity is stable at ${velocity.toFixed(1)}x baseline, behavioral sentiment is at ${(belongingness_score * 100).toFixed(0)}%, and schedule patterns are regular. No action needed at this time.`
}

function generateActions(employee: Employee): ActionItem[] {
  const { velocity, belongingness_score, circadian_entropy, indicators, risk_level } = employee
  const actions: ActionItem[] = []

  if (risk_level === "CRITICAL" || velocity > 2.0) {
    actions.push({
      icon: TrendingUp,
      title: "Review current sprint load and deadline pressure",
      description: "Redistribute 2-3 tasks to reduce sustained intensity. Consider pausing non-critical deliverables.",
      priority: "critical",
    })
  }

  if (belongingness_score < 0.4 || indicators?.social_withdrawal) {
    actions.push({
      icon: MessageSquare,
      title: "Schedule a casual 1:1 check-in",
      description: "Focus on wellbeing, not performance. Ask about blockers, team dynamics, and personal energy.",
      priority: risk_level === "CRITICAL" ? "critical" : "elevated",
    })
  }

  if (circadian_entropy > 1.0 || indicators?.chaotic_hours) {
    actions.push({
      icon: Clock,
      title: "Discuss schedule flexibility and boundaries",
      description: "Review after-hours work patterns. Establish core hours and recovery expectations.",
      priority: risk_level === "CRITICAL" ? "critical" : "elevated",
    })
  }

  if (velocity > 1.5 && velocity <= 2.0) {
    actions.push({
      icon: Calendar,
      title: "Monitor workload trajectory this week",
      description: "Velocity is approaching the threshold. Check in before end of sprint.",
      priority: "elevated",
    })
  }

  if (indicators?.sustained_intensity) {
    actions.push({
      icon: AlertTriangle,
      title: "Block recovery time on calendar",
      description: "Schedule at least one low-meeting day this week. Sustained intensity without breaks compounds.",
      priority: risk_level === "CRITICAL" ? "critical" : "elevated",
    })
  }

  if (actions.length === 0) {
    actions.push({
      icon: CheckCircle2,
      title: "Continue regular check-ins",
      description: "All signals within healthy range. Maintain current cadence of 1:1s and team syncs.",
      priority: "routine",
    })
  }

  return actions.slice(0, 3)
}

const priorityStyles = {
  critical: {
    dot: "bg-[hsl(var(--sentinel-critical))]",
    text: "text-[hsl(var(--sentinel-critical))]",
    bg: "bg-[hsl(var(--sentinel-critical))]/6",
    border: "border-[hsl(var(--sentinel-critical))]/15",
  },
  elevated: {
    dot: "bg-[hsl(var(--sentinel-elevated))]",
    text: "text-[hsl(var(--sentinel-elevated))]",
    bg: "bg-[hsl(var(--sentinel-elevated))]/6",
    border: "border-[hsl(var(--sentinel-elevated))]/15",
  },
  routine: {
    dot: "bg-[hsl(var(--sentinel-healthy))]",
    text: "text-[hsl(var(--sentinel-healthy))]",
    bg: "bg-[hsl(var(--sentinel-healthy))]/6",
    border: "border-[hsl(var(--sentinel-healthy))]/15",
  },
}

const riskBorderStyle: Record<RiskLevel, string> = {
  CRITICAL: "border-[hsl(var(--sentinel-critical))]/20",
  ELEVATED: "border-[hsl(var(--sentinel-elevated))]/20",
  LOW: "border-border",
}

export function AiInsightCard({ employee, className }: AiInsightCardProps) {
  const narrative = useMemo(() => generateNarrative(employee), [employee])
  const actions = useMemo(() => generateActions(employee), [employee])

  const riskStyle = employee.risk_level === "CRITICAL"
    ? { icon: "bg-[hsl(var(--sentinel-critical))]/10", iconColor: "text-[hsl(var(--sentinel-critical))]", badge: "bg-[hsl(var(--sentinel-critical))]/8 text-[hsl(var(--sentinel-critical))] border-[hsl(var(--sentinel-critical))]/15" }
    : employee.risk_level === "ELEVATED"
      ? { icon: "bg-[hsl(var(--sentinel-elevated))]/10", iconColor: "text-[hsl(var(--sentinel-elevated))]", badge: "bg-[hsl(var(--sentinel-elevated))]/8 text-[hsl(var(--sentinel-elevated))] border-[hsl(var(--sentinel-elevated))]/15" }
      : { icon: "bg-[hsl(var(--sentinel-healthy))]/10", iconColor: "text-[hsl(var(--sentinel-healthy))]", badge: "bg-[hsl(var(--sentinel-healthy))]/8 text-[hsl(var(--sentinel-healthy))] border-[hsl(var(--sentinel-healthy))]/15" }

  return (
    <Card className={cn("border-border bg-card", riskBorderStyle[employee.risk_level], className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg", riskStyle.icon)}>
              <Brain className={cn("h-4 w-4", riskStyle.iconColor)} />
            </div>
            <CardTitle className="text-sm font-semibold text-foreground">AI Insight</CardTitle>
          </div>
          <Badge variant="outline" className={cn("text-[9px] font-semibold", riskStyle.badge)}>
            {employee.risk_level === "CRITICAL" ? "Urgent" : employee.risk_level === "ELEVATED" ? "Monitor" : "Healthy"}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-5">
        {/* Narrative */}
        <p className="text-sm leading-relaxed text-foreground/80 line-clamp-3">
          {narrative}
        </p>

        {/* Recommended Actions */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Users className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Manager Action Plan
            </span>
          </div>
          <div className="space-y-2.5">
            {actions.map((action, idx) => {
              const style = priorityStyles[action.priority]
              const ActionIcon = action.icon
              return (
                <div
                  key={idx}
                  className={cn("rounded-lg border px-3 py-2", style.bg, style.border)}
                >
                  <div className="flex items-center gap-2.5">
                    <ActionIcon className={cn("h-3.5 w-3.5 shrink-0", style.text)} />
                    <p className="text-xs font-medium text-foreground truncate">{action.title}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <p className="text-[10px] text-muted-foreground/50">
          Generated from behavioral metadata only. No personal content analyzed.
        </p>
      </CardContent>
    </Card>
  )
}
