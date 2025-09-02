'use client'
import * as React from 'react'

export default function MaskEditor({
  src,
  onSaved
}:{ src:string; onSaved:(maskUrl:string)=>void }) {
  const canvasRef = React.useRef<HTMLCanvasElement|null>(null)
  const imgRef = React.useRef<HTMLImageElement|null>(null)
  const [drawing,setDrawing]=React.useState(false)

  React.useEffect(()=>{
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.src = src
    img.onload = ()=> {
      imgRef.current = img
      const c = canvasRef.current!
      c.width = img.width
      c.height = img.height
      const ctx = c.getContext('2d')!
      ctx.drawImage(img,0,0)
      // Mask-Layer initial leer (transparent)
    }
  },[src])

  const onPointer = (e: React.PointerEvent) => {
    const c = canvasRef.current!
    const ctx = c.getContext('2d')!
    const rect = c.getBoundingClientRect()
    const x = (e.clientX - rect.left) * (c.width/rect.width)
    const y = (e.clientY - rect.top) * (c.height/rect.height)

    if (e.type === 'pointerdown') { setDrawing(true); ctx.beginPath(); ctx.moveTo(x,y) }
    else if (e.type === 'pointermove' && drawing) { ctx.lineTo(x,y); ctx.strokeStyle='rgba(255,0,0,0.9)'; ctx.lineWidth=28; ctx.lineCap='round'; ctx.stroke(); }
    else if (e.type === 'pointerup' || e.type==='pointerleave') { setDrawing(false) }
  }

  const saveMask = async () => {
    const c = canvasRef.current!
    // Mask = rote Striche → binär (weiß=zu entfernen)
    const mask = document.createElement('canvas')
    mask.width = c.width; mask.height = c.height
    const mctx = mask.getContext('2d')!
    mctx.fillStyle='black'; mctx.fillRect(0,0,mask.width,mask.height)
    mctx.drawImage(c,0,0)
    const imgData = mctx.getImageData(0,0,mask.width,mask.height)
    // alle roten Pixel => weiß
    for (let i=0;i<imgData.data.length;i+=4){
      const r = imgData.data[i]
      const g = imgData.data[i+1]
      const b = imgData.data[i+2]
      const a = imgData.data[i+3]
      const mark = r>200 && g<80 && b<80 && a>100
      imgData.data[i]=imgData.data[i+1]=imgData.data[i+2]= mark ? 255 : 0
      imgData.data[i+3]=255
    }
    mctx.putImageData(imgData,0,0)
    const blob = await new Promise<Blob>((res)=>mask.toBlob((b)=>res(b!), 'image/png'))
    const form = new FormData()
    form.append('file', blob, 'mask.png')
    const r = await fetch('/api/media/mask', { method:'POST', body: form })
    const j = await r.json()
    onSaved(j.url)
  }

  return (
    <div className="space-y-2">
      <canvas
        ref={canvasRef}
        className="w-full rounded border"
        onPointerDown={onPointer} onPointerMove={onPointer} onPointerUp={onPointer} onPointerLeave={onPointer}
      />
      <div className="flex gap-2">
        <button onClick={saveMask} className="rounded-md border px-3 py-1.5 text-sm hover:bg-accent">Maske speichern</button>
        <span className="text-xs text-muted-foreground">Ziehe in Rot über das zu entfernende Objekt.</span>
      </div>
    </div>
  )
}
