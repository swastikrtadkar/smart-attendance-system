import { NextResponse } from 'next/server'

import { appendSheet, readSheet } from '@/lib/google-sheets'

export async function GET() {
  try {
    const rows = await readSheet('Students!A2:G')

    const students = rows.map((row) => ({
      id: row[0] ?? '',
      name: row[1] ?? '',
      department: row[2] ?? '',
      year: row[3] ?? '',
      faceStatus: row[4] ?? 'not-registered',
      attendancePercentage: Number(row[5] ?? 0),
      createdAt: row[6] ?? '',
    }))

    return NextResponse.json({ students })
  } catch (error) {
    console.error(error)

    return NextResponse.json(
      { message: 'Failed to fetch students' },
      { status: 500 },
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const id = body.id || body.student_id || `STU-${Date.now()}`
    const name = body.name
    const department = body.department
    const year = body.year
    const createdAt = new Date().toISOString().slice(0, 10)

    if (!name || !department || !year) {
      return NextResponse.json(
        { message: 'Name, department, and year are required' },
        { status: 400 },
      )
    }

    await appendSheet('Students!A:G', [
      [
        id,
        name,
        department,
        year,
        'not-registered',
        '0',
        createdAt,
      ],
    ])

    return NextResponse.json({
      student: {
        id,
        name,
        department,
        year,
        faceStatus: 'not-registered',
        attendancePercentage: 0,
        createdAt,
      },
    })
  } catch (error) {
    console.error(error)

    return NextResponse.json(
      { message: 'Failed to add student' },
      { status: 500 },
    )
  }
}