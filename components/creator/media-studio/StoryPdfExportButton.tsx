'use client';

import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import html2pdf from 'html2pdf.js';

interface StoryPdfExportButtonProps {
  sessionId: string;
}

export default function StoryPdfExportButton({ sessionId }: StoryPdfExportButtonProps) {
  const [textBlocks, setTextBlocks] = useState<string[]>([]);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadContent = async () => {
      const { data: snippets } = await supabase
        .from('session_snippets')
        .select('content')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      const { data: media } = await supabase
        .from('session_media')
        .select('image_url')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      setTextBlocks(snippets?.map((s) => s.content) || []);
      setImageUrls(media?.map((m) => m.image_url) || []);
      setLoading(false);
    };

    loadContent();
  }, [sessionId]);

  const handleExportPdf = () => {
    if (!contentRef.current) return;

    html2pdf()
      .from(contentRef.current)
      .set({
        margin: 10,
        filename: `jetnity-story-${sessionId}.pdf`,
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      })
      .save();
  };

  return (
    <div className="space-y-4">
      <Button onClick={handleExportPdf} disabled={loading}>
        📄 Als PDF exportieren
      </Button>

      <div ref={contentRef} className="hidden">
        <div style={{ fontFamily: 'sans-serif', padding: '20px' }}>
          {imageUrls.map((url, i) => (
            <img
              key={i}
              src={url}
              style={{ width: '100%', margin: '16px 0', borderRadius: '8px' }}
            />
          ))}
          {textBlocks.map((text, i) => (
            <p key={i} style={{ marginBottom: '12px' }}>
              {text}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}
