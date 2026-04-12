"use client"

import { useState, useMemo } from "react"
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Lock, Search, Users } from "lucide-react"
import { useRouter } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Employee } from "@/types"
import { scheduleBreak } from "@/lib/api"
import { getInitials } from "@/lib/utils"
import { toast } from "sonner"

interface TeamGridProps {
  employees: Employee[]
  isAnonymized: boolean
}

export function TeamGrid({ employees, isAnonymized }: TeamGridProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const router = useRouter()

  const getDisplayName = (emp: Employee) => {
    if (isAnonymized) {
      return `Dev-${emp.user_hash.slice(-2).toUpperCase()}`
    }
    return emp.name
  }

  const getStatus = (emp: Employee): { label: string; color: string } => {
    if ((emp as any).monitoring_paused) {
      return { label: "Paused", color: "hsl(var(--muted-foreground))" }
    }
    if (emp.velocity === 0) {
      return { label: "Inactive", color: "hsl(var(--muted-foreground))" }
    }
    return { label: "Active", color: "hsl(var(--sentinel-healthy))" }
  }

  const filteredEmployees = useMemo(() => {
    if (!searchQuery.trim()) return employees
    const q = searchQuery.toLowerCase()
    return employees.filter(
      (emp) =>
        emp.name.toLowerCase().includes(q) ||
        emp.role.toLowerCase().includes(q) ||
        emp.user_hash.toLowerCase().includes(q)
    )
  }, [employees, searchQuery])

  const handleRowClick = (hash: string) => {
    router.push(`/dashboard?view=employee-detail&uid=${hash}`)
  }

  const handleViewProfile = (e: React.MouseEvent, hash: string) => {
    e.stopPropagation()
    router.push(`/dashboard?view=employee-detail&uid=${hash}`)
  }

  const handleScheduleCheckin = async (e: React.MouseEvent, emp: Employee) => {
    e.stopPropagation()
    try {
      await scheduleBreak(emp.user_hash)
      toast.success(`Check-in scheduled for ${isAnonymized ? getDisplayName(emp) : emp.name}`)
    } catch {
      toast.error("Failed to schedule check-in. Please try again.")
    }
  }

  const handleExportReport = (e: React.MouseEvent, emp: Employee) => {
    e.stopPropagation()
    toast.info(`Exporting report for ${getDisplayName(emp)}...`)
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
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, role, or ID..."
                className="bg-background/40 border border-border rounded-full pl-9 pr-4 py-1.5 text-sm focus:outline-none focus:border-primary/50 text-foreground w-48 transition-all focus:w-64 placeholder:text-muted-foreground/50"
              />
            </div>
          </div>

          <Table>
            <TableHeader className="bg-background/20">
              <TableRow className="hover:bg-transparent border-border">
                <TableHead className="text-muted-foreground font-medium">Member</TableHead>
                <TableHead className="text-muted-foreground font-medium">Role</TableHead>
                <TableHead className="text-muted-foreground font-medium">Status</TableHead>
                <TableHead className="text-muted-foreground font-medium">Risk Level</TableHead>
                <TableHead className="text-right text-muted-foreground font-medium">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEmployees.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground text-sm">
                    No members match &quot;{searchQuery}&quot;
                  </TableCell>
                </TableRow>
              ) : (
                filteredEmployees.map((employee) => {
                  const status = getStatus(employee)
                  return (
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
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: status.color }} />
                          <span className="text-xs text-muted-foreground">{status.label}</span>
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
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-white/10"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={(e) => handleViewProfile(e, employee.user_hash)}>
                              View Profile
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => handleScheduleCheckin(e, employee)}>
                              Schedule Check-in
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => handleExportReport(e, employee)}>
                              Export Report
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
