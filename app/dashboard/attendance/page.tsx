'use client'

import { CheckCircle2, Clock, Loader2, Play, ScanFace, Square, XCircle } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { PageHeader } from '@/components/dashboard/page-header'
import { AttendanceStatusBadge } from '@/components/status-badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface Recognized {
  id: string
  name: string
  department: string
  time: string
  similarity?: number
}

interface MarkAttendanceResponse {
  attendance_marked: boolean
  message?: string
  reason?: string
  attendance_id?: string
  student_id?: string
  name?: string
  department?: string
  date?: string
  time?: string
  status?: string
  faculty_id?: string
  similarity?: number
  recognition?: {
    status: string
    student_id: string | null
    name: string | null
    folder?: string | null
    similarity?: number | null
    distance?: number | null
  }
}

const BACKEND_URL = 'http://127.0.0.1:8000'

export default function MarkAttendancePage() {
  const [running, setRunning] = useState(false)
  const [loading, setLoading] = useState(false)
  const [current, setCurrent] = useState<Recognized | null>(null)
  const [marked, setMarked] = useState<Recognized[]>([])
  const [showSuccess, setShowSuccess] = useState(false)
  const [error, setError] = useState('')

  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  useEffect(() => {
    return () => {
      stopCamera()
    }
  }, [])

  async function startCamera() {
    setError('')

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false,
      })

      streamRef.current = stream

      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }

      setRunning(true)
    } catch {
      setError('Camera access denied or unavailable.')
      setRunning(false)
    }
  }

  function stopCamera() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null
    }

    setRunning(false)
    setLoading(false)
  }

  async function captureAndMarkAttendance() {
    if (!videoRef.current || !canvasRef.current) return

    setLoading(true)
    setError('')

    const video = videoRef.current
    const canvas = canvasRef.current

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    const context = canvas.getContext('2d')
    if (!context) {
      setError('Could not capture image.')
      setLoading(false)
      return
    }

    context.drawImage(video, 0, 0, canvas.width, canvas.height)

    canvas.toBlob(
      async (blob) => {
        if (!blob) {
          setError('Could not create image file.')
          setLoading(false)
          return
        }

        const formData = new FormData()
        formData.append('file', blob, 'attendance-capture.jpg')

        try {
          const response = await fetch(`${BACKEND_URL}/mark-attendance`, {
            method: 'POST',
            body: formData,
          })

          const data: MarkAttendanceResponse = await response.json()

          if (!response.ok) {
            setError('Backend error while marking attendance.')
            return
          }

          if (data.attendance_marked) {
            const record: Recognized = {
              id: data.student_id || '',
              name: data.name || '',
              department: data.department || '',
              time: data.time || new Date().toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              }),
              similarity: data.similarity,
            }

            setCurrent(record)
            setMarked((prev) => {
              if (prev.some((item) => item.id === record.id)) return prev
              return [record, ...prev]
            })

            setShowSuccess(true)
            setTimeout(() => setShowSuccess(false), 1800)
          } else {
            const reason = data.reason || data.recognition?.status || 'not_recognized'

            if (reason === 'already_marked_today' && data.recognition) {
              setCurrent({
                id: data.recognition.student_id || '',
                name: data.recognition.name || '',
                department: '',
                time: new Date().toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                }),
                similarity: data.recognition.similarity || undefined,
              })
              setError('Attendance already marked today.')
            } else if (reason === 'no_face_detected') {
              setError('No face detected. Try again.')
            } else if (reason === 'multiple_faces_detected') {
              setError('Multiple faces detected. Use one face only.')
            } else if (reason === 'unknown') {
              setError('Face not recognized.')
            } else {
              setError(reason.replaceAll('_', ' '))
            }
          }
        } catch {
          setError('Could not connect to Python backend.')
        } finally {
          setLoading(false)
        }
      },
      'image/jpeg',
      0.95,
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Mark Attendance"
        description="Run facial recognition to mark students present automatically."
      />

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Recognition Camera</CardTitle>
          </CardHeader>

          <CardContent className="flex flex-col gap-4">
            <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-border bg-secondary/40">
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className={cn(
                  'h-full w-full object-cover',
                  !running && 'hidden',
                )}
              />

              {!running && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <ScanFace className="size-20 text-muted-foreground/40" />
                </div>
              )}

              {loading && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm">
                  <Loader2 className="size-16 animate-spin text-primary/70" />
                </div>
              )}

              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div
                  className={cn(
                    'size-48 rounded-2xl border-2 transition-colors sm:size-56',
                    running ? 'border-primary' : 'border-muted-foreground/30',
                  )}
                />
              </div>

              {running && (
                <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-background/80 px-2.5 py-1 text-xs font-medium text-primary backdrop-blur">
                  <span className="size-1.5 animate-pulse rounded-full bg-primary" />
                  Camera active
                </span>
              )}
            </div>

            <canvas ref={canvasRef} className="hidden" />

            {error && (
              <div className="flex items-center gap-2 rounded-lg border border-destructive/25 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
                <XCircle className="size-4" />
                {error}
              </div>
            )}

            <div className="flex flex-col gap-2 sm:flex-row">
              {!running ? (
                <Button size="lg" className="flex-1 gap-2" onClick={startCamera}>
                  <Play className="size-4" />
                  Start Camera
                </Button>
              ) : (
                <>
                  <Button
                    size="lg"
                    className="flex-1 gap-2"
                    onClick={captureAndMarkAttendance}
                    disabled={loading}
                  >
                    {loading ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <ScanFace className="size-4" />
                    )}
                    Capture & Mark Attendance
                  </Button>

                  <Button
                    variant="outline"
                    size="lg"
                    className="flex-1 gap-2"
                    onClick={stopCamera}
                    disabled={loading}
                  >
                    <Square className="size-4" />
                    Stop Camera
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Recognized Student</CardTitle>
            </CardHeader>

            <CardContent>
              {current ? (
                <div className="flex flex-col gap-4">
                  {showSuccess && (
                    <div className="flex items-center gap-2 rounded-lg border border-primary/25 bg-primary/10 px-4 py-3 text-sm font-medium text-primary">
                      <CheckCircle2 className="size-4" />
                      Attendance marked successfully
                    </div>
                  )}

                  <div className="flex items-center gap-4">
                    <span className="flex size-14 items-center justify-center rounded-full bg-primary/12 text-lg font-semibold text-primary">
                      {current.name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')}
                    </span>

                    <div>
                      <p className="text-lg font-semibold">{current.name}</p>
                      <p className="font-mono text-xs text-muted-foreground">{current.id}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <Detail label="Department" value={current.department || '—'} />

                    <Detail
                      label="Similarity"
                      value={
                        current.similarity
                          ? `${(current.similarity * 100).toFixed(2)}%`
                          : '—'
                      }
                    />

                    <Detail
                      label="Time"
                      value={
                        <span className="inline-flex items-center gap-1">
                          <Clock className="size-3.5" />
                          {current.time}
                        </span>
                      }
                    />

                    <div className="flex flex-col gap-1">
                      <span className="text-xs text-muted-foreground">Status</span>
                      <AttendanceStatusBadge status="present" />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 py-8 text-center text-muted-foreground">
                  <ScanFace className="size-10 opacity-40" />
                  <p className="text-sm">Start camera and capture a face.</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle>Marked This Session</CardTitle>
              <span className="rounded-full bg-primary/12 px-2.5 py-0.5 text-xs font-medium text-primary">
                {marked.length}
              </span>
            </CardHeader>

            <CardContent>
              {marked.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  No students marked yet.
                </p>
              ) : (
                <ul className="flex flex-col divide-y divide-border">
                  {marked.map((record) => (
                    <li
                      key={record.id}
                      className="flex items-center justify-between py-2.5 text-sm"
                    >
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="size-4 text-primary" />
                        <span className="font-medium">{record.name}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">{record.time}</span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function Detail({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  )
}