'use client'
export default function CompareView({ leftSrc, rightSrc }:{ leftSrc:string; rightSrc:string }){
  return (
    <div className="relative w-full overflow-hidden rounded-xl border">
      <div className="grid grid-cols-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={leftSrc} alt="Left" className="aspect-video w-full object-contain bg-black" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={rightSrc} alt="Right" className="aspect-video w-full object-contain bg-black" />
      </div>
    </div>
  )
}
