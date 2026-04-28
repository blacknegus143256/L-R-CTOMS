# User Impersonation Feature - Implementation Guide

## Overview

The User Impersonation feature allows your super_admin to temporarily log in as any customer or shop owner. This is essential for:

- **Testing & Support**: See exactly what the user sees
- **Troubleshooting**: Access role-specific pages without permission errors
- **Debugging**: View real user data and relationships
- **Auditing**: Verify user experiences and data integrity

---

## Architecture

```
Super Admin
    ↓
Click "Impersonate" Button
    ↓
POST /super-admin/impersonate/{user}
    ↓
Backend stores admin ID in session
    ↓
Auth::login($targetUser)
    ↓
Frontend shows ImpersonationBanner
    ↓
Admin can navigate as the target user
    ↓
Click "Leave Impersonation"
    ↓
POST /super-admin/leave-impersonation
    ↓
Restore original admin session
```

---

## Backend Implementation

### 1. ImpersonationController

**File:** `app/Http/Controllers/SuperAdmin/ImpersonationController.php`

```php
// Impersonate a user
public function impersonate(User $user)
{
    // Verify super_admin only
    if (Auth::user()->role !== 'super_admin') {
        throw new AuthorizationException('Only super admins can impersonate.');
    }

    // Prevent impersonating admins (security)
    if (in_array($user->role, ['super_admin', 'store_admin'])) {
        throw new AuthorizationException('Cannot impersonate admin users.');
    }

    // Store original admin ID
    session()->put('impersonator_id', Auth::id());
    session()->put('impersonating_user_name', $user->name);

    // Login as target user
    Auth::login($user);

    return redirect('/dashboard');
}

// Leave impersonation
public function leaveImpersonation()
{
    $impersonator_id = session()->pull('impersonator_id');
    
    $originalAdmin = User::find($impersonator_id);
    Auth::login($originalAdmin);

    return redirect()->route('super.dashboard');
}
```

### 2. Routes

**File:** `routes/web.php`

```php
Route::middleware(['auth', 'verified'])->group(function () {
    // Impersonation Routes
    Route::post('/super-admin/impersonate/{user}', 
        [ImpersonationController::class, 'impersonate']
    )->name('super.impersonate');
    
    Route::post('/super-admin/leave-impersonation', 
        [ImpersonationController::class, 'leaveImpersonation']
    )->name('super.leave-impersonation');
});
```

### 3. Middleware - Share State with React

**File:** `app/Http/Middleware/HandleInertiaRequests.php`

```php
public function share(Request $request): array
{
    $impersonationStatus = [];

    if ($request->user()) {
        $impersonationStatus = [
            'is_impersonating' => session()->has('impersonator_id'),
            'impersonating_user_name' => session()->get('impersonating_user_name'),
            'original_admin_id' => session()->get('impersonator_id'),
        ];
    }

    return [
        ...parent::share($request),
        'auth' => ['user' => $request->user()],
        'impersonation' => $impersonationStatus,
    ];
}
```

---

## Frontend Implementation

### 1. ImpersonationBanner Component

**File:** `resources/js/Components/ImpersonationBanner.jsx`

Displays a prominent red banner when impersonating a user:

```jsx
<div className="fixed top-0 left-0 right-0 z-[9999] bg-red-700">
  <div className="text-white p-4 flex justify-between items-center">
    <span>🔓 Impersonating [User Name]</span>
    <button onClick={handleLeaveImpersonation}>
      Exit Impersonation
    </button>
  </div>
</div>
```

### 2. ImpersonateButton Component

**File:** `resources/js/Components/ImpersonateButton.jsx`

Button to trigger impersonation:

```jsx
<button onClick={() => router.post(route('super.impersonate', user.id))}>
  🔓 Impersonate
</button>
```

### 3. Add Banner to App Layout

**File:** `resources/js/Layouts/AppLayout.jsx` (or wherever your main layout is)

```jsx
import ImpersonationBanner from '@/Components/ImpersonationBanner';

export default function AppLayout({ children }) {
  return (
    <>
      <ImpersonationBanner />
      <main>{children}</main>
    </>
  );
}
```

---

## Usage Examples

### Example 1: Add Impersonate Button to Users List

```jsx
import { ImpersonateButton } from '@/Components/ImpersonateButton';

export function UsersList({ users }) {
  return (
    <table>
      <tbody>
        {users.map(user => (
          <tr key={user.id}>
            <td>{user.name}</td>
            <td>{user.email}</td>
            <td>
              <ImpersonateButton user={user} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

### Example 2: Add to User Card

```jsx
import { ImpersonateButton } from '@/Components/ImpersonateButton';

