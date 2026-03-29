"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

const DEPARTMENTS = [
  { name: "Engineering", risk: "critical", members: 12 },
  { name: "Product", risk: "elevated", members: 6 },
  { name: "Design", risk: "low", members: 4 },
  { name: "Marketing", risk: "low", members: 5 },
  { name: "Operations", risk: "elevated", members: 8 },
  { name: "HR", risk: "low", members: 3 },
  { name: "Sales", risk: "critical", members: 15 },
  { name: "Support", risk: "low", members: 10 },
]

export function OrgHealthMap() {
  return (
    <Card className="col-span-1 lg:col-span-2 bg-background border-border">
      <CardHeader>
        <CardTitle className="flex justify-between items-center text-foreground">
          <span>Organization Map</span>
          <Badge variant="outline" className="text-xs" style={{borderColor: 'hsl(var(--sentinel-elevated) / 0.5)', color: 'hsl(var(--sentinel-elevated))'}}>
            Heatmap View
          </Badge>
        </CardTitle>
        <CardDescription className="text-muted-foreground">
          Visualize risk distribution across departments.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="relative w-full h-[300px] flex items-center justify-center p-4">
          {/* Central Hub */}
          <div className="absolute w-24 h-24 rounded-full bg-card border-2 border-border flex items-center justify-center z-10 shadow-xl shadow-black/50">
            <span className="font-bold text-foreground">HQ</span>
          </div>

          {/* Department Orbits */}
          <div className="absolute w-[80%] h-[80%] border border-dashed border-border rounded-full animate-pulse-slow opacity-30"></div>
          
          {/* Department Nodes */}
          <div className="grid grid-cols-4 gap-8 w-full h-full relative z-20">
             {DEPARTMENTS.map((dept, i) => (
                <div 
                  key={dept.name}
                  className={`
                    relative group flex flex-col items-centerjustify-center 
                    transition-all duration-300 hover:scale-110 cursor-pointer
                    ${dept.risk === 'critical' ? 'animate-pulse' : ''}
                  `}
                  style={{
                    // Just simple positioning for now, ideally circular
                    transform: `translate(${Math.sin(i) * 20}px, ${Math.cos(i) * 20}px)`
                  }}
                >
                   <div 
                     className={`
                       w-16 h-16 rounded-full flex items-center justify-center border-2 shadow-lg backdrop-blur-sm
                       ${dept.risk === 'critical' ? 'bg-red-950/40 border-red-500 shadow-red-900/20' : 
                         dept.risk === 'elevated' ? 'bg-amber-950/40 border-amber-500 shadow-amber-900/20' : 
                         'bg-teal-950/40 border-teal-500 shadow-teal-900/20'}
                     `}
                   >
                      <span className="font-bold text-xs text-foreground">{dept.members}</span>
                   </div>
                    <div className="mt-2 text-xs font-medium text-foreground bg-black/60 px-2 py-0.5 rounded-full border border-border">
                      {dept.name}
                   </div>
                </div>
             ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
