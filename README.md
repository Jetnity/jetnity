# Jetnity

Modulare Reiseplattform mit Next.js 14, Supabase, shadcn/ui und OpenAI.

## Setup

1. **Dependencies**
   ```bash
   npm i

## 🔐 Environment Setup (.env.local)

> **Wichtig:** `.env.local` wird **nie** committet. Werte nur team-intern teilen (z. B. Passwortmanager).  
> Für Deployments müssen die Variablen zusätzlich im Hosting (z. B. Vercel → Project Settings → Environment Variables) hinterlegt werden.

### 1) Datei anlegen
Kopiere die Vorlage:
```bash
cp .env.example .env.local
