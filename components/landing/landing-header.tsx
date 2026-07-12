import Link from 'next/link'

import { Logo } from '@/components/logo'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const navLinks = [
  { label: 'Features', href: '#features' },
  { label: 'How it works', href: '#how-it-works' },
  { label: 'Dashboard', href: '/dashboard' },
]

export function LandingHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
        <Logo />
        <nav className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className={cn(buttonVariants({ variant: 'ghost', size: 'lg' }), 'hidden sm:inline-flex')}
          >
            Sign in
          </Link>
          <Link href="/register" className={buttonVariants({ size: 'lg' })}>
            Get Started
          </Link>
        </div>
      </div>
    </header>
  )
}
