import 'server-only'

// Closed research task data. Run 0 is unarmed; only Root may select one reviewed CI run.
// No environment/caller override, setter, registry admission or product-window change.
export const AA_REVISION_PROBE_V1_POLICY = Object.freeze({
  runNumber: 4150 as number,
  baseSha: 'b5f33f66faab89454a874e641dbd0dfa66b09d2d',
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
  // Inhaltswartung nach der konsumierten Run-4150-Beobachtung; keine neue Auswahl oder Ausführung.
  // Finite actual-byte pins before the claim or any DNS/HTTPS effect.
  // This policy's own blob/tree is externally bound by Root exact-head review.
  sourceInventory: Object.freeze([
    Object.freeze({ path: 'lib/readiness/official-truth-server-owned-retrieval.ts', bytes: 29654, sha256: '5a602682055c4f0d5a15b54524a3156a20223cc36dfcef71a953bccf84874d10' }),
    Object.freeze({ path: 'lib/readiness/official-truth-aa-revision-probe-1.test.ts', bytes: 63059, sha256: 'cb2f6f2102d440efa0b845519a9c00eb94d6b42b32984d90d6ebd1b59bf97b4c' }),
    Object.freeze({ path: 'lib/readiness/official-truth-bounded-response-body.ts', bytes: 1278, sha256: '186ad6dd5ebcf03cd25586775fefe17d652863cb04a2ba72a7be64c7ee4ca0a2' }),
    Object.freeze({ path: 'lib/readiness/official-truth-source-fingerprint-v2.ts', bytes: 5156, sha256: 'd8c0ddd287b0cffc4e9f0a88528ecce5c02052afdc0ab59fbb67449276388eac' }),
    Object.freeze({ path: 'lib/readiness/digest.ts', bytes: 3013, sha256: 'e63201d45a39f68624b1e1f9e7568b696f8a65d1ada07f16e64a2be69dcec190' }),
    Object.freeze({ path: 'lib/readiness/official-truth-ch-de-aa-s1-visa-row-research-server.ts', bytes: 6702, sha256: '059cd29e8695bf29c5296a1bfeb122fd491caff14c701c81ef2dc0bbdd6bf00e' }),
    // Exact AT50 / BG1 / #1265 CI successors stay in pilot-context.test.ts.
    // Package identity here is that chain plus supabase-js 2.119.2.
    Object.freeze({ path: '.github/workflows/ci.yml', bytes: 52696, sha256: 'a0630a727aba38c0333192298cd2597bffb7eab568fc909dea8ebf10fb4146df' }),
    Object.freeze({ path: 'package.json', bytes: 6717, sha256: 'b72ed28b71bd9a351eaef3637b6b56f2a28844c3e7f4dc6ac3f9a28bb96e540e' }),
    Object.freeze({ path: 'package-lock.json', bytes: 325113, sha256: 'da769bf15ec9a5349e88cb7420267a5dedd70953c15f8e93ec6a6a802e24dfb4' }),
    Object.freeze({ path: 'scripts/server-only-test-register.mjs', bytes: 508, sha256: 'd565c9029d993a8a778cd530acebae5707034223bcb18f55dc9a306941b10d32' }),
    Object.freeze({ path: 'scripts/db/official-truth-accepted-store-trip-integration-1/native-loader.ts', bytes: 6502, sha256: '6f6e1138dcffa7122007622d7cccb4a42edbc90b7146dfb23ed4d32dc8866b94' }),
    Object.freeze({ path: 'lib/readiness/official-truth-accepted-store-trip-integration-1/producer-server.ts', bytes: 9176, sha256: '74a83b4b62711da43f4f6efdf94e4dd162bfcad5c06af253af3300dd59a27572' }),
    Object.freeze({ path: 'lib/readiness/official-truth-content-identity-r2.test.ts', bytes: 41838, sha256: 'be7a0b62e55c557faf05963befd5b717b7ea245bc71d2a85eb4fd0d3f5225c16' }),
    Object.freeze({ path: 'lib/readiness/official-truth-retrieval-physical-internal.ts', bytes: 17726, sha256: 'aa37e8a42581f4ee67cfd52e677cb7d09a804ac77043e2d20b85dc24cd467e3f' }),
    Object.freeze({ path: 'lib/readiness/official-truth-aa-revision-probe-1-server.ts', bytes: 20156, sha256: 'a2f16bceb4917e3fc6f654fc1bc4fc03b405a3f02b294e9d5a2ddbfa9434190f' }),
    Object.freeze({ path: 'scripts/official-truth-v3-test-selection.mjs', bytes: 10827, sha256: '562e24feab0c73fe08f38c3f8b6818da2c548ea4d987fb06f02a31c038ee97ff' }),
    Object.freeze({ path: 'scripts/official-truth-v3-test-selection.test.mjs', bytes: 15125, sha256: 'bbb02fb5c52f6bf491b99be1d623f3939f12439b8d47ed5d32aad68d9fc650b4' }),
  ]),
} as const)
