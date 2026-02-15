"use client"

import { ArrowDownCircle, ArrowUpCircle, GitCommit, MessageSquare, MinusCircle, Unlock } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { ActivityEvent } from "@/types"
import { cn } from "@/lib/utils"
import { useStaggerMount } from "@/hooks/useStaggerMount"

interface ActivityFeedProps {
  events: ActivityEvent[]
}

function eventIcon(eventType: string) {
  switch (eventType) {
    case "commit":
      return GitCommit
    case "pr_review":
    case "unblocked":
      return Unlock
    case "slack_message":
      return MessageSquare
    default:
      return GitCommit
  }
}

function impactMeta(impact: string) {
  switch (impact) {
    case "positive":
      return { icon: ArrowUpCircle, color: "text-[hsl(var(--sentinel-healthy))]" }
    case "negative":
      return { icon: ArrowDownCircle, color: "text-[hsl(var(--sentinel-critical))]" }
    default:
      return { icon: MinusCircle, color: "text-muted-foreground" }
  }
}

function formatTime(timestamp: string) {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / (1000 * 60))
  if (minutes < 1) return "Just now"
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

export function ActivityFeed({ events }: ActivityFeedProps) {
  const containerRef = useStaggerMount(".feed-entry", [events.length])

  return (
    <Card className="glass-card rounded-xl">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold text-foreground">Activity Feed</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-72 px-5 pb-4">
          <div ref={containerRef} className="flex flex-col">
            {events.map((event, index) => {
              const Icon = eventIcon(event.event_type)
              const impact = impactMeta(event.risk_impact || "neutral")
              const ImpactIcon = impact.icon

              return (
                <div
                  key={event.id || `event-${index}`}
                  className="feed-entry flex items-start gap-3 border-b border-[var(--glass-border)] py-3.5 last:border-0 rounded-md transition-colors duration-150 hover:bg-[hsl(var(--muted))]/30"
                >
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[hsl(var(--muted))]">
                    <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] leading-relaxed text-foreground">{event.description}</p>
                    <p className="mt-1 font-mono text-[11px] tabular-nums text-muted-foreground">
                      {formatTime(event.timestamp)}
                    </p>
                  </div>
                  <ImpactIcon className={cn("mt-0.5 h-4 w-4 shrink-0", impact.color)} />
                </div>
              )
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
