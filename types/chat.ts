import type { ToolStep } from "@/components/chat/tool-card"

// ─── Chat Message Type ──────────────────────────────────────────────────────
// Shared across chat-interface, message-bubble, and related chat components.

export interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
  suggestions?: string[]
  /** Grouped tool execution steps (rendered as a single stacked card) */
  toolSteps?: ToolStep[]
  connectionLink?: {
    toolName: string
    toolSlug: string
    toolLogo?: string
    connectionUrl?: string
    message: string
  }
  /** Legacy per-message tool fields (used by message-bubble) */
  toolName?: string
  toolStatus?: "starting" | "processing" | "complete" | "error"
  toolArgs?: Record<string, unknown>
  toolResult?: string
}
