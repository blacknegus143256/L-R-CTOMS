import { usePage } from '@inertiajs/react';

/**
 * Custom Hook: usePermissions
 * 
 * Provides permission checking with automatic super_admin "God Mode" bypass.
 * Super admins automatically have access to all permissions.
 * 
 * Usage:
 *   const { can, isSuperAdmin, hasAnyPermission } = usePermissions();
 *   
 *   if (can('delete-orders')) {
 *     // Show delete button
 *   }
 */
export function usePermissions() {
  const { auth } = usePage().props;
  const user = auth?.user;

  /**
   * Check if user has a specific permission
   * @param {string} permission - The permission to check
   * @returns {boolean} True if user is super_admin OR has the permission
   */
  const can = (permission) => {
    if (!user) return false;
    
    // GOD MODE: Super admin has all permissions
    if (user.role === 'super_admin') {
      return true;
    }

    // Check if permission array exists in user object
    if (user.permissions && Array.isArray(user.permissions)) {
      return user.permissions.includes(permission);
    }

    return false;
  };

  /**
   * Check if user is super admin
   * @returns {boolean} True if user role is super_admin
   */
  const isSuperAdmin = () => {
    return user?.role === 'super_admin';
  };

  /**
   * Check if user has ANY of the provided permissions
   * @param {string[]} permissions - Array of permissions to check
   * @returns {boolean} True if user has at least one permission
   */
  const hasAnyPermission = (permissions) => {
    if (!Array.isArray(permissions)) return false;
    return permissions.some(permission => can(permission));
  };

  /**
   * Check if user has ALL of the provided permissions
   * @param {string[]} permissions - Array of permissions to check
   * @returns {boolean} True if user has all permissions
   */
  const hasAllPermissions = (permissions) => {
    if (!Array.isArray(permissions)) return false;
    return permissions.every(permission => can(permission));
  };

  return {
    can,
    isSuperAdmin,
    hasAnyPermission,
    hasAllPermissions,
    user,
  };
}

/**
 * Higher-Order Component (HOC) to wrap components with permission checks
 * 
 * Usage:
 *   const ProtectedButton = withPermission(DeleteButton, 'delete-orders');
 */
export function withPermission(Component, requiredPermission) {
  return (props) => {
    const { can } = usePermissions();

    if (!can(requiredPermission)) {
      return null;
    }

    return <Component {...props} />;
  };
}
