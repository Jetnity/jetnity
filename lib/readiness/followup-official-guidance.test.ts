import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { test } from 'node:test'
import FollowupOfficialGuidance from '@/components/readiness/FollowupOfficialGuidance'

test('IT FR ES PT present exact government portal links without asserting unapproved visa facts',()=>{
 const sources={
  IT:'https://www.esteri.it/it/ministero/sportello_info/domandefrequenti/sezione_visti_entrare_in_italia/',
  FR:'https://france-visas.gouv.fr/en/faq',
  ES:'https://www.interior.gob.es/opencms/es/servicios-al-ciudadano/tramites-y-gestiones/extranjeria/regimen-general/entrada-requisitos-y-condiciones/',
  PT:'https://www.gov.pt/servicos/pedir-um-visto-schengen-de-curta-duracao',
 }
 for(const [country,href] of Object.entries(sources)){
  const html=renderToStaticMarkup(React.createElement(FollowupOfficialGuidance,{country}))
  assert.match(html,new RegExp('data-entry-next-four-country="'+country+'"'))
  assert.match(html,/data-official-status="RESEARCH_ONLY"/)
  assert.ok(html.includes(href.replaceAll('&','&amp;')))
  assert.match(html,/Derzeit nicht verfügbar/)
  assert.match(html,/Fake- und Drittanbieterseiten/)
  assert.match(html,/Passgültigkeit, ETA, Impfungen/)
  assert.doesNotMatch(html,/data-official-status="accepted"/)
 }
 const fr=renderToStaticMarkup(React.createElement(FollowupOfficialGuidance,{country:'FR'}))
 assert.match(fr,/data-official-form-source="FR"/)
 assert.match(fr,/france-visas.gouv.fr\/demande-de-visa/)
 assert.match(fr,/Kosten: Kurzaufenthaltsvisum normalerweise 90/)
 const pt=renderToStaticMarkup(React.createElement(FollowupOfficialGuidance,{country:'PT'}))
 assert.match(pt,/data-official-form-source="PT"/)
 assert.match(pt,/Kosten: Derzeit nicht verfügbar/)
 assert.equal(renderToStaticMarkup(React.createElement(FollowupOfficialGuidance,{country:'CH'})),'')
 const page=readFileSync(new URL('../../components/readiness/EinreiseLaenderpruefer.tsx',import.meta.url),'utf8')
 assert.match(page,/FollowupOfficialGuidance country={sicht.zielCode}/)
})
