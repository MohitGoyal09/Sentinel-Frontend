"use client"

import React from "react"
import { useRouter } from "next/navigation"
import { AlertTriangle, Users, CalendarCheck, Heart, FileText, BarChart3, Play, Info, ShieldCheck } from "lucide-react"
import { cn } from "@/lib/utils"

// --- Types -------------------------------------------------------------------

interface WelcomeScreenProps {
  userName: string
  onSuggestionClick: (query: string) => void
  inputSlot?: React.ReactNode
}

// --- Constants ---------------------------------------------------------------

const SUGGESTION_CHIPS = [
  "Who is at risk this week?",
  "Burnout prediction for my team",
  "Hidden gem contributors",
  "Culture health overview",
] as const

const SUGGESTION_CARDS = [
  {
    icon: AlertTriangle,
    iconColor: "text-amber-400",
    bgColor: "bg-amber-400/10",
    title: "Burnout Risk Summary",
    description: "Surface who's approaching overload before it becomes a problem.",
    prompt: "Give me a burnout risk summary for the team.",
  },
  {
    icon: Users,
    iconColor: "text-red-400",
    bgColor: "bg-red-400/10",
    title: "At-Risk Team Members",
    description: "Identify employees who may need attention or support right now.",
    prompt: "Who are the at-risk team members this month and why?",
  },
  {
    icon: CalendarCheck,
    iconColor: "text-emerald-400",
    bgColor: "bg-emerald-400/10",
    title: "Schedule Check-ins",
    description: "Recommend who should receive a 1:1 check-in this week.",
    prompt: "Which employees should I prioritize for check-ins this week?",
  },
  {
    icon: Heart,
    iconColor: "text-blue-400",
    bgColor: "bg-blue-400/10",
    title: "Culture Health",
    description: "Get a pulse on team morale, collaboration, and culture signals.",
    prompt: "Give me a culture health overview for the organization.",
  },
  {
    icon: Info,
    iconColor: "text-violet-400",
    bgColor: "bg-violet-400/10",
    title: "How accurate is Sentinel?",
    description: "Learn about our mathematical methodology and confidence scoring.",
    prompt: "How accurate is Sentinel's burnout detection?",
  },
  {
    icon: ShieldCheck,
    iconColor: "text-teal-400",
    bgColor: "bg-teal-400/10",
    title: "How does Sentinel protect employee privacy?",
    description: "Two-vault architecture and metadata-only analysis.",
    prompt: "How does Sentinel protect employee privacy?",
  },
] as const

const WORKFLOWS = [
  { icon: AlertTriangle, title: "Burnout Alert", description: "Get Slack alerts when risk changes" },
  { icon: FileText, title: "Risk Report", description: "Weekly burnout summary via email" },
  { icon: BarChart3, title: "Team Digest", description: "Auto-generate team health reports" },
] as const

// --- Helpers -----------------------------------------------------------------

function getTimeGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return "Good morning"
  if (hour < 18) return "Good afternoon"
  return "Good evening"
}

// --- Component ---------------------------------------------------------------

export function WelcomeScreen({ userName, onSuggestionClick, inputSlot }: WelcomeScreenProps) {
  const firstName = userName.split(" ")[0]
  const router = useRouter()

  return (
    <div className="flex flex-col items-center w-full max-w-3xl mx-auto px-4">
      {/* 1. Sentinel brand avatar */}
      <div className="animate-in fade-in zoom-in-95 duration-500">
        <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center text-3xl font-bold text-primary-foreground select-none ring-4 ring-primary/10">
          S
        </div>
      </div>

      {/* 2. Greeting and subtitle */}
      <div className="flex flex-col items-center gap-2 text-center animate-in fade-in slide-in-from-bottom-2 duration-500 delay-75 mt-6">
        <h1 className="text-3xl font-bold text-foreground tracking-tight">
          {getTimeGreeting()},{" "}
          <span className="text-primary">{firstName}</span>
        </h1>
        <p className="text-base text-muted-foreground">How can I help you today?</p>
      </div>

      {/* 3. Input field — same max-w-3xl as chat view */}
      {inputSlot && (
        <div className="w-full animate-in fade-in slide-in-from-bottom-2 duration-500 delay-100 mt-8">
          {inputSlot}
        </div>
      )}

      {/* 4. Suggested question chips — plain text, no borders */}
      <div className="w-full animate-in fade-in slide-in-from-bottom-2 duration-500 delay-150 mt-8">
        <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-3 text-center">
          Suggested Questions
        </p>
        <div className="flex flex-wrap justify-center gap-x-4 gap-y-2">
          {SUGGESTION_CHIPS.map((q) => (
            <button
              key={q}
              onClick={() => onSuggestionClick(q)}
              className="text-sm text-muted-foreground hover:text-primary transition-colors duration-150 cursor-pointer"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* 5. Quick action cards — 2x2 grid, same width as input */}
      <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-4 animate-in fade-in slide-in-from-bottom-3 duration-500 delay-200 mt-8">
        {SUGGESTION_CARDS.map((card) => {
          const Icon = card.icon
          return (
            <button
              key={card.title}
              onClick={() => onSuggestionClick(card.prompt)}
              className={cn(
                "group text-left rounded-lg p-3.5 cursor-pointer transition-colors duration-150",
                "bg-card border border-border",
                "hover:border-primary/30 hover:bg-primary/5",
                "active:scale-[0.97]"
              )}
            >
              <div className="flex items-start gap-3">
                <div className={cn(
                  "shrink-0 mt-0.5 p-1.5 rounded-md border border-border group-hover:border-primary/20 transition-colors duration-150",
                  card.bgColor
                )}>
                  <Icon className={cn("h-4 w-4", card.iconColor)} />
                </div>
                <div className="space-y-0.5 min-w-0">
                  <h3 className="text-sm font-medium text-foreground/80 group-hover:text-foreground transition-colors duration-150 leading-snug">
                    {card.title}
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {card.description}
                  </p>
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {/* 6. Suggested workflows */}
      <div className="w-full animate-in fade-in slide-in-from-bottom-3 duration-500 delay-300 mt-8">
        <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-3 text-center">
          Suggested Workflows
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {WORKFLOWS.map((wf) => {
            const WfIcon = wf.icon
            return (
              <button
                key={wf.title}
                onClick={() => router.push("/workflows")}
                className="bg-card border border-border rounded-lg p-3 text-left hover:border-primary/30 transition-colors duration-150 cursor-pointer group active:scale-[0.97]"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <WfIcon className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium text-foreground">{wf.title}</span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded border border-border text-muted-foreground group-hover:text-primary group-hover:border-primary/30 transition-colors duration-150">
                    Run
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{wf.description}</p>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
