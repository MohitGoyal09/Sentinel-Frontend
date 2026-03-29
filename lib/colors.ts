import { RiskLevel } from '@/types';

// ============================================
// Risk Level Colors (CSS Variable Mapped)
// ============================================
export const riskColors = {
  LOW: {
    oklch: 'oklch(0.6 0.15 145)',
    hsl: 'hsl(160 84% 39%)',
    bg: 'bg-green-500',
    text: 'text-green-600',
    border: 'border-green-500',
    ring: 'ring-green-500',
    hex: '#16a34a',
    base: 'green',
    subtle: 'shadow-green-100',
    cssVar: 'var(--sentinel-healthy)',
    class: 'bg-sentinel-healthy text-sentinel-healthy',
  },
  ELEVATED: {
    oklch: 'oklch(0.7 0.15 85)',
    hsl: 'hsl(38 92% 50%)',
    bg: 'bg-amber-500',
    text: 'text-amber-600',
    border: 'border-amber-500',
    ring: 'ring-amber-500',
    hex: '#d97706',
    base: 'amber',
    subtle: 'shadow-amber-100',
    cssVar: 'var(--sentinel-elevated)',
    class: 'bg-sentinel-elevated text-sentinel-elevated',
  },
  CRITICAL: {
    oklch: 'oklch(0.6 0.2 25)',
    hsl: 'hsl(0 84% 50%)',
    bg: 'bg-red-500',
    text: 'text-red-600',
    border: 'border-red-500',
    ring: 'ring-red-500',
    hex: '#dc2626',
    base: 'red',
    subtle: 'shadow-red-100',
    cssVar: 'var(--sentinel-critical)',
    class: 'bg-sentinel-critical text-sentinel-critical',
  },
} as const;

export function getRiskColor(level: RiskLevel) {
  return riskColors[level] || riskColors.LOW;
}

export function getRiskLabel(level: RiskLevel): string {
  const labels: Record<RiskLevel, string> = {
    LOW: 'Low Risk',
    ELEVATED: 'Elevated',
    CRITICAL: 'Critical',
  };
  return labels[level] || level;
}

export function getRiskProgress(level: RiskLevel): number {
  const progress: Record<RiskLevel, number> = {
    LOW: 25,
    ELEVATED: 60,
    CRITICAL: 90,
  };
  return progress[level] || 0;
}
