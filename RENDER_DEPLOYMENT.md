# Render Platform Deployment Guide

## Architecture Overview

Your application consists of:
1. **Frontend**: React + Vite (Static Site on Render)
2. **Backend**: Django REST API (Web Service on Render)
3. **Database**: PostgreSQL (on Render)
4. **External Services**: Firebase (Auth), Google Analytics

All services are hosted on **Render** for a unified deployment experience.

---

## Recommended Render Plans

### **Starter Plan (Recommended for Production)**
**Monthly Cost: $14/month**

| Component | Plan | Cost | Why |
|-----------|------|------|-----|
| **Frontend** | Static Site (Free) | $0 | React app can be deployed as static files |
| **Backend** | Starter Web Service | $7/month | No sleep, 512 MB RAM, suitable for Django |
| **Database** | Starter PostgreSQL | $7/month | 1 GB storage, suitable for 100+ questions |

**Total: $14/month**

**Pros:**
- ✅ Backend stays awake (no cold starts)
- ✅ Consistent performance
- ✅ Reliable database with backups
- ✅ Production-ready
- ✅ All services on one platform
- ✅ Easy management

**Cons:**
- ⚠️ Paid service (but affordable)

---

## Resource Analysis

### Backend Resource Usage

| Resource | Usage | Starter Plan |
|----------|-------|--------------|
| **RAM** | Django + DRF: ~200 MB<br>Connection pool: ~50 MB<br>Overhead: ~100 MB | 512 MB ✅ |
| **CPU** | API requests: Low<br>Question generation: Rare | Shared CPU ✅ |
| **Storage** | Logs + temp files: <100 MB | 1 GB ✅ |
| **Network** | API responses: Small<br>Static assets: CDN | Unlimited ✅ |

### Database Resource Usage

| Resource | Usage | Starter Plan |
|----------|-------|--------------|
| **Storage** | ~200 questions: 1-2 MB<br>User data: <100 MB<br>Total: <500 MB | 1 GB ✅ |
| **Connections** | 10-20 concurrent users | 25 connections ✅ |
| **Performance** | Read-heavy workload | Sufficient ✅ |

---

## Deployment Configuration

### Using `render.yaml` (Recommended)

Your `render.yaml` file is already configured with all services:

1. **Backend Django API** - Starter plan ($7/month)
2. **Frontend React App** - Free static site
3. **PostgreSQL Database** - Starter plan ($7/month)

### Environment Variables

The `render.yaml` automatically configures:
- Backend URL for frontend (`VITE_API_BASE_URL`)
- Frontend URL for backend CORS (`FRONTEND_URL`)
- Database connection (`DATABASE_URL`)
- Security settings

---

## Deployment Steps

### Option 1: Deploy via `render.yaml` (Automatic)

1. **Push to Git**
   ```bash
   git add render.yaml
   git commit -m "Add Render deployment configuration"
   git push
   ```

2. **Connect to Render**
   - Go to https://dashboard.render.com
   - Click "New" → "Blueprint"
   - Connect your Git repository
   - Select the repository with `render.yaml`
   - Render will automatically detect and deploy all services

3. **Set Environment Variables**
   - Render will use the values from `render.yaml`
   - You need to set:
     - `OPENAI_API_KEY` (in backend service)
     - `MANUS_API_KEY` (optional, in backend service)

4. **Deploy**
   - Click "Apply"
   - Render will deploy all services automatically
   - Wait for deployment to complete (~5-10 minutes)

### Option 2: Manual Deployment

#### Step 1: Create Database

1. Go to Render Dashboard → New → PostgreSQL
2. Configure:
   - **Name**: `aws-exam-db`
   - **Plan**: **Starter** ($7/month)
   - **Region**: Choose closest to users
3. Create database
4. **Save connection string** - you'll need it

#### Step 2: Deploy Backend

1. Go to Render Dashboard → New → Web Service
2. Connect your Git repository
3. Configure:
   - **Name**: `aws-exam-backend`
   - **Region**: Same as database
   - **Branch**: `main` (or your deployment branch)
   - **Root Directory**: `backend`
   - **Runtime**: Python 3
   - **Build Command**: 
     ```bash
     pip install -r requirements.txt && python manage.py collectstatic --no-input && python manage.py migrate
     ```
   - **Start Command**: 
     ```bash
     gunicorn aws_exam_backend.wsgi:application --bind 0.0.0.0:$PORT
     ```
   - **Plan**: **Starter** ($7/month)

