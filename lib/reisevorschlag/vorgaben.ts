// lib/reisevorschlag/vorgaben.ts
//
// Harte Vorgaben, die sich aus dem Freitext sicher lesen lassen – und die
// Prüfung eines Vorschlags dagegen.
//
// Nur das, was eine Zahl, ein Ort oder ein klares Verbot ist. „Schön“ oder
// „entspannt“ ist keine harte Vorgabe. Eine subjektive Präferenz hier zu
// erzwingen würde gültige Reisen verwerfen.
//
// Frei von Next, Supabase und `process.env`.

import { VORSCHLAG_GRENZEN, type Modellvorschlag } from '@/lib/reisevorschlag/schema'

export type HarteVorgaben = {
  tage: number | null
  reisende: number | null
  budgetziel: number | null
  waehrung: 'CHF' | 'EUR' | 'USD' | null
  orte: string[]
  ausgeschlossen: string[]
  keinFlug: boolean
  ruhetage: number | null
  maxEtappen: number | null
}

export type Vorgabenverstoss = {
  art: keyof HarteVorgaben | 'ort'
  meldung: string
}

function kleingeschrieben(text: string): string {
  return text.normalize('NFC').toLocaleLowerCase('de-CH')
}

function betragAus(text: string): number | null {
  const treffer = text.match(
    /maximal\s+(?:chf|eur|usd|€|fr\.?)?\s*([\d’']{3,6})/i,
  )
  if (!treffer) return null
  return Number(treffer[1].replace(/[’']/g, ''))
}

function waehrungAus(text: string): HarteVorgaben['waehrung'] {
  if (/\bchf\b|fr\./i.test(text)) return 'CHF'
  if (/\beur\b|€/.test(text)) return 'EUR'
  if (/\busd\b|\$/.test(text)) return 'USD'
  return null
}

function reisendeAus(text: string): number | null {
  const klein = kleingeschrieben(text)
  if (/\bzu zweit\b|\bzwei personen\b/.test(klein)) return 2
  if (/\beine person\b|\ballein\b/.test(klein)) return 1
  if (/\bdrei personen\b/.test(klein)) return 3

  const erwachsene = klein.match(/(\d+)\s*erwachsene/)
  const kinder = klein.match(/(\d+)\s*kinder/)
  if (erwachsene || kinder) {
    return Number(erwachsene?.[1] ?? 0) + Number(kinder?.[1] ?? 0)
  }

  const personen = klein.match(/(\d+)\s*personen/)
  if (personen) return Number(personen[1])
  return null
}

function tageAus(text: string): number | null {
  const wochen = text.match(/(\d+)\s*wochen?\b/i)
  if (wochen) return Number(wochen[1]) * 7

  const tage = text.match(/(\d{1,3})\s*tage?\b/i)
  if (tage) return Number(tage[1])

  const vonBis = text.match(/vom\s+(\d{1,2})\.\s*(?:bis\s+)?(\d{1,2})\./i)
  if (vonBis) {
    const start = Number(vonBis[1])
    const ende = Number(vonBis[2])
    if (ende >= start) return ende - start + 1
  }
  return null
}

function orteAus(text: string): string[] {
  const orte: string[] = []
  const nach = text.matchAll(/\b(?:nach|in)\s+([A-ZÄÖÜ][\wäöüéèâ\-]{2,})/g)
  for (const treffer of nach) orte.push(treffer[1])

  const vonNach = text.match(/\bvon\s+([A-ZÄÖÜ][\wäöüéèâ\-]+)\s+nach\s+([A-ZÄÖÜ][\wäöüéèâ\-]+)/)
  if (vonNach) {
    orte.push(vonNach[1], vonNach[2])
  }

  const liste = text.match(
    /:\s*([A-ZÄÖÜ][\wäöüéèâ\-]+(?:\s*,\s*[A-ZÄÖÜ][\wäöüéèâ\-]+)+(?:\s+und\s+[A-ZÄÖÜ][\wäöüéèâ\-]+)?)/,
  )
  if (liste) {
    for (const teil of liste[1].split(/\s*,\s*|\s+und\s+/)) {
      if (/^[A-ZÄÖÜ]/.test(teil)) orte.push(teil)
    }
  }

  return [...new Set(orte.map((ort) => ort.trim()).filter((ort) => ort.length >= 3))]
}

function ausgeschlossenAus(text: string): string[] {
  const orte: string[] = []
  for (const treffer of text.matchAll(/\bnicht nach\s+([A-ZÄÖÜ][\wäöüéèâ\-]+)/gi)) {
    orte.push(treffer[1])
  }
  for (const treffer of text.matchAll(/\bohne\s+([A-ZÄÖÜ][\wäöüéèâ\-]{3,})/g)) {
    orte.push(treffer[1])
  }
  return [...new Set(orte)]
}

/** Liest nur Vorgaben, die sich ohne Interpretation festmachen lassen. */
export function vorgabenAus(freitext: string): HarteVorgaben {
  const klein = kleingeschrieben(freitext)
  const maxEtappen = freitext.match(
    /höchstens\s+(\d+)\s+(?:etappen|orte|städte|staedte|unterkünfte|unterkuenfte)/i,
  )

  return {
    tage: tageAus(freitext),
    reisende: reisendeAus(freitext),
    budgetziel: betragAus(freitext),
    waehrung: waehrungAus(freitext),
    orte: orteAus(freitext).filter(
      (ort) => !ausgeschlossenAus(freitext).some((x) => kleingeschrieben(x) === kleingeschrieben(ort)),
    ),
    ausgeschlossen: ausgeschlossenAus(freitext),
    keinFlug: /\bkein(?:en|e)? flug\b|\bohne flug\b|\bnicht fliegen\b/.test(klein),
    ruhetage: (() => {
      const ruhe = klein.match(/(\d+)\s*ruhetage?/)
      if (ruhe) return Number(ruhe[1])
      if (/\beinen ruhetag\b|\beinen strandtag\b/.test(klein)) return 1
      return null
    })(),
    maxEtappen: maxEtappen ? Number(maxEtappen[1]) : null,
  }
}

function kommtVor(vorschlag: Modellvorschlag, nadel: string): boolean {
  const n = kleingeschrieben(nadel)
  const felder = [
    ...vorschlag.etappen.map((etappe) => etappe.name),
    ...vorschlag.tage.flatMap((tag) => [tag.titel ?? '', ...tag.punkte.map((punkt) => punkt.titel)]),
  ]
  return felder.some((feld) => kleingeschrieben(feld).includes(n))
}

function ruhetageImPlan(vorschlag: Modellvorschlag): number {
  return vorschlag.tage.filter((tag) => {
    const titel = kleingeschrieben(tag.titel ?? '')
    if (/\bruhe|\bstrandtag|\bfreier tag|\bohne programm/.test(titel)) return true
    const bewegung = tag.punkte.filter((punkt) => punkt.art === 'flight' || punkt.art === 'transfer')
    return bewegung.length === 0 && tag.punkte.length <= 2
  }).length
}

/** Welche harten Vorgaben der Vorschlag verletzt. Leere Liste: keine Verletzung. */
export function vorgabenPruefen(
  vorschlag: Modellvorschlag,
  vorgaben: HarteVorgaben,
): Vorgabenverstoss[] {
  const verstoesse: Vorgabenverstoss[] = []

  if (vorgaben.tage !== null && vorschlag.tage.length !== vorgaben.tage) {
    verstoesse.push({
      art: 'tage',
      meldung: `Die Reise sollte ${vorgaben.tage} Tage haben, der Entwurf hat ${vorschlag.tage.length}.`,
    })
  }

  if (vorgaben.reisende !== null && vorschlag.reisende !== vorgaben.reisende) {
    verstoesse.push({
      art: 'reisende',
      meldung: `Es sollten ${vorgaben.reisende} Reisende sein, der Entwurf hat ${vorschlag.reisende}.`,
    })
  }

  if (vorgaben.budgetziel !== null && vorschlag.budgetziel !== vorgaben.budgetziel) {
    verstoesse.push({
      art: 'budgetziel',
      meldung: `Das Budgetziel sollte ${vorgaben.budgetziel} sein, der Entwurf hat ${vorschlag.budgetziel ?? 'keines'}.`,
    })
  }

  if (vorgaben.waehrung && vorschlag.waehrung !== vorgaben.waehrung) {
    verstoesse.push({
      art: 'waehrung',
      meldung: `Die Währung sollte ${vorgaben.waehrung} sein.`,
    })
  }

  for (const ort of vorgaben.orte) {
    if (!kommtVor(vorschlag, ort)) {
      verstoesse.push({
        art: 'ort',
        meldung: `Der ausdrücklich gewünschte Ort ${ort} kommt im Entwurf nicht vor.`,
      })
    }
  }

  for (const ort of vorgaben.ausgeschlossen) {
    if (kommtVor(vorschlag, ort)) {
      verstoesse.push({
        art: 'ausgeschlossen',
        meldung: `Der ausgeschlossene Ort ${ort} kommt im Entwurf vor.`,
      })
    }
  }

  if (vorgaben.keinFlug && vorschlag.tage.some((tag) => tag.punkte.some((punkt) => punkt.art === 'flight'))) {
    verstoesse.push({
      art: 'keinFlug',
      meldung: 'Die Beschreibung schliesst Flüge aus, der Entwurf enthält welche.',
    })
  }

  if (vorgaben.ruhetage !== null && ruhetageImPlan(vorschlag) < vorgaben.ruhetage) {
    verstoesse.push({
      art: 'ruhetage',
      meldung: `Es fehlen Ruhetage: verlangt ${vorgaben.ruhetage}, erkennbar ${ruhetageImPlan(vorschlag)}.`,
    })
  }

  if (vorgaben.maxEtappen !== null && vorschlag.etappen.length > vorgaben.maxEtappen) {
    verstoesse.push({
      art: 'maxEtappen',
      meldung: `Höchstens ${vorgaben.maxEtappen} Etappen, der Entwurf hat ${vorschlag.etappen.length}.`,
    })
  }

  return verstoesse
}

export function korrekturtext(freitext: string, verstoesse: Vorgabenverstoss[]): string {
  const punkte = verstoesse.map((verstoss) => `- ${verstoss.meldung}`).join('\n')
  const anhang = `\n\nKorrektur, einmalig. Der Entwurf muss diese Vorgaben einhalten:\n${punkte}\nKeine Preise und keine Buchungszusagen.`
  const frei = freitext.slice(0, Math.max(0, VORSCHLAG_GRENZEN.freitextMaximum - anhang.length))
  return `${frei}${anhang}`
}
