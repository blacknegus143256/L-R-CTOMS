import React from 'react';
import { usePermissions } from '@/hooks/usePermissions';
import { confirmDialog } from '@/utils/dialog';

/**
 * Example Implementation: Delete Order Button
 * 
 * Demonstrates how to use the usePermissions hook to conditionally
 * render restricted UI elements. Super admins see this button automatically.
 */
export function DeleteOrderButton({ orderId, onDelete }) {
  const { can, isSuperAdmin } = usePermissions();

  // Hide button entirely if user doesn't have permission
  if (!can('delete-orders')) {
    return null;
  }

  const handleDelete = async () => {
    const confirmed = await confirmDialog({
      title: 'Delete Order',
      message: 'Are you sure you want to delete this order? This action cannot be undone.',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      type: 'error',
    });

    if (!confirmed) {
      return;
    }

    try {
      await onDelete(orderId);
    } catch (error) {
      console.error('Failed to delete order:', error);
    }
  };

  return (
    <button
      onClick={handleDelete}
      className={`px-4 py-2 rounded-lg font-semibold transition-all ${
        isSuperAdmin()
          ? 'bg-red-600 text-white hover:bg-red-700 shadow-lg'
          : 'bg-red-100 text-red-700 hover:bg-red-200'
      }`}
    >
      {isSuperAdmin() ? '🔴 Delete Order' : 'Delete'}
    </button>
  );
}

/**
 * Example: Order Action Menu
 * 
 * Shows multiple permission-gated actions
 */
export function OrderActionMenu({ orderId, onEdit, onDelete, onExport }) {
  const { can, isSuperAdmin } = usePermissions();

  return (
    <div className="flex gap-2">
      {/* Edit - Always available for authorized users */}
      {can('edit-orders') && (
        <button
          onClick={() => onEdit(orderId)}
          className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
        >
          Edit
        </button>
      )}

      {/* Export - Only for super admin or specific permission */}
      {can('export-orders') && (
        <button
          onClick={() => onExport(orderId)}
          className="px-3 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200"
        >
          Export
        </button>
      )}

      {/* Delete - Restricted action */}
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
              onDelete(orderId);
            }
          }}
          className={`px-3 py-1 rounded ${
            isSuperAdmin()
              ? 'bg-red-600 text-white hover:bg-red-700'
              : 'bg-red-100 text-red-700 hover:bg-red-200'
          }`}
        >
          Delete
        </button>
      )}

      {/* Super Admin Debug Info */}
      {isSuperAdmin() && (
        <div className="ml-2 px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded">
          🔓 God Mode
        </div>
      )}
    </div>
  );
}

/**
 * Example: Admin Dashboard with Multiple Permission Gates
 * 
 * Shows how to build complex UIs with various permission levels
 */
export function AdminDashboard() {
  const { can, isSuperAdmin, hasAnyPermission } = usePermissions();

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-3xl font-bold">Admin Dashboard</h1>

      {/* God Mode Badge */}
      {isSuperAdmin() && (
        <div className="bg-purple-50 border-l-4 border-purple-600 p-4 rounded">
          <p className="text-purple-700 font-semibold">🔓 Super Admin - God Mode Active</p>
          <p className="text-purple-600 text-sm">You have unrestricted access to all features.</p>
        </div>
      )}

      {/* Orders Management Section */}
      {hasAnyPermission(['view-orders', 'edit-orders', 'delete-orders']) && (
        <section className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-2xl font-bold mb-4">Orders</h2>
          <div className="space-y-2">
            {can('view-orders') && <p>✓ Can view orders</p>}
            {can('create-orders') && <p>✓ Can create orders</p>}
            {can('edit-orders') && <p>✓ Can edit orders</p>}
            {can('delete-orders') && <p>✓ Can delete orders</p>}
          </div>
        </section>
      )}

      {/* Users Management Section */}
      {hasAnyPermission(['view-users', 'edit-users', 'delete-users']) && (
        <section className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-2xl font-bold mb-4">Users</h2>
          <div className="space-y-2">
            {can('view-users') && <p>✓ Can view users</p>}
            {can('create-users') && <p>✓ Can create users</p>}
            {can('edit-users') && <p>✓ Can edit users</p>}
            {can('delete-users') && <p>✓ Can delete users</p>}
          </div>
        </section>
      )}

      {/* System Settings Section - Super Admin Only */}
      {can('manage-system-settings') && (
        <section className="bg-purple-50 p-6 rounded-lg border border-purple-200">
          <h2 className="text-2xl font-bold mb-4">🔐 System Settings</h2>
          <p className="text-gray-700">Only accessible with manage-system-settings permission</p>
        </section>
      )}
    </div>
  );
}
