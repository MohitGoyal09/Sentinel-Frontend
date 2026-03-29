"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { WelcomeScreen } from "./welcome-screen"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import {
  Paperclip,
  Globe,
  Sparkles,
  ArrowUp,
  Copy,
  Check,
  ThumbsUp,
  ThumbsDown,
  RotateCcw,
  Shield,
  MessageSquarePlus
} from "lucide-react"
import { cn } from "@/lib/utils"
import { chatWithSentinelStream } from "@/lib/api"
import { useAuth } from "@/contexts/auth-context"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
  suggestions?: string[]
}

interface ChatInterfaceProps {
  initialQuery?: string
  userName?: string
}

function parseSuggestions(content: string): { cleanContent: string; suggestions: string[] } {
  const match = content.match(/<suggestions>\s*([\s\S]*?)\s*<\/suggestions>/)
  if (!match) return { cleanContent: content, suggestions: [] }

  const cleanContent = content.replace(/<suggestions>[\s\S]*?<\/suggestions>/, "").trim()
  const suggestions = match[1]
    .split("\n")
    .map(line => line.replace(/^-\s*/, "").trim())
    .filter(line => line.length > 0)
    .slice(0, 3)

  return { cleanContent, suggestions }
}

// Strip incomplete <suggestions> tags during streaming so they don't flash
function stripPartialSuggestions(content: string): string {
  // Remove complete <suggestions>...</suggestions> blocks
  let cleaned = content.replace(/<suggestions>[\s\S]*?<\/suggestions>/g, "")
  // Remove incomplete opening <suggestions> tag at the end
  cleaned = cleaned.replace(/<suggestions>[\s\S]*$/, "")
  // Remove partial tag being typed like "<su", "<sugge", etc.
  cleaned = cleaned.replace(/<suggest[^>]*$/, "")
  return cleaned.trim()
}

