"use client"

import { use, Suspense } from "react"
import { ChatInterface } from "@/components/chat/chat-interface"
import { ProtectedRoute } from "@/components/protected-route"

interface AskSentinelPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

function AskSentinelContent({ searchParams }: AskSentinelPageProps) {
  const params = use(searchParams)
  const query = typeof params.q === "string" ? params.q : undefined
  const session = typeof params.session === "string" ? params.session : undefined

  return (
    <div className="flex flex-1 h-full bg-background">
      <ChatInterface initialQuery={query} initialSessionId={session} />
    </div>
  )
}

export default function AskSentinelPage({ searchParams }: AskSentinelPageProps) {
  return (
    <ProtectedRoute>
      <Suspense fallback={<div className="flex flex-1 h-full bg-background" />}>
        <AskSentinelContent searchParams={searchParams} />
      </Suspense>
    </ProtectedRoute>
  )
}
