// Scheduling admission only; the existing DB guard and all authority proofs
// remain decisive. No visitor query or direct native worker uses this gate.
import 'server-only'
import { HRS1_LIMITS } from '../result/contract'

const BG1_INTERVAL_MILLISECONDS = 5 * 60_000
const BG1_AUDIT_MILLISECONDS = 30_000
const CLOCK_AND_SCHEDULER_MARGIN_MILLISECONDS = 5_000

/** The production clock is always the server's real UTC clock. Kept separate
 * from the predicate so offline tests can supply explicit instants locally. */
export function chDeSourceUtcNow(): number { return Date.now() }

/** Leave a whole unchanged tick before the regular UTC BG1 slot and its whole
 * audit budget afterwards, with five seconds of clock/scheduler margin on each
 * side. This is no BG1-health claim and cannot authorize a delayed/manual audit. */
export function chDeSourceAdmissionOpen(utcMilliseconds: number): boolean {
  if (!Number.isSafeInteger(utcMilliseconds) || utcMilliseconds < 0 || utcMilliseconds > 8_640_000_000_000_000) return false
  const phase = utcMilliseconds % BG1_INTERVAL_MILLISECONDS
  return phase >= BG1_AUDIT_MILLISECONDS + CLOCK_AND_SCHEDULER_MARGIN_MILLISECONDS
    && phase < BG1_INTERVAL_MILLISECONDS - HRS1_LIMITS.workerMilliseconds - CLOCK_AND_SCHEDULER_MARGIN_MILLISECONDS
}
