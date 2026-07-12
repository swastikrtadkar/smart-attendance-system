'use client'

import { Building2, Lock, Mail, User } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { AuthShell } from '@/components/auth/auth-shell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'

export default function RegisterPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    // Mock registration — no real backend. Redirect to the dashboard.
    setTimeout(() => router.push('/dashboard'), 700)
  }

  return (
    <AuthShell
      title="Create your account"
      subtitle="Set up access for your institution's admin or faculty."
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="name">Full name</Label>
          <div className="relative">
            <User className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input id="name" required placeholder="Jane Doe" className="pl-9" />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="institution">Institution</Label>
          <div className="relative">
            <Building2 className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="institution"
              required
              placeholder="Springfield University"
              className="pl-9"
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="role">Role</Label>
          <Select id="role" defaultValue="admin">
            <option value="admin">Administrator</option>
            <option value="faculty">Faculty</option>
          </Select>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              required
              placeholder="you@institution.edu"
              className="pl-9"
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="password"
              type="password"
              required
              placeholder="Create a password"
              className="pl-9"
            />
          </div>
        </div>

        <Button type="submit" size="lg" className="h-11 w-full" disabled={loading}>
          {loading ? 'Creating account…' : 'Create account'}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link href="/login" className="text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </AuthShell>
  )
}
