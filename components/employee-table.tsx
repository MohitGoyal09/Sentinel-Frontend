
"use strict";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Employee } from "@/types"
import { ArrowUpRight, ArrowDownRight, Minus, Filter } from "lucide-react"
import { cn } from "@/lib/utils"

interface EmployeeTableProps {
  employees: Employee[]
}

export function EmployeeTable({ employees }: EmployeeTableProps) {
  return (
    <div className="glass-card rounded-xl border border-white/10 overflow-hidden">
      <Table>
        <TableHeader className="bg-white/5">
          <TableRow className="border-white/10 hover:bg-transparent">
            <TableHead className="w-[300px] text-white/70 font-medium">Employee</TableHead>
            <TableHead className="text-white/70 font-medium">Risk Status</TableHead>
            <TableHead className="text-white/70 font-medium">Velocity</TableHead>
            <TableHead className="text-white/70 font-medium">Belongingness</TableHead>
            <TableHead className="text-right text-white/70 font-medium">Last Updated</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {employees.map((employee) => (
            <TableRow key={employee.user_hash} className="border-white/5 hover:bg-white/5">
              <TableCell className="font-medium">
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9 border border-white/10">
                    <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${employee.user_hash}`} />
                    <AvatarFallback className="bg-white/10 text-xs">
                      {employee.name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-white/90">{employee.name}</span>
                    <span className="text-xs text-white/50">{employee.role}</span>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center">
                  <Badge 
                    variant="outline" 
                    className={cn(
                      "border-0 px-2 py-0.5 text-xs font-medium uppercase tracking-wide",
                      employee.risk_level === "CRITICAL" && "bg-red-500/20 text-red-400 ring-1 ring-red-500/50",
                      employee.risk_level === "ELEVATED" && "bg-amber-500/20 text-amber-400 ring-1 ring-amber-500/50",
                      employee.risk_level === "LOW" && "bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/50",
                      employee.risk_level === "CALIBRATING" && "bg-blue-500/20 text-blue-400 ring-1 ring-blue-500/50"
                    )}
                  >
                    {employee.risk_level}
                  </Badge>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm text-white/80">{employee.velocity.toFixed(2)}</span>
                  {employee.velocity > 1.2 ? (
                    <ArrowUpRight className="h-4 w-4 text-emerald-500" />
                  ) : employee.velocity < 0.8 ? (
                    <ArrowDownRight className="h-4 w-4 text-red-500" />
                  ) : (
                    <Minus className="h-4 w-4 text-white/30" />
                  )}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex w-[140px] flex-col gap-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-white/50">Sentiment</span>
                    <span className="text-white/80">{(employee.belongingness_score * 100).toFixed(0)}%</span>
                  </div>
                  <Progress 
                    value={employee.belongingness_score * 100} 
                    className="h-1.5 bg-white/10"
                    // indicatorClassName in shadcn usually is managed internally or via class, 
                    // assuming default setup implies color via internal class or customization.
                    // We can force color via style or custom class if needed, but default is usually primary.
                  />
                </div>
              </TableCell>
              <TableCell className="text-right">
                <span className="text-xs text-white/40">
                  {new Date(employee.updated_at).toLocaleDateString()}
                </span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
