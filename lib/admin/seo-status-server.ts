import 'server-only'

import { waehleSeoStatusUmgebung, type SeoStatusStand, projiziereSeoStatus } from '@/lib/admin/seo-status'

export function leseSeoStatusUmgebung() {
  return waehleSeoStatusUmgebung(process.env)
}

export function ladeSeoStatusFuerSeite(): SeoStatusStand {
  return projiziereSeoStatus(leseSeoStatusUmgebung())
}
