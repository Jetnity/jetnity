'use client'

import * as React from 'react'

import { nutzerstandText, SENSITIVE_HINWEIS } from '@/lib/readiness/bezeichnungen'
import type { ReadinessViewItem } from '@/lib/readiness/domain'
import { readinessClientRefErzeugen } from '@/lib/readiness/bauen'
import {
  entfernenFrage,
  PERSONAL_AKTUALISIEREN,
  PERSONAL_FILTER,
  PERSONAL_FILTER_LABEL,
  PERSONAL_KEIN_TREFFER,
  PERSONAL_LEER,
  PERSONAL_STALE_ERKLAERUNG,
  PERSONAL_SUCHE_LABEL,
  PERSONAL_VERWERFEN,
  PERSONAL_ZIEL_WEG,
  preparationEpoch,
  persoenlicheEingabe,
  zeileSichtbar,
  type PersonalFilter,
  type PersonalIntent,
} from '@/lib/readiness/personal-preparation-workflow'
import type { PersonalSteuerung } from '@/components/trips/usePersonalPreparationLifecycle'
import type { ReadinessKind, ReadinessUserStatus, Trip } from '@/types/trips'

type Editor = {
  title: string
  status: ReadinessUserStatus
  boundEpoch: string
  generation: number
}

const FELD =
  'min-h-[44px] w-full min-w-0 rounded-2xl border border-line-200 px-[12px] text-base text-brand-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/15'
const KNOPF =
  'flex min-h-[44px] w-full min-w-0 items-center justify-center break-words rounded-full px-[12px] text-center text-sm font-semibold focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/15 sm:w-auto'
const PRIMAER = `${KNOPF} bg-brand-800 text-white`
const SEKUNDAER = `${KNOPF} border border-line-200 text-brand-800`

