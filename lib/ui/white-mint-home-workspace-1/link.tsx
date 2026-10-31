import type { AnchorHTMLAttributes, ReactNode } from 'react'

type LinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> & {
  href: string | { pathname?: string }
  children?: ReactNode
  prefetch?: boolean
  scroll?: boolean
  replace?: boolean
  legacyBehavior?: boolean
}

/** Browser stand-in for `next/link`. The harness renders a real anchor. */
export default function Link({ href, children, prefetch, scroll, replace, legacyBehavior, ...rest }: LinkProps) {
  void prefetch
  void scroll
  void replace
  void legacyBehavior
  const ziel = typeof href === 'string' ? href : (href.pathname ?? '/')
  return (
    <a href={ziel} {...rest}>
      {children}
    </a>
  )
}
