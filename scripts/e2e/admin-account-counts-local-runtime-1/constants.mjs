#!/usr/bin/env node
// Owned pins for the local-runtime lane. Product/Auth/SQL/config stay read-only.
// #556 helper constants are imported for the accepted source contract.

import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  BLOB_PINS as ACCEPTED_BLOB_PINS,
  PINS as ACCEPTED_PINS,
  SOURCE_PATHS as ACCEPTED_SOURCE_PATHS,
  LOCAL_FLAG,
} from '../admin-account-counts-browser-acceptance-1/constants.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
export const HARNESS_DIR = HERE
export const ROOT = join(HERE, '../../..')

export const AGENT = 'Jetnity admin account counts local runtime 1'
export const GENERATION = 1
export const TASK = 'docs/ADMIN_ACCOUNT_COUNTS_LOCAL_RUNTIME_1_TASK_2026-09-23.md'
export const TASK_SEED = '0aa33e88a021756a5cee64a130d544122977880a'
export const PRODUCT_BASELINE = 'fa7f651c023eb361fb142cbb931bc702f3a3d213'
export const BRANCH = 'test/admin-account-counts-local-runtime-1'
export const MACOS_DOCKER_FIX_1 = Object.freeze({
  agent: 'Jetnity admin account counts macOS Docker runtime fix 1',
  generation: 1,
  task: 'docs/ADMIN_ACCOUNT_COUNTS_MACOS_DOCKER_RUNTIME_FIX_1_TASK_2026-09-26.md',
  branch: 'fix/admin-account-counts-macos-docker-runtime-1',
  productBaseline: 'b440a6759c7c479d1b7509ecbefcac7b95c4ea35',
})
export const RUN_LABEL_PREFIX = 'aaclr1'
export const CONTRACT_VERSION = 'jetnity.account-counts.local-acceptance.v1'

export const BROWSER_MODULE_REL = 'scripts/e2e/admin-account-counts-browser-flows-1/flows.mjs'
export const BROWSER_MODULE = join(ROOT, BROWSER_MODULE_REL)

export { LOCAL_FLAG }
export const PINS = ACCEPTED_PINS
export const BLOB_PINS = ACCEPTED_BLOB_PINS
export const SOURCE_PATHS = ACCEPTED_SOURCE_PATHS

export const EXTRA_SOURCE_PATHS = Object.freeze({
  packageJson: 'package.json',
  packageLock: 'package-lock.json',
  proxy: 'proxy.ts',
  nextConfig: 'next.config.js',
})

export const EXTRA_BLOB_PINS = Object.freeze({
  packageJson: '40040f33dd3f4c914f4db308aafec804283ed2e7',
  packageLock: '2c670fa6e29fb853fb5be12912a34515ba85a573',
  proxy: 'acdd117ee84e01f107dcb3a491e75475e43af787',
  nextConfig: 'e2f9b811ccfd1e80aac8351963386bb1e6b3db96',
})

export const HISTORICAL_REFUSED_PRODUCER_SHA256 = 'dcf4d35d894975b3c36860454ca8b0714af11c243fdcef900159a9929ccd4420'

export const CLI = Object.freeze({
  version: '2.117.0',
  tag: 'v2.117.0',
  releaseId: 384221143,
  prerelease: false,
  releaseApi: 'https://api.github.com/repos/supabase/cli/releases/tags/v2.117.0',
  checksumsUrl: 'https://github.com/supabase/cli/releases/download/v2.117.0/checksums.txt',
  checksumsApiDigest: 'sha256:afcec54b3b19d8c73957cafb4956bb10cb7493207c29df60cdcd9afe6317cdb0',
  archives: Object.freeze({
    'linux-x64': Object.freeze({
      name: 'supabase_2.117.0_linux_amd64.tar.gz',
      apiDigest: 'sha256:69c05f85b9e47ee706d30f1a6ca8a526b4e337bfd12c7ef1ef522d24e7280d24',
    }),
    'linux-arm64': Object.freeze({
      name: 'supabase_2.117.0_linux_arm64.tar.gz',
      apiDigest: 'sha256:598c56a936fdf179ea486717901e6e49bc5d777b3ad317eab02f41faf21a95cb',
    }),
    'darwin-arm64': Object.freeze({
      name: 'supabase_2.117.0_darwin_arm64.tar.gz',
      apiDigest: 'sha256:c8a298065b374836a42945f5d78ab9348d328bcfd099c14d3e5b0b537791209b',
    }),
    'darwin-x64': Object.freeze({
      name: 'supabase_2.117.0_darwin_amd64.tar.gz',
      apiDigest: 'sha256:6bf14bf758f8514ea4ba3a0020c15eabec6f6edc7525614345fda6c0082ae63d',
    }),
  }),
  versionPattern: /^(?:supabase\s+)?(?:v)?2\.117\.0\b/i,
  startHelpPattern: /Start containers for Supabase local development/i,
  // Primary required form: official v2.117 Effect CLI root help from the
  // SHA-verified release binary and tag source. Do not mix with Cobra.
  effectRootHelpCommands: Object.freeze({
    start: 'Start local Supabase stack',
    status: 'Show status of local Supabase containers',
    stop: 'Stop all local Supabase containers',
  }),
  // Separate complete historical Go/Cobra alternative. Accepted only when
  // that form is structurally complete on its own.
  cobraRootHelpCommands: Object.freeze({
    start: 'Start containers for Supabase local development',
    status: 'Show status of local Supabase containers',
    stop: 'Stop all local Supabase containers',
  }),
})

