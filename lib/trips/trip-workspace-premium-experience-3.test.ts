import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

import { modusScrollerZiel } from '@/lib/trips/trip-workspace-premium-experience-3'

function quelle(pfad: string) {
  return readFileSync(pfad, 'utf8')
}

test('der gewählte Modus bleibt in der Leiste, ohne die Seite zu schieben', () => {
  assert.equal(
    modusScrollerZiel({
      scrollLeft: 0,
      clientWidth: 320,
      scrollWidth: 480,
      buttonOffset: 20,
      buttonWidth: 90,
    }),
    null,
  )

  const ziel = modusScrollerZiel({
    scrollLeft: 0,
    clientWidth: 280,
    scrollWidth: 520,
    buttonOffset: 390,
    buttonWidth: 120,
  })
  assert.equal(ziel, 240)
  assert.ok((ziel ?? 0) + 120 <= 520)

  assert.equal(
    modusScrollerZiel({
      scrollLeft: 0,
      clientWidth: 200,
      scrollWidth: 200,
      buttonOffset: 8,
      buttonWidth: 80,
    }),
    null,
  )
  assert.equal(
    modusScrollerZiel({
      scrollLeft: 40,
      clientWidth: 200,
      scrollWidth: 200,
      buttonOffset: 0,
      buttonWidth: 80,
    }),
    0,
  )
})

test('die Modusleiste bleibt ein Segment mit den vier Bezeichnungen', () => {
  const nav = quelle('components/trips/TripWorkspaceModeNavigation.tsx')
  assert.match(nav, /WORKSPACE_ANSICHTEN\.map/)
  assert.match(nav, /WORKSPACE_ANSICHT_LABEL\[modus\]/)
  assert.match(nav, /aria-current=\{aktiv \? 'page' : undefined\}/)
  assert.match(nav, /data-workspace-mode-scroller/)
  assert.match(nav, /overflow-x-auto/)
  assert.match(nav, /whitespace-nowrap/)
  assert.match(nav, /grid-cols-2/)
  assert.match(nav, /sm:flex/)
  assert.match(nav, /min-h-11/)
  assert.match(nav, /modusScrollerZiel/)
  assert.equal(nav.includes('overflow-x-hidden'), false)
  assert.equal(nav.includes('ansicht=plan'), false)
})

test('Reise ändern und Reisebegleiter bleiben zwei getrennte, faule Auslöser', () => {
  const uebersicht = quelle('components/trips/TripWorkspaceUebersicht.tsx')
  const workspace = quelle('components/trips/TripWorkspace.tsx')
  assert.match(uebersicht, /Zeitraum, Ziele oder Reisewünsche/)
  assert.match(uebersicht, /ändert nichts/)
  assert.match(uebersicht, /aria-controls="reise-aenderung"/)
  assert.match(uebersicht, /aria-controls="reisebegleiter"/)
  assert.match(uebersicht, /aria-expanded=\{aenderungOffen\}/)
  assert.match(uebersicht, /aria-expanded=\{begleiterOffen\}/)
  assert.match(uebersicht, /begleiterVorhanden \?/)
  assert.match(uebersicht, /Deine Reise auf einen Blick/)
  assert.equal(uebersicht.includes('TEMPO_BEZEICHNUNG'), false)
  assert.equal(uebersicht.includes('%'), false)
  assert.match(workspace, /const \[begleiterBereit, setBegleiterBereit\] = React\.useState\(false\)/)
  assert.match(workspace, /name="flugsuche"[\s\S]*!sucheSichtbar/)
  assert.equal(workspace.includes('router.push'), false)
})

test('Kopf, Warteschlange und Bereiche erfinden keinen Status', () => {
  const kopf = quelle('components/trips/TripWorkspaceKopf.tsx')
  const wichtig = quelle('components/trips/TripWorkspaceJetztWichtig.tsx')
  const bereiche = quelle('components/trips/TripWorkspaceUebersicht.tsx')
  const ziele = quelle('components/trips/TripWorkspaceDestinationEssentials.tsx')
  assert.match(kopf, /label="Budget"/)
  assert.match(kopf, /Noch offen/)
  assert.match(kopf, /data-workspace-identity/)
  assert.match(wichtig, /Jetzt wichtig/)
  assert.match(wichtig, /Was jetzt Aufmerksamkeit braucht/)
  assert.match(wichtig, /weitere Hinweisgruppen/)
  assert.equal(wichtig.includes('text-red'), false)
  assert.equal(wichtig.includes('bg-red'), false)
  assert.match(bereiche, /data-workspace-trip-parts/)
  assert.match(bereiche, /Bereiche dieser Reise/)
  assert.match(ziele, /data-destination-essentials-dichte=\{kompaktLeer \? 'kompakt' : 'voll'\}/)
  assert.match(ziele, /für Einreise, Sicherheit und Reisezeit/)
  assert.equal(ziele.includes('amtlich bestätigt'), false)
})
