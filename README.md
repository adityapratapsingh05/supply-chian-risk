# 🔗 Supply Chain Risk Monitor

> AI-powered real-time supply chain disruption intelligence platform — Claude-backed scoring, React Flow network visualization, disruption simulation, and executive briefing generation.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/YOUR_USERNAME/supply-chain-risk-monitor&env=ANTHROPIC_API_KEY,NEWS_API_KEY,DATABASE_URL)

---

## 🚀 Quick Start

```bash
# 1. Clone the repo
cd "supply chain"

# 2. Install dependencies
npm install

# 3. Set up environment
cp .env.example .env
# (Optionally add your ANTHROPIC_API_KEY and NEWS_API_KEY — the app works fully without them)

# 4. Initialize database and seed data
npx prisma db push
npx ts-node --compiler-options '{"module":"CommonJS"}' prisma/seed.ts

# 5. Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — the app is live.

---

## ⚙ Environment Variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | SQLite path: `file:./dev.db` |
| `ANTHROPIC_API_KEY` | Optional | Claude API key for live AI scoring. App uses mock data if absent. |
| `NEWS_API_KEY` | Optional | NewsAPI.org key for live headlines. App uses offline dataset if absent. |
| `NEXT_PUBLIC_APP_URL` | Optional | Public URL (for Vercel deployment) |

**The app runs fully on mock data with no API keys set.** All features are demonstrable without any external accounts.

---

## 🗺 Architecture Overview

```
Frontend (Next.js 14 App Router)
  ├── Dashboard (/)         — Network graph + risk cards + news feed
  ├── Simulation (/sim)     — Disruption scenario runner
  ├── Briefing (/briefing)  — Executive report generator
  └── Admin (/admin)        — Supplier graph editor

API Layer (Next.js API Routes)
  ├── GET/POST /api/suppliers       — CRUD suppliers
  ├── GET/POST /api/news/ingest     — Fetch + classify news
  ├── POST     /api/score           — Score all/single supplier
  ├── GET/POST /api/mitigate        — Generate mitigation strategies
  ├── GET/POST /api/simulate        — Run disruption simulation
  └── POST     /api/briefing        — Generate executive briefing

AI Layer (Anthropic Claude claude-sonnet-4-5)
  ├── News classification (category, geography, severity)
  ├── Supplier risk scoring (probability + impact + reasoning)
  ├── Cascade network analysis (downstream impact modeling)
  ├── Mitigation strategy generation (structured cards)
  └── Executive briefing generation (full document)

Data Layer (Prisma + SQLite)
  ├── Supplier         — 5 nodes, 3 tiers
  ├── NewsArticle      — classified headlines
  ├── RiskEvent        — scored disruption events
  ├── MitigationStrategy — AI-generated response plans
  └── SimulationRun    — logged simulation history
```

---

## 📦 Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Graph | React Flow v11 |
| Charts | Recharts |
| AI | Anthropic Claude (claude-sonnet-4-5) |
| Validation | Zod |
| Database | SQLite via Prisma |
| PDF Export | jsPDF + html2canvas |

---

## 🗓 7-Day Roadmap → Feature Mapping

| Roadmap Day | Feature | Code Location |
|---|---|---|
| Day 1 | Supply chain graph (interactive 5-node 3-tier diagram) | `src/components/graph/SupplyChainGraph.tsx`, `src/components/graph/SupplierNode.tsx` |
| Day 2 | News ingestion + Claude classification | `src/lib/news.ts`, `src/lib/scoring.ts`, `src/app/api/news/ingest/route.ts` |
| Day 3 | Risk scoring engine (disruption prob + impact, Zod-validated) | `src/lib/scoring.ts`, `src/lib/schemas.ts`, `src/app/api/score/route.ts` |
| Day 4 | Network risk visualization (color-coded nodes, cascade overlay) | `src/components/graph/SupplyChainGraph.tsx` (cascade edge + badge logic) |
| Day 5 | Mitigation strategy generator (structured cards, 3 tabs) | `src/app/api/mitigate/route.ts`, `src/components/mitigation/MitigationCard.tsx` |
| Day 6 | Disruption simulation mode (5 presets + custom + full pipeline) | `src/app/simulation/page.tsx`, `src/app/api/simulate/route.ts` |
| Day 7 | Executive briefing (in-app view + PDF + Markdown export) | `src/app/briefing/page.tsx`, `src/app/api/briefing/route.ts` |

---

## 🏗 Data Model (Seed)

5 suppliers across 3 tiers for a smartphone OEM:

| Supplier | Tier | Location | Risk |
|---|---|---|---|
| Rare Earth Mining Co. | 3 (Raw Materials) | Baotou, China | 72% |
| Advanced PCB Ltd. | 2 (Components) | Taipei, Taiwan | 65% |
| OLED Display Systems | 2 (Components) | Seoul, South Korea | 41% |
| Precision Assembly Corp. | 1 (Assembly) | Shenzhen, China | 55% |
| Global Logistics Hub | 1 (Distribution) | Singapore | 30% |

**Network links:** Raw Materials → Components → Assembly → Distribution

---

## 🌐 Deploying to Vercel

1. Push your code to GitHub
2. Import into [Vercel](https://vercel.com/new)
3. Set environment variables in Vercel dashboard:
   - `DATABASE_URL=file:./dev.db`
   - `ANTHROPIC_API_KEY=sk-ant-...`
   - `NEWS_API_KEY=...` (optional)
4. Click Deploy

> **Note:** SQLite is file-based and works on Vercel for demos. For production, swap `DATABASE_URL` to a Postgres connection string (Prisma handles this transparently).

---

## 🔧 Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build production bundle
npm run start        # Start production server
npm run lint         # Run ESLint
npm run db:push      # Push Prisma schema to DB
npm run db:seed      # Seed the database
npm run db:studio    # Open Prisma Studio
npm run setup        # db:push + db:seed in one command
```

---

## 📋 Features

- **Interactive network graph** — React Flow with tier-based layout, draggable nodes in admin view
- **Risk color coding** — Red (critical >70%), Orange (high >50%), Yellow (medium >30%), Green (low)
- **Cascade visualization** — Animated edge paths showing second/third-order downstream impact
- **AI news classification** — 10 risk categories, severity scoring, geography extraction
- **AI risk scoring** — Per-supplier disruption probability (0–1) + business impact (0–10)
- **JSON schema validation** — All Claude outputs validated via Zod, 3× retry on malformed responses
- **Mitigation strategy cards** — Alternate suppliers, inventory buffers, logistics rerouting
- **Disruption simulation** — 5 presets + free-text custom scenarios, full pipeline, run history
- **Executive briefing** — Risk level, top 3 threats, cascade summary, action items, PDF/Markdown export
- **Graceful degradation** — 100% functional with zero API keys using seeded mock data
- **Error boundaries** — All panels wrapped with recovery UI

---

*Built with Next.js 14 + TypeScript + Tailwind CSS + React Flow + Recharts + Prisma + Anthropic Claude*
