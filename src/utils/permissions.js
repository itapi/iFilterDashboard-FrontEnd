/**
 * Role-Based Access Control (RBAC) Utilities
 *
 * This module provides centralized permission management for the iFilter Dashboard.
 * Use these utilities to control access to routes, components, and features based on user roles.
 */

// ============================================================================
// ROLE DEFINITIONS
// ============================================================================

export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  MANAGER: 'manager',
  COMMUNITY_MANAGER: 'community_manager'
}

// Role hierarchy (higher number = more permissions)
export const ROLE_HIERARCHY = {
  [ROLES.SUPER_ADMIN]: 3,
  [ROLES.MANAGER]: 2,
  [ROLES.COMMUNITY_MANAGER]: 1
}

// ============================================================================
// PERMISSION DEFINITIONS
// ============================================================================

/**
 * Define granular permissions for specific features.
 * Add new permissions here as you develop new features.
 */
export const PERMISSIONS = {
  // Dashboard & Analytics
  VIEW_DASHBOARD: 'view_dashboard',
  VIEW_ANALYTICS: 'view_analytics',

  // Client Management
  VIEW_ALL_CLIENTS: 'view_all_clients',
  VIEW_ASSIGNED_CLIENTS: 'view_assigned_clients',
  EDIT_CLIENT: 'edit_client',
  DELETE_CLIENT: 'delete_client',

  // Ticket Management
  VIEW_ALL_TICKETS: 'view_all_tickets',
  VIEW_ASSIGNED_TICKETS: 'view_assigned_tickets',
  EDIT_TICKET: 'edit_ticket',
  ASSIGN_TICKET: 'assign_ticket',
  CLOSE_TICKET: 'close_ticket',
  DELETE_TICKET: 'delete_ticket',

  // Plan Management
  VIEW_ALL_PLANS: 'view_all_plans',
  VIEW_ASSIGNED_PLAN: 'view_assigned_plan',
  CREATE_PLAN: 'create_plan',
  EDIT_PLAN: 'edit_plan',
  DELETE_PLAN: 'delete_plan',
  MANAGE_PLAN_APPS: 'manage_plan_apps',

  // App Management
  VIEW_APPS: 'view_apps',
  EDIT_APP_CATEGORIES: 'edit_app_categories',
  MANAGE_APPS: 'manage_apps',

  // User Management
  VIEW_USERS: 'view_users',
  CREATE_USER: 'create_user',
  EDIT_USER: 'edit_user',
  DELETE_USER: 'delete_user',

  // System Settings
  VIEW_SETTINGS: 'view_settings',
  EDIT_SETTINGS: 'edit_settings',

  // Reports
  VIEW_REPORTS: 'view_reports',
  EXPORT_DATA: 'export_data'
}

// ============================================================================
// ROLE-PERMISSION MAPPING
// ============================================================================

/**
 * Maps roles to their allowed permissions.
 * Modify this to adjust what each role can do.
 */
