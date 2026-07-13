'use client'

import { Camera, CheckCircle2, RefreshCw, ScanFace, UserPlus } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'

import { PageHeader } from '@/components/dashboard/page-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { cn } from '@/lib/utils'

type Stage = 'idle' | 'camera' | 'captured' | 'registered'

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
    label: 'Start camera and position face inside the frame',
    tone: 'text-muted-foreground',
  },
  camera: {
    label: 'Camera active — ready to capture',
    tone: 'text-primary',
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
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const [stage, setStage] = useState<Stage>('idle')
  const [students, setStudents] = useState<Student[]>([])
  const [studentId, setStudentId] = useState('STU-013')
  const [studentName, setStudentName] = useState('')
  const [department, setDepartment] = useState('')
  const [year, setYear] = useState('')
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)

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

    return () => {
      stopCamera()
    }
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

  function stopCamera() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
  }

  async function startCamera() {
    try {
      setMessage('Starting camera...')
      setCapturedBlob(null)
      setCapturedImage(null)
      setStage('camera')

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setMessage('Camera is not supported in this browser.')
        setStage('idle')
        return
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user',
        },
        audio: false,
      })

      streamRef.current = stream

      setTimeout(async () => {
        if (!videoRef.current) {
          setMessage('Video element not ready. Refresh and try again.')
          setStage('idle')
          return
        }

        videoRef.current.srcObject = stream
        videoRef.current.muted = true
        videoRef.current.playsInline = true

        await videoRef.current.play()

        setMessage('Camera active. Position your face and capture.')
      }, 150)
    } catch (error) {
      console.error(error)
      setStage('idle')
      setMessage('Camera failed. Allow camera permission and try again.')
    }
  }

  function handleCapture() {
    if (!videoRef.current || !canvasRef.current) {
      setMessage('Camera is not ready.')
      return
    }

    const video = videoRef.current
    const canvas = canvasRef.current

    const width = video.videoWidth || 640
    const height = video.videoHeight || 480

    if (!width || !height) {
      setMessage('Camera is still loading. Wait 2 seconds and try again.')
      return
    }

    canvas.width = width
    canvas.height = height

    const context = canvas.getContext('2d')

    if (!context) {
      setMessage('Could not capture image.')
      return
    }

    context.drawImage(video, 0, 0, width, height)

    const imageData = canvas.toDataURL('image/jpeg', 0.95)

    fetch(imageData)
      .then((response) => response.blob())
      .then((blob) => {
        setCapturedBlob(blob)
        setCapturedImage(imageData)
        setStage('captured')
        setMessage('Face captured. Click Register Face.')
        stopCamera()
      })
      .catch(() => {
        setMessage('Could not create image file.')
      })
  }

  async function handleRegister() {
    if (!studentId.trim() || !studentName.trim() || !department || !year) {
      setMessage('Fill all student details first.')
      return
    }

    if (!capturedBlob) {
      setMessage('Capture face first.')
      return
    }

    try {
      setIsLoading(true)
      setMessage('Registering face...')

      const formData = new FormData()
      formData.append('student_id', studentId.trim())
      formData.append('name', studentName.trim())
      formData.append('department', department)
      formData.append('year', year)
      formData.append('file', capturedBlob, `${studentId.trim()}_face.jpg`)

      const response = await fetch('http://127.0.0.1:8000/register-face', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok || !data.registered) {
        setMessage(`Registration failed: ${data.reason || 'unknown error'}`)
        return
      }

      setStage('registered')
      setMessage('Face registered successfully.')
    } catch {
      setMessage('Backend connection failed. Make sure FastAPI is running.')
    } finally {
      setIsLoading(false)
    }
  }

  function handleReset() {
    stopCamera()
    setStage('idle')
    setStudentId('STU-013')
    setStudentName('')
    setDepartment(departments[0] || '')
    setYear(years[0] || '')
    setCapturedBlob(null)
    setCapturedImage(null)
    setMessage('')
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
              {stage === 'camera' && (
                <video
                  ref={videoRef}
                  className="h-full w-full object-cover"
                  muted
                  playsInline
                  autoPlay
                />
              )}

              {stage !== 'camera' && capturedImage && (
                <img
                  src={capturedImage}
                  alt="Captured face"
                  className="h-full w-full object-cover"
                />
              )}

              {stage !== 'camera' && !capturedImage && (
                <div className="absolute inset-0 flex items-center justify-center">
                  {stage === 'registered' ? (
                    <div className="flex flex-col items-center gap-3 text-primary">
                      <CheckCircle2 className="size-16" />
                      <p className="text-sm font-medium">Face enrolled</p>
                    </div>
                  ) : (
                    <ScanFace className="size-20 text-muted-foreground/40" />
                  )}
                </div>
              )}

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

              {stage === 'camera' && (
                <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-background/80 px-2.5 py-1 text-xs font-medium text-primary backdrop-blur">
                  <span className="size-1.5 animate-pulse rounded-full bg-primary" />
                  Live
                </span>
              )}
            </div>

            <canvas ref={canvasRef} className="hidden" />

            <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-4 py-3">
              <span
                className={cn(
                  'size-2 rounded-full',
                  stage === 'idle' ? 'bg-muted-foreground/50' : 'bg-primary',
                )}
              />
              <p className={cn('text-sm font-medium', status.tone)}>{status.label}</p>
            </div>

            {message && (
              <div className="rounded-lg border border-border bg-background px-4 py-3 text-sm text-muted-foreground">
                {message}
              </div>
            )}

            <div className="flex flex-col gap-2 sm:flex-row">
              {stage === 'idle' && (
                <Button size="lg" className="flex-1 gap-2" onClick={startCamera}>
                  <Camera className="size-4" />
                  Start Camera
                </Button>
              )}

              {stage === 'camera' && (
                <Button
                  variant="outline"
                  size="lg"
                  className="flex-1 gap-2"
                  onClick={handleCapture}
                >
                  <Camera className="size-4" />
                  Capture Face
                </Button>
              )}

              {stage === 'captured' && (
                <>
                  <Button
                    size="lg"
                    className="flex-1 gap-2"
                    onClick={handleRegister}
                    disabled={isLoading}
                  >
                    <UserPlus className="size-4" />
                    {isLoading ? 'Registering...' : 'Register Face'}
                  </Button>

                  <Button
                    variant="outline"
                    size="lg"
                    className="gap-2"
                    onClick={startCamera}
                    disabled={isLoading}
                  >
                    <RefreshCw className="size-4" />
                    Retake
                  </Button>
                </>
              )}

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
                disabled={isLoading || stage === 'registered'}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="sname">Full name</Label>
              <Input
                id="sname"
                placeholder="Student name"
                value={studentName}
                onChange={(event) => setStudentName(event.target.value)}
                disabled={isLoading || stage === 'registered'}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="sdept">Department</Label>
              <Select
                id="sdept"
                value={department}
                onChange={(event) => setDepartment(event.target.value)}
                disabled={isLoading || stage === 'registered'}
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
                disabled={isLoading || stage === 'registered'}
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
                Start the camera, capture the student&apos;s face, then register it.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}