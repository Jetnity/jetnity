#!/usr/bin/env node
// Acceptance gates. Unrun gates stay NOT RUN. Never convert environment
// failure into a product PASS.

export const GATE_IDS = Object.freeze([
  'G0_preflight',
  'G1_source_pins',
  'G2_owned_stack',
  'G3_auth_schema_not_bootstrap',
  'G4_fixtures_via_gotrue',
  'G5_app_boot_loopback',
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
  'G20_owned_cleanup',
])

export function leereMatrix(reason = 'NOT RUN') {
  return Object.fromEntries(
    GATE_IDS.map((id) => [
      id,
      {
        id,
        result: reason,
        evidence: null,
        notes: null,
      },
    ]),
  )
}

export function setzeGate(matrix, id, { result, evidence = null, notes = null }) {
  if (!matrix[id]) throw new Error(`Unknown gate ${id}`)
  matrix[id] = { id, result, evidence, notes }
  return matrix
}

export function zusammenfassung(matrix) {
  const counts = { PASS: 0, FAIL: 0, BLOCKED: 0, 'NOT RUN': 0, PARTIAL: 0 }
  for (const gate of Object.values(matrix)) {
    counts[gate.result] = (counts[gate.result] || 0) + 1
  }
  const applicationIds = GATE_IDS.filter((id) => id !== 'G0_preflight' && id !== 'G1_source_pins')
  const applicationRan = applicationIds.some((id) => ['PASS', 'FAIL', 'PARTIAL'].includes(matrix[id].result))
  return {
    counts,
    fullLocalExecution: applicationIds.every((id) => matrix[id].result === 'PASS'),
    applicationRan,
    preflightBlocked: matrix.G0_preflight.result === 'BLOCKED',
  }
}
