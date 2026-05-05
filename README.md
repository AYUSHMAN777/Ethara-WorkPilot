# Ethara Workpilot

live Demo : https://ethara-work-pilot.vercel.app/

**Ethara Workpilot** is a production-oriented **project management** web app: projects, team members, tasks with statuses, role-based access (Admin / Member), and a dashboard. Built as a **monorepo** with an Express + MongoDB API and a React (Vite) client.

## Tech stack

| Layer    | Technologies                                      |
| -------- | ------------------------------------------------- |
| Frontend | React 18, Vite, Tailwind CSS, Axios, React Router |
| Backend  | Node.js 18+, Express.js                           |
| Database | MongoDB (Mongoose)                                |
| Auth     | JWT (access token), bcrypt password hashing     |

## Folder structure

```
.
├── client/                 # React (Vite) SPA
│   ├── src/
│   │   ├── components/     # Layout, ProtectedRoute
│   │   ├── pages/          # Login, Signup, Dashboard, Projects, ProjectDetail
│   │   ├── services/       # Axios API modules
│   │   ├── context/        # AuthContext
│   │   ├── hooks/          # useAuth re-export
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── package.json
├── package.json            # optional: npm run dev (API + client via concurrently)
├── server/                 # Express API
│   ├── src/
│   │   ├── controllers/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── middleware/
│   │   ├── utils/
│   │   └── index.js
│   ├── package.json
│   └── .env.example
└── README.md
```

## Environment variables

### Server (`server/.env`)

| Variable               | Description |
| ---------------------- | ----------- |
| `PORT`                 | HTTP port (Railway sets this automatically). Default `5000`. |
| `MONGODB_URI`          | MongoDB connection string (e.g. MongoDB Atlas). **Required.** |
| `JWT_SECRET`           | Signing secret. **≥32 characters in production.** |
| `JWT_EXPIRES_IN`       | JWT lifetime (e.g. `7d`). Optional. |
| `FRONTEND_URL`         | Allowed CORS origin(s). Comma-separated for multiple. |
| `ALLOW_ADMIN_SIGNUP`   | Set to `true` only to allow registering users with role **Admin** via `POST /api/auth/signup`. Disable after creating your admin. |
| `NODE_ENV`             | `development` or `production`. |

### Client (`client/.env`)

| Variable        | Description |
| --------------- | ----------- |
| `VITE_API_URL`  | Public API base **without** `/api` (e.g. `https://your-api.up.railway.app`). Leave empty for local dev to use Vite’s `/api` proxy to **`http://127.0.0.1:5000`** (override with `VITE_PROXY_TARGET` in `vite.config.js`). |

Copy examples:

```bash
cp server/.env.example server/.env
cp client/.env.example client/.env
```

## API endpoints

### Auth

| Method | Path | Description |
| ------ | ---- | ----------- |
| `POST` | `/api/auth/signup` | Register (optional `role`: `Admin` only if `ALLOW_ADMIN_SIGNUP=true`). |
| `POST` | `/api/auth/login` | Login; returns JWT + user. |
| `GET`  | `/api/auth/me` | Current user (requires `Authorization: Bearer <token>`). |

### Projects (JWT required)

| Method | Path | Who |
| ------ | ---- | --- |
| `POST` | `/api/projects` | **Admin** — create project (`title`, `description`, optional `memberIds[]`). Creator is always a member. |
| `GET`  | `/api/projects` | Projects you created or belong to. |
| `GET`  | `/api/projects/:projectId/members` | Project members + creator as `{ _id, name, email }[]` (must have project access). |
| `GET`  | `/api/projects/:id` | Detail if you are a member/creator **or** have a task assigned on this project. Tasks populated with `title`, `status`, `assignedTo`, `dueDate`. |
| `PUT`  | `/api/projects/:id` | **Admin** — update `title`, `description`, `memberIds` (replaces membership set; creator always kept server-side). |
| `DELETE` | `/api/projects/:id` | **Admin** — delete project and its tasks. |

