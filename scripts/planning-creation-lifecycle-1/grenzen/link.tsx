import type { ReactNode } from 'react'

export default function Link({
  href,
  children,
  ...rest
}: {
  href?: string
  children?: ReactNode
  className?: string
}) {
  return (
    <a href={typeof href === 'string' ? href : ''} {...rest}>
      {children}
    </a>
  )
}
