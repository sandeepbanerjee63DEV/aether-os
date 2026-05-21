# AETHER OS — AI Business Command Center

Enterprise-grade AI-powered CRM, lead management, and workflow automation platform. Built to match the premium futuristic SaaS dashboard design with full-stack architecture.

![AETHER OS](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue?style=flat-square&logo=typescript)
![Prisma](https://img.shields.io/badge/Prisma-6-2D3748?style=flat-square&logo=prisma)

## Features

- **Lead to Client Workflow** — 6-stage AI pipeline visualization
- **Active Leads** — Search, filter, AI scoring, status badges
- **Lead Details** — AI analysis, conversion probability, next best action
- **Follow-up Timeline** — Chronological activity tracking
- **Analytics** — Conversion funnel, score distribution, source breakdown
- **AI Assistant** — CRM-aware chat with mock LLM (OpenAI-ready architecture)
- **Full Module Suite** — Deals, Tasks, Reports, Predictions, Automations, Integrations, Team
- **Auth** — JWT + refresh tokens, RBAC, demo login
- **Realtime** — WebSocket-ready hooks with polling fallback

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 15, React 19, TypeScript, Tailwind CSS, Framer Motion, Recharts |
| State | Zustand, TanStack Query |
| Backend | Next.js API Routes, Prisma ORM |
| Database | PostgreSQL |
| Cache | Redis (optional) |
| Auth | JWT (jose), bcrypt, RBAC |
| Deploy | Docker, Vercel, Railway/Supabase |

## Quick Start

### Prerequisites

- Node.js 20+
- Docker (optional, for PostgreSQL + Redis)

### 1. Install dependencies

```bash
npm install
```

### 2. Environment

```bash
cp .env.example .env
```

### 3. Database (with Docker)

```bash
docker compose up -d postgres redis
npm run db:push
npm run db:seed
```

### 4. Run development server

```bash
npm run dev
```

Open [http://localhost:3000/leads](http://localhost:3000/leads) — the main dashboard matching the design mockup.

### First-time setup

1. Start PostgreSQL and run `npm run db:push`
2. Open **http://localhost:3000/register** (or `/login` → **Create Account**)
3. The **first registered user** becomes workspace admin automatically

Alternatively: `npm run create-user -- email@example.com password "Your Name"`

## Project Structure

```
src/
├── app/
│   ├── (dashboard)/     # All CRM pages
│   ├── api/             # REST API routes
│   └── login/
├── components/
│   ├── layout/          # Sidebar, Navbar
│   ├── leads/           # Workflow, leads list, details, timeline
│   ├── charts/          # Funnel, donut, AI insights
│   └── ui/              # Design system primitives
├── lib/
│   ├── auth/            # JWT, RBAC
│   ├── ai/              # AI engine (mock → LLM ready)
│   └── prisma.ts
├── stores/              # Zustand UI + auth state
├── data/                # Dashboard constants
└── hooks/               # Realtime WebSocket hook
prisma/
├── schema.prisma        # Full data model
└── seed.ts
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/leads` | List leads |
| POST | `/api/leads` | Create lead + AI classify |
| GET | `/api/leads/:id` | Lead details |
| GET | `/api/leads/:id/timeline` | Timeline events |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Current user |
| POST | `/api/ai/chat` | AI assistant |
| POST | `/api/ai/classify` | AI lead classification |
| GET | `/api/analytics/dashboard` | KPI + chart data |

## Deployment

### Vercel (Frontend)

1. Push to GitHub
2. Import in Vercel
3. Set environment variables from `.env.example`
4. Deploy

### Railway / Supabase (Database)

1. Create PostgreSQL instance
2. Set `DATABASE_URL` in Vercel/Railway
3. Run `npx prisma migrate deploy`

### Docker (Full Stack)

```bash
docker compose up --build
```

## AI Integration

The AI engine (`src/lib/ai/engine.ts`) uses mock logic by default. To connect OpenAI:

1. Set `OPENAI_API_KEY` and `AI_PROVIDER=openai` in `.env`
2. Extend `classifyLead()` and `chatResponse()` to call your LLM

## QA Checklist

- [ ] Sidebar navigation highlights active route
- [ ] Leads page matches mockup layout (3-column + 4 analytics cards)
- [ ] Clicking leads updates details panel
- [ ] Workflow pipeline renders 6 steps
- [ ] Charts render (funnel, donuts)
- [ ] AI Assistant responds to queries
- [ ] Login flow works with seeded DB
- [ ] Mobile: sidebar drawer opens
- [ ] Responsive grid stacks on tablet/mobile

## Testing Strategy

- **Unit**: AI engine, RBAC permissions, utils
- **Integration**: API routes with Prisma test DB
- **E2E**: Playwright for leads workflow + auth
- **Visual**: Chromatic/Percy for dashboard regression

## Scalability Notes

- Prisma connection pooling via PgBouncer for serverless
- Redis cache for lead list hot paths
- WebSocket server (separate process) for realtime at scale
- Feature flags for AI modules
- Multi-tenant: add `organizationId` to schema

## License

Proprietary — AETHER OS Demo Project
