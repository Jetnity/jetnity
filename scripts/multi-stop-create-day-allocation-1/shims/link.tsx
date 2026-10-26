import type { ReactNode } from 'react'

export default function Link({
  href,
  children,
  ...rest
}: {
  href: string
  children?: ReactNode
  className?: string
}) {
  return (
    <a href={href} {...rest}>
      {children}
    </a>
  )
}
