'use client';

import Image from 'next/image';
import { Card, CardContent, CardHeader } from '@/components/ui/card'; // ✅ Pfad beibehalten, aber kontrolliere lowercase-Dateinamen
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils/formatDate'; // ✅ zentrale Funktion für Datum

interface MediaItemCardProps {
  imageUrl: string;
  createdAt: string | null; // optional abgesichert
  isAiGenerated?: boolean;
  description?: string;
  tags?: string[];
}

export default function MediaItemCard({
  imageUrl,
  createdAt,
  isAiGenerated = false,
  description,
  tags = [],
}: MediaItemCardProps) {
  const fallbackDescription = isAiGenerated
    ? 'AI-generiertes Bild einer tropischen Küstenlandschaft bei Sonnenuntergang.'
    : 'Benutzerbild – mögliche Aufnahme einer Reise mit natürlichem Hintergrund.';

  const visibleDescription = description || fallbackDescription;
  const visibleTags = tags.length ? tags : isAiGenerated ? ['KI', 'Sonne', 'Küste'] : ['Reise', 'User'];

  return (
    <Card className="overflow-hidden">
      <CardHeader className="p-0">
        <div className="relative aspect-video w-full">
          <Image
            src={imageUrl}
            alt="Reisebild"
            fill
            className="object-cover"
            sizes="100vw"
            loading="lazy"
          />
        </div>
      </CardHeader>

      <CardContent className="p-4 space-y-2">
        <p className="text-sm text-muted-foreground">
          <span className="font-medium">{isAiGenerated ? 'KI-Bild' : 'Upload'}</span> ·{' '}
          {formatDate(createdAt)}
        </p>

        <p className="text-sm">{visibleDescription}</p>

        <div className="flex flex-wrap gap-2 pt-2">
          {visibleTags.map((tag) => (
            <Badge key={tag} variant="outline">
              {tag}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
