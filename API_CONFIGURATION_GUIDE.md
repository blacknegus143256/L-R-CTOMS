# API Configuration Guide - CTOMS-LR

## Summary of Changes Made ✅

### 1. ✅ Frontend API Setup (Vite + Axios)

**File:** `resources/js/bootstrap.js`

Updated to use environment variable for API URL:

```javascript
const apiUrl = import.meta.env.VITE_API_URL || window.location.origin;
window.axios.defaults.baseURL = apiUrl;
```

**What this does:**
- All axios calls now use `VITE_API_URL` from your `.env` file
- Falls back to current domain if env var not set
- Logs the API URL in development mode

### 2. ✅ Environment Variables

**File:** `.env`

Your system is configured with:

```env
VITE_API_URL=https://l-r-ctoms.onrender.com
SANCTUM_STATEFUL_DOMAINS=127.0.0.1:8000,l-r-ctoms.onrender.com
```

### 3. ✅ CORS Configuration

**File:** `config/cors.php` (Created)

Configured to allow requests from:
- ✅ Local development: `localhost:3000`, `localhost:5173`, `127.0.0.1:8000`
- ✅ Vercel deployments: `*.vercel.app`
- ✅ Render backend: Already set as baseURL

### 4. ✅ Middleware Setup

**File:** `bootstrap/app.php`

Added API middleware configuration for cross-origin requests:
- Sanctum middleware for stateful authentication
- CSRF token validation (except for webhook endpoints)

---

## Current API Setup

| Component | Configuration | Value |
|-----------|---------------|-------|
| **Backend URL** | `VITE_API_URL` | `https://l-r-ctoms.onrender.com` |
| **Stateful Domains** | `SANCTUM_STATEFUL_DOMAINS` | `127.0.0.1:8000,l-r-ctoms.onrender.com` |
| **Frontend Development** | Vite Dev Server | `localhost:5173` |
| **API Routes** | Laravel | `/api/*` |
| **CORS Status** | Configured | ✅ Ready |

---

## How API Calls Work

### Example 1: Customer Orders
```javascript
// This call:
axios.get('/api/customer/orders')

// Becomes:
GET https://l-r-ctoms.onrender.com/api/customer/orders
```

### Example 2: Dashboard Customers
```javascript
// This call:
axios.get(`/api/dashboard/shops/${shopId}/customers`)

// Becomes:
GET https://l-r-ctoms.onrender.com/api/dashboard/shops/1/customers
```

### Example 3: Payments
```javascript
// This call:
axios.post('/payments/generate', payload)

// Becomes:
POST https://l-r-ctoms.onrender.com/api/payments/generate
```

---

## API Routes Available (Backend)

Your API is served at: `https://l-r-ctoms.onrender.com`

### Public Routes
- `GET /api/categories` - Get all categories
- `GET /api/services` - Get all services
- `GET /api/shops` - Get all shops
- `GET /api/shops/{id}` - Get shop details
- `GET /api/shops/{id}/availability` - Get shop availability
- `POST /api/payments/webhook` - PayMongo webhook

### Protected Routes (Requires Authentication)
- `GET /api/customer/orders` - View own orders
- `POST /api/shops/{id}/orders` - Place new order
- `POST /api/payments/generate` - Generate payment link

### Dashboard Routes
- `GET /api/dashboard/shops` - Get user's shops
- `GET /api/dashboard/shops/{id}/customers` - Manage customers
- `GET /api/dashboard/shops/{id}/services` - Manage services
- `GET /api/dashboard/shops/{id}/orders` - View orders

---

## Deployment Checklist

### For Vercel (Frontend)

When you deploy to Vercel, ensure these env vars are set:

```env
VITE_API_URL=https://l-r-ctoms.onrender.com
VITE_MAPTILER_KEY=XySNCEEsZfkkQpxRisYH
```

### For Render (Backend) 

Render automatically uses your Laravel app. Ensure:

```env
APP_ENV=production
APP_DEBUG=false
APP_URL=https://l-r-ctoms.onrender.com
SANCTUM_STATEFUL_DOMAINS=your-frontend-domain.vercel.app,l-r-ctoms.onrender.com
```

---

## Testing API Calls

### Local Development
Frontend runs at: `http://localhost:5173`
Backend runs at: `http://127.0.0.1:8000`

Axios baseURL will use: `VITE_API_URL` if set in `.env`

### Production
Frontend runs at: `https://your-app.vercel.app`
Backend runs at: `https://l-r-ctoms.onrender.com`

All API calls automatically use: `VITE_API_URL`

---

## Troubleshooting

### Problem: CORS Error
**Solution:** Check that your Vercel domain is added to `allowed_origins` in `config/cors.php`

### Problem: 401 Unauthorized on API calls
**Solution:** Ensure `SANCTUM_STATEFUL_DOMAINS` includes your frontend domain

### Problem: API calls still going to localhost
**Solution:** 
1. Check `.env` has `VITE_API_URL=https://l-r-ctoms.onrender.com`
2. Rebuild frontend: `npm run build`
3. Clear browser cache

### Problem: Cookies not being sent with requests
**Solution:** Axios is configured with `withCredentials: true` in bootstrap.js

---

## Files Modified

✅ `resources/js/bootstrap.js` - Added API baseURL configuration
✅ `.env` - Added SANCTUM_STATEFUL_DOMAINS for Render
✅ `config/cors.php` - Created CORS configuration
✅ `bootstrap/app.php` - Added API middleware

---

## Next Steps

1. **Test Locally:**
   ```bash
   npm run dev        # Frontend
   php artisan serve  # Backend (separate terminal)
   ```

2. **Deploy to Production:**
   - Push to GitHub
   - Vercel redeploys automatically
   - Confirm API calls work with Render backend

3. **Monitor:**
   - Check browser DevTools → Network tab
   - Verify API URLs in Console logs (DEV mode shows them)
   - Check Render logs for backend errors

---

**Last Updated:** May 13, 2026
**Backend:** https://l-r-ctoms.onrender.com
**Status:** ✅ Configured and Ready for Deployment
