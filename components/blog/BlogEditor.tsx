'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export default function BlogEditor() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [coverUrl, setCoverUrl] = useState('')
  const [seoTitle, setSeoTitle] = useState('')
  const [seoDescription, setSeoDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)

  // Tag hinzufügen/entfernen
  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && e.currentTarget.value.trim()) {
      const t = e.currentTarget.value.trim()
      if (!tags.includes(t)) setTags((prev) => [...prev, t])
      e.currentTarget.value = ''
    }
  }
  const removeTag = (tag: string) => setTags((s) => s.filter((t) => t !== tag))

  // Optionaler Cover-Upload in Supabase Storage (Bucket z.B. "blog")
  async function onSelectCover(file?: File) {
    if (!file) return
    setUploading(true)
    try {
      const ext = file.name.split('.').pop() || 'jpg'
      const path = `covers/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

      const { error: upErr } = await supabase.storage.from('blog').upload(path, file, {
        cacheControl: '3600',
        upsert: false,
      })
      if (upErr) throw upErr

      const { data: pub } = supabase.storage.from('blog').getPublicUrl(path)
      setCoverUrl(pub.publicUrl)
      toast.success('Cover hochgeladen')
    } catch (e) {
      console.error(e)
      toast.error('Upload fehlgeschlagen')
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title || !content) {
      toast.error('Titel und Inhalt sind erforderlich.')
      return
    }
    setLoading(true)

    // Slug erzeugen
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '')

    const { error } = await supabase.from('blog_posts').insert({
      title,
      slug,
      content,
      tags,
      cover_image: coverUrl || null,
      status: 'draft',
      seo_title: seoTitle || title,
      seo_description: seoDescription || '',
    })

    setLoading(false)
    if (error) {
      console.error(error)
      toast.error('Fehler beim Speichern des Blogposts.')
      return
    }

    toast.success('Blogpost gespeichert!')
    router.refresh()
    setTitle('')
    setContent('')
    setTags([])
    setCoverUrl('')
    setSeoTitle('')
    setSeoDescription('')
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white dark:bg-neutral-950 rounded-2xl shadow-lg p-6 md:p-8 space-y-5 max-w-2xl">
      <h2 className="text-2xl font-bold">Neuen Blogpost verfassen</h2>

      <input
        type="text"
        className="border px-3 py-2 rounded-lg text-lg w-full"
        placeholder="Titel*"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
      />

      <textarea
        className="border px-3 py-2 rounded-lg min-h-[180px] font-mono w-full"
        placeholder="Inhalt (Markdown oder HTML)*"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        required
      />

      {/* Cover: URL oder Upload */}
      <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
        <input
          type="url"
          className="border px-3 py-2 rounded-lg w-full"
          placeholder="Cover Image URL (optional)"
          value={coverUrl}
          onChange={(e) => setCoverUrl(e.target.value)}
        />
        <label className={cn('inline-flex items-center justify-center')}>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => onSelectCover(e.target.files?.[0] || undefined)}
          />
          <Button type="button" variant="outline" isLoading={uploading}>
            Bild hochladen
          </Button>
        </label>
      </div>

      <div>
        <div className="flex gap-2 flex-wrap mb-2">
          {tags.map((tag) => (
            <Badge
              key={tag}
              variant="secondary"
              className="cursor-pointer"
              onClick={() => removeTag(tag)}
              title="Tag entfernen"
            >
              {tag} ×
            </Badge>
          ))}
        </div>
        <input
          type="text"
          className="border px-3 py-2 rounded-lg w-full"
          placeholder="Tag eingeben & Enter"
          onKeyDown={handleTagKeyDown}
        />
      </div>

      <input
        type="text"
        className="border px-3 py-2 rounded-lg w-full"
        placeholder="SEO-Titel (optional)"
        value={seoTitle}
        onChange={(e) => setSeoTitle(e.target.value)}
      />
      <input
        type="text"
        className="border px-3 py-2 rounded-lg w-full"
        placeholder="SEO-Beschreibung (optional)"
        value={seoDescription}
        onChange={(e) => setSeoDescription(e.target.value)}
      />

      <div className="flex items-center gap-3">
        <Button type="submit" variant="primary" isLoading={loading} loadingText="Speichere…">
          Speichern als Entwurf
        </Button>
        {coverUrl ? (
          <a href={coverUrl} target="_blank" rel="noreferrer" className="text-sm text-blue-600 hover:underline">
            Cover ansehen
          </a>
        ) : null}
      </div>
    </form>
  )
}
