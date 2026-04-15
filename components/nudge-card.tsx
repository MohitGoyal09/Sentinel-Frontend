"use client"

import { toast } from "sonner"
import { Bot, Calendar, Clock, X } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { NudgeData } from "@/types"
import { cn } from "@/lib/utils"
import { useRef, useCallback, useState } from "react"
import { api, dismissNudge, scheduleBreak } from "@/lib/api"

interface NudgeCardProps {
  nudge: NudgeData | undefined
  onDismiss?: () => void
}

export function NudgeCard({ nudge, onDismiss }: NudgeCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  const handleDismiss = useCallback(async () => {
    if (!nudge?.user_hash) return
    setIsProcessing(true)
    try {
      await dismissNudge(nudge.user_hash)

      // Also provide context so the dismiss actually affects risk calculation
      try {
        await api.post("/me/provide-context", {
          explanation_type: "working_by_choice",
          message: "Employee dismissed wellness nudge — indicated they are fine.",
        })
      } catch {
        // Non-critical: context update is best-effort
      }

      if (onDismiss) {
        onDismiss()
      } else if (cardRef.current) {
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
      }
    } catch (err) {
      console.error("Failed to dismiss nudge:", err)
    } finally {
      setIsProcessing(false)
    }
  }, [nudge?.user_hash, onDismiss])

  const handleAction = useCallback(async (action: string) => {
    if (!nudge?.user_hash) return
    setIsProcessing(true)
    try {
      if (action === "schedule_break" || action === "block_recovery") {
        await scheduleBreak(nudge.user_hash)
        toast.success("Break scheduled for tomorrow!")
      } else if (action === "dismiss") {
        await handleDismiss()
      } else if (action === "request_support") {
        await api.post('/notifications', {
          type: 'team',
          title: 'Support Requested',
          message: 'An employee has requested support through a wellness nudge.',
          priority: 'high',
        })
        toast.success("Your support request has been recorded. Your manager will be notified.")
      }
    } catch (err) {
      console.error("Failed to process action:", err)
    } finally {
      setIsProcessing(false)
    }
  }, [nudge?.user_hash, handleDismiss])

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
                action.action === "suggest_break" || action.action === "block_calendar" || action.action === "block_recovery" || action.action === "request_support"
                  ? "default"
                  : "outline"
              }
              size="sm"
              disabled={isProcessing}
              onClick={() => handleAction(action.action)}
              className="relative h-9 overflow-hidden rounded-lg text-xs active:scale-[0.97] transition-transform duration-100"
            >
              {action.action.includes("calendar") || action.action.includes("retro") ? (
                <Calendar className="mr-1.5 h-3.5 w-3.5" />
              ) : action.action.includes("break") || action.action.includes("recovery") ? (
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
