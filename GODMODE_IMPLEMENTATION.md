# Super Admin "God Mode" Implementation Guide

## Overview
This implementation provides universal access control for super_admin users across both Laravel backend and React frontend without manually updating every Policy or Controller.

---

## 1. Backend Setup (Laravel)

### How It Works
The `Gate::before()` method in `AppServiceProvider` intercepts **ALL** authorization checks. If the authenticated user has `role === 'super_admin'`, it automatically returns `true` before checking individual policies.

### Implementation Location
**File:** `app/Providers/AppServiceProvider.php`

```php
<?php

namespace App\Providers;

use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Gate;

class AppServiceProvider extends ServiceProvider
{
    public function boot(): void
    {
        Vite::useBuildDirectory('build');
        Vite::prefetch(concurrency: 3);

        // GOD MODE: Super Admin bypasses all authorization checks
        Gate::before(function ($user, $ability) {
            // If user has super_admin role, grant all permissions
            if ($user && $user->role === 'super_admin') {
                return true;
            }
        });
    }
}
```

### Usage in Controllers
Once set up, all authorization checks automatically work:

```php
// In any Controller

// Using authorize() helper
public function delete(Order $order)
{
    $this->authorize('delete', $order);
    // Super admin automatically passes!
    
    $order->delete();
    return response()->json(['success' => true]);
}

// Using Gate::authorize()
if (Gate::authorize('manage-system-settings')) {
    // Super admin automatically allowed
    SystemSetting::update($data);
}

// In Policies (if you create them later)
public function delete(User $user, Order $order)
{
    // This won't even be called for super_admin!
    // Gate::before() returns true before reaching here
    return $user->id === $order->user_id;
}
```

### Benefits
✅ No need to modify existing Controllers or Policies
✅ Works with all authorization methods: `authorize()`, `Gate::authorize()`, Policies
✅ Single source of truth for super_admin elevation
✅ Existing permission logic stays untouched

---

## 2. Frontend Setup (React)

### Hook: usePermissions()

**File:** `resources/js/hooks/usePermissions.js`

#### Available Methods

```javascript
const { can, isSuperAdmin, hasAnyPermission, hasAllPermissions, user } = usePermissions();

// Check single permission
if (can('delete-orders')) { /* ... */ }

// Check if user is super admin
if (isSuperAdmin()) { /* ... */ }

// Check if user has ANY of the permissions
if (hasAnyPermission(['delete-orders', 'edit-orders'])) { /* ... */ }

// Check if user has ALL of the permissions
if (hasAllPermissions(['delete-orders', 'create-orders'])) { /* ... */ }

// Access the user object
console.log(user.role, user.id, user.email);
```

---

## 3. Example Implementations

### Simple Permission Check

```jsx
import { usePermissions } from '@/hooks/usePermissions';

export function DeleteOrderButton({ orderId, onDelete }) {
  const { can, isSuperAdmin } = usePermissions();

  // Hide button entirely if user doesn't have permission
  if (!can('delete-orders')) {
    return null;
  }

  return (
    <button
      onClick={() => onDelete(orderId)}
      className={`px-4 py-2 rounded-lg font-semibold ${
        isSuperAdmin()
          ? 'bg-red-600 text-white hover:bg-red-700'
          : 'bg-red-100 text-red-700 hover:bg-red-200'
      }`}
    >
      Delete Order
    </button>
  );
}
```

### Multiple Permission Gates

```jsx
export function OrderActionMenu({ orderId, onEdit, onDelete, onExport }) {
  const { can, isSuperAdmin } = usePermissions();

  return (
    <div className="flex gap-2">
      {can('edit-orders') && (
        <button onClick={() => onEdit(orderId)}>Edit</button>
      )}

      {can('export-orders') && (
        <button onClick={() => onExport(orderId)}>Export</button>
      )}

      {can('delete-orders') && (
        <button
          onClick={() => onDelete(orderId)}
          className={isSuperAdmin() ? 'text-red-600' : 'text-red-400'}
        >
          Delete
        </button>
      )}

      {isSuperAdmin() && (
        <span className="text-purple-600 text-sm">🔓 God Mode</span>
      )}
    </div>
  );
}
```

### Conditional Sections

```jsx
export function AdminPanel() {
  const { can, hasAnyPermission, isSuperAdmin } = usePermissions();

  return (
    <div className="space-y-6">
      {/* Show banner for super admin */}
      {isSuperAdmin() && (
        <div className="bg-purple-50 p-4 rounded border border-purple-200">
          🔓 Super Admin - God Mode Active
        </div>
      )}

      {/* Orders section - only if user can manage orders */}
      {hasAnyPermission(['view-orders', 'edit-orders', 'delete-orders']) && (
        <section>
          <h2>Orders Management</h2>
          {can('view-orders') && <OrdersList />}
          {can('create-orders') && <CreateOrderForm />}
          {can('delete-orders') && <BulkDeleteButton />}
        </section>
      )}

      {/* System settings - super admin only */}
      {can('manage-system-settings') && (
        <section>
          <h2>🔐 System Settings</h2>
          <SystemSettingsPanel />
        </section>
      )}
    </div>
  );
}
```

