import { ScanFace } from 'lucide-react'
import Link from 'next/link'

import { cn } from '@/lib/utils'

export function Logo({
  className,
  href = '/',
}: {
  className?: string
  href?: string
}) {
  return (
    <Link href={href} className={cn('flex items-center gap-2.5', className)}>
      <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
        <ScanFace className="size-5" />
      </span>
      <span className="flex flex-col leading-none">
        <span className="text-base font-semibold tracking-tight text-foreground">FaceMark</span>
        <span className="text-[11px] text-muted-foreground">Smart Attendance</span>
      </span>
    </Link>
  )
}
