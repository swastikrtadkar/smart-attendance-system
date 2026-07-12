import { Badge } from '@/components/ui/badge'

export type AttendanceStatus = 'present' | 'absent' | 'late'
export type FaceStatus = 'registered' | 'pending' | 'not-registered'

export function AttendanceStatusBadge({ status }: { status: AttendanceStatus }) {
  if (status === 'present') return <Badge variant="success">Present</Badge>
  if (status === 'late') return <Badge variant="warning">Late</Badge>
  return <Badge variant="destructive">Absent</Badge>
}

export function FaceStatusBadge({ status }: { status: FaceStatus }) {
  if (status === 'registered') return <Badge variant="success">Registered</Badge>
  if (status === 'pending') return <Badge variant="warning">Pending</Badge>
  return <Badge variant="destructive">Not Registered</Badge>
}