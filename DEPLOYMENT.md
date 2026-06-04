# DEKUTCONNECT WA-Bot Deployment Guide

This repository is split into deployable concerns:

| Path / URL | Purpose | Best free/low-cost host |
| --- | --- | --- |
| `gifted-session-main/` | Authenticated web console, pairing UI, session API | Vercel for UI/API, with Firebase bridge mode |
| [Downloader Service](https://dekutconnectdownloaders.vercel.app/) | Public downloader/API service | Hosted on Vercel |
| repository root | Long-running WhatsApp bot worker | VPS, Docker, or Kubernetes only |

## Security baseline

1. Rotate every token/password that has been pasted into chat or committed locally.
2. Keep secrets in host environment variables only. Do not hardcode Cloudflare, Vercel, Supabase, Firebase service-account, or database passwords.
3. Use `.env.example` files as templates; never upload real `.env` files.
4. Use Firebase Auth for users, Firebase Admin service credentials only on trusted server/VPS environments, and Supabase/PostgreSQL credentials only server-side.
5. Keep WhatsApp session files out of Git. They are ignored by `.gitignore`.

## Private VPS communication

If the bot VPS has no public URL, Vercel cannot call it directly. Use outbound Firebase bridge mode:

### Vercel/session app

Set these variables in `gifted-session-main`:

```env
BOT_CONTROL_MODE=firebase
FIREBASE_PROJECT_ID=dekut-app-main
FIREBASE_DATABASE_URL=https://dekut-app-main-default-rtdb.firebaseio.com
FIREBASE_ADMIN_CREDENTIAL=<base64-service-account-json>
DATABASE_URL=<supabase-session-pooler-url>
```

### VPS bot worker

Set these variables in the root bot app:

```env
BOT_BRIDGE_ENABLED=true
BOT_UID=<firebase-user-uid-or-stable-worker-id>
FIREBASE_PROJECT_ID=dekut-app-main
FIREBASE_DATABASE_URL=https://dekut-app-main-default-rtdb.firebaseio.com
FIREBASE_ADMIN_CREDENTIAL=<base64-service-account-json>
DATABASE_URL=<supabase-session-pooler-url>
REDIS_URL=redis://localhost:6379
```

The VPS bot listens for commands under `botCommands/{uid}` and publishes heartbeat/status under `botStatus/{uid}`.

## Scaling reality

Free tiers can cache and absorb traffic spikes, but they cannot run one million live WhatsApp bot sessions. For one million concurrent users:

- Put Cloudflare in front for CDN caching, WAF, bot protection, and rate limiting.
- Keep static frontend assets on Cloudflare Pages/Firebase Hosting/Vercel Edge.
- Use Supabase Postgres with the Session Pooler for serverless clients and tuned pools for VPS workers.
- Use Redis for distributed locks, hot status cache, and request deduplication.
- Store media in S3-compatible storage such as Cloudflare R2, MinIO, or AWS S3.
- Run bot workers horizontally on VPS/Kubernetes with one active owner per session lock.
- Do not force logout users. Use rolling deploys, graceful shutdown, status drain, and persisted sessions.

## VPS run

```bash
npm ci --omit=dev
npm run start
```

For Docker:

```bash
docker compose up -d --build
```

Health endpoint:

```bash
curl http://localhost:5000/health
```
