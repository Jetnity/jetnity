#!/usr/bin/env node
// Shared pins and labels for the independent local browser-acceptance harness.
// Product/Auth/SQL/config remain read-only. This folder is the only writer.

import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
export const HARNESS_DIR = HERE
export const ROOT = join(HERE, '../../..')

export const AGENT = 'Jetnity admin account counts browser acceptance 1'
export const GENERATION = 1
export const TASK = 'docs/ADMIN_ACCOUNT_COUNTS_BROWSER_ACCEPTANCE_1_TASK_2026-09-23.md'
export const TASK_SEED = '74e939882e9e9bfe94f1f3e032d397ca0b2bbe50'
// Historical #556 product snapshot only. Not the executable #557 source contract.
export const PRODUCT_BASELINE = 'f0237baf8809e5528b5f73e918f0e37a7d9b4477'
// Authorized C1 integration baseline: merged #556 preflight fallback on main.
export const INTEGRATION_BASELINE = '4381d20bfaa7f60f140823cc311d44409934197a'
// #557 commit that already contains the executable producer/reader/caller-status bytes.
export const EXECUTABLE_SOURCE_BASELINE = '9cf7aedd8dd190b4764d8ac178e23d9f8b42c773'
// Historical #556 reviewed helper head. Not a #557 product acceptance.
export const REVIEWED_HEAD = 'ef61f0eaaf504c866a179fabaa927fe1472fefe6'
export const BRANCH = 'audit/admin-account-counts-browser-acceptance-1'
export const RUN_LABEL_PREFIX = 'aacba1'
export const HISTORICAL_RECEIPT_ID = 'aacba1-20260923T020045Z'
export const REVIEW_FIX_RECEIPT_ID = 'aacba1-review-fix-20260923T101352Z'

export const BROWSER_CLOSE_TIMEOUT_MS = 3_000

// A PATH binary that answers --version is not a pin. This repo has no
// committed Supabase CLI version permit, so identity stays unverified.
export const PERMITTED_TOOL_IDENTITY = Object.freeze({
  supabase: {
    permittedVersionPatterns: Object.freeze([]),
    note: 'No package.json or repo pin for the Supabase CLI. Record resolved path and observed version; do not set pinned=true from PATH presence alone.',
  },
})

export const EVIDENCE_DIR = join(ROOT, 'docs/evidence/admin-account-counts-browser-acceptance-1')
export const PRIVATE_STATE_DIR_NAME = 'aacba1-private'

export const HISTORICAL_REFUSED_PINS = Object.freeze({
  producerSha256: 'dcf4d35d894975b3c36860454ca8b0714af11c243fdcef900159a9929ccd4420',
  producerBlob: '63974e6509bf42963d2028d99567c4b4062c36d8',
  readerBlob: '02dcafd80502067935eee78f3d8a7b21e417d720',
  note: 'Historical #555/#556 permissive producer and pre-status reader. Not executable for this slice.',
})

export const PINS = Object.freeze({
  producerSha256: '612f755c12f1817e129226648b6c6fd2c1eba19b57bd163102a2eb5e344c12de',
  wrapperSha256: '13fa3fe280d76d42ca6b2a1dff12077edc3d44a599a22300e89dd5578d63a6fb',
  bootstrapSha256: '0413821d7c75c76908dd437527d623fcbed59c524135adbf5e5974730e6f6ea2',
})

// Working-tree git hash-object pins for every source this lane may execute.
// Historical committed HEAD:path names are recorded separately at read time.
export const BLOB_PINS = Object.freeze({
  producer: 'b912eecb55cfa519dcd8b5d4a4ca9222aea0a0c1',
  wrapper: '73bc115763f00a2052123497e0a79273a340f0be',
  bootstrap: '269bab3e4ad9d5e400f90ef09ce4cac86cb6f473',
  contract: '6826eeea70aecc0507d05624daaeac47af0be9b8',
  parser: '6205ecbba621b048fff479856c5523fab5ec4f6d',
  activation: '10f1bf99ac3d71eca6b1c69f04325947d0786c20',
  reader: 'eb5b1b0d54bd649bd511ce3ed17b0a63b8adae92',
  callerStatus: 'b820c799046585dff743553fb6231e60a6a42cff',
  server: '1d394cfb6cc158ad0f979d7cd5bfe6526ece8f18',
  client: '94c45e4c3324e244f743d6e6d07ae676b53ce554',
  guard: 'b650a5e25a4db6572bbb7267e3735a746649497b',
  adminAal: '4617a2951cffd58be45b06d95bb42953a9650548',
  adminAccess: '777edac72b8637192379fa8d0afc04a1ba0e7278',
  roles: '487a1dded0a4bac9294e09f6df392232f704d63c',
  mfa: '14b1e62699b494ab6e41001e6b8a4de886d408e7',
  loginPage: 'bad46e48de7f1886c8137fc7e819c574ad871e7b',
  loginActions: 'ce6bb6b399ed19a6ef7b39f8b2abdf2344b0a0bc',
  mfaPage: '3cd5a0ca008604f6b64ea444d134c2c56a80402a',
  mfaStepUp: '2fa47a19be6f3fd0e5a4f9ed201dd31f3dfdc211',
  adminHome: '0a3a0c0722622dd03c08700f0b046779490bf231',
  countsUi: '8b6d770a0537af95e9f4b410914129426766a984',
  securityPage: '72095b16ba00d32ea7875969f13d5a3f691b3678',
  securityMfa: '38a3893a6abeab1f10a886a465bfda814032fab0',
  mfaTotpDialog: '175a308b45116e59c5fc257f6f043332f60f1c5c',
  config: '4f029b9abdaef85951a8a4d948a6dd7044f899bf',
})

