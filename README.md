# Schedulfy — Architecture & Deployment Guide

Schedulfy is organized into two completely isolated, independently deployable projects: `backend/` and `frontend/`, connected via reverse-proxy rewrites.

---

## 🏗️ Clean Project Structure

```text
schedulfy/
├── backend/                  # Independent Node.js + Express + Prisma Service
│   ├── prisma/               # Schema, migrations & seed (PostgreSQL)
│   ├── src/                  # Routes, auth, AI (Gemini), domain logic, db singleton
│   ├── tests/                # 17 unit & domain tests (Vitest)
│   ├── package.json          # Backend dependencies & build scripts
│   ├── tsconfig.json         # Backend TypeScript config
│   └── .env                  # Backend secrets & DB URL
│
├── frontend/                 # Independent Next.js 15 App Router Service
│   ├── src/
│   │   ├── app/              # Today, Mom Kitchen, Chat, Analytics, History, Login
│   │   ├── lib/              # Frontend types & session helpers
│   │   └── middleware.ts     # Edge authentication & route protection
│   ├── public/               # Static assets & Service Worker (PWA)
│   ├── next.config.ts        # Reverse proxy (/api/* -> backend:4000)
│   ├── package.json          # Frontend dependencies & Next.js scripts
│   ├── tsconfig.json         # Frontend TypeScript config
│   └── .env.local            # Frontend env (BACKEND_URL)
│
├── whole ui/                 # Atelier Edition: High-craft standalone interactive UI
│   ├── index.html            # Complete 5-screen interactive showcase
│   ├── styles.css            # Warm linen & sumi ink design system
│   └── app.js                # State engine + desktop/mobile viewport toggle
│
├── docs/                     # Specifications & Design Artifacts
│   ├── prd.md, techspec.md   # Architectural & product docs
│   └── stitch-screens/       # Stitch MCP generated HTML prototypes
│
├── scripts/                  # Monorepo runner scripts
│   ├── dev.js                # Starts backend (:4000) & frontend (:3000) concurrently
│   ├── serve-ui.js           # Serves 'whole ui' on :3001
│   └── verify-connected.js   # Automated integration test across proxy
│
└── package.json              # Monorepo root workspace runner
```

---

## 🚀 Local Development

```bash
# Start both Backend (:4000) & Frontend (:3000) concurrently
npm run dev

# Build both services for production
npm run build

# Run unit tests
npm test

# Launch 'Whole UI' Atelier Edition (:3001)
npm run ui
```

---

## 🚢 Deployment Guide

### 1. Deploying Backend (`backend/`)
Can be deployed to **Render**, **Railway**, **Fly.io**, or any Node.js container service.

- **Root Directory**: `backend` (or set Root Directory to `backend` in platform settings)
- **Build Command**: `npm install && npx prisma generate && npm run build`
- **Start Command**: `npm start` (runs `node dist/index.js`)
- **Required Environment Variables**:
  - `DATABASE_URL`: Your Supabase / PostgreSQL connection string
  - `DIRECT_URL`: Supabase direct connection string
  - `PORT`: Provided by host (defaults to `4000`)
  - `FRONTEND_URL`: URL of your deployed frontend (e.g. `https://your-frontend.vercel.app`)
  - `USER_PIN`: `1234` (or custom 4-digit PIN)
  - `MOM_PIN`: `5678` (or custom 4-digit PIN)
  - `SESSION_SECRET`: Random 32+ character string
  - `GEMINI_API_KEY`: Google AI Studio API key
  - `APP_TIMEZONE`: `Asia/Kolkata`

---

### 2. Deploying Frontend (`frontend/`)
Deploy to **Vercel** (recommended) or **Cloudflare Pages / Netlify**.

- **Root Directory**: Select `frontend` in Vercel project settings
- **Framework Preset**: Next.js
- **Build Command**: `npm run build`
- **Output Directory**: `.next`
- **Required Environment Variables**:
  - `BACKEND_URL`: URL of your deployed backend (e.g. `https://your-backend.onrender.com`)
  - `NEXT_PUBLIC_APP_URL`: URL of your deployed frontend (e.g. `https://your-frontend.vercel.app`)

> **How Connection Works in Production**: Next.js rewrites in `frontend/next.config.ts` forward all `/api/:path*` requests to `BACKEND_URL/api/:path*` server-to-server. Browser always communicates with same origin (`/api/...`), completely avoiding CORS errors and cookie domain mismatches.

---

## 🔑 Authentication Roles

- **User PIN**: `1234` (Directs to `/today` routine & macro tracker)
- **Mom PIN**: `5678` (Directs to `/mom` kitchen dashboard)
