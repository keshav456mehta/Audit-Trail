# Deployment

Nothing here has been deployed for you: these are the steps. Docker and the cloud steps are **untested** in the
environment this project was prepared in (no Docker daemon, no cloud account), so treat them as a checklist.

## Option A: Docker Compose (everything local)

```bash
cp .env.example .env          # fill in JWT_SECRET (>= 32 chars) and the three SEED_* passwords
docker compose up --build
docker compose run --rm backend node scripts/seed.js
# dashboard: http://localhost:8080   API: http://localhost:5000
```

## Option B: managed services (public URL)

1. **Database:** create a MongoDB Atlas cluster. Create an Atlas custom role equal to `eventAppender` in
   `backend/scripts/mongo-appender-role.js` (find+insert on `eventstores`; full access to the other collections) and a user with it.
2. **Backend (Render / Railway):** root directory `backend`, build `npm ci`, start `npm start`. Environment:
   `NODE_ENV=production`, `MONGO_URI`, `JWT_SECRET`, `CORS_ORIGINS=https://<your-frontend-domain>`, `TRUST_PROXY=true`.
   Then run `npm run seed` once (set the `SEED_*_PASSWORD` variables first). Health check path: `/health`.
3. **Frontend (Vercel / Netlify):** root directory `frontend`, build `npm run build`, output `dist`,
   environment `VITE_API_URL=https://<your-backend-domain>`.
4. Open the frontend URL and sign in. Put that URL in your portfolio and README.

## Production checklist

- [ ] `JWT_SECRET` is random and ≥ 32 characters (the server refuses to start otherwise)
- [ ] The app connects with the append-only database user
- [ ] `CORS_ORIGINS` lists only your real frontend origin(s)
- [ ] Seeded demo passwords were changed or the demo users deleted
- [ ] `npm run verify:chain` runs on a schedule (cron) and its output is monitored
