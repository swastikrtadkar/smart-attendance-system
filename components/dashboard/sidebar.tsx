'use client'

import { LogOut } from 'lucide-react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'

import { navItems } from '@/components/dashboard/nav-items'
import { Logo } from '@/components/logo'
import { cn } from '@/lib/utils'

type LoggedInUser = {
  facultyId: string
  name: string
  email: string
  role: string
  department: string
  createdAt: string
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

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()
  const router = useRouter()

  const [user, setUser] = useState<LoggedInUser | null>(null)

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

  function handleSignOut() {
    localStorage.removeItem('faceiq0_user')
    onNavigate?.()
    router.push('/login')
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center border-b border-sidebar-border px-5">
        <Logo href="/dashboard" />
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {navItems.map((item) => {
          const active =
            item.href === '/dashboard'
              ? pathname === '/dashboard'
              : pathname.startsWith(item.href)

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                active
                  ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-sm'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
              )}
            >
              <item.icon className="size-4.5 shrink-0" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-sidebar-border p-3">
        <div className="flex items-center gap-3 rounded-lg px-3 py-2">
          <span className="flex size-9 items-center justify-center rounded-full bg-sidebar-accent text-sm font-medium text-sidebar-accent-foreground">
            {initials}
          </span>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{displayName}</p>
            <p className="truncate text-xs text-muted-foreground">{displayEmail}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSignOut}
          className="mt-1 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        >
          <LogOut className="size-4.5" />
          Sign out
        </button>
      </div>
    </div>
  )
}