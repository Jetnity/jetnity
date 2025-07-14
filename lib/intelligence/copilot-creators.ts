// lib/intelligence/copilot-creators.ts

export type CopilotCreator = {
  id: string
  name: string
  region: string
  mood: string
  style: string
  avatar: string
}

export const copilotCreators: CopilotCreator[] = [
  {
    id: 'copilot-1',
    name: 'Mira',
    region: 'Thailand',
    mood: 'Abenteuer',
    style: 'Cinematic Travel Photography, HDR, Ultra Wide',
    avatar: 'https://jetnity.ai/static/avatars/mira.png',
  },
  {
    id: 'copilot-2',
    name: 'Luca',
    region: 'Italien',
    mood: 'Romantik',
    style: 'Film Look, Moody Light, Natural Portrait',
    avatar: 'https://jetnity.ai/static/avatars/luca.png',
  },
  {
    id: 'copilot-3',
    name: 'Ayla',
    region: 'Türkei',
    mood: 'Historisch',
    style: 'Golden Hour, Architectual Focus, DSLR-Style',
    avatar: 'https://jetnity.ai/static/avatars/ayla.png',
  },
  {
    id: 'copilot-4',
    name: 'Kenji',
    region: 'Japan',
    mood: 'Ruhe',
    style: 'Minimalism, Soft Color Grading, Fuji Style',
    avatar: 'https://jetnity.ai/static/avatars/kenji.png',
  },
  {
    id: 'copilot-5',
    name: 'Zara',
    region: 'Marokko',
    mood: 'Mystisch',
    style: 'Desert Colors, Travel Portrait, Boho Aesthetic',
    avatar: 'https://jetnity.ai/static/avatars/zara.png',
  },
]
