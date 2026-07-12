import { NextResponse } from 'next/server'

import { readSheet } from '@/lib/google-sheets'

type StudentReport = {
  id: string
  name: string
  department: string
  year: string
  faceStatus: string
  attendancePercentage: number
  createdAt: string
}

type AttendanceRecord = {
  id: string
  studentId: string
  name: string
  department: string
  date: string
  time: string
  status: string
  facultyId: string
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

function normalizeStatus(status: string) {
  return status.trim().toLowerCase()
}

export async function GET() {
  try {
    const studentRows = await readSheet('Students!A2:H')
    const attendanceRows = await readSheet('AttendanceRecords!A2:H')

    const attendanceRecords: AttendanceRecord[] = attendanceRows.map((row) => ({
      id: row[0] ?? '',
      studentId: row[1] ?? '',
      name: row[2] ?? '',
      department: row[3] ?? '',
      date: row[4] ?? '',
      time: row[5] ?? '',
      status: row[6] ?? '',
      facultyId: row[7] ?? '',
    }))

    const students: StudentReport[] = studentRows.map((row) => {
      const studentId = row[0] ?? ''

      const recordsForStudent = attendanceRecords.filter(
        (record) => record.studentId === studentId,
      )

      const presentCount = recordsForStudent.filter((record) => {
        const status = normalizeStatus(record.status)
        return status === 'present' || status === 'late'
      }).length

      const attendancePercentage =
        recordsForStudent.length > 0
          ? Math.round((presentCount / recordsForStudent.length) * 100)
          : Number(row[5] ?? 0)

      return {
        id: studentId,
        name: row[1] ?? '',
        department: row[2] ?? '',
        year: row[3] ?? '',
        faceStatus: row[4] ?? 'not-registered',
        attendancePercentage,
        createdAt: row[6] ?? '',
      }
    })

    const classMap = new Map<string, ClassReport>()

    attendanceRecords.forEach((record) => {
      if (!record.date || !record.department) return

      const key = `${record.date}-${record.department}`

      if (!classMap.has(key)) {
        classMap.set(key, {
          id: key,
          date: record.date,
          department: record.department,
          facultyId: record.facultyId,
          subject: 'Attendance Session',
          totalStudents: 0,
          studentsPresent: 0,
          studentsAbsent: 0,
          acceptanceStatus: 'Completed',
        })
      }

      const classRecord = classMap.get(key)
      if (!classRecord) return

      classRecord.totalStudents += 1

      const status = normalizeStatus(record.status)

      if (status === 'present' || status === 'late') {
        classRecord.studentsPresent += 1
      } else {
        classRecord.studentsAbsent += 1
      }
    })

    const classes = Array.from(classMap.values()).sort((a, b) =>
      b.date.localeCompare(a.date),
    )

    const lowAttendanceStudents = students
      .filter((student) => student.attendancePercentage < 75)
      .sort((a, b) => a.attendancePercentage - b.attendancePercentage)

    return NextResponse.json({
      students,
      classes,
      lowAttendanceStudents,
      attendanceRecords,
    })
  } catch (error) {
    console.error(error)

    return NextResponse.json(
      { message: 'Failed to fetch reports' },
      { status: 500 },
    )
  }
}