4. **Environment Variables:**
   - `DJANGO_SECRET_KEY` - Generate random secret key
   - `DATABASE_URL` - From PostgreSQL (connection string)
   - `OPENAI_API_KEY` - Your OpenAI API key
   - `MANUS_API_KEY` - Your Manus API key (optional)
   - `DEBUG` - Set to `False`
   - `DJANGO_SETTINGS_MODULE` - Set to `aws_exam_backend.settings`
   - `PYTHON_VERSION` - Set to `3.12.4`
   - `ALLOWED_HOSTS` - Set to `*.onrender.com`
   - `FRONTEND_URL` - Will be set after frontend deploys (e.g., `https://aws-exam-frontend.onrender.com`)

5. **Health Check Path**: `/api/exams/`

6. **Deploy** and wait for success
7. **Note your backend URL**: `https://aws-exam-backend.onrender.com`

#### Step 3: Deploy Frontend

1. Go to Render Dashboard → New → Static Site
2. Connect your Git repository
3. Configure:
   - **Name**: `aws-exam-frontend`
   - **Root Directory**: `typescript_simplified_app_with_timer`
   - **Build Command**: 
     ```bash
     npm install && npm run build
     ```
   - **Publish Directory**: `dist`
   - **Plan**: **Free**

4. **Environment Variables:**
   - `VITE_API_BASE_URL` - Your backend URL (e.g., `https://aws-exam-backend.onrender.com/api`)

5. **Deploy**

6. **After deployment**, update backend environment variable:
   - Go to backend service → Environment
   - Set `FRONTEND_URL` = `https://aws-exam-frontend.onrender.com`
   - This enables CORS for your frontend

#### Step 4: Post-Deployment Setup

1. **Initialize Database**
   - Open Render Shell (for backend service)
   - Run: `python manage.py create_exams`
   - Verify exams are created

2. **Test Deployment**
   - Visit frontend URL: `https://aws-exam-frontend.onrender.com`
   - Verify site loads
   - Test exam selection
   - Verify questions load from API

---

## Environment Variables Reference

### Backend Environment Variables

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `DJANGO_SECRET_KEY` | Django secret key | `django-insecure-...` | ✅ Yes |
| `DATABASE_URL` | PostgreSQL connection | `postgresql://...` | ✅ Yes |
| `OPENAI_API_KEY` | OpenAI API key | `sk-...` | ✅ Yes |
| `MANUS_API_KEY` | Manus API key | `...` | ❌ Optional |
| `DEBUG` | Debug mode | `False` | ✅ Yes |
| `DJANGO_SETTINGS_MODULE` | Settings module | `aws_exam_backend.settings` | ✅ Yes |
| `PYTHON_VERSION` | Python version | `3.12.4` | ✅ Yes |
| `ALLOWED_HOSTS` | Allowed hosts | `*.onrender.com` | ✅ Yes (auto) |
| `FRONTEND_URL` | Frontend URL for CORS | `https://aws-exam-frontend.onrender.com` | ✅ Yes |

### Frontend Environment Variables

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `VITE_API_BASE_URL` | Backend API URL | `https://aws-exam-backend.onrender.com/api` | ✅ Yes |

---

## Post-Deployment Checklist

### Backend Verification

- [ ] Backend accessible at `https://aws-exam-backend.onrender.com`
- [ ] Health check passes: `/api/exams/`
- [ ] Database connected
- [ ] Environment variables set correctly
- [ ] CORS configured for frontend URL

### Frontend Verification

- [ ] Frontend accessible at `https://aws-exam-frontend.onrender.com`
- [ ] No console errors
- [ ] API calls working
- [ ] No CORS errors
- [ ] All features functional

### Integration Testing

- [ ] Frontend can call backend API
- [ ] Questions load correctly
- [ ] Random selection works
- [ ] Timer functionality works
- [ ] Authentication (Firebase) works
- [ ] Analytics tracking works

### Database Setup

- [ ] Run: `python manage.py create_exams` (via Render Shell)
- [ ] Verify exams created
- [ ] Test question generation

---

## Troubleshooting

### CORS Errors

**Problem**: `Access-Control-Allow-Origin` header missing

