import { NextResponse } from 'next/server'
export async function POST(req: Request){
  const { brief } = await req.json().catch(()=>({}))
  const prompt = `Gib 5 kurze, prägnante Titelideen für ein Social-Video. Thema: ${brief||'Allgemein'}.`
  const r = await fetch('https://api.openai.com/v1/chat/completions',{
    method:'POST',
    headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${process.env.OPENAI_API_KEY!}` },
    body: JSON.stringify({ model:'gpt-4o-mini', messages:[{role:'user', content: prompt}] })
  })
  const j:any = await r.json()
  const text = j.choices?.[0]?.message?.content ?? ''
interface OpenAIChoice {
    message?: {
        content?: string;
    };
}

interface OpenAIResponse {
    choices?: OpenAIChoice[];
}

const ideas: string[] = text
    .split('\n')
    .map((s: string) => s.replace(/^\d+[\).\s-]*/, ''))
    .filter(Boolean)
    .slice(0, 5);
  return NextResponse.json({ ideas })
}
