import { usePermissions } from '../hooks/usePermissions'
import { X } from 'lucide-react'
import { useState } from 'react'

/**
 * Role Debugger Component
 *
 * Shows current user's role and permissions.
 * Use this during development to debug RBAC issues.
 *
 * To use: Add <RoleDebugger /> to any page temporarily
 */
export const RoleDebugger = () => {
  const [isOpen, setIsOpen] = useState(true)
  const {
    user,
    userRole,
    userPermissions,
    communityPlanId,
    isSuperAdmin,
    isManager,
    isCommunityManager,
    getRoleDisplayName,
    getRoleBadgeColor
  } = usePermissions()

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 bg-purple-600 text-white p-3 rounded-full shadow-lg hover:bg-purple-700 z-50"
        title="Show Role Debugger"
      >
        🔍
      </button>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white rounded-xl shadow-2xl border border-gray-200 p-4 max-w-md z-50" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900">מידע על הרשאות</h3>
        <button
          onClick={() => setIsOpen(false)}
          className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <X className="w-4 h-4 text-gray-500" />
        </button>
      </div>

      {/* User Info */}
      <div className="space-y-3">
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="text-xs text-gray-500 mb-1">שם משתמש</div>
          <div className="text-sm font-medium text-gray-900">
            {user?.username || 'לא זמין'}
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-3">
          <div className="text-xs text-gray-500 mb-1">תפקיד</div>
          <div className="flex items-center justify-between">
            <code className="text-sm font-mono text-gray-900">
              {userRole || 'לא זמין'}
            </code>
            {userRole && (
              <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getRoleBadgeColor()}`}>
                {getRoleDisplayName()}
              </span>
            )}
          </div>
        </div>

        {communityPlanId && (
          <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
            <div className="text-xs text-blue-600 mb-1">תוכנית קהילה</div>
            <code className="text-sm font-mono text-gray-900">
              {communityPlanId}
            </code>
          </div>
        )}

        {/* Role Checks */}
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="text-xs text-gray-500 mb-2">בדיקות תפקיד</div>
          <div className="space-y-1 text-xs">
            <div className="flex items-center justify-between">
              <span>Super Admin:</span>
              <span className={isSuperAdmin() ? 'text-green-600 font-medium' : 'text-gray-400'}>
                {isSuperAdmin() ? '✓' : '✗'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Manager:</span>
              <span className={isManager() ? 'text-green-600 font-medium' : 'text-gray-400'}>
                {isManager() ? '✓' : '✗'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Community Manager:</span>
              <span className={isCommunityManager() ? 'text-green-600 font-medium' : 'text-gray-400'}>
                {isCommunityManager() ? '✓' : '✗'}
              </span>
            </div>
          </div>
        </div>

        {/* Permissions Count */}
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="text-xs text-gray-500 mb-1">הרשאות</div>
          <div className="text-sm font-medium text-gray-900">
            {userPermissions.length} הרשאות פעילות
          </div>
          <details className="mt-2">
            <summary className="text-xs text-purple-600 cursor-pointer hover:text-purple-700">
              הצג רשימת הרשאות
            </summary>
            <div className="mt-2 max-h-40 overflow-y-auto">
              <ul className="text-xs space-y-1">
                {userPermissions.map(permission => (
                  <li key={permission} className="text-gray-600 font-mono">
                    • {permission}
                  </li>
                ))}
              </ul>
            </div>
          </details>
        </div>

        {/* Raw User Data */}
        <details className="bg-gray-50 rounded-lg p-3">
          <summary className="text-xs text-gray-600 cursor-pointer hover:text-gray-800">
            הצג נתונים גולמיים
          </summary>
          <pre className="mt-2 text-xs bg-gray-900 text-green-400 p-2 rounded overflow-x-auto">
            {JSON.stringify(user, null, 2)}
          </pre>
        </details>
      </div>

      {/* Warning if no role */}
      {!userRole && (
        <div className="mt-3 bg-red-50 border border-red-200 rounded-lg p-3">
          <div className="text-xs font-medium text-red-800">
            ⚠️ לא נמצא תפקיד!
          </div>
          <div className="text-xs text-red-600 mt-1">
            בדוק שהשרת מחזיר user_type בתגובת ההתחברות
          </div>
        </div>
      )}
    </div>
  )
}

export default RoleDebugger
