'use client'

import { Percent, UserCheck, Users, UserX } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

import { PageHeader } from '@/components/dashboard/page-header'
import { StatCard } from '@/components/dashboard/stat-card'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface StudentReport {
  id: string
  name: string
  department: string
  year: string
  faceStatus: string
  attendancePercentage: number
  createdAt: string
}

interface AttendanceRecord {
  id: string
  studentId: string
  name: string
  department: string
  date: string
  time: string
  status: string
  facultyId: string
}

interface ReportsResponse {
  students: StudentReport[]
  attendanceRecords: AttendanceRecord[]
}

function getTodayDate() {
  return new Date().toISOString().slice(0, 10)
}

function isPresentStatus(status: string) {
  const value = status.trim().toLowerCase()
  return value === 'present' || value === 'late'
}

function getDayName(date: string) {
  return new Date(date).toLocaleDateString('en-US', {
    weekday: 'short',
  })
}

export default function DashboardPage() {
  const [students, setStudents] = useState<StudentReport[]>([])
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadDashboardData() {
      try {
        setLoading(true)

        const response = await fetch('/api/reports', {
          cache: 'no-store',
        })

        if (!response.ok) {
          throw new Error('Failed to fetch dashboard data')
        }

        const data: ReportsResponse = await response.json()

        setStudents(data.students ?? [])
        setAttendanceRecords(data.attendanceRecords ?? [])
      } catch (error) {
        console.error(error)
        setStudents([])
        setAttendanceRecords([])
      } finally {
        setLoading(false)
      }
    }

    loadDashboardData()
  }, [])

  const dashboardStats = useMemo(() => {
    const totalStudents = students.length
    const today = getTodayDate()

    const todayRecords = attendanceRecords.filter((record) => {
      return String(record.date).trim() === today
    })

    const presentToday = todayRecords.filter((record) => {
      return isPresentStatus(record.status)
    }).length

    const absentToday = Math.max(totalStudents - presentToday, 0)

    const attendancePercentage =
      totalStudents > 0 ? Math.round((presentToday / totalStudents) * 100) : 0

    return {
      totalStudents,
      presentToday,
      absentToday,
      attendancePercentage,
    }
  }, [students, attendanceRecords])

  const weeklyData = useMemo(() => {
    const grouped = new Map<string, { day: string; present: number; total: number }>()

    attendanceRecords.forEach((record) => {
      if (!record.date) return

      const day = getDayName(record.date)

      if (!grouped.has(record.date)) {
        grouped.set(record.date, {
          day,
          present: 0,
          total: students.length,
        })
      }

      const item = grouped.get(record.date)
      if (!item) return

      if (isPresentStatus(record.status)) {
        item.present += 1
      }
    })

    return Array.from(grouped.entries())
      .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
      .slice(-6)
      .map(([, value]) => value)
  }, [attendanceRecords, students.length])

  const maxTotal = Math.max(...weeklyData.map((item) => item.total), students.length, 1)

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Overview"
        description="A simple summary of today's attendance from Google Sheets."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Students"
          value={loading ? '...' : dashboardStats.totalStudents}
          icon={Users}
          trend="From Students sheet"
          trendUp
          accent="primary"
        />

        <StatCard
          label="Present Today"
          value={loading ? '...' : dashboardStats.presentToday}
          icon={UserCheck}
          trend="From AttendanceRecords"
          trendUp
          accent="primary"
        />

        <StatCard
          label="Absent Today"
          value={loading ? '...' : dashboardStats.absentToday}
          icon={UserX}
          trend="Calculated from total"
          trendUp
          accent="destructive"
        />

        <StatCard
          label="Attendance %"
          value={loading ? '...' : `${dashboardStats.attendancePercentage}%`}
          icon={Percent}
          trend="Today"
          trendUp
          accent="warning"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Weekly Attendance Overview</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            Present students per recorded attendance date.
          </p>
        </CardHeader>

        <CardContent>
          {weeklyData.length === 0 ? (
            <div className="flex h-64 items-center justify-center rounded-xl border border-border text-sm text-muted-foreground">
              No attendance records available yet.
            </div>
          ) : (
            <div className="flex h-64 items-end gap-3 rounded-xl border border-border bg-card/40 p-4">
              {weeklyData.map((item, index) => {
                const percentage =
                  maxTotal > 0 ? Math.max((item.present / maxTotal) * 100, 4) : 4

                return (
                  <div key={`${item.day}-${index}`} className="flex flex-1 flex-col items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {item.present}/{item.total}
                    </span>

                    <div className="flex h-44 w-full max-w-12 items-end rounded-full bg-muted">
                      <div
                        className="w-full rounded-full bg-primary"
                        style={{
                          height: `${percentage}%`,
                        }}
                      />
                    </div>

                    <span className="text-xs text-muted-foreground">{item.day}</span>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}