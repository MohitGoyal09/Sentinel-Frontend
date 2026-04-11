"use client"

import { useState, useRef, useEffect } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { Pencil } from "lucide-react"
import { cn } from "@/lib/utils"
import { markdownComponents } from "./markdown-components"
import { MessageActions } from "./message-actions"
import type { Message } from "@/types/chat"

// ─── Types ───────────────────────────────────────────────────────────────────

interface MessageBubbleProps {
  message: Message
  isLastAssistant: boolean
  isStreaming: boolean
  copiedId: string | null
  onCopy: (content: string, id: string) => void
  onRegenerate: () => void
  onEdit: (messageId: string, content: string) => void
  onFeedback: (type: "positive" | "negative") => void
  onSuggestionClick: (text: string) => void
  isLoading: boolean
}

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Strip completed and partial <suggestions> tags from displayed content */
function stripSuggestionTags(content: string): string {
  // Strip complete <suggestions>...</suggestions> blocks
  let cleaned = content.replace(/<suggestions>[\s\S]*?<\/suggestions>/g, "")
  // Strip partial opening tag at end of stream (e.g. "<suggestions>- item\n- it")
  cleaned = cleaned.replace(/<suggestions>[\s\S]*$/, "")
  // Strip incomplete tag being typed (e.g. "<suggest" or "<suggestio")
  cleaned = cleaned.replace(/<suggest[^>]*$/, "")
  return cleaned.trim()
}

/** Parse suggestion items from complete <suggestions> blocks */
function parseSuggestionsFromContent(content: string): string[] {
  const match = content.match(/<suggestions>\s*([\s\S]*?)\s*<\/suggestions>/)
  if (!match) return []
  return match[1]
    .split("\n")
    .map((line) => line.replace(/^-\s*/, "").trim())
    .filter((line) => line.length > 0)
    .slice(0, 3)
}

// ─── Sentinel Avatar ────────────────────────────────────────────────────────

function SentinelAvatar() {
  return (
    <div
      className="shrink-0 w-7 h-7 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-[11px] font-bold select-none"
      aria-hidden="true"
    >
      S
    </div>
  )
}

// ─── User Message ───────────────────────────────────────────────────────────

function UserMessage({
  message,
  onEdit,
}: {
  message: Message
  onEdit: (messageId: string, content: string) => void
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(message.content)
  const editRef = useRef<HTMLTextAreaElement>(null)

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

  return (
    <div className="flex w-full justify-end group/user animate-in fade-in slide-in-from-bottom-1 duration-200">
      <div className="flex items-end gap-2 max-w-[75%]">
        {!isEditing && (
          <button
            title="Edit message"
            onClick={() => {
              setEditValue(message.content)
              setIsEditing(true)
            }}
            className="opacity-0 group-hover/user:opacity-100 h-6 w-6 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground transition-all duration-150 shrink-0 mb-1.5"
          >
            <Pencil className="h-3 w-3" />
          </button>
        )}

        {isEditing ? (
          <div className="flex flex-col gap-2 w-full min-w-[280px]">
            <textarea
              ref={editRef}
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={handleEditKeyDown}
              rows={3}
              className="w-full resize-none rounded-2xl rounded-br-md px-4 py-3 text-sm bg-primary text-primary-foreground placeholder:text-primary-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 leading-relaxed"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setIsEditing(false)
                  setEditValue(message.content)
                }}
                className="px-3 py-1 text-xs rounded-md border border-border text-muted-foreground hover:text-foreground transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleEditSubmit}
                disabled={!editValue.trim()}
                className="px-3 py-1 text-xs rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Send
              </button>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl rounded-br-md px-4 py-2.5 text-sm whitespace-pre-wrap bg-primary text-primary-foreground leading-relaxed">
            {message.content}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Assistant Message ──────────────────────────────────────────────────────

function AssistantMessage({
  message,
  isLastAssistant,
  isStreaming,
  copiedId,
  onCopy,
  onRegenerate,
  onFeedback,
  onSuggestionClick,
  isLoading,
}: Omit<MessageBubbleProps, "onEdit">) {
  const showCursor = isStreaming && isLastAssistant && message.content.length > 0
  // Always strip suggestion tags from displayed content — both during streaming
  // and for completed/history messages that may contain raw tags
  const displayContent = stripSuggestionTags(message.content)
  // Parse suggestions: prefer pre-parsed from metadata, fall back to parsing from content
  const parsedSuggestions =
    message.suggestions && message.suggestions.length > 0
      ? message.suggestions
      : !isStreaming || !isLastAssistant
        ? parseSuggestionsFromContent(message.content)
        : []

  return (
    <div className="flex w-full flex-col group/assistant animate-in fade-in slide-in-from-bottom-1 duration-200">
      <div className="flex items-start gap-3">
        <SentinelAvatar />

        <div className="flex-1 min-w-0 pt-0.5">
          {/* Markdown content */}
          <div className="text-sm leading-relaxed text-foreground/90 prose-sentinel">
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
              {displayContent}
            </ReactMarkdown>
            {showCursor && (
              <span className="inline-block w-1.5 h-4 bg-primary/60 animate-pulse ml-0.5 align-text-bottom rounded-sm" />
            )}
          </div>

          {/* Actions row */}
          {!isStreaming && message.content.length > 0 && (
            <>
              <MessageActions
                messageId={message.id}
                copiedId={copiedId}
                isLastAssistant={isLastAssistant}
                onCopy={(id) => onCopy(message.content, id)}
                onRegenerate={onRegenerate}
                onFeedback={onFeedback}
              />

              {/* Follow-up suggestions */}
              {parsedSuggestions.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-3">
                  {parsedSuggestions.map((suggestion, idx) => (
                    <button
                      key={idx}
                      onClick={() => onSuggestionClick(suggestion)}
                      disabled={isLoading}
                      className={cn(
                        "border border-border hover:border-primary/30 hover:bg-primary/5",
                        "rounded-full px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground",
                        "transition-colors duration-150",
                        "disabled:opacity-40 disabled:cursor-not-allowed",
                      )}
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
    </div>
  )
}

// ─── Exported Wrapper ───────────────────────────────────────────────────────

export function MessageBubble(props: MessageBubbleProps) {
  if (props.message.role === "user") {
    return <UserMessage message={props.message} onEdit={props.onEdit} />
  }

  return <AssistantMessage {...props} />
}
