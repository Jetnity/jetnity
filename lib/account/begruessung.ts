// lib/account/begruessung.ts
//
// Die Übersicht begrüsst mit dem, was Auth bereits kennt. Kein Profil, keine
// Default-Staatsbürgerschaft, kein erfundener Vorname aus der E-Mail-Domain.

export type Begruessungsquelle = {
  name?: string | null
  email?: string | null
}

export function begruessungName(quelle: Begruessungsquelle): string | null {
  const name = quelle.name?.trim()
  if (name) {
    const erstes = name.split(/\s+/).find((teil) => teil.length > 0)
    return erstes ?? null
  }

  const email = quelle.email?.trim()
  if (!email) return null
  const lokal = email.split('@')[0]?.trim()
  return lokal && lokal.length > 0 ? lokal : null
}
