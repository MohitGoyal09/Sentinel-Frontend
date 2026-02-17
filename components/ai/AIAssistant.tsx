"use client"

import { useState, useRef, useCallback } from "react"
import { Sparkles, X, Send, Bot, User, Calendar, Lightbulb, AlertTriangle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { semanticQuery, generateAgenda, type SemanticQueryResponse, type AgendaResponse } from "@/lib/api"

interface Message {
  id: string
  role: "user" | "assistant" | "system"
  content: string
  sources?: string[]
  reasoning?: string
  isLoading?: boolean
}

type AIAction = "query" | "agenda" | null

interface AIAssistantProps {
  userHash?: string
  userName?: string
  riskLevel?: string
}

const SAMPLE_QUERIES = [
  "Who knows PostgreSQL?",
  "Who on my team is at risk?",
  "Who has been working late nights?",
  "Who is isolated from the team?",
]

export function AIAssistant({ userHash, userName, riskLevel }: AIAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Hi! I'm your AI assistant for employee insights. I can help you:\n\n• **Find experts** - \"Who knows React?\"\n• **Identify risks** - \"Who might be at risk?\"\n• **Team insights** - \"Who works late?\"\n• **Generate 1:1 agendas** - Generate talking points for at-risk employees\n\nAsk me anything about your team!",
    },
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [action, setAction] = useState<AIAction>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const addMessage = useCallback((message: Omit<Message, "id">) => {
    const newMessage: Message = {
      ...message,
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    }
    setMessages((prev) => [...prev, newMessage])
    setTimeout(scrollToBottom, 100)
    return newMessage
  }, [])

  const updateLastMessage = useCallback((updates: Partial<Message>) => {
    setMessages((prev) => {
      const newMessages = [...prev]
      const lastIndex = newMessages.length - 1
      if (lastIndex >= 0 && newMessages[lastIndex].role === "assistant") {
        newMessages[lastIndex] = { ...newMessages[lastIndex], ...updates }
      }
      return newMessages
    })
  }, [])

  const handleQuery = async (query: string) => {
    addMessage({ role: "user", content: query })
    setIsLoading(true)

    const loadingMsg = addMessage({ role: "assistant", content: "", isLoading: true })

    try {
      const response: SemanticQueryResponse = await semanticQuery(query)
      
      let content = response.summary 
        ? `**Summary:** ${response.summary}\n\n`
        : ""

      if (response.results.length > 0) {
        content += `Found ${response.results.length} result${response.results.length > 1 ? "s" : ""}:\n\n`
        
        response.results.forEach((result, idx) => {
          content += `### ${result.user_name || "Unknown User"}`
          if (result.risk_level) {
            content += ` *(${result.risk_level} risk)*`
          }
          content += "\n"
          
          if (result.insights && result.insights.length > 0) {
            result.insights.forEach((insight) => {
              content += `- ${insight}\n`
            })
          }
          
          if (result.suggested_action) {
            content += `\n💡 **Suggested:** ${result.suggested_action}\n`
          }
          
          content += "\n"
        })
      } else {
        content += "No results found for your query."
      }

      updateLastMessage({ 
        content, 
        isLoading: false,
        sources: response.results.map(r => r.user_name || "Unknown"),
      })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to execute query"
      updateLastMessage({ 
        content: `❌ Error: ${errorMessage}`, 
        isLoading: false,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleAgenda = async () => {
    if (!userHash) return

    addMessage({ role: "user", content: `Generate 1:1 agenda for ${userName || "this employee"}` })
    setIsLoading(true)

    addMessage({ role: "assistant", content: "", isLoading: true })

    try {
      const response: AgendaResponse = await generateAgenda(userHash)
      
      let content = `## 1:1 Agenda for ${userName || "Employee"}\n\n`
      content += `**Pattern:** ${response.pattern}\n`
      content += `**Context:** ${response.context}\n\n`
      content += `### Talking Points:\n\n`
      
      response.talking_points.forEach((point) => {
        content += `${point.id}. "${point.text}"\n\n`
      })

      content += `---\n\n`
      content += `💡 **Tip:** Start with open-ended questions and listen actively.`

      updateLastMessage({ content, isLoading: false })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to generate agenda"
      updateLastMessage({ 
        content: `❌ Error: ${errorMessage}`, 
        isLoading: false,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const query = input.trim()
    setInput("")

    if (action === "agenda") {
      setAction(null)
      await handleAgenda()
    } else {
      await handleQuery(query)
    }
  }

  const handleSampleClick = async (sample: string) => {
    if (isLoading) return
    setInput(sample)
    await handleQuery(sample)
  }

  const handleActionClick = (selectedAction: AIAction) => {
    if (isLoading) return
    setAction(selectedAction)
    if (selectedAction === "agenda") {
      handleAgenda()
    }
  }

  return (
    <Card className="border-border bg-card shadow-sm h-[600px] flex flex-col">
      <CardHeader className="pb-3 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">🤖</span>
            <CardTitle className="text-base font-semibold text-foreground">
              AI Assistant
            </CardTitle>
          </div>
          <Badge variant="outline" className="text-[10px] font-semibold bg-purple-500/10 text-purple-500 border-purple-500/20">
            <Sparkles className="mr-1 h-3 w-3" />
            AI
          </Badge>
        </div>
      </CardHeader>
      
      <ScrollArea className="flex-1 p-4">
        <div className="flex flex-col gap-4">
          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}
          
          {messages.length === 1 && (
            <div className="flex flex-col gap-2">
              <p className="text-xs font-medium text-muted-foreground">Try asking:</p>
              <div className="flex flex-wrap gap-2">
                {SAMPLE_QUERIES.map((sample) => (
                  <button
                    key={sample}
                    onClick={() => handleSampleClick(sample)}
                    disabled={isLoading}
                    className={cn(
                      "rounded-full px-3 py-1.5 text-xs transition-colors",
                      "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                    )}
                  >
                    {sample}
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {userHash && userName && riskLevel && messages.length > 1 && (
            <div className="flex flex-col gap-2 pt-2 border-t">
              <p className="text-xs font-medium text-muted-foreground">Quick actions:</p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleActionClick("agenda")}
                  disabled={isLoading}
                  className={cn(
                    "gap-1.5 text-xs",
                    riskLevel === "CRITICAL" && "border-amber-500/50 text-amber-600",
                    riskLevel === "ELEVATED" && "border-amber-500/30 text-amber-600"
                  )}
                >
                  <Calendar className="h-3.5 w-3.5" />
                  Generate 1:1 Agenda
                </Button>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      <CardContent className="pt-4 border-t">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={action === "agenda" ? "Generating agenda..." : 'Ask about your team...'}
            disabled={isLoading}
            className={cn(
              "flex-1 rounded-lg border border-input bg-background px-4 py-2 text-sm",
              "placeholder:text-muted-foreground",
              "focus:outline-none focus:ring-2 focus:ring-purple-500/20",
              "disabled:opacity-50"
            )}
          />
          <Button
            type="submit"
            disabled={isLoading || !input.trim()}
            size="icon"
            className="bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600"
          >
            {isLoading ? (
              <Sparkles className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "user"
  const isLoading = message.isLoading

  return (
    <div
      className={cn(
        "flex w-full max-w-[90%] flex-col gap-1",
        isUser ? "ml-auto items-end" : "mr-auto items-start"
      )}
    >
      <div className="flex items-center gap-2">
        {!isUser && <Bot className="h-4 w-4 text-purple-500" />}
        {isUser && <User className="h-4 w-4 text-blue-500" />}
        <span className="text-xs text-muted-foreground">
          {isUser ? "You" : "Assistant"}
        </span>
      </div>
      
      <div
        className={cn(
          "rounded-lg px-4 py-3 text-sm",
          isUser 
            ? "bg-blue-500/10 text-foreground"
            : "bg-muted/50 text-foreground"
        )}
      >
        {isLoading ? (
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 animate-spin text-purple-500" />
            <span className="text-muted-foreground">Thinking...</span>
          </div>
        ) : (
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <MarkdownContent content={message.content} />
          </div>
        )}
      </div>

      {!isLoading && message.sources && message.sources.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-1">
          <span className="text-[10px] text-muted-foreground">Sources:</span>
          {message.sources.map((source, idx) => (
            <Badge key={idx} variant="outline" className="text-[10px] py-0">
              {source}
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}

function MarkdownContent({ content }: { content: string }) {
  const lines = content.split("\n")
  
  return (
    <div className="flex flex-col gap-1">
      {lines.map((line, idx) => {
        const trimmed = line.trim()
        
        if (trimmed.startsWith("### ")) {
          return (
            <h4 key={idx} className="font-semibold text-foreground mt-2 mb-1">
              {trimmed.replace("### ", "")}
            </h4>
          )
        }
        
        if (trimmed.startsWith("## ")) {
          return (
            <h3 key={idx} className="font-bold text-foreground text-base mt-3 mb-2">
              {trimmed.replace("## ", "")}
            </h3>
          )
        }
        
        if (trimmed.startsWith("**") && trimmed.endsWith("**")) {
          return (
            <p key={idx} className="font-semibold text-foreground">
              {trimmed.replace(/\*\*(.*)\*\*/, "$1")}
            </p>
          )
        }
        
        if (trimmed.startsWith("- ")) {
          return (
            <div key={idx} className="flex gap-2">
              <span className="text-purple-500">•</span>
              <span>{trimmed.replace("- ", "")}</span>
            </div>
          )
        }
        
        if (/^\d+\.\s/.test(trimmed)) {
          const match = trimmed.match(/^(\d+)\.\s(.*)$/)
          if (match) {
            return (
              <div key={idx} className="flex gap-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-500/10 text-xs font-medium text-amber-600">
                  {match[1]}
                </span>
                <span>{match[2]}</span>
              </div>
            )
          }
        }
        
        if (trimmed.startsWith("💡")) {
          return (
            <div key={idx} className="flex gap-2 bg-amber-500/10 rounded-md p-2 mt-2">
              <Lightbulb className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
              <span>{trimmed.replace("💡", "").trim()}</span>
            </div>
          )
        }
        
        if (trimmed.startsWith("❌")) {
          return (
            <div key={idx} className="flex gap-2 text-red-500">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{trimmed.replace("❌", "").trim()}</span>
            </div>
          )
        }
        
        if (trimmed.startsWith("---")) {
          return <hr key={idx} className="my-2 border-border" />
        }
        
        if (trimmed === "") {
          return <br key={idx} />
        }
        
        return <span key={idx}>{line}</span>
      })}
    </div>
  )
}
