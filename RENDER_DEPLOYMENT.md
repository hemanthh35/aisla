# Render Deployment Guide - Single Service

## Step-by-Step Instructions

### 1. Connect GitHub Repository
1. Go to [render.com](https://render.com)
2. Click **"New +"** → **"Web Service"**
3. Click **"Connect repository"**
4. Search for **`labs`** (or your repo name)
5. Select **`hemanthh35/labs`**
6. Click **"Connect"**

---

### 2. Configure Web Service Settings

#### Basic Settings
| Field | Value |
|-------|-------|
| **Name** | `aisla-fullstack` |
| **Environment** | `Node` |
| **Region** | `Oregon` (closest to you) |
| **Branch** | `main` |
| **Root Directory** | (leave empty) |

#### Build & Start Commands
| Field | Value |
|-------|-------|
| **Build Command** | `bash build.sh` |
| **Start Command** | `npm start` |

#### Plan
- Select **`Free`** (for testing)
- Or upgrade to **`Starter`** ($7/month) for better performance

---

### 3. Set Environment Variables

Click **"Advanced"** → **"Add Environment Variable"** for each:

#### Variable 1: NODE_ENV
```
Key:   NODE_ENV
Value: production
```

#### Variable 2: PORT
```
Key:   PORT
Value: 10000
```

#### Variable 3: MONGO_URI
```
Key:   MONGO_URI
Value: <Copy from your local .env file>
```
**⚠️ Do NOT paste credentials here - copy from your `.env` file only**

#### Variable 4: JWT_SECRET
```
Key:   JWT_SECRET
Value: <Copy from your local .env file>
```
**⚠️ Do NOT paste credentials here - copy from your `.env` file only**

---

### 4. Deploy
1. Review all settings
2. Click **"Create Web Service"**
3. Wait for build to complete (5-10 minutes)
4. Once green checkmark appears, your app is live!

---

## After Deployment

### Access Your App
- **Frontend URL**: https://aisla-fullstack.onrender.com
- **API Endpoint**: https://aisla-fullstack.onrender.com/api

### Test It Works
1. Open https://aisla-fullstack.onrender.com
2. Register a new account
3. Login
4. Start creating experiments

### Monitor Logs
1. Go to your service on Render
2. Click **"Logs"** tab
3. Check for any errors

---

## Troubleshooting

### Build Fails
- Check logs for error message
- Ensure `build.sh` has correct permissions
- Verify Node version is 18.x

### Service Won't Start
- Check MongoDB URI is correct
- Verify JWT_SECRET is set
- Look at logs for error details

### Frontend shows API errors
- Ensure server is running (check logs)
- Verify API routes exist
- Check CORS settings in server.js

### Slow Performance
- Upgrade from Free to Starter plan
- Free tier spins down after 15 minutes of inactivity

---

## Important Notes

✅ **Single Service** - Frontend & Backend together = simpler, cheaper
✅ **Auto-deployed** - Push to GitHub → Automatic redeploy
✅ **React Build** - Already configured in package.json
✅ **Environment Variables** - Already configured in render.yaml

**Your app is production-ready!**
