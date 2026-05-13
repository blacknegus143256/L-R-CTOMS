# Complete API Endpoints Reference

## Backend: https://l-r-ctoms.onrender.com

---

## 📱 Frontend Code → Backend API Mapping

### Component Examples

#### 1. MapLibrePicker.jsx
```javascript
// External API (OpenStreetMap - no changes needed)
const response = await fetch(
    'https://nominatim.openstreetmap.org/reverse?...'
);
```

---

#### 2. OrderWizard/Logistics.jsx
```javascript
// Local API call
const response = await axios.get(`/api/shops/${shop.id}/availability`, {...});

// Maps to:
// GET https://l-r-ctoms.onrender.com/api/shops/{shop.id}/availability
```

---

#### 3. OrderWizard/FitLogistics.jsx
```javascript
// Save profile data
await axios.patch('/api/checkout/save-profile', {
    phone: digitsOnly
}, {...});

// Maps to:
// PATCH https://l-r-ctoms.onrender.com/api/checkout/save-profile
```

---

#### 4. Dashboard/CustomersPage.jsx
```javascript
// Get customers list
axios.get(`/api/dashboard/shops/${shopId}/customers`)

// Maps to:
// GET https://l-r-ctoms.onrender.com/api/dashboard/shops/{shopId}/customers

// Add customer
await axios.post(`/api/dashboard/shops/${shopId}/customers`, payload);

// Maps to:
// POST https://l-r-ctoms.onrender.com/api/dashboard/shops/{shopId}/customers

// Update customer
await axios.put(`/api/dashboard/shops/${shopId}/customers/${modal.id}`, payload);

// Maps to:
// PUT https://l-r-ctoms.onrender.com/api/dashboard/shops/{shopId}/customers/{id}

// Delete customer
await axios.delete(`/api/dashboard/shops/${shopId}/customers/${id}`);

// Maps to:
// DELETE https://l-r-ctoms.onrender.com/api/dashboard/shops/{shopId}/customers/{id}
```

---

#### 5. Dashboard/OrderComponents/PaymentModal.jsx
```javascript
// Accept payment
await axios.patch(`/my-orders/${currentOrder.id}/accept`, {});

// Maps to:
// PATCH https://l-r-ctoms.onrender.com/api/my-orders/{id}/accept

// Record manual payment
await axios.post(`/orders/${currentOrder.id}/manual-payment`, payload);

// Maps to:
// POST https://l-r-ctoms.onrender.com/api/orders/{id}/manual-payment

// Generate payment link
const response = await axios.post('/payments/generate', {
    order_id: currentOrder.id,
    amount: currentOrder.total
});

// Maps to:
// POST https://l-r-ctoms.onrender.com/api/payments/generate
```

---

#### 6. Dashboard/ServicesPage.jsx
```javascript
// Get services
axios.get(`/api/dashboard/shops/${shopId}/services`)

// Maps to:
// GET https://l-r-ctoms.onrender.com/api/dashboard/shops/{shopId}/services

// Add service
await axios.post(`/api/dashboard/shops/${shopId}/services`, payload);

// Maps to:
// POST https://l-r-ctoms.onrender.com/api/dashboard/shops/{shopId}/services

// Update service
await axios.put(`/api/dashboard/shops/${shopId}/services/${modal.id}`, payload);

// Maps to:
// PUT https://l-r-ctoms.onrender.com/api/dashboard/shops/{shopId}/services/{id}

// Delete service
await axios.delete(`/api/dashboard/shops/${shopId}/services/${id}`);

// Maps to:
// DELETE https://l-r-ctoms.onrender.com/api/dashboard/shops/{shopId}/services/{id}
```

---

#### 7. StoreAdmin/Dashboard.jsx
```javascript
// Get analytics data (fetch instead of axios)
fetch(`/store/${shop.id}/analytics/revenue?granularity=${granularity}`)

// Maps to:
// GET https://l-r-ctoms.onrender.com/api/store/{id}/analytics/revenue

// Get pending orders
fetch(`/store/${shop.id}/analytics/pending`)

// Maps to:
// GET https://l-r-ctoms.onrender.com/api/store/{id}/analytics/pending
```

---

## 🔐 Protected Routes (Require Authentication)

All routes with `auth:sanctum` middleware require:
1. Valid session/token
2. Frontend and backend on allowed domains
3. CSRF token (handled by bootstrap.js)
4. Credentials enabled (handled by bootstrap.js)

---

## 🌐 Public Routes (No Authentication)

```
GET  /api/categories              - List all service categories
GET  /api/services                - List all services
GET  /api/shops                   - List all shops
GET  /api/shops/{id}              - Get single shop details
GET  /api/shops/{id}/availability - Get shop availability calendar
POST /api/payments/webhook        - PayMongo webhook (no auth)
```

---

## 🔄 Request/Response Flow Example

### Example: Customer Places Order

