import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function POST(req: Request) {
  try {
    const { imageUrl, prompt } = await req.json();

    if (!imageUrl || !prompt) {
      return NextResponse.json({ error: 'Fehlende Parameter' }, { status: 400 });
    }

    const imageBlob = await fetch(imageUrl).then(r => r.blob());

    const response = await openai.images.edit({
      image: imageBlob,
      prompt,
      n: 1,
      size: '1024x1024',
      response_format: 'url',
    });

    const image_url = Array.isArray(response.data) && response.data.length > 0 ? response.data[0]?.url : undefined;

    return NextResponse.json({ image_url });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Remix fehlgeschlagen' }, { status: 500 });
  }
}
