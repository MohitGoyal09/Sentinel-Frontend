"use client"

import { Switch } from "@/components/ui/switch"
import { Eye, EyeOff } from "lucide-react"

interface AnonymityToggleProps {
  isAnonymized: boolean
  onToggle: (checked: boolean) => void
}

export function AnonymityToggle({ isAnonymized, onToggle }: AnonymityToggleProps) {
  return (
    <div className="flex items-center space-x-2 bg-background border border-border px-4 py-2 rounded-full">
      <div className={`p-1.5 rounded-full ${isAnonymized ? 'bg-[hsl(var(--primary))]/20' : 'bg-muted'}`}
        style={{color: isAnonymized ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))'}}>
        {isAnonymized ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </div>
      <label htmlFor="anonymity-mode" className="text-sm font-medium text-foreground cursor-pointer select-none">
        {isAnonymized ? 'Anonymity Mode: ON' : 'Anonymity Mode: OFF'}
      </label>
      <Switch
        id="anonymity-mode"
        checked={isAnonymized}
        onCheckedChange={onToggle}
        className="data-[state=checked]:bg-purple-500"
      />
    </div>
  )
}