**Solution:**
1. Check `FRONTEND_URL` environment variable in backend
2. Verify it matches your frontend URL exactly
3. Check Django CORS settings
4. Rebuild backend after changing CORS settings

### Database Connection Failed

**Problem**: Database connection error

**Solution:**
1. Verify `DATABASE_URL` is correct in backend environment variables
2. Check database is running on Render
3. Verify network access is enabled
4. Check database logs

### Frontend Can't Connect to Backend

**Problem**: API calls failing

**Solution:**
1. Verify `VITE_API_BASE_URL` in frontend environment variables
2. Check backend URL is correct (no typos)
3. **Rebuild frontend** (env vars embedded at build time)
4. Verify backend is running
5. Test backend URL directly in browser

### Build Failures

**Backend Build Fails:**
1. Check build logs in Render dashboard
2. Verify `requirements.txt` is correct
3. Check Python version compatibility
4. Verify `build.sh` script is executable

**Frontend Build Fails:**
1. Check build logs in Render dashboard
2. Verify `package.json` has correct build script
3. Check Node.js version
4. Verify dependencies are installed

---

## Cost Summary

### Starter Plan (Recommended)
- **Backend**: $7/month
- **Database**: $7/month
- **Frontend**: $0 (free static site)
- **Total**: **$14/month**

### Free Tier (Testing Only)
- **Backend**: $0 (sleeps after 15 min) ⚠️
- **Database**: $0 (1 month trial, then $7/month)
- **Frontend**: $0
- **Total**: **$0-7/month** (not suitable for production)

---

## Custom Domain (Optional)

### Setup Custom Domain on Render

1. **For Backend:**
   - Go to backend service → Settings → Custom Domains
   - Add your domain
   - Update DNS records as instructed

2. **For Frontend:**
   - Go to frontend service → Settings → Custom Domains
   - Add your domain
   - Update DNS records

3. **Update Environment Variables:**
   - Update `FRONTEND_URL` in backend
   - Update `VITE_API_BASE_URL` in frontend (rebuild required)
   - Update `ALLOWED_HOSTS` in backend

---

## Monitoring & Maintenance

### Built-in Monitoring

- Render provides built-in metrics
- View logs in dashboard
- Monitor uptime
- Track resource usage

### Database Backups

- Starter plan includes automated backups
- Daily backups retained for 7 days
- Manual backups available

### Scaling

- Upgrade plans as needed
- No downtime during upgrades
- Easy to scale up or down

---

## Continuous Deployment

### Automatic Deploys

Both frontend and backend automatically deploy when you push to:
- `main` branch → Production
- Other branches → Preview deploys

### Manual Deploys

- Available in Render dashboard
- Useful for testing changes
- Can rollback if needed

---

## Security Best Practices

### Backend Security

- ✅ `DEBUG=False` in production
- ✅ Strong `DJANGO_SECRET_KEY`
- ✅ SSL/HTTPS enabled (auto on Render)
- ✅ Secure cookies enabled
- ✅ CSRF protection enabled
- ✅ CORS properly configured
- ✅ Environment variables secured

### Frontend Security

- ✅ HTTPS enabled
- ✅ Security headers configured
- ✅ No sensitive data in code
- ✅ Environment variables for API URLs

---

## Quick Reference

### URLs
- **Render Dashboard**: https://dashboard.render.com
- **Backend API**: `https://aws-exam-backend.onrender.com/api`
- **Frontend**: `https://aws-exam-frontend.onrender.com`

### Common Commands

**Generate Django Secret Key:**
```bash
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```

**Create Exams (via Render Shell):**
```bash
python manage.py create_exams
```

**Test Backend API:**
```bash
curl https://aws-exam-backend.onrender.com/api/exams/
```

---

## Summary

✅ **Recommended Setup: Starter Plan ($14/month)**

- **Backend**: Starter ($7/month) - No sleep, reliable
- **Database**: Starter PostgreSQL ($7/month) - Sufficient storage
- **Frontend**: Free Static Site - CDN included

This provides:
- ✅ Production-ready setup
- ✅ Consistent performance
- ✅ Affordable pricing
- ✅ Room to grow
- ✅ Automated backups
- ✅ All services on one platform

**Next Steps:**
1. Push `render.yaml` to Git
2. Connect repository to Render
3. Deploy via Blueprint (automatic) or manually
4. Set environment variables
5. Initialize database
6. Test and go live!
