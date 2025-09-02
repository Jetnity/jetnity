// components/blog/BlogSharePanel.tsx
'use client'

import * as React from 'react'
import { usePathname } from 'next/navigation'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import {
  Copy,
  Facebook,
  Linkedin,
  Mail,
  Share2,
  Twitter,
  MessageCircle,
  Send,       // Telegram
  Pin,        // Ersatz für Pinterest (lucide hat kein Brand-Icon)
  Flame,      // Ersatz für Reddit (lucide hat kein Brand-Icon)
  Check,
  Link as LinkIcon,
  Code,
} from 'lucide-react'

type Variant = 'panel' | 'inline' | 'menu'
type Size = 'sm' | 'md'

type Props = {
  title: string
  url?: string
  tags?: string[]
  image?: string | null
  variant?: Variant
  size?: Size
  className?: string
}

const SITE_URL =
  (process.env.NEXT_PUBLIC_SITE_URL || 'https://jetnity.com').replace(/\/+$/, '')

function slugify(input: string) {
  return input
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}

function withUtm(baseUrl: string, src: string, campaign: string) {
  try {
    const u = new URL(baseUrl)
    if (!u.searchParams.has('utm_source')) u.searchParams.set('utm_source', src)
    if (!u.searchParams.has('utm_medium')) u.searchParams.set('utm_medium', 'share')
    if (!u.searchParams.has('utm_campaign')) u.searchParams.set('utm_campaign', campaign)
    return u.toString()
  } catch {
    return baseUrl
  }
}

function useFinalUrl(explicitUrl?: string) {
  const pathname = usePathname()
  const [runtimeUrl, setRuntimeUrl] = React.useState<string | null>(null)
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      setRuntimeUrl(window.location.origin + pathname)
    }
  }, [pathname])
  return explicitUrl || runtimeUrl || `${SITE_URL}${pathname}`
}

function useXHashtags(tags?: string[]) {
  return React.useMemo(() => {
    if (!Array.isArray(tags)) return ''
    return tags
      .slice(0, 4)
      .map((t) => t.replace(/[^A-Za-z0-9_äöüÄÖÜß-]/g, ''))
      .join(',')
  }, [tags])
}

function sizeClasses(size?: Size) {
  return size === 'sm'
    ? 'p-2 [&_svg]:h-4 [&_svg]:w-4 text-[12px]'
    : 'p-2.5 [&_svg]:h-5 [&_svg]:w-5 text-sm'
}

