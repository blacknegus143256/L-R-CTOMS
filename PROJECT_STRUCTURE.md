# CTOMS-LR Project Structure Quick View

```
CTOMS-LR/
│
├── 📁 app/
│   ├── Console/              # Artisan commands
│   ├── Enums/                # PHP enums (OrderStatus, etc.)
│   ├── Http/
│   │   ├── Controllers/      # API & Web controllers
│   │   ├── Middleware/       # Auth, CORS, custom middleware
│   │   └── Requests/         # Form validation requests
│   ├── Models/               # Database models (Order, User, Shop, etc.)
│   ├── Notifications/        # Email/notification classes
│   └── Providers/            # Service providers (AppServiceProvider)
│
├── 📁 bootstrap/
│   ├── app.php              # App configuration & middleware setup ⭐
│   ├── providers.php        # Service provider loading
│   └── cache/
│
├── 📁 config/
│   ├── app.php              # Application config
│   ├── auth.php             # Authentication config
│   ├── cors.php             # CORS configuration ⭐ (CREATED)
│   ├── database.php         # Database connections
│   ├── mail.php             # Mail configuration
│   └── services.php         # Third-party services
│
├── 📁 database/
│   ├── factories/           # Model factories for testing
│   ├── migrations/          # Database schema migrations
│   └── seeders/             # Database seeders
│
├── 📁 resources/
│   ├── css/
│   │   ├── app.css          # Main styles
│   │   └── electric-orchid.css
│   │
│   ├── js/
│   │   ├── app.jsx          # ⭐ React entry point (Inertia.js)
│   │   ├── bootstrap.js     # ⭐ Axios configuration (MODIFIED)
│   │   ├── ziggy.js         # Route helper
│   │   │
│   │   ├── Components/      # Reusable React components
│   │   │   ├── OrderWizard/
│   │   │   ├── Dashboard/
│   │   │   ├── StoreAdmin/
│   │   │   ├── MapLibrePicker.jsx
│   │   │   └── ... (20+ components)
│   │   │
│   │   ├── pages/           # Page components (routed)
│   │   │   ├── Home.jsx
│   │   │   ├── Shop.jsx
│   │   │   ├── dashboard/
│   │   │   └── ... (StoreAdmin, etc.)
│   │   │
│   │   ├── contexts/        # React Context (AuthContext)
│   │   ├── hooks/           # Custom React hooks
│   │   ├── utils/           # Utility functions
│   │   │   ├── imageUpload.js
│   │   │   ├── receiptGenerator.js
│   │   │   ├── notification.js
│   │   │   └── ... (other utilities)
│   │   │
│   │   └── INTEGRATION_EXAMPLES.js
│   │
│   └── views/
│       └── app.blade.php    # ⭐ Main Blade template with @vite directive
│
├── 📁 routes/
│   ├── api.php              # ⭐ API routes (https://l-r-ctoms.onrender.com/api/...)
│   ├── web.php              # Web routes
│   └── auth.php             # Auth routes
│
├── 📁 storage/
│   ├── app/                 # File uploads
│   ├── framework/           # Cache, sessions
│   └── logs/                # Application logs
│
├── 📁 tests/
│   ├── Feature/             # Feature tests
│   └── Unit/                # Unit tests
│
├── 📁 public/
│   ├── images/              # Static images
│   ├── documents/           # PDF documents
│   ├── storage/             # Public file access
│   └── index.php            # Entry point
│
├── 📁 vendor/               # Composer dependencies
│
├── 📁 docs/                 # Additional documentation
│
├── 📄 .env                  # ⭐ Environment variables (MODIFIED)
├── 📄 .env.example          # ⭐ Example env file (MODIFIED)
├── 📄 artisan              # Laravel CLI
├── 📄 composer.json        # PHP dependencies
├── 📄 package.json         # NPM dependencies
├── 📄 vite.config.js       # Vite bundler config
├── 📄 tailwind.config.js   # Tailwind CSS config
├── 📄 postcss.config.js    # PostCSS config
├── 📄 phpunit.xml          # PHPUnit config
├── 📄 jsconfig.json        # JavaScript path aliases
├── 📄 Dockerfile           # Docker configuration
│
├── 📄 README.md            # Project documentation
├── 📄 API_CONFIGURATION_GUIDE.md                 # ⭐ (CREATED)
├── 📄 API_CONFIGURATION_QUICK_REFERENCE.md       # ⭐ (CREATED)
├── 📄 API_ENDPOINTS_REFERENCE.md                 # ⭐ (CREATED)
├── 📄 GODMODE_IMPLEMENTATION.md
├── 📄 IMPERSONATION_IMPLEMENTATION.md
└── 📄 SYSTEM_DOCUMENTATION.md
```

