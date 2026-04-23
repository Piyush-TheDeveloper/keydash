# ⌨️ KeyDash — Real-time Typing Race

Next.js 14 + Supabase Realtime + Zustand + Framer Motion + Chart.js

## Quick Start

```bash
# 1. Install
npm install

# 2. Set up Supabase (see below)

# 3. Configure
cp .env.example .env.local
# Fill in your Supabase URL + anon key

# 4. Run
npm run dev
```

Works immediately with bots. Supabase only needed for multiplayer.

---

## Supabase Setup (5 minutes)

### Step 1: Create Project

1. Go to [supabase.com](https://supabase.com) → New Project
2. Pick a name, set database password, choose region closest to your users
3. Wait ~2 minutes for provisioning

### Step 2: Run Migration

1. Supabase Dashboard → **SQL Editor** → New Query
2. Paste entire contents of `supabase/migrations/001_schema.sql`
3. Click **Run** — creates all tables, triggers, RLS policies

### Step 3: Enable Realtime

1. Dashboard → **Database** → **Replication**
2. Toggle ON for `race_rooms` and `race_participants`
   (The SQL migration already runs `ALTER PUBLICATION` but verify it's on)

### Step 4: Get API Keys

1. Dashboard → **Settings** → **API**
2. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY`

### Step 5: Configure Auth (Optional)

1. Dashboard → **Auth** → **Providers**
2. Enable Anonymous sign-in (for quick play without accounts)
3. Optionally enable Google/GitHub for persistent accounts

---

## Deploy to Vercel

```bash
# Push to GitHub
git init && git add . && git commit -m "KeyDash v1"
git remote add origin https://github.com/YOU/keydash.git
git push -u origin main
```

1. [vercel.com](https://vercel.com) → Import from GitHub
2. Add environment variables (same 3 from Supabase)
3. Deploy — done

---

## How Room Codes Work

1. Player clicks **Start Race** → `INSERT INTO race_rooms` → Postgres trigger auto-generates 6-char code like `A3KX7P`
2. Code is displayed to share with friends
3. Friend enters code → `SELECT FROM race_rooms WHERE code = 'A3KX7P'` → joins that room's Supabase Realtime channel
4. All players in the channel see each other's progress via Broadcast (no DB writes during race = low latency)

---

## How Replay Works

During the race, every 80ms we snapshot: `{ time, charIndex, charStates[] }`.
After the race, the Replay tab plays back these frames at variable speed (0.5x/1x/2x/4x) with a seekbar. The cursor and correct/wrong highlights animate through the text exactly as you typed it.

---

## Project Structure

```
src/
├── app/
│   ├── globals.css        # Tailwind + fonts
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Entry point
├── components/
│   ├── Game.tsx           # Phase router
│   ├── Lobby.tsx          # Config + room join
│   ├── Countdown.tsx      # 3-2-1-GO overlay
│   ├── RaceHUD.tsx        # Live stats bar
│   ├── RaceTrack.tsx      # Player progress bars
│   ├── TypingDisplay.tsx  # Core typing renderer
│   ├── Results.tsx        # Statistics/Performance/Replay tabs
│   └── Avatar.tsx         # Procedural avatars
├── lib/
│   ├── store.ts           # Zustand state (game + multiplayer)
│   ├── words.ts           # Word bank
│   ├── config.ts          # Difficulties, bot names, colors
│   └── supabase.ts        # Supabase client
├── hooks/
│   └── useGame.ts         # Game loop, keyboard, countdown hooks
└── types/
    └── game.ts            # TypeScript types
```

All components are PascalCase. All files work without Supabase (graceful fallback to bots-only mode).
