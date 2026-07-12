'use client'

import {
  CalendarX,
  ChevronLeft,
  ChevronRight,
  Download,
  Loader2,
  TrendingUp,
  Users,
  type LucideIcon,
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

const RECORDS_PER_PAGE = 10

type ReportView = 'all-students' | 'classes' | 'low-attendance'
type FaceStatus = 'registered' | 'pending' | 'not-registered'

type StudentReport = {
  id: string
  name: string
  department: string
  year: string
  faceStatus: FaceStatus
  attendancePercentage: number
  createdAt: string
}

type ClassReport = {
  id: string
  date: string
  department: string
  facultyId: string
  subject: string
  totalStudents: number
  studentsPresent: number
  studentsAbsent: number
  acceptanceStatus: string
}

type ReportsData = {
  students: StudentReport[]
  classes: ClassReport[]
  lowAttendanceStudents: StudentReport[]
}

function SummaryCard({
  label,
  value,
  icon: Icon,
  active,
  accent,
  onClick,
}: {
  label: string
  value: string | number
  icon: LucideIcon
  active: boolean
  accent: 'primary' | 'destructive' | 'muted'
  onClick: () => void
}) {
  const accentClass =
    accent === 'primary'
      ? 'bg-primary/12 text-primary'
      : accent === 'destructive'
        ? 'bg-destructive/12 text-destructive'
        : 'bg-muted text-muted-foreground'

  return (
    <button type="button" onClick={onClick} className="h-full text-left">
      <Card
        className={cn(
          'h-full transition-colors hover:border-primary/40',
          active && 'border-primary/60 bg-primary/5',
        )}
      >
        <CardContent className="flex items-start justify-between gap-4 p-5">
          <div className="flex min-w-0 flex-col gap-2">
            <p className="truncate text-sm text-muted-foreground">{label}</p>
            <p className="text-3xl font-semibold tracking-tight">{value}</p>
          </div>

          <span
            className={cn(
              'flex size-11 shrink-0 items-center justify-center rounded-lg',
              accentClass,
            )}
          >
            <Icon className="size-5" />
          </span>
        </CardContent>
      </Card>
    </button>
  )
}

function csvEscape(value: string | number) {
  const safeValue = String(value).replace(/"/g, '""')
  return `"${safeValue}"`
}

export default function ReportsPage() {
  const [date, setDate] = useState('')
  const [dept, setDept] = useState('all')
  const [year, setYear] = useState('all')
  const [page, setPage] = useState(1)
  const [view, setView] = useState<ReportView>('all-students')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [reports, setReports] = useState<ReportsData>({
    students: [],
    classes: [],
    lowAttendanceStudents: [],
  })

  useEffect(() => {
    async function fetchReports() {
      try {
        setLoading(true)
        setError('')

        const response = await fetch('/api/reports', {
          cache: 'no-store',
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.message || 'Failed to fetch reports')
        }

        setReports({
          students: data.students ?? [],
          classes: data.classes ?? [],
          lowAttendanceStudents: data.lowAttendanceStudents ?? [],
        })
      } catch (err) {
        console.error(err)
        setError(err instanceof Error ? err.message : 'Unable to load reports.')
      } finally {
        setLoading(false)
      }
    }

    fetchReports()
  }, [])

  const departments = useMemo(() => {
    const values = [
      ...reports.students.map((student) => student.department),
      ...reports.classes.map((record) => record.department),
    ]
      .map((item) => String(item || '').trim())
      .filter(Boolean)

    return Array.from(new Set(values))
  }, [reports.students, reports.classes])

  const years = useMemo(() => {
    const values = reports.students
      .map((student) => String(student.year || '').trim())
      .filter(Boolean)

    return Array.from(new Set(values))
  }, [reports.students])

  const filteredAllStudents = useMemo(() => {
    return reports.students.filter((student) => {
      const matchesDept = dept === 'all' || student.department === dept
      const matchesYear = year === 'all' || student.year === year

      return matchesDept && matchesYear
    })
  }, [reports.students, dept, year])

  const filteredClasses = useMemo(() => {
    return reports.classes.filter((record) => {
      const matchesDate = !date || record.date === date
      const matchesDept = dept === 'all' || record.department === dept

      return matchesDate && matchesDept
    })
  }, [reports.classes, date, dept])

  const filteredLowAttendance = useMemo(() => {
    return reports.lowAttendanceStudents.filter((student) => {
      const matchesDept = dept === 'all' || student.department === dept
      const matchesYear = year === 'all' || student.year === year

      return matchesDept && matchesYear
    })
  }, [reports.lowAttendanceStudents, dept, year])

  const activeRecords =
    view === 'all-students'
      ? filteredAllStudents
      : view === 'classes'
        ? filteredClasses
        : filteredLowAttendance

  const totalPages = Math.max(1, Math.ceil(activeRecords.length / RECORDS_PER_PAGE))

  const paginatedAllStudents = useMemo(() => {
    const start = (page - 1) * RECORDS_PER_PAGE
    return filteredAllStudents.slice(start, start + RECORDS_PER_PAGE)
  }, [filteredAllStudents, page])

  const paginatedClasses = useMemo(() => {
    const start = (page - 1) * RECORDS_PER_PAGE
    return filteredClasses.slice(start, start + RECORDS_PER_PAGE)
  }, [filteredClasses, page])

  const paginatedLowAttendance = useMemo(() => {
    const start = (page - 1) * RECORDS_PER_PAGE
    return filteredLowAttendance.slice(start, start + RECORDS_PER_PAGE)
  }, [filteredLowAttendance, page])

  const currentCount =
    view === 'all-students'
      ? paginatedAllStudents.length
      : view === 'classes'
        ? paginatedClasses.length
        : paginatedLowAttendance.length

  function resetToFirstPage() {
    setPage(1)
  }

  function clearFilters() {
    setDate('')
    setDept('all')
    setYear('all')
    setPage(1)
  }

  function changeView(nextView: ReportView) {
    setView(nextView)
    setDate('')
    setDept('all')
    setYear('all')
    setPage(1)
  }

  function exportReport() {
    const headers =
      view === 'classes'
        ? [
            'Session ID',
            'Date',
            'Department',
            'Faculty ID',
            'Subject',
            'Students Present',
            'Students Absent',
            'Total Students',
            'Acceptance Status',
          ]
        : [
            'Student ID',
            'Student Name',
            'Department',
            'Year',
            'Attendance %',
            'Face Status',
            'Created At',
          ]

    const rows =
      view === 'all-students'
        ? filteredAllStudents.map((student) => [
            student.id,
            student.name,
            student.department,
            student.year,
            student.attendancePercentage,
            student.faceStatus,
            student.createdAt,
          ])
        : view === 'classes'
          ? filteredClasses.map((record) => [
              record.id,
              record.date,
              record.department,
              record.facultyId,
              record.subject,
              record.studentsPresent,
              record.studentsAbsent,
              record.totalStudents,
              record.acceptanceStatus,
            ])
          : filteredLowAttendance.map((student) => [
              student.id,
              student.name,
              student.department,
              student.year,
              student.attendancePercentage,
              student.faceStatus,
              student.createdAt,
            ])

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((value) => csvEscape(value)).join(',')),
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)

    const link = document.createElement('a')
    link.href = url
    link.download = `${view}-report-${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Attendance Reports"
        description="View all students, class summaries, or low-attendance details."
        action={
          <Button
            size="lg"
            className="gap-2"
            onClick={exportReport}
            disabled={loading || activeRecords.length === 0}
          >
            <Download className="size-4" />
            Export Report
          </Button>
        }
      />

      {error && (
        <div className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="grid grid-cols-3 gap-4">
        <SummaryCard
          label="All Students"
          value={reports.students.length}
          icon={Users}
          active={view === 'all-students'}
          accent="muted"
          onClick={() => changeView('all-students')}
        />

        <SummaryCard
          label="Classes Held"
          value={reports.classes.length}
          icon={TrendingUp}
          active={view === 'classes'}
          accent="primary"
          onClick={() => changeView('classes')}
        />

        <SummaryCard
          label="Low Attendance"
          value={reports.lowAttendanceStudents.length}
          icon={CalendarX}
          active={view === 'low-attendance'}
          accent="destructive"
          onClick={() => changeView('low-attendance')}
        />
      </div>

      <Card>
        <CardContent className="flex flex-col gap-4 p-5">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {view === 'classes' && (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="f-date">Date</Label>
                <Input
                  id="f-date"
                  type="date"
                  value={date}
                  onChange={(event) => {
                    setDate(event.target.value)
                    resetToFirstPage()
                  }}
                />
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="f-dept">Department</Label>
              <Select
                id="f-dept"
                value={dept}
                onChange={(event) => {
                  setDept(event.target.value)
                  resetToFirstPage()
                }}
              >
                <option value="all">All Departments</option>
                {departments.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </Select>
            </div>

            {view !== 'classes' && (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="f-year">Year</Label>
                <Select
                  id="f-year"
                  value={year}
                  onChange={(event) => {
                    setYear(event.target.value)
                    resetToFirstPage()
                  }}
                >
                  <option value="all">All Years</option>
                  {years.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </Select>
              </div>
            )}

            <div className="flex items-end">
              <Button variant="outline" size="lg" className="w-full" onClick={clearFilters}>
                Clear Filters
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center gap-2 rounded-xl border border-border py-16 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Loading reports from Google Sheets...
            </div>
          ) : view === 'all-students' ? (
            <TableContainer>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead className="hidden md:table-cell">Department</TableHead>
                    <TableHead className="hidden sm:table-cell">Year</TableHead>
                    <TableHead>Attendance %</TableHead>
                    <TableHead>Face Status</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {paginatedAllStudents.map((student) => (
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

                      <TableCell>{student.attendancePercentage}%</TableCell>

                      <TableCell>
                        <FaceStatusBadge status={student.faceStatus} />
                      </TableCell>
                    </TableRow>
                  ))}

                  {filteredAllStudents.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                        No students match your filters.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          ) : view === 'classes' ? (
            <TableContainer>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead className="hidden md:table-cell">Subject</TableHead>
                    <TableHead>Students Present</TableHead>
                    <TableHead>Students Absent</TableHead>
                    <TableHead className="hidden sm:table-cell">Total Students</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {paginatedClasses.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="text-muted-foreground">{record.date}</TableCell>

                      <TableCell className="font-medium">{record.department}</TableCell>

                      <TableCell className="hidden text-muted-foreground md:table-cell">
                        {record.subject || '-'}
                      </TableCell>

                      <TableCell>{record.studentsPresent}</TableCell>

                      <TableCell>{record.studentsAbsent}</TableCell>

                      <TableCell className="hidden text-muted-foreground sm:table-cell">
                        {record.totalStudents}
                      </TableCell>
                    </TableRow>
                  ))}

                  {filteredClasses.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                        No class records match your filters.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <TableContainer>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead className="hidden md:table-cell">Department</TableHead>
                    <TableHead className="hidden sm:table-cell">Year</TableHead>
                    <TableHead>Attendance %</TableHead>
                    <TableHead>Face Status</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {paginatedLowAttendance.map((student) => (
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
                        <span className="font-medium text-destructive">
                          {student.attendancePercentage}%
                        </span>
                      </TableCell>

                      <TableCell>
                        <FaceStatusBadge status={student.faceStatus} />
                      </TableCell>
                    </TableRow>
                  ))}

                  {filteredLowAttendance.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                        No low-attendance students match your filters.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          <div className="flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-muted-foreground">
              Showing {currentCount} of {activeRecords.length} records
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
    </div>
  )
}