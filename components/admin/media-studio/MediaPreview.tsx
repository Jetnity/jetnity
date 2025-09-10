'use client';

type Props = { url: string | null };

export default function MediaPreview({ url }: Props) {
  if (!url) {
    return (
      <div className="aspect-video w-full grid place-items-center bg-muted text-sm text-muted-foreground">
        Keine Preview verfügbar
      </div>
    );
  }

  const u = url.toLowerCase();
  const isVideo = /\.mp4($|\?)/i.test(u) || u.includes('video');
  const isAudio = /\.mp3($|\?)/i.test(u) || u.includes('audio');

  if (isVideo) return <video src={url} controls className="w-full aspect-video bg-black" />;
  if (isAudio) return <div className="p-6"><audio src={url} controls className="w-full" /></div>;
  return <img src={url} alt="Preview" className="w-full object-cover aspect-video" />;
}
