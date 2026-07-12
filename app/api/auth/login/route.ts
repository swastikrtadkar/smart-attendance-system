import { NextResponse } from 'next/server'

import { readSheet } from '@/lib/google-sheets'

type FacultyUser = {
  facultyId: string
  name: string
  email: string
  role: string
  department: string
  createdAt: string
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const email = String(body.email ?? '').trim().toLowerCase()
    const password = String(body.password ?? '').trim()

    if (!email || !password) {
      return NextResponse.json(
        { message: 'Email and password are required' },
        { status: 400 },
      )
    }

    const rows = await readSheet('FacultyUsers!A2:G')

    const userRow = rows.find((row) => {
      const sheetEmail = String(row[2] ?? '').trim().toLowerCase()
      const sheetPassword = String(row[3] ?? '').trim()

      return sheetEmail === email && sheetPassword === password
    })

    if (!userRow) {
      return NextResponse.json(
        { message: 'Invalid email or password' },
        { status: 401 },
      )
    }

    const user: FacultyUser = {
      facultyId: userRow[0] ?? '',
      name: userRow[1] ?? '',
      email: userRow[2] ?? '',
      role: userRow[4] ?? 'faculty',
      department: userRow[5] ?? '',
      createdAt: userRow[6] ?? '',
    }

    return NextResponse.json({
      message: 'Login successful',
      user,
    })
  } catch (error) {
    console.error(error)

    return NextResponse.json(
      { message: 'Failed to login' },
      { status: 500 },
    )
  }
}