export default function BlogSharePanel({
  title,
  url,
  tags,
  image,
  variant = 'panel',
  size = 'md',
  className,
}: Props) {
  const finalUrl = useFinalUrl(url)
  const campaign = React.useMemo(() => `blog-${slugify(title)}`, [title])
  const xHashtags = useXHashtags(tags)
  const [copiedKey, setCopiedKey] = React.useState<string | null>(null)

  const targets = React.useMemo(
    () => [
      {
        key: 'whatsapp',
        name: 'WhatsApp',
        href: (u: string) => `https://wa.me/?text=${encodeURIComponent(`${title} ${u}`)}`,
        icon: <MessageCircle />,
        className: 'bg-green-500 text-white',
      },
      {
        key: 'x',
        name: 'X',
        href: (u: string) => {
          const base = new URL('https://twitter.com/intent/tweet')
          base.searchParams.set('url', u)
          base.searchParams.set('text', title)
          if (xHashtags) base.searchParams.set('hashtags', xHashtags)
          return base.toString()
        },
        icon: <Twitter />,
        className: 'bg-black text-white',
      },
      {
        key: 'facebook',
        name: 'Facebook',
        href: (u: string) =>
          `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(u)}`,
        icon: <Facebook />,
        className: 'bg-blue-600 text-white',
      },
      {
        key: 'linkedin',
        name: 'LinkedIn',
        href: (u: string) => {
          const base = new URL('https://www.linkedin.com/shareArticle')
          base.searchParams.set('mini', 'true')
          base.searchParams.set('url', u)
          base.searchParams.set('title', title)
          return base.toString()
        },
        icon: <Linkedin />,
        className: 'bg-blue-800 text-white',
      },
      {
        key: 'telegram',
        name: 'Telegram',
        href: (u: string) =>
          `https://t.me/share/url?url=${encodeURIComponent(u)}&text=${encodeURIComponent(title)}`,
        icon: <Send />,
        className: 'bg-sky-600 text-white',
      },
      {
        key: 'reddit',
        name: 'Reddit',
        href: (u: string) =>
          `https://www.reddit.com/submit?url=${encodeURIComponent(u)}&title=${encodeURIComponent(title)}`,
        icon: <Flame />, // Ersatz-Icon
        className: 'bg-orange-600 text-white',
      },
      {
        key: 'pinterest',
        name: 'Pinterest',
        href: (u: string) => {
          const base = new URL('https://pinterest.com/pin/create/button/')
          base.searchParams.set('url', u)
          if (image) base.searchParams.set('media', image)
          base.searchParams.set('description', title)
          return base.toString()
        },
        icon: <Pin />, // Ersatz-Icon
        className: 'bg-red-600 text-white',
      },
      {
        key: 'email',
        name: 'E-Mail',
        href: (u: string) =>
          `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(u)}`,
        icon: <Mail />,
        className: 'bg-gray-600 text-white',
      },
    ],
    [title, xHashtags, image]
  )

  async function copy(text: string, key: string) {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedKey(key)
      toast.success('Kopiert!')
      window.setTimeout(() => setCopiedKey((k) => (k === key ? null : k)), 1600)
    } catch {
      window.prompt('Zum Kopieren (Strg/Cmd+C):', text)
    }
  }

  async function nativeShare() {
    if (typeof navigator !== 'undefined' && 'share' in navigator) {
      try {
        await (navigator as any).share({ title, url: finalUrl })
        return
      } catch {
        /* user cancelled */
      }
    }
    copy(finalUrl, 'link')
  }

  const s = sizeClasses(size)

  if (variant === 'inline') {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        {targets.slice(0, 5).map((t) => {
          const u = withUtm(finalUrl, t.key, campaign)
          return (
            <a
              key={t.key}
              href={t.href(u)}
              target="_blank"
              rel="nofollow noopener noreferrer"
              aria-label={t.name}
              title={t.name}
              className={cn(
                'rounded-full transition hover:scale-110 border border-white/10',
                s,
                t.className
              )}
            >
              {t.icon}
            </a>
          )
        })}
        <button
          type="button"
          onClick={nativeShare}
          title="Teilen"
          aria-label="Teilen"
          className={cn(
            'rounded-full border border-border bg-background hover:bg-muted/40 transition',
            s
          )}
        >
          <Share2 />
        </button>
      </div>
    )
  }

  if (variant === 'menu') {
    return (
      <ShareMenu
        title={title}
        targets={targets}
        campaign={campaign}
        finalUrl={finalUrl}
        sizeClasses={s}
        className={className}
        onCopy={copy}
        onNativeShare={nativeShare}
      />
    )
  }

  // Default: Panel
  return (
    <div className={cn('mt-6 mb-4 flex flex-wrap items-center gap-3', className)}>
      <button
        type="button"
        onClick={nativeShare}
        title="Nativ teilen"
        className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1.5 text-sm hover:bg-muted/40 transition"
      >
        <Share2 className="h-4 w-4" />
        <span className="font-medium">Teilen</span>
      </button>

      <div className="flex flex-wrap items-center gap-2">
        {targets.slice(0, 6).map((t) => {
          const u = withUtm(finalUrl, t.key, campaign)
          return (
            <a
              key={t.key}
              href={t.href(u)}
              target="_blank"
              rel="nofollow noopener noreferrer"
              aria-label={t.name}
              title={t.name}
              className={cn('rounded-full transition hover:scale-110', s, t.className)}
            >
              {t.icon}
            </a>
          )
        })}

        <button
          type="button"
          onClick={() => copy(finalUrl, 'link')}
          aria-label="Link kopieren"
          title="Link kopieren"
          className={cn(
            'rounded-full bg-muted text-foreground hover:scale-110 transition border border-border',
            s
          )}
        >
          {copiedKey === 'link' ? <Check /> : <Copy />}
        </button>
      </div>
    </div>
  )
}

