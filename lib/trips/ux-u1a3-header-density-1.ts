// lib/trips/ux-u1a3-header-density-1.ts
//
// UX V1 U1-A3: when the identity route/dates and the action help share one row.
// Pure measurements in, one posture out. No trip truth, no provider, no URL.

/** Tailwind `lg`. Below this, route, dates and action help stay stacked. */
export const UX_U1A3_NEBENEINANDER_AB_PX = 1024
/** 200% of the 16px root. Separate from browser zoom. */
export const UX_U1A3_ROOT_GROSS_PX = 32

export function dichteZeile(eingabe: { viewportBreite: number; rootSchriftPx: number }): boolean {
  if (!Number.isFinite(eingabe.viewportBreite) || !Number.isFinite(eingabe.rootSchriftPx)) return false
  if (eingabe.rootSchriftPx >= UX_U1A3_ROOT_GROSS_PX) return false
  return eingabe.viewportBreite >= UX_U1A3_NEBENEINANDER_AB_PX
}
