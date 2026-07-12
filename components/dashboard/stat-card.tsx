import { ArrowDownRight, ArrowUpRight, type LucideIcon } from 'lucide-react'

import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

export function StatCard({
  label,
  value,
  icon: Icon,
  trend,
  trendUp,
  accent = 'primary',
}: {
  label: string
  value: string | number
  icon: LucideIcon
  trend?: string
  trendUp?: boolean
  accent?: 'primary' | 'destructive' | 'warning' | 'muted'
}) {
  const accentClasses: Record<string, string> = {
    primary: 'bg-primary/12 text-primary',
    destructive: 'bg-destructive/12 text-destructive',
    warning: 'bg-warning/12 text-warning',
    muted: 'bg-muted text-muted-foreground',
  }

  return (
    <Card className="transition-colors hover:border-primary/30">
      <CardContent className="flex items-start justify-between gap-4 p-5">
        <div className="flex flex-col gap-2">
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-3xl font-semibold tracking-tight">{value}</p>
          {trend && (
            <span
              className={cn(
                'inline-flex items-center gap-1 text-xs font-medium',
                trendUp ? 'text-primary' : 'text-destructive',
              )}
            >
              {trendUp ? (
                <ArrowUpRight className="size-3.5" />
              ) : (
                <ArrowDownRight className="size-3.5" />
              )}
              {trend}
            </span>
          )}
        </div>
        <span
          className={cn(
            'flex size-11 items-center justify-center rounded-lg',
            accentClasses[accent],
          )}
        >
          <Icon className="size-5" />
        </span>
      </CardContent>
    </Card>
  )
}
