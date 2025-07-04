# SwingMate

Your Personal Swing Trade Assistant

## Features
- Trade journal (manual input)
- Watchlist with price updates
- Chart view (basic, with indicators)
- Strategy notes/prompts page
- Data via Alpha Vantage (free tier)

## Tech Stack
- Next.js (React, TypeScript)
- TailwindCSS
- PostgreSQL (Docker)
- Prisma ORM
- NextAuth.js (email auth)

## Getting Started

### 1. Clone the repo
```bash
git clone <repo-url>
cd swingmate
```

### 2. Environment Variables
Copy `.env.example` to `.env` and fill in your values:
```bash
cp .env.example .env
```

### 3. Start with Docker Compose
```bash
docker-compose up --build
```

### 4. Run Prisma Migrations
In a new terminal:
```bash
docker-compose exec web npx prisma migrate dev --name init
```

### 5. Open the app
Visit [http://localhost:3000](http://localhost:3000)

## Development
- App code is in `/src`
- Prisma schema in `/prisma`
- Tailwind config in root

## Troubleshooting
- If Tailwind styles do not load, ensure the config files are present and the CSS imports are correct.
- If you have issues with the database, check the `db` service logs in Docker Compose.

---
Happy trading!
