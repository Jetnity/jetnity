// lib/admin/kennzahlen.ts
//
// Die Rechenschritte hinter den Übersichten des Administrationsbereichs.
//
// Sie stehen hier und nicht in den Routen, weil genau an ihnen die
// Unterscheidung hängt, um die es geht: Aus keiner Zeile folgt eine Null, aus
// einem Fehler folgt keine Zahl. Die Routen entscheiden vorher, welcher der
// beiden Fälle vorliegt (`lib/api/datenbank-lesen.ts`); hier wird nur noch
// gerechnet – mit Daten, die es tatsächlich gibt.

export type Sicherheitsereignis = {
  type: string
  created_at: string
}

export type Sicherheitslage = {
  failed_logins: number
  blocked_ips: number
  anomalies: number
  last_event: { type: string; at: string } | null
}

/**
 * Die Ereignisse müssen absteigend nach Zeitpunkt sortiert übergeben werden;
 * `last_event` ist dann das erste. Die Sortierung gehört in die Abfrage, damit
 * nicht zweimal sortiert wird.
 */
export function fasseSicherheitslageZusammen(
  ereignisse: readonly Sicherheitsereignis[],
  sperren: readonly unknown[],
): Sicherheitslage {
  const erstes = ereignisse[0]

  return {
    failed_logins: ereignisse.filter(e => e.type === 'auth_failed').length,
    blocked_ips: sperren.length,
    anomalies: ereignisse.filter(e => e.type.startsWith('anomaly')).length,
    last_event: erstes ? { type: erstes.type, at: erstes.created_at } : null,
  }
}

export type Zahlung = {
  amount_chf: number | null
  status: string
  created_at: string
}

export type Zahlungsuebersicht = {
  revenue_chf: number
  orders: number
  refunds: number
}

/** Nur bezahlte Zahlungen zählen als Umsatz; erstattete sind kein Umsatz. */
export function fasseZahlungenZusammen(
  zahlungen: readonly Zahlung[],
  rueckerstattungen: readonly unknown[],
): Zahlungsuebersicht {
  const bezahlt = zahlungen.filter(z => z.status === 'paid')
  const umsatz = bezahlt.reduce((summe, z) => summe + (Number(z.amount_chf) || 0), 0)

  return {
    revenue_chf: Math.round(umsatz * 100) / 100,
    orders: bezahlt.length,
    refunds: rueckerstattungen.length,
  }
}

export type Tagesreihe = {
  date: string
  revenue_chf: number
  orders: number
}

/**
 * Verteilt Zahlungen auf `anzahlTage` aufeinanderfolgende Tage ab `beginn`.
 *
 * Jeder Tag kommt vor, auch einer ohne Zahlung – eine Lücke in der Reihe wäre
 * in einem Diagramm nicht von einer Null zu unterscheiden. Eine Zahlung
 * ausserhalb der Reihe wird übergangen.
 */
export function verteileAufTage(
  zahlungen: readonly Zahlung[],
  beginn: Date,
  anzahlTage: number,
): Tagesreihe[] {
  const reihe = new Map<string, { revenue_chf: number; orders: number }>()
  const tag = new Date(beginn)

  for (let i = 0; i < anzahlTage; i++) {
    reihe.set(tag.toISOString().slice(0, 10), { revenue_chf: 0, orders: 0 })
    tag.setDate(tag.getDate() + 1)
  }

  for (const zahlung of zahlungen) {
    if (zahlung.status !== 'paid') continue
    const eintrag = reihe.get(String(zahlung.created_at).slice(0, 10))
    if (!eintrag) continue
    eintrag.orders += 1
    eintrag.revenue_chf += Number(zahlung.amount_chf) || 0
  }

  return [...reihe].map(([date, wert]) => ({
    date,
    revenue_chf: Math.round(wert.revenue_chf * 100) / 100,
    orders: wert.orders,
  }))
}
