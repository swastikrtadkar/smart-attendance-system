type WeeklyAttendanceItem = {
  day: string
  present: number
  total: number
}

const weeklyAttendance: WeeklyAttendanceItem[] = [
  { day: 'Mon', present: 0, total: 12 },
  { day: 'Tue', present: 0, total: 12 },
  { day: 'Wed', present: 0, total: 12 },
  { day: 'Thu', present: 0, total: 12 },
  { day: 'Fri', present: 0, total: 12 },
  { day: 'Sat', present: 0, total: 12 },
]

export function WeeklyChart() {
  const max = Math.max(...weeklyAttendance.map((day) => day.total), 1)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex h-52 items-end justify-between gap-2 sm:gap-4">
        {weeklyAttendance.map((day) => {
          const presentPct = day.total > 0 ? (day.present / max) * 100 : 0
          const rate = day.total > 0 ? Math.round((day.present / day.total) * 100) : 0

          return (
            <div key={day.day} className="group flex flex-1 flex-col items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">
                {rate}%
              </span>

              <div className="relative flex h-full w-full items-end justify-center">
                <div
                  className="w-full max-w-10 rounded-t-md bg-primary/80 transition-all duration-300 group-hover:bg-primary"
                  style={{ height: `${Math.max(presentPct, 4)}%` }}
                  role="img"
                  aria-label={`${day.day}: ${day.present} of ${day.total} present`}
                />
              </div>

              <span className="text-xs text-muted-foreground">{day.day}</span>
            </div>
          )
        })}
      </div>

      <div className="flex items-center gap-4 border-t border-border pt-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-sm bg-primary" />
          Present
        </span>

        <span className="ml-auto">Total enrolled: {max}</span>
      </div>
    </div>
  )
}