"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { WelcomeScreen } from "./welcome-screen"
import { ToolCard, type ToolStep } from "./tool-card"
import { ConnectionLinkCard } from "./connection-link-card"
import { MessageBubble } from "./message-bubble"
import {
  ArrowUp,

  Square,
  Plus,
  Sparkles,
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  chatWithSentinelStream,
  sendChatFeedback,
  getChatSession,
  type ToolCallEvent,
  type ConnectionLinkEvent,
} from "@/lib/api"
import { useAuth } from "@/contexts/auth-context"
import { toast } from "sonner"
import { notifyChatSessionChanged } from "@/hooks/useChatHistory"
import type { Message } from "@/types/chat"

// ─── Types ───────────────────────────────────────────────────────────────────

interface ChatInterfaceProps {
  initialQuery?: string
  initialSessionId?: string
  userName?: string
}

// ─── Constants ───────────────────────────────────────────────────────────────

const MAX_INPUT_LENGTH = 2000

// ─── Helpers ─────────────────────────────────────────────────────────────────

function parseSuggestions(content: string): { cleanContent: string; suggestions: string[] } {
  const match = content.match(/<suggestions>\s*([\s\S]*?)\s*<\/suggestions>/)
  if (!match) return { cleanContent: content, suggestions: [] }

  const cleanContent = content.replace(/<suggestions>[\s\S]*?<\/suggestions>/, "").trim()
  const suggestions = match[1]
    .split("\n")
    .map((line) => line.replace(/^-\s*/, "").trim())
    .filter((line) => line.length > 0)
    .slice(0, 3)

  return { cleanContent, suggestions }
}

/** Detect Composio OAuth connection URLs embedded as markdown links in LLM text. */
const COMPOSIO_URL_PATTERN = /\[([^\]]*[Cc]onnect[^\]]*)\]\((https?:\/\/[^)]*composio[^)]*)\)/g

function extractConnectionUrls(text: string): { appName: string; url: string }[] {
  const results: { appName: string; url: string }[] = []
  for (const match of text.matchAll(COMPOSIO_URL_PATTERN)) {
    const label = match[1]
    const url = match[2]
    const appName = label.replace(/[Cc]onnect\s*/g, "").trim() || "Application"
    results.push({ appName, url })
  }
  return results
}

function stripConnectionUrls(text: string): string {
  return text.replace(COMPOSIO_URL_PATTERN, "").trim()
}

// ─── Typing Indicator ───────────────────────────────────────────────────────

function TypingIndicator() {
  return (
    <div className="flex items-start gap-3 animate-in fade-in slide-in-from-bottom-1 duration-200">
      <div
        className="shrink-0 w-7 h-7 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-[11px] font-bold select-none"
        aria-hidden="true"
      >
        S
      </div>
      <div className="flex items-center gap-1.5 pt-2">
        <span className="text-xs text-muted-foreground animate-pulse">Thinking...</span>
      </div>
    </div>
  )
}

// ─── Input Area ─────────────────────────────────────────────────────────────

interface InputAreaProps {
  input: string
  isLoading: boolean
  isStreaming: boolean
  textareaRef: React.RefObject<HTMLTextAreaElement | null>
  onInputChange: (value: string) => void
  onKeyDown: (e: React.KeyboardEvent) => void
  onSend: () => void
  onStop: () => void
}

