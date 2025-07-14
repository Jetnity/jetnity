import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: 'Kein Prompt angegeben' }, { status: 400 });
    }

    const response = await openai.images.generate({
      prompt,
      n: 1,
      size: '1024x1024',
      response_format: 'url',
    });

    const image_url =
      Array.isArray(response.data) && response.data.length > 0
        ? response.data[0]?.url
        : null;

    if (!image_url) {
      return NextResponse.json(
        { error: 'Keine Bild-URL generiert' },
        { status: 500 }
      );
    }

    return NextResponse.json({ image_url });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: 'Bildgenerierung fehlgeschlagen' },
      { status: 500 }
    );
  }
}
