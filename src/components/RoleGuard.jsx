import { usePermissions } from '../hooks/usePermissions'

/**
 * RoleGuard Component
 *
 * Conditionally renders children based on user roles or permissions.
 * Use this to show/hide UI elements based on access control.
 *
 * @param {Object} props
 * @param {string[]} props.allowedRoles - Array of roles that can see the content
 * @param {string[]} props.allowedPermissions - Array of permissions required to see content
 * @param {boolean} props.requireAll - If true, user must have ALL permissions (default: false = ANY)
 * @param {string} props.planId - For community managers, check if they can access this plan
 * @param {React.ReactNode} props.children - Content to render if authorized
 * @param {React.ReactNode} props.fallback - Optional content to show if not authorized
 *
 * @example
 * // Show delete button only to super admins
 * <RoleGuard allowedRoles={['super_admin']}>
 *   <button onClick={handleDelete}>Delete</button>
 * </RoleGuard>
 *
 * @example
 * // Show content if user has specific permission
 * <RoleGuard allowedPermissions={['delete_client']}>
 *   <DeleteButton />
 * </RoleGuard>
 *
 * @example
 * // Show content to multiple roles
 * <RoleGuard allowedRoles={['super_admin', 'manager']}>
 *   <AdminPanel />
 * </RoleGuard>
 *
 * @example
 * // Require multiple permissions
 * <RoleGuard
 *   allowedPermissions={['edit_client', 'view_client']}
 *   requireAll={true}
 * >
 *   <EditForm />
 * </RoleGuard>
 *
 * @example
 * // With fallback content
 * <RoleGuard
 *   allowedRoles={['super_admin']}
 *   fallback={<div>Access Denied</div>}
 * >
 *   <SecretContent />
 * </RoleGuard>
 */
export const RoleGuard = ({
  allowedRoles = [],
  allowedPermissions = [],
  requireAll = false,
  planId = null,
  children,
  fallback = null
}) => {
  const {
    hasAnyRole,
    hasAnyPermission,
    hasAllPermissions,
    canAccessPlan
  } = usePermissions()

  // Check if user should have access
  let hasAccess = false

  // Check roles if provided
  if (allowedRoles.length > 0) {
    hasAccess = hasAnyRole(allowedRoles)
  }

  // Check permissions if provided
  if (allowedPermissions.length > 0) {
    if (requireAll) {
      hasAccess = hasAccess || hasAllPermissions(allowedPermissions)
    } else {
      hasAccess = hasAccess || hasAnyPermission(allowedPermissions)
    }
  }

  // Check plan access if planId provided
  if (planId && !hasAccess) {
    hasAccess = canAccessPlan(planId)
  }

  // If no restrictions specified, deny access by default
  if (allowedRoles.length === 0 && allowedPermissions.length === 0 && !planId) {
    return fallback
  }

  // Render children if authorized, fallback otherwise
  return hasAccess ? children : fallback
}

/**
 * RequireRole Component
 *
 * Convenience component that only checks roles.
 * Shorthand for <RoleGuard allowedRoles={...} />
 *
 * @example
 * <RequireRole roles={['super_admin', 'manager']}>
 *   <AdminContent />
 * </RequireRole>
 */
export const RequireRole = ({ roles, children, fallback = null }) => {
  return (
    <RoleGuard allowedRoles={roles} fallback={fallback}>
      {children}
    </RoleGuard>
  )
}

/**
 * RequirePermission Component
 *
 * Convenience component that only checks permissions.
 * Shorthand for <RoleGuard allowedPermissions={...} />
 *
 * @example
 * <RequirePermission permissions={['delete_client']}>
 *   <DeleteButton />
 * </RequirePermission>
 */
export const RequirePermission = ({
  permissions,
  requireAll = false,
  children,
  fallback = null
}) => {
  return (
    <RoleGuard
      allowedPermissions={permissions}
      requireAll={requireAll}
      fallback={fallback}
    >
      {children}
    </RoleGuard>
  )
}

/**
 * SuperAdminOnly Component
 *
 * Convenience component for super admin only content.
 *
 * @example
 * <SuperAdminOnly>
 *   <DangerZone />
 * </SuperAdminOnly>
 */
export const SuperAdminOnly = ({ children, fallback = null }) => {
  return (
    <RoleGuard allowedRoles={['super_admin']} fallback={fallback}>
      {children}
    </RoleGuard>
  )
}

/**
 * ManagerAndAbove Component
 *
 * Shows content to managers and super admins.
 *
 * @example
 * <ManagerAndAbove>
 *   <ManagementPanel />
 * </ManagerAndAbove>
 */
export const ManagerAndAbove = ({ children, fallback = null }) => {
  return (
    <RoleGuard allowedRoles={['super_admin', 'manager']} fallback={fallback}>
      {children}
    </RoleGuard>
  )
}

export default RoleGuard