### Tasks (JWT required)

| Method | Path | Who |
| ------ | ---- | --- |
| `POST` | `/api/tasks` | **Admin** — create (`title`, `description`, `projectId`, `assignedTo` = any registered user, optional `dueDate`, optional `status`). |
| `GET`  | `/api/tasks/project/:projectId` | List tasks if you have project access. |
| `PUT`  | `/api/tasks/:id/status` | **Admin** or **assignee**: body `{ "status" }` only. |
| `PUT`  | `/api/tasks/:id` | **Admin**: full task fields. **Member**: **status only** on tasks assigned to them. |
| `DELETE` | `/api/tasks/:id` | **Admin**. |

### Dashboard (JWT required)

| Method | Path | Description |
| ------ | ---- | ----------- |
| `GET`  | `/api/dashboard` | `totalTasks`, `completedTasks`, `pendingTasks`, `overdueTasks`, `tasksByStatus`, `myTasks` (your assigned tasks not Done, with `projectName`). Projects = member/creator **or** any project where you have an assigned task. |

### Users (JWT + **Admin**)

| Method | Path | Description |
| ------ | ---- | ----------- |
| `GET`  | `/api/users` | All users `{ _id, name, email }[]`. Query: `search`, `limit` (default 300, max 500). |

### Notifications (JWT required)

| Method | Path | Description |
| ------ | ---- | ----------- |
| `GET`  | `/api/notifications` | `{ notifications, unreadCount }` for the current user. Query: `limit`. |
| `PATCH` | `/api/notifications/read-all` | Mark all as read. |
| `PATCH` | `/api/notifications/:id/read` | Mark one as read. |

### Health

| Method | Path | Description |
| ------ | ---- | ----------- |
| `GET`  | `/health` | Liveness check for platforms like Railway. |

## Run locally

**Prerequisites:** Node.js 18+, MongoDB (local URI or Atlas).

The Vite app proxies `/api` to the Express server (default **`http://127.0.0.1:5000`**). If you only run the **client**, signup/login will fail with **`ECONNREFUSED`** because nothing is listening on that port.

### Option A — one command (API + web)

From the **repo root**:

```bash
npm install
npm run install:all
# Configure server/.env (MONGODB_URI, JWT_SECRET, etc.)
npm run dev
```

This runs **`server`** and **`client`** together (`concurrently`).

### Option B — two terminals

1. **Server**

   ```bash
   cd server
   npm install
   cp .env.example .env
   # Edit .env — set MONGODB_URI, JWT_SECRET, optionally ALLOW_ADMIN_SIGNUP=true for first admin
   npm run dev
   ```

   API listens on port **5000** (see log: `API listening on http://127.0.0.1:5000`).

2. **Client**

   ```bash
   cd client
   npm install
   cp .env.example .env
   # Leave VITE_API_URL empty to use Vite’s /api proxy
   npm run dev
   ```

3. Open `http://localhost:5173`. Sign up (optionally as Admin if `ALLOW_ADMIN_SIGNUP=true`), create a project, add member user IDs from MongoDB if needed, create tasks, and update statuses from the project page or view the dashboard.

**Production build (client):**

```bash
cd client
npm run build
```

Static output is in `client/dist/`. Serve it from any static host and point `VITE_API_URL` at your deployed API **at build time**.

## Deployment (Railway + Vercel)

### Railway (API)

