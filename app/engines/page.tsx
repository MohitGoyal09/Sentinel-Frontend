"use client"

import { useState, useMemo, useEffect } from "react"
import { useRouter } from "next/navigation"

import { ProtectedRoute } from "@/components/protected-route"
import {
  LayoutDashboard,
  Users,
  Cpu,
  LogOut,
  Settings
} from "lucide-react"

import { UserSelector } from "@/components/user-selector"
import { ManagerOverview } from "@/components/dashboard/manager/overview"
import { TeamRoster } from "@/components/dashboard/manager/team-roster"

import { useRiskData } from "@/hooks/useRiskData"
import { useNetworkData } from "@/hooks/useNetworkData"
import { useTeamData } from "@/hooks/useTeamData"
import { useUsers } from "@/hooks/useUsers"
import { useNudge } from "@/hooks/useNudge"
import { useForecast } from "@/hooks/useForecast"
import { Employee, toRiskLevel } from "@/types"
import { mapUsersToEmployees } from "@/lib/map-employees"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"

function EnginesContent() {
  const router = useRouter()
  const [selectedUserHash, setSelectedUserHash] = useState<string | null>(null)
  
  // Data Hooks
  const { users } = useUsers()
  
  useEffect(() => {
    if (!selectedUserHash && users.length > 0) {
      setSelectedUserHash(users[0].user_hash)
    }
  }, [users, selectedUserHash])

  // Transform User Data
  const employees = useMemo(() => mapUsersToEmployees(users), [users])

  const { data: riskData } = useRiskData(selectedUserHash)
  const { data: nudgeData } = useNudge(selectedUserHash)
  const { data: networkData } = useNetworkData(selectedUserHash)
  const { data: teamData } = useTeamData()
  const { data: forecastData } = useForecast()

  const networkNodes = networkData?.nodes || []
  const networkEdges = networkData?.edges || []

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-200 font-sans dark">

      {/* ─── Header ────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 border-b border-sidebar-border bg-slate-950/80 backdrop-blur-xl">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-950/50 border border-indigo-500/30">
              <Cpu className="h-5 w-5 text-indigo-400" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-slate-100">Manager Console</h1>
              <p className="text-[11px] text-slate-400 font-medium tracking-wide">SENTINEL INTELLIGENCE SYSTEM</p>
            </div>
          </div>
          
           {/* Actions */}
           <div className="flex items-center gap-4">
              <UserSelector 
                 selectedUser={employees.find(e => e.user_hash === selectedUserHash) || null} 
                 onSelect={(e) => setSelectedUserHash(e.user_hash)} 
                 employees={employees}
              />
              <Button variant="ghost" size="icon" className="text-slate-400 hover:text-slate-100">
                <Settings className="h-5 w-5" />
              </Button>
           </div>
        </div>
      </header>

      {/* ─── Main Content ────────────────────────────────────────────── */}
      <main className="container mx-auto px-6 py-8 flex-1">
        
        <Tabs defaultValue="overview" className="space-y-8">
           <TabsList className="bg-slate-900/50 border border-border p-1 h-auto rounded-lg inline-flex">
              <TabsTrigger 
                 value="overview"
                 className="px-6 py-2.5 rounded-md data-[state=active]:bg-indigo-600 data-[state=active]:text-slate-50 text-slate-400 transition-all font-medium flex items-center gap-2"
              >
                 <LayoutDashboard className="h-4 w-4" />
                 Overview
              </TabsTrigger>
              <TabsTrigger 
                 value="team"
                 className="px-6 py-2.5 rounded-md data-[state=active]:bg-indigo-600 data-[state=active]:text-slate-50 text-slate-400 transition-all font-medium flex items-center gap-2"
              >
                 <Users className="h-4 w-4" />
                 Team Roster
              </TabsTrigger>
           </TabsList>

           <TabsContent key="overview" value="overview" className="focus:outline-none mt-0">
              <ManagerOverview
                 employees={employees}
                 networkNodes={networkNodes}
                 networkEdges={networkEdges}
                 forecastData={(forecastData as any) || []}
                 nudgeData={nudgeData}
              />
           </TabsContent>

           <TabsContent key="team" value="team" className="focus:outline-none mt-0">
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                 <TeamRoster employees={employees} />
              </div>
           </TabsContent>
        </Tabs>

      </main>
    </div>
  )
}

export default function EnginesPage() {
  return (
    <ProtectedRoute allowedRoles={["manager", "admin"]}>
      <EnginesContent />
    </ProtectedRoute>
  )
}
