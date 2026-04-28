/**
 * INTEGRATION EXAMPLE
 * 
 * This file shows how to integrate usePermissions into existing components
 * in your CTOMS application. Copy & adapt these patterns to your codebase.
 */

// ============================================================
// EXAMPLE 1: Order Management - Delete with Super Admin Styling
// ============================================================

import React from 'react';
import { usePermissions } from '@/hooks/usePermissions';
import { confirmDialog } from '@/utils/dialog';

export function OrderCard({ order, onDelete, onEdit }) {
  const { can, isSuperAdmin } = usePermissions();

  return (
    <div className="bg-white p-4 rounded-lg border border-stone-200">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-bold text-lg">{order.id}</h3>
          <p className="text-sm text-stone-600">{order.customer_name}</p>
        </div>
        <span className={`px-2 py-1 rounded text-xs font-bold ${
          order.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-yellow-100 text-yellow-700'
        }`}>
          {order.status}
        </span>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 pt-3 border-t border-stone-100">
        {can('view-orders') && (
          <button className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200">
            View Details
          </button>
        )}

        {can('edit-orders') && (
          <button 
            onClick={() => onEdit(order.id)}
            className="px-3 py-1 text-sm bg-orange-100 text-orange-700 rounded hover:bg-orange-200"
          >
            Edit
          </button>
        )}

        {can('delete-orders') && (
          <button
            onClick={async () => {
              const confirmed = await confirmDialog({
                title: 'Delete Order',
                message: 'Delete this order?',
                confirmText: 'Delete',
                cancelText: 'Cancel',
                type: 'error',
              });

              if (confirmed) {
                onDelete(order.id);
              }
            }}
            className={`px-3 py-1 text-sm rounded font-bold transition-all ${
              isSuperAdmin()
                ? 'bg-red-600 text-white hover:bg-red-700 shadow'
                : 'bg-red-100 text-red-700 hover:bg-red-200'
            }`}
          >
            Delete
          </button>
        )}

        {/* God Mode Badge */}
        {isSuperAdmin() && (
          <span className="ml-auto px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded font-bold">
            🔓 Admin
          </span>
        )}
      </div>
    </div>
  );
}

// ============================================================
// EXAMPLE 2: Shop Management - Multiple Permission Levels
// ============================================================

