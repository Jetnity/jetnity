import { viatorLivePruefen } from '@/lib/providers/viator/activities/anbinden'
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
      message: 'Bitte warte einen Moment, dann kannst du erneut prüfen.',
      availabilityClaim: false,
      value: null,
    }, rate.retryAfterSec)
  }
  const ergebnis = await viatorLivePruefen(gelesen.wert)
  return viatorJson(ergebnis.httpStatus, {
    status: ergebnis.status,
    message: ergebnis.message,
    availabilityClaim: ergebnis.availabilityClaim,
    value: ergebnis.value,
  })
}
