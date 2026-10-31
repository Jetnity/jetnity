// Test-only boundary for the offline harness. The production Footer and its
// preferences child stay the real modules. This file supplies no session,
// auth, provider, or CMP call.

import type { ReactNode } from 'react'

export function Link({
  href,
  className,
  children,
  ...rest
}: {
  href?: string
  className?: string
  children?: ReactNode
  'aria-label'?: string
}) {
  return (
    <a href={typeof href === 'string' ? href : '#'} className={className} {...rest}>
      {children}
    </a>
  )
}

export function Image({ alt, className, src }: { alt?: string; className?: string; src?: string }) {
  // The harness replaces next/image. This element is the isolated stand-in, not a product image.
  // eslint-disable-next-line @next/next/no-img-element
  return <img alt={alt ?? ''} className={className} src={typeof src === 'string' ? src : undefined} />
}

export function usePathname(): string {
  return '/'
}

export function useRouter() {
  return {
    push() {},
    replace() {},
    prefetch() {},
    back() {},
  }
}

export function createBrowserClient(): null {
  return null
}

export async function signOutAction(): Promise<null> {
  return null
}
