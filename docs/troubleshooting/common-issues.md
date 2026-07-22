# Troubleshooting

## Common Issues

### 502 Bad Gateway

**Cause:** Backend service is not running  
**Fix:** Ensure all services are started: `cd Backend && pnpm dev`

### Login Returns "Network Error"

**Cause:** API Gateway or Auth Service not running  
**Fix:** Check services are up: `curl http://localhost:4000/api/v1/health`

### 401 Unauthorized After Login

**Cause:** Token expired or invalid  
**Fix:** Clear localStorage and login again

### CORS Error in Browser

**Cause:** Frontend origin not in CORS allowlist  
**Fix:** Set `CORS_ORIGIN` env var in Backend/.env

### "Trust Proxy" Validation Error

**Cause:** express-rate-limit behind reverse proxy  
**Fix:** Added `validate: { trustProxy: false }` to rate limiter config

### 2FA Code Not Working

**Cause:** Time drift between server and authenticator app  
**Fix:** We configured `window: 2` (±60s tolerance). Ensure server time is synced via NTP.

### APK Shows Blank Screen

**Cause:** Missing or wrong asset paths in Capacitor build  
**Fix:** Rebuild with latest GitHub Actions workflow. Ensure `NEXT_PUBLIC_API_URL` is set.

### "src refspec main does not match any"

**Cause:** No commits yet on branch  
**Fix:** Run `git commit -m "initial"` before `git push`

## FAQ

**Q: How do I reset the database?**  
A: Run `run.bat` → Menu 6 (Reset Database + Seed)

**Q: How do I build the Android APK?**  
A: GitHub Actions on every push, or local: `run.bat` → Menu 5

**Q: How do I add new users?**  
A: Register via the web app or use the Prisma seed script

**Q: How do I change the JWT secret?**  
A: Set `JWT_SECRET` in Backend/.env before starting services
