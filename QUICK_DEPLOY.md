# 🚀 Quick Deploy to Render.com (FREE)

Your code is ready! Follow these steps to deploy in **15 minutes**.

---

## ✅ Prerequisites (Get these first - 5 min)

1. **Google AI API Key** → [Get it FREE here](https://makersuite.google.com/app/apikey)
2. **Upstash Redis Account** → [Sign up FREE here](https://upstash.com/)
3. **Render Account** → [Sign up FREE here](https://render.com/)

---

## 📦 Step 1: Setup Upstash Redis (2 min)

1. Go to [Upstash Console](https://console.upstash.com/)
2. Click **"Create Database"**
3. Settings:
   - Name: `code-splainer-redis`
   - Type: **Global** (free)
   - Region: Choose closest to you
4. Click **"Create"**
5. **SAVE THESE** (you'll need them):
   - Endpoint (e.g., `redis-12345.upstash.io`)
   - Port (`6379`)
   - Password (click "Show")

---

## 🗄️ Step 2: Deploy to Render.com (10 min)

### 2.1 Create PostgreSQL Database

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click **"New +"** → **"PostgreSQL"**
3. Settings:
   - Name: `code-splainer-db`
   - Database: `devinsight_ai`
   - User: `devinsight_user`
   - Region: **Singapore** (or closest)
   - Plan: **Free**
4. Click **"Create Database"**
5. Wait 2 minutes, then **COPY the "Internal Database URL"**

### 2.2 Create Web Service

1. Click **"New +"** → **"Web Service"**
2. Click **"Build and deploy from a Git repository"**
3. Connect to: `https://github.com/tothanhsang/code-splainer-be`
4. Configure:

**Basic Settings:**
- Name: `code-splainer-be`
- Region: **Singapore** (same as database!)
- Branch: `main`
- Runtime: **Node**
- Build Command:
  ```
  npm install && npm run prisma:generate && npm run build
  ```
- Start Command:
  ```
  npm run start:prod
  ```

**Advanced:**
- Plan: **Free**
- Health Check Path: `/health`

### 2.3 Add Environment Variables

Scroll down to **"Environment Variables"** and add these:

| Key | Value | Where to get it |
|-----|-------|----------------|
| `NODE_ENV` | `production` | Type this |
| `PORT` | `10000` | Type this |
| `DATABASE_URL` | `<paste_internal_url>` | From Step 2.1 (PostgreSQL dashboard) |
| `REDIS_HOST` | `<your_upstash_host>` | From Step 1 (e.g., `redis-12345.upstash.io`) |
| `REDIS_PORT` | `6379` | Type this |
| `REDIS_PASSWORD` | `<your_upstash_password>` | From Step 1 |
| `GOOGLE_API_KEY` | `<your_google_ai_key>` | From Prerequisites |
| `GOOGLE_AI_MODEL` | `gemini-2.5-pro` | Type this |
| `MAX_FILE_SIZE` | `10485760` | Type this |
| `MAX_ZIP_SIZE` | `52428800` | Type this |
| `UPLOAD_DIR` | `/tmp/uploads` | Type this |

**⚠️ IMPORTANT:**
- Use **Internal Database URL** (not external)
- Don't include `https://` in `REDIS_HOST`

### 2.4 Deploy!

1. Click **"Create Web Service"**
2. Wait 5-10 minutes for deployment
3. Watch the logs - you'll see:
   ```
   ==> Installing dependencies
   ==> Running build command
   ==> Build successful
   ==> Deploying
   ==> Your service is live!
   ```

---

## ✅ Step 3: Test Your API (1 min)

Your API URL will be: `https://code-splainer-be.onrender.com`

Test it:
```bash
curl https://code-splainer-be.onrender.com/health
```

Expected response:
```json
{
  "status": "OK",
  "message": "DevInsight AI Backend is running"
}
```

---

## 🎉 Done! What's Next?

### Update Your Frontend

Edit your frontend `.env`:
```bash
VITE_API_BASE_URL=https://code-splainer-be.onrender.com
```

### Keep It Alive (Optional)

Free tier sleeps after 15 min. To keep it awake:

1. Go to [UptimeRobot](https://uptimerobot.com/) (free)
2. Create monitor:
   - Type: HTTP(s)
   - URL: `https://code-splainer-be.onrender.com/health`
   - Interval: 5 minutes

---

## 🐛 Common Issues

### Build Failed?
- Check all environment variables are set
- Verify `DATABASE_URL` is the **Internal** URL
- Check logs in Render dashboard

### Can't Connect to Database?
- Use **Internal** Database URL (not external)
- Ensure database and web service in same region
- Wait for database to be fully ready (2-3 min)

### Redis Connection Failed?
- Don't include `https://` in `REDIS_HOST`
- Verify password is correct
- Check port is `6379`

---

## 📊 What You Get (All FREE!)

- ✅ Backend API hosting (750 hours/month)
- ✅ PostgreSQL database (256MB)
- ✅ Redis cache (10K commands/day)
- ✅ SSL/HTTPS (automatic)
- ✅ Auto-deploy on git push
- ✅ **Total: $0/month**

---

## 📚 Need More Help?

See `DEPLOYMENT_GUIDE.md` for detailed troubleshooting and advanced setup.

---

**Your API will be live at:** `https://code-splainer-be.onrender.com` 🚀