export const ACTOR_KEYS = Object.freeze(['owner', 'moderator', 'ordinary', 'creator'])
export const STATUS_ALLOWLIST = Object.freeze(['active', 'pending', 'disabled', 'banned'])
export const ROLE_ALLOWLIST = Object.freeze(['user', 'creator', 'moderator', 'operator', 'admin', 'owner'])
export const DEFAULT_ROLES = Object.freeze({
  owner: 'owner',
  moderator: 'moderator',
  ordinary: 'user',
  creator: 'creator',
})
export const COUNT_SCENARIOS = Object.freeze(['zero-window', 'one-recent'])
export const FIXTURE_DOMAIN = 'aaclr1.invalid'
export const WINDOW_HOURS = 720
export const WRAPPER_RPC = 'admin_account_counts_v1'
export const WRAPPER_PATH = `/rest/v1/rpc/${WRAPPER_RPC}`

export const EVIDENCE_DIR = join(ROOT, 'docs/evidence/admin-account-counts-local-runtime-1')
export const PRIVATE_STATE_DIR_NAME = 'aaclr1-private'

export const HISTORICAL_EVIDENCE_BASENAMES = Object.freeze([
  'README.md',
])

export const TIMEOUTS = Object.freeze({
  preflightMs: 20_000,
  cliHelpMs: 20_000,
  dockerInfoMs: 12_000,
  stackStartMs: 180_000,
  httpMs: 8_000,
  appBootMs: 120_000,
  installMs: 180_000,
  buildMs: 180_000,
  browserCloseMs: 3_000,
  childTermMs: 1_500,
  childKillMs: 800,
  drainMs: 2_000,
  observerCloseMs: 2_000,
  observerMaxBodyBytes: 1_000_000,
  runtimeBudgetMs: 15 * 60 * 1000,
  tarMemberMs: 30_000,
  tarMemberMaxBytes: 80 * 1024 * 1024,
})

export const RUN_LABEL = 'jetnity.aaclr1.run'
// Official CLI 2.117.0 default creation label from config.toml project_id.
// Read from inspect; do not assume our custom RUN_LABEL exists on CLI objects.
export const CLI_PROJECT_LABEL = 'com.supabase.cli.project'
export const DOTENV_NAME = /^(?:\.env|\.env\..+)$/

export const RUNTIME_GATES = Object.freeze([
  'G0_preflight',
  'G1_source_pins',
  'G2_owned_stack',
  'G3_auth_schema_not_bootstrap',
  'G4_fixtures_via_gotrue',
  'G5_app_boot_loopback',
  'G20_owned_cleanup',
])

export const BROWSER_GATES = Object.freeze([
  'G6_login_ui_password',
  'G7_aal1_denied_step_up',
  'G8_totp_enroll_via_ui',
  'G9_aal2_admin_counts_on',
  'G10_existing_factor_fresh_session',
  'G11_default_off_no_section_no_rpc',
  'G12_zero_window_and_delta',
  'G13_ordinary_user_no_disclosure',
  'G14_unauthenticated_no_disclosure',
  'G15_role_downgrade_no_disclosure',
  'G16_restricted_privileged_status',
  'G17_missing_wrapper_unavailable',
  'G18_desktop_mobile_ui',
  'G19_http_boundary_same_session',
])

export const BROWSER_GATE_RESULTS = Object.freeze(['PASS', 'FAIL', 'BLOCKED', 'NOT RUN'])

export const EXIT = Object.freeze({
  pass: 0,
  blocked: 2,
  failed: 1,
})

export const OFFICIAL_DOCS = Object.freeze({
  localDevelopment: 'https://supabase.com/docs/guides/local-development',
  cliConfig: 'https://supabase.com/docs/guides/local-development/cli/config',
  totp: 'https://supabase.com/docs/guides/auth/auth-mfa/totp',
  changelog: 'https://supabase.com/changelog',
  playwrightAuth: 'https://playwright.dev/docs/auth',
  dockerPorts: 'https://docs.docker.com/engine/network/port-publishing/',
})
