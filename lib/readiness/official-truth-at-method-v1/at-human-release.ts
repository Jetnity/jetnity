// Separate Austria-only Dev selection; never reuses a CH→DE Owner receipt.
import 'server-only'
import { readHumanRelease, HUMAN_METHOD_DEV_URL, HUMAN_METHOD_PRODUCTION_URL, type HumanRelease } from
  '../official-truth-product-v3/method/human-contract'
import { selectedAustriaDev } from './at-dev-selection'
import { selectedAustriaProductionMethodV2 } from './at-production-selection'
import { AT_V3_METHOD_PREPARATION } from './at-v3-method-preparation'
import { AT_CH_METHOD_V2_CANDIDATE } from './at-ch-v2-method-candidate'

// The actual Dev HRS2 migration, full original proof and BG1 successor all
// passed native rollback and next-generation full BG1 readback; production and
// customer facts remain untouched. Only this exact Preview may expose the
// Owner/AAL2 stage/approve controls. SQL independently checks fresh BG1/MA1.
function atNativeMethodReady(): boolean {
  return AT_V3_METHOD_PREPARATION.nativeHrsQualified
    && AT_V3_METHOD_PREPARATION.backgroundGuardBound
}
const fixedId = 'hmr1_7b99e62adbb78c89b4e45e8772c1fc09'
// Distinct from every Dev, AT50 and CH→DE method journal.
const productionV2Id = 'hmr1_feb439d56d8a60334d0151683f46114b'

export function getAtHumanRelease(): HumanRelease | null {
  // Production never falls through to the legacy AT50 revision-1 Owner selection.
  // The separate Rev2 flag is armed only for the verified project/main/Prod
  // Supabase target. MA1, BG1, sources and fresh Owner/AAL2 remain server-side.
  if (selectedAustriaProductionMethodV2()) {
    const next = AT_CH_METHOD_V2_CANDIDATE
    if (next.status !== 'DRAFT_NOT_STAGED' || next.method.status !== 'NOT_APPROVED'
      || next.binding.methodId !== 'jetnity-destination-primary-at-visa'
      || next.binding.revision !== 2
      || next.binding.methodDigest !== 'fe161a865c50d26be4a41c1b122fcd14efb3b39bc9100fd66b13304dfca07a4e'
      || next.binding.packageDigest !== '6584d20adcc08e94edc4a74cad6c780b6db9c7ce89fff8e89afb0d23380e27a0') return null
    return readHumanRelease({
      schema: 1, selectionId: productionV2Id,
      targetUrl: HUMAN_METHOD_PRODUCTION_URL,
      methodId: next.binding.methodId, revision: next.binding.revision,
      methodDigest: next.binding.methodDigest, packageDigest: next.binding.packageDigest,
      predecessorRevision: 1,
      // Exact installed Rev1 predecessor, never inferred from the new package.
      // A changed head/epoch is refused by MA1, not silently upgraded.
      expectedHead: {
        methodId: 'jetnity-destination-primary-at-visa', revision: 1,
        methodDigest: 'cd9b8584d08cc3bfb83f0f1a7095c1c6e011c8d25336f8767ec6678ec8bbc9e9',
        packageDigest: '55e574d7c70c20513a4ac05273c43cdd87dd854e0b403ce0c9a5ab168220ebfe',
        epoch: 1, status: 'approved', approvalMode: 'until_revoked', approvalUntil: null,
      },
      approval: { mode: 'until_revoked', until: null },
      packageVersion: 'BMI 06.11.2026 / BMEIA neue Fassung · CH→AT Visum Rev. 2',
      packageHref: 'https://github.com/Jetnity/jetnity/blob/a7d7b0ba833c4421c7f7b353566762e0472f3638/lib/readiness/official-truth-at-method-v1/at-ch-v2-method-candidate.ts',
      scope: {
        citizenship: 'CH', destination: 'AT', requirement: 'visa',
        document: 'swiss_passport', route: 'direct_entry', conditions: 'verified_context_only',
        activeFrom: '2026-11-22T00:00:00.000Z',
        activeUntilExclusive: '2027-11-22T00:00:00.000Z',
        reviewedScope: 'Nur Schweizer Staatsangehörige mit gültigem gewöhnlichen Schweizer Reisepass und direkter Einreise nach Österreich: Visumfreiheit. Zwei BMI-Originale unverändert; BMEIA-Bern-Version mit fachlich als regelneutral genehmigter Änderung, technisch weiterhin changed. Keine Freigabe der übrigen 49 Pässe, von Transit, Impfungen, Formularen, Gebühren, Reisedokument-Sonderfällen oder anderer Themen. Vor jeder Kundenantwort gelten tatsächliches aktuelles Quellen-/Methoden-Seal, BG1 und Frische- sowie Isolationsprüfungen.',
      },
    })
  }
  const dev = selectedAustriaDev()
  if (!dev || !atNativeMethodReady()) return null
  const method = AT_V3_METHOD_PREPARATION
  return readHumanRelease({
    schema: 1, selectionId: fixedId,
    targetUrl: HUMAN_METHOD_DEV_URL,
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
