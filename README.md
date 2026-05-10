# TaskFlow — Team-based Smart Task System

> A production-ready SaaS task management platform with **real-time collaboration**, **Discord notifications**, and optional **IoT (ESP32) integration** via Node-RED.

![Stack](https://img.shields.io/badge/Next.js-14-black?logo=next.js)
![Stack](https://img.shields.io/badge/Firebase-10-orange?logo=firebase)
![Stack](https://img.shields.io/badge/Node--RED-3.x-red?logo=nodered)
![Stack](https://img.shields.io/badge/TailwindCSS-3-blue?logo=tailwindcss)
![Stack](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![License](https://img.shields.io/badge/license-MIT-green)

---

## ✨ Features

| Feature       | Details                                                                        |
| ------------- | ------------------------------------------------------------------------------ |
| **Auth**      | Email/password via Firebase Auth with strong password rules                    |
| **Teams**     | Create teams, invite via code, manage members                                  |
| **Tasks**     | Create / update / delete with kanban board (Pending → In Progress → Done)      |
| **Real-time** | Firestore `onSnapshot` – board updates instantly across all clients            |
| **Discord**   | Automatic webhook notification on task create & complete                       |
| **IoT**       | ESP32 can POST events directly to Node-RED                                     |
| **Security**  | Zod validation, rate limiting, Admin SDK auth, CSP headers, input sanitisation |

---

## 🏗 Project Structure

```
.
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx          ← auth guard + sidebar layout
│   │   ├── dashboard/page.tsx  ← stats + team picker + task board
│   │   └── teams/page.tsx      ← team management
│   ├── api/
│   │   ├── tasks/route.ts           ← POST create task
│   │   ├── tasks/[taskId]/route.ts  ← PATCH / DELETE task
│   │   ├── teams/route.ts           ← GET list / POST create team
│   │   ├── teams/[teamId]/route.ts  ← DELETE team
│   │   ├── teams/join/route.ts      ← POST join via invite code
│   │   └── notify/route.ts          ← Internal forwarding to Node-RED
│   ├── layout.tsx
│   ├── globals.css
│   └── page.tsx               ← redirects to /login
├── components/
│   ├── auth/                  ← LoginForm, RegisterForm
│   ├── dashboard/             ← Sidebar, TaskBoard, TaskCard, modals
│   ├── providers/             ← AuthProvider (React context)
│   └── ui/                    ← Button, Card, Input, Modal, Badge
├── lib/
│   ├── firebase/              ← config, admin, firestore helpers, authServer
│   ├── hooks/                 ← useTasks, useTeams
│   ├── utils/                 ← rateLimit, sanitize, apiResponse, cn
│   └── validations/           ← Zod schemas
├── node-red/
│   └── flow.json              ← importable Node-RED flow
├── types/
│   └── index.ts
├── firestore.rules
├── .env.example
└── README.md
```

---

## 🚀 Quick Start

### 1. Clone & install

```bash
git clone https://github.com/AsiyaKung/taskflow.git
cd taskflow
npm install
```

### 2. Configure environment

```bash
cp .env.example .env.local
# Fill in all variables — see comments inside .env.example
```

### 3. Set up Firebase

1. Go to [Firebase Console](https://console.firebase.google.com) → **Create project**
2. Enable **Authentication** → Email/Password
3. Create a **Firestore database** (start in production mode)
4. **Deploy security rules:**
   ```bash
   npm install -g firebase-tools
   firebase login
   firebase init firestore
   firebase deploy --only firestore:rules
   ```
5. Generate a **service account key** (Project Settings → Service Accounts → Generate new private key)
6. Add the credentials to `.env.local` (`FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`)

### 4. Run locally

```bash
npm run dev
# → http://localhost:3000
```

---

## 🤖 Node-RED Setup

### Local (development)

```bash
npm install -g node-red
node-red
# → http://localhost:1880
```

1. Open the editor at `http://localhost:1880`
2. Click the **menu (☰) → Import → Clipboard**
3. Paste the contents of `node-red/flow.json`
4. Click **Import**, then **Deploy**
5. Set the environment variable in Node-RED:
   - Open the editor → **☰ → Manage Palette** is not what you want
   - Go to **☰ → Settings → Environment Variables**
   - Add `NODE_RED_SECRET` = same value as in your `.env.local`

### Production (Render.com — free tier)

1. Fork this repo
2. Create a new **Web Service** on Render
3. Select **Docker** runtime
4. Use this `Dockerfile` (place in `/node-red/`):

```dockerfile
FROM nodered/node-red:3.1
COPY flow.json /data/flows.json
ENV NODE_RED_SECRET=change_me
EXPOSE 1880
```

5. Set `NODE_RED_SECRET` in Render's **Environment** panel
6. After deploy, set `NODE_RED_URL=https://your-service.onrender.com` in Vercel

---

## ☁️ Deployment (Vercel)

```bash
npm install -g vercel
vercel
# Follow prompts; set all env vars from .env.example in the Vercel dashboard
```

**Required Vercel environment variables:**

| Variable                 | Source                                      |
| ------------------------ | ------------------------------------------- |
| `NEXT_PUBLIC_FIREBASE_*` | Firebase project settings                   |
| `FIREBASE_PROJECT_ID`    | Firebase Admin SDK                          |
| `FIREBASE_CLIENT_EMAIL`  | Firebase Admin SDK                          |
| `FIREBASE_PRIVATE_KEY`   | Firebase Admin SDK (service account JSON)   |
| `NODE_RED_URL`           | Your deployed Node-RED URL                  |
| `NODE_RED_SECRET`        | A random 32+ char string (same in Node-RED) |
| `NEXT_PUBLIC_APP_URL`    | `https://your-app.vercel.app`               |

---

## 📡 IoT – ESP32 Integration

The ESP32 sends an HTTP POST directly to your Node-RED instance:

```cpp
// Arduino sketch excerpt
HTTPClient http;
http.begin("https://your-nodered.onrender.com/task");
http.addHeader("Content-Type", "application/json");
http.addHeader("X-Internal-Secret", "your_node_red_secret");

String payload = "{\"event\":\"task_created\","
                 "\"taskTitle\":\"Read book\","
                 "\"teamId\":\"your_team_id\","
                 "\"teamName\":\"IoT Team\","
                 "\"actorName\":\"ESP32 Sensor\","
                 "\"webhookUrl\":\"https://discord.com/api/webhooks/...\","
                 "\"timestamp\":\"" + getISO8601() + "\"}";

int code = http.POST(payload);
http.end();
```

---

## 🔐 Security Architecture

| Layer           | Measure                                                           |
| --------------- | ----------------------------------------------------------------- |
| **Transport**   | HTTPS enforced; HSTS header                                       |
| **Auth**        | Firebase ID tokens verified server-side via Admin SDK             |
| **API routes**  | Every route calls `requireAuth()` before touching data            |
| **Firestore**   | Security rules deny all direct client writes to tasks/teams       |
| **Webhook**     | Discord URL stored server-side only; never sent to client         |
| **Node-RED**    | Protected by shared `X-Internal-Secret` header                    |
| **Input**       | Zod schemas validate + coerce; `isomorphic-dompurify` strips HTML |
| **Rate limits** | Per-IP limits on all mutation endpoints                           |
| **Headers**     | CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy     |
| **Passwords**   | Enforced complexity via Zod; hashed by Firebase                   |

---

## 🗄 Firestore Collections

```
users/{uid}
  uid, name, email, createdAt

teams/{teamId}
  teamId, name, ownerId, webhookUrl*, inviteCode, createdAt
  * server-side only – never exposed to clients

teamMembers/{teamId_userId}
  teamId, userId, role (owner | admin | member), joinedAt

tasks/{taskId}
  taskId, teamId, title, description, status, assignedTo,
  createdBy, createdAt, updatedAt
```

---

## 🛠 Tech Stack

| Layer         | Technology                                                      |
| ------------- | --------------------------------------------------------------- |
| Frontend      | Next.js 14 (App Router), TypeScript, TailwindCSS, Framer Motion |
| Backend       | Next.js API Routes, Firebase Admin SDK                          |
| Database      | Firestore (real-time)                                           |
| Auth          | Firebase Authentication                                         |
| Flow engine   | Node-RED                                                        |
| Notifications | Discord Webhooks                                                |
| Validation    | Zod                                                             |
| Deployment    | Vercel (frontend), Render (Node-RED)                            |

---

## 📜 License

MIT © 2024 — built for CS422 Final Project
