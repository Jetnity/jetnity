'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

export default function BlogEditor() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [cover, setCover] = useState('')
  const [seoTitle, setSeoTitle] = useState('')
  const [seoDescription, setSeoDescription] = useState('')
  const [loading, setLoading] = useState(false)

  // Tag hinzufügen/entfernen
  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && e.currentTarget.value.trim()) {
      if (!tags.includes(e.currentTarget.value.trim())) {
        setTags([...tags, e.currentTarget.value.trim()])
      }
      e.currentTarget.value = ''
    }
  }
  const removeTag = (tag: string) => setTags(tags.filter((t) => t !== tag))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title || !content) {
      toast.error('Titel und Inhalt sind erforderlich.')
      return
    }
    setLoading(true)

    // Slug automatisch erzeugen
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '')

    // Einfügen
    const { error } = await supabase.from('blog_posts').insert({
      title,
      slug,
      content,
      tags,
      cover_image: cover || null,
      status: 'draft', // Standard: Entwurf
      seo_title: seoTitle || title,
      seo_description: seoDescription || '',
    })

    setLoading(false)
    if (error) {
      toast.error('Fehler beim Speichern des Blogposts.')
    } else {
      toast.success('Blogpost gespeichert!')
      // Optional: zurück zur Blog-Liste
      router.refresh()
      setTitle('')
      setContent('')
      setTags([])
      setCover('')
      setSeoTitle('')
      setSeoDescription('')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white dark:bg-neutral-950 rounded-2xl shadow-lg p-8 flex flex-col gap-5 max-w-2xl">
      <h2 className="text-2xl font-bold mb-2">Neuen Blogpost verfassen</h2>
      <input
        type="text"
        className="border px-3 py-2 rounded-lg text-lg"
        placeholder="Titel*"
        value={title}
        onChange={e => setTitle(e.target.value)}
        required
      />
      <textarea
        className="border px-3 py-2 rounded-lg min-h-[180px] font-mono"
        placeholder="Inhalt (Markdown oder HTML)*"
        value={content}
        onChange={e => setContent(e.target.value)}
        required
      />
      <input
        type="text"
        className="border px-3 py-2 rounded-lg"
        placeholder="Cover Image URL"
        value={cover}
        onChange={e => setCover(e.target.value)}
      />
      <div>
        <div className="flex gap-2 flex-wrap mb-2">
          {tags.map(tag => (
            <Badge key={tag} variant="secondary" className="cursor-pointer" onClick={() => removeTag(tag)}>
              {tag} ×
            </Badge>
          ))}
        </div>
        <input
          type="text"
          className="border px-3 py-2 rounded-lg"
          placeholder="Tag eingeben & Enter"
          onKeyDown={handleTagKeyDown}
        />
      </div>
      <input
        type="text"
        className="border px-3 py-2 rounded-lg"
        placeholder="SEO-Titel (optional)"
        value={seoTitle}
        onChange={e => setSeoTitle(e.target.value)}
      />
      <input
        type="text"
        className="border px-3 py-2 rounded-lg"
        placeholder="SEO-Beschreibung (optional)"
        value={seoDescription}
        onChange={e => setSeoDescription(e.target.value)}
      />
      <button
        type="submit"
        className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-6 rounded-xl font-bold"
        disabled={loading}
      >
        {loading ? 'Speichern…' : 'Speichern als Entwurf'}
      </button>
    </form>
  )
}
