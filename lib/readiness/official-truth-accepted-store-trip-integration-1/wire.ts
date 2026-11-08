import { z } from 'zod'
const digest = z.string().regex(/^[a-f0-9]{64}$/)
export const headSchema = z.object({ sequence: z.number().int().min(0).max(256), hash: digest }).strict()
export const receiptSchema = z.string().regex(/^ot-provenance-v1:[a-f0-9]{64}$/)
const base64 = z.string().regex(/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/)
const pin = z.object({ id: z.string().regex(/^[a-z][a-z0-9._-]{0,127}$/), version: z.number().int().positive(), digest }).strict()
export const archiveSchema = z.object({ recordFingerprint: receiptSchema, receiptBase64: base64.max(349_528), custodyBindingBase64: base64.max(5_464),
  artifacts: z.array(z.object({ pin, artifactType: z.string().min(1).max(128), artifactContractVersion: z.literal(1), canonicalBase64: base64.max(1_398_104) }).strict()).min(1).max(255),
}).strict()
export type ArchiveWire = z.infer<typeof archiveSchema>
export const reserveSchema = z.object({ token: z.string().uuid(), operationId: z.string().uuid(), now: z.string(), expiresAt: z.string(),
  head: headSchema, priorVersion: receiptSchema.nullable(), graph: z.unknown(), graphDigest: digest.nullable(), authorityUid: z.string().uuid(),
  binding: z.object({codeDigest:digest,keyId:z.string(),keyPolicyDigest:digest,witnessDomain:z.string(),
    sourceMaxAgeSeconds:z.number().int().positive().max(300),retentionSeconds:z.number().int().positive().max(3600),displaySeconds:z.number().int().positive().max(15)}).strict(),
}).strict()
export const committedSchema = z.object({ kind: z.enum(['accept','withdraw','conflict']), operationId: z.string().uuid(), receipt: receiptSchema,
  stageDigest: digest, contractDigest: digest, profile: z.literal('ot-accepted-store-trip-closure-v1'), committedAt: z.string(),
  prior: headSchema, head: headSchema, witnessed: z.boolean(), now: z.string(),
}).strict()