---

## 🎯 Key Areas by Function

### **Frontend (React + Inertia.js)**
```
resources/
├── css/              → Tailwind styles
├── js/
│   ├── app.jsx       ⭐ React root component
│   ├── bootstrap.js  ⭐ Axios setup (API calls)
│   ├── Components/   → Reusable UI components
│   ├── pages/        → Page components
│   ├── contexts/     → Global state (Auth)
│   ├── hooks/        → Custom React hooks
│   └── utils/        → Helpers (upload, notifications, etc.)
└── views/
    └── app.blade.php ⭐ Main HTML template
```

### **Backend (Laravel + API)**
```
app/
├── Models/           → Database models (Order, User, Shop)
├── Http/
│   ├── Controllers/  → API endpoints logic
│   ├── Middleware/   → Auth, CORS, role checks
│   └── Requests/     → Input validation
├── Enums/            → Status enums (OrderStatus)
└── Notifications/    → Email templates

routes/
├── api.php           ⭐ API routes (/api/*)
└── web.php           → Web routes (views)

config/
├── cors.php          ⭐ CORS allowed origins
├── auth.php          → Authentication config
└── database.php      → Database config
```

### **Configuration Files**
```
Root/
├── .env              ⭐ Environment variables
├── .env.example      ⭐ Template for team
├── vite.config.js    → Vite bundler setup
├── tailwind.config.js→ Tailwind CSS setup
├── composer.json     → PHP packages
└── package.json      → NPM packages (React, Axios, etc.)
```

---

## 🔗 Frontend → Backend Flow

```
┌─────────────────────────────────┐
│   resources/js/pages/           │
│   (React Components)            │
└──────────────┬──────────────────┘
               │
               ↓
┌─────────────────────────────────┐
│ resources/js/bootstrap.js       │
│ (Axios config with baseURL)     │
│ VITE_API_URL = https://...      │
└──────────────┬──────────────────┘
               │
               ↓
┌─────────────────────────────────┐
│ NETWORK REQUEST                 │
│ GET /api/customer/orders        │
│ ↓                               │
│ https://l-r-ctoms.onrender.com  │
│ /api/customer/orders            │
└──────────────┬──────────────────┘
               │
               ↓
┌─────────────────────────────────┐
│ routes/api.php                  │
│ (API route definition)          │
└──────────────┬──────────────────┘
               │
               ↓
┌─────────────────────────────────┐
│ app/Http/Controllers/           │
│ (Business logic)                │
└──────────────┬──────────────────┘
               │
               ↓
┌─────────────────────────────────┐
│ app/Models/                     │
│ (Database queries)              │
└──────────────┬──────────────────┘
               │
               ↓
┌─────────────────────────────────┐
│ JSON Response                   │
│ { "data": [...] }               │
└──────────────┬──────────────────┘
               │
               ↓
┌─────────────────────────────────┐
│ Frontend receives & renders      │
└─────────────────────────────────┘
```

---

## 📊 Technology Stack

| Layer | Technology | Key Files |
|-------|-----------|-----------|
| **Frontend** | React 18 + Inertia.js | `resources/js/app.jsx` |
| **Styling** | Tailwind CSS | `tailwind.config.js` |
| **Bundler** | Vite | `vite.config.js` |
| **HTTP Client** | Axios | `resources/js/bootstrap.js` |
| **Backend** | Laravel 11 | `routes/api.php`, `app/Http/Controllers/` |
| **Database** | MySQL | `database/migrations/` |
| **Authentication** | Sanctum | `config/auth.php` |
| **APIs** | OpenStreetMap, PayMongo | Component implementations |
| **Deployment** | Render + Vercel | `.env` configuration |

