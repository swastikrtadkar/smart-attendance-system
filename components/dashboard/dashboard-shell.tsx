'use client'

import { Menu, X } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { useEffect, useMemo, useState, type ReactNode } from 'react'

import { navItems } from '@/components/dashboard/nav-items'
import { SidebarNav } from '@/components/dashboard/sidebar'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type LoggedInUser = {
  facultyId: string
  name: string
  email: string
  role: string
  department: string
  createdAt: string
}

function usePageTitle() {
  const pathname = usePathname()

  const match = [...navItems]
    .sort((a, b) => b.href.length - a.href.length)
    .find((item) =>
      item.href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(item.href),
    )

  return match?.label ?? 'Dashboard'
}

function getInitials(name: string) {
  if (!name.trim()) return 'FU'

  return name
    .trim()
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
}

export function DashboardShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const [user, setUser] = useState<LoggedInUser | null>(null)

  const title = usePageTitle()
  const pathname = usePathname()

  useEffect(() => {
    setOpen(false)
  }, [pathname])

  useEffect(() => {
    const storedUser = localStorage.getItem('faceiq0_user')

    if (!storedUser) return

    try {
      setUser(JSON.parse(storedUser) as LoggedInUser)
    } catch (error) {
      console.error('Failed to read logged-in faculty', error)
    }
  }, [])

  const displayName = user?.name || 'Faculty User'
  const displayEmail = user?.email || 'faculty@institution.edu'
  const initials = useMemo(() => getInitials(displayName), [displayName])

  return (
    <div className="flex min-h-dvh bg-background">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-sidebar-border bg-sidebar lg:block">
        <SidebarNav />
      </aside>

      <div
        className={cn(
          'fixed inset-0 z-50 lg:hidden',
          open ? 'pointer-events-auto' : 'pointer-events-none',
        )}
      >
        <div
          className={cn(
            'absolute inset-0 bg-background/70 backdrop-blur-sm transition-opacity',
            open ? 'opacity-100' : 'opacity-0',
          )}
          onClick={() => setOpen(false)}
        />

        <aside
          className={cn(
            'absolute inset-y-0 left-0 w-64 border-r border-sidebar-border bg-sidebar transition-transform duration-300',
            open ? 'translate-x-0' : '-translate-x-full',
          )}
        >
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-4"
            onClick={() => setOpen(false)}
            aria-label="Close navigation"
          >
            <X className="size-5" />
          </Button>

          <SidebarNav onNavigate={() => setOpen(false)} />
        </aside>
      </div>

      <div className="flex min-w-0 flex-1 flex-col lg:pl-64">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur-md sm:px-6">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setOpen(true)}
            aria-label="Open navigation"
          >
            <Menu className="size-5" />
          </Button>

          <h1 className="text-lg font-semibold tracking-tight">{title}</h1>

          <div className="ml-auto flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium leading-tight">{displayName}</p>
              <p className="text-xs text-muted-foreground">{displayEmail}</p>
            </div>

            <span className="flex size-9 items-center justify-center rounded-full bg-primary/15 text-sm font-semibold text-primary">
              {initials}
            </span>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  )
}