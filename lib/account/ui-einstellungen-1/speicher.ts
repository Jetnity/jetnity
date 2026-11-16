import { UI_SPRACHE_KEY, uiSpracheLesen, type UiSprache } from '@/lib/localization/ui-sprache'
import {
  uiBenutzerIdLesen,
  uiEinstellungenEingabeLesen,
  type UiEinstellungenLesen,
  type UiEinstellungenSpeichernErgebnis,
} from './vertrag'

export type UiEinstellungenAuthPort = {
  /** Local deployment check only; it must not perform Auth or database I/O. */
  istVerfuegbar: () => boolean
  getUser: () => Promise<unknown>
  updateUser: (eingabe: { data: { [UI_SPRACHE_KEY]: UiSprache } }) => Promise<unknown>
}

type LesePort = Pick<UiEinstellungenAuthPort, 'istVerfuegbar' | 'getUser'>

function eigenerWert(objekt: unknown, name: string): unknown {
  if (!objekt || typeof objekt !== 'object' || Array.isArray(objekt)) return undefined
  const feld = Object.getOwnPropertyDescriptor(objekt, name)
  return feld && 'value' in feld ? feld.value : undefined
}

function sitzungFehlt(fehler: unknown): boolean {
  return eigenerWert(fehler, 'name') === 'AuthSessionMissingError'
    || eigenerWert(fehler, 'status') === 401
}

function authAntwortLesen(antwort: unknown): UiEinstellungenLesen {
  const fehler = eigenerWert(antwort, 'error')
  if (fehler !== null) {
    return { status: sitzungFehlt(fehler) ? 'nicht_angemeldet' : 'nicht_verfuegbar' }
  }
  const nutzer = eigenerWert(eigenerWert(antwort, 'data'), 'user')
  if (nutzer === null) return { status: 'nicht_angemeldet' }
  const benutzerId = uiBenutzerIdLesen(eigenerWert(nutzer, 'id'))
  if (!benutzerId) return { status: 'nicht_verfuegbar' }
  const sprache = uiSpracheLesen(eigenerWert(eigenerWert(nutzer, 'user_metadata'), UI_SPRACHE_KEY))
  return { status: 'bereit', benutzerId, sprache: sprache ?? 'de', gespeichert: sprache !== null }
}

export async function uiEinstellungenVomPortLesen(port: LesePort): Promise<UiEinstellungenLesen> {
  try {
    if (!port.istVerfuegbar()) return { status: 'nicht_verfuegbar' }
    const antwort = await port.getUser()
    if (!port.istVerfuegbar()) return { status: 'nicht_verfuegbar' }
    return authAntwortLesen(antwort)
  } catch {
    return { status: 'nicht_verfuegbar' }
  }
}

function schreibfehler(fehler: unknown): UiEinstellungenSpeichernErgebnis {
  if (sitzungFehlt(fehler)) return { ok: false, code: 'nicht_angemeldet' }
  const status = eigenerWert(fehler, 'status')
  // A transport timeout or server failure may occur after persistence. Only an
  // explicit client rejection is called rejected; uncertainty is never retried.
  if (typeof status === 'number' && Number.isInteger(status)
    && status >= 400 && status < 500 && status !== 408 && status !== 499) {
    return { ok: false, code: 'abgelehnt' }
  }
  return { ok: false, code: 'nicht_bestaetigt' }
}

export async function uiEinstellungenImPortSpeichern(
  port: UiEinstellungenAuthPort,
  eingabe: unknown,
): Promise<UiEinstellungenSpeichernErgebnis> {
  const wert = uiEinstellungenEingabeLesen(eingabe)
  if (!wert) return { ok: false, code: 'eingabe' }

  const vorher = await uiEinstellungenVomPortLesen(port)
  if (vorher.status !== 'bereit') return { ok: false, code: vorher.status }
  if (vorher.benutzerId !== wert.erwarteteBenutzerId) return { ok: false, code: 'konto_gewechselt' }

  try {
    if (!port.istVerfuegbar()) return { ok: false, code: 'nicht_verfuegbar' }
  } catch {
    return { ok: false, code: 'nicht_verfuegbar' }
  }

  try {
    // Do not spread metadata, accept an authority field, or select a user ID.
    const antwort = await port.updateUser({ data: { [UI_SPRACHE_KEY]: wert.sprache } })
    const fehler = eigenerWert(antwort, 'error')
    if (fehler !== null) return schreibfehler(fehler)
    const bestaetigtesKonto = uiBenutzerIdLesen(eigenerWert(eigenerWert(eigenerWert(antwort, 'data'), 'user'), 'id'))
    if (!bestaetigtesKonto) return { ok: false, code: 'nicht_bestaetigt' }
    if (bestaetigtesKonto !== vorher.benutzerId) return { ok: false, code: 'konto_gewechselt' }

    // The update response alone does not establish success. A fresh own-user
    // read must confirm both identity and the exact persisted supported value.
    const danach = await uiEinstellungenVomPortLesen(port)
    if (danach.status !== 'bereit') return { ok: false, code: 'nicht_bestaetigt' }
    if (danach.benutzerId !== vorher.benutzerId) return { ok: false, code: 'konto_gewechselt' }
    if (!danach.gespeichert || danach.sprache !== wert.sprache) return { ok: false, code: 'nicht_bestaetigt' }
    return { ok: true, benutzerId: danach.benutzerId, sprache: danach.sprache }
  } catch {
    return { ok: false, code: 'nicht_bestaetigt' }
  }
}