export const ROLE_PERMISSIONS = {
  [ROLES.SUPER_ADMIN]: [
    // Full system access
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.VIEW_ANALYTICS,
    PERMISSIONS.VIEW_ALL_CLIENTS,
    PERMISSIONS.EDIT_CLIENT,
    PERMISSIONS.DELETE_CLIENT,
    PERMISSIONS.VIEW_ALL_TICKETS,
    PERMISSIONS.EDIT_TICKET,
    PERMISSIONS.ASSIGN_TICKET,
    PERMISSIONS.CLOSE_TICKET,
    PERMISSIONS.DELETE_TICKET,
    PERMISSIONS.VIEW_ALL_PLANS,
    PERMISSIONS.CREATE_PLAN,
    PERMISSIONS.EDIT_PLAN,
    PERMISSIONS.DELETE_PLAN,
    PERMISSIONS.MANAGE_PLAN_APPS,
    PERMISSIONS.VIEW_APPS,
    PERMISSIONS.EDIT_APP_CATEGORIES,
    PERMISSIONS.MANAGE_APPS,
    PERMISSIONS.VIEW_USERS,
    PERMISSIONS.CREATE_USER,
    PERMISSIONS.EDIT_USER,
    PERMISSIONS.DELETE_USER,
    PERMISSIONS.VIEW_SETTINGS,
    PERMISSIONS.EDIT_SETTINGS,
    PERMISSIONS.VIEW_REPORTS,
    PERMISSIONS.EXPORT_DATA
  ],

  [ROLES.MANAGER]: [
    // Manager access - limited to assigned clients and their tickets only
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.VIEW_ANALYTICS,
    PERMISSIONS.VIEW_ASSIGNED_CLIENTS,
    PERMISSIONS.EDIT_CLIENT,
    PERMISSIONS.VIEW_ASSIGNED_TICKETS,
    PERMISSIONS.EDIT_TICKET,
    PERMISSIONS.ASSIGN_TICKET,
    PERMISSIONS.CLOSE_TICKET,
    PERMISSIONS.VIEW_ALL_PLANS,
    PERMISSIONS.EDIT_PLAN,
    PERMISSIONS.MANAGE_PLAN_APPS,
    PERMISSIONS.VIEW_APPS,
    PERMISSIONS.EDIT_APP_CATEGORIES,
    PERMISSIONS.VIEW_REPORTS,
    PERMISSIONS.EXPORT_DATA
  ],

  [ROLES.COMMUNITY_MANAGER]: [
    // Limited to assigned community plan
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.VIEW_ASSIGNED_CLIENTS,
    PERMISSIONS.VIEW_ASSIGNED_TICKETS,
    PERMISSIONS.EDIT_TICKET,
    PERMISSIONS.CLOSE_TICKET,
    PERMISSIONS.VIEW_ASSIGNED_PLAN,
    PERMISSIONS.MANAGE_PLAN_APPS,
    PERMISSIONS.VIEW_APPS,
    PERMISSIONS.VIEW_REPORTS
  ]
}

// ============================================================================
// PERMISSION CHECK FUNCTIONS
// ============================================================================

/**
 * Get the current user from localStorage
 * @returns {Object|null} User object with role information
 */
export const getCurrentUser = () => {
  try {
    const userData = localStorage.getItem('iFilter_userData')
    if (userData) {
      return JSON.parse(userData)
    }
  } catch (error) {
    console.error('Error parsing user data:', error)
  }
  return null
}

/**
 * Get the current user's role
 * @returns {string|null} User role or null if not found
 */
export const getCurrentUserRole = () => {
  const user = getCurrentUser()
  return user?.user_type || user?.role || null
}

/**
 * Check if user has a specific role
 * @param {string} role - Role to check
 * @param {Object} user - Optional user object (uses current user if not provided)
 * @returns {boolean}
 */
export const hasRole = (role, user = null) => {
  const userRole = user?.user_type || user?.role || getCurrentUserRole()
  return userRole === role
}

/**
 * Check if user has any of the specified roles
 * @param {string[]} roles - Array of roles to check
 * @param {Object} user - Optional user object (uses current user if not provided)
 * @returns {boolean}
 */
export const hasAnyRole = (roles, user = null) => {
  if (!Array.isArray(roles) || roles.length === 0) return false
  const userRole = user?.user_type || user?.role || getCurrentUserRole()
  return roles.includes(userRole)
}

/**
 * Check if user has all of the specified roles (useful for multi-role scenarios)
 * @param {string[]} roles - Array of roles to check
 * @param {Object} user - Optional user object (uses current user if not provided)
 * @returns {boolean}
 */
export const hasAllRoles = (roles, user = null) => {
  if (!Array.isArray(roles) || roles.length === 0) return false
  const userRole = user?.user_type || user?.role || getCurrentUserRole()
  // Since users typically have one role, check if userRole matches all
  return roles.every(role => role === userRole)
}

/**
 * Check if user has a specific permission
 * @param {string} permission - Permission to check
 * @param {Object} user - Optional user object (uses current user if not provided)
 * @returns {boolean}
 */
export const hasPermission = (permission, user = null) => {
  const userRole = user?.user_type || user?.role || getCurrentUserRole()
  if (!userRole) return false

  const rolePermissions = ROLE_PERMISSIONS[userRole] || []
  return rolePermissions.includes(permission)
}

/**
 * Check if user has any of the specified permissions
 * @param {string[]} permissions - Array of permissions to check
 * @param {Object} user - Optional user object (uses current user if not provided)
 * @returns {boolean}
 */
export const hasAnyPermission = (permissions, user = null) => {
  if (!Array.isArray(permissions) || permissions.length === 0) return false
  return permissions.some(permission => hasPermission(permission, user))
}

/**
 * Check if user has all of the specified permissions
 * @param {string[]} permissions - Array of permissions to check
 * @param {Object} user - Optional user object (uses current user if not provided)
 * @returns {boolean}
 */
