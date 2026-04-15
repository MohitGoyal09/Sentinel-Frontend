"use client"

import { useRouter } from "next/navigation"
import { CalendarCheck } from "lucide-react"

export type InsightUrgency = "critical" | "healthy" | "neutral"

interface Insight {
  icon: React.ComponentType<{ className?: string }>
  color: string
  text: string
  sub: string
  urgency?: InsightUrgency
}

interface SentinelCardProps {
  insights: Insight[]
  onScheduleCheckin?: () => void
}

const urgencyStyles: Record<InsightUrgency, string> = {
  critical: "bg-[hsl(var(--sentinel-critical))]/5 border border-[hsl(var(--sentinel-critical))]/15 rounded-lg px-3 py-2.5",
  healthy: "bg-emerald-500/5 border border-emerald-500/15 rounded-lg px-3 py-2.5",
  neutral: "px-3 py-2.5",
}

export function SentinelCard({ insights, onScheduleCheckin }: SentinelCardProps) {
  const router = useRouter()

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden flex flex-col h-full">
      <div className="px-5 pt-5 pb-4">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400/60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
          </span>
          <h3 className="text-base font-medium text-foreground">Sentinel AI</h3>
          <span className="text-[10px] font-medium text-emerald-400 ml-1">Live</span>
        </div>
      </div>

      <div className="flex-1 px-5 space-y-2.5">
        {insights.map((insight, idx) => {
          const urgency = insight.urgency ?? "neutral"
          return (
            <div key={idx} className={urgencyStyles[urgency]}>
              <div className="flex items-start gap-2.5">
                <insight.icon className={`h-4 w-4 mt-0.5 shrink-0 ${insight.color}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-foreground leading-snug">{insight.text}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{insight.sub}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="px-5 pb-5 pt-4 flex items-center gap-2">
        <button
          onClick={() => router.push("/ask-sentinel")}
          className="rounded-md px-3 py-1.5 text-xs font-medium text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/10 transition-colors duration-150"
        >
          Open Ask Sentinel
        </button>
        <button
          onClick={onScheduleCheckin}
          className="rounded-md px-3 py-1.5 text-xs font-medium text-muted-foreground border border-border hover:text-foreground hover:border-foreground/20 transition-colors duration-150 flex items-center gap-1.5"
        >
          <CalendarCheck className="h-3 w-3" />
          Schedule Check-in
        </button>
      </div>
    </div>
  )
}
