"use client"

import { ChevronDown, User } from "lucide-react"
import { cn } from "@/lib/utils"
import { Employee, RiskLevel } from "@/types"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface UserSelectorProps {
  employees: Employee[]
  selectedUser: Employee | null
  onSelect: (employee: Employee) => void
}

function riskDotColor(level: RiskLevel) {
  switch (level) {
    case "CRITICAL":
      return "bg-[hsl(var(--sentinel-critical))]"
    case "ELEVATED":
      return "bg-[hsl(var(--sentinel-elevated))]"
    case "LOW":
      return "bg-[hsl(var(--sentinel-healthy))]"
    default:
      return "bg-muted-foreground"
  }
}

function riskTextColor(level: RiskLevel) {
  switch (level) {
    case "CRITICAL":
      return "text-[hsl(var(--sentinel-critical))]"
    case "ELEVATED":
      return "text-[hsl(var(--sentinel-elevated))]"
    case "LOW":
      return "text-[hsl(var(--sentinel-healthy))]"
    default:
      return "text-muted-foreground"
  }
}

export { riskDotColor, riskTextColor }

export function UserSelector({ employees, selectedUser, onSelect }: UserSelectorProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="h-10 w-full justify-between gap-2 rounded-lg border-border bg-card text-sm shadow-sm"
        >
          {selectedUser ? (
            <div className="flex items-center gap-2.5">
              <span className={cn("h-2 w-2 shrink-0 rounded-full", riskDotColor(selectedUser.risk_level))} />
              <span className="font-mono text-xs text-foreground">{selectedUser.user_hash}</span>
              <span className="hidden text-xs text-muted-foreground sm:inline">
                ({selectedUser.persona})
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-muted-foreground">
              <User className="h-4 w-4" />
              <span>Select a user...</span>
            </div>
          )}
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-80 rounded-lg border-border bg-card shadow-lg">
        {employees.map((emp) => (
          <DropdownMenuItem
            key={emp.user_hash}
            onClick={() => onSelect(emp)}
            className="flex cursor-pointer items-center justify-between rounded-md px-3 py-2.5"
          >
            <div className="flex items-center gap-2.5">
              <span className={cn("h-2 w-2 shrink-0 rounded-full", riskDotColor(emp.risk_level))} />
              <span className="font-mono text-xs text-foreground">{emp.user_hash}</span>
              <span className="text-xs text-muted-foreground">({emp.persona})</span>
            </div>
            <span className={cn("text-[10px] font-semibold", riskTextColor(emp.risk_level))}>
              {emp.risk_level}
            </span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
