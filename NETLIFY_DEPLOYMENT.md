# Netlify Frontend Deployment Guide

## Overview

Your frontend (React/Vite app) is hosted on **Netlify** with the domain `freecertify.org`, while the backend (Django API) and database (PostgreSQL) remain on **Render**.

## Architecture

```
┌─────────────────────────────────┐
│   Frontend (React/Vite)         │
│   Netlify (freecertify.org)     │
│   Free Static Site Hosting      │
└──────────────┬──────────────────┘
               │ HTTPS API Calls
               ▼
┌─────────────────────────────────┐
│   Backend (Django REST API)     │
│   Render (Starter Plan)         │
│   $7/month                      │
└──────────────┬──────────────────┘
               │
               ▼
┌─────────────────────────────────┐
│   Database (PostgreSQL)         │
│   Render (Starter Plan)         │
│   $7/month                      │
└─────────────────────────────────┘
```

## Updated Costs

| Component | Platform | Plan | Cost |
|-----------|----------|------|------|
| **Frontend** | Netlify | Free | **$0** |
| **Backend** | Render | Starter | **$7/month** |
| **Database** | Render | Starter | **$7/month** |
| **Total** | | | **$14/month** |

---

## Configuration Updates

### 1. Backend CORS Settings

Updated `backend/aws_exam_backend/settings.py` to allow CORS from your Netlify domain:

```python
CORS_ALLOWED_ORIGINS = [
    "https://freecertify.org",
    "https://www.freecertify.org",
    "https://aws-exam-frontend.onrender.com",  # Backward compatibility
]
```

### 2. Netlify Configuration

Updated `typescript_simplified_app_with_timer/netlify.toml`:
- Build configuration
- Redirects for SPA routing
- Security headers

### 3. Render Configuration

Updated `render.yaml`:
- Removed frontend service (now on Netlify)
- Updated `ALLOWED_HOSTS` to include your domain
- Backend and database only

---

## Netlify Deployment Steps

### Option 1: Deploy via Netlify Dashboard (Recommended)

1. **Go to Netlify Dashboard**
   - Visit https://app.netlify.com
   - Sign in with your account

2. **Add New Site**
   - Click "Add new site" → "Import an existing project"
   - Connect to your Git repository (GitHub/GitLab/Bitbucket)

3. **Configure Build Settings**
   - **Base directory**: `typescript_simplified_app_with_timer`
   - **Build command**: `npm run build`
   - **Publish directory**: `typescript_simplified_app_with_timer/dist`

4. **Environment Variables**
   - Go to Site settings → Environment variables
   - Add:
     ```
     VITE_API_BASE_URL=https://aws-exam-backend.onrender.com/api
     ```
   - (Replace with your actual Render backend URL)

5. **Configure Custom Domain**
   - Go to Site settings → Domain management
   - Click "Add custom domain"
   - Enter: `freecertify.org`
   - Follow DNS configuration instructions
   - Netlify will automatically provision SSL certificate

6. **DNS Configuration**
   
   **If using root domain (freecertify.org):**
   - Add A record pointing to Netlify's IP
   - Netlify will provide the IP addresses
   
   **If using subdomain (www.freecertify.org):**
   - Add CNAME record: `www` → `your-site.netlify.app`
   
   **Recommended: Both**
   - A record for root domain
   - CNAME for www subdomain

7. **Deploy**
   - Click "Deploy site"
   - Netlify will build and deploy automatically

### Option 2: Deploy via Netlify CLI

1. **Install Netlify CLI**
   ```bash
   npm install -g netlify-cli
   ```

2. **Login to Netlify**
   ```bash
   netlify login
   ```

3. **Initialize Site**
   ```bash
   cd typescript_simplified_app_with_timer
   netlify init
   ```
   - Follow prompts to link to existing site or create new

4. **Set Environment Variables**
   ```bash
   netlify env:set VITE_API_BASE_URL https://aws-exam-backend.onrender.com/api
   ```

5. **Deploy**
   ```bash
   netlify deploy --prod
   ```

---

## Environment Variables

### Netlify Environment Variables

Set these in Netlify Dashboard → Site settings → Environment variables:

| Variable | Value | Description |
|----------|-------|-------------|
| `VITE_API_BASE_URL` | `https://aws-exam-backend.onrender.com/api` | Backend API URL |
| `NODE_VERSION` | `18` | Node.js version (optional) |

**Important:** Replace `aws-exam-backend.onrender.com` with your actual Render backend URL.

### Build-Time vs Runtime Variables

- `VITE_*` variables are embedded at **build time**
- After changing `VITE_API_BASE_URL`, you must **rebuild** the site
- Go to Deploys → Trigger deploy → Clear cache and deploy site

---

## Render Backend Configuration

### Update ALLOWED_HOSTS

In Render dashboard, add environment variable:
```
ALLOWED_HOSTS=*.onrender.com,*.freecertify.org,freecertify.org
```

Or it's already set in `render.yaml`:
```yaml
- key: ALLOWED_HOSTS
  value: "*.onrender.com,*.freecertify.org,freecertify.org"
```

### Verify CORS Settings

Your Django settings should already allow `freecertify.org`:
```python
CORS_ALLOWED_ORIGINS = [
    "https://freecertify.org",
    "https://www.freecertify.org",
]
```

---

## DNS Configuration

### For freecertify.org

**Option 1: A Records (Root Domain)**
```
Type: A
Name: @ (or freecertify.org)
Value: [Netlify IP addresses]
TTL: 3600
```

