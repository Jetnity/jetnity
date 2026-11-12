import 'server-only'

// Closed research task data. Run 0 is unarmed; only Root may select one reviewed CI run.
// No environment/caller override, setter, registry admission or product-window change.
export const AA_REVISION_PROBE_V1_POLICY = Object.freeze({
  runNumber: 4120 as number,
  baseSha: 'dfd692440762b50183fdebbfd6bf8dabde4662d0',
  repository: 'Jetnity/jetnity',
  repositoryId: 1020187087,
  workflowName: 'CI',
  workflowPath: '.github/workflows/ci.yml',
  job: 'verify',
  headBranch: 'feat/official-truth-aa-revision-probe-1-20261112',
  baseBranch: 'main',
  url: 'https://www.auswaertiges-amt.de/de/service/visa-und-aufenthalt/staatenliste-zur-visumpflicht-207820',
  maxBytes: 131_072,
  timeoutMs: 10_000,
  expectedV2Pin: 'fc34bb51f8493a8776b6a300c8aed493a4a4fe08fba269148292ed7d9a334979',
  reviewedSourceBlob: 'e00f71f993fe558d657ca409436ee62410869b25',
  reviewedSourceSha256: '478c86cc3efb6bca24f9eeb9aedb19d21c051d5a68e42308e0b73ca5979108f5',
  binding: Object.freeze({
    sourceId: 'de-aa-staatenliste-visumpflicht',
    contentItemId: 'aa-staatenliste-visumpflicht-207820',
    contentItemVersion: 1,
    representationId: 'aa-staatenliste-visumpflicht-html-de',
    representationVersion: 1,
    identityProfileId: 'de-aa-visa-table-html-de-candidate',
    identityProfileVersion: 1,
    canonicalUrl: 'https://www.auswaertiges-amt.de/de/service/visa-und-aufenthalt/staatenliste-zur-visumpflicht-207820',
    contentType: 'text/html',
  }),
  // Finite actual-byte pins before the claim or any DNS/HTTPS effect.
  // This policy's own blob/tree is externally bound by Root exact-head review.
  sourceInventory: Object.freeze([
    Object.freeze({ path: 'lib/readiness/official-truth-server-owned-retrieval.ts', bytes: 65490, sha256: 'a9aad4542c70c6dbb1f59cbbce003559fc9b06a5fc6c6065a75fb7ea8e7a9143' }),
    Object.freeze({ path: 'lib/readiness/official-truth-aa-revision-probe-1.test.ts', bytes: 45408, sha256: '487789d625d885d5567438f8ee1a2c5ad1870e6a208154f18949bcacae3228cf' }),
    Object.freeze({ path: 'lib/readiness/official-truth-bounded-response-body.ts', bytes: 1278, sha256: '186ad6dd5ebcf03cd25586775fefe17d652863cb04a2ba72a7be64c7ee4ca0a2' }),
    Object.freeze({ path: 'lib/readiness/official-truth-source-fingerprint-v2.ts', bytes: 5156, sha256: 'd8c0ddd287b0cffc4e9f0a88528ecce5c02052afdc0ab59fbb67449276388eac' }),
    Object.freeze({ path: 'lib/readiness/digest.ts', bytes: 3013, sha256: 'e63201d45a39f68624b1e1f9e7568b696f8a65d1ada07f16e64a2be69dcec190' }),
    Object.freeze({ path: 'lib/readiness/official-truth-ch-de-aa-s1-visa-row-research-server.ts', bytes: 6702, sha256: '059cd29e8695bf29c5296a1bfeb122fd491caff14c701c81ef2dc0bbdd6bf00e' }),
    Object.freeze({ path: '.github/workflows/ci.yml', bytes: 12325, sha256: '3889e092f9cf4ce4b917a786a3267bf9bb510b727d5c76db7cabf6b08f9e6d18' }),
    Object.freeze({ path: 'package.json', bytes: 6467, sha256: '5ce795c22de79e205f6528e8ae3329d4a7863e11178e0b3fe32a1425e54af4df' }),
    Object.freeze({ path: 'package-lock.json', bytes: 320689, sha256: '71f4f32185dc9acd56b5dcfaec8162f317f7e370f32bdefe9264adbb7fd05b1e' }),
    Object.freeze({ path: 'scripts/server-only-test-register.mjs', bytes: 508, sha256: 'd565c9029d993a8a778cd530acebae5707034223bcb18f55dc9a306941b10d32' }),
    Object.freeze({ path: 'scripts/db/official-truth-accepted-store-trip-integration-1/native-loader.ts', bytes: 6501, sha256: '49ab7d7c68afcc30d80251db85e47041e2962f0c83cecf7f63964ce64aa4b298' }),
    Object.freeze({ path: 'lib/readiness/official-truth-accepted-store-trip-integration-1/producer-server.ts', bytes: 9176, sha256: '74a83b4b62711da43f4f6efdf94e4dd162bfcad5c06af253af3300dd59a27572' }),
    Object.freeze({ path: 'lib/readiness/official-truth-content-identity-r2.test.ts', bytes: 41838, sha256: 'be7a0b62e55c557faf05963befd5b717b7ea245bc71d2a85eb4fd0d3f5225c16' }),
  ]),
} as const)
