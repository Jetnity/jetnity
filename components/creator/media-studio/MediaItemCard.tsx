'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Checkbox } from '@/components/ui/checkbox'
import { formatDate } from '@/lib/utils/formatDate'
import { supabase } from '@/lib/supabase/client'
import { cn as _cn } from '@/lib/utils'
import {
  ExternalLink,
  Download as DownloadIcon,
  Copy,
  Star,
  StarOff,
  MoreVertical,
  Wand2,
  Eye,
  AlertTriangle,
} from 'lucide-react'

const cn = typeof _cn === 'function' ? _cn : (...a: any[]) => a.filter(Boolean).join(' ')

type Props = {
  id?: string
  /** http(s)/data: oder "bucket/path/filename.ext" */
  imageUrl: string
  createdAt?: string | null
  isAiGenerated?: boolean
  description?: string | null
  tags?: string[] | null

  className?: string
  selectable?: boolean
  selected?: boolean
  favorite?: boolean

  onOpen?: (id?: string) => void
  /** Pflicht-Param zuerst → TS1016 vermeiden */
  onToggleFavorite?: (next: boolean, id?: string) => void
  onSelectChange?: (next: boolean, id?: string) => void
  onDelete?: (id?: string) => void
  onRemix?: (id?: string) => void
  onDownload?: (url: string, id?: string) => void
}

