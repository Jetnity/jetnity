'use client'

import type { RefObject } from 'react'
import { ArrowLeft } from 'lucide-react'

import { ARBEITSBEREICH_BEZEICHNUNG } from '@/lib/trips/arbeitsbereich'
import { Preis } from '@/components/ui/preis'
import { LeistungsStatus, PreisstandHinweis } from '@/components/trips/LeistungsStatus'
import { ART_BEZEICHNUNG } from '@/lib/trips/bezeichnungen'
import {
  DETAIL_LAGE_TEXT,
  DETAIL_SUCHE_BEZEICHNUNG,
  gapEyebrowText,
  gapNebenzeile,
  type GapDetailAbleitung,
  type ItemDetailAbleitung,
  type WorkspaceDetailAuswahl,
  type WorkspaceRueckkehr,
} from '@/lib/trips/detail'
import { ORGANISIEREN_FLAECHE_KLASSE, ORGANISIEREN_RUECKKEHR_KLASSE, detailStatusfolge } from '@/lib/trips/organize-premium-experience-6'
import { cn } from '@/lib/utils'

export default function TripWorkspaceDetail({
  auswahl,
  gap,
  item,
  kompakt,
  rueckkehr,
  onSuche,
  fokusRef,
}: {
  auswahl: WorkspaceDetailAuswahl
  gap: GapDetailAbleitung | null
  item: ItemDetailAbleitung | null
  kompakt: boolean
  rueckkehr: WorkspaceRueckkehr
  onSuche: (vonTastatur?: boolean) => void
  fokusRef: RefObject<HTMLButtonElement | null>
}) {
  const offen = auswahl.art !== 'keine'
  const sucheOffen = offen && auswahl.sucheOffen
  const sucheAnbietbar = gap?.sucheAnbietbar || item?.sucheAnbietbar
  const sucheDomain = gap?.domain ?? item?.domain
  const titel =
    auswahl.art === 'item'
      ? (item?.title ?? 'Punkt')
      : gap
        ? ARBEITSBEREICH_BEZEICHNUNG[gap.domain]
        : 'Detail'
  const folge = gap
    ? detailStatusfolge({
        eyebrow: gapEyebrowText(gap),
        text: gap.text,
        nebenzeile: gapNebenzeile(gap),
        naechsterSchritt: gap.naechsterSchritt,
        lageInDerLeiste: kompakt ? null : DETAIL_LAGE_TEXT[gap.lage],
      })
    : null
  const eyebrow = item ? ART_BEZEICHNUNG[item.kind] : folge?.eyebrow
  const mobilitaetKopf = auswahl.art !== 'item' && gap?.domain === 'mobilitaet'

  return (
    <section
      aria-label="Reisedetail"
      data-workspace-detail={auswahl.art}
      data-detail-domain={gap?.domain ?? item?.domain ?? undefined}
      data-detail-item={item?.itemId}
      data-detail-suche={sucheOffen ? 'ein' : 'aus'}
      data-gap-lage={gap?.lage}
      data-gap-pflicht={gap ? (gap.istPflichtLuecke ? 'ja' : 'nein') : undefined}
      data-item-kind={item?.kind}
      data-item-ungeplant={item ? (item.ungeplant ? 'ja' : 'nein') : undefined}
      data-organisieren-flaeche="status"
      className={cn(ORGANISIEREN_FLAECHE_KLASSE, 'mt-4')}
    >
      <div className="flex min-w-0 items-start justify-between gap-3">
        <div className="min-w-0">
          {eyebrow ? (
            <p className="text-kicker uppercase text-brand-600">{eyebrow}</p>
          ) : null}
          <h2
            className={cn(
              'text-title text-brand-800 break-words hyphens-auto',
              eyebrow && 'mt-1',
            )}
          >
            {titel}
          </h2>
        </div>
        {!kompakt ? (
          <button ref={fokusRef} type="button" onClick={rueckkehr.ausfuehren} className={ORGANISIEREN_RUECKKEHR_KLASSE}>
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            {rueckkehr.label}
          </button>
        ) : null}
      </div>

      {mobilitaetKopf ? <details className="mt-1 text-sm text-ink-800"><summary className="min-h-11 cursor-pointer py-3 font-medium">Stand deiner Verbindungen</summary><div className="grid gap-2 pb-2">{folge?.zustand ? <p>{folge.zustand}</p> : null}{folge?.hinweis ? <p>{folge.hinweis}</p> : null}</div></details> : null}

      {!mobilitaetKopf && folge && (folge.zustand || folge.hinweis) ? (
        <div className="mt-3 grid min-w-0 gap-2" data-organisieren-zustand>
          {folge.zustand ? <p className="text-sm leading-6 text-ink-800 break-words hyphens-auto">{folge.zustand}</p> : null}
          {folge.hinweis ? <p className="text-xs leading-5 text-ink-700">{folge.hinweis}</p> : null}
        </div>
      ) : null}

      {item ? (
        <div className="mt-3 grid min-w-0 gap-2" data-organisieren-zustand>
          {item.stand || item.wann ? (
            <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-2">
              {item.stand ? (
                <LeistungsStatus stand={item.stand === 'gebucht' ? 'vom_nutzer_markiert' : 'unverbindliches_angebot'} />
              ) : null}
              {item.wann ? <p className="text-meta text-ink-800">{item.wann}</p> : null}
            </div>
          ) : null}
          {item.ungeplant ? (
            <p className="text-sm leading-6 text-ink-800">Noch nicht eingeplant. Es wird kein Tag oder keine Etappe erfunden.</p>
          ) : null}
        </div>
      ) : null}

      {(!mobilitaetKopf && folge?.naechstes) || (sucheAnbietbar && sucheDomain && !sucheOffen) ? (
        <div className="mt-4 grid min-w-0 gap-3" data-organisieren-aktion>
          {folge?.naechstes ? (
            <p className="text-sm leading-6 text-ink-800 break-words hyphens-auto">{folge.naechstes}</p>
          ) : null}
          {sucheAnbietbar && sucheDomain && !sucheOffen ? (
            <button
              type="button"
              onClick={(ereignis) => onSuche(ereignis.detail === 0)}
              className={cn(
                'inline-flex min-h-11 w-full items-center justify-center rounded-full px-4 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/15 sm:w-auto sm:justify-self-start',
                item
                  ? 'border border-line-300 text-brand-800 hover:bg-surface-50'
                  : 'bg-brand-800 text-white hover:bg-brand-900',
              )}
            >
              {DETAIL_SUCHE_BEZEICHNUNG[sucheDomain]}
            </button>
          ) : null}
        </div>
      ) : null}

      {item ? (
        <div className="mt-4 grid min-w-0 gap-2" data-organisieren-bestand>
          {item.note ? <p className="text-sm leading-6 text-ink-800 break-words hyphens-auto">{item.note}</p> : null}
          {item.preis.art === 'preis' ? (
            <p className="flex min-w-0 flex-wrap items-baseline gap-x-2">
              <Preis betrag={item.preis.betrag} waehrung={item.preis.waehrung} className="text-subtitle text-brand-800" />
              <span className="text-meta text-ink-700">Gespeicherter Betrag</span>
            </p>
          ) : item.stand ? (
            <p className="text-meta text-ink-700">
              {item.preis.art === 'ungueltig' ? 'Gespeicherter Preis nicht lesbar' : 'Ohne gespeicherten Preis'}
            </p>
          ) : null}
          {item.stand && <PreisstandHinweis />}
          <p className="text-meta text-ink-700 break-words hyphens-auto">{item.trustText}</p>
          {item.buchungsHinweis ? (
            <p className="text-meta text-ink-700 break-words hyphens-auto">{item.buchungsHinweis}</p>
          ) : null}
        </div>
      ) : null}
    </section>
  )
}
