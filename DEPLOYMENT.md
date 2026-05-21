# AETHER OS Deployment Guide

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes (prod) | PostgreSQL connection string |
| `REDIS_URL` | No | Redis for caching |
| `JWT_SECRET` | Yes | Access token signing secret |
| `JWT_REFRESH_SECRET` | Yes | Refresh token secret |
| `NEXT_PUBLIC_APP_URL` | Yes | Public app URL |
| `OPENAI_API_KEY` | No | For real AI features |

## Vercel Deployment

1. Connect repository to Vercel
2. Framework preset: **Next.js**
3. Build command: `npm run build`
4. Add all variables from `.env.example`
5. Use **Supabase** or **Neon** for `DATABASE_URL`
6. After deploy, run migrations:
   ```bash
   npx prisma migrate deploy
   npx prisma db seed
   ```

## Railway Backend

1. Create Railway project
2. Add PostgreSQL plugin → copy `DATABASE_URL`
3. Add Redis plugin (optional)
4. Deploy from GitHub or `railway up`
5. Set env vars in Railway dashboard

## Docker Production

```bash
# Build and run full stack
docker compose up -d --build

# Run migrations inside app container
docker compose exec app npx prisma db push
docker compose exec app npm run db:seed
```

## Health Checks

- App: `GET /api/analytics/dashboard` → 200
- DB: `npx prisma db execute --stdin <<< "SELECT 1"`

## Security Checklist

- [ ] Rotate JWT secrets in production
- [ ] Enable HTTPS only cookies
- [ ] Restrict CORS origins
- [ ] Rate limit `/api/auth/login`
- [ ] Never commit `.env`
