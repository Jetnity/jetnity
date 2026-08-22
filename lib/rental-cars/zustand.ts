// lib/rental-cars/zustand.ts
//
// Ob Jetnity eine externe Mietwagensuche auslösen darf.
//
// Fail closed:
//
//   · Production ist hart aus.
//   · Ohne gewählten Provider bleibt die Suche unavailable.
//   · Ein Kill-Switch existiert analog zu den anderen Foundations, ohne
//     einen noch nicht gewählten Anbieter oder dessen Secrets zu benennen.
//
// Eine fehlende Variable ist kein Buildfehler.
// Frei von Next und Provider-SDKs.

export type RentalCarZustand =
  | { aktiv: true; umgebung: 'test' }
  | { aktiv: false; grund: 'production' | 'abgeschaltet' | 'ohne-zugang' }

export type RentalCarUmgebung = {
  VERCEL_ENV?: string
  JETNITY_RENTAL_CAR_AKTIV?: string
}

function eingeschaltet(wert: string | undefined): boolean {
  const normalisiert = wert?.trim().toLowerCase()
  return normalisiert === 'true' || normalisiert === '1'
}

function istProduction(umgebung: RentalCarUmgebung): boolean {
  return umgebung.VERCEL_ENV?.trim() === 'production'
}

export function rentalCarUmgebungAusProzess(): RentalCarUmgebung {
  const { VERCEL_ENV, JETNITY_RENTAL_CAR_AKTIV } = process.env
  return { VERCEL_ENV, JETNITY_RENTAL_CAR_AKTIV }
}

export function rentalCarZustand(
  umgebung: RentalCarUmgebung = rentalCarUmgebungAusProzess(),
  providerVorhanden = false,
): RentalCarZustand {
  if (istProduction(umgebung)) return { aktiv: false, grund: 'production' }
  if (!eingeschaltet(umgebung.JETNITY_RENTAL_CAR_AKTIV)) return { aktiv: false, grund: 'abgeschaltet' }
  if (!providerVorhanden) return { aktiv: false, grund: 'ohne-zugang' }
  return { aktiv: true, umgebung: 'test' }
}

export function rentalCarZustandMeldung(zustand: RentalCarZustand): string {
  if (zustand.aktiv) return 'Die Mietwagensuche ist in dieser Umgebung eingeschaltet.'
  if (zustand.grund === 'production') {
    return 'Die Mietwagensuche ist in Production noch nicht freigegeben.'
  }
  if (zustand.grund === 'ohne-zugang') {
    return 'Mietwagenangebote werden vorbereitet. Sobald ein Datenpartner angebunden ist, erscheinen hier echte Fahrzeuge – ohne erfundene Preise, Klassen oder Verfügbarkeiten.'
  }
  return 'Die Mietwagensuche ist in dieser Umgebung nicht eingeschaltet.'
}
