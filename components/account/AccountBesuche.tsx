'use client'

// Die Verwaltungsfläche der bestätigten Besuchshistorie.
//
// Sie zeigt dieselbe Karte wie zuvor, darunter die Ereignisse. Wiederholte
// Besuche desselben Ortes bleiben getrennte Zeilen. Die erste Seite zeigt
// zwölf Ereignisse; der Rest bleibt in derselben Liste und kommt über eine
// lokale Aufklappung oder die lokale Suche dazu. Nichts davon fragt neu an
// und nichts wird zusammengelegt.
//
// Bestätigen, ändern und widerrufen greifen ausschliesslich auf die eigene
// Besuchshistorie zu. Eine Reise wird hier nicht verändert.
// Jede Schreibaktion gehört zu einem Vorgang. Eine angenommene Antwort räumt
// nur den Entwurf oder die Bestätigung, deren Epoche und Absicht noch passen.

import { AlertCircle, MapPin, Pencil, Trash2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import AccountBesuchFormular, {
  BESUCH_FORMULAR_LEER,
  besuchEingabeAus,
  type BesuchFormularWert,
} from '@/components/account/AccountBesuchFormular'
import AccountWeltKarte from '@/components/account/AccountWeltKarte'
import { useAccountVisitWorkflow } from '@/components/account/useAccountVisitWorkflow'
import {
  BESUCH_VERWALTUNG_ANFANG,
  BESUCH_VERWALTUNG_SCHRITT,
  besuchEreignisZahlText,
  besuchSuchtrefferText,
  besuchVerwaltungAusschnitt,
  besuchWeitereText,
} from '@/lib/account/account-world-visit-management-premium-1'
import {
  visitFokusErlaubt,
  visitFormularLeer,
  type VisitEntwurf,
  type VisitSurface,
  type VisitVorgang,
} from '@/lib/account/account-visit-workflow'
import type { Besuch, BesuchAnzeige } from '@/lib/account/besuche'
import {
  besuchAendern,
  besuchBestaetigen,
  besuchWiderrufen,
} from '@/lib/account/besuche-aktionen'
import { BESUCHE_COPY } from '@/lib/account/besuche-copy'
import {
  besuchAenderungLesen,
  besuchAnlageLesen,
  besuchLoeschungLesen,
} from '@/lib/account/besuche-eingabe'
import type { WeltBesuchtAnsicht } from '@/lib/account/welt-ansicht'
import type { WeltLaenderAbleitung } from '@/lib/account/welt-laender'
import type { WorldMapAbleitung } from '@/lib/account/world-map'
import type { Problem } from '@/lib/api/datenbank-lesen'

const aktionKlasse =
  'inline-flex min-h-11 min-w-11 items-center justify-center gap-1.5 rounded-full border border-line-200 bg-white px-4 text-xs font-semibold text-brand-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 disabled:opacity-60'

function formularWertAus(besuch: Besuch): BesuchFormularWert {
  return {
    ort: besuch.placeId && besuch.placeLabel ? { id: besuch.placeId, name: besuch.placeLabel } : null,
    countryCode: besuch.placeId ? '' : (besuch.countryCode ?? ''),
    jahr: besuch.jahr === null ? '' : String(besuch.jahr),
    monat: besuch.monat === null ? '' : String(besuch.monat),
    tag: besuch.tag === null ? '' : String(besuch.tag),
  }
}

function letzterVorgang(vorgaenge: readonly VisitVorgang[], surface: VisitSurface): VisitVorgang | null {
  for (let stelle = vorgaenge.length - 1; stelle >= 0; stelle -= 1) {
    const vorgang = vorgaenge[stelle]
    if (vorgang?.surface === surface) return vorgang
  }
  return null
}

function vorgangZeilen(vorgang: VisitVorgang, idSichtbar: boolean | null): string[] {
  const zeilen: string[] = []
  if (vorgang.phase === 'unterwegs') {
    zeilen.push(
      vorgang.art === 'bestaetigen'
        ? BESUCHE_COPY.pendingBestaetigt
        : vorgang.art === 'aendern'
          ? BESUCHE_COPY.pendingGeaendert
          : BESUCHE_COPY.pendingWiderrufen,
    )
  }
  if (vorgang.phase === 'angenommen') {
    zeilen.push(
      vorgang.art === 'bestaetigen'
        ? BESUCHE_COPY.erfolgBestaetigt
        : vorgang.art === 'aendern'
          ? BESUCHE_COPY.erfolgGeaendert
          : BESUCHE_COPY.erfolgWiderrufen,
    )
    if (vorgang.inhaltBeobachtet === 'ausstehend' || vorgang.pruefung === 'offen') zeilen.push(BESUCHE_COPY.listeOffen)
  }
  if (vorgang.pruefung === 'offen') zeilen.push(BESUCHE_COPY.pruefungLaeuft)
  if (vorgang.pruefung === 'beendet' && vorgang.phase !== 'unterwegs') zeilen.push(BESUCHE_COPY.pruefungBeendet)
  if (vorgang.inhaltBeobachtet === 'anders') zeilen.push(BESUCHE_COPY.listeGeaendert)
  if (vorgang.ereignisId && (vorgang.inhaltBeobachtet === 'gleich' || vorgang.inhaltBeobachtet === 'anders') && idSichtbar !== null) {
    zeilen.push(idSichtbar ? BESUCHE_COPY.idVorhanden : BESUCHE_COPY.idAbwesend)
  }
  if (vorgang.phase === 'unbestaetigt' && vorgang.blockerOffen) {
    zeilen.push(BESUCHE_COPY.unbekannt, BESUCHE_COPY.unmountHinweis)
  }
  return zeilen
}

function fokusSetzen(ziel: string, lage: { sucheAktiv: boolean; aufBody: boolean; inSurface: boolean }) {
  if (!visitFokusErlaubt({ ...lage, entwurfEpoche: null, vorgangEpoche: null })) return
  requestAnimationFrame(() => {
    document.querySelector<HTMLElement>(`[data-fokus="${CSS.escape(ziel)}"]`)?.focus()
  })
}

function fokusLage(): { sucheAktiv: boolean; aufBody: boolean; inSurface: boolean } {
  const aktiv = document.activeElement
  const element = aktiv instanceof HTMLElement ? aktiv : null
  return {
    sucheAktiv: element?.id === 'account-besuche-suche',
    aufBody: !element || element === document.body || element === document.documentElement,
    inSurface: Boolean(element?.closest('[data-besuch-surface]')),
  }
}

export default function AccountBesuche({
  welt,
  besucht,
  laender,
  besuche,
  problem,
}: {
  welt: WorldMapAbleitung
  besucht: WeltBesuchtAnsicht
  laender: WeltLaenderAbleitung
  besuche: readonly Besuch[]
  problem: Problem | null
}) {
  const workflow = useAccountVisitWorkflow({ problem, besuche }, BESUCH_FORMULAR_LEER)
  const [formularOffen, setFormularOffen] = useState(besuche.length === 0)
  const [suche, setSuche] = useState('')
  const [sichtGrenze, setSichtGrenze] = useState(BESUCH_VERWALTUNG_ANFANG)
  const hinzufuegenKnopf = useRef<HTMLButtonElement>(null)
  const formularKnoten = useRef<HTMLDivElement>(null)
  const ortFeld = useRef<HTMLInputElement>(null)
  const formularFokus = useRef(false)
  const anlegenWert = workflow.stand.anlegen.felder
  const editor = workflow.stand.editor
  const bearbeitet = editor?.ereignisId ? { id: editor.ereignisId, wert: editor.felder } : null
  const bestaetigung = workflow.stand.bestaetigung
  const ausschnitt = besuchVerwaltungAusschnitt(besucht.eintraege, suche, sichtGrenze)
  const anlegenVorgang = letzterVorgang(workflow.stand.vorgaenge, 'anlegen')
  const anlegenLaeuft = workflow.unterwegs('anlegen')
  const anlegenVerborgen = !formularOffen && (!visitFormularLeer(anlegenWert) || anlegenVorgang !== null)

  useEffect(() => {
    if (!formularOffen || !formularFokus.current) return
    formularFokus.current = false
    const reduziert = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    formularKnoten.current?.scrollIntoView({
      block: 'start',
      behavior: reduziert ? 'auto' : 'smooth',
    })
    ortFeld.current?.focus({ preventScroll: true })
  }, [formularOffen])

  function setNeu(wert: BesuchFormularWert) {
    workflow.anlegenSetzen(wert)
  }

  function onBearbeiten(wert: { id: string; wert: BesuchFormularWert } | null) {
    workflow.bearbeiten(wert)
  }

  function hinzufuegenUmschalten() {
    setFormularOffen((offen) => {
      const naechstes = !offen
      formularFokus.current = naechstes
      if (!naechstes) requestAnimationFrame(() => hinzufuegenKnopf.current?.focus())
      return naechstes
    })
  }

  function bestaetigen(bewusst = false) {
    if (!bewusst && anlegenVorgang?.blockerOffen) return
    const neu = anlegenWert
    const lokal = besuchAnlageLesen(besuchEingabeAus(neu))
    if (!lokal.ok) return workflow.hinweis('anlegen', lokal.meldung)
    workflow.senden({ art: 'bestaetigen', felder: neu }, () => besuchBestaetigen(besuchEingabeAus(neu)), bewusst)
  }

  function aendern(bewusst = false) {
    if (!bearbeitet) return
    const surface: VisitSurface = `ereignis:${bearbeitet.id}`
    const vorgang = letzterVorgang(workflow.stand.vorgaenge, surface)
    if (!bewusst && vorgang?.blockerOffen) return
    const lokal = besuchAenderungLesen({ id: bearbeitet.id, ...besuchEingabeAus(bearbeitet.wert) })
    if (!lokal.ok) return workflow.hinweis(surface, lokal.meldung)
    workflow.senden(
      { art: 'aendern', id: bearbeitet.id, felder: bearbeitet.wert },
      () => besuchAendern({
        id: bearbeitet.id,
        ...besuchEingabeAus(bearbeitet.wert),
      }),
      bewusst,
    )
  }

  function widerrufen(ereignisId: string, bewusst = false) {
    const id = ereignisId
    const bestaetigt = workflow.bestaetigung()
    const surface: VisitSurface = `ereignis:${id}`
    const vorgang = letzterVorgang(workflow.stand.vorgaenge, surface)
    if (!bewusst && vorgang?.art === 'widerrufen' && vorgang.blockerOffen) return
    const lokal = besuchLoeschungLesen({ id })
    if (!lokal.ok) return workflow.hinweis(surface, lokal.meldung)
    if (!bestaetigt || bestaetigt.ereignisId !== id || bestaetigt.konflikt !== 'keiner') return
    workflow.senden(
      { art: 'widerrufen', id, bestaetigung: bestaetigt },
      () => besuchWiderrufen({ id }),
      bewusst,
    )
  }

  function erneutMoeglich(vorgang: VisitVorgang): boolean {
    if (problem || workflow.unterwegs(vorgang.surface)) return false
    if (vorgang.art === 'bestaetigen') return formularOffen
    if (!vorgang.ereignisId) return false
    if (vorgang.art === 'aendern') {
      return editor?.ereignisId === vorgang.ereignisId && editor.konflikt === 'keiner'
    }
    return bestaetigung?.ereignisId === vorgang.ereignisId && bestaetigung.konflikt === 'keiner'
  }

  function erneutHinweis(vorgang: VisitVorgang): string | null {
    if (vorgang.phase !== 'unbestaetigt' || !vorgang.blockerOffen || erneutMoeglich(vorgang)) return null
    if (problem) return BESUCHE_COPY.erneutNachLesen
    if (vorgang.art === 'aendern') {
      if (editor?.ereignisId === vorgang.ereignisId && editor.konflikt !== 'keiner') return BESUCHE_COPY.erneutKonflikt
      return BESUCHE_COPY.erneutNurBearbeitung
    }
    if (vorgang.art === 'widerrufen') return BESUCHE_COPY.erneutNurWiderruf
    return BESUCHE_COPY.erneutNurFormular
  }

  function erneutSenden(vorgang: VisitVorgang) {
    if (!erneutMoeglich(vorgang)) return
    if (vorgang.art === 'bestaetigen') {
      bestaetigen(true)
      return
    }
    if (!vorgang.ereignisId) return
    if (vorgang.art === 'aendern') {
      if (editor?.ereignisId !== vorgang.ereignisId) return
      aendern(true)
      return
    }
    const aktuell = workflow.bestaetigung()
    if (!aktuell || aktuell.ereignisId !== vorgang.ereignisId || aktuell.konflikt !== 'keiner') return
    widerrufen(vorgang.ereignisId, true)
  }

  function zeileGerendert(ereignisId: string): boolean {
    if (problem) return false
    return ausschnitt.zeilen.some((zeile) => zeile.id === ereignisId)
  }

  function letzteVorgaenge(): VisitVorgang[] {
    const gesehen = new Set<string>()
    const ergebnis: VisitVorgang[] = []
    for (let stelle = workflow.stand.vorgaenge.length - 1; stelle >= 0; stelle -= 1) {
      const vorgang = workflow.stand.vorgaenge[stelle]
      if (!vorgang || gesehen.has(vorgang.surface)) continue
      gesehen.add(vorgang.surface)
      ergebnis.push(vorgang)
    }
    return ergebnis
  }

  const eigenVorgaenge = letzteVorgaenge().filter((vorgang) => {
    if (vorgangZeilen(vorgang, null).length === 0) return false
    if (vorgang.art === 'bestaetigen') return !problem && !formularOffen
    return !vorgang.ereignisId || !zeileGerendert(vorgang.ereignisId)
  })

  function entwurfSpeichern(besuch: Besuch) {
    workflow.bewaaffnen(besuch)
    const wert = editor?.felder
    if (!wert || editor?.ereignisId !== besuch.id) return
    const bearbeitetSpeichern = { id: besuch.id, wert }
    const lokal = besuchAenderungLesen({
      id: bearbeitetSpeichern.id,
      ...besuchEingabeAus(bearbeitetSpeichern.wert),
    })
    if (!lokal.ok) return workflow.hinweis(`ereignis:${besuch.id}`, lokal.meldung)
    workflow.senden(
      { art: 'aendern', id: bearbeitetSpeichern.id, felder: bearbeitetSpeichern.wert },
      () => besuchAendern({
        id: bearbeitetSpeichern.id,
        ...besuchEingabeAus(bearbeitetSpeichern.wert),
      }),
      true,
    )
  }

  function inListeZeigen(id: string) {
    const index = besucht.eintraege.findIndex((eintrag) => eintrag.id === id)
    setSuche('')
    if (index >= 0) setSichtGrenze(index + 1)
    fokusSetzen(`bearbeiten:${id}`, fokusLage())
  }

  const editorSichtbar = editor?.ereignisId
    ? ausschnitt.zeilen.some((zeile) => zeile.id === editor.ereignisId)
    : true

  return (
    <div data-account-besuche={besucht.lage}>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">
        {BESUCHE_COPY.seitenEyebrow}
      </p>
      <div className="mt-2 flex min-w-0 flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <h1 className="min-w-0 break-words text-3xl font-semibold tracking-[-0.04em] text-brand-800 sm:text-5xl">
          {BESUCHE_COPY.seitenTitel}
        </h1>
        {problem ? null : (
          <button
            ref={hinzufuegenKnopf}
            type="button"
            data-besuch-hinzufuegen="ein"
            data-fokus="anlegen-oeffnen"
            aria-expanded={formularOffen}
            aria-controls="account-besuch-anlegen"
            onClick={hinzufuegenUmschalten}
            className="inline-flex min-h-11 w-full shrink-0 items-center justify-center rounded-full bg-brand-800 px-5 text-sm font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 sm:w-auto"
          >
            {BESUCHE_COPY.hinzufuegenAktion}
          </button>
        )}
      </div>
      <p className="mt-3 max-w-xl text-sm leading-6 text-ink-700">{BESUCHE_COPY.seitenLead}</p>
      <p className="mt-2 max-w-xl text-sm leading-6 text-ink-700">{BESUCHE_COPY.seitenHinweis}</p>

      <AccountWeltKarte welt={welt} besucht={besucht} laender={laender} />

      <section
        aria-labelledby="account-besuche-liste"
        className="mt-14 border-t border-line-200 pt-10"
        data-besuch-verwaltung="ein"
      >
        <div className="flex min-w-0 flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
          <h2
            id="account-besuche-liste"
            className="text-xl font-semibold tracking-[-0.03em] text-brand-800"
          >
            {BESUCHE_COPY.listeTitel}
          </h2>
          {!problem && besucht.eintraege.length > 0 ? (
            <p className="text-sm text-ink-700" data-besuch-gesamt={besucht.eintraege.length}>
              {besuchEreignisZahlText(besucht.eintraege.length)}
            </p>
          ) : null}
        </div>

        {eigenVorgaenge.length > 0 ? (
          <div className="mt-4 grid min-w-0 gap-2" data-besuch-vorgang-haltung="eigen">
            {eigenVorgaenge.map((vorgang) => (
              <VorgangLeiste
                key={vorgang.id}
                vorgang={vorgang}
                idSichtbar={problem || !vorgang.ereignisId ? null : besuche.some((besuch) => besuch.id === vorgang.ereignisId)}
                erneutMoeglich={erneutMoeglich(vorgang)}
                erneutHinweis={erneutHinweis(vorgang)}
                onLesen={() => workflow.lesen(vorgang.id)}
                onErneut={() => erneutSenden(vorgang)}
                onSchliessen={() => workflow.schliessen(vorgang.id)}
              />
            ))}
          </div>
        ) : null}

        {problem ? (
          <div
            role="alert"
            className="mt-4 rounded-[26px] border border-red-200 bg-red-50 px-6 py-8 text-center sm:px-10"
          >
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white text-red-600">
              <AlertCircle className="h-5 w-5" aria-hidden="true" />
            </span>
            <h3 className="mt-5 text-lg font-semibold text-red-800">{BESUCHE_COPY.fehlerTitel}</h3>
            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-red-700">
              {problem.status === 503 ? BESUCHE_COPY.fehler503 : BESUCHE_COPY.fehler500}
            </p>
            {anlegenVorgang ? (
              <VorgangLeiste
                vorgang={anlegenVorgang}
                idSichtbar={null}
                erneutMoeglich={erneutMoeglich(anlegenVorgang)}
                erneutHinweis={erneutHinweis(anlegenVorgang)}
                onLesen={() => workflow.lesen(anlegenVorgang.id)}
                onErneut={() => erneutSenden(anlegenVorgang)}
                onSchliessen={() => workflow.schliessen(anlegenVorgang.id)}
              />
            ) : null}
          </div>
        ) : (
          <>
            {besucht.eintraege.length > 0 ? (
              <div className="mt-4 grid min-w-0 gap-1">
                <label htmlFor="account-besuche-suche" className="text-sm font-medium text-brand-800">
                  {BESUCHE_COPY.sucheLabel}
                </label>
                <input
                  id="account-besuche-suche"
                  data-besuch-suche="ein"
                  type="text"
                  role="searchbox"
                  value={suche}
                  autoComplete="off"
                  spellCheck={false}
                  enterKeyHint="search"
                  placeholder={BESUCHE_COPY.suchePlatzhalter}
                  onChange={(ereignis) => setSuche(ereignis.target.value)}
                  className="min-h-11 w-full rounded-2xl border border-line-200 bg-white px-3 text-base text-brand-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 sm:text-sm"
                />
                {ausschnitt.sucheAktiv ? (
                  <p className="text-xs leading-5 text-ink-700" data-besuch-suche-anzahl={ausschnitt.gefiltert.length}>
                    {besuchSuchtrefferText(ausschnitt.gefiltert.length, besucht.eintraege.length)}
                  </p>
                ) : null}
              </div>
            ) : (
              <div className="mt-4 rounded-[26px] border border-dashed border-line-400 bg-white/65 px-6 py-8 text-center sm:px-10">
                <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-surface-100 text-brand-600">
                  <MapPin className="h-5 w-5" aria-hidden="true" />
                </span>
                <h3 className="mt-5 text-xl font-semibold tracking-[-0.03em] text-brand-800">
                  {BESUCHE_COPY.leerTitel}
                </h3>
                <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-ink-700">
                  {BESUCHE_COPY.leerText}
                </p>
              </div>
            )}

            {formularOffen ? (
              <div
                id="account-besuch-anlegen"
                ref={formularKnoten}
                className="mt-4 scroll-mt-28"
                data-besuch-anlage="offen"
                data-besuch-surface="anlegen"
              >
                <h2 className="sr-only">{BESUCHE_COPY.anlegenTitel}</h2>
                <AccountBesuchFormular
                  titel={BESUCHE_COPY.anlegenTitel}
                  aktionText={BESUCHE_COPY.anlegenAktion}
                  wert={anlegenWert}
                  onWert={setNeu}
                  onAbsenden={() => bestaetigen(false)}
                  laeuft={anlegenLaeuft}
                  ortRef={ortFeld}
                  hinweis={workflow.stand.anlegen.lokalerHinweis}
                  fokusId="anlegen-ort"
                />
                {anlegenVorgang ? (
                  <VorgangLeiste
                    vorgang={anlegenVorgang}
                    idSichtbar={null}
                    erneutMoeglich={erneutMoeglich(anlegenVorgang)}
                    erneutHinweis={erneutHinweis(anlegenVorgang)}
                    onLesen={() => workflow.lesen(anlegenVorgang.id)}
                    onErneut={() => erneutSenden(anlegenVorgang)}
                    onSchliessen={() => workflow.schliessen(anlegenVorgang.id)}
                  />
                ) : null}
              </div>
            ) : null}

            {anlegenVerborgen ? (
              <EntwurfBanner
                text={BESUCHE_COPY.anlegenVerborgen}
                zeigen={BESUCHE_COPY.formularZeigen}
                surface="anlegen"
                verwerfenGesperrt={anlegenLaeuft}
                onZeigen={() => {
                  formularFokus.current = true
                  setFormularOffen(true)
                }}
                onVerwerfen={() => {
                  workflow.verwerfen('anlegen')
                }}
              />
            ) : null}

            {editor && !editorSichtbar ? (
              <EntwurfBanner
                text={editor.konflikt === 'entfernt' ? BESUCHE_COPY.zielEntfernt : BESUCHE_COPY.bearbeitenVerborgen}
                zeigen={BESUCHE_COPY.inListeZeigen}
                surface={editor.surface}
                verwerfenGesperrt={workflow.unterwegs(editor.surface)}
                onZeigen={() => inListeZeigen(editor.ereignisId!)}
                onVerwerfen={() => {
                  workflow.verwerfen(editor.surface)
                  fokusSetzen(`bearbeiten:${editor.ereignisId}`, fokusLage())
                }}
              />
            ) : null}

            {besuche.length === 0 ? null : ausschnitt.sucheAktiv && ausschnitt.zeilen.length === 0 ? (
              <p
                role="status"
                data-besuch-suche="leer"
                className="mt-4 rounded-2xl border border-dashed border-line-400 bg-white/65 px-4 py-6 text-sm leading-6 text-ink-800"
              >
                {BESUCHE_COPY.sucheLeer}
              </p>
            ) : (
              <>
                <ol
                  className="mt-4 grid min-w-0 grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-3"
                  data-besuch-sichtbar={ausschnitt.zeilen.length}
                >
                  {ausschnitt.zeilen.map((eintrag) => (
                    <BesuchZeile
                      key={eintrag.id}
                      eintrag={eintrag}
                      besuche={besuche}
                      bearbeitet={bearbeitet}
                      bestaetigung={bestaetigung}
                      vorgang={letzterVorgang(workflow.stand.vorgaenge, `ereignis:${eintrag.id}`)}
                      laeuft={workflow.unterwegs(`ereignis:${eintrag.id}`)}
                      bestaetigungLaeuft={bestaetigung ? workflow.bestaetigungLaeuft(bestaetigung.id) : false}
                      onBearbeiten={onBearbeiten}
                      onWiderruf={(id) => {
                        if (id === null) {
                          workflow.bestaetigungSchliessen()
                          if (eintrag.id) fokusSetzen(`widerrufen:${eintrag.id}`, fokusLage())
                          return
                        }
                        workflow.bestaetigungOeffnen(id)
                      }}
                      onAendern={() => aendern(false)}
                      onWiderrufen={(id) => widerrufen(id, false)}
                      onErneutBestaetigen={() => workflow.erneutBestaetigen(eintrag.id)}
                      onLesen={(id) => workflow.lesen(id)}
                      onErneut={() => {
                        const ziel = letzterVorgang(workflow.stand.vorgaenge, `ereignis:${eintrag.id}`)
                        if (ziel) erneutSenden(ziel)
                      }}
                      erneutMoeglich={(() => {
                        const ziel = letzterVorgang(workflow.stand.vorgaenge, `ereignis:${eintrag.id}`)
                        return ziel ? erneutMoeglich(ziel) : false
                      })()}
                      erneutHinweis={(() => {
                        const ziel = letzterVorgang(workflow.stand.vorgaenge, `ereignis:${eintrag.id}`)
                        return ziel ? erneutHinweis(ziel) : null
                      })()}
                      onSchliessen={(id) => workflow.schliessen(id)}
                      onAnsehen={() => workflow.ansehen()}
                      onUebernehmen={(besuch) => workflow.uebernehmen(besuch)}
                      onEntwurfSpeichern={entwurfSpeichern}
                      onVerwerfen={() => workflow.verwerfen(`ereignis:${eintrag.id}`)}
                      idSichtbar={besuche.some((besuch) => besuch.id === eintrag.id)}
                      entwurf={editor?.ereignisId === eintrag.id ? editor : null}
                    />
                  ))}
                </ol>
                {ausschnitt.verborgen > 0 ? (
                  <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                    <p className="w-full text-sm leading-6 text-ink-700" data-besuch-verborgen={ausschnitt.verborgen}>
                      {besuchWeitereText(ausschnitt.verborgen)}
                    </p>
                    <button
                      type="button"
                      data-besuch-weitere="ein"
                      onClick={() => setSichtGrenze((wert) => wert + BESUCH_VERWALTUNG_SCHRITT)}
                      className="inline-flex min-h-11 w-full items-center justify-center rounded-full border border-line-200 bg-white px-4 text-sm font-semibold text-brand-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 sm:w-auto"
                    >
                      {BESUCHE_COPY.weitereAnzeigen}
                    </button>
                    <button
                      type="button"
                      data-besuch-alle="ein"
                      onClick={() => setSichtGrenze(besucht.eintraege.length)}
                      className="inline-flex min-h-11 w-full items-center justify-center rounded-full bg-brand-800 px-4 text-sm font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 sm:w-auto"
                    >
                      {BESUCHE_COPY.alleAnzeigen}
                    </button>
                  </div>
                ) : null}
              </>
            )}
          </>
        )}
      </section>
    </div>
  )
}

function EntwurfBanner({
  text,
  zeigen,
  surface,
  verwerfenGesperrt,
  onZeigen,
  onVerwerfen,
}: {
  text: string
  zeigen: string
  surface: VisitSurface
  verwerfenGesperrt: boolean
  onZeigen: () => void
  onVerwerfen: () => void
}) {
  return (
    <div
      className="mt-4 rounded-2xl border border-line-200 bg-surface-50 px-4 py-3"
      data-besuch-entwurf-banner={surface}
      data-besuch-surface={surface}
    >
      <p className="text-sm leading-6 text-brand-800">{text}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        <button type="button" className={aktionKlasse} data-fokus={`entwurf-finden:${surface}`} onClick={onZeigen}>
          {zeigen}
        </button>
        <button type="button" className={aktionKlasse} disabled={verwerfenGesperrt} onClick={onVerwerfen}>
          {BESUCHE_COPY.entwurfVerwerfen}
        </button>
      </div>
    </div>
  )
}

function VorgangLeiste({
  vorgang,
  idSichtbar,
  erneutMoeglich,
  erneutHinweis,
  onLesen,
  onErneut,
  onSchliessen,
}: {
  vorgang: VisitVorgang
  idSichtbar: boolean | null
  erneutMoeglich: boolean
  erneutHinweis: string | null
  onLesen: () => void
  onErneut: () => void
  onSchliessen: () => void
}) {
  const zeilen = vorgangZeilen(vorgang, idSichtbar)
  if (zeilen.length === 0) return null
  const alarm = vorgang.phase === 'unbestaetigt' && vorgang.blockerOffen
  return (
    <div
      className="mt-3 rounded-2xl border border-line-200 bg-surface-50 px-4 py-3"
      data-besuch-vorgang={vorgang.id}
      data-besuch-art={vorgang.art}
      data-besuch-ereignis={vorgang.ereignisId ?? ''}
      data-besuch-phase={vorgang.phase}
      data-besuch-inhalt={vorgang.inhaltBeobachtet}
      data-besuch-erneut={erneutMoeglich ? 'bereit' : 'gebunden'}
    >
      <p role={alarm ? 'alert' : 'status'} className="text-sm leading-6 text-brand-800">
        {zeilen.join(' ')}
      </p>
      {alarm || vorgang.phase === 'angenommen' ? (
        <div className="mt-2 flex flex-wrap gap-2">
          <button type="button" className={aktionKlasse} onClick={onLesen}>
            {BESUCHE_COPY.listePruefen}
          </button>
          {alarm ? (
            <>
              <button type="button" className={aktionKlasse} disabled={!erneutMoeglich} onClick={onErneut}>
                {BESUCHE_COPY.erneutSenden}
              </button>
              <button type="button" className={aktionKlasse} onClick={onSchliessen}>
                {BESUCHE_COPY.vorgangSchliessen}
              </button>
            </>
          ) : null}
        </div>
      ) : null}
      {erneutHinweis ? (
        <p className="mt-2 text-xs leading-5 text-ink-700" data-besuch-erneut-hinweis="ein">{erneutHinweis}</p>
      ) : null}
    </div>
  )
}

function BesuchZeile({
  eintrag,
  besuche,
  bearbeitet,
  bestaetigung,
  vorgang,
  laeuft,
  bestaetigungLaeuft,
  onBearbeiten,
  onWiderruf,
  onAendern,
  onWiderrufen,
  onErneutBestaetigen,
  onLesen,
  onErneut,
  erneutMoeglich,
  erneutHinweis,
  onSchliessen,
  onAnsehen,
  onUebernehmen,
  onEntwurfSpeichern,
  onVerwerfen,
  idSichtbar,
  entwurf,
}: {
  eintrag: BesuchAnzeige
  besuche: readonly Besuch[]
  bearbeitet: { id: string; wert: BesuchFormularWert } | null
  bestaetigung: { id: string; ereignisId: string; konflikt: 'keiner' | 'felder' | 'entfernt'; epoche: number; anzeigeText: string | null; lokalerHinweis: string | null } | null
  vorgang: VisitVorgang | null
  laeuft: boolean
  bestaetigungLaeuft: boolean
  onBearbeiten: (wert: { id: string; wert: BesuchFormularWert } | null) => void
  onWiderruf: (id: string | null) => void
  onAendern: () => void
  onWiderrufen: (id: string) => void
  onErneutBestaetigen: () => void
  onLesen: (id: string) => void
  onErneut: () => void
  erneutMoeglich: boolean
  erneutHinweis: string | null
  onSchliessen: (id: string) => void
  onAnsehen: () => void
  onUebernehmen: (besuch: Besuch) => void
  onEntwurfSpeichern: (besuch: Besuch) => void
  onVerwerfen: () => void
  idSichtbar: boolean
  entwurf: VisitEntwurf | null
}) {
  const inBearbeitung = bearbeitet?.id === eintrag.id
  const imWiderruf = bestaetigung?.ereignisId === eintrag.id
  const besuch = besuche.find((eintragBesuch) => eintragBesuch.id === eintrag.id) ?? null

  return (
    <li className="min-w-0" data-besuch-surface={`ereignis:${eintrag.id}`}>
      <article
        data-besuch={eintrag.id}
        className="flex h-full w-full min-w-0 flex-col rounded-2xl border border-line-200 bg-surface-0 px-3 py-3"
      >
        <h3 className="break-words text-sm font-semibold leading-5 text-brand-800">{eintrag.titel}</h3>
        {eintrag.landLabel ? (
          <p className="break-words text-xs leading-5 text-ink-800">{eintrag.landLabel}</p>
        ) : null}
        <p data-besuch-zeit={eintrag.zeitGenauigkeit} className="break-words text-xs leading-5 text-ink-700">
          {eintrag.zeitText}
        </p>
        {eintrag.wiederholungText ? (
          <p className="break-words text-xs leading-5 text-brand-700">{eintrag.wiederholungText}</p>
        ) : null}

        {imWiderruf && bestaetigung ? (
          <div
            className="mt-2 border-t border-line-100 pt-2"
            data-besuch-bestaetigung={bestaetigung.id}
            data-besuch-konflikt={bestaetigung.konflikt}
            data-besuch-bestaetigung-epoche={bestaetigung.epoche}
          >
            <p className="text-xs leading-5 text-ink-800">{BESUCHE_COPY.widerrufenFrage}</p>
            {bestaetigung.lokalerHinweis ? (
              <p role="alert" className="mt-2 text-xs leading-5 text-red-800">{bestaetigung.lokalerHinweis}</p>
            ) : null}
            {bestaetigung.konflikt === 'felder' ? (
              <p className="mt-2 text-xs leading-5 text-brand-800">{BESUCHE_COPY.widerrufGeaendert}</p>
            ) : null}
            {bestaetigung.konflikt === 'entfernt' ? (
              <p className="mt-2 text-xs leading-5 text-brand-800">{BESUCHE_COPY.zielEntfernt}</p>
            ) : null}
            {laeuft && bestaetigung.konflikt !== 'keiner' ? (
              <p className="mt-2 text-xs leading-5 text-ink-700">{BESUCHE_COPY.laufenderEntwurf}</p>
            ) : null}
            <div className="mt-2 flex flex-wrap gap-2">
              {bestaetigung.konflikt !== 'entfernt' ? (
                <button
                  type="button"
                  disabled={bestaetigungLaeuft && bestaetigung.konflikt === 'keiner'}
                  onClick={() => onWiderrufen(eintrag.id)}
                  className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full bg-danger-600 px-4 text-xs font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 disabled:opacity-60"
                >
                  {BESUCHE_COPY.widerrufenBestaetigen}
                </button>
              ) : null}
              {bestaetigung.konflikt === 'felder' ? (
                <button type="button" className={aktionKlasse} onClick={onErneutBestaetigen}>
                  {BESUCHE_COPY.erneutBestaetigen}
                </button>
              ) : null}
              {bestaetigung.konflikt === 'entfernt' ? (
                <button type="button" className={aktionKlasse} onClick={onVerwerfen}>
                  {BESUCHE_COPY.entwurfVerwerfen}
                </button>
              ) : null}
              <button
                type="button"
                disabled={bestaetigungLaeuft && bestaetigung.konflikt === 'keiner'}
                onClick={() => onWiderruf(null)}
                className={aktionKlasse}
              >
                {BESUCHE_COPY.abbrechen}
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-2 flex flex-wrap gap-2 border-t border-line-100 pt-2">
            <button
              type="button"
              aria-expanded={inBearbeitung}
              data-fokus={`bearbeiten:${eintrag.id}`}
              onClick={() => {
                const ziel = besuche.find((eintragBesuch) => eintragBesuch.id === eintrag.id)
                if (!ziel) return
                onBearbeiten(inBearbeitung ? null : { id: ziel.id, wert: formularWertAus(ziel) })
              }}
              className={aktionKlasse}
            >
              <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
              {BESUCHE_COPY.bearbeiten}
            </button>
            <button
              type="button"
              data-fokus={`widerrufen:${eintrag.id}`}
              onClick={() => onWiderruf(eintrag.id)}
              className={aktionKlasse}
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
              {BESUCHE_COPY.widerrufen}
            </button>
          </div>
        )}

        {inBearbeitung && bearbeitet && entwurf ? (
          <div className="mt-3" data-besuch-editor-epoche={entwurf.epoche} data-besuch-konflikt={entwurf.konflikt}>
            <AccountBesuchFormular
              titel={BESUCHE_COPY.aendernTitel}
              aktionText={BESUCHE_COPY.aendernAktion}
              wert={bearbeitet.wert}
              onWert={(wert) => onBearbeiten({ id: bearbeitet.id, wert })}
              onAbsenden={onAendern}
              onAbbrechen={() => onBearbeiten(null)}
              laeuft={laeuft}
              zeitNebeneinander={false}
              hinweis={entwurf.lokalerHinweis}
              fokusId={`bearbeiten:${eintrag.id}`}
            />
            <EditorKonflikt
              besuch={besuch}
              entwurf={entwurf}
              laeuft={laeuft}
              onAnsehen={onAnsehen}
              onUebernehmen={onUebernehmen}
              onEntwurfSpeichern={onEntwurfSpeichern}
              onVerwerfen={onVerwerfen}
            />
          </div>
        ) : null}
        {vorgang ? (
          <VorgangLeiste
            vorgang={vorgang}
            idSichtbar={idSichtbar}
            erneutMoeglich={erneutMoeglich}
            erneutHinweis={erneutHinweis}
            onLesen={() => onLesen(vorgang.id)}
            onErneut={onErneut}
            onSchliessen={() => onSchliessen(vorgang.id)}
          />
        ) : null}
      </article>
    </li>
  )
}

function EditorKonflikt({
  besuch,
  entwurf,
  laeuft,
  onAnsehen,
  onUebernehmen,
  onEntwurfSpeichern,
  onVerwerfen,
}: {
  besuch: Besuch | null
  entwurf: VisitEntwurf
  laeuft: boolean
  onAnsehen: () => void
  onUebernehmen: (besuch: Besuch) => void
  onEntwurfSpeichern: (besuch: Besuch) => void
  onVerwerfen: () => void
}) {
  if (entwurf.konflikt === 'keiner' || !besuch) return null
  return (
    <div className="mt-3 rounded-2xl border border-line-200 bg-surface-50 px-3 py-3" data-besuch-konflikt-banner={entwurf.konflikt}>
      <p className="text-xs leading-5 text-brand-800">
        {entwurf.konflikt === 'entfernt' ? BESUCHE_COPY.zielEntfernt : BESUCHE_COPY.konfliktEntwurf}
      </p>
      {laeuft ? <p className="mt-2 text-xs leading-5 text-ink-700">{BESUCHE_COPY.laufenderEntwurf}</p> : null}
      {entwurf.ansehen && entwurf.anzeigeText ? (
        <p className="mt-2 text-xs leading-5 text-ink-800" data-besuch-kanonisch="ein">{entwurf.anzeigeText}</p>
      ) : null}
      <div className="mt-2 flex flex-wrap gap-2">
        {entwurf.konflikt === 'felder' ? (
          <>
            <button type="button" className={aktionKlasse} onClick={onAnsehen}>{BESUCHE_COPY.aenderungenAnsehen}</button>
            <button type="button" className={aktionKlasse} disabled={laeuft} onClick={() => onUebernehmen(besuch)}>
              {BESUCHE_COPY.listeUebernehmen}
            </button>
            <button type="button" className={aktionKlasse} disabled={laeuft} onClick={() => onEntwurfSpeichern(besuch)}>
              {BESUCHE_COPY.entwurfSpeichern}
            </button>
          </>
        ) : null}
        <button type="button" className={aktionKlasse} disabled={laeuft} onClick={onVerwerfen}>
          {BESUCHE_COPY.entwurfVerwerfen}
        </button>
      </div>
    </div>
  )
}
