"use client"

import { Bot, Calendar, Clock } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { NudgeData } from "@/types"
import { cn } from "@/lib/utils"

interface NudgeCardProps {
  nudge: NudgeData | undefined
}

export function NudgeCard({ nudge }: NudgeCardProps) {
  if (!nudge) {
    return (
      <Card className="border-border bg-card shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-foreground">AI Recommendation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
              <Bot className="h-5 w-5 text-muted-foreground/40" />
            </div>
            <p className="text-sm text-muted-foreground">No active nudge for this user</p>
            <p className="mt-1 text-xs text-muted-foreground/60">
              Risk level is within normal range
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const isUrgent = nudge.risk_level === "CRITICAL"

  return (
    <Card
      className={cn(
        "border-border bg-card shadow-sm",
        isUrgent && "border-[hsl(var(--sentinel-critical))]/20"
      )}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold text-foreground">AI Recommendation</CardTitle>
          <Badge
            variant="outline"
            className={cn(
              "text-[10px]",
              isUrgent
                ? "border-[hsl(var(--sentinel-critical))]/15 bg-[hsl(var(--sentinel-critical))]/6 text-[hsl(var(--sentinel-critical))]"
                : "border-[hsl(var(--sentinel-elevated))]/15 bg-[hsl(var(--sentinel-elevated))]/6 text-[hsl(var(--sentinel-elevated))]"
            )}
          >
            {nudge.nudge_type.replace(/_/g, " ")}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex items-start gap-3">
          <div
            className={cn(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
              isUrgent
                ? "bg-[hsl(var(--sentinel-critical))]/8"
                : "bg-[hsl(var(--sentinel-elevated))]/8"
            )}
          >
            <Bot className={cn("h-4 w-4", isUrgent ? "text-[hsl(var(--sentinel-critical))]" : "text-[hsl(var(--sentinel-elevated))]")} />
          </div>
          <p className="text-sm leading-relaxed text-foreground/80">{nudge.message}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          {nudge.actions.map((action : any) => (
            <Button
              key={action.action}
              variant={
                action.action === "suggest_break" || action.action === "block_calendar"
                  ? "default"
                  : "outline"
              }
              size="sm"
              className="h-9 rounded-lg text-xs"
            >
              {action.action.includes("calendar") || action.action.includes("retro") ? (
                <Calendar className="mr-1.5 h-3.5 w-3.5" />
              ) : action.action.includes("break") ? (
                <Clock className="mr-1.5 h-3.5 w-3.5" />
              ) : null}
              {action.label}
            </Button>
          ))}
        </div>

        <p className="text-[11px] italic text-muted-foreground/60">
          Employee-first: This nudge is delivered directly to the user. Managers are not notified.
        </p>
      </CardContent>
    </Card>
  )
}
