// Server-owned literal selections. Environment metadata can only select the
// reviewed Dev branch or Production main; no caller supplies a host or credential.
import 'server-only'

/** Root selection #1139/6832438377. These are not the native-fixture LOGINs. */
export const V3_PG_LOGINS = Object.freeze({
  method: Object.freeze({ login: 'ot_v3_method_transport_login', setRole: 'SET LOCAL ROLE ot_v3_method_reader',
    role: 'ot_v3_method_reader', secret: 'JETNITY_V3_PG_METHOD_PASSWORD' }),
  intake: Object.freeze({ login: 'ot_v3_intake_transport_login', setRole: 'SET LOCAL ROLE ot_v3_intake_caller',
    role: 'ot_v3_intake_caller', secret: 'JETNITY_V3_PG_INTAKE_PASSWORD' }),
  jobs: Object.freeze({ login: 'ot_v3_jobs_transport_login', setRole: 'SET LOCAL ROLE ot_v3_jobs_caller',
    role: 'ot_v3_jobs_caller', secret: 'JETNITY_V3_PG_JOBS_PASSWORD' }),
  writer: Object.freeze({ login: 'ot_v3_result_writer', setRole: null, role: 'ot_v3_result_writer',
    secret: 'JETNITY_V3_PG_RESULT_WRITER_PASSWORD' }),
  reader: Object.freeze({ login: 'ot_v3_result_reader', setRole: null, role: 'ot_v3_result_reader',
    secret: 'JETNITY_V3_PG_RESULT_READER_PASSWORD' }),
  verifier: Object.freeze({ login: 'ot_v3_result_verifier', setRole: null, role: 'ot_v3_result_verifier',
    secret: 'JETNITY_V3_PG_RESULT_VERIFIER_PASSWORD' }),
})
export type V3PgLogin = keyof typeof V3_PG_LOGINS

/** Internal literal configuration only. No constructor, URL or caller override.
 * Both direct endpoints bind their exact hostname and the public Supabase CA.
 * Actual Production TLS/install/Owner acceptance remains a separate release gate.
 * The separate native test mocks this module only inside an owned local fixture;
 * there is no runtime test flag or runtime fixture branch. */
export type V3PgTarget = Readonly<{
  connectHost: string; tlsHostname: string; port: number; database: string;
  usernameSuffix: string; certificateAuthorityPem: string; certificateAuthoritySha256: string;
  expectedServerMajor: 17; requireBackendTls: true;
}>