function InputArea({
  input,
  isLoading,
  isStreaming,
  textareaRef,
  onInputChange,
  onKeyDown,
  onSend,
  onStop,
}: InputAreaProps) {
  return (
    <div className="max-w-3xl mx-auto w-full">
      <div className="bg-card border border-border rounded-xl overflow-hidden focus-within:border-border-active transition-colors duration-200">
        {/* Textarea */}
        <textarea
          ref={textareaRef}
          className="w-full resize-none bg-transparent border-none focus:ring-0 focus:outline-none px-4 pt-3.5 pb-1.5 text-sm placeholder:text-muted-foreground/40 text-foreground leading-relaxed min-h-[24px] max-h-[200px]"
          aria-label="Chat message"
          placeholder="Ask about team health, burnout risks, or performance..."
          value={input}
          onChange={(e) => {
            if (e.target.value.length <= MAX_INPUT_LENGTH) onInputChange(e.target.value)
          }}
          onKeyDown={onKeyDown}
          rows={1}
          maxLength={MAX_INPUT_LENGTH}
        />

        {/* Toolbar */}
        <div className="flex items-center justify-between px-3 py-2">
          {/* Left: attach + model label */}
          <div className="flex items-center gap-2">
            <button
              disabled
              className="h-7 w-7 rounded-full bg-muted/60 flex items-center justify-center text-muted-foreground/40 cursor-not-allowed transition-colors duration-150"
              title="File upload available in a future release"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
            <span className="text-[11px] text-muted-foreground/60 flex items-center gap-1.5 select-none font-medium uppercase tracking-wider">
              <Sparkles className="h-3 w-3" />
              Gemini 2.5 Flash
            </span>
          </div>

          {/* Right: char count + send/stop */}
          <div className="flex items-center gap-2">
            {input.length > 0 && (
              <span
                className={cn(
                  "text-[10px] transition-colors tabular-nums",
                  input.length > MAX_INPUT_LENGTH * 0.9
                    ? "text-amber-500 font-medium"
                    : input.length === MAX_INPUT_LENGTH
                      ? "text-red-500 font-semibold"
                      : "text-muted-foreground/30",
                )}
              >
                {input.length}/{MAX_INPUT_LENGTH}
              </span>
            )}

            {isStreaming ? (
              <button
                onClick={onStop}
                className="h-7 w-7 rounded-full flex items-center justify-center transition-colors active:scale-[0.97] bg-red-500/15 text-red-400 hover:bg-red-500/25"
                title="Stop generating"
              >
                <Square className="h-3 w-3" />
              </button>
            ) : (
              <button
                disabled={!input.trim() || isLoading || input.length > MAX_INPUT_LENGTH}
                onClick={onSend}
                className={cn(
                  "h-7 w-7 rounded-full flex items-center justify-center transition-colors active:scale-[0.97]",
                  input.trim() && !isLoading
                    ? "bg-primary text-primary-foreground hover:bg-primary/90"
                    : "bg-muted text-muted-foreground/40 cursor-not-allowed",
                )}
                aria-label="Send message"
                title="Send message"
              >
                <ArrowUp className="h-3.5 w-3.5" strokeWidth={2.5} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Main Chat Interface ─────────────────────────────────────────────────────

export function ChatInterface({
  initialQuery,
  initialSessionId,
  userName: propUserName = "User",
}: ChatInterfaceProps) {
  const { user } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const userName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || propUserName

  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [sessionId, setSessionId] = useState<string | undefined>()
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [isStreaming, setIsStreaming] = useState(false)

  const scrollRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const initialized = useRef(false)
  const messagesRef = useRef(messages)
  useEffect(() => { messagesRef.current = messages }, [messages])
  const abortControllerRef = useRef<AbortController | null>(null)

  // Abort in-flight stream on unmount to prevent setState on unmounted component
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort()
    }
  }, [])

  // Helper: update session ID in URL without full page reload (KaraX pattern)
  const setSessionIdInUrl = useCallback((newSessionId: string) => {
    const params = new URLSearchParams(searchParams?.toString() || '')
    params.set('session', newSessionId)
    router.replace(`${pathname}?${params.toString()}`, { scroll: false })
  }, [router, pathname, searchParams])

  // Helper: clear session ID from URL
  const clearSessionIdFromUrl = useCallback(() => {
    router.replace(pathname, { scroll: false })
  }, [router, pathname])

  const handleCopy = useCallback(async (content: string, messageId: string) => {
    try {
      await navigator.clipboard.writeText(content)
      setCopiedId(messageId)
      setTimeout(() => setCopiedId(null), 2000)
    } catch {
      toast.error("Failed to copy to clipboard")
    }
  }, [])

  const handleNewChat = useCallback(() => {
    abortControllerRef.current?.abort()
    setMessages([])
    setSessionId(undefined)
    setInput("")
    setIsStreaming(false)
    setIsLoading(false)
    loadedSessionRef.current = undefined
    clearSessionIdFromUrl()
  }, [clearSessionIdFromUrl])

  const handleStop = useCallback(() => {
    abortControllerRef.current?.abort()
    setIsStreaming(false)
    setIsLoading(false)
  }, [])

  // Load session from URL.
  // Reads session ID from both the initialSessionId prop (on first mount) and
  // from searchParams reactively (when the user clicks a sidebar link or the URL
  // is updated via router.replace). Uses a ref to avoid re-loading the same session.
  const loadedSessionRef = useRef<string | undefined>(undefined)
  const urlSessionId = searchParams?.get('session') ?? undefined
  const effectiveSessionId = urlSessionId || initialSessionId

  useEffect(() => {
    if (!effectiveSessionId) {
      // URL has no session param — reset state if we had a session loaded
      // (e.g. user clicked "New chat" in sidebar)
      if (loadedSessionRef.current) {
        loadedSessionRef.current = undefined
        setMessages([])
        setSessionId(undefined)
        setIsStreaming(false)
        setIsLoading(false)
        abortControllerRef.current?.abort()
      }
      return
    }
    if (loadedSessionRef.current === effectiveSessionId) return
    loadedSessionRef.current = effectiveSessionId

    // Abort any in-flight stream when switching sessions
    abortControllerRef.current?.abort()
    setIsStreaming(false)
    setIsLoading(false)

    getChatSession(effectiveSessionId)
      .then((data) => {
        // Guard: only apply if this is still the active session (avoid race)
        if (loadedSessionRef.current !== effectiveSessionId) return

        const msgs: Message[] = []
        // Group consecutive tool_call turns into a single tool-steps message
        let pendingToolSteps: ToolStep[] = []
        let toolGroupBaseId: string | null = null

        const flushToolSteps = () => {
          if (pendingToolSteps.length > 0 && toolGroupBaseId) {
            msgs.push({
              id: `tool-steps-hist-${toolGroupBaseId}`,
              role: "assistant",
              content: "",
              timestamp: new Date(),
              toolSteps: [...pendingToolSteps],
            })
            pendingToolSteps = []
            toolGroupBaseId = null
          }
        }

        for (const turn of data.turns) {
          const turnType = turn.type || "message"
          const turnId = `${turn.id || msgs.length}`

          if (turnType === "tool_call") {
            // Reconstruct a ToolStep from the persisted metadata
            const meta = turn.metadata || {}
            if (!toolGroupBaseId) toolGroupBaseId = turnId
            pendingToolSteps.push({
              toolName: (meta.tool_name as string) ?? "tool",
              toolSlug: (meta.tool_slug as string) ?? "",
              description: (meta.description as string) ?? undefined,
              status: ((meta.status as string) ?? "complete") as ToolStep["status"],
            })
            continue
          }

          if (turnType === "connection_link") {
            flushToolSteps()
            const meta = turn.metadata || {}
            msgs.push({
              id: `conn-link-hist-${turnId}`,
              role: "assistant",
              content: "",
              timestamp: turn.created_at ? new Date(turn.created_at) : new Date(),
              connectionLink: {
                toolName: (meta.tool_name as string) ?? "Tool",
                toolSlug: (meta.tool_slug as string) ?? "",
                toolLogo: (meta.tool_logo as string) ?? undefined,
                connectionUrl: (meta.connection_url as string) ?? undefined,
                message: (meta.message as string) ?? "Connect to continue",
              },
            })
            continue
          }

          // Regular message turn -- flush any pending tool steps first
          flushToolSteps()
          msgs.push({
            id: turnId,
            role: turn.role as "user" | "assistant",
            content: turn.content,
            timestamp: turn.created_at ? new Date(turn.created_at) : new Date(),
          })
        }

        // Flush any remaining tool steps at the end
        flushToolSteps()

        setMessages(msgs)
        setSessionId(effectiveSessionId)
      })
      .catch(() => { /* start fresh */ })
  }, [effectiveSessionId])

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + "px"
    }
  }, [input])

  // Auto-scroll — only when user is near the bottom (prevents jank & lets users scroll up)
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  useEffect(() => {
    if (scrollRef.current && messages.length > 0) {
      const container = scrollRef.current.parentElement
      if (container) {
        const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100
        if (isNearBottom) {
          if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current)
          scrollTimeoutRef.current = setTimeout(() => {
            scrollRef.current?.scrollIntoView({ behavior: "smooth" })
          }, 100) // Debounce 100ms during streaming
        }
      }
    }
  }, [messages])

  // Send initial query
  useEffect(() => {
    if (initialQuery && messages.length === 0 && !initialized.current) {
      initialized.current = true
      handleSendMessage(initialQuery)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQuery])

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return
    if (text.length > MAX_INPUT_LENGTH) return

    const userMessage: Message = { id: Date.now().toString(), role: "user", content: text, timestamp: new Date() }
    const aiMessageId = (Date.now() + 1).toString()
    const aiMessage: Message = { id: aiMessageId, role: "assistant", content: "", timestamp: new Date() }

    setMessages((prev) => [...prev, userMessage, aiMessage])
    setInput("")
    setIsLoading(true)
    setIsStreaming(true)

    abortControllerRef.current?.abort()
    const controller = new AbortController()
    abortControllerRef.current = controller

    try {
      const history = messagesRef.current.slice(-10).map((m) => ({ role: m.role, content: m.content }))

      await chatWithSentinelStream(
        { message: text, session_id: sessionId, context: { conversation_history: history } },
        (token) => {
          // Detect Composio OAuth connection URLs in streamed text
          const connUrls = extractConnectionUrls(token)
          if (connUrls.length > 0) {
            // Strip the markdown links from the token
            const cleanToken = stripConnectionUrls(token)

            // Insert ConnectionLinkCard messages for each detected URL
            for (const conn of connUrls) {
              const slug = conn.appName.toLowerCase().replace(/\s+/g, "")
              const linkMsgId = `conn-link-${slug}-${Date.now()}`
              setMessages((prev) => {
                const aiIdx = prev.findIndex((m) => m.id === aiMessageId)
                const linkMsg: Message = {
                  id: linkMsgId,
                  role: "assistant",
                  content: "",
                  timestamp: new Date(),
                  connectionLink: {
                    toolName: conn.appName,
                    toolSlug: slug,
                    toolLogo: `https://logos.composio.dev/api/${slug}`,
                    connectionUrl: conn.url,
                    message: `Connect ${conn.appName} to continue`,
                  },
                }
                if (aiIdx === -1) return [...prev, linkMsg]
                const updated = [...prev]
                updated.splice(aiIdx, 0, linkMsg)
                return updated
              })
            }

            // Append remaining clean text (if any)
            if (cleanToken) {
              setMessages((prev) => prev.map((m) => (m.id === aiMessageId ? { ...m, content: m.content + cleanToken } : m)))
            }
          } else {
            setMessages((prev) => prev.map((m) => (m.id === aiMessageId ? { ...m, content: m.content + token } : m)))
          }
        },
        (metadata) => {
          if (metadata.session_id) {
            // Only update URL on the first message (when no session exists yet).
            // Subsequent messages already have the session ID in the URL.
            const isNewSession = !sessionId
            setSessionId(metadata.session_id)
            if (isNewSession) {
              setSessionIdInUrl(metadata.session_id)
            }
            // Notify sidebar to refresh session list (new or updated session)
            notifyChatSessionChanged()
            // Fire a delayed second notification to catch the auto-title update
            // which runs after the stream completes on the backend
            setTimeout(() => notifyChatSessionChanged(), 2000)
          }
          setMessages((prev) =>
            prev.map((m) => {
              if (m.id !== aiMessageId) return m
              const { cleanContent, suggestions } = parseSuggestions(m.content)
              return { ...m, content: cleanContent, suggestions }
            })
          )
          setIsLoading(false)
          setIsStreaming(false)
        },
        () => {
          // On error/abort: keep whatever content was already streamed
          // Only show error if NO content was streamed at all
          setMessages((prev) =>
            prev.map((m) => {
              if (m.id !== aiMessageId) return m
              if (m.content.trim()) return m // Keep existing streamed content
              return { ...m, content: "Something went wrong. Please try again." }
            })
          )
          setIsLoading(false)
          setIsStreaming(false)
        },
        controller.signal,
        // Handle tool_call events — group steps into a single tool message
        (event: ToolCallEvent) => {
          const toolStepsMsgId = `tool-steps-${aiMessageId}`

          setMessages((prev) => {
            // Find the existing grouped tool message for this request
            const existingIdx = prev.findIndex((m) => m.id === toolStepsMsgId)

            const newStep: ToolStep = {
              toolName: event.tool_name,
              toolSlug: event.tool_slug,
              description: event.description,
              status: event.status === "processing" ? "starting" : event.status,
            }

            if (existingIdx !== -1) {
              // We already have a tool steps message — update or append
              const existing = prev[existingIdx]
              const steps = [...(existing.toolSteps ?? [])]

              if (event.status === "complete" || event.status === "error") {
                // Find the in-progress step for this tool and update its status
                const stepIdx = steps.findIndex(
                  (s) =>
                    s.toolName === event.tool_name &&
                    (s.status === "starting" || s.status === "processing"),
                )
                if (stepIdx !== -1) {
                  steps[stepIdx] = {
                    ...steps[stepIdx],
                    status: event.status,
                    description: event.description ?? steps[stepIdx].description,
                  }
                } else {
                  // No matching in-progress step — append as completed
                  steps.push(newStep)
                }
              } else {
                // Starting/processing — append a new step
                steps.push(newStep)
              }

              return prev.map((m) =>
                m.id === toolStepsMsgId ? { ...m, toolSteps: steps } : m,
              )
            }

            // No existing tool steps message — create one before the AI response
            const aiIdx = prev.findIndex((m) => m.id === aiMessageId)
            const toolMsg: Message = {
              id: toolStepsMsgId,
              role: "assistant",
              content: "",
              timestamp: new Date(),
              toolSteps: [newStep],
            }
            if (aiIdx === -1) return [...prev, toolMsg]
            const updated = [...prev]
            updated.splice(aiIdx, 0, toolMsg)
            return updated
          })
        },
        // Handle connection_link events — insert inline OAuth card
        (event: ConnectionLinkEvent) => {
          const linkMsgId = `conn-link-${event.tool_slug}-${Date.now()}`
          setMessages((prev) => {
            const aiIdx = prev.findIndex((m) => m.id === aiMessageId)
            const linkMsg: Message = {
              id: linkMsgId,
              role: "assistant",
              content: "",
              timestamp: new Date(),
              connectionLink: {
                toolName: event.tool_name,
                toolSlug: event.tool_slug,
                toolLogo: event.tool_logo,
                connectionUrl: event.connection_url,
                message: event.message,
              },
            }
            if (aiIdx === -1) return [...prev, linkMsg]
            const updated = [...prev]
            updated.splice(aiIdx, 0, linkMsg)
            return updated
          })
        },
      )
    } catch {
      setIsLoading(false)
      setIsStreaming(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage(input)
    }
  }

  const handleEdit = useCallback((messageId: string, content: string) => {
    const idx = messages.findIndex((m) => m.id === messageId)
    if (idx === -1) return
    const truncated = messages.slice(0, idx)
    messagesRef.current = truncated // Fix H2: sync ref before send
    setMessages(truncated)
    handleSendMessage(content)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages])

  const handleRegenerate = useCallback((assistantIdx: number) => {
    const userMsg = messages.slice(0, assistantIdx).reverse().find((m) => m.role === "user")
    if (!userMsg) return
    const truncated = messages.slice(0, assistantIdx)
    messagesRef.current = truncated // Fix H3: sync ref before send
    setMessages(truncated)
    handleSendMessage(userMsg.content)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages])

  const lastAssistantId = [...messages].reverse().find((m) => m.role === "assistant")?.id

  // ── Shared input area (used in both welcome and chat views) ──────────────
  const inputArea = (
    <InputArea
      input={input}
      isLoading={isLoading}
      isStreaming={isStreaming}
      textareaRef={textareaRef}
      onInputChange={setInput}
      onKeyDown={handleKeyDown}
      onSend={() => handleSendMessage(input)}
      onStop={handleStop}
    />
  )

  // ── Welcome screen ──────────────────────────────────────────────────────
  if (messages.length === 0 && !isLoading) {
    return (
      <div className="flex h-full w-full flex-col bg-background overflow-y-auto">
        <div className="flex-1 flex flex-col items-center justify-center py-12 px-4">
          <WelcomeScreen
            userName={userName}
            onSuggestionClick={handleSendMessage}
            inputSlot={inputArea}
          />
        </div>
      </div>
    )
  }

  // ── Chat view ───────────────────────────────────────────────────────────
  return (
    <div className="flex h-full w-full flex-col bg-background overflow-hidden">
      {/* Messages — scrollable, takes all remaining space */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="max-w-3xl mx-auto w-full px-4 py-6 space-y-6" role="log" aria-live="polite">
          {messages.map((message, idx) =>
            message.connectionLink ? (
              <ConnectionLinkCard
                key={message.id}
                toolName={message.connectionLink.toolName}
                toolSlug={message.connectionLink.toolSlug}
                toolLogo={message.connectionLink.toolLogo}
                connectionUrl={message.connectionLink.connectionUrl}
                message={message.connectionLink.message}
              />
            ) : message.toolSteps && message.toolSteps.length > 0 ? (
              <ToolCard key={message.id} steps={message.toolSteps} />
            ) : (
              <MessageBubble
                key={message.id}
                message={message}
                isLastAssistant={message.id === lastAssistantId}
                isStreaming={isStreaming}
                copiedId={copiedId}
                onCopy={handleCopy}
                onEdit={handleEdit}
                onRegenerate={() => handleRegenerate(idx)}
                onFeedback={(type) => {
                  if (sessionId) sendChatFeedback(sessionId, idx, type).catch(() => {})
                }}
                onSuggestionClick={handleSendMessage}
                isLoading={isLoading}
              />
            ),
          )}

          {isLoading && (!isStreaming || messages[messages.length - 1]?.content === "") && (
            <TypingIndicator />
          )}

          <div ref={scrollRef} />
        </div>
      </div>

      {/* Input footer — pinned at bottom, never moves */}
      <div className="shrink-0 bg-background px-4 py-3">
        {inputArea}
      </div>
    </div>
  )
}