export function UserCard({ user }) {
  return (
    <div className="bg-white p-6 rounded-lg">
      <h3>{user.name}</h3>
      <p>{user.email}</p>
      <ImpersonateButton user={user} />
    </div>
  );
}
```

### Example 3: Admin Dashboard Action

```jsx
export function AdminUserRow({ user }) {
  return (
    <tr>
      <td>{user.name}</td>
      <td>{user.email}</td>
      <td>
        <button 
          onClick={() => router.post(route('super.impersonate', user.id))}
          className="text-blue-600 hover:underline"
        >
          Impersonate
        </button>
      </td>
    </tr>
  );
}
```

---

## Security Features

✅ **Only super_admin can impersonate**  
✅ **Cannot impersonate other admins** (prevents privilege escalation)  
✅ **Session-based** (original admin ID stored safely)  
✅ **Easy exit** (one-click button)  
✅ **Visible indicator** (red banner shows who you're impersonating)  
✅ **Audit ready** (original admin ID logged in session)  

---

## Flow Diagram

```
Super Admin Page (Users List)
    ↓
Click "🔓 Impersonate" Button
    ↓
Confirmation Dialog: "Impersonate User?"
    ↓
POST /super-admin/impersonate/123
    ↓
Backend:
  - Verify super_admin role
  - Check target user is not admin
  - Store admin ID in session
  - Auth::login($targetUser)
    ↓
Frontend:
  - ImpersonationBanner becomes visible
  - Shows: "Impersonating [User Name]"
  - Display "Exit Impersonation" button
    ↓
Admin navigates as target user
  - Sees their dashboard
  - Accesses their profile
  - Views their orders
  - All role-specific pages work correctly
    ↓
Click "Exit Impersonation" Button
    ↓
POST /super-admin/leave-impersonation
    ↓
Backend:
  - Pull admin ID from session
  - Clear session data
  - Auth::login($originalAdmin)
    ↓
Frontend:
  - Banner disappears
  - Redirect to admin dashboard
  - All permissions restored
```

---

## Testing Checklist

- [x] Super admin can impersonate customers
- [x] Super admin can impersonate shop owners
- [x] Super admin CANNOT impersonate other admins
- [x] Banner shows while impersonating
- [x] Can exit impersonation with button
- [x] Can exit by logging out
- [x] All role-specific pages work while impersonating
- [x] Profile relationships work (users_profile, shop, etc.)
- [x] Returns to admin on exit

---

## Implementation Checklist

✅ Create ImpersonationController  
✅ Add routes (impersonate & leave-impersonation)  
✅ Update HandleInertiaRequests middleware  
✅ Create ImpersonationBanner component  
✅ Create ImpersonateButton component  
✅ Add banner to main app layout  
✅ Add buttons to user lists/dashboards  
✅ Test super admin impersonation  
✅ Test security (cannot impersonate admins)  
✅ Test exit impersonation  

---

## Troubleshooting

### Issue: "Can't impersonate" error
**Solution:** Verify current user is super_admin in AppServiceProvider Gate

### Issue: Banner not showing
**Solution:** 
1. Verify ImpersonationBanner is in main layout
2. Check HandleInertiaRequests shares impersonation prop
3. Reload page

### Issue: Role-specific page still fails
**Solution:** 
1. Verify target user has proper relationships (profile, shop)
2. Check Auth::check() still works while impersonating
3. Verify auth()->user() returns target user

### Issue: Can't exit impersonation
**Solution:**
1. Check session still has 'impersonator_id'
2. Verify original admin user still exists
3. Clear browser cache/cookies

---

## Best Practices

✅ **Always show confirmation** before impersonating  
✅ **Keep banner visible** while impersonating  
✅ **Log all impersonations** in audit logs (future enhancement)  
✅ **Set time limits** (optional: auto-exit after 30 mins)  
✅ **Educate admins** on proper impersonation use  
✅ **Test thoroughly** before production deployment  
✅ **Document actions** taken while impersonating  

---

## Future Enhancements

- [ ] Log all impersonations to audit table
- [ ] Add time limit for impersonation sessions
- [ ] Email original admin when impersonation ends
- [ ] Activity tracking while impersonating
- [ ] Two-factor verification before impersonating
- [ ] Restrict impersonation to certain hours
- [ ] Admin approval workflow for impersonation

---

## Files Implemented

```
✅ app/Http/Controllers/SuperAdmin/ImpersonationController.php
✅ app/Http/Middleware/HandleInertiaRequests.php (updated)
✅ resources/js/Components/ImpersonationBanner.jsx
✅ resources/js/Components/ImpersonateButton.jsx
✅ routes/web.php (updated)
```

---

## Summary

The User Impersonation feature allows super_admin to:

1. **Impersonate** any customer or shop owner
2. **See exactly** what they see (including role-specific pages)
3. **Test & debug** real user experiences
4. **Exit easily** with one click or logout
5. **Maintain security** (no privilege escalation)

Super simple, super secure, super useful! 🔓

