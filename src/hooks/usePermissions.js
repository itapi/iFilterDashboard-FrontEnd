import { useMemo } from 'react'
import {
  getCurrentUser,
  getCurrentUserRole,
  hasRole,
  hasAnyRole,
  hasAllRoles,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  hasMinimumRole,
  isSuperAdmin,
  isManager,
  isCommunityManager,
  getCurrentUserPermissions,
  getCommunityPlanId,
  canAccessPlan,
  getRoleDisplayName,
  getRoleBadgeColor,
  ROLES,
  PERMISSIONS
} from '../utils/permissions'

/**
 * Custom hook for permission checks
 *
 * @example
 * const { hasPermission, isSuperAdmin, userRole } = usePermissions()
 *
 * if (hasPermission(PERMISSIONS.DELETE_CLIENT)) {
 *   // Show delete button
 * }
 *
 * @returns {Object} Permission check functions and user data
 */
export const usePermissions = () => {
  // Get current user data (memoized to avoid unnecessary re-renders)
  const user = useMemo(() => getCurrentUser(), [])
  const userRole = useMemo(() => getCurrentUserRole(), [])
  const userPermissions = useMemo(() => getCurrentUserPermissions(), [])
  const communityPlanId = useMemo(() => getCommunityPlanId(), [])

  // Return all permission utilities bound to current user
  return {
    // User data
    user,
    userRole,
    userPermissions,
    communityPlanId,

    // Role checks
    hasRole: (role) => hasRole(role, user),
    hasAnyRole: (roles) => hasAnyRole(roles, user),
    hasAllRoles: (roles) => hasAllRoles(roles, user),
    hasMinimumRole: (minimumRole) => hasMinimumRole(minimumRole, user),

    // Permission checks
    hasPermission: (permission) => hasPermission(permission, user),
    hasAnyPermission: (permissions) => hasAnyPermission(permissions, user),
    hasAllPermissions: (permissions) => hasAllPermissions(permissions, user),

    // Convenience role checks
    isSuperAdmin: () => isSuperAdmin(user),
    isManager: () => isManager(user),
    isCommunityManager: () => isCommunityManager(user),

    // Plan access
    canAccessPlan: (planId) => canAccessPlan(planId, user),

    // UI utilities
    getRoleDisplayName: () => getRoleDisplayName(userRole),
    getRoleBadgeColor: () => getRoleBadgeColor(userRole),

    // Constants (for convenience)
    ROLES,
    PERMISSIONS
  }
}

export default usePermissions
