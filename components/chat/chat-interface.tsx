"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { WelcomeScreen } from "./welcome-screen"
import { ToolCard } from "./tool-card"
import { markdownComponents } from "./markdown-components"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import {
  ArrowUp,
  Copy,
  Check,
  ThumbsUp,
  ThumbsDown,
  RotateCcw,
  MessageSquarePlus,
  Square,
  Plus,
  Sparkles,
  Pencil,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { chatWithSentinelStream, sendChatFeedback, getChatSession } from "@/lib/api"
import { useAuth } from "@/contexts/auth-context"
import { toast } from "sonner"

// ─── Types ───────────────────────────────────────────────────────────────────

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
  suggestions?: string[]
  toolName?: string
  toolStatus?: "starting" | "processing" | "complete" | "error"
  toolArgs?: Record<string, unknown>
  toolResult?: string
}

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

function stripPartialSuggestions(content: string): string {
  let cleaned = content.replace(/<suggestions>[\s\S]*?<\/suggestions>/g, "")
  cleaned = cleaned.replace(/<suggestions>[\s\S]*$/, "")
  cleaned = cleaned.replace(/<suggest[^>]*$/, "")
  return cleaned.trim()
}

// ─── Small Sub-components ────────────────────────────────────────────────────

function SentinelAvatar({ size = 28 }: { size?: number }) {
  return (
    <div
      className="shrink-0 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold select-none"
      style={{ width: size, height: size, fontSize: size * 0.4 }}
      aria-hidden="true"
    >
      S
    </div>
  )
}

function TypingIndicator() {
  return (
    <div className="flex items-start gap-3 py-4 max-w-3xl mx-auto w-full px-4 animate-in fade-in slide-in-from-bottom-1 duration-200">
      <SentinelAvatar />
      <div className="flex items-center gap-1.5 pt-1.5">
        {[0, 150, 300].map((delay) => (
          <span
            key={delay}
            className="h-2 w-2 rounded-full bg-muted-foreground/50 dot-pulse"
            style={{ animationDelay: `${delay}ms` }}
          />
        ))}
      </div>
    </div>
  )
}

// ─── Message Bubble ──────────────────────────────────────────────────────────

interface MessageBubbleProps {
  message: Message
  isLastAssistant: boolean
  isStreaming: boolean
  copiedId: string | null
  messageIndex: number
  onCopy: (content: string, id: string) => void
  onRegenerate: () => void
  onEdit: (messageId: string, content: string) => void
  onFeedback: (type: "positive" | "negative") => void
  onSuggestionClick: (text: string) => void
  isLoading: boolean
}

