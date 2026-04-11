"use client"

import { useState } from "react"
import {
  Loader2,
  TriangleAlert,
  Wrench,
  CheckCircle2,
  Mail,
  Calendar,
  Search,
  Database,
  FileText,
  Globe,
  Users,
  BarChart3,
} from "lucide-react"
import { cn, formatToolName } from "@/lib/utils"

// --- Types -----------------------------------------------------------------

export interface ToolStep {
  toolName: string
  toolSlug?: string
  description?: string
  status: "starting" | "processing" | "complete" | "error"
}

interface ToolCardProps {
  steps: ToolStep[]
}

// --- Helpers ---------------------------------------------------------------

/** Return a tool-specific icon based on the tool name/slug */
function getToolIcon(toolName: string) {
  const name = toolName.toLowerCase()
  if (name.includes("mail") || name.includes("email") || name.includes("gmail")) {
    return <Mail className="h-3.5 w-3.5" />
  }
  if (name.includes("calendar") || name.includes("schedule")) {
    return <Calendar className="h-3.5 w-3.5" />
  }
  if (name.includes("search") || name.includes("find") || name.includes("lookup")) {
    return <Search className="h-3.5 w-3.5" />
  }
  if (name.includes("database") || name.includes("sql") || name.includes("query")) {
    return <Database className="h-3.5 w-3.5" />
  }
  if (name.includes("file") || name.includes("document") || name.includes("doc")) {
    return <FileText className="h-3.5 w-3.5" />
  }
  if (name.includes("web") || name.includes("http") || name.includes("api") || name.includes("fetch")) {
    return <Globe className="h-3.5 w-3.5" />
  }
  if (name.includes("user") || name.includes("employee") || name.includes("team") || name.includes("people")) {
    return <Users className="h-3.5 w-3.5" />
  }
  if (name.includes("chart") || name.includes("analytic") || name.includes("metric") || name.includes("report")) {
    return <BarChart3 className="h-3.5 w-3.5" />
  }
  return <Wrench className="h-3.5 w-3.5" />
}

// --- Step Row (single step within the card) --------------------------------

function StepRow({ step }: { step: ToolStep }) {
  const [logoError, setLogoError] = useState(false)
  const isActive = step.status === "starting" || step.status === "processing"
  const isError = step.status === "error"
  const isComplete = step.status === "complete"
  const toolName = step.toolName ?? "tool"
  const logoUrl = step.toolSlug ? `https://logos.composio.dev/api/${step.toolSlug}` : null

  return (
    <div className="flex items-center gap-3 px-3 py-2.5 min-h-[40px]">
      {/* Left: icon or logo */}
      <div
        className={cn(
          "flex items-center justify-center h-7 w-7 rounded-md shrink-0 overflow-hidden transition-colors duration-200",
          isActive
            ? "bg-primary/10 text-primary"
            : isError
              ? "bg-red-500/10 text-red-400"
              : "bg-muted/60 text-muted-foreground",
        )}
      >
        {isActive ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : isError ? (
          <TriangleAlert className="h-3.5 w-3.5" />
        ) : logoUrl && !logoError ? (
          <img
            src={logoUrl}
            alt={toolName}
            className="h-4 w-4 object-contain"
            onError={() => setLogoError(true)}
          />
        ) : (
          getToolIcon(toolName)
        )}
      </div>

      {/* Center: description */}
      <span
        className={cn(
          "text-xs font-medium text-muted-foreground truncate flex-1 min-w-0",
          isActive && "animate-pulse",
        )}
      >
        {step.description || formatToolName(toolName)}
      </span>

      {/* Right: status indicator */}
      <div className="shrink-0">
        {isComplete ? (
          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
        ) : isError ? (
          <TriangleAlert className="h-4 w-4 text-red-400" />
        ) : (
          <Loader2 className="h-4 w-4 text-primary animate-spin" />
        )}
      </div>
    </div>
  )
}

// --- Main Component --------------------------------------------------------

export function ToolCard({ steps }: ToolCardProps) {
  if (steps.length === 0) return null

  return (
    <div className="w-full animate-in fade-in slide-in-from-bottom-1 duration-200">
      <div className="rounded-lg border border-border/50 bg-muted/10 overflow-hidden divide-y divide-border/30">
        {steps.map((step, idx) => (
          <StepRow key={`${step.toolName}-${idx}`} step={step} />
        ))}
      </div>
    </div>
  )
}
