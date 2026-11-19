import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { test } from 'node:test'
import AtOfficialGuidance from '@/components/readiness/AtOfficialGuidance'

test('Austria official links show each direct form, cost and fake-site warning without inventing mandatory rules',()=>{
 const html=renderToStaticMarkup(React.createElement(AtOfficialGuidance))
 assert.match(html,/data-at-guidance="research-only"/)
 assert.equal((html.match(/data-at-info-topic=/g)??[]).length,12)
 assert.equal((html.match(/data-at-official-form=/g)??[]).length,2)
 assert.match(html,/Antragsformular_Visum_C1_Schengenvisum_DE-ES\.pdf/)
 assert.match(html,/FormServlet\?fid=7306/)
 assert.match(html,/Kosten: Formular kostenlos/)
 assert.match(html,/Kosten: Formularkosten in der amtlichen Quelle nicht beziffert/)
 assert.equal((html.match(/Achtung vor inoffiziellen oder kostenpflichtigen Vermittlerseiten/g)??[]).length,2)
 assert.match(html,/ETIAS.*noch nicht in Betrieb/)
 assert.match(html,/derzeit nicht verfügbar/)
 assert.match(html,/Österreichisches Sozialministerium/)
 assert.doesNotMatch(html,/\bETIAS-Antrag stellen\b/)
 const page=readFileSync(new URL('../../components/readiness/EinreiseLaenderpruefer.tsx',import.meta.url),'utf8')
 assert.match(page,/sicht\.zielCode === 'AT' \? <AtOfficialGuidance citizenshipCodes=\{sicht\.anzeige\.paare\.map/)
})

test('BMI-group guidance is per answered passport, source-only and never a positive personal visa fact',()=>{
 const html=renderToStaticMarkup(React.createElement(AtOfficialGuidance,{citizenshipCodes:['DE','IN','UA','AQ','DE']}))
 assert.equal((html.match(/data-at-bmi-passport=/g)??[]).length,3)
 assert.match(html,/data-at-bmi-source-group="F"/)
 assert.match(html,/data-at-bmi-source-group="V"/)
 assert.match(html,/data-at-bmi-source-group="E"/)
 assert.equal((html.match(/data-at-personal-visa-accepted="false"/g)??[]).length,3)
 assert.match(html,/biometrischen Reisepass/)
 assert.match(html,/keine persönliche Einreise- oder Visumfreigabe/)
 assert.match(html,/derzeit nicht verfügbar/)
 assert.doesNotMatch(html,/data-at-bmi-passport="AQ"/)
})
