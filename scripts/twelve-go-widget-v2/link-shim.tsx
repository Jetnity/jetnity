import { type AnchorHTMLAttributes, type ReactNode } from 'react'

export default function Link({
  href,
  children,
  ...rest
}: { href?: string; children?: ReactNode } & AnchorHTMLAttributes<HTMLAnchorElement>) {
  return <a href={typeof href === 'string' ? href : '#'} {...rest}>{children}</a>
}
