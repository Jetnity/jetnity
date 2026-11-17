// Separate Austria-only Dev selection; never reuses a CH→DE Owner receipt.
import 'server-only'
import { readHumanRelease, HUMAN_METHOD_DEV_URL, type HumanRelease } from
  '../official-truth-product-v3/method/human-contract'
import { selectedV3PgTarget } from '../official-truth-product-v3/transport/node-postgres-selection'
import { AT_V3_METHOD_PREPARATION } from './at-v3-method-preparation'

// Only the completed audited AT-HRS2/BG1 transition may lift these code-owned
// integration gates. Draft HRS2 is not a reason to solicit Owner/AAL2.
function atNativeMethodReady(): boolean {
  return AT_V3_METHOD_PREPARATION.nativeHrsQualified
    && AT_V3_METHOD_PREPARATION.backgroundGuardBound
}
const fixedId = 'hmr1_7b99e62adbb78c89b4e45e8772c1fc09'

export function getAtHumanRelease(): HumanRelease | null {
  const target = selectedV3PgTarget()
  if (!target || target.connectHost !== 'db.yfvbxvijcorffwxbxahl.supabase.co'
    || !atNativeMethodReady()) return null
  const method = AT_V3_METHOD_PREPARATION
  return readHumanRelease({
    schema: 1, selectionId: fixedId, targetUrl: HUMAN_METHOD_DEV_URL,
    methodId: method.binding.methodId, revision: method.binding.revision,
    methodDigest: method.binding.methodDigest, packageDigest: method.binding.packageDigest,
    predecessorRevision: null, expectedHead: null,
    approval: { mode: 'until_revoked', until: null },
    packageVersion: 'BMI 06.11.2026 · AT 50 Pässe · Visum Rev. 1',
    packageHref: 'https://github.com/Jetnity/jetnity/blob/9c778f995f027b701c06154360716a4a351556de/lib/readiness/official-truth-at-method-v1/at-v3-method-preparation.ts',
    scope: { citizenship: 'PRIORITY_50', destination: 'AT', requirement: 'visa',
      document: 'national_passport', route: 'direct_entry', conditions: 'verified_context_only',
      activeFrom: '2026-11-16T00:00:00.000Z',
      activeUntilExclusive: '2027-11-16T00:00:00.000Z',
      reviewedScope: 'Die Methode gilt für 50 einzeln geprüfte Staatsangehörigkeiten und deren gewöhnliche nationale Reisepässe bei direkter Einreise nach Österreich. Jede positive Aussage benötigt weiterhin eine eigene amtliche Quellenprüfung, dokumentgenaue Qualifikation, einen aktuellen Methodennachweis und den gültigen BG1-Schutz. Transit, Visumbedingungen, Aufenthaltsrecht und andere Themen sind ohne separate Prüfung nicht verfügbar.',
    },
  })
}
