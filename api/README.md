# Eivitech CRM API

Backend API for the Eivitech CRM funnel.

## Railway deployment

Deploy this folder as an isolated service from the repository.

Railway service settings:

- Root Directory: `api`
- Build Command: `npm install && npm run build`
- Start Command: `npm start`

Required variables:

- `DATABASE_URL`
- `CLERK_SECRET_KEY`
- `CLERK_PUBLISHABLE_KEY`
- `BOOTSTRAP_ADMIN_EMAILS`
- `ALLOWED_ORIGIN`

Optional variables:

- `N8N_WEBHOOK_URL`
- `N8N_WEBHOOK_SECRET`
- `PGSSLMODE`

## Endpoints

Public:

- `GET /health`
- `GET /api/health`
- `POST /api/leads`

Protected by Clerk + CRM user authorization:

- `GET /api/leads`
- `GET /api/leads/:id`
- `PATCH /api/leads/:id`
- `POST /api/leads/:id/activities`
- `GET /api/dashboard/stats`

## Security note

Do not call PostgreSQL directly from GitHub Pages. The frontend must call this API, and this API must be the only layer that uses `DATABASE_URL` and `CLERK_SECRET_KEY`.
