// Test-only reviewed policy. Production code passes null instead.

import type { ReviewedPolicy } from '@/lib/privacy/privacybee-cmp/bundle'

/** Narrow reviewed policy. Advertising categories are not implied. */
export const TEST_BUNDLE_POLICY: ReviewedPolicy = Object.freeze({
  id: 's2-harness-analytics-only',
  requiredOptional: Object.freeze(['ANALYTICS_STORAGE']),
})
