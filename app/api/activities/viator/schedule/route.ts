import { viatorKalenderLaden } from '@/lib/providers/viator/activities/anbinden'
import { viatorJson, viatorJsonLesen, viatorRate } from '@/lib/providers/viator/activities/route-hilfe'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

export async function POST(req: Request) {
  const gelesen = await viatorJsonLesen(req)
  if (!gelesen.ok) {
    return viatorJson(gelesen.status, { status: 'error', message: gelesen.message, availabilityClaim: false, value: null })
  }
  const rate = await viatorRate(req)
  if (!rate.ok) {
    return viatorJson(429, {
      status: 'rate_limited',
      message: 'Bitte warte einen Moment, dann kannst du den Kalender erneut öffnen.',
      availabilityClaim: false,
      value: null,
    }, rate.retryAfterSec)
  }
  const code = gelesen.wert && typeof gelesen.wert === 'object' ? (gelesen.wert as { productCode?: unknown }).productCode : null
  const ergebnis = await viatorKalenderLaden(typeof code === 'string' ? code : '')
  return viatorJson(ergebnis.httpStatus, {
    status: ergebnis.status,
    message: ergebnis.message,
    availabilityClaim: false,
    value: ergebnis.value,
  })
}
