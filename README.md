# WhatsApp Employee Click Tracker

Track how many people click your employees' WhatsApp links. Share short tracking URLs in ads, social media, and QR codes — each click is logged, then the visitor is redirected to WhatsApp.

## Features

- One tracking link per employee (`/go/ahmed`)
- Click counts: today, this week, this month, all time
- Admin dashboard to add/edit employees and copy links
- Password-protected admin area

## Quick start (local)

### 1. Install dependencies

```bash
npm install
```

### 2. Create a Turso database

1. Sign up at [turso.tech](https://turso.tech) (free tier)
2. Create a database
3. Create an auth token

### 3. Configure environment

Copy `.env.example` to `.env.local` and fill in:

```env
TURSO_DATABASE_URL=libsql://your-db-name.turso.io
TURSO_AUTH_TOKEN=your-turso-auth-token
ADMIN_PASSWORD=your-strong-password
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Run migration

```bash
npm run db:migrate
```

### 5. Start dev server

```bash
npm run dev
```

Open [http://localhost:3000/admin](http://localhost:3000/admin), log in, and add employees.

## Deploy to Vercel

### 1. Push to GitHub

Create a repo and push this project.

### 2. Import in Vercel

1. Go to [vercel.com](https://vercel.com) → **Add New Project**
2. Import your GitHub repo
3. Add environment variables:

| Variable | Description |
|----------|-------------|
| `TURSO_DATABASE_URL` | Turso database URL (`libsql://...`) |
| `TURSO_AUTH_TOKEN` | Turso auth token |
| `ADMIN_PASSWORD` | Password for `/admin` login |
| `NEXT_PUBLIC_APP_URL` | Your public URL (e.g. `https://your-app.vercel.app`) |

4. Deploy

### 3. Run migration (once)

After first deploy, run migration against your production database:

```bash
# Set the same env vars locally, then:
npm run db:migrate
```

Or run it from any machine with access to your Turso credentials.

### 4. Optional: custom domain

In Vercel → **Settings → Domains**, add e.g. `go.yourbusiness.com`. Update `NEXT_PUBLIC_APP_URL` to match.

## Usage

1. Add each employee in the admin dashboard (name, WhatsApp number, URL slug).
2. Copy their tracking link (e.g. `https://your-app.vercel.app/go/ahmed`).
3. Use **only** these links in marketing — not raw `wa.me` links.
4. Check the dashboard for click counts per employee.
5. Compare clicks with your reservation data (tracked separately) to measure conversion.

## Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `TURSO_DATABASE_URL` | Yes | Turso/libSQL database URL |
| `TURSO_AUTH_TOKEN` | Yes | Turso authentication token |
| `ADMIN_PASSWORD` | Yes | Admin dashboard password |
| `NEXT_PUBLIC_APP_URL` | Recommended | Base URL for tracking links in admin UI |

## Tech stack

- [Next.js](https://nextjs.org) (App Router)
- [Turso](https://turso.tech) (SQLite)
- [Tailwind CSS](https://tailwindcss.com)
- [Vercel](https://vercel.com) (hosting)