/* ──────────────────────────────────────────────────────────────────────────
   Popover-Menü (Headless)
────────────────────────────────────────────────────────────────────────── */
function ShareMenu({
  title,
  targets,
  campaign,
  finalUrl,
  sizeClasses,
  className,
  onCopy,
  onNativeShare,
}: {
  title: string
  targets: Array<{
    key: string
    name: string
    href: (u: string) => string
    icon: React.ReactNode
    className: string
  }>
  campaign: string
  finalUrl: string
  sizeClasses: string
  className?: string
  onCopy: (text: string, key: string) => void
  onNativeShare: () => void
}) {
  const [open, setOpen] = React.useState(false)
  const btnRef = React.useRef<HTMLButtonElement | null>(null)
  const panelRef = React.useRef<HTMLDivElement | null>(null)

  React.useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') setOpen(false) }
    function onClick(e: MouseEvent) {
      if (!open) return
      const t = e.target as Node
      if (panelRef.current && !panelRef.current.contains(t) &&
          btnRef.current && !btnRef.current.contains(t)) {
        setOpen(false)
      }
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onClick, true)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('mousedown', onClick, true)
    }
  }, [open])

  return (
    <div className={cn('relative inline-flex', className)}>
      <button
        ref={btnRef}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1.5 text-sm hover:bg-muted/40 transition"
      >
        <Share2 className="h-4 w-4" />
        <span className="font-medium">Teilen</span>
      </button>

      {open && (
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="false"
          className="absolute right-0 z-[100] mt-2 w-80 rounded-2xl border border-border bg-card p-3 shadow-e3"
        >
          <div className="grid grid-cols-4 gap-2">
            {targets.map((t) => {
              const u = withUtm(finalUrl, t.key, campaign)
              return (
                <a
                  key={t.key}
                  href={t.href(u)}
                  target="_blank"
                  rel="nofollow noopener noreferrer"
                  className={cn(
                    'flex flex-col items-center justify-center rounded-xl px-2 py-2 transition hover:scale-105 text-white',
                    t.className
                  )}
                >
                  <span className={cn('rounded-full mb-1', sizeClasses)}>{t.icon}</span>
                  <span className="text-xs text-white/95">{t.name}</span>
                </a>
              )
            })}
          </div>

          <div className="my-3 h-px bg-border" />

          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => onCopy(finalUrl, 'link')}
              className="flex items-center justify-center gap-2 rounded-xl border border-border bg-muted px-3 py-2 text-sm hover:bg-muted/60"
              title="Link kopieren"
            >
              <LinkIcon className="h-4 w-4" />
              Link
            </button>
            <button
              onClick={() => onCopy(`[${title}](${finalUrl})`, 'md')}
              className="flex items-center justify-center gap-2 rounded-xl border border-border bg-muted px-3 py-2 text-sm hover:bg-muted/60"
              title="Markdown kopieren"
            >
              <Code className="h-4 w-4" />
              MD
            </button>
            <button
              onClick={() => onCopy(`<a href="${finalUrl}">${title}</a>`, 'html')}
              className="flex items-center justify-center gap-2 rounded-xl border border-border bg-muted px-3 py-2 text-sm hover:bg-muted/60"
              title="HTML kopieren"
            >
              <Copy className="h-4 w-4" />
              HTML
            </button>
          </div>

          <div className="mt-3 flex items-center justify-between">
            <button
              onClick={() => { onNativeShare(); setOpen(false) }}
              className="rounded-xl bg-primary px-3 py-2 text-sm font-medium text-white btn-premium"
            >
              Nativ teilen
            </button>
            <button
              onClick={() => setOpen(false)}
              className="rounded-xl border border-border px-3 py-2 text-sm hover:bg-muted/40"
            >
              Schließen
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
