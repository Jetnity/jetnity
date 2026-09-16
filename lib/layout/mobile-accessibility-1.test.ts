import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { describe, test } from 'node:test'
import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'

const hier = dirname(fileURLToPath(import.meta.url))

function quelle(relativ: string) {
  return readFileSync(join(hier, relativ), 'utf8')
}

describe('Mobile Accessibility 1 – Skip-Link und Inhaltsziel', () => {
  test('Skip-Link fokussiert das Ziel und respektiert Reduced Motion', () => {
    const skip = quelle('../../components/layout/SkipToContentLink.tsx')
    assert.match(skip, /scrollVerhalten/)
    assert.match(skip, /ziel\.focus/)
    assert.match(skip, /preventDefault/)
    assert.match(skip, /focus-visible:min-h-11/)
  })

  test('oeffentliche, Account- und Admin-Inhalte sind fokussierbar', () => {
    const publicLayout = quelle('../../app/(public)/layout.tsx')
    const accountLayout = quelle('../../app/account/layout.tsx')
    const adminLayout = quelle('../../app/(admin)/admin/layout.tsx')
    assert.match(publicLayout, /id="public-content"/)
    assert.match(publicLayout, /tabIndex=\{-1\}/)
    assert.match(accountLayout, /id="account-content"/)
    assert.match(accountLayout, /tabIndex=\{-1\}/)
    assert.match(adminLayout, /id="admin-content"/)
    assert.match(adminLayout, /tabIndex=\{-1\}/)
  })
})

describe('Mobile Accessibility 1 – oeffentliche Leiste', () => {
  const navbar = quelle('../../components/layout/PublicNavbar.tsx')

  test('Mobile-Menue ist ein Disclosure mit Escape und Fokusrueckgabe', () => {
    assert.match(navbar, /aria-controls=\{MOBILE_NAV_ID\}/)
    assert.match(navbar, /aria-expanded=\{mobileOpen\}/)
    assert.match(navbar, /hidden=\{!mobileOpen\}/)
    assert.match(navbar, /inert=\{!mobileOpen\}/)
    assert.match(navbar, /key !== 'Escape'/)
    assert.match(navbar, /menuKnopf\.current\?\.focus/)
    assert.match(navbar, /<X className="h-5 w-5" aria-hidden="true" \/>/)
    assert.match(navbar, /<Menu className="h-5 w-5" aria-hidden="true" \/>/)
  })

  test('kritische Mobile-Ziele bleiben mindestens 44 px und sichtbar fokussierbar', () => {
    assert.match(navbar, /inline-flex min-h-11 items-center rounded-2xl/)
    assert.match(navbar, /grid grid-cols-1 gap-2/)
    assert.equal(navbar.includes('grid-cols-2'), false)
    assert.match(navbar, /FOKUS_RING/)
    assert.match(navbar, /focus-visible:ring-4/)
  })
})

describe('Mobile Accessibility 1 – Footer, Nach oben, Formulare', () => {
  test('Footer-Links nutzen die 44-px-Trefferhoehe', () => {
    const footer = quelle('../../components/layout/Footer.tsx')
    const sitzung = quelle('../../components/layout/FooterSitzung.tsx')
    assert.match(footer, /min-h-11/)
    assert.equal(footer.includes('min-h-10'), false)
    assert.match(sitzung, /min-h-11/)
    assert.equal(sitzung.includes('min-h-10'), false)
    assert.match(footer, /aria-hidden="true"/)
  })

  test('Nach-oben respektiert Reduced Motion und zeigt Fokus', () => {
    const knopf = quelle('../../components/layout/BackToTop.tsx')
    assert.match(knopf, /type="button"/)
    assert.match(knopf, /scrollVerhalten/)
    assert.match(knopf, /focus-visible:ring-4/)
    assert.match(knopf, /aria-hidden="true"/)
  })

  test('Planen-Kernaktionen bleiben Tastatur-sichtbar', () => {
    const planner = quelle('../../components/trips/TripPlanner.tsx')
    const idee = quelle('../../components/trips/Reiseidee.tsx')
    const start = quelle('../../components/places/StartzielForm.tsx')
    assert.match(planner, /focus-visible:ring-4 focus-visible:ring-brand-600\/15/)
    assert.match(planner, /<ArrowRight className="h-4 w-4" aria-hidden="true" \/>/)
    assert.match(idee, /focus-visible:ring-4 focus-visible:ring-brand-600\/15/)
    assert.match(start, /aria-hidden="true"/)
  })
})
