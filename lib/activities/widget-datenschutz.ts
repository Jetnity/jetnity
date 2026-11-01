import type { CmpRead } from '@/lib/privacy/privacybee-cmp/schnappschuss'

export type ActivityWidgetProvider = 'viator' | 'getyourguide'

/** Activity rollout, not a consent grant or a provider purpose classification. */
export function activityWidgetErlaubt(input: { read: CmpRead; cmpErforderlich: boolean }): boolean {
  const { read, cmpErforderlich } = input
  // Conservatively honor every optional refusal until the purpose mapping is
  // reviewed. A ready event or a mere API presence never counts as agreement.
  if (read.status === 'explicit') return read.optionalSatisfied
  // Current rollout has no released CMP. Once one is enabled/observed it must
  // yield an affirmative, consistent read before external widgets may load.
  return !cmpErforderlich && read.reason === 'missing_api'
}
