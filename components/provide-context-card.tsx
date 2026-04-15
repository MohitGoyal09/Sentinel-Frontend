"use client"

import { useState } from "react"
import { MessageCircle, CheckCircle2, Send } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { api } from "@/lib/api"

const EXPLANATION_TYPES = [
  { value: "working_by_choice", label: "Working late by choice" },
  { value: "deadline", label: "Deadline sprint" },
  { value: "timezone", label: "Timezone difference" },
  { value: "other", label: "Other" },
] as const

interface ProvideContextCardProps {
  onContextProvided?: () => void
}

interface SubmitResult {
  type: "context" | "appeal"
  message: string
  riskLevel?: string
}

export function ProvideContextCard({ onContextProvided }: ProvideContextCardProps) {
  const [mode, setMode] = useState<"idle" | "context" | "appeal">("idle")
  const [explanationType, setExplanationType] = useState("")
  const [message, setMessage] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [result, setResult] = useState<SubmitResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const resetForm = () => {
    setMode("idle")
    setExplanationType("")
    setMessage("")
    setResult(null)
    setError(null)
  }

  const handleProvideContext = async () => {
    if (!explanationType || !message.trim()) {
      setError("Please select a reason and provide an explanation.")
      return
    }
    setIsSubmitting(true)
    setError(null)

    try {
      const response = await api.post<{
        message: string
        updated_risk: { risk_level: string }
      }>("/me/provide-context", {
        explanation_type: explanationType,
        message: message.trim(),
      })
      setResult({
        type: "context",
        message: response.message,
        riskLevel: response.updated_risk?.risk_level,
      })
      onContextProvided?.()
    } catch (err: unknown) {
      const detail =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail
          : undefined
      setError(detail || "Failed to submit. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleAppealRisk = async () => {
    if (!message.trim() || message.trim().length < 10) {
      setError("Please provide a detailed reason (at least 10 characters).")
      return
    }
    setIsSubmitting(true)
    setError(null)

    try {
      const response = await api.post<{
        message: string
        risk_level: string
      }>("/me/appeal-risk", {
        reason: message.trim(),
      })
      setResult({
        type: "appeal",
        message: response.message,
        riskLevel: response.risk_level,
      })
      onContextProvided?.()
    } catch (err: unknown) {
      const detail =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail
          : undefined
      setError(detail || "Failed to submit appeal. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Success state
  if (result) {
    return (
      <Card className="glass-card rounded-xl overflow-hidden">
        <CardContent className="p-5">
          <div className="flex flex-col items-center text-center gap-3 py-4">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-full"
              style={{
                background: "hsl(var(--sentinel-healthy) / 0.12)",
              }}
            >
              <CheckCircle2
                className="h-5 w-5"
                style={{ color: "hsl(var(--sentinel-healthy))" }}
              />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">
                {result.type === "context" ? "Context Recorded" : "Appeal Submitted"}
              </p>
              <p className="text-xs text-muted-foreground max-w-[280px]">
                {result.message}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={resetForm}
              className="text-xs mt-2"
            >
              Done
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="glass-card rounded-xl overflow-hidden">
      <CardHeader
        className="pb-2 px-4 pt-3 border-b"
        style={{ borderColor: "hsl(var(--border) / 0.4)" }}
      >
        <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
          <MessageCircle
            className="h-3.5 w-3.5"
            style={{ color: "hsl(142 71% 45%)" }}
          />
          Provide Context
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 space-y-3">
        {mode === "idle" && (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground leading-relaxed">
              Think your risk score doesn&apos;t reflect reality? You can explain
              your situation or appeal the assessment.
            </p>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setMode("context")}
                className="text-xs h-8 transition-all duration-200"
              >
                Explain Activity
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setMode("appeal")}
                className="text-xs h-8 transition-all duration-200"
              >
                Appeal Score
              </Button>
            </div>
          </div>
        )}

        {mode === "context" && (
          <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase font-medium text-muted-foreground">
                Reason
              </Label>
              <Select value={explanationType} onValueChange={setExplanationType}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Select a reason..." />
                </SelectTrigger>
                <SelectContent>
                  {EXPLANATION_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value} className="text-xs">
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase font-medium text-muted-foreground">
                Explanation
              </Label>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Tell us more about your situation..."
                className="min-h-[72px] text-xs resize-none"
                maxLength={500}
              />
              <p className="text-[10px] text-muted-foreground/60 text-right">
                {message.length}/500
              </p>
            </div>

            {error && (
              <p
                className="text-[11px] font-medium px-2 py-1.5 rounded-md"
                style={{
                  color: "hsl(var(--destructive))",
                  background: "hsl(var(--destructive) / 0.08)",
                }}
              >
                {error}
              </p>
            )}

            <div className="flex gap-2 pt-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={resetForm}
                className="text-xs h-7 flex-1"
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleProvideContext}
                disabled={isSubmitting || !explanationType || !message.trim()}
                className="text-xs h-7 flex-1 transition-all duration-200"
                style={{
                  background: "hsl(142 71% 45%)",
                  color: "white",
                }}
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-1.5">
                    <span
                      className="h-3 w-3 rounded-full border-2 border-white/30 border-t-white animate-spin"
                    />
                    Submitting
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5">
                    <Send className="h-3 w-3" />
                    Submit
                  </span>
                )}
              </Button>
            </div>

            <p className="text-[10px] text-muted-foreground/50 italic text-center">
              Your explanation is private and only used to improve accuracy.
            </p>
          </div>
        )}

        {mode === "appeal" && (
          <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase font-medium text-muted-foreground">
                Why is this score inaccurate?
              </Label>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Explain why you believe your risk assessment doesn't reflect your actual situation..."
                className="min-h-[90px] text-xs resize-none"
                maxLength={500}
              />
              <p className="text-[10px] text-muted-foreground/60 text-right">
                {message.length}/500
              </p>
            </div>

            {error && (
              <p
                className="text-[11px] font-medium px-2 py-1.5 rounded-md"
                style={{
                  color: "hsl(var(--destructive))",
                  background: "hsl(var(--destructive) / 0.08)",
                }}
              >
                {error}
              </p>
            )}

            <div className="flex gap-2 pt-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={resetForm}
                className="text-xs h-7 flex-1"
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleAppealRisk}
                disabled={isSubmitting || message.trim().length < 10}
                className="text-xs h-7 flex-1 transition-all duration-200"
                style={{
                  background: "hsl(142 71% 45%)",
                  color: "white",
                }}
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-1.5">
                    <span
                      className="h-3 w-3 rounded-full border-2 border-white/30 border-t-white animate-spin"
                    />
                    Submitting
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5">
                    <Send className="h-3 w-3" />
                    Submit Appeal
                  </span>
                )}
              </Button>
            </div>

            <p className="text-[10px] text-muted-foreground/50 italic text-center">
              Appeals lower model confidence and are logged for transparency.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
