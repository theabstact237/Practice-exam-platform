# Render Deployment Checklist

## Architecture

- **Frontend**: Render Static Site (Free)
- **Backend**: Render Web Service (Starter - $7/month)
- **Database**: Render PostgreSQL (Starter - $7/month)
- **Total**: $14/month

---

## Pre-Deployment

### ✅ Backend Preparation

- [x] Updated `requirements.txt` with production dependencies
- [x] Updated Django settings for PostgreSQL
- [x] Updated CORS settings for Render frontend
- [x] Created `build.sh` script
- [x] Security settings configured

### ✅ Frontend Preparation

- [x] Build configuration verified
- [x] Environment variable support ready

### ✅ Configuration Files

- [x] Created `render.yaml` with all services
- [x] Automatic environment variable linking configured

---

## Step 1: Deploy via Blueprint (Easiest)

### Connect Repository

- [ ] Go to https://dashboard.render.com
- [ ] Click "New" → "Blueprint"
- [ ] Connect your Git repository
- [ ] Select the repository with `render.yaml`

### Review Configuration

- [ ] Render will automatically detect all services from `render.yaml`
- [ ] Review the services:
  - [ ] Backend Django API
  - [ ] Frontend React App
  - [ ] PostgreSQL Database
- [ ] Verify plans are correct

### Set Environment Variables

- [ ] In backend service configuration:
  - [ ] `OPENAI_API_KEY` - Set your OpenAI API key
  - [ ] `MANUS_API_KEY` - Set your Manus API key (optional)
- [ ] Other variables are auto-configured from `render.yaml`

### Deploy

- [ ] Click "Apply"
- [ ] Wait for deployment (~5-10 minutes)
- [ ] All services will deploy automatically
- [ ] Note the URLs for each service

---

## Step 2: Manual Deployment (Alternative)

### Create Database

- [ ] Go to Render Dashboard → New → PostgreSQL
- [ ] Name: `aws-exam-db`
- [ ] Plan: **Starter** ($7/month)
- [ ] Region: Choose closest to users
- [ ] Create database
- [ ] **Save connection string**

### Deploy Backend

- [ ] Go to Render Dashboard → New → Web Service
- [ ] Connect your Git repository
- [ ] Configure:
  - **Name**: `aws-exam-backend`
  - **Region**: Same as database
  - **Branch**: `main`
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

- [ ] Environment Variables:
  - [ ] `DJANGO_SECRET_KEY` - Generate random key
  - [ ] `DATABASE_URL` - From PostgreSQL
  - [ ] `OPENAI_API_KEY` - Your OpenAI API key
  - [ ] `MANUS_API_KEY` - Your Manus API key (optional)
  - [ ] `DEBUG` - Set to `False`
  - [ ] `DJANGO_SETTINGS_MODULE` - Set to `aws_exam_backend.settings`
  - [ ] `PYTHON_VERSION` - Set to `3.12.4`
  - [ ] `ALLOWED_HOSTS` - Set to `*.onrender.com`
  - [ ] `FRONTEND_URL` - Will set after frontend deploys

- [ ] Health Check Path: `/api/exams/`
- [ ] Deploy and wait for success
- [ ] **Note backend URL**: `https://aws-exam-backend.onrender.com`

### Deploy Frontend

- [ ] Go to Render Dashboard → New → Static Site
- [ ] Connect your Git repository
- [ ] Configure:
  - **Name**: `aws-exam-frontend`
  - **Root Directory**: `typescript_simplified_app_with_timer`
  - **Build Command**: `npm install && npm run build`
  - **Publish Directory**: `dist`
  - **Plan**: **Free**

- [ ] Environment Variables:
  - [ ] `VITE_API_BASE_URL` - Your backend URL (e.g., `https://aws-exam-backend.onrender.com/api`)

- [ ] Deploy

### Link Services

- [ ] After frontend deploys, note the URL: `https://aws-exam-frontend.onrender.com`
- [ ] Go to backend service → Environment
- [ ] Update `FRONTEND_URL` = `https://aws-exam-frontend.onrender.com`
- [ ] This enables CORS for your frontend

---

## Step 3: Post-Deployment Setup

### Initialize Database

- [ ] Open Render Shell (for backend service)
- [ ] Run: `python manage.py create_exams`
- [ ] Verify exams are created

### Test Deployment

- [ ] Visit frontend URL: `https://aws-exam-frontend.onrender.com`
- [ ] Verify site loads
- [ ] Check browser console for errors
- [ ] Test exam selection
- [ ] Verify questions load from API
- [ ] Test authentication (Firebase)
- [ ] Check timer functionality

---

## Verification Checklist

### Backend (Render)

- [ ] Backend accessible at `https://aws-exam-backend.onrender.com`
- [ ] Health check passes: `/api/exams/`
- [ ] Database connected
- [ ] Environment variables set correctly
- [ ] CORS configured for frontend URL

### Frontend (Render)

