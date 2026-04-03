interface StatCardProps {
  label: string
  value: string | number
  description: string
  valueClassName?: string
}

export function StatCard({ label, value, description, valueClassName = 'text-foreground' }: StatCardProps) {
  return (
    <div className="bg-card border border-border rounded-lg p-5">
      <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
        {label}
      </p>
      <p className={`text-2xl font-semibold tabular-nums mt-2 ${valueClassName}`}>
        {value}
      </p>
      <p className="text-xs text-muted-foreground mt-1">
        {description}
      </p>
    </div>
  )
}
