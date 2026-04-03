interface SectionCardProps {
  title: string
  subtitle?: string
  children: React.ReactNode
  action?: React.ReactNode
}

export function SectionCard({ title, subtitle, children, action }: SectionCardProps) {
  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      <div className="px-5 pt-5 pb-4 flex items-start justify-between">
        <div>
          <h3 className="text-base font-medium text-foreground">{title}</h3>
          {subtitle && (
            <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
          )}
        </div>
        {action}
      </div>
      <div className="px-5 pb-5">{children}</div>
    </div>
  )
}