function MessageBubble({
  message,
  isLastAssistant,
  isStreaming,
  copiedId,
  onCopy,
  onRegenerate,
  onEdit,
  onFeedback,
  onSuggestionClick,
  isLoading,
}: MessageBubbleProps) {
  const isUser = message.role === "user"
  const showCursor = isStreaming && isLastAssistant && message.content.length > 0
  const displayContent =
    isStreaming && isLastAssistant ? stripPartialSuggestions(message.content) : message.content

  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(message.content)
  const editRef = useRef<HTMLTextAreaElement>(null)

  // Fix H4: reset edit state if message content changes externally (e.g. new messages arrive)
  useEffect(() => {
    if (isEditing) {
      setIsEditing(false)
      setEditValue(message.content)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [message.content])

  useEffect(() => {
    if (isEditing && editRef.current) {
      editRef.current.focus()
      editRef.current.selectionStart = editRef.current.value.length
    }
  }, [isEditing])

  const handleEditSubmit = () => {
    const trimmed = editValue.trim()
    if (!trimmed) return
    setIsEditing(false)
    onEdit(message.id, trimmed)
  }

  const handleEditKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleEditSubmit()
    }
    if (e.key === "Escape") {
      setIsEditing(false)
      setEditValue(message.content)
    }
  }

  if (isUser) {
    return (
      <div className="flex w-full justify-end py-3 max-w-3xl mx-auto px-4 animate-in fade-in slide-in-from-bottom-1 duration-200 group/msg">
        <div className="flex items-end gap-2 max-w-[80%]">
          {!isEditing && (
            <button
              title="Edit message"
              onClick={() => {
                setEditValue(message.content)
                setIsEditing(true)
              }}
              className="opacity-0 group-hover/msg:opacity-100 h-6 w-6 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground transition-all duration-150 shrink-0 mb-1"
            >
              <Pencil className="h-3 w-3" />
            </button>
          )}
          {isEditing ? (
            <div className="flex flex-col gap-2 w-full">
              <textarea
                ref={editRef}
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={handleEditKeyDown}
                rows={3}
                className="w-full resize-none rounded-2xl rounded-br-sm px-4 py-2.5 text-sm font-medium bg-primary text-primary-foreground placeholder:text-primary-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary-foreground/30"
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => {
                    setIsEditing(false)
                    setEditValue(message.content)
                  }}
                  className="px-3 py-1 text-xs rounded-lg border border-border text-muted-foreground hover:text-foreground transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEditSubmit}
                  disabled={!editValue.trim()}
                  className="px-3 py-1 text-xs rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Send
                </button>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl rounded-br-sm px-4 py-2.5 text-sm whitespace-pre-wrap font-medium bg-primary text-primary-foreground">
              {message.content}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="flex w-full flex-col gap-1 group py-3 max-w-3xl mx-auto px-4 animate-in fade-in slide-in-from-bottom-1 duration-200">
      <div className="flex items-start gap-3">
        <SentinelAvatar />
        <div className="flex-1 min-w-0 text-sm leading-relaxed text-foreground/90 pt-0.5">
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
            {displayContent}
          </ReactMarkdown>
          {showCursor && (
            <span className="inline-block w-2 h-4 bg-primary/70 animate-pulse ml-0.5 align-text-bottom rounded-sm" />
          )}
        </div>
      </div>

      {!isStreaming && message.content.length > 0 && (
        <>
          <div className="flex items-center gap-1 mt-1 ml-10 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
            <button
              title="Copy"
              onClick={() => onCopy(message.content, message.id)}
              className="h-7 w-7 flex items-center justify-center rounded-lg text-muted-foreground/50 hover:text-foreground hover:bg-foreground/5 transition-all duration-150"
            >
              {copiedId === message.id ? <Check className="h-3.5 w-3.5 text-primary" /> : <Copy className="h-3.5 w-3.5" />}
            </button>
            {isLastAssistant && (
              <button
                title="Regenerate"
                onClick={onRegenerate}
                className="h-7 w-7 flex items-center justify-center rounded-lg text-muted-foreground/50 hover:text-foreground hover:bg-foreground/5 transition-all duration-150"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </button>
            )}
            <div className="h-4 w-px bg-border mx-1" />
            <button title="Helpful" onClick={() => onFeedback("positive")} className="h-7 w-7 flex items-center justify-center rounded-lg text-muted-foreground/50 hover:text-foreground hover:bg-foreground/5 transition-all duration-150">
              <ThumbsUp className="h-3.5 w-3.5" />
            </button>
            <button title="Not helpful" onClick={() => onFeedback("negative")} className="h-7 w-7 flex items-center justify-center rounded-lg text-muted-foreground/50 hover:text-foreground hover:bg-foreground/5 transition-all duration-150">
              <ThumbsDown className="h-3.5 w-3.5" />
            </button>
          </div>

          {message.suggestions && message.suggestions.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2 ml-10">
              {message.suggestions.map((suggestion, idx) => (
                <button
                  key={idx}
                  onClick={() => onSuggestionClick(suggestion)}
                  disabled={isLoading}
                  className="border border-border hover:border-primary/40 hover:bg-primary/5 rounded-full px-3.5 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}
        </>
      )}
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
  }, [])

  const handleStop = useCallback(() => {
    abortControllerRef.current?.abort()
    setIsStreaming(false)
    setIsLoading(false)
  }, [])

  // Load session from URL (Fix H5: use ref to avoid stale closure race)
  const loadedSessionRef = useRef<string | undefined>(undefined)
  useEffect(() => {
    if (!initialSessionId) return
    if (loadedSessionRef.current === initialSessionId) return
    loadedSessionRef.current = initialSessionId

    getChatSession(initialSessionId)
      .then((data) => {
        const msgs: Message[] = data.turns.map((turn, i) => ({
          id: `${turn.id || i}`,
          role: turn.role as "user" | "assistant",
          content: turn.content,
          timestamp: turn.created_at ? new Date(turn.created_at) : new Date(),
        }))
        setMessages(msgs)
        setSessionId(initialSessionId)
      })
      .catch(() => { /* start fresh */ })
  }, [initialSessionId])

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + "px"
    }
  }, [input])

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current && messages.length > 0) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" })
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
          setMessages((prev) => prev.map((m) => (m.id === aiMessageId ? { ...m, content: m.content + token } : m)))
        },
        (metadata) => {
          if (metadata.session_id) {
            setSessionId(metadata.session_id)
            window.history.replaceState(null, '', `/ask-sentinel?session=${metadata.session_id}`)
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
          setMessages((prev) =>
            prev.map((m) => (m.id === aiMessageId ? { ...m, content: "Sorry, I encountered an error. Please try again." } : m))
          )
          setIsLoading(false)
          setIsStreaming(false)
        },
        controller.signal,
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

  // ── Shared input area ────────────────────────────────────────────────────
  const inputArea = (
    <div className="max-w-3xl mx-auto w-full px-4">
      <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden focus-within:border-primary/40 transition-all duration-200">
        {/* Textarea */}
        <textarea
          ref={textareaRef}
          className="w-full resize-none bg-transparent border-none focus:ring-0 focus:outline-none p-4 pb-2 text-sm placeholder:text-muted-foreground/50 text-foreground leading-relaxed min-h-[24px] max-h-[200px]"
          placeholder="Ask about team health, burnout risks, or performance..."
          value={input}
          onChange={(e) => { if (e.target.value.length <= MAX_INPUT_LENGTH) setInput(e.target.value) }}
          onKeyDown={handleKeyDown}
          rows={1}
          maxLength={MAX_INPUT_LENGTH}
        />

        {/* Toolbar bar inside the card */}
        <div className="flex items-center justify-between px-3 py-2">
          {/* LEFT side */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => toast("File upload coming soon")}
              className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:bg-muted/80 transition-colors cursor-pointer active:scale-[0.97]"
              title="Attach file"
            >
              <Plus className="h-4 w-4" />
            </button>
            <span className="text-xs text-muted-foreground flex items-center gap-1.5 select-none">
              <Sparkles className="h-3 w-3" />
              Gemini 2.5 Flash
            </span>
          </div>

          {/* RIGHT side */}
          <div className="flex items-center gap-2">
            {input.length > 0 && (
              <span className={cn(
                "text-[10px] transition-colors tabular-nums",
                input.length > MAX_INPUT_LENGTH * 0.9 ? "text-amber-500 font-medium"
                  : input.length === MAX_INPUT_LENGTH ? "text-red-500 font-semibold"
                  : "text-muted-foreground/40"
              )}>
                {input.length}/{MAX_INPUT_LENGTH}
              </span>
            )}
            {isStreaming ? (
              <button
                onClick={handleStop}
                className="h-8 w-8 rounded-full flex items-center justify-center transition-colors cursor-pointer active:scale-[0.97] bg-red-500/20 text-red-400 hover:bg-red-500/30"
                title="Stop generating"
              >
                <Square className="h-3.5 w-3.5" />
              </button>
            ) : (
              <button
                disabled={!input.trim() || isLoading || input.length > MAX_INPUT_LENGTH}
                onClick={() => handleSendMessage(input)}
                className={cn(
                  "h-8 w-8 rounded-full flex items-center justify-center transition-colors cursor-pointer active:scale-[0.97]",
                  input.trim() && !isLoading
                    ? "bg-primary text-primary-foreground hover:bg-primary/90"
                    : "bg-muted text-muted-foreground cursor-not-allowed"
                )}
                title="Send message"
              >
                <ArrowUp className="h-4 w-4" strokeWidth={2.5} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )

  // ── Welcome screen ──────────────────────────────────────────────────────
  if (messages.length === 0 && !isLoading) {
    return (
      <div className="flex h-full w-full flex-col bg-background relative overflow-y-auto">
        <div className="absolute top-4 right-4 z-10">
          <button onClick={handleNewChat} className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors cursor-pointer active:scale-[0.97]">
            <MessageSquarePlus className="h-3.5 w-3.5" />
            New Chat
          </button>
        </div>
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
    <div className="flex h-full w-full flex-col bg-background overflow-hidden relative">
      <div className="absolute top-4 right-4 z-10">
        <button onClick={handleNewChat} className="flex items-center gap-1.5 rounded-lg border border-border bg-background/80 backdrop-blur-sm px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:border-primary/30 hover:bg-primary/5 transition-all duration-150">
          <MessageSquarePlus className="h-3.5 w-3.5" />
          New Chat
        </button>
      </div>

      <div className="flex-1 overflow-y-auto pt-4 pb-4">
        <div className="flex flex-col">
          {messages.map((message, idx) =>
            message.toolName ? (
              <ToolCard key={message.id} message={message} />
            ) : (
              <MessageBubble
                key={message.id}
                message={message}
                isLastAssistant={message.id === lastAssistantId}
                isStreaming={isStreaming}
                copiedId={copiedId}
                messageIndex={idx}
                onCopy={handleCopy}
                onEdit={handleEdit}
                onRegenerate={() => handleRegenerate(idx)}
                onFeedback={(type) => { if (sessionId) sendChatFeedback(sessionId, idx, type).catch(() => {}) }}
                onSuggestionClick={handleSendMessage}
                isLoading={isLoading}
              />
            )
          )}
          {isLoading && (!isStreaming || messages[messages.length - 1]?.content === "") && <TypingIndicator />}
          <div ref={scrollRef} />
        </div>
      </div>

      <div className="shrink-0 bg-background/90 backdrop-blur-xl border-t border-border/50 px-4 py-4">
        {inputArea}
      </div>
    </div>
  )
}
