'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Dialog } from '@headlessui/react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { marked } from 'marked'
import type { Tables, Database } from '@/types/supabase'

type BlogPost = Tables<'blog_posts'>
type BlogUpdate = Database['public']['Tables']['blog_posts']['Update']

type BlogEditModalProps = {
  post: BlogPost
  onClose: () => void
  onUpdate: (updated: BlogPost) => void
}

export default function BlogEditModal({ post, onClose, onUpdate }: BlogEditModalProps) {
  const [title, setTitle] = useState(post.title || '')
  const [content, setContent] = useState(post.content || '')
  const [tags, setTags] = useState<string[]>(post.tags ?? [])
  const [cover, setCover] = useState(post.cover_image || '')
  const [seoTitle, setSeoTitle] = useState(post.seo_title || '')
  const [seoDescription, setSeoDescription] = useState(post.seo_description || '')
  const [loading, setLoading] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [previewHtml, setPreviewHtml] = useState('')

  useEffect(() => {
    let active = true
    if (showPreview) {
      const res = marked.parse(content)
      if (res instanceof Promise) {
        res.then((html) => active && setPreviewHtml(String(html)))
      } else {
        setPreviewHtml(String(res))
      }
    }
    return () => {
      active = false
    }
  }, [showPreview, content])

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && e.currentTarget.value.trim()) {
      const t = e.currentTarget.value.trim()
      if (!tags.includes(t)) setTags((s) => [...s, t])
      e.currentTarget.value = ''
    }
  }
  const removeTag = (tag: string) => setTags((s) => s.filter((t) => t !== tag))

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!title || !content) {
      toast.error('Titel und Inhalt sind erforderlich.')
      return
    }

    setLoading(true)
    const payload: BlogUpdate = {
      title,
      content,
      tags,
      cover_image: cover || null,
      seo_title: seoTitle || title,
      seo_description: seoDescription || '',
    }

    const { data, error } = await supabase
      .from('blog_posts')
      .update(payload)
      .eq('id', post.id)
      .select()
      .maybeSingle()

    setLoading(false)

    if (error || !data) {
      console.error(error)
      toast.error('Fehler beim Speichern.')
      return
    }

    toast.success('Blogpost aktualisiert!')
    onUpdate({
      ...post,
      ...data,
    })
    onClose()
  }

  return (
    <Dialog open={true} onClose={onClose} className="fixed z-50 inset-0 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/40" aria-hidden="true" />
      <div className="relative bg-white dark:bg-neutral-950 rounded-2xl shadow-lg p-6 md:p-8 max-w-2xl w-full z-10">
        <Dialog.Title className="text-xl font-bold mb-4">Blogpost bearbeiten</Dialog.Title>
        <form onSubmit={handleSave} className="flex flex-col gap-5">
          <input
            type="text"
            className="border px-3 py-2 rounded-lg text-lg w-full"
            placeholder="Titel*"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />

          <div>
            <textarea
              className="border px-3 py-2 rounded-lg min-h-[140px] font-mono w-full"
              placeholder="Inhalt (Markdown oder HTML)*"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
            />
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="mt-2"
              onClick={() => setShowPreview((v) => !v)}
            >
              {showPreview ? 'Bearbeiten' : 'Live-Vorschau'}
            </Button>
            {showPreview && (
              <div
                className="prose dark:prose-invert bg-neutral-100 dark:bg-neutral-900 mt-4 p-4 rounded-xl overflow-auto max-h-72"
                dangerouslySetInnerHTML={{ __html: previewHtml }}
              />
            )}
          </div>

          <input
            type="url"
            className="border px-3 py-2 rounded-lg w-full"
            placeholder="Cover Image URL"
            value={cover}
            onChange={(e) => setCover(e.target.value)}
          />

          <div>
            <div className="flex gap-2 flex-wrap mb-2">
              {tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="cursor-pointer" onClick={() => removeTag(tag)}>
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

          <div className="flex gap-4 justify-end">
            <Button type="button" variant="outline" onClick={onClose}>
              Abbrechen
            </Button>
            <Button type="submit" variant="primary" isLoading={loading} loadingText="Speichere…">
              Speichern
            </Button>
          </div>
        </form>
      </div>
    </Dialog>
  )
}
