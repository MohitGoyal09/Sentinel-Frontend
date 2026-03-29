"use client"

import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, Lock, Search, Users } from "lucide-react"
import { useRouter } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Employee } from "@/types"

interface TeamGridProps {
  employees: Employee[]
  isAnonymized: boolean
}

export function TeamGrid({ employees, isAnonymized }: TeamGridProps) {
  // Helper to hash name
  const getDisplayName = (emp: Employee) => {
    if (isAnonymized) {
      // Simple hash simulation: "Dev-" + last 2 chars of hash
      return `Dev-${emp.user_hash.slice(-2).toUpperCase()}`
    }
    return emp.name
  }

  const getInitials = (name: string) => {
    return name.slice(0, 2).toUpperCase()
  }

  const router = useRouter()

  const handleRowClick = (hash: string) => {
    // Preserve current view context if needed, but for now just go to detail
    router.push(`/dashboard?view=employee-detail&uid=${hash}`)
  }

  return (
    <div>
      {employees.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Users className="h-12 w-12 mx-auto mb-4 opacity-30" />
          <p className="text-lg font-medium">No team members found</p>
          <p className="text-sm mt-1">Team members will appear here once assigned</p>
        </div>
      ) : (
        <div className="bg-background border border-border rounded-xl overflow-hidden shadow-2xl shadow-black/50">
      <div className="p-4 border-b border-border flex justify-between items-center bg-white/5">
        <h3 className="font-semibold text-lg text-foreground flex items-center gap-2">
          <Badge variant="outline" className="bg-primary/20 text-primary border-primary/50 text-xs">Beta</Badge>
          Team Roster
        </h3>
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input 
            placeholder="Search by ID or Role..." 
            className="bg-black/40 border border-border rounded-full pl-9 pr-4 py-1.5 text-sm focus:outline-none focus:border-primary/50 text-foreground w-48 transition-all focus:w-64 placeholder:text-muted-foreground/50"
          />
        </div>
      </div>
      
      <Table>
        <TableHeader className="bg-black/20">
            <TableRow className="hover:bg-transparent border-border">
            <TableHead className="text-muted-foreground font-medium">Member</TableHead>
            <TableHead className="text-muted-foreground font-medium">Role</TableHead>
            <TableHead className="text-muted-foreground font-medium">Status</TableHead>
            <TableHead className="text-muted-foreground font-medium">Risk Level</TableHead>
            <TableHead className="text-right text-muted-foreground font-medium">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {employees.map((employee) => (
            <TableRow 
              key={employee.user_hash} 
              className="border-white/5 hover:bg-primary/5 transition-colors cursor-pointer group"
              onClick={() => handleRowClick(employee.user_hash)}
            >
              <TableCell className="font-medium text-foreground">
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9 border border-border ring-2 ring-transparent group-hover:ring-primary/20 transition-all">
                    <AvatarImage src={isAnonymized ? "" : `/avatars/${employee.user_hash}.png`} />
                    <AvatarFallback className={isAnonymized ? "bg-primary/10 text-primary" : "bg-muted text-foreground"}>
                      {isAnonymized ? <Lock className="w-3.5 h-3.5" /> : getInitials(employee.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className={`text-sm ${isAnonymized ? "font-mono text-primary/80" : "text-foreground"}`}>
                      {getDisplayName(employee)}
                    </span>
                    {isAnonymized && <span className="text-[10px] text-muted-foreground">ID: {employee.user_hash.slice(0, 6)}</span>}
                  </div>
                </div>
              </TableCell>
              
              <TableCell className="text-muted-foreground">{employee.role}</TableCell>
              
              <TableCell>
                 <div className="flex items-center gap-2">
                   <div className="w-2 h-2 rounded-full" style={{backgroundColor: employee.velocity > 0 ? 'hsl(var(--sentinel-healthy))' : 'hsl(var(--muted-foreground))'}}></div>
                   <span className="text-xs text-muted-foreground">Active</span>
                 </div>
              </TableCell>
              
              <TableCell>
                <Badge 
                  variant="outline" 
                  className={`
                    ${employee.risk_level === 'CRITICAL' ? 'border-[hsl(var(--sentinel-critical))] bg-[hsl(var(--sentinel-critical))]/10' : 
                      employee.risk_level === 'ELEVATED' ? 'border-[hsl(var(--sentinel-elevated))] bg-[hsl(var(--sentinel-elevated))]/10' : 
                      'border-[hsl(var(--sentinel-healthy))] bg-[hsl(var(--sentinel-healthy))]/10'}
                  `}
                  style={{
                    color: employee.risk_level === 'CRITICAL' ? 'hsl(var(--sentinel-critical))' : 
                      employee.risk_level === 'ELEVATED' ? 'hsl(var(--sentinel-elevated))' : 
                      'hsl(var(--sentinel-healthy))'
                  }}
                >
                  {employee.risk_level}
                </Badge>
              </TableCell>
              
              <TableCell className="text-right">
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-white/10">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      </div>
      )}
    </div>
  )
}