- [ ] Frontend accessible at `https://aws-exam-frontend.onrender.com`
- [ ] SSL certificate active (HTTPS)
- [ ] No console errors
- [ ] API calls working
- [ ] No CORS errors
- [ ] Authentication working
- [ ] All features functional

### Integration

- [ ] Frontend can call backend API
- [ ] Questions load correctly
- [ ] Random selection works
- [ ] Timer functionality works
- [ ] Full exam flow works

### Database

- [ ] Exams created successfully
- [ ] Question generation works
- [ ] Random selection works
- [ ] Data persists correctly

---

## Environment Variables Reference

### Backend Environment Variables

| Variable | Value | Required | Source |
|----------|-------|----------|--------|
| `DJANGO_SECRET_KEY` | Generated secret key | ✅ Yes | Manual/Generate |
| `DATABASE_URL` | PostgreSQL connection | ✅ Yes | From database |
| `OPENAI_API_KEY` | Your OpenAI API key | ✅ Yes | Manual |
| `MANUS_API_KEY` | Your Manus API key | ❌ Optional | Manual |
| `DEBUG` | `False` | ✅ Yes | Auto |
| `DJANGO_SETTINGS_MODULE` | `aws_exam_backend.settings` | ✅ Yes | Auto |
| `PYTHON_VERSION` | `3.12.4` | ✅ Yes | Auto |
| `ALLOWED_HOSTS` | `*.onrender.com` | ✅ Yes | Auto |
| `FRONTEND_URL` | Frontend URL | ✅ Yes | From frontend service |

### Frontend Environment Variables

| Variable | Value | Required | Source |
|----------|-------|----------|--------|
| `VITE_API_BASE_URL` | Backend API URL | ✅ Yes | From backend service |

---

## Troubleshooting

### CORS Errors

**Problem**: `Access-Control-Allow-Origin` error

**Solutions:**
1. Verify `FRONTEND_URL` in backend environment variables
2. Check it matches frontend URL exactly (including https://)
3. Rebuild backend after changing CORS settings
4. Clear browser cache

### API Not Connecting

**Problem**: Frontend can't reach backend

**Solutions:**
1. Verify `VITE_API_BASE_URL` in frontend environment variables
2. Check backend URL is correct (no typos)
3. **Rebuild frontend** (env vars embedded at build time)
4. Verify backend is running on Render
5. Test backend URL directly in browser

### Database Connection Failed

**Problem**: Database connection error

**Solutions:**
1. Verify `DATABASE_URL` is correct in backend
2. Check database is running on Render
3. Verify network access
4. Check database logs

### Build Failures

**Backend Build Fails:**
1. Check build logs in Render dashboard
2. Verify `requirements.txt` is correct
3. Check Python version compatibility
4. Verify build script is correct

**Frontend Build Fails:**
1. Check build logs in Render dashboard
2. Verify `package.json` has build script
3. Check Node.js version
4. Verify dependencies

---

## Testing Commands

### Test Backend API

```bash
# Test health endpoint
curl https://aws-exam-backend.onrender.com/api/exams/

# Test CORS
curl -H "Origin: https://aws-exam-frontend.onrender.com" \
     -H "Access-Control-Request-Method: GET" \
     -X OPTIONS \
     https://aws-exam-backend.onrender.com/api/exams/
```

### Test Frontend-Backend Connection

Open browser console on frontend URL:

```javascript
fetch('https://aws-exam-backend.onrender.com/api/exams/')
  .then(r => r.json())
  .then(data => console.log('✅ API Connected:', data))
  .catch(err => console.error('❌ API Error:', err));
```

---

## Cost Monitoring

### Monthly Costs

- **Backend**: $7/month
- **Database**: $7/month
- **Frontend**: $0 (free)
- **Total**: **$14/month**

### Monitoring

- [ ] Set up budget alerts in Render
- [ ] Monitor usage in Render dashboard
- [ ] Track API costs (OpenAI/Manus)

---

## Success Criteria

✅ **Deployment successful when:**

1. ✅ Backend API is accessible
2. ✅ Frontend loads correctly
3. ✅ Database is connected
4. ✅ Questions can be generated/retrieved
5. ✅ Random question selection works
6. ✅ Timer functionality works
7. ✅ Authentication (Firebase) works
8. ✅ No console errors
9. ✅ No CORS errors
10. ✅ All tests pass

---

## Next Steps

After successful deployment:

1. [ ] Share URLs with team/users
2. [ ] Test all features thoroughly
3. [ ] Monitor for first 24 hours
4. [ ] Set up monitoring/analytics
5. [ ] Document any custom configurations
6. [ ] Plan for scaling if needed

---

## Quick Links

- **Render Dashboard**: https://dashboard.render.com
- **Backend API**: `https://aws-exam-backend.onrender.com/api`
- **Frontend**: `https://aws-exam-frontend.onrender.com`

---

**Deployment Status**: ✅ Ready to deploy!
