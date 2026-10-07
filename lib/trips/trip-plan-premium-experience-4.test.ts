import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

import {
  PLAN_TAG_DESKTOP_AB_PX,
  PLAN_TAG_SPALTEN_DESKTOP,
  PLAN_TAG_SPALTEN_TABLET,
  PLAN_TAG_TABLET_AB_PX,
  planTagNavigator,
  planTagSpalten,
  planTageFolgen,
  tagStreifenZiel,
  tagUnterKanteZiel,
  tagVertikalZiel,
  type PlanTagRef,
} from '@/lib/trips/trip-plan-premium-experience-4'

function tage(anzahl: number): PlanTagRef[] {
  return Array.from({ length: anzahl }, (_, index) => ({
    id: `day-${index + 1}`,
    dayIndex: index + 1,
  }))
}

test('lange Reisen bleiben ein Navigator oder ein begrenztes Raster', () => {
  assert.equal(PLAN_TAG_TABLET_AB_PX, 768)
  assert.equal(PLAN_TAG_DESKTOP_AB_PX, 1024)
  assert.equal(planTagSpalten(360), 'navigator')
  assert.equal(planTagSpalten(390), 'navigator')
  assert.equal(planTagSpalten(PLAN_TAG_TABLET_AB_PX - 1), 'navigator')
  assert.equal(planTagSpalten(PLAN_TAG_TABLET_AB_PX), PLAN_TAG_SPALTEN_TABLET)
  assert.equal(planTagSpalten(PLAN_TAG_DESKTOP_AB_PX - 1), PLAN_TAG_SPALTEN_TABLET)
  assert.equal(planTagSpalten(PLAN_TAG_DESKTOP_AB_PX), PLAN_TAG_SPALTEN_DESKTOP)
  assert.equal(planTagSpalten(1440), PLAN_TAG_SPALTEN_DESKTOP)
  assert.equal(planTagSpalten(1920), PLAN_TAG_SPALTEN_DESKTOP)
  assert.equal(planTagSpalten(2560), PLAN_TAG_SPALTEN_DESKTOP)
  assert.equal(PLAN_TAG_SPALTEN_DESKTOP <= 7, true)
})

test('Tag X von Y folgt der Timeline und erfindet keinen Sprung', () => {
  for (const anzahl of [1, 7, 14, 21, 30, 32]) {
    const liste = tage(anzahl)
    const mitte = Math.floor((anzahl - 1) / 2)
    const navigator = planTagNavigator(liste, liste[mitte].id)
    assert.equal(navigator?.gesamt, anzahl)
    assert.equal(navigator?.index, mitte + 1)
    assert.equal(navigator?.text, `Tag ${mitte + 1} von ${anzahl}`)
  }

  const reise = tage(21)
  assert.equal(planTagNavigator(reise, 'day-1')?.vorherId, null)
  assert.equal(planTagNavigator(reise, 'day-1')?.naechsterId, 'day-2')
  assert.equal(planTagNavigator(reise, 'day-11')?.vorherId, 'day-10')
  assert.equal(planTagNavigator(reise, 'day-11')?.naechsterId, 'day-12')
  assert.equal(planTagNavigator(reise, 'day-21')?.vorherId, 'day-20')
  assert.equal(planTagNavigator(reise, 'day-21')?.naechsterId, null)
  assert.equal(planTagNavigator(reise, 'fehlt'), null)
  assert.equal(planTagNavigator([], 'day-1'), null)
})

test('mehrere Etappen behalten die abgeleitete Reihenfolge', () => {
  const folge = planTageFolgen([
    { tage: tage(14).slice(0, 7) },
    {
      tage: [
        { id: 'day-8', dayIndex: 8 },
        { id: 'day-21', dayIndex: 21 },
      ],
    },
  ])
  assert.deepEqual(
    folge.map((tag) => tag.id),
    ['day-1', 'day-2', 'day-3', 'day-4', 'day-5', 'day-6', 'day-7', 'day-8', 'day-21'],
  )
  assert.equal(planTagNavigator(folge, 'day-8')?.text, 'Tag 8 von 9')
  assert.equal(planTagNavigator(folge, 'day-8')?.naechsterId, 'day-21')
})

