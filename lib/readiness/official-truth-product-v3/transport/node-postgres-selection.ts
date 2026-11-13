// Server-owned selection. Shape, environment and an available driver never select a target.
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
 * A later selection must bind the actual session endpoint, database, certificate
 * and backend TLS readback. The production selector below is deliberately null.
 * The separate native test mocks this module only inside an owned local fixture;
 * there is no runtime test flag or runtime fixture branch. */
export type V3PgTarget = Readonly<{
  connectHost: string; tlsHostname: string; port: number; database: string;
  usernameSuffix: string; certificateAuthorityPem: string; certificateAuthoritySha256: string;
  expectedServerMajor: 17; requireBackendTls: true;
}>

export function selectedV3PgTarget(): V3PgTarget | null {
  // No hosted endpoint, certificate, secret handoff or operational terminal
  // acceptance is established by this source-only candidate.
  return null
}

/** Called only after a literal target has been selected. No PG* / DATABASE_URL /
 * service-role fallback, file lookup, URL parsing or caller-named secret. */
export function readV3PgPassword(kind: V3PgLogin): string | null {
  const value = process.env[V3_PG_LOGINS[kind].secret]
  return typeof value === 'string' && value.length >= 16 && Buffer.byteLength(value, 'utf8') <= 512
    && !/[\u0000\r\n]/.test(value) ? value : null
}
