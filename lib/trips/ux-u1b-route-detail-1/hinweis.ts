// UI-Hinweis für eine ungültige Tag- oder Punktauswahl.
// Keine Kopie des Reisegraphen. Der Hinweis gehört zu einem Kontext
// und überlebt das eigene Kanonisieren der Adresse.

export type AuswahlRoh = {
  tag: string | null
  punkt: string | null
}

export type Hinweis =
  | { art: 'punkt-fehlt'; id: string; tagId: string | null }
  | { art: 'tag-fehlt'; id: string }

export type GraphBlick = {
  tagExistiert: (id: string) => boolean
  punkt: (id: string) => { dayId: string | null } | null
}

export function hinweisGleich(links: Hinweis | null, rechts: Hinweis | null): boolean {
  if (links === rechts) return true
  if (!links || !rechts || links.art !== rechts.art) return false
  if (links.art === 'tag-fehlt' && rechts.art === 'tag-fehlt') return links.id === rechts.id
  return links.art === 'punkt-fehlt' && rechts.art === 'punkt-fehlt'
    && links.id === rechts.id && links.tagId === rechts.tagId
}

function gleicherKontext(hinweis: Hinweis, roh: AuswahlRoh): boolean {
  if (hinweis.art === 'punkt-fehlt') {
    if (roh.punkt && roh.punkt !== hinweis.id) return false
    if (roh.punkt === hinweis.id) return true
    return hinweis.tagId ? roh.tag === hinweis.tagId : roh.tag == null
  }
  if (roh.tag === hinweis.id) return true
  return roh.tag == null && roh.punkt == null
}

function hinweisAusRaw(roh: AuswahlRoh, graph: GraphBlick): Hinweis | 'gueltig' | 'leer' {
  if (roh.punkt) {
    const punkt = graph.punkt(roh.punkt)
    if (!punkt) {
      const tagId = roh.tag && graph.tagExistiert(roh.tag) ? roh.tag : null
      return { art: 'punkt-fehlt', id: roh.punkt, tagId }
    }
    return 'gueltig'
  }
  if (roh.tag) return graph.tagExistiert(roh.tag) ? 'gueltig' : { art: 'tag-fehlt', id: roh.tag }
  return 'leer'
}

export function hinweisAktualisieren(
  bisher: Hinweis | null,
  ereignis:
    | { art: 'lesen'; roh: AuswahlRoh; graph: GraphBlick; gespeichert: Hinweis | null }
    | { art: 'explizit' }
    | { art: 'neueReise' },
): Hinweis | null {
  if (ereignis.art === 'explizit' || ereignis.art === 'neueReise') return null
  const frisch = hinweisAusRaw(ereignis.roh, ereignis.graph)
  if (frisch !== 'gueltig' && frisch !== 'leer') return frisch
  if (ereignis.gespeichert && gleicherKontext(ereignis.gespeichert, ereignis.roh)) return ereignis.gespeichert
  if (frisch === 'gueltig') return bisher && gleicherKontext(bisher, ereignis.roh) ? bisher : null
  return bisher && gleicherKontext(bisher, ereignis.roh) ? bisher : null
}

export function hinweisText(hinweis: Hinweis): string {
  if (hinweis.art === 'tag-fehlt') {
    return 'Dieser Tag ist nicht mehr in der Reise. Es wird kein anderer Tag an seine Stelle gesetzt.'
  }
  if (hinweis.tagId) {
    return 'Dieser Punkt ist nicht mehr in der Reise. Der zugehörige Tag bleibt ausgewählt. Es wird kein anderer Punkt an seine Stelle gesetzt.'
  }
  return 'Dieser Punkt ist nicht mehr in der Reise. Es wird kein anderer Punkt und kein anderer Tag an seine Stelle gesetzt.'
}