export function ShopManagementPanel({ shop }) {
  const { can, hasAnyPermission, isSuperAdmin } = usePermissions();

  // Don't render if user can't manage shops at all
  if (!hasAnyPermission(['manage-shops', 'edit-shops', 'delete-shops'])) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="bg-stone-50 p-4 rounded-lg border border-stone-200">
        <h3 className="font-bold mb-3 flex items-center gap-2">
          {shop.shop_name}
          {isSuperAdmin() && <span className="text-xs bg-purple-200 text-purple-700 px-2 py-1 rounded">God Mode</span>}
        </h3>

        {/* Shop Settings - Edit */}
        {can('manage-shops') && (
          <div className="mb-4 p-3 bg-white rounded border border-blue-100">
            <h4 className="font-semibold text-blue-900 mb-2">📋 Shop Settings</h4>
            <button className="text-sm text-blue-600 hover:underline">
              Edit Shop Information
            </button>
          </div>
        )}

        {/* Financial Reports - Restricted */}
        {can('view-financial-reports') && (
          <div className="mb-4 p-3 bg-white rounded border border-green-100">
            <h4 className="font-semibold text-green-900 mb-2">💰 Financial Reports</h4>
            <button className="text-sm text-green-600 hover:underline">
              View Revenue Report
            </button>
          </div>
        )}

        {/* Dangerous Actions - Super Admin Only */}
        {can('delete-shops') && (
          <div className={`p-3 rounded border ${
            isSuperAdmin() 
              ? 'bg-red-50 border-red-200' 
              : 'bg-red-50 border-red-100'
          }`}>
            <h4 className="font-semibold text-red-900 mb-2">⚠️ Danger Zone</h4>
            <button className={`text-sm rounded px-2 py-1 ${
              isSuperAdmin()
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'bg-red-200 text-red-700 hover:bg-red-300'
            }`}>
              Delete Shop
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// EXAMPLE 3: Admin Dashboard - Section Gates
// ============================================================

export function AdminDashboard() {
  const { can, isSuperAdmin, hasAllPermissions } = usePermissions();

  return (
    <div className="space-y-6 p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        {isSuperAdmin() && (
          <div className="bg-gradient-to-r from-purple-100 to-purple-50 border border-purple-300 px-4 py-2 rounded-lg">
            <p className="text-purple-900 font-bold">🔓 Super Admin</p>
          </div>
        )}
      </div>

      {/* Orders Section */}
      {can('view-orders') && (
        <section className="bg-white p-6 rounded-lg shadow border border-stone-100">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            📦 Orders
            {can('delete-orders') && <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">Manage</span>}
          </h2>
          <div className="space-y-3">
            <p>✓ View orders</p>
            {can('create-orders') && <p>✓ Create orders</p>}
            {can('edit-orders') && <p>✓ Edit orders</p>}
            {can('delete-orders') && <p>✓ Delete orders</p>}
          </div>
        </section>
      )}

      {/* Users Section - Requires All Permissions */}
      {hasAllPermissions(['view-users', 'edit-users']) && (
        <section className="bg-white p-6 rounded-lg shadow border border-stone-100">
          <h2 className="text-2xl font-bold mb-4">👥 Users</h2>
          <div className="space-y-3">
            {can('view-users') && <p>✓ View users</p>}
            {can('create-users') && <p>✓ Create users</p>}
            {can('edit-users') && <p>✓ Edit users</p>}
            {can('delete-users') && <p>✓ Delete users</p>}
          </div>
        </section>
      )}

      {/* System Settings - Super Admin Only */}
      {can('manage-system-settings') && (
        <section className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-lg shadow border-2 border-purple-300">
          <h2 className="text-2xl font-bold mb-4 text-purple-900">⚙️ System Settings</h2>
          <p className="text-purple-700 mb-4">Only accessible by Super Admin</p>
          <button className="bg-purple-600 text-white px-4 py-2 rounded font-bold hover:bg-purple-700">
            System Configuration
          </button>
        </section>
      )}

      {/* Audit Logs - Sensitive */}
      {can('view-audit-logs') && (
        <section className="bg-white p-6 rounded-lg shadow border border-stone-100">
          <h2 className="text-2xl font-bold mb-4">📋 Audit Logs</h2>
          <button className="text-blue-600 hover:underline">View System Logs</button>
        </section>
      )}
    </div>
  );
}

// ============================================================
// EXAMPLE 4: Reusable Permission Wrapper Component
// ============================================================

export function PermissionGate({ permission, children, fallback = null }) {
  const { can } = usePermissions();

  if (!can(permission)) {
    return fallback;
  }

  return <>{children}</>;
}

// Usage:
// <PermissionGate permission="delete-orders">
//   <DeleteButton />
// </PermissionGate>

// With fallback:
// <PermissionGate 
//   permission="export-orders"
//   fallback={<span className="text-gray-400">Export (Restricted)</span>}
// >
//   <ExportButton />
// </PermissionGate>

// ============================================================
// EXAMPLE 5: Conditional Form Fields Based on Permissions
// ============================================================

export function CreateOrderForm() {
  const { can, isSuperAdmin } = usePermissions();

  return (
    <form className="space-y-4 max-w-md">
      {/* Standard Fields */}
      <div>
        <label className="block font-bold mb-1">Customer Name</label>
        <input type="text" className="w-full border rounded px-3 py-2" />
      </div>

      <div>
        <label className="block font-bold mb-1">Order Type</label>
        <input type="text" className="w-full border rounded px-3 py-2" />
      </div>

      {/* Admin-Only Fields */}
      {can('manage-order-pricing') && (
        <div>
          <label className="block font-bold mb-1">Discount Percentage</label>
          <input type="number" className="w-full border rounded px-3 py-2" />
        </div>
      )}

      {/* Super Admin Only - Debug Field */}
      {isSuperAdmin() && (
        <div className="bg-purple-50 p-3 rounded border border-purple-200">
          <label className="block font-bold mb-1 text-purple-900">🔓 Debug Priority</label>
          <input type="number" className="w-full border rounded px-3 py-2" />
        </div>
      )}

      <button 
        type="submit"
        className="w-full bg-blue-600 text-white py-2 rounded font-bold hover:bg-blue-700"
      >
        Create Order
      </button>
    </form>
  );
}
