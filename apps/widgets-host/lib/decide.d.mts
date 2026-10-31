export function classify(request: Request): {
  kind: 'shell' | 'closed'
  provider?: 'discovercars' | 'twelvego'
  method?: string
}

export function buildShell(
  provider: 'discovercars' | 'twelvego',
  options?: {
    plan?: {
      selected?: boolean
      provider?: string
      policyId?: string
      artifactSha256?: string
      childOrigin?: string
      parentOrigin?: string
      protocolRevision?: number
    } | null
  },
): {
  status: number
  headers: Headers
  html: string
  nonce: string
}

export function decide(request: Request): Response
