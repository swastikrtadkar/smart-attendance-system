'use client'

import { Loader2, Lock, Mail } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { AuthShell } from '@/components/auth/auth-shell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function LoginPage() {
  const router = useRouter()

  const [form, setForm] = useState({
    email: '',
    password: '',
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!form.email.trim() || !form.password.trim()) {
      setError('Please enter email and password.')
      return
    }

    try {
      setLoading(true)
      setError('')

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: form.email,
          password: form.password,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Invalid email or password')
      }

      localStorage.setItem('faceiq0_user', JSON.stringify(data.user))

      router.push('/dashboard')
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell title="Sign in" subtitle="Access your faculty attendance dashboard.">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && (
          <div className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <div className="flex flex-col gap-2">
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              required
              placeholder="faculty@institution.edu"
              className="pl-9"
              value={form.email}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  email: e.target.value,
                }))
              }
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
              placeholder="Enter password"
              className="pl-9"
              value={form.password}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  password: e.target.value,
                }))
              }
            />
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <input
            type="checkbox"
            className="size-4 rounded border-border bg-input/40 accent-primary"
            defaultChecked
          />
          Keep me signed in
        </label>

        <Button type="submit" size="lg" className="h-11 w-full" disabled={loading}>
          {loading ? (
            <span className="flex items-center gap-2">
              <Loader2 className="size-4 animate-spin" />
              Signing in...
            </span>
          ) : (
            'Sign in'
          )}
        </Button>
      </form>
    </AuthShell>
  )
}