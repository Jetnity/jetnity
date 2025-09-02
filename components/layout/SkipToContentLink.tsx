// components/layout/SkipToContentLink.tsx
'use client'

type Props = {
  targetId?: string
  label?: string
  className?: string
}

export default function SkipToContentLink({
  targetId = 'content',
  label = 'Zum Inhalt',
  className = '',
}: Props) {
  return (
    <a
      href={`#${targetId}`}
      className={[
        'sr-only',
        // nur bei Tastaturfokus zeigen
        'focus-visible:not-sr-only focus-visible:fixed focus-visible:z-[10000]',
        'focus-visible:top-3 focus-visible:left-3',
        'focus-visible:rounded-full focus-visible:px-3 focus-visible:py-1.5 focus-visible:text-sm',
        'focus-visible:bg-primary focus-visible:text-primary-foreground',
        'focus-visible:shadow focus-visible:ring-2 focus-visible:ring-primary/30',
        'focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        className,
      ].join(' ')}
    >
      {label}
    </a>
  )
}
