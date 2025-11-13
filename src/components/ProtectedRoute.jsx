import { Navigate } from 'react-router-dom'
import { usePermissions } from '../hooks/usePermissions'
import { AlertCircle, ShieldOff } from 'lucide-react'

/**
 * ProtectedRoute Component
 *
 * Protects entire routes based on user roles or permissions.
 * Use this to wrap Route elements that require specific access levels.
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children - The route component to render if authorized
 * @param {string[]} props.allowedRoles - Array of roles that can access this route
 * @param {string[]} props.allowedPermissions - Array of permissions required to access route
 * @param {boolean} props.requireAll - If true, user must have ALL permissions (default: false = ANY)
 * @param {string} props.redirectTo - Path to redirect if unauthorized (default: '/dashboard')
 * @param {boolean} props.showForbidden - Show forbidden page instead of redirecting (default: false)
 *
 * @example
 * // In App.jsx
 * <Route path="/users" element={
 *   <ProtectedRoute allowedRoles={['super_admin']}>
 *     <UsersManagement />
 *   </ProtectedRoute>
 * } />
 *
 * @example
 * // Protect by permission instead of role
 * <Route path="/settings" element={
 *   <ProtectedRoute allowedPermissions={['edit_settings']}>
 *     <Settings />
 *   </ProtectedRoute>
 * } />
 *
 * @example
 * // Multiple roles allowed
 * <Route path="/reports" element={
 *   <ProtectedRoute allowedRoles={['super_admin', 'manager']}>
 *     <Reports />
 *   </ProtectedRoute>
 * } />
 *
 * @example
 * // Show forbidden page instead of redirect
 * <Route path="/danger-zone" element={
 *   <ProtectedRoute allowedRoles={['super_admin']} showForbidden={true}>
 *     <DangerZone />
 *   </ProtectedRoute>
 * } />
 */
export const ProtectedRoute = ({
  children,
  allowedRoles = [],
  allowedPermissions = [],
  requireAll = false,
  redirectTo = '/dashboard',
  showForbidden = false
}) => {
  const {
    hasAnyRole,
    hasAnyPermission,
    hasAllPermissions,
    userRole,
    getRoleDisplayName
  } = usePermissions()

  // Check if user has access
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

  // If no restrictions specified, allow access by default
  if (allowedRoles.length === 0 && allowedPermissions.length === 0) {
    return children
  }

  // If user has access, render the route
  if (hasAccess) {
    return children
  }

  // If unauthorized, show forbidden page or redirect
  if (showForbidden) {
    return <ForbiddenPage userRole={userRole} getRoleDisplayName={getRoleDisplayName} />
  }

  // Redirect to specified path
  return <Navigate to={redirectTo} replace />
}

/**
 * Forbidden Page Component
 *
 * Displayed when user doesn't have permission to access a route.
 */
const ForbiddenPage = ({ userRole, getRoleDisplayName }) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4" dir="rtl">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
              <ShieldOff className="w-10 h-10 text-red-600" />
            </div>
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-gray-900 text-center mb-3">
            גישה נדחתה
          </h1>

          {/* Description */}
          <p className="text-gray-600 text-center mb-6">
            אין לך הרשאה לגשת לעמוד זה.
          </p>

          {/* User Role Info */}
          <div className="bg-gray-50 rounded-xl p-4 mb-6">
            <div className="flex items-center justify-center space-x-reverse space-x-2">
              <AlertCircle className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-600">
                התפקיד שלך: <span className="font-medium">{getRoleDisplayName()}</span>
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={() => window.history.back()}
              className="w-full px-4 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors font-medium"
            >
              חזרה לעמוד הקודם
            </button>

            <button
              onClick={() => (window.location.href = '/iFilterDashboard-FrontEnd/dashboard')}
              className="w-full px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium"
            >
              חזרה לדף הבית
            </button>
          </div>

          {/* Help Text */}
          <p className="text-xs text-gray-500 text-center mt-6">
            אם אתה סבור שזו טעות, צור קשר עם מנהל המערכת
          </p>
        </div>
      </div>
    </div>
  )
}

/**
 * SuperAdminRoute Component
 *
 * Convenience component for super admin only routes.
 *
 * @example
 * <Route path="/system-settings" element={
 *   <SuperAdminRoute>
 *     <SystemSettings />
 *   </SuperAdminRoute>
 * } />
 */
export const SuperAdminRoute = ({ children, ...props }) => {
  return (
    <ProtectedRoute allowedRoles={['super_admin']} {...props}>
      {children}
    </ProtectedRoute>
  )
}

/**
 * ManagerRoute Component
 *
 * Route accessible by managers and super admins.
 *
 * @example
 * <Route path="/reports" element={
 *   <ManagerRoute>
 *     <Reports />
 *   </ManagerRoute>
 * } />
 */
export const ManagerRoute = ({ children, ...props }) => {
  return (
    <ProtectedRoute allowedRoles={['super_admin', 'manager']} {...props}>
      {children}
    </ProtectedRoute>
  )
}

export default ProtectedRoute
