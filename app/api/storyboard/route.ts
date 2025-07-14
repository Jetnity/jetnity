import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  const { script } = await req.json();

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content:
            "Du bist ein kreativer Video-Storyboard-Generator für eine Reiseplattform. Antworte ausschließlich mit einer JSON-Liste von Szenenbeschreibungen.",
        },
        {
          role: "user",
          content: `Erstelle ein Video-Storyboard basierend auf dem folgenden Thema:\n\n${script}`,
        },
      ],
    });

    const raw = completion.choices[0].message.content || "[]";
    let scenes = [];
    try {
      scenes = JSON.parse(raw);
    } catch {
      scenes = [];
    }

    return NextResponse.json({ scenes });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ scenes: [] }, { status: 500 });
  }
}
