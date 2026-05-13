# API Configuration - Quick Reference

## 🎯 What Was Done

Your CTOMS-LR system has been configured to work with the **Render backend** (`https://l-r-ctoms.onrender.com`).

### Changes Made:

| File | Change | Purpose |
|------|--------|---------|
| `resources/js/bootstrap.js` | Added `VITE_API_URL` baseURL config | All axios calls use environment variable |
| `.env` | Added `SANCTUM_STATEFUL_DOMAINS` | Authentication works across domains |
| `.env.example` | Documented all API env vars | Template for deployments |
| `config/cors.php` | Created CORS configuration | Allows cross-origin requests |
| `bootstrap/app.php` | Added API middleware | Enables stateful authentication |

---

## 📋 API Configuration Files

### Frontend (resources/js/bootstrap.js)
```javascript
const apiUrl = import.meta.env.VITE_API_URL || window.location.origin;
window.axios.defaults.baseURL = apiUrl;
```

### Backend Routes (routes/api.php)
```
GET    /api/categories
GET    /api/services
GET    /api/shops
GET    /api/shops/{id}
GET    /api/shops/{id}/availability
GET    /api/customer/orders
POST   /api/payments/generate
```

### CORS Allowed Origins
- `localhost:5173` (Vite dev)
- `127.0.0.1:8000` (Laravel dev)
- `*.vercel.app` (Vercel deployments)

---

## ✅ Environment Variables

```env
# Backend API URL
VITE_API_URL=https://l-r-ctoms.onrender.com

# Authentication domains
SANCTUM_STATEFUL_DOMAINS=127.0.0.1:8000,l-r-ctoms.onrender.com

# Map functionality
VITE_MAPTILER_KEY=XySNCEEsZfkkQpxRisYH
```

---

## 🧪 How to Test

### Local Development
```bash
# Terminal 1: Frontend
npm run dev

# Terminal 2: Backend  
php artisan serve

# Open http://localhost:5173
```

**Expected:** API calls go to `http://127.0.0.1:8000` (same origin)

### Production (Vercel + Render)
Frontend: `https://your-app.vercel.app`
Backend: `https://l-r-ctoms.onrender.com`

**Expected:** API calls go to `https://l-r-ctoms.onrender.com`

---

## 🔍 Verify API Calls

### In Browser DevTools (Network Tab)
Look for requests like:
- `https://l-r-ctoms.onrender.com/api/customer/orders`
- `https://l-r-ctoms.onrender.com/api/payments/generate`

### In Console (Dev Mode)
Should show: `API Base URL: https://l-r-ctoms.onrender.com`

---

## 🚀 Deployment Steps

### 1. For Vercel (Frontend)
Set environment variables in Vercel project:
```
VITE_API_URL = https://l-r-ctoms.onrender.com
VITE_MAPTILER_KEY = XySNCEEsZfkkQpxRisYH
```

### 2. For Render (Backend)
Ensure Render service has:
```
APP_ENV = production
APP_DEBUG = false
SANCTUM_STATEFUL_DOMAINS = your-vercel-url.vercel.app,l-r-ctoms.onrender.com
```

### 3. Push & Verify
- Push code to GitHub
- Vercel builds automatically
- Check Network tab for API URLs
- Test login/orders flow

---

## 📊 API Routes Reference

### Public (No Auth Required)
```
GET  /api/categories
GET  /api/services  
GET  /api/shops
GET  /api/shops/{id}
GET  /api/shops/{id}/availability
POST /api/payments/webhook
```

### Protected (Requires Authentication)
```
GET    /api/user
POST   /api/logout
GET    /api/notifications
GET    /api/customer/orders
POST   /api/customer/orders
GET    /api/payments/generate
POST   /api/payments/generate
```

### Dashboard (Shop Owners)
```
GET    /api/dashboard/shops
GET    /api/dashboard/shops/{id}
GET    /api/dashboard/shops/{id}/services
POST   /api/dashboard/shops/{id}/services
PUT    /api/dashboard/shops/{id}/services/{id}
DELETE /api/dashboard/shops/{id}/services/{id}

GET    /api/dashboard/shops/{id}/customers
POST   /api/dashboard/shops/{id}/customers
PUT    /api/dashboard/shops/{id}/customers/{id}
DELETE /api/dashboard/shops/{id}/customers/{id}

GET    /api/dashboard/shops/{id}/orders
PATCH  /api/dashboard/shops/{id}/orders/{id}
```

---

## ⚠️ Common Issues & Fixes

### CORS Error
**Error:** `Access to XMLHttpRequest blocked by CORS policy`
**Fix:** 
1. Check frontend URL is in `config/cors.php`
2. Clear browser cache
3. Restart dev server

### 401 Unauthorized
**Error:** `Unauthenticated` on protected routes
**Fix:**
1. Verify `SANCTUM_STATEFUL_DOMAINS` includes your domain
2. Check cookies are being sent (DevTools → Application → Cookies)
3. Ensure `withCredentials: true` in bootstrap.js ✅ (already done)

### API calls go to wrong URL
**Error:** Calls still going to `localhost` instead of Render
**Fix:**
1. Check `.env` has `VITE_API_URL=https://l-r-ctoms.onrender.com`
2. Rebuild: `npm run build`
3. Hard refresh browser (Ctrl+Shift+R)

### CSRF Token Missing
**Error:** `419 Token Mismatch`
**Fix:**
1. Verify CSRF middleware is configured ✅ (already done)
2. Check `X-CSRF-TOKEN` header is present
3. Ensure cookies are enabled

---

## 📝 Files to Share with Team

✅ **API_CONFIGURATION_GUIDE.md** - Comprehensive guide
✅ **API_CONFIGURATION_QUICK_REFERENCE.md** - This file
✅ **config/cors.php** - CORS configuration
✅ **API routes** - routes/api.php

---

## 🎓 Key Concepts

**VITE_API_URL**
- Environment variable for API base URL
- Used by axios in bootstrap.js
- Different per environment (local/staging/production)

**SANCTUM_STATEFUL_DOMAINS**
- Tells Laravel which domains can use session cookies
- Must include frontend domain(s)
- Enables authenticated API calls

**CORS**
- Allows cross-origin requests
- Configured per origin (domain)
- Necessary when frontend ≠ backend domain

---

**Backend Status:** ✅ Live at https://l-r-ctoms.onrender.com
**Last Updated:** May 13, 2026
**Team:** Ready for Production Deployment
