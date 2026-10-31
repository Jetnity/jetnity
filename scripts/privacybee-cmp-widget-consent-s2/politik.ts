// Test-only reviewed policy. Production code passes null instead.

import { CMP_OPTIONAL_CATEGORIES } from '@/lib/privacy/privacybee-cmp/vertrag'
import type { ReviewedPolicy } from '@/lib/privacy/privacybee-cmp/bundle'

export const TEST_BUNDLE_POLICY: ReviewedPolicy = Object.freeze({
  id: 's2-harness-reviewed-bundle',
  requiredOptional: Object.freeze([...CMP_OPTIONAL_CATEGORIES]),
})
