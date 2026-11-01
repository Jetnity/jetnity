import { createTimetableHandler } from '@/lib/providers/twelve-go/timetable/http'
import { loadTimetable, timetableAktiv } from '@/lib/providers/twelve-go/timetable/service'

export const dynamic = 'force-dynamic'
export const maxDuration = 15

// Public route metadata only: no account, trip ownership, DB or service role access.
export const POST = createTimetableHandler(loadTimetable, () => timetableAktiv(process.env))
