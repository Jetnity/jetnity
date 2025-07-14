import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function POST(req: Request) {
  try {
    const { snippetContent } = await req.json();

    if (!snippetContent || snippetContent.length < 5) {
      return NextResponse.json({ error: 'Invalid snippet content' }, { status: 400 });
    }

    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      stream: false,
      messages: [
        {
          role: 'system',
          content:
            'Du bist ein kreativer Co-Creator für eine Reiseplattform. Analysiere den Snippet-Inhalt und formuliere einen passenden, kurzen Kommentar oder Rückfrage zur Verbesserung oder Ergänzung.',
        },
        {
          role: 'user',
          content: `Snippet: ${snippetContent}`,
        },
      ],
      temperature: 0.7,
      max_tokens: 150,
    });

    const aiComment = response.choices[0].message.content;
    return NextResponse.json({ aiComment });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Kommentar-Generierung fehlgeschlagen' }, { status: 500 });
  }
}
