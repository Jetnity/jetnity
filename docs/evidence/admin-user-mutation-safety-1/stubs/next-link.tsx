import * as React from 'react'

type HarnessLinkProps = React.AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string
  prefetch?: boolean
}

export default function Link({ href, children, onClick, prefetch, ...rest }: HarnessLinkProps) {
  void prefetch
  return (
    <a
      href={href}
      {...rest}
      onClick={(event) => {
        event.preventDefault()
        onClick?.(event)
      }}
    >
      {children}
    </a>
  )
}
