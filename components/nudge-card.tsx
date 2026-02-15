"use client"

import { Bot, Calendar, Clock, X } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { NudgeData } from "@/types"
import { cn } from "@/lib/utils"
import { useRef, useCallback } from "react"

interface NudgeCardProps {
  nudge: NudgeData | undefined
}

export function NudgeCard({ nudge }: NudgeCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)

  const handleDismiss = useCallback(() => {
    if (!cardRef.current) return
    import("gsap").then(({ default: gsap }) => {
      gsap.to(cardRef.current, {
        scale: 0.95,
        opacity: 0,
        duration: 0.25,
        ease: "power2.in",
        onComplete: () => {
          if (cardRef.current) cardRef.current.style.display = "none"
        },
      })
    })
  }, [])

  if (!nudge) {
    return (
      <Card className="glass-card rounded-xl">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-foreground">AI Recommendation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-[hsl(var(--muted))]">
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
      ref={cardRef}
      className={cn(
        "glass-card glass-card-accent rounded-xl",
        isUrgent ? "glass-card-accent--critical pulse-critical" : "glass-card-accent--elevated"
      )}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold text-foreground">AI Recommendation</CardTitle>
          <div className="flex items-center gap-2">
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
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-muted-foreground hover:text-foreground"
              onClick={handleDismiss}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
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
          {nudge.actions.map((action: any) => (
            <Button
              key={action.action}
              variant={
                action.action === "suggest_break" || action.action === "block_calendar"
                  ? "default"
                  : "outline"
              }
              size="sm"
              className="relative h-9 overflow-hidden rounded-lg text-xs active:scale-[0.97] transition-transform duration-100"
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
