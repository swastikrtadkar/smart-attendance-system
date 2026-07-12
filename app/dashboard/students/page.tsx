'use client'

import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  Plus,
  Search,
  SlidersHorizontal,
  X,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

import { PageHeader } from '@/components/dashboard/page-header'
import { FaceStatusBadge } from '@/components/status-badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/data-table'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { cn } from '@/lib/utils'

const STUDENTS_PER_PAGE = 5

type FaceStatus = 'registered' | 'pending' | 'not-registered'

type SheetStudent = {
  id: string
  name: string
  department: string
  year: string
  faceStatus: FaceStatus
  attendancePercentage: number
  createdAt: string
}

const fallbackDepartments = ['Computer Science', 'Mechanical', 'Electronics']
const fallbackYears = ['1st Year', '2nd Year', '3rd Year', '4th Year']

export default function StudentsPage() {
  const [studentList, setStudentList] = useState<SheetStudent[]>([])
  const [query, setQuery] = useState('')
  const [dept, setDept] = useState('all')
  const [year, setYear] = useState('all')
  const [open, setOpen] = useState(false)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const departments = useMemo(() => {
    const values = studentList
      .map((student) => String(student.department || '').trim())
      .filter(Boolean)

    const uniqueDepartments = Array.from(new Set(values))

    return uniqueDepartments.length > 0 ? uniqueDepartments : fallbackDepartments
  }, [studentList])

  const years = useMemo(() => {
    const values = studentList
      .map((student) => String(student.year || '').trim())
      .filter(Boolean)

    const uniqueYears = Array.from(new Set(values))

    return uniqueYears.length > 0 ? uniqueYears : fallbackYears
  }, [studentList])

  const [form, setForm] = useState({
    id: '',
    name: '',
    department: fallbackDepartments[0],
    year: fallbackYears[0],
  })

  useEffect(() => {
    async function fetchStudents() {
      try {
        setLoading(true)
        setError('')

        const response = await fetch('/api/students', {
          cache: 'no-store',
        })

        if (!response.ok) {
          throw new Error('Failed to fetch students')
        }

        const data = await response.json()
        const list = Array.isArray(data) ? data : data.students ?? []

        setStudentList([...list].reverse())
      } catch (err) {
        console.error(err)
        setError('Unable to load students from Google Sheets.')
      } finally {
        setLoading(false)
      }
    }

    fetchStudents()
  }, [])

  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      department: departments.includes(prev.department) ? prev.department : departments[0],
      year: years.includes(prev.year) ? prev.year : years[0],
    }))
  }, [departments, years])

  const filtered = useMemo(() => {
    return studentList.filter((student) => {
      const matchesQuery =
        student.name.toLowerCase().includes(query.toLowerCase()) ||
        student.id.toLowerCase().includes(query.toLowerCase())

      const matchesDept = dept === 'all' || student.department === dept
      const matchesYear = year === 'all' || student.year === year

      return matchesQuery && matchesDept && matchesYear
    })
  }, [query, dept, year, studentList])

  const totalPages = Math.max(1, Math.ceil(filtered.length / STUDENTS_PER_PAGE))

  const paginatedStudents = useMemo(() => {
    const start = (page - 1) * STUDENTS_PER_PAGE
    return filtered.slice(start, start + STUDENTS_PER_PAGE)
  }, [filtered, page])

  function resetToFirstPage() {
    setPage(1)
  }

  async function handleAddStudent(e: React.FormEvent) {
    e.preventDefault()

    const newStudentData = {
      id: form.id.trim(),
      name: form.name.trim(),
      department: form.department,
      year: form.year,
    }

    if (!newStudentData.id || !newStudentData.name) return

    try {
      setSaving(true)
      setError('')

      const response = await fetch('/api/students', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newStudentData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to add student')
      }

      setStudentList((prev) => [data.student, ...prev])

      setForm({
        id: '',
        name: '',
        department: departments[0],
        year: years[0],
      })

      setPage(1)
      setOpen(false)
    } catch (err) {
      console.error(err)
      setError('Unable to add student to Google Sheets.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Student Management"
        description="Students are loaded from Google Sheets. Recently added students appear first."
        action={
          <Button size="lg" className="gap-2" onClick={() => setOpen(true)}>
            <Plus className="size-4" />
            Add Student
          </Button>
        }
      />

      {error && (
        <div className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <Card>
        <CardContent className="flex flex-col gap-4 p-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name or student ID…"
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value)
                  resetToFirstPage()
                }}
                className="pl-9"
              />
            </div>

            <div className="flex items-center gap-2 text-muted-foreground">
              <SlidersHorizontal className="hidden size-4 sm:block" />

              <Select
                value={dept}
                onChange={(event) => {
                  setDept(event.target.value)
                  resetToFirstPage()
                }}
                className="w-full min-w-40 sm:w-auto"
              >
                <option value="all">All Departments</option>
                {departments.map((department) => (
                  <option key={department} value={department}>
                    {department}
                  </option>
                ))}
              </Select>

              <Select
                value={year}
                onChange={(event) => {
                  setYear(event.target.value)
                  resetToFirstPage()
                }}
                className="w-full min-w-32 sm:w-auto"
              >
                <option value="all">All Years</option>
                {years.map((yearValue) => (
                  <option key={yearValue} value={yearValue}>
                    {yearValue}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <TableContainer>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead className="hidden md:table-cell">Department</TableHead>
                  <TableHead className="hidden sm:table-cell">Year</TableHead>
                  <TableHead>Face Status</TableHead>
                  <TableHead>Attendance %</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {loading && (
                  <TableRow>
                    <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="size-4 animate-spin" />
                        Loading students...
                      </div>
                    </TableCell>
                  </TableRow>
                )}

                {!loading &&
                  paginatedStudents.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {student.id}
                      </TableCell>

                      <TableCell className="font-medium">{student.name}</TableCell>

                      <TableCell className="hidden text-muted-foreground md:table-cell">
                        {student.department}
                      </TableCell>

                      <TableCell className="hidden text-muted-foreground sm:table-cell">
                        {student.year}
                      </TableCell>

                      <TableCell>
                        <FaceStatusBadge status={student.faceStatus} />
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
                            <div
                              className={cn(
                                'h-full rounded-full',
                                student.attendancePercentage >= 85
                                  ? 'bg-primary'
                                  : student.attendancePercentage >= 70
                                    ? 'bg-warning'
                                    : 'bg-destructive',
                              )}
                              style={{ width: `${student.attendancePercentage}%` }}
                            />
                          </div>

                          <span className="text-sm font-medium">
                            {student.attendancePercentage}%
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}

                {!loading && filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                      No students match your filters.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <div className="flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-muted-foreground">
              Showing {paginatedStudents.length} of {filtered.length} students
            </p>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                disabled={page === 1 || loading}
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              >
                <ChevronLeft className="size-4" />
                Previous
              </Button>

              <span className="rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground">
                Page {page} of {totalPages}
              </span>

              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                disabled={page === totalPages || loading}
                onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
              >
                Next
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl border border-border bg-card shadow-xl">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <div>
                <h3 className="font-semibold">Add Student</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  Add basic student details. Face registration can be done later.
                </p>
              </div>

              <Button variant="ghost" size="icon" onClick={() => setOpen(false)}>
                <X className="size-4" />
              </Button>
            </div>

            <form onSubmit={handleAddStudent} className="flex flex-col gap-4 p-5">
              <div className="flex flex-col gap-2">
                <Label htmlFor="student-id">Student ID</Label>
                <Input
                  id="student-id"
                  placeholder="STU-013"
                  value={form.id}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      id: event.target.value,
                    }))
                  }
                  required
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="student-name">Full Name</Label>
                <Input
                  id="student-name"
                  placeholder="Student name"
                  value={form.name}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      name: event.target.value,
                    }))
                  }
                  required
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="student-dept">Department</Label>
                  <Select
                    id="student-dept"
                    value={form.department}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        department: event.target.value,
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

                <div className="flex flex-col gap-2">
                  <Label htmlFor="student-year">Year</Label>
                  <Select
                    id="student-year"
                    value={form.year}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        year: event.target.value,
                      }))
                    }
                  >
                    {years.map((yearValue) => (
                      <option key={yearValue} value={yearValue}>
                        {yearValue}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>

              <div className="mt-2 flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>

                <Button type="submit" disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 size-4 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    'Add Student'
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}