### Higher-Order Component Pattern

```jsx
import { withPermission } from '@/hooks/usePermissions';

// Original component
function DeleteButton({ id, onDelete }) {
  return <button onClick={() => onDelete(id)}>Delete</button>;
}

// Wrap it with permission check
export const RestrictedDeleteButton = withPermission(
  DeleteButton,
  'delete-orders'
);

// Usage - automatically hidden if user doesn't have permission
<RestrictedDeleteButton id={123} onDelete={handleDelete} />
```

---

## 4. Complete Example: Delete Order with Confirmation

```jsx
import React from 'react';
import { usePermissions } from '@/hooks/usePermissions';
import { router } from '@inertiajs/react';

export function OrderDeleteButton({ orderId }) {
  const { can, isSuperAdmin } = usePermissions();
  const [isDeleting, setIsDeleting] = React.useState(false);

  // Don't render if user can't delete
  if (!can('delete-orders')) {
    return null;
  }

  const handleDelete = async () => {
    const confirmDelete = window.confirm(
      'Are you sure? This action cannot be undone.'
    );

    if (!confirmDelete) return;

    setIsDeleting(true);
    try {
      await router.delete(`/api/orders/${orderId}`);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <button
      onClick={handleDelete}
      disabled={isDeleting}
      className={`
        px-4 py-2 rounded-lg font-semibold transition-all
        ${isDeleting ? 'opacity-50 cursor-not-allowed' : ''}
        ${isSuperAdmin()
          ? 'bg-red-600 text-white hover:bg-red-700 shadow-lg'
          : 'bg-red-100 text-red-700 hover:bg-red-200'
        }
      `}
    >
      {isDeleting ? 'Deleting...' : isSuperAdmin() ? '🔴 Delete Order' : 'Delete'}
    </button>
  );
}
```

---

## 5. How Permissions Are Passed to Frontend

The user's role is passed through Inertia's shared props. Make sure your server sends it:

```php
// In your controller or middleware
use Inertia\Inertia;

return Inertia::render('YourPage', [
    'auth' => [
        'user' => [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->role,  // ← This is key!
            'permissions' => $user->permissions ?? [], // Optional: array of permission strings
        ]
    ]
]);
```

---

## 6. Testing

### Backend Test Example
```php
// tests/Feature/AdminGodModeTest.php

public function test_super_admin_can_delete_any_order()
{
    $superAdmin = User::factory()->create(['role' => 'super_admin']);
    $order = Order::factory()->create();

    $this->actingAs($superAdmin)
        ->deleteJson("/api/orders/{$order->id}")
        ->assertOk();
}

public function test_regular_user_cannot_delete_others_orders()
{
    $user = User::factory()->create(['role' => 'customer']);
    $order = Order::factory()->create();

    $this->actingAs($user)
        ->deleteJson("/api/orders/{$order->id}")
        ->assertForbidden();
}
```

### Frontend Test Example
```jsx
// resources/js/__tests__/usePermissions.test.js

import { renderHook } from '@testing-library/react-hooks';
import { usePermissions } from '@/hooks/usePermissions';

test('super_admin can do everything', () => {
  // Mock super admin user
  const { result } = renderHook(() => usePermissions(), {
    wrapper: ({ children }) => (
      <div data-auth='{"user":{"role":"super_admin"}}'>{children}</div>
    ),
  });

  expect(result.current.can('delete-orders')).toBe(true);
  expect(result.current.isSuperAdmin()).toBe(true);
});
```

---

## 7. Migration Guide for Existing Code

If you have existing permission checks:

### Before (Manual Check)
```jsx
{user?.role === 'super_admin' && (
  <button>Delete</button>
)}
```

### After (Using Hook)
```jsx
const { can } = usePermissions();

{can('delete-orders') && (
  <button>Delete</button>
)}
```

---

## 8. Security Considerations

✅ **Backend Protection**: `Gate::before()` ensures super_admin access is enforced server-side
✅ **Frontend UI Only**: Frontend checks are for UX only; always validate on the backend
✅ **Role in Database**: Make sure the `role` column is properly set in the database
✅ **Audit Logging**: Consider logging super_admin actions for compliance

---

## 9. Environment-Specific Configuration

For extra safety in production, you can make super_admin configurable:

```php
// In AppServiceProvider.php
Gate::before(function ($user, $ability) {
    // Only allow god mode if explicitly enabled
    if (config('auth.enable_god_mode', false) && $user->role === 'super_admin') {
        return true;
    }
});
```

Then in `.env`:
```
AUTH_ENABLE_GOD_MODE=true  # Only enable in specific environments
```

---

## Summary

| Layer | Method | File |
|-------|--------|------|
| **Backend** | Gate::before() | app/Providers/AppServiceProvider.php |
| **Frontend** | usePermissions Hook | resources/js/hooks/usePermissions.js |
| **Examples** | Component Examples | resources/js/Components/PermissionExamples.jsx |

The super_admin role now has automatic universal access while keeping your codebase clean and maintainable!
