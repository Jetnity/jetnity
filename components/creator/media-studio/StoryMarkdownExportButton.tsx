'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';

interface Props {
  sessionId: string;
}

export default function StoryMarkdownExportButton({ sessionId }: Props) {
  const [textBlocks, setTextBlocks] = useState<string[]>([]);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
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

    load();
  }, [sessionId]);

  const exportMarkdown = () => {
    const markdown = [
      `# Jetnity Reise-Story`,
      '',
      ...imageUrls.map((url) => `![Bild](${url})`),
      '',
      ...textBlocks.map((text) => text),
    ].join('\n\n');

    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `jetnity-story-${sessionId}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Button onClick={exportMarkdown} disabled={loading}>
      📝 Als Markdown (.md) exportieren
    </Button>
  );
}
