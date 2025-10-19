# 🚀 Quick Reference Card

## Essential Commands

### Development
```bash
pnpm dev              # Start dev server with hot reload
pnpm build            # Build for production
pnpm start            # Start production server
```

### Testing
```bash
pnpm test:redis                # Test Redis connection
pnpm test:redis:integration    # Full Redis integration test
pnpm test:all                  # Run all tests
```

### Database
```bash
pnpm prisma:generate   # Generate Prisma client
pnpm prisma:migrate    # Run migrations
pnpm prisma:studio     # Open Prisma Studio
```

### Genkit
```bash
pnpm genkit           # Start Genkit Dev UI (port 4000)
```

---

## Environment Variables

### Required
```bash
GOOGLE_API_KEY=your_key_here
DATABASE_URL=postgresql://...
```

### Redis (Upstash)
```bash
UPSTASH_REDIS_REST_URL=https://finer-coral-19065.upstash.io
UPSTASH_REDIS_REST_TOKEN=AUp5AAIncDJmMjliZGY3OWVlMmI0MjAyOTM2YTc0MmJhMTY4NzFlY3AyMTkwNjU
```

---

## API Endpoints

### Health Check
```bash
GET /health
```

### Phase 1: Spec Analyzer
```bash
POST /api/analyze-spec          # Upload and analyze PDF
GET  /api/analyze-spec/history  # Get analysis history
GET  /api/analyze-spec/:id      # Get specific analysis
```

### Phase 2: Code Review
```bash
POST /api/code-review/upload-context     # Upload codebase
POST /api/code-review/review-changes     # Review changes
POST /api/code-review/quick-review       # One-step review
GET  /api/code-review/context/:id        # Get context info
```

---

## Quick Tests

### Test Server
```bash
curl http://localhost:3001/health
```

### Test Redis
```bash
pnpm test:redis
```

### Test Full Integration
```bash
pnpm test:all
```

---

## Troubleshooting

| Issue | Command |
|-------|---------|
| Port in use | `lsof -i :3001` |
| Redis not working | `pnpm test:redis` |
| Build fails | `pnpm build` |
| DB issues | `pnpm prisma:generate` |

---

## File Structure

```
src/
├── config/          # Redis, DB, Gemini config
├── controllers/     # API controllers
├── services/        # Business logic
├── prompts/         # AI prompts
└── routes/          # API routes

docs/                # Full documentation
test-*.ts           # Test scripts
```

---

## Important Files

| File | Purpose |
|------|---------|
| `REDIS_SETUP.md` | Redis configuration guide |
| `DEPLOYMENT_CHECKLIST.md` | Pre-deployment checks |
| `DEPLOYMENT_GUIDE.md` | Full deployment guide |
| `REDIS_INTEGRATION_SUMMARY.md` | Redis integration details |

---

## Redis Cache TTL

| Type | TTL | Key Format |
|------|-----|------------|
| AI Analysis | 1 hour | `analysis:{hash}` |
| Project Context | 24 hours | `project_context:{id}` |
| Code Review | 1 hour | `review:{hash}` |

---

## Server Ports

| Service | Port |
|---------|------|
| API Server | 3001 |
| Genkit Dev UI | 4000 |
| Prisma Studio | 5555 |

---

## Status Indicators

### Server Logs
```
✅ Redis configured (Upstash REST API)  # Redis OK
🚀 DevInsight AI Backend                # Server started
📍 Server running on: http://...        # Server ready
```

### Test Results
```
🎉 All Redis operations successful!     # Basic test OK
🎉 All Redis integration tests passed!  # Full test OK
```

---

## Quick Deploy

1. **Build**
   ```bash
   pnpm build
   ```

2. **Test**
   ```bash
   pnpm test:all
   ```

3. **Deploy**
   - Push to GitHub
   - Connect to Render.com
   - Add environment variables
   - Deploy!

See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for details.

---

## Support Resources

- 📚 Full docs: `docs/` folder
- 🔧 Setup guide: `docs/03-getting-started.md`
- 🚀 Deployment: `DEPLOYMENT_GUIDE.md`
- 🔴 Redis: `REDIS_SETUP.md`
- ✅ Checklist: `DEPLOYMENT_CHECKLIST.md`

---

**Last Updated**: 2025-10-19
**Status**: ✅ Production Ready