export default function EigeneReisevorbereitung({
  reise,
  items,
  onSetzen,
  onEntfernen,
  steuerung = null,
  erstellenLabel = 'Punkt hinzufügen',
}: {
  reise: Trip
  items: readonly ReadinessViewItem[]
  onSetzen?: (eingabe: {
    clientRef: string
    kind: ReadinessKind
    userStatus: ReadinessUserStatus
    countryCode: string | null
    tripItemId: string | null
    title: string | null
  }) => Promise<string | null>
  onEntfernen?: (clientRef: string) => Promise<string | null>
  steuerung?: PersonalSteuerung | null
  erstellenLabel?: string
}) {
  const [titel, setTitel] = React.useState('')
  const [suche, setSuche] = React.useState('')
  const [filter, setFilter] = React.useState<PersonalFilter>('alle')
  const [editoren, setEditoren] = React.useState<Record<string, Editor>>({})
  const [loeschen, setLoeschen] = React.useState<string | null>(null)
  const kontext = steuerung?.kontextReise ?? reise
  const eigene = items.filter((item) => item.kind === 'preparation')
  const intents = steuerung?.intents ?? []
  const schluessel = eigene.map((item) => `${item.clientRef}:${preparationEpoch(kontext, item)}`).join('|')
  const [epochStand, setEpochStand] = React.useState(schluessel)
  const leeren = steuerung?.titelLeerenFuer ?? null
  const [geleert, setGeleert] = React.useState<string | null>(null)

  if (epochStand !== schluessel) {
    setEpochStand(schluessel)
    setEditoren((vorher) => {
      let anders = false
      const next = { ...vorher }
      for (const item of eigene) {
        const editor = next[item.clientRef]
        if (!editor) continue
        const epoch = preparationEpoch(kontext, item)
        if (editor.boundEpoch === epoch) continue
        anders = true
        next[item.clientRef] =
          editor.status === 'done' || editor.status === 'skipped'
            ? { ...editor, status: 'open', boundEpoch: epoch }
            : { ...editor, boundEpoch: epoch }
      }
      return anders ? next : vorher
    })
  }

  if (leeren && leeren !== geleert) {
    setGeleert(leeren)
    setTitel('')
  }

  const interaktionRef = React.useRef(steuerung?.interaktion)
  React.useEffect(() => {
    interaktionRef.current = steuerung?.interaktion
  })
  React.useEffect(() => {
    return () => {
      interaktionRef.current?.()
    }
  }, [])

  React.useEffect(() => {
    const id = steuerung?.fokusIntentId
    if (!id) return
    const ziel = document.querySelector<HTMLElement>(`[data-personal-focus="${id}"]`)
    if (!ziel || !ziel.isConnected) return
    if (ziel.closest('[hidden]')) return
    const details = ziel.closest('details')
    if (details && !details.open) return
    if (ziel.getClientRects().length === 0) return
    ziel.focus()
  }, [steuerung?.fokusIntentId])

  const letzteJeRef = new Map<string, PersonalIntent>()
  for (const intent of intents) letzteJeRef.set(intent.clientRef, intent)
  const schwebend = intents.filter((intent) => {
    if (eigene.some((item) => item.clientRef === intent.clientRef)) return false
    return letzteJeRef.get(intent.clientRef)?.id === intent.id
  })
  const sichtbar = eigene.filter((item) => zeileSichtbar(item, filter, suche, intents))
  const schwebendSichtbar = schwebend.filter((intent) => {
    const alsZeile = {
      clientRef: intent.clientRef,
      title: intent.title,
      currentness: 'current' as const,
      userStatus: 'open' as const,
    }
    return zeileSichtbar(alsZeile, filter, suche, [intent])
  })

  const feld = steuerung ? steuerung.draft : titel
  const hinzufuegen = async (event: React.FormEvent) => {
    event.preventDefault()
    if (steuerung) {
      steuerung.erstellen(feld, filter)
      return
    }
    if (!onSetzen) return
    const fehler = await onSetzen(persoenlicheEingabe(titel, readinessClientRefErzeugen('preparation')))
    if (!fehler) setTitel('')
  }

  const titelAendern = (wert: string) => {
    if (steuerung) steuerung.draftSetzen(wert)
    else setTitel(wert)
  }

  return (
    <div className="grid w-full min-w-0 gap-3" data-personal-preparation-root="">
      <label className="grid gap-1 text-sm font-medium text-brand-800">
        {PERSONAL_SUCHE_LABEL}
        <input
          value={suche}
          onChange={(event) => setSuche(event.target.value)}
          onFocus={() => steuerung?.interaktion()}
          className={FELD}
          data-personal-preparation-search=""
        />
      </label>
      <div role="group" aria-label={PERSONAL_FILTER_LABEL} className="grid w-full min-w-0 grid-cols-1 gap-2 sm:flex sm:flex-wrap">
        {PERSONAL_FILTER.map(([wert, label]) => (
          <button
            key={wert}
            type="button"
            aria-pressed={filter === wert}
            className={filter === wert ? PRIMAER : SEKUNDAER}
            onClick={() => {
              steuerung?.interaktion()
              setFilter(wert)
            }}
            onFocus={() => steuerung?.interaktion()}
          >
            {label}
          </button>
        ))}
      </div>
      {eigene.length === 0 ? <p className="break-words text-xs leading-5 text-ink-800">{PERSONAL_LEER}</p> : null}
      {eigene.length > 0 && sichtbar.length === 0 && schwebendSichtbar.length === 0 ? (
        <p className="break-words text-xs leading-5 text-ink-800">{PERSONAL_KEIN_TREFFER}</p>
      ) : null}
      {sichtbar.length > 0 || schwebendSichtbar.length > 0 || Object.keys(editoren).some((ref) => !eigene.some((item) => item.clientRef === ref)) ? (
        <ul className="grid gap-2">
          {sichtbar.map((item) => (
            <Zeile
              key={item.clientRef}
              item={item}
              doppelt={eigene.filter((eintrag) => (eintrag.title ?? '') === (item.title ?? '')).length > 1}
              editor={editoren[item.clientRef] ?? null}
              intent={[...intents].reverse().find((eintrag) => eintrag.clientRef === item.clientRef) ?? null}
              loeschen={loeschen === item.clientRef}
              sperre={steuerung?.barrier ?? false}
              onOeffnen={() => {
                steuerung?.interaktion()
                const epoch = preparationEpoch(kontext, item)
                const generation = (editoren[item.clientRef]?.generation ?? 0) + 1
                setEditoren((vorher) => ({
                  ...vorher,
                  [item.clientRef]: {
                    title: item.title ?? '',
                    status: item.currentness === 'stale' ? 'open' : item.userStatus,
                    boundEpoch: epoch,
                    generation,
                  },
                }))
                steuerung?.editorBewegt(item.clientRef, generation)
              }}
              onTitel={(wert) => {
                const generation = (editoren[item.clientRef]?.generation ?? 0) + 1
                setEditoren((vorher) => {
                  const editor = vorher[item.clientRef]
                  if (!editor) return vorher
                  return { ...vorher, [item.clientRef]: { ...editor, title: wert, generation } }
                })
                steuerung?.editorBewegt(item.clientRef, generation)
              }}
              onStatus={(status) => {
                steuerung?.interaktion()
                const generation = (editoren[item.clientRef]?.generation ?? 0) + 1
                setEditoren((vorher) => {
                  const editor = vorher[item.clientRef]
                  if (!editor) return vorher
                  return { ...vorher, [item.clientRef]: { ...editor, status, generation } }
                })
                steuerung?.editorBewegt(item.clientRef, generation)
              }}
              onSpeichern={() => {
                if (!steuerung) return
                steuerung.interaktion()
                const editor = editoren[item.clientRef]
                if (!editor) return
                steuerung.bearbeiten({
                  clientRef: item.clientRef,
                  title: editor.title,
                  userStatus: editor.status,
                  boundEpoch: editor.boundEpoch,
                  editorGeneration: editor.generation,
                  filter,
                })
              }}
              onLoeschenFragen={() => {
                steuerung?.interaktion()
                setLoeschen(item.clientRef)
              }}
              onLoeschenAbbrechen={() => {
                steuerung?.interaktion()
                setLoeschen(null)
              }}
              onLoeschen={() => {
                steuerung?.interaktion()
                const generation = editoren[item.clientRef]?.generation ?? 0
                steuerung?.entfernen(item.clientRef, filter, generation)
                if (!steuerung && onEntfernen) void onEntfernen(item.clientRef)
                setLoeschen(null)
              }}
              onInteraktion={() => steuerung?.interaktion()}
              onErneut={() => {
                const intent = [...intents].reverse().find((eintrag) => eintrag.clientRef === item.clientRef)
                if (intent) steuerung?.erneut(intent.id)
              }}
              onVerwerfen={() => {
                const intent = [...intents].reverse().find((eintrag) => eintrag.clientRef === item.clientRef)
                if (intent) steuerung?.verwerfen(intent.id)
              }}
              onAktualisieren={() => steuerung?.aktualisieren()}
            />
          ))}
          {Object.entries(editoren)
            .filter(([ref]) => !eigene.some((item) => item.clientRef === ref) && !schwebend.some((intent) => intent.clientRef === ref))
            .map(([ref, editor]) => (
              <li key={ref} className="grid gap-2 rounded-2xl border border-line-200 bg-white px-[12px] py-3" data-personal-client-ref={ref} data-personal-absent="true">
                <p className="break-words text-sm font-semibold text-brand-800">{editor.title}</p>
                <p className="break-words text-sm leading-6 text-brand-800">{PERSONAL_ZIEL_WEG}</p>
              </li>
            ))}
          {schwebendSichtbar.map((intent) => (
            <li
              key={intent.id}
              className="grid w-full min-w-0 gap-2 rounded-2xl border border-line-200 bg-white px-[12px] py-3"
              data-readiness-kind="preparation"
              data-personal-client-ref={intent.clientRef}
              data-personal-phase={intent.phase}
              data-continuation-used={intent.continuationUsed ? 'true' : 'false'}
              tabIndex={-1}
              data-personal-focus={intent.fokussieren ? intent.id : undefined}
            >
              <p className="break-words text-sm font-semibold text-brand-800">{intent.title}</p>
              <Meldung intent={intent} />
              {intent.phase !== 'pending' && intent.phase !== 'awaiting' && intent.phase !== 'confirmed' ? (
                <div className="grid grid-cols-1 gap-2 sm:flex sm:flex-wrap">
                  <button type="button" className={SEKUNDAER} onFocus={() => steuerung?.interaktion()} onClick={() => { steuerung?.interaktion(); steuerung?.erneut(intent.id) }}>Erneut versuchen</button>
                  <button type="button" className={SEKUNDAER} onFocus={() => steuerung?.interaktion()} onClick={() => { steuerung?.interaktion(); steuerung?.verwerfen(intent.id) }}>{PERSONAL_VERWERFEN}</button>
                  <button type="button" className={SEKUNDAER} onFocus={() => steuerung?.interaktion()} onClick={() => { steuerung?.interaktion(); steuerung?.aktualisieren() }}>{PERSONAL_AKTUALISIEREN}</button>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}
      {onSetzen || steuerung ? (
        <form onSubmit={hinzufuegen} className="grid gap-2" data-personal-preparation-create="">
          <label className="grid gap-1 text-sm font-medium text-brand-800">
            Eigene Vorbereitung
            <input
              value={feld}
              onChange={(event) => titelAendern(event.target.value)}
              onFocus={() => steuerung?.interaktion()}
              maxLength={80}
              aria-disabled={steuerung?.barrier ? true : undefined}
              className={FELD}
              placeholder="z. B. Reiseadapter einpacken"
            />
          </label>
          <p className="break-words text-xs leading-5 text-ink-800">{SENSITIVE_HINWEIS}</p>
          <button type="submit" className={PRIMAER} aria-disabled={steuerung?.barrier ? true : undefined}>
            {erstellenLabel}
          </button>
        </form>
      ) : null}
      {steuerung?.hinweis ? (
        <p role="alert" className="break-words text-sm leading-6 text-brand-800">
          {steuerung.hinweis}
        </p>
      ) : null}
      {steuerung ? (
        <button type="button" className={SEKUNDAER} onFocus={() => steuerung.interaktion()} onClick={() => steuerung.aktualisieren()}>
          {PERSONAL_AKTUALISIEREN}
        </button>
      ) : null}
      <p className="sr-only" data-personal-barrier={steuerung?.barrier ? 'true' : 'false'} data-personal-lieferung={steuerung?.lieferung ?? 0} />
    </div>
  )
}

function Zeile({
  item,
  doppelt,
  editor,
  intent,
  loeschen,
  sperre,
  onOeffnen,
  onTitel,
  onStatus,
  onSpeichern,
  onLoeschenFragen,
  onLoeschenAbbrechen,
  onLoeschen,
  onErneut,
  onVerwerfen,
  onAktualisieren,
  onInteraktion,
}: {
  item: ReadinessViewItem
  doppelt: boolean
  editor: Editor | null
  intent: PersonalIntent | null
  loeschen: boolean
  sperre: boolean
  onOeffnen: () => void
  onTitel: (wert: string) => void
  onStatus: (status: ReadinessUserStatus) => void
  onSpeichern: () => void
  onLoeschenFragen: () => void
  onLoeschenAbbrechen: () => void
  onLoeschen: () => void
  onErneut: () => void
  onVerwerfen: () => void
  onAktualisieren: () => void
  onInteraktion: () => void
}) {
  const statusText = nutzerstandText(item.userStatus, item.currentness)
  const unterwegs = intent != null && (intent.phase === 'pending' || intent.phase === 'awaiting' || intent.phase === 'blocked')
  return (
    <li
      className="grid w-full min-w-0 grid-cols-1 gap-2 rounded-2xl border border-line-200 bg-white px-[12px] py-3"
      data-readiness-kind={item.kind}
      data-readiness-status={item.userStatus}
      data-readiness-currentness={item.currentness}
      data-personal-client-ref={item.clientRef}
      data-personal-phase={intent?.phase ?? 'ruhend'}
      data-continuation-used={intent?.continuationUsed ? 'true' : 'false'}
      tabIndex={-1}
      data-personal-focus={intent?.fokussieren ? intent.id : undefined}
    >
      <p className="break-words text-sm font-semibold text-brand-800">{item.title}</p>
      <p className="break-words text-xs leading-5 text-ink-800">{statusText}</p>
      {item.currentness === 'stale' ? (
        <p className="break-words text-xs leading-5 text-ink-800">{PERSONAL_STALE_ERKLAERUNG}</p>
      ) : null}
      {intent ? <Meldung intent={intent} /> : null}
      {editor ? (
        <div className="grid gap-2">
          <label className="grid gap-1 text-sm font-medium text-brand-800">
            Titel bearbeiten
            <input value={editor.title} onChange={(event) => onTitel(event.target.value)} onFocus={onInteraktion} maxLength={80} className={FELD} />
          </label>
          <div className="grid grid-cols-1 gap-2 sm:flex sm:flex-wrap">
            <Status aktiv={editor.status === 'open'} onClick={() => onStatus('open')} onFocus={onInteraktion} disabled={sperre}>Offen</Status>
            <Status aktiv={editor.status === 'done'} onClick={() => onStatus('done')} onFocus={onInteraktion} disabled={sperre}>Erledigt</Status>
            <Status aktiv={editor.status === 'skipped'} onClick={() => onStatus('skipped')} onFocus={onInteraktion} disabled={sperre}>Nicht relevant</Status>
          </div>
          <button type="button" className={PRIMAER} disabled={sperre || unterwegs} onFocus={onInteraktion} onClick={onSpeichern}>
            Speichern
          </button>
        </div>
      ) : (
        <button type="button" className={SEKUNDAER} onClick={onOeffnen}>
          Titel bearbeiten
        </button>
      )}
      {loeschen ? (
        <div className="grid gap-2" role="group" aria-label={entfernenFrage(item.title ?? '', doppelt, statusText)}>
          <p className="break-words text-sm leading-6 text-brand-800">{entfernenFrage(item.title ?? '', doppelt, statusText)}</p>
          <button type="button" className={PRIMAER} disabled={sperre} onFocus={onInteraktion} onClick={onLoeschen}>
            Endgültig entfernen
          </button>
          <button type="button" className={SEKUNDAER} onFocus={onInteraktion} onClick={onLoeschenAbbrechen}>
            Abbrechen
          </button>
        </div>
      ) : (
        <button type="button" className={`${SEKUNDAER} text-ink-800`} onFocus={onInteraktion} onClick={onLoeschenFragen}>
          Entfernen
        </button>
      )}
      {intent && intent.phase !== 'pending' && intent.phase !== 'awaiting' && intent.phase !== 'confirmed' ? (
        <div className="grid grid-cols-1 gap-2 sm:flex sm:flex-wrap">
          <button type="button" className={SEKUNDAER} disabled={sperre} onFocus={onInteraktion} onClick={onErneut}>
            Erneut versuchen
          </button>
          <button type="button" className={SEKUNDAER} onFocus={onInteraktion} onClick={onVerwerfen}>
            {PERSONAL_VERWERFEN}
          </button>
          <button type="button" className={SEKUNDAER} onFocus={onInteraktion} onClick={onAktualisieren}>
            {PERSONAL_AKTUALISIEREN}
          </button>
        </div>
      ) : null}
    </li>
  )
}

function Meldung({ intent }: { intent: PersonalIntent }) {
  if (!intent.meldung) return null
  return (
    <p role="status" className="break-words text-sm leading-6 text-brand-800">
      {intent.meldung}
    </p>
  )
}

function Status({
  aktiv,
  disabled,
  onClick,
  onFocus,
  children,
}: {
  aktiv: boolean
  disabled: boolean
  onClick: () => void
  onFocus: () => void
  children: React.ReactNode
}) {
  return (
    <button type="button" aria-pressed={aktiv} disabled={disabled} className={aktiv ? PRIMAER : SEKUNDAER} onClick={onClick} onFocus={onFocus}>
      {children}
    </button>
  )
}
