"use client"

import { useState, useEffect, useCallback } from 'react'
import { listChatSessions, ChatSessionSummary } from '@/lib/api'

export type { ChatSessionSummary }

export interface UseChatHistoryOptions {
  limit?: number
  enabled?: boolean
}

export function useChatHistory(options: UseChatHistoryOptions = {}) {
  const { limit = 20, enabled = true } = options
  const [sessions, setSessions] = useState<ChatSessionSummary[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSessions = useCallback(async () => {
    if (!enabled) return
    try {
      setIsLoading(true)
      const data = await listChatSessions(limit)
      setSessions(data.sessions || [])
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load sessions')
    } finally {
      setIsLoading(false)
    }
  }, [limit, enabled])

  useEffect(() => { fetchSessions() }, [fetchSessions])

  return { sessions, isLoading, error, refetch: fetchSessions }
}
