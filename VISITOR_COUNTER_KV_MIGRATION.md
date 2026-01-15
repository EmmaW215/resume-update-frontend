# Visitor Counter – Migration to Vercel KV (Upstash Redis)

**Date:** 2025-08-07  
**Version:** 1.0.6  
**Scope:** Frontend only (`resume-matcher-frontend`)

## 1. Why migrate?
The original visitor counter relied on a local JSON file and later a Redis-Cloud instance.  
These approaches failed on Vercel because of either read-only file system or missing REST credentials, causing the counter to reset or show **Error**.

## 2. Solution – Vercel KV
[Vercel KV](https://vercel.com/storage/kv) (powered by Upstash Redis) offers:
- Global, persistent storage with REST endpoints
- Native integration with Vercel Dashboard – automatic env-var injection
- Free tier sufficient for the visitor counter workload

## 3. Setup steps
1. **Create KV database**  
   Dashboard → Storage → **Create Database** → choose region & Free plan → name: `matchwise-kv`.
2. **Connect to project**  
   • Click **Connect Project**  
   • Select `matchwise-ai-app`  
   • Environment: **Production**  
   • *Clear* the _Environment Variables Prefix_ → leave blank  
   • Click **Add Environment Variables**.
3. **Environment variables injected** (Production):
   | Key | Example value |
   |-----|---------------|
   | `KV_REST_API_URL` | `https://upward-puma-22860.upstash.io` |
   | `KV_REST_API_TOKEN` | `AYmAAAjcDEzOWY2OGJYTZ...` |
4. **Remove legacy variables**  
   `REDIS_URL`, `STORAGE_REST_*`, or any previous `KV_REST_API_*` pointing to redis-cloud.com.
5. **Trigger redeploy**  
   Push to `main` **or** run `npx vercel --prod --yes` to pick up new vars.
6. **Verify**  
   Open site → `Visitors:` shows number, increments on refresh, no **Error**.

## 4. Code changes
*File:* `src/app/api/visitor-count/route.ts`
- Replaced manual `require('@vercel/kv')` with native env vars.  
- Added robust error handling & in-memory fallback.

*File:* `src/app/components/VisitorCounter.tsx`
- Endpoint changed from `/api/visitor-count` (unchanged) but now backed by KV.

## 5. Troubleshooting
| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| **Error** tooltip, console 500 `Missing KV_REST_API_URL` | Vars not injected | Re-connect KV or check env scopes |
| 500 `Missing KV_REST_API_TOKEN` | Same as above | Ensure token present & **Sensitive** |
| Count resets | KV cleared or INIT flag missing | Check `INIT_FLAG_KEY` in KV |

## 6. Rollback
If KV is unavailable, the API route falls back to in-memory cache for up to 5 minutes, ensuring the UI doesn’t break.  
For full rollback, restore previous Redis-Cloud URL and tokens, adjust env vars, and redeploy.

---
*Maintainer:* Emma Wang  
*Last updated:* 2025-08-07