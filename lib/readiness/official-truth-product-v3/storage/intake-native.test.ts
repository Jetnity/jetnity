// Existing test:core discovery executes this native suite unconditionally.
// Missing PostgreSQL/environment failure is a failure, never a skip or a mock.
import '../../../../scripts/db/official-truth-v3-intake-store-1/native'