export const SOURCE_PATHS = Object.freeze({
  producer: 'scripts/db/admin-account-counts-1-candidate.sql',
  wrapper: 'scripts/db/admin-account-counts-delivery-1-rpc.sql',
  bootstrap: 'scripts/db/admin-account-counts-1-bootstrap.sql',
  contract: 'lib/admin/account-counts-delivery/contract.ts',
  parser: 'lib/admin/account-counts-delivery/parser.ts',
  activation: 'lib/admin/account-counts-delivery/activation.ts',
  reader: 'lib/admin/account-counts-delivery/reader.ts',
  callerStatus: 'lib/admin/account-counts-delivery/caller-status.ts',
  server: 'lib/supabase/server.ts',
  client: 'lib/supabase/client.ts',
  guard: 'lib/auth/admin-guard.ts',
  adminAal: 'lib/auth/admin-aal.ts',
  adminAccess: 'lib/auth/admin-access.ts',
  roles: 'lib/auth/roles.ts',
  mfa: 'lib/auth/mfa.ts',
  loginPage: 'app/(public)/admin/login/page.tsx',
  loginActions: 'app/(public)/admin/login/actions.ts',
  mfaPage: 'app/(public)/admin/mfa/page.tsx',
  mfaStepUp: 'app/(public)/admin/mfa/AdminMfaStepUp.tsx',
  adminHome: 'app/(admin)/admin/page.tsx',
  countsUi: 'components/admin/home/AdminAccountCounts.tsx',
  securityPage: 'app/account/security/page.tsx',
  securityMfa: 'components/account/SecurityMFA.tsx',
  mfaTotpDialog: 'components/auth/MFATotpDialog.tsx',
  config: 'supabase/config.toml',
})

export const FORBIDDEN_CONNECTION_KEYS = Object.freeze([
  'DATABASE_URL',
  'POSTGRES_URL',
  'POSTGRES_PRISMA_URL',
  'SUPABASE_DB_URL',
  'SUPABASE_DB_PASSWORD',
  'PGHOST',
  'PGHOSTADDR',
  'PGPORT',
  'PGDATABASE',
  'PGUSER',
  'PGPASSWORD',
  'PGRST_DB_URI',
  'PGRST_JWT_SECRET',
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'SUPABASE_ACCESS_TOKEN',
  'SUPABASE_PROJECT_REF',
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
])

export const HOSTED_MARKER_KEYS = Object.freeze([
  'VERCEL',
  'VERCEL_ENV',
  'VERCEL_URL',
  'VERCEL_REGION',
  'VERCEL_DEPLOYMENT_ID',
  'CI',
  'GITHUB_ACTIONS',
])

export const OUTBOUND_PREVENT_KEYS = Object.freeze([
  'OPENAI_API_KEY',
  'ANTHROPIC_API_KEY',
  'DUFFEL_API_TOKEN',
  'HOTELBEDS_API_KEY',
  'SENDGRID_API_KEY',
  'RESEND_API_KEY',
  'SMTP_URL',
  'SMTP_PASSWORD',
])

export const PREFLIGHT_PARENT_ALLOWLIST = Object.freeze(['PATH', 'LANG', 'LC_ALL', 'TZ'])

export const SELECTORS = Object.freeze({
  loginForm: 'form[aria-label="Passwort Anmeldung"]',
  loginEmail: 'form[aria-label="Passwort Anmeldung"] input[name="email"]',
  loginPassword: 'form[aria-label="Passwort Anmeldung"] input[name="password"]',
  loginSubmit: 'form[aria-label="Passwort Anmeldung"] button[type="submit"]',
  stepUpTitle: 'h1',
  stepUpCode: '#mfa-totp',
  enrollButtonText: 'Authenticator-App einrichten',
  enrollCode: '#totp-code',
  countsTitle: '#admin-account-counts-titel',
  countsPresent: '#admin-account-counts-present',
  countsWindow: '#admin-account-counts-window',
})

export const COPY = Object.freeze({
  countsTitle: 'Registrierte Konten',
  forbidden:
    'Für diese Kontenzahlen fehlt eine rollengebundene Berechtigung „konten-verwalten“ mit aktueller AAL2. Notzugang über die Oberfläche reicht nicht.',
  unavailable:
    'Die lokale Zählfunktion ist in dieser Umgebung nicht vorhanden. Das ist keine leere Statistik.',
  failed: 'Die Kontenzahlen konnten nicht zuverlässig gelesen werden. Es wird keine Null angezeigt.',
  stepUp: 'Zwei-Faktor-Bestätigung',
  login: 'Jetnity Admin – Anmeldung',
})

export const WRAPPER_RPC = 'admin_account_counts_v1'
export const LOCAL_FLAG = 'JETNITY_ADMIN_ACCOUNT_COUNTS_LOCAL_ENABLED'

export const EXIT = Object.freeze({
  pass: 0,
  blocked: 2,
  failed: 1,
})
