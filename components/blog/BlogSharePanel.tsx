'use client'

import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { Copy, Facebook, Linkedin, Mail, Share2, Twitter, MessageCircle } from 'lucide-react'
import { toast } from 'sonner'

const shareData = [
  {
    name: 'WhatsApp',
    url: (link: string, title: string) => `https://wa.me/?text=${encodeURIComponent(title + ' ' + link)}`,
    icon: <MessageCircle className="w-5 h-5" />,
    color: 'bg-green-500',
  },
  {
    name: 'X',
    url: (link: string, title: string) => `https://twitter.com/intent/tweet?url=${encodeURIComponent(link)}&text=${encodeURIComponent(title)}`,
    icon: <Twitter className="w-5 h-5" />,
    color: 'bg-black',
  },
  {
    name: 'Facebook',
    url: (link: string, title: string) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}`,
    icon: <Facebook className="w-5 h-5" />,
    color: 'bg-blue-600',
  },
  {
    name: 'LinkedIn',
    url: (link: string, title: string) => `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(link)}&title=${encodeURIComponent(title)}`,
    icon: <Linkedin className="w-5 h-5" />,
    color: 'bg-blue-800',
  },
  {
    name: 'E-Mail',
    url: (link: string, title: string) => `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(link)}`,
    icon: <Mail className="w-5 h-5" />,
    color: 'bg-gray-600',
  },
]

export default function BlogSharePanel({ title }: { title: string }) {
  const pathname = usePathname()
  const [copied, setCopied] = useState(false)
  const fullUrl = typeof window !== 'undefined'
    ? window.location.origin + pathname
    : (process.env.NEXT_PUBLIC_BASE_URL ?? 'https://jetnity.com') + pathname

  const handleCopy = async () => {
    await navigator.clipboard.writeText(fullUrl)
    setCopied(true)
    toast.success('Link kopiert!')
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex flex-wrap gap-3 items-center mt-6 mb-4">
      <Share2 className="w-5 h-5 text-primary" />
      <span className="font-semibold text-sm mr-2">Teilen:</span>
      {shareData.map(s => (
        <a
          key={s.name}
          href={s.url(fullUrl, title)}
          target="_blank"
          rel="noopener noreferrer"
          title={s.name}
          className={`rounded-full p-2 ${s.color} text-white hover:scale-110 transition`}
        >
          {s.icon}
        </a>
      ))}
      <button
        onClick={handleCopy}
        title="Link kopieren"
        className="rounded-full p-2 bg-neutral-300 dark:bg-neutral-700 text-black dark:text-white hover:scale-110 transition"
      >
        <Copy className="w-5 h-5" />
        <span className="sr-only">Link kopieren</span>
      </button>
      {copied && <span className="text-green-600 text-xs ml-2">Link kopiert!</span>}
    </div>
  )
}
