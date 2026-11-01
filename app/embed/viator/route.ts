// app/embed/viator/route.ts
//
// Neutrale HTML-Antwort für das offizielle Viator-Widget.
// Keine Sitzung, kein Reiseabruf, kein API-Schlüssel.

import { viatorEmbedAntwort } from '@/lib/activities/viator-widget/dokument'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export function GET(request: Request): Response {
  return viatorEmbedAntwort(request)
}
