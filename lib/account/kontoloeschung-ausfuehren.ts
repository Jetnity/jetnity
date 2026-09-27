// lib/account/kontoloeschung-ausfuehren.ts
//
// Ablauf der V1-Kontolöschung. Ports ersetzen Auth, Storage und die Tabelle
// `security_events`. Kein Service-Role, kein SQL, kein zweites Löschen der
// Kaskaden von Konto, Reise und Reisenden.

import {
  KONTO_SPEICHER_FLAECHEN,
  identitaetsBeweis,
  kontoLoeschungAnfrageLesen,
  kontoLoeschungProtokoll,
  mfaFreigabe,
  registrierteSpeicherRaeumen,
  suchparameterWaehlenZiel,
  type AuthLoeschung,
  type EreignisLoeschung,
  type IdentitaetPruefung,
  type KontoLoeschungCode,
  type KontoSpeicherFlaeche,
  type PasswortBeweis,
  type SpeicherLoeschung,
} from './kontoloeschung'

export type KontoLoeschungPorts = {
  identitaetPruefen: (authorization: string) => Promise<IdentitaetPruefung>
  bestaetigePasswort: (email: string, passwort: string) => Promise<PasswortBeweis>
  raeumeSpeicher: (flaeche: KontoSpeicherFlaeche, benutzerId: string) => Promise<SpeicherLoeschung>
  loescheAuthBenutzer: (benutzerId: string) => Promise<AuthLoeschung>
  entferneSicherheitsereignisse: (benutzerId: string) => Promise<EreignisLoeschung>
}

export type KontoLoeschungAntwort = {
  status: number
  body:
    | { status: 'deleted' }
    | { status: 'not_found' }
    | { status: 'deleted_security_events_residual' }
    | { status: 'rejected'; code: KontoLoeschungCode }
}

const STATUS: Record<KontoLoeschungCode, number> = {
  nicht_angemeldet: 401,
  ziel_nicht_erlaubt: 400,
  ungueltig: 400,
  bestaetigung_falsch: 400,
  passwort_fehlt: 400,
  passwort_falsch: 401,
  identitaet_weicht_ab: 403,
  nur_oauth: 403,
  nicht_unterstuetzt: 403,
  aal2_erforderlich: 403,
  aal_unbekannt: 403,
  faktoren_unlesbar: 403,
  speicher_blockiert: 409,
  speicher_unbekannt: 409,
  loeschung_fehlgeschlagen: 503,
  nicht_verfuegbar: 503,
  methode: 405,
}

function abgelehnt(code: KontoLoeschungCode, protokoll: (zeile: string) => void): KontoLoeschungAntwort {
  protokoll(kontoLoeschungProtokoll(code === 'speicher_blockiert' ? 'speicher_blockiert' : 'abgelehnt'))
  return { status: STATUS[code], body: { status: 'rejected', code } }
}

export async function kontoLoeschungAusfuehren(
  eingabe: {
    method: string
    url: string
    authorization: string | null
    bodyText: string | null
  },
  ports: KontoLoeschungPorts,
  protokoll: (zeile: string) => void = () => {},
  flaechen: readonly KontoSpeicherFlaeche[] = KONTO_SPEICHER_FLAECHEN,
): Promise<KontoLoeschungAntwort> {
  protokoll(kontoLoeschungProtokoll('eingang'))

  if (eingabe.method !== 'POST') return abgelehnt('methode', protokoll)
  if (suchparameterWaehlenZiel(eingabe.url)) return abgelehnt('ziel_nicht_erlaubt', protokoll)

  const text = eingabe.bodyText ?? ''
  if (text.length === 0 || text.length > 4096) return abgelehnt('ungueltig', protokoll)

  let roh: unknown
  try {
    roh = JSON.parse(text)
  } catch {
    return abgelehnt('ungueltig', protokoll)
  }

  const anfrage = kontoLoeschungAnfrageLesen(roh)
  if (!anfrage.ok) return abgelehnt(anfrage.code, protokoll)

  const authorization = eingabe.authorization?.trim() ?? ''
  if (!authorization.startsWith('Bearer ') || authorization.length <= 'Bearer '.length) {
    return abgelehnt('nicht_angemeldet', protokoll)
  }

  const identitaet = await ports.identitaetPruefen(authorization)
  if (identitaet.art === 'keine_sitzung') return abgelehnt('nicht_angemeldet', protokoll)
  if (identitaet.art === 'faktoren_unlesbar') return abgelehnt('faktoren_unlesbar', protokoll)
  if (identitaet.art === 'fehler') return abgelehnt('nicht_verfuegbar', protokoll)

  const beweis = identitaetsBeweis(identitaet.identitaet.anbieter)
  if (beweis === 'nur_oauth') return abgelehnt('nur_oauth', protokoll)
  if (beweis === 'nicht_unterstuetzt') return abgelehnt('nicht_unterstuetzt', protokoll)
  if (!identitaet.identitaet.email) return abgelehnt('nicht_unterstuetzt', protokoll)

  const mfa = mfaFreigabe(identitaet.identitaet.verifizierteTotp, identitaet.identitaet.aal)
  if (!mfa.ok) return abgelehnt(mfa.code, protokoll)

  const passwort = await ports.bestaetigePasswort(identitaet.identitaet.email, anfrage.password)
  if (passwort.art === 'falsch') return abgelehnt('passwort_falsch', protokoll)
  if (passwort.art === 'fehler') return abgelehnt('nicht_verfuegbar', protokoll)
  if (passwort.benutzerId !== identitaet.identitaet.id) return abgelehnt('identitaet_weicht_ab', protokoll)

  const speicher = await registrierteSpeicherRaeumen(
    flaechen,
    { loescheUeberStorageApi: ports.raeumeSpeicher },
    identitaet.identitaet.id,
  )
  if (speicher.art === 'unbekannt') return abgelehnt('speicher_unbekannt', protokoll)
  if (speicher.art === 'fehler') return abgelehnt('loeschung_fehlgeschlagen', protokoll)

  const geloescht = await ports.loescheAuthBenutzer(identitaet.identitaet.id)
  if (geloescht.art === 'speicher_blockiert') return abgelehnt('speicher_blockiert', protokoll)
  if (geloescht.art === 'fehler') return abgelehnt('loeschung_fehlgeschlagen', protokoll)

  const ereignisse = await ports.entferneSicherheitsereignisse(identitaet.identitaet.id)
  if (ereignisse.art === 'fehler') {
    protokoll(kontoLoeschungProtokoll('residual'))
    return { status: 500, body: { status: 'deleted_security_events_residual' } }
  }

  if (geloescht.art === 'nicht_gefunden') {
    protokoll(kontoLoeschungProtokoll('nicht_gefunden'))
    return { status: 404, body: { status: 'not_found' } }
  }

  protokoll(kontoLoeschungProtokoll('geloescht'))
  return { status: 200, body: { status: 'deleted' } }
}