export const hasAllPermissions = (permissions, user = null) => {
  if (!Array.isArray(permissions) || permissions.length === 0) return false
  return permissions.every(permission => hasPermission(permission, user))
}

/**
 * Check if user role is higher or equal in hierarchy
 * @param {string} minimumRole - Minimum required role
 * @param {Object} user - Optional user object (uses current user if not provided)
 * @returns {boolean}
 */
export const hasMinimumRole = (minimumRole, user = null) => {
  const userRole = user?.user_type || user?.role || getCurrentUserRole()
  if (!userRole) return false

  const userLevel = ROLE_HIERARCHY[userRole] || 0
  const requiredLevel = ROLE_HIERARCHY[minimumRole] || 0

  return userLevel >= requiredLevel
}

/**
 * Check if user is super admin
 * @param {Object} user - Optional user object (uses current user if not provided)
 * @returns {boolean}
 */
export const isSuperAdmin = (user = null) => {
  return hasRole(ROLES.SUPER_ADMIN, user)
}

/**
 * Check if user is manager (or higher)
 * @param {Object} user - Optional user object (uses current user if not provided)
 * @returns {boolean}
 */
export const isManager = (user = null) => {
  return hasMinimumRole(ROLES.MANAGER, user)
}

/**
 * Check if user is community manager
 * @param {Object} user - Optional user object (uses current user if not provided)
 * @returns {boolean}
 */
export const isCommunityManager = (user = null) => {
  return hasRole(ROLES.COMMUNITY_MANAGER, user)
}

/**
 * Get all permissions for a role
 * @param {string} role - Role to get permissions for
 * @returns {string[]} Array of permissions
 */
export const getRolePermissions = (role) => {
  return ROLE_PERMISSIONS[role] || []
}

/**
 * Get all permissions for current user
 * @returns {string[]} Array of permissions
 */
export const getCurrentUserPermissions = () => {
  const userRole = getCurrentUserRole()
  return getRolePermissions(userRole)
}

/**
 * Get user's community plan ID (for community managers)
 * @param {Object} user - Optional user object (uses current user if not provided)
 * @returns {string|null}
 */
export const getCommunityPlanId = (user = null) => {
  const currentUser = user || getCurrentUser()
  return currentUser?.community_plan_unique_id || null
}

/**
 * Check if user can access a specific community plan
 * @param {string} planId - Plan ID to check
 * @param {Object} user - Optional user object (uses current user if not provided)
 * @returns {boolean}
 */
export const canAccessPlan = (planId, user = null) => {
  const currentUser = user || getCurrentUser()
  const userRole = currentUser?.user_type || currentUser?.role

  // Super admin and manager can access all plans
  if (hasMinimumRole(ROLES.MANAGER, currentUser)) {
    return true
  }

  // Community manager can only access their assigned plan
  if (userRole === ROLES.COMMUNITY_MANAGER) {
    return getCommunityPlanId(currentUser) === planId
  }

  return false
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get human-readable role name
 * @param {string} role - Role constant
 * @returns {string} Display name
 */
export const getRoleDisplayName = (role) => {
  const roleNames = {
    [ROLES.SUPER_ADMIN]: 'מנהל על',
    [ROLES.MANAGER]: 'מנהל',
    [ROLES.COMMUNITY_MANAGER]: 'מנהל קהילה'
  }
  return roleNames[role] || role
}

/**
 * Get role badge color (for UI display)
 * @param {string} role - Role constant
 * @returns {string} Tailwind color classes
 */
export const getRoleBadgeColor = (role) => {
  const colors = {
    [ROLES.SUPER_ADMIN]: 'bg-purple-100 text-purple-800 border-purple-200',
    [ROLES.MANAGER]: 'bg-blue-100 text-blue-800 border-blue-200',
    [ROLES.COMMUNITY_MANAGER]: 'bg-green-100 text-green-800 border-green-200'
  }
  return colors[role] || 'bg-gray-100 text-gray-800 border-gray-200'
}

// ============================================================================
// EXPORT ALL
// ============================================================================

export default {
  ROLES,
  ROLE_HIERARCHY,
  PERMISSIONS,
  ROLE_PERMISSIONS,
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
  getRolePermissions,
  getCurrentUserPermissions,
  getCommunityPlanId,
  canAccessPlan,
  getRoleDisplayName,
  getRoleBadgeColor
}
