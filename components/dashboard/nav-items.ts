import {
  BarChart3,
  ClipboardCheck,
  LayoutDashboard,
  ScanFace,
  Settings,
  Users,
  type LucideIcon,
} from 'lucide-react'

export interface NavItem {
  label: string
  href: string
  icon: LucideIcon
}

export const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Students', href: '/dashboard/students', icon: Users },
  { label: 'Face Registration', href: '/dashboard/face-registration', icon: ScanFace },
  { label: 'Mark Attendance', href: '/dashboard/attendance', icon: ClipboardCheck },
  { label: 'Reports', href: '/dashboard/reports', icon: BarChart3 },
  { label: 'Settings', href: '/dashboard/settings', icon: Settings },
]
