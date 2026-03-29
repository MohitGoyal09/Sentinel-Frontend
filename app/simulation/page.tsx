"use client"

import { useState } from "react"
import { ProtectedRoute } from "@/components/protected-route"
import { SimulationPanel } from "@/components/simulation-panel"
import { VaultStatus } from "@/components/vault-status"
import { useSimulation } from "@/hooks/useSimulation"
import { useRecentEvents } from "@/hooks/useRecentEvents"
import { useUsers } from "@/hooks/useUsers"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Terminal, Cpu, Database, Play } from "lucide-react"

export default function SimulationPage() {
  const { injectEvent, createPersona } = useSimulation()
  const { events: recentEvents, refetch: refetchEvents } = useRecentEvents()
  const { users } = useUsers()
  
  const handleSimulationInject = async (userHash: string, eventType: string) => {
      try {
        await injectEvent(userHash, eventType)
        setTimeout(() => refetchEvents(), 1000)
      } catch (e) {
        // injection failed
      }
  }

  const handleCreatePersona = async (personaId: string) => {
    // Logic similar to dashboard
    try {
        const email = `${personaId.split('_')[0]}@simulation.com`
        // We need to cast or validate personaId
        await createPersona(email, personaId as any)
    } catch (e) {
        // persona creation failed
    }
  }

  return (
    <ProtectedRoute>
      <div className="flex flex-col min-h-screen bg-background p-6 lg:p-8 space-y-8">
        
        {/* Header */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-purple-500/10">
              <Cpu className="h-6 w-6 text-purple-500" />
            </div>
            <h1 className="text-xl font-semibold tracking-tight">Simulation Mode</h1>
          </div>
          <p className="text-muted-foreground ml-12">
            Digital Twin Generator & Event Injection. Use this environment to test engine responses.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Control Panel */}
          <div className="lg:col-span-2 space-y-6">
             <Card className="border-purple-500/20 shadow-lg shadow-purple-500/5">
                <CardHeader>
                   <CardTitle className="flex items-center gap-2 text-purple-400">
                      <Terminal className="h-5 w-5" />
                      Event Injection Terminal
                   </CardTitle>
                   <CardDescription>Manually trigger behavioural events for digital twins.</CardDescription>
                </CardHeader>
                <CardContent>
                   <SimulationPanel 
                     onInjectEvent={(eventType) => {
                         // Default to first user or allow selection?
                         // SimulationPanel usually handles user selection internally or we pass a user.
                         // For now, let's just trigger for a "demo" user if SimulationPanel supports it.
                         // Actually SimulationPanel prop signature in dashboard was: onInjectEvent={handleSimulationInject} which took eventType.
                         // And currentEmployee was selected in dashboard.
                         // Here we might need a selector.
                         if (users.length > 0) {
                             handleSimulationInject(users[0].user_hash, eventType)
                         }
                     }}
                     onRunSimulation={handleCreatePersona}
                   />
                </CardContent>
             </Card>
          </div>

          {/* Sidebar Status */}
          <div className="space-y-6">
             <VaultStatus eventCount={recentEvents.length} userCount={users.length} />
             
             <Card>
                <CardHeader>
                   <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Database className="h-4 w-4" />
                      Recent Event Log
                   </CardTitle>
                </CardHeader>
                <CardContent>
                   <div className="space-y-2 font-mono text-xs">
                      {recentEvents.slice(0, 10).map((e, i) => (
                         <div key={i} className="flex gap-2 text-muted-foreground">
                            <span className="text-purple-400">[{new Date(e.timestamp).toLocaleTimeString()}]</span>
                            <span>{e.event_type}</span>
                         </div>
                      ))}
                   </div>
                </CardContent>
             </Card>
          </div>
        </div>

      </div>
    </ProtectedRoute>
  )
}
