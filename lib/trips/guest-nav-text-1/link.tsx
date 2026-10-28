import type { AnchorHTMLAttributes, ReactNode } from 'react'

type LinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string
  children?: ReactNode
}

/** Test shim for `next/link`. The harness renders a real anchor. */
export default function Link({ href, children, ...rest }: LinkProps) {
  return (
    <a href={href} {...rest}>
      {children}
    </a>
  )
}
