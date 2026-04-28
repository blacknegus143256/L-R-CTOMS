# 🔓 User Impersonation - Quick Reference

## What It Does
Super admin can temporarily log in as any customer/shop to:
- ✅ View role-specific pages
- ✅ See real user data
- ✅ Test user experience
- ✅ Access relationships (profile, shop, etc.)
- ✅ Debug permission issues

---

## Quick Start

### Step 1: Backend Routes (Already Done ✅)
```php
Route::post('/super-admin/impersonate/{user}', [ImpersonationController::class, 'impersonate'])->name('super.impersonate');
Route::post('/super-admin/leave-impersonation', [ImpersonationController::class, 'leaveImpersonation'])->name('super.leave-impersonation');
```

### Step 2: Frontend Banner
```jsx
// resources/js/Layouts/AppLayout.jsx (add this)
import ImpersonationBanner from '@/Components/ImpersonationBanner';

export default function AppLayout({ children }) {
  return (
    <>
      <ImpersonationBanner /> {/* Add this */}
      <main>{children}</main>
    </>
  );
}
```

### Step 3: Add Button to User Lists
```jsx
import { ImpersonateButton } from '@/Components/ImpersonateButton';

{/* In your user table/card */}
<ImpersonateButton user={user} />
```

---

## Flow

```
User List
  ↓
Click "🔓 Impersonate" 
  ↓
Confirm dialog
  ↓
Red banner appears
  ↓
Navigate as that user
  ↓
All pages work!
  ↓
Click "Exit Impersonation"
  ↓
Back to admin
```

---

## Components

### ImpersonationBanner
```jsx
// Displays at top when impersonating
// Only renders if impersonating is active
// Has "Exit" button
<ImpersonationBanner />
```

### ImpersonateButton
```jsx
// Click to start impersonation
// Prevents impersonating admins
// Shows loading state
<ImpersonateButton user={user} />
```

---

## Backend Methods

### Impersonate
```
POST /super-admin/impersonate/{user}

Requirements:
- Current user must be super_admin
- Target user cannot be admin
- Stores admin ID in session
- Logs in as target user

Response: Redirects to target user's dashboard
```

### Leave Impersonation
```
POST /super-admin/leave-impersonation

Requirements:
- Must be impersonating (admin ID in session)
- Retrieves original admin ID
- Logs back in as admin

Response: Redirects to admin dashboard
```

---

## Security

✅ Only super_admin can start impersonation  
✅ Cannot impersonate other admins (prevented in controller)  
✅ Original admin ID stored securely in session  
✅ One-click exit via banner  
✅ Exits on logout  

---

## Usage Examples

### Example 1: Table with Impersonate
```jsx
<table>
  <tbody>
    {users.map(user => (
      <tr key={user.id}>
        <td>{user.name}</td>
        <td>{user.email}</td>
        <td><ImpersonateButton user={user} /></td>
      </tr>
    ))}
  </tbody>
</table>
```

### Example 2: User Card
```jsx
<div className="bg-white p-6">
  <h3>{user.name}</h3>
  <p>{user.email}</p>
  <ImpersonateButton user={user} />
</div>
```

### Example 3: Manual Button
```jsx
const handleImpersonate = () => {
  router.post(route('super.impersonate', { user: user.id }));
};

<button onClick={handleImpersonate}>
  Impersonate
</button>
```

---

## Files

### Backend
- `app/Http/Controllers/SuperAdmin/ImpersonationController.php` - Main logic
- `routes/web.php` - Routes (updated)
- `app/Http/Middleware/HandleInertiaRequests.php` - Share state (updated)

### Frontend
- `resources/js/Components/ImpersonationBanner.jsx` - Red banner
- `resources/js/Components/ImpersonateButton.jsx` - Button & button logic

---

## Testing

### Test Impersonate
1. Login as super_admin
2. Go to users list
3. Click "🔓 Impersonate User"
4. Confirm dialog
5. Verify you're logged in as that user
6. Verify banner shows
7. Navigate to their pages (should work!)

### Test Exit
1. Click "Exit Impersonation" button
2. Verify you're back as admin
3. Verify banner is gone

### Test Security
1. Try to impersonate another admin
2. Should get error/disabled button
3. Cannot impersonate super_admin

---

## Troubleshooting

**Q: Banner not showing?**  
A: Add to main layout:
```jsx
import ImpersonationBanner from '@/Components/ImpersonationBanner';
```

**Q: Button not working?**  
A: Verify route names:
- `super.impersonate`
- `super.leave-impersonation`

**Q: Can't exit?**  
A: Check session has 'impersonator_id'. Try clearing cookies and logging back in.

**Q: Can impersonate admin?**  
A: Should be blocked. Check ImpersonationController validates role.

---

## Status

✅ ImpersonationController created  
✅ Routes added  
✅ Middleware updated  
✅ ImpersonationBanner component created  
✅ ImpersonateButton component created  
✅ Documentation complete  

**Ready to deploy!** 🚀

---

## Next Steps

1. Add ImpersonationBanner to main App layout
2. Add ImpersonateButton to user lists
3. Test with super_admin account
4. Verify all role-specific pages work while impersonating
5. Deploy to production

