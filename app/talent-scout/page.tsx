"use client"

import { useState, useMemo } from "react"
import { useNetworkData } from "@/hooks/useNetworkData"
import { NetworkGraph } from "@/components/network-graph"
import { ProtectedRoute } from "@/components/protected-route"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Activity, Shield, Users, Network, TrendingUp, Search } from "lucide-react"

export default function TalentScoutPage() {
  // Use "global" or the current user's hash if we want to center on someone.
  // For talent scout, we usually want the global view or manager's view.
  const { data: networkData, isLoading } = useNetworkData("global")

  const hiddenGems = useMemo(() => {
    return (networkData?.nodes || [])
      .filter((n) => (n.betweenness || 0) > 0.5) // Example threshold
      .sort((a, b) => (b.betweenness || 0) - (a.betweenness || 0))
  }, [networkData])

  return (
    <ProtectedRoute>
      <div className="flex flex-col min-h-screen bg-background p-6 lg:p-8 space-y-6">
        
        {/* Header */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <Network className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Talent Scout</h1>
          </div>
          <p className="text-muted-foreground ml-12">
            Organizational Network Analysis (ONA) to identify hidden leaders and communication bridges.
          </p>
        </div>

        {/* Main Graph Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
          <Card className="lg:col-span-2 h-full flex flex-col border-primary/20 shadow-lg shadow-primary/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                 <Activity className="h-4 w-4 text-primary" />
                 Network Topology
              </CardTitle>
              <CardDescription>Real-time interaction graph. Nodes are employees, edges are communication flows.</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 min-h-0 relative">
               {/* Make sure NetworkGraph takes full height */}
               <div className="absolute inset-0 p-4">
                  <NetworkGraph 
                    nodes={networkData?.nodes || []} 
                    edges={networkData?.edges || []} 
                  />
               </div>
            </CardContent>
          </Card>

          {/* Sidebar / Metrics */}
          <div className="flex flex-col gap-6 h-full">
            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
              <Card className="bg-card/50">
                <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                  <Users className="h-5 w-5 text-muted-foreground mb-2" />
                  <div className="text-2xl font-bold">{networkData?.nodes.length || 0}</div>
                  <p className="text-xs text-muted-foreground">Active Nodes</p>
                </CardContent>
              </Card>
              <Card className="bg-card/50">
                <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                  <TrendingUp className="h-5 w-5 text-muted-foreground mb-2" />
                  <div className="text-2xl font-bold">{networkData?.edges.length || 0}</div>
                  <p className="text-xs text-muted-foreground">Connections</p>
                </CardContent>
              </Card>
            </div>

            {/* Hidden Gems List */}
            <Card className="flex-1 flex flex-col border-amber-500/20 shadow-lg shadow-amber-500/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2 text-amber-500">
                  <Search className="h-4 w-4" />
                  Identified Hidden Gems
                </CardTitle>
                <CardDescription>High betweenness centrality indicating influence.</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 overflow-auto pr-2 custom-scrollbar">
                <div className="space-y-3">
                  {hiddenGems.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">No hidden gems identified yet.</p>
                  ) : (
                    hiddenGems.map((gem) => (
                      <div key={gem.id} className="flex items-center justify-between p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                        <div>
                          <p className="font-semibold text-sm">{gem.label}</p>
                          <p className="text-[10px] text-muted-foreground">ID: {gem.id.slice(0, 6)}</p>
                        </div>
                        <div className="text-right">
                           <Badge variant="outline" className="border-amber-500/40 text-amber-500 text-[10px] mb-1">
                             Gem
                           </Badge>
                           <p className="text-xs font-mono">{(gem.betweenness || 0).toFixed(2)}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
