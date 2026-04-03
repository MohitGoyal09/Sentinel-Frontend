"use client"

import { useState } from "react"
import {
  Loader2,
  TriangleAlert,
  Wrench,
  Clock,
  CheckCircle2,
} from "lucide-react"
import { cn } from "@/lib/utils"

// ─── Types ───────────────────────────────────────────────────────────────────

interface ToolMessage {
  toolName?: string
  toolStatus?: "starting" | "processing" | "complete" | "error"
  toolArgs?: Record<string, unknown>
  toolResult?: string
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatToolName(slug: string): string {
  return slug.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
}

// ─── Component ───────────────────────────────────────────────────────────────

export function ToolCard({ message }: { message: ToolMessage }) {
  const [expanded, setExpanded] = useState(false)
  const status = message.toolStatus ?? "complete"
  const isActive = status === "starting" || status === "processing"

  return (
    <div className="flex w-full flex-col gap-1 py-2 max-w-3xl mx-auto px-4 animate-in fade-in slide-in-from-bottom-1 duration-200">
      <button
        onClick={() => setExpanded((v) => !v)}
        className={cn(
          "relative overflow-hidden rounded-full border border-border p-1.5 flex items-center gap-3 w-fit max-w-xs transition-all duration-200 hover:border-border/80",
          isActive && "border-primary/30"
        )}
      >
        {status === "starting" && (
          <div className="absolute inset-0 overflow-hidden rounded-full pointer-events-none">
            <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-primary/10 to-transparent" />
          </div>
        )}
        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
          {isActive ? (
            <Loader2 className="h-4 w-4 text-primary animate-spin" />
          ) : status === "error" ? (
            <TriangleAlert className="h-4 w-4 text-red-500" />
          ) : (
            <Wrench className="h-4 w-4 text-primary" />
          )}
        </div>
        <span className="text-xs font-semibold text-muted-foreground pr-1">
          {formatToolName(message.toolName ?? "tool")}
        </span>
        <div className="pr-1.5 shrink-0">
          {status === "complete" ? (
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          ) : status === "error" ? (
            <TriangleAlert className="h-4 w-4 text-red-500" />
          ) : (
            <Clock className="h-3.5 w-3.5 text-muted-foreground/50 animate-pulse" />
          )}
        </div>
      </button>

      {expanded && (message.toolArgs || message.toolResult) && (
        <div className="ml-6 mt-1 rounded-lg border border-border/50 bg-muted/50 p-3 text-xs font-mono text-muted-foreground overflow-x-auto animate-in fade-in slide-in-from-top-1 duration-150">
          {message.toolArgs && (
            <div className="mb-2">
              <span className="font-semibold text-foreground/70">Args:</span>
              <pre className="mt-1 whitespace-pre-wrap">{JSON.stringify(message.toolArgs, null, 2)}</pre>
            </div>
          )}
          {message.toolResult && (
            <div>
              <span className="font-semibold text-foreground/70">Result:</span>
              <pre className="mt-1 whitespace-pre-wrap">{message.toolResult}</pre>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
