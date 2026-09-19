# Universal Unity FC — UUFC Champions League Point Table

A full-stack web application to manage the **UUFC Champions League** point table for **Universal Unity FC** (eFootball tournament) — players, matches, and live standings.

Built with ♥ by **[Shanzid Hasan](https://www.facebook.com/whoisshanzid/)** — **"Give all credits to Shanzid Hasan"**.

- **Frontend:** React + Vite + Tailwind CSS v4
- **Backend:** Node.js + Express
- **Database:** SQLite with Prisma ORM
- **Auth:** JWT-based single-admin login

## Features

- **Admin authentication** — login page, JWT stored in localStorage, protected `/admin` route, logout.
- **Admin dashboard** — manage players (add / edit / delete with confirmation) and matches (create by picking two players, submit scores, edit, delete, mark as Upcoming/Played).
- **Admin settings** — change the login **username and/or password** (requires current password, validated server-side).
- **Public point table** (`/`) — columns: Rank, Player, P, W, D, L, GF, GA, GD, Pts.
  - Points: Win = 3, Draw = 1, Loss = 0.
  - Sort: Points DESC → Goal Difference DESC → Goals For DESC.
  - Top 3 highlighted (gold / silver / bronze).
  - **Knockout zone coloring** — each row carries a colored left line: **blue = Super 8 (ranks 1–8, inside the knockout stage), yellow = playoff zone (9–24), red = eliminated (25+)**.
  - **Download CSV** button exports the point table (Excel-friendly, UTF-8 BOM).
  - Auto-refreshes every 10 s (and on window focus) after admin updates.
  - **Recent Matches** section — played matches show the full-time score in a filled green card; upcoming matches use a dashed amber "VS" card.

## Project Structure

```
efootball-tournament/
├── client/                       # React + Vite + Tailwind
│   ├── vite.config.js            # /api proxy → http://localhost:4000 (dev only)
│   ├── vercel.json               # SPA rewrites for hosted client
│   └── src/
│       ├── pages/                # Home, Login, AdminDashboard
│       ├── components/           # Navbar, StandingsTable, RecentMatches, MatchForm, PlayerForm, ConfirmModal
│       ├── api/client.js         # axios instance (VITE_API_URL-aware) with JWT interceptor + 401 handling
│       ├── context/AuthContext.jsx
│       └── App.jsx
├── server/                       # Express
│   ├── routes/                   # auth, players, matches, standings
│   ├── controllers/              # auth, player, match, standings
│   ├── middleware/auth.js        # JWT verification
│   ├── prisma/
│   │   ├── schema.prisma         # Admin, Player, Match models
│   │   ├── seed.js               # creates only the admin user (no dummy data)
│   │   └── migrations/
│   └── index.js
├── package.json                  # root: `npm run dev` runs both via concurrently
└── README.md
```

## Setup

Prerequisites: **Node.js ≥ 18** and **npm**.

```bash
# 1. Install all dependencies (server + client + root)
npm run install-all
npm install

# 2. Copy server env (defaults already work out of the box)
cp server/.env.example server/.env

# 3. Create the SQLite database (runs migration + seed automatically)
cd server
npx prisma migrate dev --name init
cd ..

# (To re-create the admin or reset credentials anytime)
cd server && npx prisma db seed
```

The database starts **empty** — only the admin login exists (`HotSa1t`). Add your real players and matches from the Admin dashboard.

## Run in development

```bash
npm run dev
```

This starts both servers:

- **Client:** http://localhost:5173 (Vite proxies `/api/*` to the backend)
- **Server:** http://localhost:4000

You can also run them separately:

```bash
npm run server   # backend only
npm run client   # frontend only
```

## Admin Credentials

| Username | Password |
| -------- | -------- |
| `HotSa1t` | `735123` |

> To change the password, edit `server/prisma/seed.js` and run `npx prisma db seed`. Always set a strong `JWT_SECRET` before deploying.

## API Endpoints

| Method | Endpoint                        | Auth    | Description                            |
| ------ | ------------------------------- | ------- | -------------------------------------- |
| POST   | `/api/auth/login`               | Public  | Login, returns JWT                     |
| PUT    | `/api/auth/credentials`         | Admin   | Change username and/or password        |
| GET    | `/api/players`                  | Public  | List all players                       |
| POST   | `/api/players`                  | Admin   | Create player                          |
| PUT    | `/api/players/:id`              | Admin   | Update player                          |
| DELETE | `/api/players/:id`              | Admin   | Delete player (cascades to matches)    |
| GET    | `/api/matches`                  | Public  | List matches (newest first)            |
| POST   | `/api/matches`                  | Admin   | Create match                           |
| PUT    | `/api/matches/:id`              | Admin   | Update match (scores / status)         |
| DELETE | `/api/matches/:id`              | Admin   | Delete match                           |
| GET    | `/api/standings`                | Public  | Computed point table                   |

---

## Deploy Live (Vercel frontend + hosted API)

This project is designed to run with the **React client on Vercel** and the **Express API on Render or Railway**, communicating over HTTPS.

### 1. Push to GitHub

Create a repository and push the whole `efootball-tournament/` folder (it already contains `.gitignore` files that exclude `node_modules`, `dist`, `.env`, and `dev.db`).

```bash
cd efootball-tournament
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/<you>/efootball-tournament.git
git push -u origin main
```

### 2. Deploy the API — Render (or Railway)

**Database — Neon (free Postgres, persistent):**
The app uses **PostgreSQL** (Prisma) so data survives redeploys and restarts. Create a free database at `neon.tech`, then set `DATABASE_URL` (the connection string) as an environment variable on Render (`Settings → Environment → DATABASE_URL`). The `render.yaml` blueprint **does not** define `DATABASE_URL` so your value is never overwritten by blueprint syncs. On every boot the `startCommand` runs `prisma migrate deploy` (creates the tables) + `prisma db seed` (idempotent — only seeds the admin if none exists, so your credentials/data are never reset).

**Render (recommended) — one-click blueprint:**
A `server/render.yaml` blueprint is included (free plan). It auto-creates the web service, auto-generates `JWT_SECRET`, runs migrations + seed on boot, and sets a `/api/health` health check.

1. In Render, go to **New → Blueprint** and connect the GitHub repo.
2. Render reads `server/render.yaml` and provisions the service (`plan: free`, no credit card).
3. After the first deploy, set `CORS_ORIGIN` to your real Vercel URL and re-deploy (or set it in the blueprint first).
4. Set `DATABASE_URL` to your **Neon** connection string (see above).

**Manual alternative:** New → Web Service with:
- **Build command:** `cd server && npm install && npx prisma generate`
- **Start command:** `cd server && npx prisma migrate deploy && node prisma/seed.js && npm start`
- Env vars: `DATABASE_URL` (Neon Postgres URL), `JWT_SECRET` (long random), `CORS_ORIGIN`.

> ⚠️ **Data persistence:** because the database is hosted at Neon (not on Render's ephemeral filesystem), your players, matches, and admin credentials **survive every redeploy/restart**. Never point `DATABASE_URL` back to a local `file:` path.

### 3. Deploy the frontend — Vercel

1. In Vercel, go to **New Project → Import GitHub repo**.
2. Set:
   - **Root Directory:** `client`
   - Framework preset: **Vite**
   - Build command: `npm run build`
   - Output directory: `dist`
3. Environment variable (set **before** build):
   - `VITE_API_URL` = `https://efootball-api.onrender.com`
4. Deploy. `vercel.json` ensures `/`, `/login`, and `/admin` all serve the app.

### 4. Done

- Visit `https://<your-app>.vercel.app` — public point table works.
- Log in at `/admin` with `HotSa1t` / `735123`.
- All `/api/*` calls go to your hosted backend via `VITE_API_URL` (CORS allows your Vercel domain).

> **Alternative without CORS/env:** delete the `VITE_API_URL` env var and instead proxy `/api/*` to your API in `vercel.json` using a rewrite to the backend URL. The client keeps its relative `/api` base.

### Updating after changes

```bash
# Push changes — Render and Vercel auto-redeploy on push to the connected branch
git add .
git commit -m "Your change"
git push
```

## Production build (single-server fallback)

If you deploy the API and frontend on the same host instead:

```bash
npm run build --prefix client
cd server && npm start
```

Serve `client/dist` statically (e.g. with nginx) and keep `VITE_API_URL` unset or set to your host's `/api` path.