# 🚀 Complete Deployment Guide

Deploy Code Splainer Backend to **Render.com** (100% FREE) in 10 minutes.

---

## 📋 What You Need (5 minutes to get)

1. **GitHub Account** - [Sign up here](https://github.com/signup)
2. **Google AI API Key** - [Get it here](https://makersuite.google.com/app/apikey) (Free)
3. **Upstash Redis Account** - [Sign up here](https://upstash.com/) (Free)

---

## ⚡ Step-by-Step Deployment

### Step 1: Verify Your Code is Ready (1 minute)

```bash
cd code-splainer-be

# Run pre-deployment check
./deploy-check.sh
```

**Expected output:** All checks should pass ✓

If any checks fail, fix the issues before continuing.

---

### Step 2: Push Code to GitHub (2 minutes)

```bash
# Initialize git (if not already done)
git init
git add .
git commit -m "Ready for deployment"

# Create a new repository on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/code-splainer-be.git
git branch -M main
git push -u origin main
```

✅ **Checkpoint:** Your code is now on GitHub

---

### Step 3: Setup Upstash Redis (2 minutes)

1. Go to [Upstash Console](https://console.upstash.com/)
2. Click **"Create Database"**
3. Configure:
   - **Name:** `code-splainer-redis`
   - **Type:** Choose **"Global"** (free tier)
   - **Region:** Select closest to you
4. Click **"Create"**
5. **Copy these values** (you'll need them later):
   - **Endpoint** (e.g., `redis-12345.upstash.io`)
   - **Port** (usually `6379`)
   - **Password** (click "Show" to reveal)

✅ **Checkpoint:** Redis is ready, credentials saved

---

### Step 4: Create Render Account & PostgreSQL Database (3 minutes)

#### 4.1 Create Render Account

1. Go to [Render.com](https://render.com/)
2. Click **"Get Started"**
3. Sign up with your GitHub account
4. Authorize Render to access your repositories

#### 4.2 Create PostgreSQL Database

1. In Render Dashboard, click **"New +"** → **"PostgreSQL"**
2. Configure:
   - **Name:** `code-splainer-db`
   - **Database:** `devinsight_ai`
   - **User:** `devinsight_user`
   - **Region:** Singapore (or closest to you)
   - **PostgreSQL Version:** 16 (latest)
   - **Plan:** **Free**
3. Click **"Create Database"**
4. Wait ~2 minutes for database to be ready
5. Once ready, click on the database name
6. **Copy the "Internal Database URL"** (starts with `postgresql://`)
   - ⚠️ Use **Internal** URL, NOT External URL

✅ **Checkpoint:** Database is ready, Internal URL copied

---

### Step 5: Create Web Service (2 minutes)

1. In Render Dashboard, click **"New +"** → **"Web Service"**
2. Click **"Build and deploy from a Git repository"**
3. Click **"Connect"** next to your GitHub repository
4. Configure the service:

   **Basic Settings:**
   - **Name:** `code-splainer-be`
   - **Region:** Singapore (same as database)
   - **Branch:** `main`
   - **Root Directory:** Leave empty (or `code-splainer-be` if in monorepo)
   - **Runtime:** Node
   - **Build Command:**
     ```bash
     npm install && npm run prisma:generate && npm run build
     ```
   - **Start Command:**
     ```bash
     npm run start:prod
     ```

   **Advanced Settings:**
   - **Plan:** Free
   - **Health Check Path:** `/health`
   - **Auto-Deploy:** Yes

5. **DON'T click "Create Web Service" yet** - we need to add environment variables first

✅ **Checkpoint:** Service configured, ready for environment variables

---

### Step 6: Add Environment Variables (3 minutes)

Scroll down to **"Environment Variables"** section and add these:

Click **"Add Environment Variable"** for each:

| Key | Value | Notes |
|-----|-------|-------|
| `NODE_ENV` | `production` | Environment mode |
| `PORT` | `10000` | Render's default port |
| `DATABASE_URL` | `<paste_internal_url_from_step_4>` | From PostgreSQL dashboard |
| `REDIS_HOST` | `<your_upstash_host>` | From Step 3 (e.g., `redis-12345.upstash.io`) |
| `REDIS_PORT` | `6379` | Standard Redis port |
| `REDIS_PASSWORD` | `<your_upstash_password>` | From Step 3 |
| `GOOGLE_API_KEY` | `<your_google_ai_key>` | From Google AI Studio |
| `GOOGLE_AI_MODEL` | `gemini-2.5-pro` | AI model to use |
| `MAX_FILE_SIZE` | `10485760` | 10MB for PDF files |
| `MAX_ZIP_SIZE` | `52428800` | 50MB for ZIP files |
| `UPLOAD_DIR` | `/tmp/uploads` | Temporary upload directory |

**⚠️ Important Notes:**
- Use **Internal Database URL** (not external)
- Don't include `https://` in `REDIS_HOST`
- Keep `GOOGLE_API_KEY` secret

✅ **Checkpoint:** All environment variables added

---

### Step 7: Deploy! (5-10 minutes)

1. Click **"Create Web Service"**
2. Render will start building your application
3. Watch the logs in real-time:
   - Installing dependencies...
   - Generating Prisma Client...
   - Building TypeScript...
   - Deploying...

**Expected logs:**
```
==> Installing dependencies
==> Running build command
==> Build successful
==> Deploying
==> Your service is live at https://code-splainer-be.onrender.com
```

⏱️ **Wait time:** 5-10 minutes for first deployment

✅ **Checkpoint:** Deployment complete!

---

### Step 8: Test Your Deployment (2 minutes)

#### 8.1 Test Health Endpoint

```bash
curl https://code-splainer-be.onrender.com/health
```

**Expected response:**
```json
{
  "status": "OK",
  "message": "DevInsight AI Backend is running",
  "timestamp": "2025-10-19T13:37:04.000Z"
}
```

#### 8.2 Test Root Endpoint

```bash
curl https://code-splainer-be.onrender.com/
```

**Expected response:**
```json
{
  "name": "DevInsight AI Backend",
  "version": "1.0.0",
  "endpoints": {
    "health": "/health",
    "api": "/api",
    ...
  }
}
```

#### 8.3 Test API Endpoint (Optional)

```bash
# Test Phase 1: Spec Analyzer
curl -X POST https://code-splainer-be.onrender.com/api/analyze-spec/history
```

**Expected response:**
```json
{
  "success": true,
  "data": []
}
```

✅ **Checkpoint:** All tests passed! Your API is live! 🎉

---

## 🎉 Success! What's Next?

### Update Your Frontend

Edit `code-splainer-fe/.env`:

```bash
VITE_API_BASE_URL=https://code-splainer-be.onrender.com
```

Then restart your frontend:
```bash
cd code-splainer-fe
npm run dev
```

---

### Keep Your Free Tier Alive (Optional)

**Problem:** Free tier spins down after 15 minutes of inactivity  
**Solution:** Use UptimeRobot to ping your API every 5 minutes

1. Go to [UptimeRobot](https://uptimerobot.com/) (free)
2. Sign up and create a new monitor:
   - **Monitor Type:** HTTP(s)
   - **Friendly Name:** Code Splainer Backend
   - **URL:** `https://code-splainer-be.onrender.com/health`
   - **Monitoring Interval:** 5 minutes
3. Save

Now your API stays awake 24/7! 🎯

---

### Enable Auto-Deploy

Already enabled! Every push to `main` branch will automatically deploy.

```bash
# Make changes
git add .
git commit -m "Update feature"
git push origin main

# Render automatically deploys! 🚀
```

---

## 🐛 Troubleshooting

### Build Failed

**Error:** `Cannot find module '@prisma/client'`

**Solution:**
```bash
# Ensure build command includes prisma:generate
npm install && npm run prisma:generate && npm run build
```

---

**Error:** `TypeScript compilation failed`

**Solution:**
```bash
# Test build locally first
npm run build

# Fix any TypeScript errors shown
```

---

### Database Connection Failed

**Error:** `Can't reach database server`

**Solutions:**
1. ✅ Use **Internal Database URL** (not external)
2. ✅ Ensure database and web service in same region
3. ✅ Check `DATABASE_URL` format:
   ```
   postgresql://USER:PASSWORD@HOST:PORT/DATABASE
   ```
4. ✅ Verify database is running (check Render dashboard)

---

### Redis Connection Failed

**Error:** `Redis connection timeout`

**Solutions:**
1. ✅ Verify Upstash credentials are correct
2. ✅ Check `REDIS_HOST` doesn't include `https://` or port
3. ✅ Ensure `REDIS_PORT` is `6379`
4. ✅ Test connection in Render Shell:
   ```bash
   node -e "const Redis = require('ioredis'); const redis = new Redis({host: process.env.REDIS_HOST, port: process.env.REDIS_PORT, password: process.env.REDIS_PASSWORD}); redis.ping().then(console.log);"
   ```

---

### API Returns 500 Error

**Error:** `Internal Server Error`

**Solutions:**
1. ✅ Check all environment variables are set
2. ✅ Verify `GOOGLE_API_KEY` is correct
3. ✅ View logs in Render Dashboard
4. ✅ Check for missing dependencies

---

### Deployment is Slow

**Issue:** First request takes 30+ seconds

**Explanation:** Free tier spins down after 15 minutes of inactivity

**Solutions:**
1. ✅ Use UptimeRobot (see above)
2. ✅ Upgrade to paid tier ($7/month - no spin down)
3. ✅ Accept the cold start delay

---

### Migration Failed

**Error:** `Prisma migration failed`

**Solution:**
```bash
# In Render Dashboard → Shell tab
npm run prisma:migrate:deploy
```

Or check logs for specific migration errors.

---

## 📊 What You Get (All Free!)

| Service | Free Tier | What You Get |
|---------|-----------|--------------|
| **Render.com** | 750 hours/month | Backend hosting + PostgreSQL |
| **PostgreSQL** | 256MB | Database storage |
| **Upstash Redis** | 10K commands/day | Caching & context storage |
| **Google AI** | 60 req/min | AI API access |
| **SSL/HTTPS** | Included | Automatic certificates |
| **Auto-Deploy** | Included | Deploy on git push |

**Total Cost: $0/month** 🎉

---

## 📝 Deployment Checklist

Use this to verify everything is set up correctly:

### Pre-Deployment
- [ ] Code builds locally: `npm run build`
- [ ] Tests pass (if any)
- [ ] Environment variables documented
- [ ] Code pushed to GitHub
- [ ] No secrets in code

### External Services
- [ ] Google AI API Key obtained
- [ ] Upstash Redis account created
- [ ] Redis credentials saved
- [ ] GitHub repository accessible

### Render Setup
- [ ] Render account created
- [ ] PostgreSQL database created
- [ ] Internal Database URL copied
- [ ] Web Service created
- [ ] Build command configured
- [ ] Start command configured
- [ ] Health check path set

### Environment Variables
- [ ] `NODE_ENV=production`
- [ ] `PORT=10000`
- [ ] `DATABASE_URL` (Internal URL)
- [ ] `REDIS_HOST` (from Upstash)
- [ ] `REDIS_PORT=6379`
- [ ] `REDIS_PASSWORD` (from Upstash)
- [ ] `GOOGLE_API_KEY` (from Google AI)
- [ ] `GOOGLE_AI_MODEL=gemini-2.5-pro`
- [ ] `MAX_FILE_SIZE=10485760`
- [ ] `MAX_ZIP_SIZE=52428800`
- [ ] `UPLOAD_DIR=/tmp/uploads`

### Post-Deployment
- [ ] Health endpoint works
- [ ] Root endpoint works
- [ ] API endpoints respond
- [ ] Database connected
- [ ] Redis connected
- [ ] No errors in logs
- [ ] Frontend updated with API URL

### Optional
- [ ] UptimeRobot monitor added
- [ ] Auto-deploy enabled
- [ ] Team notified

---

## 🔧 Useful Commands

### View Logs
```bash
# In Render Dashboard → Logs tab
# Or use Render CLI:
render logs -s code-splainer-be
```

### Access Shell
```bash
# In Render Dashboard → Shell tab
# Or use Render CLI:
render shell -s code-splainer-be
```

### Restart Service
```bash
# In Render Dashboard → Manual Deploy → Restart
```

### View Database
```bash
# In Render Dashboard → PostgreSQL → Connect
# Or use connection string with any PostgreSQL client
```

---

## 📚 Additional Resources

- **Render Documentation:** https://render.com/docs
- **Upstash Documentation:** https://docs.upstash.com/
- **Prisma Deployment:** https://www.prisma.io/docs/guides/deployment
- **Google AI Studio:** https://makersuite.google.com/

---

## 🆘 Need More Help?

### Quick Issues
1. Run `./deploy-check.sh` to diagnose problems
2. Check troubleshooting section above
3. Review Render logs in dashboard

### Detailed Help
- See `docs/DEPLOYMENT.md` for comprehensive guide
- Check `docs/03-getting-started.md` for local setup
- Review `.env.production.example` for environment variables

---

## 🎯 Summary

**Time to Deploy:** ~20 minutes  
**Cost:** $0/month  
**Difficulty:** Easy  
**Result:** Production-ready API with database, cache, and AI

**Your API URL:** `https://code-splainer-be.onrender.com`

---

**Congratulations! Your backend is now live! 🚀**

Next: Update your frontend with the API URL and start using your deployed backend!
