"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Search, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { useUsers } from "@/hooks/useUsers"

export default function SearchPage() {
  const router = useRouter()
  const { users, isLoading } = useUsers()
  const [query, setQuery] = useState("")

  const filteredUsers = users.filter(user => 
    user.name?.toLowerCase().includes(query.toLowerCase()) || 
    user.user_hash?.toLowerCase().includes(query.toLowerCase())
  )

  const handleUserSelect = (userHash: string) => {
    // Navigate to dashboard and select user
    // Since we don't have a direct 'select user' URL param in dashboard yet, 
    // we can just go to dashboard. Ideally should support /dashboard?user=hash
    router.push(`/dashboard?view=dashboard`) 
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight">Search</h1>
        <p className="text-muted-foreground">Find employees by name or ID.</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input 
          className="pl-9" 
          placeholder="Search employees..." 
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          <div className="flex items-center justify-center col-span-full py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : filteredUsers.length > 0 ? (
          filteredUsers.map(user => (
            <Card 
              key={user.user_hash} 
              className="cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => handleUserSelect(user.user_hash)}
            >
              <CardContent className="p-4 flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="font-semibold text-primary">
                    {user.name?.[0] || user.user_hash[0]}
                  </span>
                </div>
                <div>
                  <p className="font-medium">{user.name || "Anonymous User"}</p>
                  <p className="text-xs text-muted-foreground truncate max-w-[150px]">
                    {user.user_hash}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="text-center col-span-full py-12 text-muted-foreground">
            No users found matching "{query}"
          </div>
        )}
      </div>
    </div>
  )
}
