'use client'

import { Camera, CheckCircle2, RefreshCw, ScanFace, UserPlus } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

import { PageHeader } from '@/components/dashboard/page-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { cn } from '@/lib/utils'

type Stage = 'idle' | 'detected' | 'captured' | 'registered'

interface Student {
  student_id?: string
  id?: string
  name: string
  department: string
  year: string
  face_status?: string
  faceStatus?: string
}

const fallbackDepartments = ['Computer Science', 'Mechanical', 'Electronics']
const fallbackYears = ['1st Year', '2nd Year', '3rd Year', '4th Year']

const statusCopy: Record<Stage, { label: string; tone: string }> = {
  idle: {
    label: 'Camera ready — position the face inside the frame',
    tone: 'text-muted-foreground',
  },
  detected: {
    label: 'Face detected — ready to capture',
    tone: 'text-warning',
  },
  captured: {
    label: 'Face captured — ready to register',
    tone: 'text-primary',
  },
  registered: {
    label: 'Registration successful',
    tone: 'text-primary',
  },
}

export default function FaceRegistrationPage() {
  const [stage, setStage] = useState<Stage>('idle')
  const [students, setStudents] = useState<Student[]>([])
  const [studentId, setStudentId] = useState('STU-013')
  const [studentName, setStudentName] = useState('')
  const [department, setDepartment] = useState('')
  const [year, setYear] = useState('')

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

    return values.length > 0 ? Array.from(new Set(values)) : fallbackDepartments
  }, [students])

  const years = useMemo(() => {
    const values = students
      .map((student) => String(student.year || '').trim())
      .filter(Boolean)

    return values.length > 0 ? Array.from(new Set(values)) : fallbackYears
  }, [students])

  useEffect(() => {
    if (!department && departments.length > 0) {
      setDepartment(departments[0])
    }

    if (!year && years.length > 0) {
      setYear(years[0])
    }
  }, [departments, years, department, year])

  function handleCapture() {
    setStage('detected')
    setTimeout(() => setStage('captured'), 900)
  }

  function handleRegister() {
    setStage('registered')
  }

  function handleReset() {
    setStage('idle')
    setStudentId('STU-013')
    setStudentName('')
    setDepartment(departments[0] || '')
    setYear(years[0] || '')
  }

  const status = statusCopy[stage]

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Face Registration"
        description="Enroll a student's face to enable automatic attendance recognition."
      />

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Camera Preview</CardTitle>
          </CardHeader>

          <CardContent className="flex flex-col gap-4">
            <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-border bg-secondary/40">
              <div className="absolute inset-0 flex items-center justify-center">
                {stage === 'registered' ? (
                  <div className="flex flex-col items-center gap-3 text-primary">
                    <CheckCircle2 className="size-16" />
                    <p className="text-sm font-medium">Face enrolled</p>
                  </div>
                ) : (
                  <ScanFace
                    className={cn(
                      'size-20 transition-colors',
                      stage === 'idle' ? 'text-muted-foreground/40' : 'text-primary/70',
                    )}
                  />
                )}
              </div>

              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div
                  className={cn(
                    'relative size-48 rounded-2xl border-2 transition-colors sm:size-56',
                    stage === 'idle' ? 'border-muted-foreground/30' : 'border-primary',
                  )}
                >
                  <span className="absolute -left-0.5 -top-0.5 size-5 rounded-tl-2xl border-l-2 border-t-2 border-primary" />
                  <span className="absolute -right-0.5 -top-0.5 size-5 rounded-tr-2xl border-r-2 border-t-2 border-primary" />
                  <span className="absolute -bottom-0.5 -left-0.5 size-5 rounded-bl-2xl border-b-2 border-l-2 border-primary" />
                  <span className="absolute -bottom-0.5 -right-0.5 size-5 rounded-br-2xl border-b-2 border-r-2 border-primary" />
                </div>
              </div>

              {(stage === 'detected' || stage === 'captured') && (
                <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-background/80 px-2.5 py-1 text-xs font-medium text-primary backdrop-blur">
                  <span className="size-1.5 animate-pulse rounded-full bg-primary" />
                  Live
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-4 py-3">
              <span
                className={cn(
                  'size-2 rounded-full',
                  stage === 'idle' ? 'bg-muted-foreground/50' : 'bg-primary',
                )}
              />
              <p className={cn('text-sm font-medium', status.tone)}>{status.label}</p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                variant="outline"
                size="lg"
                className="flex-1 gap-2"
                onClick={handleCapture}
                disabled={stage === 'registered'}
              >
                <Camera className="size-4" />
                Capture Face
              </Button>

              <Button
                size="lg"
                className="flex-1 gap-2"
                onClick={handleRegister}
                disabled={stage !== 'captured'}
              >
                <UserPlus className="size-4" />
                Register Face
              </Button>

              {stage === 'registered' && (
                <Button variant="ghost" size="lg" className="gap-2" onClick={handleReset}>
                  <RefreshCw className="size-4" />
                  New
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Student Details</CardTitle>
          </CardHeader>

          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="sid">Student ID</Label>
              <Input
                id="sid"
                placeholder="STU-013"
                value={studentId}
                onChange={(event) => setStudentId(event.target.value)}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="sname">Full name</Label>
              <Input
                id="sname"
                placeholder="Student name"
                value={studentName}
                onChange={(event) => setStudentName(event.target.value)}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="sdept">Department</Label>
              <Select
                id="sdept"
                value={department}
                onChange={(event) => setDepartment(event.target.value)}
              >
                {departments.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </Select>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="syear">Year</Label>
              <Select
                id="syear"
                value={year}
                onChange={(event) => setYear(event.target.value)}
              >
                {years.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </Select>
            </div>

            {stage === 'registered' ? (
              <div className="mt-2 flex items-center gap-3 rounded-lg border border-primary/25 bg-primary/10 p-4">
                <CheckCircle2 className="size-5 text-primary" />
                <p className="text-sm font-medium text-primary">
                  Face registered successfully
                </p>
              </div>
            ) : (
              <p className="mt-2 text-xs text-muted-foreground">
                Capture the student&apos;s face, then register to link it to this profile.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}