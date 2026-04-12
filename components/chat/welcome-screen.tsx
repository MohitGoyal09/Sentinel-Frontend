"use client"

import React from "react"
import { useRouter } from "next/navigation"
import { AlertTriangle, Heart, Info, ShieldCheck } from "lucide-react"
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
    icon: Heart,
    iconColor: "text-emerald-400",
    bgColor: "bg-emerald-400/10",
    title: "Culture Health",
    description: "Get a pulse on team morale, collaboration, and culture signals.",
    prompt: "Give me a culture health overview for the organization.",
  },
  {
    icon: Info,
    iconColor: "text-slate-400",
    bgColor: "bg-slate-500/10",
    title: "How accurate is Sentinel?",
    description: "Learn about our mathematical methodology and confidence scoring.",
    prompt: "How accurate is Sentinel's burnout detection?",
  },
  {
    icon: ShieldCheck,
    iconColor: "text-emerald-400",
    bgColor: "bg-emerald-400/10",
    title: "How does Sentinel protect employee privacy?",
    description: "Two-vault architecture and metadata-only analysis.",
    prompt: "How does Sentinel protect employee privacy?",
  },
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

      {/* 6. More suggestions link */}
      <div className="w-full animate-in fade-in slide-in-from-bottom-3 duration-500 delay-300 mt-6 text-center">
        <button
          onClick={() => router.push("/workflows")}
          className="text-xs text-muted-foreground hover:text-primary transition-colors duration-150 cursor-pointer"
        >
          More suggestions &rarr;
        </button>
      </div>
    </div>
  )
}
