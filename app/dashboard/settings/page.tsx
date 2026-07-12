'use client'

import { CheckCircle2, Loader2, Mail, Power, Save, UserRound } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

import { PageHeader } from '@/components/dashboard/page-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { cn } from '@/lib/utils'

type LoggedInUser = {
  facultyId?: string
  faculty_id?: string
  name?: string
  email?: string
  role?: string
  department?: string
  createdAt?: string
  created_at?: string
}

type FacultyProfile = {
  facultyId: string
  name: string
  email: string
  role: string
  department: string
  createdAt: string
}

type Student = {
  id?: string
  student_id?: string
  name?: string
  department?: string
  year?: string
}

const fallbackDepartments = ['Computer Science', 'Mechanical', 'Electronics']

function normalizeFaculty(user: LoggedInUser): FacultyProfile {
  return {
    facultyId: user.facultyId ?? user.faculty_id ?? '',
    name: user.name ?? '',
    email: user.email ?? '',
    role: user.role ?? 'faculty',
    department: user.department || fallbackDepartments[0],
    createdAt: user.createdAt ?? user.created_at ?? '',
  }
}

export default function SettingsPage() {
  const [attendanceOpen, setAttendanceOpen] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [students, setStudents] = useState<Student[]>([])

  const [faculty, setFaculty] = useState<FacultyProfile>({
    facultyId: '',
    name: '',
    email: '',
    role: 'faculty',
    department: fallbackDepartments[0],
    createdAt: '',
  })

  useEffect(() => {
    const storedUser = localStorage.getItem('faceiq0_user')

    if (!storedUser) return

    try {
      const user = JSON.parse(storedUser) as LoggedInUser
      setFaculty(normalizeFaculty(user))
    } catch (error) {
      console.error('Failed to read logged-in faculty', error)
    }
  }, [])

  useEffect(() => {
    async function loadStudents() {
      try {
        const response = await fetch('/api/students', {
          cache: 'no-store',
        })

        if (!response.ok) return

        const data = await response.json()
        const list = Array.isArray(data) ? data : data.students || []

        setStudents(list)
      } catch {
        setStudents([])
      }
    }

    loadStudents()
  }, [])

  const departments = useMemo(() => {
    const values = students
      .map((student) => String(student.department || '').trim())
      .filter(Boolean)

    const uniqueDepartments = Array.from(new Set(values))

    return uniqueDepartments.length > 0 ? uniqueDepartments : fallbackDepartments
  }, [students])

  useEffect(() => {
    if (!faculty.department && departments.length > 0) {
      setFaculty((prev) => ({
        ...prev,
        department: departments[0],
      }))
    }
  }, [departments, faculty.department])

  async function handleSave() {
    try {
      setSaving(true)
      setSaved(false)
      setError('')

      const response = await fetch('/api/faculty/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(faculty),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to save profile')
      }

      localStorage.setItem('faceiq0_user', JSON.stringify(data.user))

      setFaculty(data.user)
      setSaved(true)
      setTimeout(() => setSaved(false), 2200)
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : 'Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Settings"
        description="Manage faculty profile and attendance acceptance status."
        action={
          <Button size="lg" className="gap-2" onClick={handleSave} disabled={saving}>
            {saving ? (
              <Loader2 className="size-4 animate-spin" />
            ) : saved ? (
              <CheckCircle2 className="size-4" />
            ) : (
              <Save className="size-4" />
            )}
            {saving ? 'Saving...' : saved ? 'Saved' : 'Save Settings'}
          </Button>
        }
      />

      {error && (
        <div className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex-row items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-lg bg-primary/12 text-primary">
              <UserRound className="size-5" />
            </span>
            <CardTitle>Faculty Profile</CardTitle>
          </CardHeader>

          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="faculty-name">Faculty name</Label>
              <Input
                id="faculty-name"
                value={faculty.name}
                onChange={(e) =>
                  setFaculty((prev) => ({
                    ...prev,
                    name: e.target.value,
                  }))
                }
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="faculty-id">Faculty ID</Label>
              <Input
                id="faculty-id"
                value={faculty.facultyId}
                readOnly
                className="cursor-not-allowed opacity-75"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="faculty-email">Email</Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="faculty-email"
                  type="email"
                  className="pl-9"
                  value={faculty.email}
                  onChange={(e) =>
                    setFaculty((prev) => ({
                      ...prev,
                      email: e.target.value,
                    }))
                  }
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="faculty-role">Role</Label>
              <Select
                id="faculty-role"
                value={faculty.role}
                onChange={(e) =>
                  setFaculty((prev) => ({
                    ...prev,
                    role: e.target.value,
                  }))
                }
              >
                <option value="faculty">Faculty</option>
                <option value="teacher">Teacher</option>
                <option value="admin">Administrator</option>
              </Select>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="faculty-dept">Department</Label>
              <Select
                id="faculty-dept"
                value={faculty.department}
                onChange={(e) =>
                  setFaculty((prev) => ({
                    ...prev,
                    department: e.target.value,
                  }))
                }
              >
                {departments.map((department) => (
                  <option key={department} value={department}>
                    {department}
                  </option>
                ))}
              </Select>
            </div>

            {faculty.createdAt && (
              <p className="text-xs text-muted-foreground">
                Profile created on {faculty.createdAt}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center gap-3">
            <span
              className={cn(
                'flex size-9 items-center justify-center rounded-lg',
                attendanceOpen
                  ? 'bg-primary/12 text-primary'
                  : 'bg-muted text-muted-foreground',
              )}
            >
              <Power className="size-5" />
            </span>
            <CardTitle>Attendance Acceptance</CardTitle>
          </CardHeader>

          <CardContent className="flex flex-col gap-5">
            <div className="rounded-xl border border-border bg-muted/20 p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-medium">Accept attendance manually</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Turn this on when students are allowed to mark attendance for the current
                    session.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setAttendanceOpen((value) => !value)}
                  className={cn(
                    'relative h-8 w-14 shrink-0 rounded-full transition-colors',
                    attendanceOpen ? 'bg-primary' : 'bg-muted-foreground/35',
                  )}
                  aria-label="Toggle attendance acceptance"
                >
                  <span
                    className={cn(
                      'absolute left-1 top-1 size-6 rounded-full bg-white shadow-sm transition-transform',
                      attendanceOpen ? 'translate-x-6' : 'translate-x-0',
                    )}
                  />
                </button>
              </div>

              <div
                className={cn(
                  'mt-5 rounded-lg border px-4 py-3 text-sm font-medium',
                  attendanceOpen
                    ? 'border-primary/25 bg-primary/10 text-primary'
                    : 'border-border bg-background/40 text-muted-foreground',
                )}
              >
                {attendanceOpen
                  ? 'Attendance acceptance is ON. Students can be marked present.'
                  : 'Attendance acceptance is OFF. Attendance marking is currently closed.'}
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              This setting is manual for now. Later, the backend can store this status per faculty,
              subject, class, or session.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}