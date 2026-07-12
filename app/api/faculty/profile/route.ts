import { NextResponse } from 'next/server'

import { readSheet, updateSheet } from '@/lib/google-sheets'

type FacultyProfile = {
  facultyId: string
  name: string
  email: string
  role: string
  department: string
  createdAt: string
}

export async function PUT(request: Request) {
  try {
    const body = await request.json()

    const facultyId = String(body.facultyId ?? '').trim()
    const name = String(body.name ?? '').trim()
    const email = String(body.email ?? '').trim()
    const role = String(body.role ?? 'faculty').trim()
    const department = String(body.department ?? '').trim()
    const createdAt = String(body.createdAt ?? '').trim()

    if (!facultyId || !name || !email || !role || !department) {
      return NextResponse.json(
        { message: 'Faculty ID, name, email, role, and department are required' },
        { status: 400 },
      )
    }

    const rows = await readSheet('FacultyUsers!A2:G')

    const rowIndex = rows.findIndex((row) => String(row[0] ?? '').trim() === facultyId)

    if (rowIndex === -1) {
      return NextResponse.json(
        { message: 'Faculty profile not found' },
        { status: 404 },
      )
    }

    const sheetRowNumber = rowIndex + 2
    const existingPassword = rows[rowIndex]?.[3] ?? ''

    await updateSheet(`FacultyUsers!A${sheetRowNumber}:G${sheetRowNumber}`, [
      [
        facultyId,
        name,
        email,
        existingPassword,
        role,
        department,
        createdAt,
      ],
    ])

    const user: FacultyProfile = {
      facultyId,
      name,
      email,
      role,
      department,
      createdAt,
    }

    return NextResponse.json({
      message: 'Faculty profile updated',
      user,
    })
  } catch (error) {
    console.error(error)

    return NextResponse.json(
      { message: 'Failed to update faculty profile' },
      { status: 500 },
    )
  }
}