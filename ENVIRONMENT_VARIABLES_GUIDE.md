# Environment Variables Guide for Render Production

This guide explains how to configure and manage environment variables for your AWS Practice Exam Platform when deploying to Render.

---

## Table of Contents

1. [Overview](#overview)
2. [How Environment Variables Work](#how-environment-variables-work)
3. [Backend Environment Variables](#backend-environment-variables)
4. [Frontend Environment Variables](#frontend-environment-variables)
5. [Setting Variables in Render Dashboard](#setting-variables-in-render-dashboard)
6. [Auto-Generated vs Manual Variables](#auto-generated-vs-manual-variables)
7. [Security Best Practices](#security-best-practices)
8. [Troubleshooting](#troubleshooting)

---

## Overview

Your application uses environment variables to:
- **Keep secrets out of source code** (API keys, database passwords)
- **Configure different settings** for development vs production
- **Enable service-to-service communication** (backend URL for frontend)

### Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        RENDER PLATFORM                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────┐      ┌─────────────────────┐          │
│  │   Frontend (React)  │      │   Backend (Django)  │          │
│  │                     │      │                     │          │
│  │  VITE_API_BASE_URL ─┼──────┼→ API Endpoints      │          │
│  │  VITE_FIREBASE_*    │      │                     │          │
│  │                     │      │  DJANGO_SECRET_KEY  │          │
│  └─────────────────────┘      │  DATABASE_URL ──────┼────┐     │
│                               │  OPENAI_API_KEY     │    │     │
│                               │  FRONTEND_URL ──────┼─┐  │     │
│                               └─────────────────────┘ │  │     │
│                                         ▲             │  │     │
│  ┌─────────────────────┐                │             │  │     │
│  │     PostgreSQL      │◄───────────────┼─────────────┘  │     │
│  │     Database        │                │                │     │
│  └─────────────────────┘                └────────────────┘     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## How Environment Variables Work

### Backend (Django) - Runtime Variables

```python
# In Django settings.py
import os
SECRET_KEY = os.environ.get('DJANGO_SECRET_KEY')
```

- Variables are read **at runtime** (when the server starts)
- Changing a variable requires a **server restart** (automatic on Render)
- Variables are **never exposed** to users

### Frontend (React/Vite) - Build-Time Variables

```typescript
// In React/Vite code
const apiUrl = import.meta.env.VITE_API_BASE_URL;
```

- Variables are **embedded during build** (npm run build)
- Changing a variable requires a **rebuild and redeploy**
- Variables **prefixed with `VITE_`** are included in the bundle
- ⚠️ These values are visible in browser JavaScript!

---

## Backend Environment Variables

### Required Variables

| Variable | Description | How It's Set |
|----------|-------------|--------------|
| `DJANGO_SECRET_KEY` | Django cryptographic signing key | **Auto-generated** by Render |
| `DATABASE_URL` | PostgreSQL connection string | **Auto-linked** from database service |
| `DJANGO_SETTINGS_MODULE` | Django settings module path | Pre-configured: `aws_exam_backend.settings` |
| `DEBUG` | Enable/disable debug mode | Pre-configured: `False` |
| `ALLOWED_HOSTS` | Allowed domain names | Pre-configured: `*.onrender.com` |
| `FRONTEND_URL` | Frontend URL for CORS | **Auto-linked** from frontend service |
| `PYTHON_VERSION` | Python runtime version | Pre-configured: `3.12.4` |

### Optional Variables (Manual Setup Required)

| Variable | Description | Where to Get It |
|----------|-------------|-----------------|
| `OPENAI_API_KEY` | OpenAI API key for AI features | [OpenAI Platform](https://platform.openai.com/api-keys) |
| `MANUS_API_KEY` | Manus API key (if using) | Your Manus account |

### Setting Up Backend Variables

1. Go to **Render Dashboard** → **aws-exam-backend** service
2. Click **Environment** tab
3. For `OPENAI_API_KEY`:
   - Click **Add Environment Variable**
   - Key: `OPENAI_API_KEY`
   - Value: `sk-your-actual-api-key`
   - Click **Save Changes**
4. Service will automatically restart

---

## Frontend Environment Variables

### Required Variables

| Variable | Description | How It's Set |
|----------|-------------|--------------|
| `VITE_API_BASE_URL` | Backend API URL | **Auto-linked** from backend service |

### Firebase Configuration (Manual Setup Required)

| Variable | Description | Firebase Console Location |
|----------|-------------|---------------------------|
| `VITE_FIREBASE_API_KEY` | Firebase API key | Project Settings → General → Your apps |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase auth domain | Project Settings → General → Your apps |
| `VITE_FIREBASE_PROJECT_ID` | Firebase project ID | Project Settings → General → Your apps |
| `VITE_FIREBASE_STORAGE_BUCKET` | Firebase storage bucket | Project Settings → General → Your apps |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase messaging sender ID | Project Settings → General → Your apps |
| `VITE_FIREBASE_APP_ID` | Firebase app ID | Project Settings → General → Your apps |
| `VITE_FIREBASE_MEASUREMENT_ID` | Google Analytics measurement ID | Google Analytics → Admin → Data Streams |

### Getting Firebase Configuration

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `aws-project-4f082`
3. Click ⚙️ **Settings** → **Project settings**
4. Scroll down to **Your apps** section
5. Find your web app configuration:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSy...",           // → VITE_FIREBASE_API_KEY
  authDomain: "xxx.firebaseapp.com",  // → VITE_FIREBASE_AUTH_DOMAIN
  projectId: "xxx",              // → VITE_FIREBASE_PROJECT_ID
  storageBucket: "xxx.appspot.com",   // → VITE_FIREBASE_STORAGE_BUCKET
  messagingSenderId: "123...",   // → VITE_FIREBASE_MESSAGING_SENDER_ID
  appId: "1:123...",             // → VITE_FIREBASE_APP_ID
  measurementId: "G-XXX"         // → VITE_FIREBASE_MEASUREMENT_ID
};
```

### Setting Up Frontend Variables

1. Go to **Render Dashboard** → **aws-exam-frontend** service
2. Click **Environment** tab
3. Add each Firebase variable:
   - Click **Add Environment Variable**
   - Enter Key and Value
   - Repeat for all 7 Firebase variables
4. Click **Save Changes**
5. **Trigger a manual deploy** (required for frontend changes!)
   - Go to **Deploys** tab
   - Click **Deploy latest commit**

---

## Setting Variables in Render Dashboard

### Step-by-Step Guide

#### 1. Access Your Service

```
https://dashboard.render.com
    └── Your Services
        ├── aws-exam-backend (Web Service)
        └── aws-exam-frontend (Static Site)
```

#### 2. Navigate to Environment Tab

![Environment Tab Location](https://docs.render.com/img/environment-variables.png)

#### 3. Add Variables

**Option A: Add One by One**
- Click **Add Environment Variable**
- Enter Key and Value
- Click **Save Changes**

**Option B: Add from .env File**
- Click **Add from .env**
- Paste your `.env` file contents
- Click **Add Variables**

#### 4. Save and Deploy

- Backend: Saves and auto-restarts
- Frontend: Save, then manually trigger deploy

---

## Auto-Generated vs Manual Variables

### Auto-Generated/Linked Variables ✅

These are configured in `render.yaml` and set automatically:

```yaml
# render.yaml excerpt
envVars:
  # Auto-generated
  - key: DJANGO_SECRET_KEY
    generateValue: true        # Render generates a secure random value
    
  # Auto-linked from database
  - key: DATABASE_URL
    fromDatabase:
      name: aws-exam-db
      property: connectionString
      
  # Auto-linked from another service
  - key: FRONTEND_URL
    fromService:
      type: web
      name: aws-exam-frontend
      property: host
```

### Manual Variables (sync: false) ⚠️

These require you to enter values manually in Render Dashboard:

```yaml
# render.yaml excerpt
envVars:
  - key: OPENAI_API_KEY
    sync: false    # Must be set manually in dashboard
    
  - key: VITE_FIREBASE_API_KEY
    sync: false    # Must be set manually in dashboard
```

---

## Security Best Practices

### ✅ DO

1. **Use `sync: false`** for sensitive values in `render.yaml`
   ```yaml
   - key: OPENAI_API_KEY
     sync: false  # Never committed to Git
   ```

2. **Use environment variables** instead of hardcoding
   ```typescript
   // Good
   const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
   
   // Bad
   const apiKey = "AIzaSy...actual-key-here";
   ```

3. **Add `.env` to `.gitignore`**
   ```
   # .gitignore
   .env
   .env.local
   .env.production
   ```

4. **Use `.env.example`** for documentation
   ```env
   # .env.example (safe to commit)
   VITE_FIREBASE_API_KEY=your-api-key-here
   ```

5. **Restrict API keys** where possible
   - Firebase: Set authorized domains
   - OpenAI: Set usage limits

### ❌ DON'T

1. **Never commit real secrets** to Git
2. **Never expose backend secrets** to frontend
3. **Never use `generateValue: true`** for keys you need to know
4. **Never share environment variables** in plain text

### Frontend Security Note

⚠️ **All `VITE_*` variables are visible in the browser!**

```javascript
// Anyone can see this in browser dev tools
console.log(import.meta.env.VITE_FIREBASE_API_KEY);
```

For Firebase, this is **okay** because:
- Firebase keys are designed to be public
- Security is enforced by **Firebase Security Rules**
- You should restrict keys by **authorized domains**

---

## Troubleshooting

### Problem: Frontend Not Picking Up New Variables

**Cause:** Frontend variables are embedded at build time.

**Solution:**
1. Add/update variable in Render Dashboard
2. Go to **Deploys** tab
3. Click **Deploy latest commit** to rebuild

### Problem: CORS Errors After Deployment

**Cause:** `FRONTEND_URL` not set correctly in backend.

**Solution:**
1. Check backend environment variables
2. Verify `FRONTEND_URL` matches your frontend URL exactly:
   ```
   https://aws-exam-frontend.onrender.com
   ```
3. No trailing slash!

### Problem: Firebase Auth Not Working

**Cause:** Firebase environment variables not set or wrong.

**Solution:**
1. Verify all 7 `VITE_FIREBASE_*` variables are set
2. Check for typos in variable names
3. Redeploy frontend after changes
4. Check Firebase Console for authorized domains

### Problem: Database Connection Failed

**Cause:** `DATABASE_URL` not linked correctly.

**Solution:**
1. Check that database service is running
2. Verify `DATABASE_URL` is linked (not manually set)
3. Check database logs for errors

### Problem: OpenAI Features Not Working

**Cause:** `OPENAI_API_KEY` not set or invalid.

**Solution:**
1. Verify key is set in backend environment
2. Check key is valid at [OpenAI Platform](https://platform.openai.com/api-keys)
3. Check OpenAI usage limits
4. Restart backend service

---

## Quick Reference Card

### Backend Variables (aws-exam-backend)

| Variable | Required | Auto/Manual | Notes |
|----------|----------|-------------|-------|
| `DJANGO_SECRET_KEY` | ✅ | Auto | Generated by Render |
| `DATABASE_URL` | ✅ | Auto | Linked from database |
| `FRONTEND_URL` | ✅ | Auto | Linked from frontend |
| `DJANGO_SETTINGS_MODULE` | ✅ | Auto | `aws_exam_backend.settings` |
| `DEBUG` | ✅ | Auto | `False` |
| `ALLOWED_HOSTS` | ✅ | Auto | `*.onrender.com` |
| `PYTHON_VERSION` | ✅ | Auto | `3.12.4` |
| `OPENAI_API_KEY` | ❌ | **Manual** | For AI features |
| `MANUS_API_KEY` | ❌ | **Manual** | Optional |

### Frontend Variables (aws-exam-frontend)

| Variable | Required | Auto/Manual | Notes |
|----------|----------|-------------|-------|
| `VITE_API_BASE_URL` | ✅ | Auto | Linked from backend |
| `VITE_FIREBASE_API_KEY` | ✅ | **Manual** | Firebase Console |
| `VITE_FIREBASE_AUTH_DOMAIN` | ✅ | **Manual** | Firebase Console |
| `VITE_FIREBASE_PROJECT_ID` | ✅ | **Manual** | Firebase Console |
| `VITE_FIREBASE_STORAGE_BUCKET` | ✅ | **Manual** | Firebase Console |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | ✅ | **Manual** | Firebase Console |
| `VITE_FIREBASE_APP_ID` | ✅ | **Manual** | Firebase Console |
| `VITE_FIREBASE_MEASUREMENT_ID` | ❌ | **Manual** | Google Analytics |

---

## Summary

1. **Most variables are auto-configured** via `render.yaml`
2. **You must manually set:**
   - `OPENAI_API_KEY` (backend, if using AI features)
   - All `VITE_FIREBASE_*` variables (frontend)
3. **Frontend changes require a rebuild** after updating variables
4. **Never commit secrets** to your Git repository
5. **Use `.env.example`** files to document required variables

