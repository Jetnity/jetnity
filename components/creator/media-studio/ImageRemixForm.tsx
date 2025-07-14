'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase/client';
import { v4 as uuidv4 } from 'uuid';

interface Props {
  sessionId: string;
  userId: string;
  imageUrl: string;
  onRemixDone?: () => void;
}

export default function ImageRemixForm({ sessionId, userId, imageUrl, onRemixDone }: Props) {
  const [prompt, setPrompt] = useState('');
  const [remixing, setRemixing] = useState(false);

  const handleRemix = async () => {
    if (!prompt.trim() || !imageUrl) return;

    setRemixing(true);

    const res = await fetch('/api/remix-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, imageUrl }),
    });

    const result = await res.json();
    const remixedUrl = result?.image_url;

    if (remixedUrl) {
      const imageRes = await fetch(remixedUrl);
      const blob = await imageRes.blob();

      const fileName = `${uuidv4()}.jpg`;
      const uploadPath = `session_${sessionId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('media')
        .upload(uploadPath, blob, {
          cacheControl: '3600',
          upsert: false,
        });

      if (!uploadError) {
        const {
          data: { publicUrl },
        } = supabase.storage.from('media').getPublicUrl(uploadPath);

        await supabase.from('session_media').insert({
          session_id: sessionId,
          user_id: userId,
          image_url: publicUrl,
          is_ai_generated: true,
        });

        if (onRemixDone) onRemixDone();
      }
    }

    setPrompt('');
    setRemixing(false);
  };

  return (
    <div className="space-y-3 border rounded p-4 bg-white">
      <h4 className="text-sm font-medium text-gray-700">🎭 Bild remixen</h4>
      <Input
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="z. B. als Aquarell im Retro-Stil"
        disabled={remixing}
      />
      <Button onClick={handleRemix} disabled={!prompt || remixing} size="sm">
        {remixing ? 'Remixe…' : 'Remix starten'}
      </Button>
    </div>
  );
}
