# 🚀 Deployment Guide - Code Splainer Backend

Complete guide to deploy Code Splainer Backend to free hosting services.

> **⚡ Quick Start:** For step-by-step Render.com deployment, see [../DEPLOYMENT_GUIDE.md](../DEPLOYMENT_GUIDE.md)

---

## 📋 Table of Contents

1. [Render.com Deployment (Recommended)](#rendercom-deployment-recommended)
2. [Alternative: Railway.app](#alternative-railwayapp)
3. [Alternative: Fly.io](#alternative-flyio)
4. [Environment Variables](#environment-variables)
5. [Post-Deployment](#post-deployment)
6. [Troubleshooting](#troubleshooting)

---

## 🎯 Render.com Deployment (Recommended)

Render.com offers generous free tier with PostgreSQL and easy setup.

### Prerequisites

- GitHub account
- Google AI Studio API Key ([Get it here](https://makersuite.google.com/app/apikey))
- Upstash Redis account (free) - [Sign up here](https://upstash.com/)

### Step 1: Push Code to GitHub

```bash
cd code-splainer-be
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/code-splainer-be.git
git push -u origin main
```

### Step 2: Setup Upstash Redis (Free)

1. Go to [Upstash Console](https://console.upstash.com/)
2. Click **Create Database**
3. Choose **Global** (free tier)
4. Copy the connection details:
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`

### Step 3: Create Render Account

1. Go to [Render.com](https://render.com/)
2. Sign up with GitHub
3. Authorize Render to access your repositories

### Step 4: Create PostgreSQL Database

1. In Render Dashboard, click **New +** → **PostgreSQL**
2. Configure:
   - **Name:** `code-splainer-db`
   - **Database:** `devinsight_ai`
   - **User:** `devinsight_user`
   - **Region:** Singapore (or closest to you)
   - **Plan:** Free
3. Click **Create Database**
4. Wait for database to be ready (~2 minutes)
5. Copy the **Internal Database URL** (starts with `postgresql://`)

### Step 5: Create Web Service

1. Click **New +** → **Web Service**
2. Connect your GitHub repository
3. Configure:

   **Basic Settings:**
   - **Name:** `code-splainer-be`
   - **Region:** Singapore (same as database)
   - **Branch:** `main`
   - **Root Directory:** `code-splainer-be` (if in monorepo) or leave empty
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

4. Click **Create Web Service** (don't deploy yet)

### Step 6: Configure Environment Variables

In your Render Web Service, go to **Environment** tab and add:

```bash
# Node Environment
NODE_ENV=production
PORT=10000

# Database (from Step 4)
DATABASE_URL=postgresql://devinsight_user:PASSWORD@HOST/devinsight_ai

# Redis (from Step 2 - Upstash)
REDIS_HOST=your-upstash-host.upstash.io
REDIS_PORT=6379
REDIS_PASSWORD=your-upstash-password

# Google AI (Get from https://makersuite.google.com/app/apikey)
GOOGLE_API_KEY=your_google_ai_api_key_here
GOOGLE_AI_MODEL=gemini-2.5-pro

# Upload Configuration
MAX_FILE_SIZE=10485760
MAX_ZIP_SIZE=52428800
UPLOAD_DIR=/tmp/uploads
```

**Important Notes:**
- Use the **Internal Database URL** from Render PostgreSQL (not external)
- For Upstash Redis, use the connection details from Upstash Console
- Keep `GOOGLE_API_KEY` secret!

### Step 7: Deploy

1. Click **Manual Deploy** → **Deploy latest commit**
2. Wait for build to complete (~5-10 minutes)
3. Check logs for any errors
4. Once deployed, your API will be available at: `https://code-splainer-be.onrender.com`

### Step 8: Verify Deployment

Test your deployment:

```bash
# Health check
curl https://code-splainer-be.onrender.com/health

# Expected response:
# {
#   "status": "OK",
#   "message": "DevInsight AI Backend is running",
#   "timestamp": "2025-01-19T13:26:03.000Z"
# }
```

---

## 🚂 Alternative: Railway.app

Railway offers $5 free credit per month (enough for small projects).

### Quick Setup

1. Go to [Railway.app](https://railway.app/)
2. Sign in with GitHub
3. Click **New Project** → **Deploy from GitHub repo**
4. Select your repository
5. Railway will auto-detect Node.js and PostgreSQL needs
6. Add environment variables (same as Render)
7. Deploy!

**Railway Advantages:**
- Automatic PostgreSQL + Redis provisioning
- Better free tier performance
- Easier setup

**Railway Disadvantages:**
- $5/month credit limit (may run out)
- Requires credit card for verification

---

## ✈️ Alternative: Fly.io

Fly.io offers generous free tier with global edge deployment.

### Quick Setup

1. Install Fly CLI:
   ```bash
   curl -L https://fly.io/install.sh | sh
   ```

2. Login:
   ```bash
   fly auth login
   ```

3. Launch app:
   ```bash
   cd code-splainer-be
   fly launch
   ```

4. Create PostgreSQL:
   ```bash
   fly postgres create
   fly postgres attach <postgres-app-name>
   ```

5. Set secrets:
   ```bash
   fly secrets set GOOGLE_API_KEY=your_key_here
   fly secrets set REDIS_HOST=your_redis_host
   fly secrets set REDIS_PASSWORD=your_redis_password
   ```

6. Deploy:
   ```bash
   fly deploy
   ```

---

## 🔐 Environment Variables

Complete list of required environment variables:

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `NODE_ENV` | Yes | Environment mode | `production` |
| `PORT` | Yes | Server port | `10000` (Render), `3001` (local) |
| `DATABASE_URL` | Yes | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` |
| `REDIS_HOST` | Yes | Redis host | `redis-12345.upstash.io` |
| `REDIS_PORT` | Yes | Redis port | `6379` |
| `REDIS_PASSWORD` | Yes | Redis password | `your_redis_password` |
| `GOOGLE_API_KEY` | Yes | Google AI Studio API key | `AIza...` |
| `GOOGLE_AI_MODEL` | No | AI model to use | `gemini-2.5-pro` |
| `MAX_FILE_SIZE` | No | Max PDF file size (bytes) | `10485760` (10MB) |
| `MAX_ZIP_SIZE` | No | Max ZIP file size (bytes) | `52428800` (50MB) |
| `UPLOAD_DIR` | No | Upload directory | `/tmp/uploads` |

---

## 🎉 Post-Deployment

### Update Frontend Configuration

Update your frontend `.env` file:

```bash
# code-splainer-fe/.env
VITE_API_BASE_URL=https://code-splainer-be.onrender.com
```

### Test All Endpoints

```bash
# Set your API URL
API_URL=https://code-splainer-be.onrender.com

# 1. Health check
curl $API_URL/health

# 2. Root endpoint
curl $API_URL/

# 3. Test Phase 1 (Spec Analyzer)
curl -X POST $API_URL/api/analyze-spec \
  -F "origin=@test-spec.pdf"

# 4. Test Phase 2 (Code Review) - Upload context
curl -X POST $API_URL/api/code-review/upload-context \
  -F "codebase=@test-project.zip"

# 5. Get history
curl $API_URL/api/analyze-spec/history
```

### Setup Monitoring

1. **Render Dashboard:**
   - Monitor logs in real-time
   - Check metrics (CPU, Memory)
   - Set up alerts

2. **Uptime Monitoring:**
   - Use [UptimeRobot](https://uptimerobot.com/) (free)
   - Monitor `/health` endpoint every 5 minutes
   - Get email alerts on downtime

### Enable Auto-Deploy

In Render Dashboard:
1. Go to your Web Service
2. Settings → **Auto-Deploy**
3. Enable **Auto-Deploy** for `main` branch
4. Every push to `main` will auto-deploy

---

## 🐛 Troubleshooting

### Build Fails

**Error: `Cannot find module '@prisma/client'`**

**Solution:** Ensure `prisma generate` runs in build command:
```bash
npm install && npm run prisma:generate && npm run build
```

---

**Error: `TypeScript compilation failed`**

**Solution:** Check `tsconfig.json` and fix TypeScript errors locally first:
```bash
npm run build
```

---

### Database Connection Issues

**Error: `Can't reach database server`**

**Solution:**
1. Use **Internal Database URL** (not external)
2. Ensure database and web service are in the same region
3. Check `DATABASE_URL` format:
   ```
   postgresql://USER:PASSWORD@HOST:PORT/DATABASE?sslmode=require
   ```

---

**Error: `Migration failed`**

**Solution:** Run migrations manually:
```bash
# In Render Shell (Web Service → Shell tab)
npm run prisma:migrate:deploy
```

---

### Redis Connection Issues

**Error: `Redis connection timeout`**

**Solution:**
1. Verify Upstash Redis credentials
2. Check if Redis host is accessible
3. Test connection:
   ```bash
   # In Render Shell
   node -e "const Redis = require('ioredis'); const redis = new Redis(process.env.REDIS_HOST); redis.ping().then(console.log);"
   ```

---

### API Errors

**Error: `GOOGLE_API_KEY is not set`**

**Solution:** Add `GOOGLE_API_KEY` in Render Environment Variables

---

**Error: `File upload too large`**

**Solution:** Increase `MAX_ZIP_SIZE` in environment variables:
```bash
MAX_ZIP_SIZE=104857600  # 100MB
```

---

### Performance Issues

**Free tier is slow:**

**Solutions:**
1. **Render:** Free tier spins down after 15 minutes of inactivity
   - First request after spin-down takes ~30 seconds
   - Use UptimeRobot to ping every 14 minutes (keeps it alive)

2. **Optimize cold starts:**
   - Reduce dependencies
   - Use lighter AI models for non-critical tasks

3. **Upgrade to paid tier:**
   - Render: $7/month (no spin-down)
   - Railway: $5/month credit
   - Fly.io: Pay-as-you-go

---

## 📊 Cost Comparison

| Service | Free Tier | Pros | Cons |
|---------|-----------|------|------|
| **Render** | 750 hours/month | Easy setup, PostgreSQL included | Spins down after 15min |
| **Railway** | $5 credit/month | Best DX, fast deploys | Credit limit |
| **Fly.io** | 3 VMs free | Global edge, fast | Complex setup |
| **Heroku** | Discontinued | - | No free tier anymore |

---

## 🎓 Best Practices

1. **Use environment variables** for all secrets
2. **Enable auto-deploy** for CI/CD
3. **Monitor logs** regularly
4. **Set up health checks** and alerts
5. **Use Redis caching** to reduce AI API costs
6. **Implement rate limiting** to prevent abuse
7. **Keep dependencies updated** for security

---

## 🔗 Useful Links

- [Render Documentation](https://render.com/docs)
- [Railway Documentation](https://docs.railway.app/)
- [Fly.io Documentation](https://fly.io/docs/)
- [Upstash Redis](https://upstash.com/)
- [Google AI Studio](https://makersuite.google.com/)
- [Prisma Deploy Guide](https://www.prisma.io/docs/guides/deployment)

---

## 🆘 Need Help?

If you encounter issues:

1. Check [Troubleshooting](#troubleshooting) section
2. Review Render/Railway logs
3. Test locally first: `npm run dev`
4. Check environment variables
5. Verify database connection

---

**Happy Deploying! 🚀**
