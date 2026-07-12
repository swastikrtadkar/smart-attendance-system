import { CheckCircle2 } from 'lucide-react'
import type { ReactNode } from 'react'

import { Logo } from '@/components/logo'

const perks = [
  'Contactless attendance in seconds',
  'Automatic, tamper-proof records',
  'Real-time dashboards & reports',
]

export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle: string
  children: ReactNode
}) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      {/* Brand panel */}
      <div className="relative hidden flex-col justify-between overflow-hidden border-r border-border/60 bg-card/40 p-10 lg:flex">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(70%_60%_at_20%_0%,color-mix(in_oklch,var(--color-primary)_16%,transparent),transparent)]" />
        <Logo />
        <div className="max-w-md">
          <h2 className="text-balance text-3xl font-semibold tracking-tight">
            Attendance, handled by facial recognition.
          </h2>
          <p className="mt-4 text-pretty text-muted-foreground">
            Sign in to manage students, mark attendance, and generate reports from a single secure
            dashboard.
          </p>
          <ul className="mt-8 flex flex-col gap-3">
            {perks.map((perk) => (
              <li key={perk} className="flex items-center gap-3 text-sm">
                <CheckCircle2 className="size-5 text-primary" />
                {perk}
              </li>
            ))}
          </ul>
        </div>
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} FaceMark — Smart Attendance System
        </p>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <Logo />
          </div>
          <div className="mb-6">
            <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
            <p className="mt-1.5 text-sm text-muted-foreground">{subtitle}</p>
          </div>
          {children}
        </div>
      </div>
    </div>
  )
}
