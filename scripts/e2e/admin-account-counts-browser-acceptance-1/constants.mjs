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
export const PRODUCT_BASELINE = 'f0237baf8809e5528b5f73e918f0e37a7d9b4477'
export const BRANCH = 'audit/admin-account-counts-browser-acceptance-1'
export const RUN_LABEL_PREFIX = 'aacba1'

export const EVIDENCE_DIR = join(ROOT, 'docs/evidence/admin-account-counts-browser-acceptance-1')
export const PRIVATE_STATE_DIR_NAME = 'aacba1-private'

export const PINS = Object.freeze({
  producerSha256: 'dcf4d35d894975b3c36860454ca8b0714af11c243fdcef900159a9929ccd4420',
  wrapperSha256: '13fa3fe280d76d42ca6b2a1dff12077edc3d44a599a22300e89dd5578d63a6fb',
  contractBlob: '6826eeea70aecc0507d05624daaeac47af0be9b8',
  parserBlob: '6205ecbba621b048fff479856c5523fab5ec4f6d',
  activationBlob: '10f1bf99ac3d71eca6b1c69f04325947d0786c20',
  readerBlob: '02dcafd80502067935eee78f3d8a7b21e417d720',
  bootstrapSha256: '0413821d7c75c76908dd437527d623fcbed59c524135adbf5e5974730e6f6ea2',
})

export const SOURCE_PATHS = Object.freeze({
  producer: 'scripts/db/admin-account-counts-1-candidate.sql',
  wrapper: 'scripts/db/admin-account-counts-delivery-1-rpc.sql',
  bootstrap: 'scripts/db/admin-account-counts-1-bootstrap.sql',
  contract: 'lib/admin/account-counts-delivery/contract.ts',
  parser: 'lib/admin/account-counts-delivery/parser.ts',
  activation: 'lib/admin/account-counts-delivery/activation.ts',
  reader: 'lib/admin/account-counts-delivery/reader.ts',
  server: 'lib/supabase/server.ts',
  guard: 'lib/auth/admin-guard.ts',
  adminAal: 'lib/auth/admin-aal.ts',
  adminAccess: 'lib/auth/admin-access.ts',
  roles: 'lib/auth/roles.ts',
  loginPage: 'app/(public)/admin/login/page.tsx',
  loginActions: 'app/(public)/admin/login/actions.ts',
  mfaPage: 'app/(public)/admin/mfa/page.tsx',
  mfaStepUp: 'app/(public)/admin/mfa/AdminMfaStepUp.tsx',
  adminHome: 'app/(admin)/admin/page.tsx',
  countsUi: 'components/admin/home/AdminAccountCounts.tsx',
  securityPage: 'app/account/security/page.tsx',
  securityMfa: 'components/account/SecurityMFA.tsx',
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
