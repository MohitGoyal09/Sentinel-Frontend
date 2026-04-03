import type { RiskLevel } from '@/types'

const RISK_STYLES: Record<RiskLevel, string> = {
  CRITICAL: 'bg-red-500/10 text-red-400',
  ELEVATED: 'bg-amber-500/10 text-amber-400',
  LOW: 'bg-emerald-500/10 text-emerald-400',
}

interface RiskBadgeProps {
  level: RiskLevel
}

export function RiskBadge({ level }: RiskBadgeProps) {
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-md ${RISK_STYLES[level]}`}>
      {level}
    </span>
  )
}