**Option 2: CNAME (Subdomain)**
```
Type: CNAME
Name: www
Value: your-site-name.netlify.app
TTL: 3600
```

**Option 3: ALIAS (Root Domain)**
Some DNS providers support ALIAS/ANAME records:
```
Type: ALIAS
Name: @
Value: your-site-name.netlify.app
TTL: 3600
```

**Recommended Setup:**
- ALIAS/ANAME for root domain → Netlify
- CNAME for www → Netlify
- This ensures both `freecertify.org` and `www.freecertify.org` work

### Netlify DNS

Alternatively, transfer DNS management to Netlify:
1. Go to Domain management
2. Click "Add custom domain"
3. Choose "Set up Netlify DNS"
4. Update nameservers at your domain registrar

---

## Post-Deployment Verification

### 1. Check Frontend
- [ ] Visit `https://freecertify.org`
- [ ] Site loads correctly
- [ ] No console errors

### 2. Test API Connection
- [ ] Open browser DevTools → Network tab
- [ ] Select an exam type
- [ ] Verify API calls to Render backend
- [ ] Check for CORS errors

### 3. Test CORS
Open browser console and run:
```javascript
fetch('https://aws-exam-backend.onrender.com/api/exams/')
  .then(r => r.json())
  .then(console.log)
  .catch(console.error)
```

Should return data without CORS errors.

### 4. Verify SSL
- [ ] HTTPS enabled (green lock icon)
- [ ] Certificate valid
- [ ] No mixed content warnings

---

## Troubleshooting

### CORS Errors

**Error**: `Access-Control-Allow-Origin` header missing

**Solution:**
1. Check `CORS_ALLOWED_ORIGINS` in Django settings
2. Verify domain matches exactly (including `www.`)
3. Clear browser cache
4. Rebuild Netlify site after changing CORS settings

### API Connection Failed

**Error**: Network error or CORS blocked

**Solution:**
1. Verify `VITE_API_BASE_URL` in Netlify environment variables
2. Check backend URL is correct
3. Rebuild Netlify site (environment variables embedded at build time)
4. Check backend is running on Render

### Domain Not Working

**Error**: Site not accessible via custom domain

**Solution:**
1. Verify DNS records are correct
2. Check DNS propagation: https://www.whatsmydns.net
3. Wait 24-48 hours for DNS propagation
4. Verify SSL certificate in Netlify dashboard

### Build Failures

**Error**: Netlify build fails

**Solution:**
1. Check build logs in Netlify dashboard
2. Verify `netlify.toml` configuration
3. Ensure `package.json` has correct build script
4. Check Node.js version compatibility

---

## Continuous Deployment

### Automatic Deploys

Netlify automatically deploys when you push to:
- `main` branch → Production
- Other branches → Preview deploys

### Manual Deploys

1. Go to Deploys tab
2. Click "Trigger deploy" → "Clear cache and deploy site"
3. Useful after changing environment variables

### Preview Deploys

- Every pull request gets a preview URL
- Test changes before merging
- Share preview URLs for testing

---

## Security Best Practices

### Headers Configuration

Your `netlify.toml` includes security headers:
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`

### HTTPS

- Netlify provides free SSL certificates
- Automatically renews
- Force HTTPS enabled by default

### Environment Variables

- Never commit API keys to Git
- Use Netlify environment variables
- Different variables for production/staging

---

## Performance Optimization

### Build Optimization

1. **Enable Build Plugins** (optional)
   - Netlify Build Plugins can optimize builds
   - Image optimization
   - Bundle analysis

2. **Cache Configuration**
   - Netlify caches `node_modules` automatically
   - Speeds up subsequent builds

### CDN

- Netlify uses global CDN
- Automatic edge caching
- Fast worldwide access

### Asset Optimization

- Vite automatically optimizes assets
- Code splitting
- Minification
- Tree shaking

---

## Monitoring

### Netlify Analytics (Optional)

- Basic analytics: Free
- Enhanced analytics: $9/month
- Track visitors, page views, bandwidth

### Error Tracking

- Check Netlify function logs
- Browser console errors
- Network request failures

### Uptime Monitoring

- Netlify provides uptime monitoring
- Alerts for downtime
- Status page available

---

## Cost Summary

### Free Tier Includes:
- ✅ Unlimited bandwidth
- ✅ 300 build minutes/month
- ✅ Custom domain support
- ✅ SSL certificates
- ✅ Form handling (100 submissions/month)
- ✅ 100 GB bandwidth/month

### If You Need More:
- **Pro Plan ($19/month)**: More build minutes, bandwidth
- **Business Plan ($99/month)**: Advanced features

**For your use case: Free tier is sufficient!**

---

## Quick Reference

### Netlify URLs
- **Dashboard**: https://app.netlify.com
- **Site**: https://freecertify.org
- **Admin**: https://app.netlify.com/sites/your-site-name

### Render URLs
- **Dashboard**: https://dashboard.render.com
- **Backend**: https://aws-exam-backend.onrender.com
- **API**: https://aws-exam-backend.onrender.com/api

### Environment Variables
- **Netlify**: Site settings → Environment variables
- **Render**: Web service → Environment

---

## Summary

✅ **Frontend**: Netlify (freecertify.org) - **FREE**
✅ **Backend**: Render (Starter) - **$7/month**
✅ **Database**: Render (Starter) - **$7/month**

**Total: $14/month** - Same cost, better domain setup!

Your frontend is now on Netlify with your custom domain, while backend and database remain on Render. This gives you:
- Free frontend hosting with custom domain
- Professional domain name (freecertify.org)
- Separate frontend/backend scaling
- Better CDN performance


