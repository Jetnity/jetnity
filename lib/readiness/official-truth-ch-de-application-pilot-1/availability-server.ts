import 'server-only'

/** Closed until the exact deployment's persistence prerequisites are reconciled,
 * applied and independently reviewed. Separate from source/Owner admission.
 * No request, public setting or missing-RPC fallback can enable this boundary. */
export function applicationPilotAvailable(): boolean { return false }
