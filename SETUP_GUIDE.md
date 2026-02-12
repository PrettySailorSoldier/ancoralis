# Ancoralis — Setup Guide for Antigravity

## What this is
Ancoralis is a time-anchoring PWA for AuDHD brains.
Three core features:
1. **Day Arc** — visual timeline showing where you are in your day right now
2. **Surface (Shelf)** — persistent layer for things that exist but vanish from awareness
3. **Kinetora** — check-in modal that fires at anchor times, with a direction to point you

## File Structure
```
ancoralis/
├── index.html
├── vite.config.js
├── package.json
├── vercel.json
├── .env.example          ← copy to .env.local, fill in Supabase keys
├── SUPABASE_SCHEMA.sql   ← run this in Supabase SQL editor first
├── public/
│   ├── manifest.json
│   ├── icon-192.png      ← placeholder, replace with real icons
│   ├── icon-512.png
│   └── apple-touch-icon.png
└── src/
    ├── main.jsx
    ├── App.jsx
    ├── styles/
    │   └── global.css
    ├── lib/
    │   └── supabase.js   ← all DB calls
    ├── hooks/
    │   └── useCheckin.js ← alarm logic, current/next anchor
    └── components/
        ├── DayArc.jsx        ← visual day timeline
        ├── Shelf.jsx         ← surface layer
        ├── AnchorEditor.jsx  ← manage anchor points
        └── KinetoraModal.jsx ← check-in interrupt
```

---

## Step 1 — Supabase

1. Create a free project at supabase.com
2. Go to **SQL Editor** → paste entire contents of `SUPABASE_SCHEMA.sql` → Run
3. Go to **Settings → API** → copy:
   - Project URL
   - anon/public key

---

## Step 2 — Local dev

```bash
# Install dependencies
npm install

# Create env file
cp .env.example .env.local
# Edit .env.local with your Supabase URL and anon key

# Start dev server
npm run dev
# Opens at http://localhost:5173
```

---

## Step 3 — Deploy to Vercel

```bash
# Option A: Vercel CLI
npm i -g vercel
vercel

# Option B: Vercel dashboard
# Push to GitHub → import repo in vercel.com
# Add env vars in Vercel dashboard under Settings → Environment Variables:
#   VITE_SUPABASE_URL
#   VITE_SUPABASE_ANON_KEY
```

vercel.json handles the SPA rewrite automatically. No other config needed.

---

## Step 4 — Install on iPhone (PWA)

1. Open the deployed Vercel URL in **Safari** (must be Safari, not Chrome)
2. Tap the **Share** button → **Add to Home Screen**
3. Open from home screen icon at least once to register push permission
4. Allow notifications when prompted

---

## Step 5 — Replace placeholder icons

Edit your icons in **Affinity Designer** (or Figma):
- Export `icon-192.png` (192×192), `icon-512.png` (512×512), `apple-touch-icon.png` (180×180)
- Drop into `public/` — the current files are generated placeholders

The icon uses a hexagon (⬡) motif — Ancoralis's visual symbol.

---

## Tech Stack
- React 18 + Vite
- Supabase (Postgres, realtime)
- vite-plugin-pwa (service worker, offline support)
- Vercel (hosting)
- No UI library — all styles are inline JS objects (easy for Antigravity to modify)

## Notes
- No authentication yet — all data uses `user_id = 'default'`
- Add Supabase Auth later when needed (swap `'default'` for `supabase.auth.getUser()`)
- Alarm checking runs every 60 seconds via setInterval — intentional (reliable on mobile PWA)
- Sound is a pure Web Audio API chime (C5 E5 G5 major chord) — no audio files needed
