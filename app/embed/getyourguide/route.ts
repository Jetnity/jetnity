// app/embed/getyourguide/route.ts
//
// Neutrale HTML-Antwort ohne App-Layout, Sitzung oder Reiseabruf.

import { embedAntwort } from '@/lib/activities/getyourguide/dokument'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export function GET(request: Request): Response {
  return embedAntwort(request)
}