1. **New project → Deploy from GitHub** (or empty service + connect repo).
2. **Root directory:** `server`.
3. **Start command:** `npm start` (default; Railway sets `PORT`).
4. **Environment variables** (in the Railway service, not only `.env` on disk — the server skips loading `.env` when Railway’s platform env is present):

   | Variable | Notes |
   | -------- | ----- |
   | `NODE_ENV` | `production` (Railway often sets this for deploys; set explicitly if unsure). |
   | `MONGODB_URI` | Atlas or other MongoDB URI. **Required.** |
   | `JWT_SECRET` | **≥ 32 characters** in production (enforced at startup). |
   | `FRONTEND_URL` | **Required in production:** comma-separated origins **without** trailing slashes, e.g. `https://your-app.vercel.app`. Include **Preview** URLs if you use Vercel preview deploys (each preview host must be listed, or use a custom preview domain you control). |
   | `ALLOW_ADMIN_SIGNUP` | `false` after you have an admin user. |
   | `JWT_EXPIRES_IN` | Optional (e.g. `7d`). |

5. After deploy, copy the **public HTTPS URL** of the API (e.g. `https://your-service.up.railway.app`) — no trailing slash, no `/api` suffix — for the Vercel build.

6. **Health check:** `GET /health` (optional in Railway service settings).

### MongoDB Atlas

- Create a cluster and user; use the SRV connection string in `MONGODB_URI`.
- **Network access:** allow connections from the internet (`0.0.0.0/0`) for small demos, or restrict to Railway’s egress if you use static IPs / tighter security.

### Vercel (frontend)

1. **New project** → import the repo; set **Root Directory** to `client`.
2. **Build command:** `npm run build` (default).
3. **Output directory:** `dist` (Vite default).
4. **Environment variables** (Vite inlines these at **build** time):

   | Variable | Environment scope | Value |
   | -------- | ----------------- | ----- |
   | `VITE_API_URL` | **Production** (and **Preview** if you use previews) | Your Railway API base URL only, e.g. `https://your-service.up.railway.app` — no trailing slash, no `/api`. |

   On Vercel, `VERCEL` is set during CI builds; the client build **fails** if `VITE_API_URL` is missing in production mode, so misconfigured deploys surface immediately.

5. **SPA routing:** `client/vercel.json` rewrites all paths to `index.html` so React Router deep links work.

6. **CORS:** set `FRONTEND_URL` on Railway to match your Vercel URLs exactly (`https://…`), including `www` vs apex if you use both.

### Smoke checks before go-live

```bash
# Client production bundle (local mimic of Vercel)
cd client
set VITE_API_URL=https://your-railway-url.up.railway.app   # Windows CMD; use export on Unix
npm run build
```

```bash
# API boot with production rules (will exit if env invalid)
cd server
set NODE_ENV=production
set MONGODB_URI=...
set JWT_SECRET=at_least_32_characters_long_secret_here
set FRONTEND_URL=https://your-app.vercel.app
npm start
```

## Roles

- **Admin:** create/delete projects, update projects and members, create/delete tasks, assign tasks, change any task field.
- **Member:** view accessible projects; change **status** only on **assigned** tasks.

## Demo video script (short)

1. **Intro (10s):** “This is Ethara Workpilot — projects, tasks, and a dashboard with JWT auth and Admin vs Member roles.”

2. **Signup / login (30s):** Open the app; show **Sign up** with name, email, password, role Member; mention turning on `ALLOW_ADMIN_SIGNUP` briefly to create an Admin for the recording if needed. **Log out** and **Log in** as Admin.

3. **Create project (25s):** Go to **Projects**; fill title and description; optionally paste a second user’s MongoDB `_id` as a member; **Create project**; open the new project.

4. **Assign task (35s):** In **New task**, enter title/description, pick **Assign to** from the team dropdown, set an optional **due date**, **Create task**.

5. **Update task status (20s):** As Admin or as the assignee Member, change the **Status** dropdown (Todo → In Progress → Done).

6. **Dashboard (20s):** Open **Dashboard**; point at **Total**, **Completed**, **Overdue**, and **Tasks by status** cards.

7. **Outro (10s):** “Stack: React Vite, Express, MongoDB, JWT — deployable on Railway with environment variables.”

---

Harden secrets, CORS, and rate limiting before exposing this API to the public internet.
