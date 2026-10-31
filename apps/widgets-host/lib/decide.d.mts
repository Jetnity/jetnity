export function classify(request: Request): {
  kind: 'shell' | 'closed'
  provider?: 'discovercars' | 'twelvego'
  method?: string
}

export function buildShell(provider: 'discovercars' | 'twelvego'): {
  status: number
  headers: Headers
  html: string
  nonce: string
}

export function decide(request: Request): Response