---

## 🚀 Important Entry Points

| Purpose | File | What it does |
|---------|------|-------------|
| **App Bootstrap** | `resources/js/app.jsx` | Initializes Inertia.js, mounts React |
| **API Setup** | `resources/js/bootstrap.js` | Configures axios, sets API baseURL ⭐ |
| **HTML Template** | `resources/views/app.blade.php` | Renders HTML, loads Vite assets |
| **API Routes** | `routes/api.php` | Defines all `/api/*` endpoints |
| **Environment** | `.env` | Sets VITE_API_URL, database config |
| **Middleware** | `bootstrap/app.php` | Registers CORS, auth, CSRF middleware |

---

## 📝 Core Models

```
app/Models/

├── User.php                 # Users, authentication
├── TailoringShop.php       # Shop information
├── Order.php               # Customer orders ⭐
├── OrderItem.php           # Items in order
├── OrderPhoto.php          # Order photos
├── OrderMeasurement.php    # Customer measurements
├── Payment.php             # Payment records
├── Service.php             # Services offered
├── ServiceCategory.php     # Service categories
├── Customer.php            # Customer profiles
├── ShopSchedule.php        # Shop hours
├── ShopException.php       # Shop holidays
├── ShopAttribute.php       # Shop details
├── Appointment.php         # Appointments
└── Report.php              # Reports & analytics
```

---

## 🔒 API Security

```
config/cors.php          ← CORS configuration
                           ├── localhost:5173 ✅
                           ├── 127.0.0.1:8000 ✅
                           ├── *.vercel.app ✅
                           └── l-r-ctoms.onrender.com ✅

bootstrap/app.php        ← Middleware setup
                           ├── CSRF token validation
                           ├── Sanctum auth
                           └── API middleware

.env                     ← Environment variables
                           ├── SANCTUM_STATEFUL_DOMAINS
                           ├── VITE_API_URL
                           └── Database credentials
```

---

## 📦 Files Modified for API Setup

| File | Change | Status |
|------|--------|--------|
| `resources/js/bootstrap.js` | Added VITE_API_URL config | ✅ DONE |
| `.env` | Added SANCTUM_STATEFUL_DOMAINS | ✅ DONE |
| `.env.example` | Documented all env vars | ✅ DONE |
| `config/cors.php` | Created CORS config | ✅ DONE |
| `bootstrap/app.php` | Added API middleware | ✅ DONE |

---

## 🧪 Development Commands

```bash
# Frontend
npm run dev              # Start Vite dev server (localhost:5173)
npm run build            # Build for production

# Backend
php artisan serve        # Start Laravel server (localhost:8000)
php artisan tinker       # Interactive shell
php artisan migrate      # Run migrations

# Database
php artisan db:seed      # Seed test data
php artisan make:model ModelName # Create new model

# Testing
php artisan test         # Run tests
npm run test             # Run Jest tests (if configured)
```

---

## 📍 Key Features by Location

| Feature | Location |
|---------|----------|
| **Order Placement** | `resources/js/Components/OrderWizard/` |
| **Shop Dashboard** | `resources/js/pages/dashboard/` |
| **Admin Panel** | `resources/js/pages/StoreAdmin/` |
| **Payment Processing** | `resources/js/Components/OrderComponents/PaymentModal.jsx` |
| **User Authentication** | `resources/js/contexts/AuthContext.jsx` |
| **Map Location Picker** | `resources/js/Components/MapLibrePicker.jsx` |
| **File Uploads** | `resources/js/utils/imageUpload.js` |
| **API Controllers** | `app/Http/Controllers/Api/` |
| **Database Models** | `app/Models/` |

---

## ⭐ Recently Added Files

```
📄 API_CONFIGURATION_GUIDE.md              ← Complete setup guide
📄 API_CONFIGURATION_QUICK_REFERENCE.md    ← Quick reference for team
📄 API_ENDPOINTS_REFERENCE.md              ← All endpoint mappings
📄 config/cors.php                         ← CORS configuration
```

---

**Project Status:** ✅ Fully configured for production deployment with Render + Vercel
