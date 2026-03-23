# smear-app

**Smear** is a mobile-first climbing progression app for indoor climbers. Log your sends, track your grades, and build a detailed picture of your climbing style over time.

Live at [smear.app](https://smear.app)

---

## What We're Building

Smear helps climbers answer a simple question: *am I getting better?*

Most climbers mentally track their progress, but the picture is fuzzy. Smear makes it concrete — log a climb with its grade, send type, and style tags, and the app builds a multi-dimensional climbing profile (your "archetype") showing how you perform across different styles: overhang, slab, crimp, compression, and more.

**Core features:**
- Climb logging with grade, send type (flash / send / attempt), style tags, hold color, and photo
- Per-style grade tracking — see your actual ceiling per discipline, not just your max grade
- XP and leveling system with milestone badges
- Gym selection and bookmarking
- Social feed and follow system (in progress)
- Leaderboards and monthly challenges (coming soon)

---

## Roadmap

| Phase | Focus |
|-------|-------|
| MVP | Auth, climb logging, profile, basic progress graphs, XP/levels |
| Next | Social follows, gym management, leaderboards, monthly challenges |
| Long-term | ML-powered route suggestions, gym API integrations |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS 3, React Router 7 |
| Backend | FastAPI (Python) |
| Database | Supabase (Postgres) |
| Auth | Supabase Auth |
| Hosting | Vercel (frontend), Render (backend) |

The frontend talks to Supabase directly for all climb and gym data. The FastAPI backend handles gym seeding from OpenStreetMap and gym search.

---

## Repositories

| Repo | Description |
|------|-------------|
| `smear-app/smear` | Main monorepo — React frontend + FastAPI backend |

---

## Team

| Name | GitHub | Role |
|------|--------|------|
| Jaden Phan | [@jphan10](https://github.com/jphan10) | Co-founder |
| Brandon Senaha | [@Bsenaha](https://github.com/Bsenaha) | Co-founder |

---
