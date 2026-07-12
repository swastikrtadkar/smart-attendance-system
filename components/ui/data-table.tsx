import * as React from 'react'

import { cn } from '@/lib/utils'

function TableContainer({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      className={cn('w-full overflow-x-auto rounded-xl border border-border bg-card', className)}
      {...props}
    />
  )
}

function Table({ className, ...props }: React.ComponentProps<'table'>) {
  return <table className={cn('w-full caption-bottom text-sm', className)} {...props} />
}

function TableHeader({ className, ...props }: React.ComponentProps<'thead'>) {
  return (
    <thead
      className={cn('border-b border-border bg-muted/40 text-muted-foreground', className)}
      {...props}
    />
  )
}

function TableBody({ className, ...props }: React.ComponentProps<'tbody'>) {
  return <tbody className={cn('divide-y divide-border', className)} {...props} />
}

function TableRow({ className, ...props }: React.ComponentProps<'tr'>) {
  return <tr className={cn('transition-colors hover:bg-muted/30', className)} {...props} />
}

function TableHead({ className, ...props }: React.ComponentProps<'th'>) {
  return (
    <th
      className={cn(
        'h-11 px-4 text-left align-middle text-xs font-medium uppercase tracking-wide',
        className,
      )}
      {...props}
    />
  )
}

function TableCell({ className, ...props }: React.ComponentProps<'td'>) {
  return <td className={cn('px-4 py-3.5 align-middle', className)} {...props} />
}

export { TableContainer, Table, TableHeader, TableBody, TableRow, TableHead, TableCell }
