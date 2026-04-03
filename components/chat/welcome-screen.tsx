"use client"

import React, { useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { AlertTriangle, Users, CalendarCheck, Heart, FileText, BarChart3, Play, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"

// --- Types -------------------------------------------------------------------

interface WelcomeScreenProps {
  userName: string
  onSuggestionClick: (query: string) => void
  inputSlot?: React.ReactNode
}

// --- Constants ---------------------------------------------------------------

const ALL_QUESTIONS = [
  "Who is at risk this week?",
  "Team velocity trend",
  "Schedule 1:1 check-ins",
  "Culture health overview",
  "Burnout prediction for my team",
  "Hidden gem contributors",
  "Compare team performance",
  "Weekend work patterns",
  "Retention risk analysis",
] as const

const QUESTIONS_PER_SLIDE = 3

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

  const totalSlides = Math.ceil(ALL_QUESTIONS.length / QUESTIONS_PER_SLIDE)
  const [questionSlide, setQuestionSlide] = useState(0)
  const [questionsVisible, setQuestionsVisible] = useState(true)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const aliveRef = useRef(true)

  const startCarouselInterval = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    intervalRef.current = setInterval(() => {
      setQuestionsVisible(false)
      setTimeout(() => {
        if (!aliveRef.current) return
        setQuestionSlide((prev) => (prev + 1) % totalSlides)
        setQuestionsVisible(true)
      }, 300)
    }, 5000)
  }, [totalSlides])

  useEffect(() => {
    aliveRef.current = true
    startCarouselInterval()
    return () => {
      aliveRef.current = false
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [startCarouselInterval])

  const visibleQuestions = ALL_QUESTIONS.slice(
    questionSlide * QUESTIONS_PER_SLIDE,
    (questionSlide + 1) * QUESTIONS_PER_SLIDE,
  )

  return (
    <div className="flex flex-col items-center w-full max-w-2xl mx-auto px-4">
      {/* 1. Sentinel brand avatar — flat circle, no glow */}
      <div className="animate-in fade-in zoom-in-95 duration-500">
        <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-2xl font-semibold text-primary-foreground select-none">
          S
        </div>
      </div>

      {/* 2. Greeting and subtitle */}
      <div className="flex flex-col items-center gap-1 text-center animate-in fade-in slide-in-from-bottom-2 duration-500 delay-75 mt-4">
        <h1 className="text-2xl md:text-3xl font-semibold text-foreground">
          {getTimeGreeting()},{" "}
          <span className="text-primary">{firstName}</span>
        </h1>
        <p className="text-base text-muted-foreground mt-1">How can I help?</p>
      </div>

      {/* 3. Input field */}
      {inputSlot && (
        <div className="w-full animate-in fade-in slide-in-from-bottom-2 duration-500 delay-100 mt-6">
          {inputSlot}
        </div>
      )}

      {/* 4. Suggested questions — rotating carousel */}
      <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 delay-150 mt-4">
        <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-3 text-center">
          Suggested Questions
        </p>
        <div
          className={cn(
            "flex flex-wrap justify-center gap-2 transition-opacity duration-300",
            questionsVisible ? "opacity-100" : "opacity-0",
          )}
        >
          {visibleQuestions.map((q) => (
            <button
              key={q}
              onClick={() => onSuggestionClick(q)}
              className="px-3 py-1.5 rounded-full border border-border bg-card text-sm text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors cursor-pointer active:scale-[0.97]"
            >
              {q}
            </button>
          ))}
        </div>
        <div className="flex gap-1.5 justify-center mt-3">
          {Array.from({ length: totalSlides }).map((_, i) => (
            <button
              key={i}
              onClick={() => {
                setQuestionsVisible(false)
                setTimeout(() => {
                  if (!aliveRef.current) return
                  setQuestionSlide(i)
                  setQuestionsVisible(true)
                  startCarouselInterval() // Reset timer after manual dot click
                }, 300)
              }}
              aria-label={`Go to slide ${i + 1}`}
              className={cn(
                "h-1.5 rounded-full transition-all duration-300",
                i === questionSlide ? "w-4 bg-primary" : "w-1.5 bg-muted-foreground/30",
              )}
            />
          ))}
        </div>
      </div>

      {/* 5. Suggestion cards 2x2 grid */}
      <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-3 animate-in fade-in slide-in-from-bottom-3 duration-500 delay-200 mt-4">
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
                  "shrink-0 mt-0.5 p-1.5 rounded-lg border border-border group-hover:border-primary/20 transition-colors duration-150",
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
      <div className="w-full max-w-2xl animate-in fade-in slide-in-from-bottom-3 duration-500 delay-300 mt-4">
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
                className="bg-card border border-border rounded-lg p-3 text-left hover:border-primary/30 transition-colors cursor-pointer group active:scale-[0.97]"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <WfIcon className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium text-foreground">{wf.title}</span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded border border-border text-muted-foreground group-hover:text-primary group-hover:border-primary/30 transition-colors">
                    Run
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{wf.description}</p>
              </button>
            )
          })}
        </div>
      </div>

      {/* 7. What's a Workflow? promo */}
      <div className="w-full max-w-2xl animate-in fade-in slide-in-from-bottom-3 duration-500 delay-[400ms] mt-6">
        <div className="bg-card border border-border rounded-lg p-5 relative overflow-hidden">
          <div className="relative z-10">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-primary/10 text-primary mb-3">
              <Sparkles className="h-3 w-3" />
              Automation Made Simple
            </span>
            <h3 className="text-lg font-semibold text-foreground mt-2">
              What&apos;s a <span className="text-primary">Workflow</span>?
            </h3>
            <p className="text-sm text-muted-foreground mt-2 max-w-md">
              Turn complex tasks into instant automations. Connect your tools and let AI handle the repetitive work.
            </p>
            <ul className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-xs text-muted-foreground">
              <li className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                No coding required
              </li>
              <li className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                Works with 15+ apps
              </li>
              <li className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                AI-powered
              </li>
            </ul>
            <button
              onClick={() => router.push("/workflows")}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors cursor-pointer active:scale-[0.97]"
            >
              <Play className="h-3.5 w-3.5" />
              Discover Workflows
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