test('der gewählte Tag bleibt im Streifen, ohne die Seite zu schieben', () => {
  assert.equal(
    tagStreifenZiel({
      scrollLeft: 0,
      clientWidth: 320,
      scrollWidth: 480,
      buttonOffset: 20,
      buttonWidth: 72,
    }),
    null,
  )

  const ziel = tagStreifenZiel({
    scrollLeft: 0,
    clientWidth: 280,
    scrollWidth: 1400,
    buttonOffset: 1100,
    buttonWidth: 72,
  })
  assert.equal(ziel, 996)
  assert.ok((ziel ?? 0) + 72 <= 1400)

  assert.equal(
    tagStreifenZiel({
      scrollLeft: 40,
      clientWidth: 200,
      scrollWidth: 200,
      buttonOffset: 0,
      buttonWidth: 72,
    }),
    0,
  )
})

test('der gewählte Tag rutscht unter der klebenden Kante frei', () => {
  assert.equal(
    tagVertikalZiel({ top: 120, bottom: 164, kante: 88, viewportHeight: 800 }),
    null,
  )
  assert.equal(tagVertikalZiel({ top: 40, bottom: 84, kante: 88, viewportHeight: 800 }), 40 - 96)
  assert.equal(tagVertikalZiel({ top: 760, bottom: 820, kante: 88, viewportHeight: 800 }), 28)
  assert.equal(tagVertikalZiel({ top: 20, bottom: 900, kante: 88, viewportHeight: 800 }), 20 - 96)
  assert.equal(tagUnterKanteZiel({ top: 40, bottom: 84, kante: 88, viewportHeight: 800 }), 40 - 96)
  assert.equal(tagUnterKanteZiel({ top: 760, bottom: 820, kante: 88, viewportHeight: 800 }), null)
  assert.equal(tagUnterKanteZiel({ top: 120, bottom: 164, kante: 88, viewportHeight: 800 }), null)
})

test('der Reiseplan bleibt Darstellung und behält die bestehenden Verträge', () => {
  const plan = readFileSync('components/trips/TripWorkspacePlan.tsx', 'utf8')
  assert.match(plan, /timelineAbleiten\(reise, ohneTag, aktiverTag\)/)
  assert.match(plan, /ersterTagDerEtappe/)
  assert.match(plan, /onTagWechseln\(eintrag\.id\)/)
  assert.match(plan, /onTagWechseln\(navigator\.vorherId\)/)
  assert.match(plan, /onTagWechseln\(navigator\.naechsterId\)/)
  assert.match(plan, /<PlanpunktEditor/)
  assert.match(readFileSync('components/trips/PlanpunktEditor.tsx', 'utf8'), /planpunktFormularSchema/)
  assert.match(plan, /Punkt hinzufügen/)
  assert.match(plan, /aria-current=\{gewaehlt \? 'date' : undefined\}/)
  assert.match(plan, /data-timeline-tag=\{eintrag\.id\}/)
  assert.match(plan, /data-timeline-etappe=/)
  assert.match(plan, /data-tagesplan-modul="ein"/)
  assert.match(plan, /data-plan-premium="4"/)
  assert.match(plan, /data-plan-navigator="schritt"/)
  assert.match(plan, /data-plan-tag-datum/)
  assert.match(plan, /whitespace-nowrap text-sm font-semibold text-brand-800/)
  assert.match(plan, /w-max shrink-0 snap-start/)
  assert.match(plan, /data-plan-tag-streifen/)
  assert.match(plan, /data-plan-raster/)
  assert.match(plan, /data-plan-tag-kontext/)
  assert.match(plan, /data-plan-leer/)
  assert.match(plan, /data-plan-timeline/)
  assert.match(plan, /data-plan-zeit/)
  assert.match(plan, /md:hidden/)
  assert.match(plan, /hidden md:grid md:grid-cols-4 lg:grid-cols-7/)
  assert.match(plan, /Vorheriger Tag/)
  assert.match(plan, /Nächster Tag/)
  assert.match(plan, /min-h-11 min-w-11/)
  assert.match(plan, /text-base/)
  assert.match(plan, /zum Auswahlzeitpunkt/)
  assert.match(plan, /motion-reduce:transition-none/)
  assert.match(plan, /tagStreifenZiel/)
  assert.match(plan, /tagUnterKanteZiel/)
  assert.equal(plan.includes('.sort('), false)
  assert.equal(plan.includes('fetch('), false)
  assert.equal(plan.includes('Dieser Tag gehört dir.'), false)
  assert.equal(plan.includes('grid-cols-8'), false)
  assert.equal(plan.includes('pointer-fine:text-sm'), false)
})
