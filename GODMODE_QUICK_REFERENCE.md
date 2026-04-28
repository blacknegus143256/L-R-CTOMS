# Super Admin God Mode - Quick Reference

## 🚀 Quick Start

### Backend (Already Done ✅)
```php
// app/Providers/AppServiceProvider.php
Gate::before(function ($user, $ability) {
    if ($user && $user->role === 'super_admin') {
        return true;
    }
});
```

### Frontend (Already Done ✅)
```jsx
import { usePermissions } from '@/hooks/usePermissions';

export function YourComponent() {
  const { can, isSuperAdmin } = usePermissions();
  
  if (!can('delete-orders')) return null;
  
  return <button>Delete</button>;
}
```

---

## 📋 Permission Checks

### Single Permission
```jsx
const { can } = usePermissions();

if (can('delete-orders')) {
  // Show restricted element
}
```

### Is Super Admin?
```jsx
const { isSuperAdmin } = usePermissions();

{isSuperAdmin() && <DebugPanel />}
```

### Any Permission
```jsx
const { hasAnyPermission } = usePermissions();

if (hasAnyPermission(['delete', 'edit', 'export'])) {
  // User has at least one
}
```

### All Permissions
```jsx
const { hasAllPermissions } = usePermissions();

if (hasAllPermissions(['delete', 'edit'])) {
  // User has all
}
```

---

## 🎯 Common Patterns

### Conditional Rendering
```jsx
{can('delete-orders') && <DeleteButton />}
```

### Dynamic Styling
```jsx
<button className={isSuperAdmin() ? 'bg-red-600' : 'bg-red-200'}>
  Delete
</button>
```

### Conditional Sections
```jsx
{hasAnyPermission(['view', 'edit', 'delete']) && (
  <AdminSection />
)}
```

### HOC Pattern
```jsx
export const ProtectedDelete = withPermission(DeleteButton, 'delete-orders');
```

---

## 🔐 How It Works

### Backend Flow
```
User Action (authorize/Gate check)
        ↓
Gate::before() called
        ↓
Is role === 'super_admin'?
        ├─ YES → Return true (✅ Allowed)
        └─ NO → Continue to Policy/Permission
```

### Frontend Flow
```
Component renders
        ↓
usePermissions() hook called
        ↓
Is user.role === 'super_admin'?
        ├─ YES → can() returns true (✅ Show element)
        └─ NO → Check user.permissions array
```

---

## ✅ Verification Checklist

- [x] AppServiceProvider has Gate::before() with super_admin check
- [x] usePermissions hook is created in resources/js/hooks/
- [x] User model has `role` field (already exists)
- [x] Inertia passes `auth.user.role` to frontend
- [x] Examples provided in PermissionExamples.jsx

---

## 🧪 Testing Super Admin

### Backend
```bash
# Create super_admin user
php artisan tinker
>>> User::create(['name' => 'Admin', 'email' => 'admin@test.com', 'role' => 'super_admin', 'password' => Hash::make('password')])
```

### Frontend (Browser DevTools)
```javascript
// Check in console
window.location.pathname; // Should be on admin page

// Inspect permission
const auth = document.querySelector('[data-page]').__INERTIA__.props.auth;
console.log(auth.user.role); // Should be 'super_admin'
```

---

## ⚠️ Important Notes

1. **Frontend checks are UI only** - Always validate on backend
2. **Super admin role must be in database** - Set via migration or seeder
3. **Inertia must pass auth.user.role** - Check controller/middleware
4. **Permission strings are custom** - Define your own ('delete-orders', 'edit-users', etc.)

---

## 📚 File Locations

- **Backend Gate**: `app/Providers/AppServiceProvider.php`
- **Frontend Hook**: `resources/js/hooks/usePermissions.js`
- **Examples**: `resources/js/Components/PermissionExamples.jsx`
- **Documentation**: `GODMODE_IMPLEMENTATION.md`

---

## 🆘 Troubleshooting

### Super admin still can't access?
1. Check database: `SELECT role FROM users WHERE id = X;`
2. Verify AppServiceProvider boot() is running
3. Clear cache: `php artisan cache:clear`

### Frontend showing "not authorized"?
1. Check DevTools: `auth.user.role` should be 'super_admin'
2. Verify Inertia passes auth prop
3. Reload page after making user super_admin

### Permission hook returns wrong value?
1. Check user permissions array structure
2. Verify permission string matches exactly (case-sensitive)
3. For super_admin, should always return true

