'use client'

import { useCallback, useState } from 'react'

type Props = {
  onFile: (file: File) => void
  accept?: string
}

export default function UploadDropzone({ onFile, accept = 'image/*' }: Props) {
  const [drag, setDrag] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)

  const onDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault(); e.stopPropagation(); setDrag(false)
    const file = e.dataTransfer.files?.[0]
    if (file) { onFile(file); setPreview(URL.createObjectURL(file)) }
  }, [onFile])

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) { onFile(f); setPreview(URL.createObjectURL(f)) }
  }

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDrag(true) }}
      onDragLeave={() => setDrag(false)}
      onDrop={onDrop}
      className={[
        'rounded-xl border-2 border-dashed p-4 cursor-pointer text-sm',
        drag ? 'border-blue-500 bg-blue-50/50' : 'border-neutral-300 hover:bg-neutral-50',
      ].join(' ')}
      onClick={() => document.getElementById('hidden-upload')?.click()}
      role="button"
      aria-label="Datei hochladen"
    >
      {preview ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={preview} alt="Vorschau" className="h-44 w-full object-cover rounded-lg" />
      ) : (
        <div className="text-center text-neutral-600">
          <div className="font-medium">Datei hierher ziehen</div>
          <div className="text-xs">oder klicken, um auszuwählen</div>
        </div>
      )}
      <input id="hidden-upload" type="file" accept={accept} className="hidden" onChange={onChange} />
    </div>
  )
}