// The already accepted Dev endpoint and public CA remain byte-for-byte unchanged.
const DEV_DIRECT_TARGET: V3PgTarget = Object.freeze({
  connectHost: 'db.yfvbxvijcorffwxbxahl.supabase.co',
  tlsHostname: 'db.yfvbxvijcorffwxbxahl.supabase.co',
  port: 5432, database: 'postgres', usernameSuffix: '',
  certificateAuthorityPem: `-----BEGIN CERTIFICATE-----
MIIDxDCCAqygAwIBAgIUbLxMod62P2ktCiAkxnKJwtE9VPYwDQYJKoZIhvcNAQEL
BQAwazELMAkGA1UEBhMCVVMxEDAOBgNVBAgMB0RlbHdhcmUxEzARBgNVBAcMCk5l
dyBDYXN0bGUxFTATBgNVBAoMDFN1cGFiYXNlIEluYzEeMBwGA1UEAwwVU3VwYWJh
c2UgUm9vdCAyMDIxIENBMB4XDTIxMDQyODEwNTY1M1oXDTMxMDQyNjEwNTY1M1ow
azELMAkGA1UEBhMCVVMxEDAOBgNVBAgMB0RlbHdhcmUxEzARBgNVBAcMCk5ldyBD
YXN0bGUxFTATBgNVBAoMDFN1cGFiYXNlIEluYzEeMBwGA1UEAwwVU3VwYWJhc2Ug
Um9vdCAyMDIxIENBMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAqQXW
QyHOB+qR2GJobCq/CBmQ40G0oDmCC3mzVnn8sv4XNeWtE5XcEL0uVih7Jo4Dkx1Q
DmGHBH1zDfgs2qXiLb6xpw/CKQPypZW1JssOTMIfQppNQ87K75Ya0p25Y3ePS2t2
GtvHxNjUV6kjOZjEn2yWEcBdpOVCUYBVFBNMB4YBHkNRDa/+S4uywAoaTWnCJLUi
cvTlHmMw6xSQQn1UfRQHk50DMCEJ7Cy1RxrZJrkXXRP3LqQL2ijJ6F4yMfh+Gyb4
O4XajoVj/+R4GwywKYrrS8PrSNtwxr5StlQO8zIQUSMiq26wM8mgELFlS/32Uclt
NaQ1xBRizkzpZct9DwIDAQABo2AwXjALBgNVHQ8EBAMCAQYwHQYDVR0OBBYEFKjX
uXY32CztkhImng4yJNUtaUYsMB8GA1UdIwQYMBaAFKjXuXY32CztkhImng4yJNUt
aUYsMA8GA1UdEwEB/wQFMAMBAf8wDQYJKoZIhvcNAQELBQADggEBAB8spzNn+4VU
tVxbdMaX+39Z50sc7uATmus16jmmHjhIHz+l/9GlJ5KqAMOx26mPZgfzG7oneL2b
VW+WgYUkTT3XEPFWnTp2RJwQao8/tYPXWEJDc0WVQHrpmnWOFKU/d3MqBgBm5y+6
jB81TU/RG2rVerPDWP+1MMcNNy0491CTL5XQZ7JfDJJ9CCmXSdtTl4uUQnSuv/Qx
Cea13BX2ZgJc7Au30vihLhub52De4P/4gonKsNHYdbWjg7OWKwNv/zitGDVDB9Y2
CMTyZKG3XEu5Ghl1LEnI3QmEKsqaCLv12BnVjbkSeZsMnevJPs1Ye6TjjJwdik5P
o/bKiIz+Fq8=
-----END CERTIFICATE-----
`,
  certificateAuthoritySha256: '700723581420dd1ac98fd7e9ac529f0ef210eadcaf87fc868a3ad7d114c2f3b7',
  expectedServerMajor: 17, requireBackendTls: true,
})

// Separate literal Production target. The shared public CA is not a credential.
// This does not install a role, provide a password or approve a method. A missing
// installation, missing own Production secret or TLS mismatch still fails closed.
const PRODUCTION_DIRECT_TARGET: V3PgTarget = Object.freeze({
  ...DEV_DIRECT_TARGET,
  connectHost: 'db.qscbgcdmivbbnzrcyegn.supabase.co',
  tlsHostname: 'db.qscbgcdmivbbnzrcyegn.supabase.co',
})

export function selectedV3PgTarget(): V3PgTarget | null {
  if (process.env.VERCEL_PROJECT_ID !== 'prj_wTTVawPItEO7a4HihEmaU3PsuaXM'
    || process.env.VERCEL_GIT_REPO_OWNER !== 'Jetnity'
    || process.env.VERCEL_GIT_REPO_SLUG !== 'jetnity') return null
  if (process.env.VERCEL_ENV === 'preview'
    && process.env.VERCEL_GIT_COMMIT_REF === 'feat/official-truth-human-method-ui-1-20261112') return DEV_DIRECT_TARGET
  if (process.env.VERCEL_ENV === 'production'
    && process.env.VERCEL_GIT_COMMIT_REF === 'main') return PRODUCTION_DIRECT_TARGET
  return null
}

/** Called only after a literal target has been selected. No PG* / DATABASE_URL /
 * service-role fallback, file lookup, URL parsing or caller-named secret. */
export function readV3PgPassword(kind: V3PgLogin): string | null {
  const value = process.env[V3_PG_LOGINS[kind].secret]
  return typeof value === 'string' && value.length >= 16 && Buffer.byteLength(value, 'utf8') <= 512
    && !/[\u0000\r\n]/.test(value) ? value : null
}
