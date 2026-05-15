# DevFinder 

### Stop coding in a vacuum. Start building in a pack.

We've all been there. You've got a world-changing idea but you're stuck because you're a CSS wizard who can't write a SQL query to save your life. Or maybe you're a backend architect whose UI designs look like they were pulled from a 1994 GeoCities archive.

DevFinder is the bridge — a matchmaker built by developers, for developers. No more solo-grinding through hackathons. Find your missing piece, sync up with the right talent, and turn those "what if" ideas into "look at this" realities.

**🌍 Live Deployments:**
- **Frontend:** [https://devfinder-orpin.vercel.app](https://devfinder-orpin.vercel.app)
- **Backend API:** [https://devfinder-backend-ll4g.onrender.com](https://devfinder-backend-ll4g.onrender.com)
- **Database:** Hosted on [Neon.tech](https://neon.tech/)

---

## What's DevFinder all about?

Two distinct experiences depending on who you are:

- **Developers** — Create teams, apply to join existing ones, build out your skill profile, discover hackathons, and chat in real-time with your squad.
- **Admins** — A dedicated control panel to monitor the platform, moderate teams, feature standout squads, and blast notifications to every user at once.

---

## Features

### 🔐 Auth
- Secure register/login with bcrypt-hashed passwords
- JWT-based session management (7-day tokens)
- Auth middleware protecting all private routes

### 👤 User Profiles
- Edit your name, bio, GitHub URL, and LinkedIn URL
- Add and manage your skill tags (stored and used for smart matching)
- View your member-since year, team count, and skill count on the profile page
- Avatar upload UI (coming soon ⚡)

### 🛠️ Team System
- Host a team — set the name, tech stack, roles needed, team size, and deadline
- Link a team directly to a hackathon (new or existing)
- Filter all teams by hackathon, role, or tech stack
- Featured teams appear at the top of the board
- Team hosts can manage their squad: accept/reject applicants, view members, kick people out

### 🤖 Smart Recommendations
- Hit the "Recommended" tab and DevFinder matches you to teams based on your skills
- Uses fuzzy `ILIKE` matching against each team's tech stack and roles
- Teams are scored by how many of your skills they match — best fits come first
- Works regardless of whether skills are stored as plain text or an array (both formats handled)

### 📋 Application System
- Apply to any team with a custom role selection and pitch message
- Can't apply to your own team (obviously)
- Can't double-apply — duplicate check is in place
- Team size cap enforced on acceptance — no overstuffing a squad
- Button state updates live after applying (shows ⏳ APPLIED, ✅ ACCEPTED, etc.)

### 🏆 Hackathons
- Browse all hackathons in a dedicated section
- Teams can be tied to a hackathon at creation time
- Type a new hackathon name in the combobox — if it doesn't exist, it gets auto-created
- Admins can add, edit, and delete hackathons

### 💬 Real-Time Chat
- Every team gets its own chat channel via Socket.io
- Full message history loaded on open (from the DB)
- New messages broadcast live to all connected members
- Only team members (host + accepted applicants) can access a team's chat

### 🔔 Live Notifications
- Bell icon in the top bar with an unread count badge
- Notifications fire for: new application received, application accepted/rejected, admin broadcasts
- Real-time delivery via Socket.io — no refresh needed
- Mark all as read in one click

### 🛡️ Admin Panel
- Accessible only to users with `is_admin = true`
- Platform stats: total users, teams, and applications
- Broadcast a message to every user on the platform simultaneously
- Delete any team
- Feature/unfeature teams (featured teams get pinned to the top of the board)
- Verify/unverify users
- Add, edit, and delete hackathons

---

## Tech Stack

**Frontend**
- HTML5 / CSS3 / Vanilla JavaScript
- Socket.io client
- Font Awesome icons
- Hosted on Vercel

**Backend**
- Node.js + Express.js (v5)
- Socket.io for WebSockets
- JWT (`jsonwebtoken`) for auth
- bcryptjs for password hashing
- Hosted on Render

**Database**
- PostgreSQL via [Neon.tech](https://neon.tech/) (serverless, HTTP driver)
- Schema: `users`, `teams`, `team_members`, `applications`, `messages`, `notifications`, `hackathons`

---

## Database Schema (quick look)

```sql
users          -- accounts, skills, bio, github/linkedin, is_admin flag
teams          -- name, tech_stack[], roles[], deadline, hackathon_id, is_featured
applications   -- team_id, applicant_id, role, message, status (pending/accepted/rejected)
messages       -- real-time chat history per team
notifications  -- per-user alert feed with is_read flag
hackathons     -- name, description, dates, location, website_url
```

---

## API Routes (overview)

| Method | Route | What it does |
|--------|-------|--------------|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Login, get JWT |
| GET | `/api/users/me` | Fetch own profile |
| PUT | `/api/users/profile` | Update profile/skills |
| GET | `/api/teams` | All teams (with filters) |
| GET | `/api/teams/recommended` | Skill-matched team suggestions |
| GET | `/api/teams/my-teams` | Teams you're in |
| POST | `/api/teams` | Create a team |
| DELETE | `/api/teams/:id` | Delete team (owner or admin) |
| POST | `/api/applications` | Apply to a team |
| GET | `/api/applications/me` | Your application history |
| GET | `/api/applications/team/:id` | Applicants for your team |
| PUT | `/api/applications/:id/status` | Accept or reject an applicant |
| GET | `/api/chat/:teamId` | Fetch chat history |
| GET | `/api/notifications` | Your notifications |
| PUT | `/api/notifications/read-all` | Mark all as read |
| GET | `/api/hackathons` | All hackathons |
| POST | `/api/hackathons` | Create a hackathon |
| PUT | `/api/hackathons/:id` | Edit hackathon (admin) |
| DELETE | `/api/hackathons/:id` | Delete hackathon (admin) |
| GET | `/api/admin/stats` | Platform stats (admin) |
| POST | `/api/admin/broadcast` | Notify all users (admin) |
| PUT | `/api/admin/feature-team/:id` | Feature/unfeature a team (admin) |
| PUT | `/api/admin/verify-user/:id` | Verify a user (admin) |

---

## Local Setup

### 1. Clone the repo
```bash
git clone https://github.com/SREERAG-CODER/DevFinder.git
cd DevFinder
```

### 2. Fire up the backend
```bash
cd backend
npm install
```

Create a `.env` in the `backend` folder:
```env
PORT=5000
JWT_SECRET=your_unique_secret_key
DATABASE_URL=your_neon_postgresql_connection_string
```

Run the dev server:
```bash
npm run dev
```

### 3. Launch the frontend
No build step needed — it's vanilla HTML/CSS/JS.

- Open the project in VS Code
- Right-click any HTML file inside `frontend` and hit **Open with Live Server**
- It'll auto-detect `localhost` and connect to your local backend

> The frontend checks `window.location.hostname` — if it's `localhost` or `127.0.0.1` it hits `http://127.0.0.1:5000`, otherwise it points to the Render deployment.

---

## Team

Built with ☕ and way too many late nights by:

| Name | Roll No. | Links |
|------|----------|-------|
| **SREERAG T C** | AM.SC.U4CSE25252 | [GitHub](https://github.com/SREERAG-CODER) |
| **ARYAN RAJESH** | AM.SC.U4CSE25206 | [Portfolio](https://aryan-rjsh.github.io/final-portfolio/) |
| **NIVED KRISHNA** | AM.SC.U4CSE25265 | [Portfolio](https://niveddd-007.github.io/html-portfolio/) |
| **ABHISHEK R PILLAI** | AM.SC.U4CSE25266 | [Portfolio](https://abhi221c101c-sudo.github.io/Portfolio_html_css/) |
