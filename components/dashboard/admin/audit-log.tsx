"use client"

import { ScrollArea } from "@/components/ui/scroll-area"
import { Shield, UserPlus, FileEdit, Settings, AlertTriangle } from "lucide-react"

const LOGS = [
  { id: 1, action: "User Created", user: "Admin", target: "user_2938", time: "2m ago", type: "success" },
  { id: 2, action: "Settings Update", user: "Admin", target: "Global Policy", time: "15m ago", type: "info" },
  { id: 3, action: "Risk Alert", user: "System", target: "Department: Eng", time: "1h ago", type: "warning" },
  { id: 4, action: "Data Export", user: "Manager1", target: "Q3 Report", time: "3h ago", type: "info" },
  { id: 5, action: "Login Failed", user: "Unknown", target: "IP: 192.168.1.1", time: "5h ago", type: "error" },
]

export function AuditLogFeed() {
  return (
    <div className="bg-background border border-border rounded-xl p-4 h-[380px] flex flex-col">
      <div className="flex items-center justify-between mb-4">
         <h3 className="font-semibold text-foreground flex items-center gap-2">
            <Shield className="w-4 h-4" style={{color: 'hsl(var(--sentinel-healthy))'}} />
            Live Audit Log
         </h3>
         <span className="text-xs text-muted-foreground animate-pulse">● Live</span>
      </div>
      
      <ScrollArea className="flex-1 pr-4">
        <div className="space-y-4">
          {LOGS.map((log) => (
            <div key={log.id} className="flex items-start gap-3 p-3 rounded-lg bg-white/5 border border-border hover:bg-white/10 transition-colors">
               <div className={`mt-1 p-1.5 rounded-full ${
                 log.type === 'error' ? 'bg-[hsl(var(--sentinel-critical))]/20' :
                 log.type === 'warning' ? 'bg-[hsl(var(--sentinel-elevated))]/20' :
                 'bg-[hsl(var(--sentinel-healthy))]/20'
               }`}
               style={{
                 color: log.type === 'error' ? 'hsl(var(--sentinel-critical))' :
                   log.type === 'warning' ? 'hsl(var(--sentinel-elevated))' :
                   'hsl(var(--sentinel-healthy))'
               }}>
                  {log.type === 'error' ? <AlertTriangle className="w-3 h-3" /> :
                   log.type === 'warning' ? <FileEdit className="w-3 h-3" /> :
                   <UserPlus className="w-3 h-3" />}
               </div>
               <div className="flex-1">
                   <p className="text-sm font-medium text-foreground">
                    <span className="font-mono text-xs mr-2" style={{color: 'hsl(var(--sentinel-healthy))'}}>[{log.action}]</span>
                    {log.target}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                     By <span className="text-foreground">{log.user}</span> • {log.time}
                  </p>
               </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}
