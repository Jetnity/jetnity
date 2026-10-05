// lib/server/providers/core/exports.ts
//
// Internal barrel. Every runtime path, including this file, is server-only.
// Client bundles fail at Next compile time. node:test uses a local stub.

import 'server-only'

export {
  PROVIDER_HTTP_METHODS,
  PROVIDER_TRANSPORT_BOUNDS,
  PROVIDER_TRANSPORT_ERROR_KINDS,
  PROVIDER_TRANSPORT_EVENT_FIELDS,
  PROVIDER_TRANSPORT_EVENT_NAMES,
  createProviderResponseMetadata,
  createProviderTransportError,
  createSanitizedRequestMetadata,
  istProviderHttpMethod,
  istProviderTransportErrorKind,
  type ProviderClock,
  type ProviderHeaderInput,
  type ProviderHttpClient,
  type ProviderHttpMethod,
  type ProviderHttpRequest,
  type ProviderHttpResponse,
  type ProviderJitterStrategy,
  type ProviderParseStrategy,
  type ProviderRandom,
  type ProviderRateLimitOutcome,
  type ProviderRateLimitPolicy,
  type ProviderRetryPolicy,
  type ProviderSanitizedRequestMetadata,
  type ProviderSleeper,
  type ProviderTimeoutPolicy,
  type ProviderTimeoutScheduler,
  type ProviderTransportError,
  type ProviderTransportErrorKind,
  type ProviderTransportEvent,
  type ProviderTransportEventName,
  type ProviderTransportFailure,
  type ProviderTransportObserver,
  type ProviderTransportResponseMetadata,
  type ProviderTransportResult,
  type ProviderTransportSuccess,
  type ProviderTransportUrl,
  type ProviderValidatedRetryPolicy,
} from '@/lib/server/providers/core/domain'
export {
  DEFAULT_SENSITIVE_HEADER_NAMES,
  buildProviderRequestHeaders,
  headerNamesAreSecretSafe,
  isSensitiveHeaderName,
  isValidHttpHeaderName,
  redactHeaderName,
  resolveRequestIdHeaderName,
} from '@/lib/server/providers/core/headers'
export {
  applyJitter,
  computeProviderRetryDelayMs,
  defaultProviderSleeper,
  isAbortError,
  isHardNonRetryableStatus,
  isRetryableHttpStatus,
  parseRetryAfterHeaderMs,
  sleepWithAbort,
  validateProviderRetryAfterMs,
  validateProviderRetryPolicy,
  validateProviderTimeoutPolicy,
} from '@/lib/server/providers/core/retry'
export {
  cancelProviderResponseBody,
  classifyProviderHttpStatus,
  parseProviderResponseBody,
  readProviderResponseBodyBounded,
  validateMaxBodyBytes,
} from '@/lib/server/providers/core/parse'
export { isoFromClock, providerTransportEvent, providerTransportEventFieldNames } from '@/lib/server/providers/core/observability'
export { createFetchProviderHttpClient } from '@/lib/server/providers/core/http'
export { readSafeRequestId, sanitizeProviderTransportUrl, validateBoundedId, validateCorrelationId } from '@/lib/server/providers/core/url'
export {
  createProviderTransportExecutor,
  type ProviderTransportCreateResult,
  type ProviderTransportExecutor,
  type ProviderTransportExecutorConfig,
  type ProviderTransportRequest,
} from '@/lib/server/providers/core/executor'