export function ChatInterface({ initialQuery, userName: propUserName = "User" }: ChatInterfaceProps) {
  const { user } = useAuth()
  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || propUserName
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [conversationId, setConversationId] = useState<string | undefined>()
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [isStreaming, setIsStreaming] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const initialized = useRef(false)

  const handleCopy = useCallback(async (content: string, messageId: string) => {
    await navigator.clipboard.writeText(content)
    setCopiedId(messageId)
    setTimeout(() => setCopiedId(null), 2000)
  }, [])

  const handleNewChat = useCallback(() => {
    setMessages([])
    setConversationId(undefined)
    setInput("")
    setIsStreaming(false)
    setIsLoading(false)
    localStorage.removeItem("sentinel_chat_messages")
    localStorage.removeItem("sentinel_conversation_id")
  }, [])

  // Load persisted messages on mount
  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true
      try {
        const saved = localStorage.getItem("sentinel_chat_messages")
        const savedConvId = localStorage.getItem("sentinel_conversation_id")
        if (saved) {
          const parsed = JSON.parse(saved)
          if (Array.isArray(parsed) && parsed.length > 0) {
            setMessages(parsed.map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) })))
          }
        }
        if (savedConvId) setConversationId(savedConvId)
      } catch { /* ignore corrupt storage */ }
    }
  }, [])

  // Persist messages to localStorage
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem("sentinel_chat_messages", JSON.stringify(messages))
      if (conversationId) localStorage.setItem("sentinel_conversation_id", conversationId)
    }
  }, [messages, conversationId])

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + 'px'
    }
  }, [input])

  // Auto-scroll on new messages and during streaming
  useEffect(() => {
    if (scrollRef.current && messages.length > 0) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages])

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: text,
      timestamp: new Date(),
    }

    // Create placeholder assistant message for streaming
    const aiMessageId = (Date.now() + 1).toString()
    const aiMessage: Message = {
      id: aiMessageId,
      role: "assistant",
      content: "",
      timestamp: new Date(),
    }

    setMessages(prev => [...prev, userMessage, aiMessage])
    setInput("")
    setIsLoading(true)
    setIsStreaming(true)

    try {
      const history = messages.slice(-10).map(m => ({
        role: m.role,
        content: m.content,
      }))

      await chatWithSentinelStream(
        {
          message: text,
          conversation_id: conversationId,
          context: { conversation_history: history },
        },
        // onToken — append each token to the assistant message
        (token) => {
          setMessages(prev =>
            prev.map(m =>
              m.id === aiMessageId
                ? { ...m, content: m.content + token }
                : m
            )
          )
        },
        // onDone — parse suggestions and update metadata
        (metadata) => {
          if (metadata.conversation_id) {
            setConversationId(metadata.conversation_id)
          }
          // Parse suggestions from completed response
          setMessages(prev =>
            prev.map(m => {
              if (m.id === aiMessageId) {
                const { cleanContent, suggestions } = parseSuggestions(m.content)
                return { ...m, content: cleanContent, suggestions }
              }
              return m
            })
          )
          setIsLoading(false)
          setIsStreaming(false)
        },
        // onError
        (error) => {
          setMessages(prev =>
            prev.map(m =>
              m.id === aiMessageId
                ? { ...m, content: "Sorry, I encountered an error. Please try again." }
                : m
            )
          )
          setIsLoading(false)
          setIsStreaming(false)
        }
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

  if (messages.length === 0 && !isLoading) {
    return <WelcomeScreen onSendMessage={handleSendMessage} userName={userName} />
  }

  return (
    <div className="flex flex-col h-full w-full max-w-5xl mx-auto relative pl-4 lg:pl-8">
      {/* Chat header with New Chat button */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-green-500" />
          <span className="text-sm font-medium text-foreground/80">Ask Sentinel</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleNewChat}
          className="text-muted-foreground hover:text-foreground gap-2"
        >
          <MessageSquarePlus className="h-4 w-4" />
          <span className="hidden sm:inline">New Chat</span>
        </Button>
      </div>

      <ScrollArea className="flex-1 w-full h-full">
        <div className="flex flex-col gap-8 py-8 px-4 w-full max-w-3xl mx-auto min-h-full pb-32">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex w-full flex-col gap-2 group",
                message.role === "user" ? "items-end" : "items-start"
              )}
            >
              {message.role === "assistant" && (
                <div className="flex items-center gap-2 px-1 opacity-80">
                  <div className="h-6 w-6 rounded-full bg-green-500/10 text-green-500 flex items-center justify-center border border-green-500/20">
                    <Shield className="h-3.5 w-3.5" />
                  </div>
                  <span className="text-sm font-medium text-foreground/80">Sentinel</span>
                </div>
              )}
              <div className={cn(
                "flex flex-col gap-1.5 max-w-[100%]",
                message.role === "user" ? "items-end" : "items-start w-full"
              )}>
                <div className={cn(
                  "px-5 py-3.5 text-[15px] leading-relaxed",
                  message.role === "user"
                  ? "bg-[#2563eb] text-white rounded-2xl rounded-tr-sm max-w-[85%]"
                  : "bg-transparent text-foreground px-0 py-0 w-full"
                )}>
                  {message.role === "assistant" ? (
                    <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-2 prose-headings:my-3 prose-ul:my-2 prose-ol:my-2 prose-li:my-0.5 prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-pre:bg-muted prose-pre:border prose-pre:border-border">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {isStreaming && message.id === messages[messages.length - 1]?.id
                          ? stripPartialSuggestions(message.content)
                          : message.content}
                      </ReactMarkdown>
                      {/* Blinking cursor during streaming */}
                      {isStreaming && message.id === messages[messages.length - 1]?.id && message.content.length > 0 && (
                        <span className="inline-block w-2 h-4 bg-green-500/70 animate-pulse ml-0.5 align-text-bottom rounded-sm" />
                      )}
                    </div>
                  ) : (
                    <div className="whitespace-pre-wrap">{message.content}</div>
                  )}
                </div>
                {message.role === "assistant" && !isStreaming && message.content.length > 0 && (
                  <>
                    <div className="flex items-center gap-2 mt-2 pl-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground/60" title="Copy" onClick={() => handleCopy(message.content, message.id)}>
                        {copiedId === message.id ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground/60" title="Regenerate" onClick={() => handleSendMessage(messages[messages.indexOf(message) - 1]?.content || "")}>
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                      <div className="h-4 w-px bg-border/40 mx-1"></div>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground/60" title="Helpful">
                        <ThumbsUp className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground/60" title="Not Helpful">
                        <ThumbsDown className="h-4 w-4" />
                      </Button>
                    </div>
                    {/* Suggestion chips */}
                    {message.suggestions && message.suggestions.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3 pl-1">
                        {message.suggestions.map((suggestion, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleSendMessage(suggestion)}
                            disabled={isLoading}
                            className="text-xs px-3 py-1.5 rounded-full border border-border bg-muted/50
                                       text-muted-foreground hover:bg-accent hover:text-foreground
                                       transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          ))}
          {/* Thinking indicator — only before first token */}
          {isLoading && (!isStreaming || messages[messages.length - 1]?.content === "") && (
            <div className="flex w-full flex-col gap-3">
              <div className="flex items-center gap-2 px-1">
                <div className="h-6 w-6 rounded-full bg-green-500/10 text-green-500 flex items-center justify-center border border-green-500/20">
                  <Shield className="h-3.5 w-3.5 animate-pulse" />
                </div>
                <span className="text-sm font-medium text-muted-foreground">Sentinel is thinking...</span>
              </div>
            </div>
          )}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      <div className="fixed bottom-0 left-0 lg:left-[260px] right-0 px-4 lg:px-6 pb-4 lg:pb-6 z-40">
        <div className="max-w-4xl mx-auto">
          <div className="relative bg-background/80 backdrop-blur-xl border border-border rounded-3xl shadow-2xl">
            <div className="flex flex-col p-2">
              <textarea
                ref={textareaRef}
                className="w-full bg-transparent px-4 py-3 text-[15px] placeholder:text-muted-foreground/50 focus:outline-none resize-none min-h-[50px] max-h-[200px] text-foreground"
                placeholder="Ask a follow up..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={1}
              />
              <div className="flex items-center justify-between px-2 pb-1.5 mt-1">
                <div className="flex items-center gap-1">
                  <Button type="button" variant="ghost" size="icon" className="h-8 w-8 rounded-full text-muted-foreground/60">
                    <Paperclip className="h-4 w-4" />
                  </Button>
                  <Button type="button" variant="ghost" size="icon" className="h-8 w-8 rounded-full text-muted-foreground/60">
                    <Globe className="h-4 w-4" />
                  </Button>
                  <div className="h-4 w-px bg-border mx-1"></div>
                  <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-muted border border-border">
                    <Shield className="h-3.5 w-3.5 text-green-400" />
                    <span className="text-[11px] font-medium text-muted-foreground">Sentinel Pro</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {input.length > 0 && (
                    <span className="text-[10px] text-muted-foreground">
                      {input.length} / 2000
                    </span>
                  )}
                  <Button
                    type="submit"
                    size="icon"
                    disabled={!input.trim() || isLoading}
                    className="h-9 w-9 rounded-full bg-green-600 hover:bg-green-700 disabled:opacity-50"
                    onClick={() => handleSendMessage(input)}
                  >
                    <ArrowUp className="h-4 w-4 text-white" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