```
1. FRONTEND (OrderWizard/Logistics.jsx)
   └─ Check availability
      axios.get(`/api/shops/${shop.id}/availability`)

2. AXIOS TRANSFORMS TO:
   GET https://l-r-ctoms.onrender.com/api/shops/{shop.id}/availability

3. NETWORK REQUEST
   ├─ Headers:
   │  ├─ X-CSRF-TOKEN: {...}
   │  ├─ X-Requested-With: XMLHttpRequest
   │  └─ Cookie: XSRF-TOKEN=...; session=...
   └─ Method: GET

4. RENDER BACKEND (routes/api.php)
   └─ Route::get('/shops/{shop}/availability', [AvailabilityController::class, 'getMonthlyAvailability'])

5. CONTROLLER RETURNS:
   {
     "data": {
       "2024-05-15": { available: true, slots: 5 },
       "2024-05-16": { available: false, slots: 0 }
     }
   }

6. FRONTEND RECEIVES & DISPLAYS
   └─ User sees availability calendar
```

---

## 🛠️ How axios Configuration Works

### File: resources/js/bootstrap.js

```javascript
import axios from 'axios';

// 1. Set base URL from environment
const apiUrl = import.meta.env.VITE_API_URL || window.location.origin;
window.axios.defaults.baseURL = apiUrl;

// 2. Enable cross-origin credentials
window.axios.defaults.withCredentials = true;

// 3. Add CSRF token from meta tag
const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
if (token) {
    window.axios.defaults.headers.common['X-CSRF-TOKEN'] = token;
}

// 4. Mark as AJAX request
window.axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
```

### Result: Every axios call automatically includes:
- ✅ Correct base URL
- ✅ CSRF token
- ✅ Credentials (cookies)
- ✅ Proper headers

---

## 📊 API Endpoints by Feature

### Categories & Services
```
GET  /api/categories
GET  /api/services
GET  /api/shops/{shop}/availability
```

### Customer Orders
```
POST /api/shops/{shop}/orders          - Create order
GET  /api/customer/orders              - List my orders
GET  /api/customer/orders/{order}      - Get order details
GET  /api/customer/profile-check       - Check customer profile
```

### Payments
```
POST /api/payments/webhook             - PayMongo webhook
POST /api/payments/generate            - Generate payment link
PATCH /api/my-orders/{id}/accept       - Accept/confirm order
POST /api/orders/{id}/manual-payment   - Record manual payment
```

### Shop Dashboard
```
GET  /api/dashboard/shops
GET  /api/dashboard/shops/{shop}
PATCH /api/dashboard/shops/{shop}/logo - Update shop logo
```

### Customers Management
```
GET    /api/dashboard/shops/{shop}/customers
POST   /api/dashboard/shops/{shop}/customers
PUT    /api/dashboard/shops/{shop}/customers/{id}
DELETE /api/dashboard/shops/{shop}/customers/{id}
```

### Services Management
```
GET    /api/dashboard/shops/{shop}/services
POST   /api/dashboard/shops/{shop}/services
PUT    /api/dashboard/shops/{shop}/services/{id}
DELETE /api/dashboard/shops/{shop}/services/{id}
```

### Orders Management
```
GET    /api/dashboard/shops/{shop}/orders
GET    /api/dashboard/shops/{shop}/orders/{order}
PUT    /api/dashboard/shops/{shop}/orders/{id}
DELETE /api/dashboard/shops/{shop}/orders/{id}
PATCH  /api/dashboard/shops/{shop}/orders/{id}
```

### Analytics
```
GET /api/store/{shop}/analytics/revenue
GET /api/store/{shop}/analytics/pending
```

### Notifications
```
GET /api/notifications
PATCH /api/notifications/{id}/read
```

---

## ✅ Verification Checklist

- [x] Frontend axios configured with baseURL
- [x] Environment variable VITE_API_URL set
- [x] CORS configured for all origins
- [x] SANCTUM middleware configured
- [x] CSRF token handling in place
- [x] Credentials enabled (withCredentials: true)
- [x] Backend routes defined in routes/api.php
- [x] Controllers configured for API responses

---

## 🚀 Testing Each Endpoint

### Using Browser DevTools

1. Open DevTools (F12)
2. Go to Network tab
3. Perform action (click, submit form)
4. Look for API calls to `l-r-ctoms.onrender.com`
5. Click request to see:
   - Headers (CSRF token, credentials)
   - Response (JSON data)
   - Status (200, 401, 404, etc.)

### Using cURL (Terminal)

```bash
# Get shops
curl -H "Cookie: XSRF-TOKEN=..." \
  https://l-r-ctoms.onrender.com/api/shops

# Place order (requires auth)
curl -X POST \
  -H "X-CSRF-TOKEN: ..." \
  -H "Content-Type: application/json" \
  -d '{"shop_id":1,"service_id":2}' \
  -H "Cookie: session=..." \
  https://l-r-ctoms.onrender.com/api/shops/1/orders
```

---

## 📞 Support

If API calls fail:
1. Check Network tab for actual URL
2. Look for CORS errors (check allowed_origins in cors.php)
3. Check 401 errors (authentication required - verify domain in SANCTUM_STATEFUL_DOMAINS)
4. Check 419 errors (CSRF token missing - clear cache)
5. Check Render logs for backend errors

---

**Render Backend:** https://l-r-ctoms.onrender.com
**Frontend:** localhost:5173 (dev) or *.vercel.app (prod)
**All API calls automatically use environment-configured URL** ✅