export default function MediaItemCard({
  id,
  imageUrl,
  createdAt = null,
  isAiGenerated = false,
  description,
  tags = [],
  className,
  selectable = false,
  selected = false,
  favorite = false,
  onOpen,
  onToggleFavorite,
  onSelectChange,
  onDelete,
  onRemix,
  onDownload,
}: Props) {
  const fallbackDescription = isAiGenerated
    ? 'KI-generiertes Bild (automatische Beschreibung).'
    : 'Benutzer-Upload.'
  const visibleDescription = (description ?? '').trim() || fallbackDescription
  const visibleTags = (tags ?? []).length ? (tags as string[]) : isAiGenerated ? ['KI', 'Remix'] : ['Upload']

  // Bildquelle ggf. signieren (private Buckets)
  const isDirectUrl = /^https?:\/\//i.test(imageUrl) || imageUrl.startsWith('data:')
  const [signedUrl, setSignedUrl] = useState<string | null>(isDirectUrl ? imageUrl : null)
  const displayUrl = signedUrl ?? imageUrl

  useEffect(() => {
    let cancelled = false
    async function signIfNeeded() {
      if (isDirectUrl) return
      const [bucket, ...rest] = imageUrl.split('/')
      const path = rest.join('/')
      if (!bucket || !path) return
      const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, 60 * 30)
      if (!cancelled) setSignedUrl(error ? null : data?.signedUrl ?? null)
    }
    signIfNeeded()
    return () => {
      cancelled = true
    }
  }, [imageUrl, isDirectUrl])

  const [imgLoaded, setImgLoaded] = useState(false)
  const [imgError, setImgError] = useState<string | null>(null)
  const [fav, setFav] = useState(!!favorite)
  const [isSelected, setIsSelected] = useState(!!selected)

  useEffect(() => setFav(!!favorite), [favorite])
  useEffect(() => setIsSelected(!!selected), [selected])

  const handleOpen = () => onOpen?.(id)
  const handleFavToggle = () => {
    const next = !fav
    setFav(next)
    onToggleFavorite?.(next, id)
  }
  const handleSelectToggle = () => {
    const next = !isSelected
    setIsSelected(next)
    onSelectChange?.(next, id)
  }
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(displayUrl)
    } catch {}
  }
  const handleDownload = () => {
    onDownload?.(displayUrl, id)
    const a = document.createElement('a')
    a.href = displayUrl
    a.download = (id ?? 'image') + guessExt(displayUrl)
    document.body.appendChild(a)
    a.click()
    a.remove()
  }
  const handleOpenNew = () => window.open(displayUrl, '_blank', 'noopener,noreferrer')
  const handleRemixClick = () => onRemix?.(id)

  const metaLine = useMemo(() => {
    const parts = [isAiGenerated ? 'KI-Bild' : 'Upload']
    if (createdAt) parts.push(formatDate(createdAt))
    return parts.join(' · ')
  }, [isAiGenerated, createdAt])

  return (
    <Card
      tabIndex={0}
      onDoubleClick={handleOpen}
      onKeyDown={(e) => {
        if (e.key === 'Enter') handleOpen()
        if (e.key.toLowerCase() === 'f') handleFavToggle()
        if (e.key === ' ') {
          e.preventDefault()
          if (selectable) handleSelectToggle()
        }
      }}
      className={cn(
        'group relative overflow-hidden outline-none transition',
        isSelected && 'ring-2 ring-primary',
        className
      )}
      aria-label={visibleDescription}
    >
      <CardHeader className="relative p-0">
        <div className="relative w-full aspect-[4/3] bg-muted">
          {!imgLoaded && !imgError && <div className="absolute inset-0 animate-pulse bg-muted/50" />}

          {imgError ? (
            <div className="absolute inset-0 grid place-content-center text-muted-foreground">
              <AlertTriangle className="h-6 w-6 mb-2" />
              <span className="text-xs">Bild konnte nicht geladen werden</span>
            </div>
          ) : (
            <Image
              src={displayUrl}
              alt={visibleDescription}
              fill
              sizes="(max-width: 768px) 100vw, 33vw"
              className={cn('object-cover transition', imgLoaded ? 'opacity-100' : 'opacity-0')}
              onLoadingComplete={() => setImgLoaded(true)}
              onError={() => setImgError('load-failed')}
              priority={false}
            />
          )}

          {/* Badges */}
          <div className="pointer-events-none absolute left-2 top-2 flex flex-wrap gap-1">
            {isAiGenerated && <Badge variant="secondary">KI</Badge>}
            {visibleTags.slice(0, 2).map((t) => (
              <Badge key={t} variant="outline">
                {t}
              </Badge>
            ))}
            {visibleTags.length > 2 && <Badge variant="outline">+{visibleTags.length - 2}</Badge>}
          </div>

          {/* Hover-Actions */}
          <div className="absolute inset-x-0 bottom-2 flex items-center justify-between px-2 opacity-0 transition group-hover:opacity-100">
            <div className="flex items-center gap-2">
              {selectable && (
                <div className="rounded-md bg-background/80 p-1 backdrop-blur">
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => handleSelectToggle()}
                    aria-label="Auswählen"
                  />
                </div>
              )}
            </div>

            <div className="flex items-center gap-1 rounded-md bg-background/80 p-1 backdrop-blur">
              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={handleOpen} title="Öffnen/Vorschau">
                <Eye className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={handleRemixClick} title="Remix">
                <Wand2 className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8"
                onClick={handleFavToggle}
                title={fav ? 'Favorit entfernen' : 'Als Favorit markieren'}
              >
                {fav ? <Star className="h-4 w-4" /> : <StarOff className="h-4 w-4" />}
              </Button>
              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={handleDownload} title="Download">
                <DownloadIcon className="h-4 w-4" />
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="icon" variant="ghost" className="h-8 w-8" aria-label="Weitere Aktionen" title="Mehr">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44">
                  <DropdownMenuLabel>Aktionen</DropdownMenuLabel>
                  <DropdownMenuItem onClick={handleCopy}>
                    <Copy className="mr-2 h-4 w-4" /> Link kopieren
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleOpenNew}>
                    <ExternalLink className="mr-2 h-4 w-4" /> In neuem Tab öffnen
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => onDelete?.(id)} className="text-destructive">
                    Löschen
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4">
        <p className="text-xs text-muted-foreground mb-1">{metaLine}</p>
        <p className="line-clamp-2 text-sm">{visibleDescription}</p>
        {!isAiGenerated && visibleTags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {visibleTags.slice(0, 4).map((t) => (
              <Badge key={t} variant="outline">
                {t}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function guessExt(u: string) {
  const m = /\.([a-z0-9]+)(?:\?|#|$)/i.exec(u)
  return m ? `.${m[1].toLowerCase()}` : '.png'
}
