# Role-Based Access Control (RBAC) Guide

## Overview

This guide explains how to use the role-based access control system in the iFilter Dashboard. The RBAC system allows you to control access to features, components, and routes based on user roles and permissions.

---

## Table of Contents

1. [User Roles](#user-roles)
2. [Permission System](#permission-system)
3. [Usage Examples](#usage-examples)
4. [Component Reference](#component-reference)
5. [Hook Reference](#hook-reference)
6. [Best Practices](#best-practices)

---

## User Roles

The system supports three role types defined in the `admins` database table:

### 1. **Super Admin** (`super_admin`)
- **Full system access**
- Can manage all users, clients, plans, and settings
- Access to all features and pages
- Can delete and modify any resource

### 2. **Manager** (`manager`)
- **General management access**
- Can view and manage clients, tickets, and plans
- Cannot manage users or system settings
- Cannot delete critical resources

### 3. **Community Manager** (`community_manager`)
- **Limited to assigned community plan**
- Can only view/edit their assigned community plan (via `community_plan_unique_id`)
- Can manage clients and tickets associated with their plan
- Cannot access other plans or system-wide settings

---

## Permission System

### Permission Structure

Permissions are defined in `src/utils/permissions.js`:

```javascript
export const PERMISSIONS = {
  // Client Management
  VIEW_ALL_CLIENTS: 'view_all_clients',
  VIEW_ASSIGNED_CLIENTS: 'view_assigned_clients',
  EDIT_CLIENT: 'edit_client',
  DELETE_CLIENT: 'delete_client',

  // Ticket Management
  VIEW_ALL_TICKETS: 'view_all_tickets',
  ASSIGN_TICKET: 'assign_ticket',
  CLOSE_TICKET: 'close_ticket',
  // ... more permissions
}
```

### Role-Permission Mapping

Each role has specific permissions:

```javascript
export const ROLE_PERMISSIONS = {
  [ROLES.SUPER_ADMIN]: [
    // All permissions
  ],
  [ROLES.MANAGER]: [
    // Most permissions except user management
  ],
  [ROLES.COMMUNITY_MANAGER]: [
    // Limited permissions for assigned plan
  ]
}
```

---

## Usage Examples

### 1. Component-Level Protection

Use `RoleGuard` to conditionally render UI elements:

```jsx
import { RoleGuard } from './components/RoleGuard'
import { usePermissions } from './hooks/usePermissions'

function TicketsTable() {
  const { PERMISSIONS } = usePermissions()

  return (
    <div>
      {/* Show delete button only to super admins */}
      <RoleGuard allowedRoles={['super_admin']}>
        <button onClick={handleDelete}>Delete</button>
      </RoleGuard>

      {/* Show assign button to users with permission */}
      <RoleGuard allowedPermissions={[PERMISSIONS.ASSIGN_TICKET]}>
        <button onClick={handleAssign}>Assign</button>
      </RoleGuard>

      {/* Show to multiple roles */}
      <RoleGuard allowedRoles={['super_admin', 'manager']}>
        <AdminPanel />
      </RoleGuard>
    </div>
  )
}
```

### 2. Route-Level Protection

Use `ProtectedRoute` to restrict access to entire pages:

```jsx
import { ProtectedRoute, SuperAdminRoute } from './components/ProtectedRoute'
import { Route } from 'react-router-dom'

// In App.jsx
<Routes>
  {/* Super admin only route */}
  <Route path="/users" element={
    <SuperAdminRoute>
      <UsersManagement />
    </SuperAdminRoute>
  } />

  {/* Manager and super admin */}
  <Route path="/settings" element={
    <ProtectedRoute allowedRoles={['super_admin', 'manager']}>
      <Settings />
    </ProtectedRoute>
  } />

  {/* By permission */}
  <Route path="/reports" element={
    <ProtectedRoute allowedPermissions={['view_reports']}>
      <Reports />
    </ProtectedRoute>
  } />

  {/* Show forbidden page instead of redirect */}
  <Route path="/danger-zone" element={
    <ProtectedRoute
      allowedRoles={['super_admin']}
      showForbidden={true}
    >
      <DangerZone />
    </ProtectedRoute>
  } />
</Routes>
```

### 3. Programmatic Permission Checks

Use the `usePermissions` hook for conditional logic:

```jsx
import { usePermissions } from './hooks/usePermissions'

function ClientDetails() {
  const {
    hasPermission,
    isSuperAdmin,
    canAccessPlan,
    PERMISSIONS
  } = usePermissions()

  const handleEdit = () => {
    if (hasPermission(PERMISSIONS.EDIT_CLIENT)) {
      // Allow editing
    } else {
      toast.error('אין לך הרשאה לערוך לקוח זה')
    }
  }

  // Conditional rendering
  if (isSuperAdmin()) {
    return <AdminView />
  }

  // Check plan access (for community managers)
  if (!canAccessPlan(client.plan_id)) {
    return <AccessDenied />
  }

  return <ClientView />
}
```

### 4. Convenience Components

Use shorthand components for common scenarios:

```jsx
import {
  SuperAdminOnly,
  ManagerAndAbove,
  RequirePermission
} from './components/RoleGuard'

function Dashboard() {
  return (
    <div>
      {/* Super admin only */}
      <SuperAdminOnly>
        <DangerZone />
      </SuperAdminOnly>

      {/* Manager and above */}
      <ManagerAndAbove>
        <ManagementPanel />
      </ManagerAndAbove>

      {/* By permission */}
      <RequirePermission permissions={['export_data']}>
        <ExportButton />
      </RequirePermission>
    </div>
  )
}
```

---

## Component Reference

### `<RoleGuard>`

Conditionally renders children based on user roles or permissions.

**Props:**
- `allowedRoles` (string[]): Array of roles that can see the content
- `allowedPermissions` (string[]): Array of permissions required
- `requireAll` (boolean): If true, user must have ALL permissions (default: false)
- `planId` (string): For community managers, check plan access
- `children` (ReactNode): Content to render if authorized
- `fallback` (ReactNode): Content to show if not authorized

**Example:**
```jsx
<RoleGuard
  allowedRoles={['super_admin', 'manager']}
  fallback={<div>Access Denied</div>}
>
  <SecretContent />
</RoleGuard>
```

### `<ProtectedRoute>`

Protects entire routes based on roles or permissions.

**Props:**
- `children` (ReactNode): The route component to render
- `allowedRoles` (string[]): Array of roles that can access
- `allowedPermissions` (string[]): Array of permissions required
- `requireAll` (boolean): Require all permissions (default: false)
- `redirectTo` (string): Redirect path if unauthorized (default: '/dashboard')
- `showForbidden` (boolean): Show forbidden page instead of redirect

**Example:**
```jsx
<ProtectedRoute
  allowedRoles={['super_admin']}
  showForbidden={true}
>
  <AdminPage />
</ProtectedRoute>
```

### `<SuperAdminOnly>`

Shorthand for super admin only content.

```jsx
<SuperAdminOnly>
  <DeleteAllButton />
</SuperAdminOnly>
```

### `<ManagerAndAbove>`

Shows content to managers and super admins.

```jsx
<ManagerAndAbove>
  <ReportsSection />
</ManagerAndAbove>
```

---

## Hook Reference

### `usePermissions()`

Custom hook providing permission check functions.

**Returns:**
```javascript
{
  // User data
  user,                      // Current user object
  userRole,                  // Current user role
  userPermissions,           // Array of user permissions
  communityPlanId,           // Community plan ID (if applicable)

  // Role checks
  hasRole,                   // (role: string) => boolean
  hasAnyRole,                // (roles: string[]) => boolean
  hasAllRoles,               // (roles: string[]) => boolean
  hasMinimumRole,            // (minimumRole: string) => boolean

  // Permission checks
  hasPermission,             // (permission: string) => boolean
  hasAnyPermission,          // (permissions: string[]) => boolean
  hasAllPermissions,         // (permissions: string[]) => boolean

  // Convenience checks
  isSuperAdmin,              // () => boolean
  isManager,                 // () => boolean
  isCommunityManager,        // () => boolean

  // Plan access
  canAccessPlan,             // (planId: string) => boolean

  // UI utilities
  getRoleDisplayName,        // () => string (Hebrew)
  getRoleBadgeColor,         // () => string (Tailwind classes)

  // Constants
  ROLES,                     // Role constants
  PERMISSIONS                // Permission constants
}
```

**Example:**
```jsx
const { hasPermission, isSuperAdmin, PERMISSIONS } = usePermissions()

if (hasPermission(PERMISSIONS.DELETE_CLIENT)) {
  // Show delete button
}

if (isSuperAdmin()) {
  // Show admin panel
}
```

---

## Best Practices

### 1. **Use Permissions Over Roles When Possible**

```jsx
// ✅ Good - More flexible
<RoleGuard allowedPermissions={[PERMISSIONS.EDIT_CLIENT]}>
  <EditButton />
</RoleGuard>

// ❌ Less flexible - Tightly coupled to roles
<RoleGuard allowedRoles={['super_admin', 'manager']}>
  <EditButton />
</RoleGuard>
```

### 2. **Protect Both Frontend and Backend**

Always validate permissions on the backend as well:

```php
// Backend validation
if ($user['user_type'] !== 'super_admin') {
    sendError('Unauthorized', 403);
}
```

### 3. **Use Convenience Components for Readability**

```jsx
// ✅ Clear and readable
<SuperAdminOnly>
  <DangerButton />
</SuperAdminOnly>

// ❌ More verbose
<RoleGuard allowedRoles={['super_admin']}>
  <DangerButton />
</RoleGuard>
```

### 4. **Handle Community Manager Plan Restrictions**

```jsx
const { isCommunityManager, communityPlanId, canAccessPlan } = usePermissions()

// Filter data for community managers
const visibleClients = isCommunityManager()
  ? clients.filter(c => c.plan_id === communityPlanId)
  : clients

// Check plan access before showing details
if (isCommunityManager() && !canAccessPlan(plan.id)) {
  return <AccessDenied />
}
```

### 5. **Display Role Information in UI**

```jsx
import { usePermissions } from './hooks/usePermissions'
import { getRoleBadgeColor, getRoleDisplayName } from './utils/permissions'

function UserProfile() {
  const { userRole } = usePermissions()

  return (
    <div className={`px-3 py-1 rounded-full text-xs font-medium border ${getRoleBadgeColor(userRole)}`}>
      {getRoleDisplayName(userRole)}
    </div>
  )
}
```

### 6. **Adding New Permissions**

When adding new features:

1. **Define the permission** in `src/utils/permissions.js`:
```javascript
export const PERMISSIONS = {
  // ... existing permissions
  MY_NEW_FEATURE: 'my_new_feature'
}
```

2. **Assign to roles** in `ROLE_PERMISSIONS`:
```javascript
export const ROLE_PERMISSIONS = {
  [ROLES.SUPER_ADMIN]: [
    // ... existing permissions
    PERMISSIONS.MY_NEW_FEATURE
  ]
}
```

3. **Use in components**:
```jsx
<RoleGuard allowedPermissions={[PERMISSIONS.MY_NEW_FEATURE]}>
  <MyNewFeature />
</RoleGuard>
```

### 7. **Testing Different Roles**

Create test users with different roles:

```sql
-- Super Admin
INSERT INTO admins (username, password, first_name, last_name, user_type)
VALUES ('superadmin', PASSWORD_HASH, 'Super', 'Admin', 'super_admin');

-- Manager
INSERT INTO admins (username, password, first_name, last_name, user_type)
VALUES ('manager', PASSWORD_HASH, 'Test', 'Manager', 'manager');

-- Community Manager
INSERT INTO admins (username, password, first_name, last_name, user_type, community_plan_unique_id)
VALUES ('community', PASSWORD_HASH, 'Community', 'Manager', 'community_manager', 'PLAN_ID_HERE');
```

---

## File Structure

```
src/
├── utils/
│   └── permissions.js          # Core permission logic & role definitions
├── hooks/
│   └── usePermissions.js       # Custom hook for permission checks
├── components/
│   ├── RoleGuard.jsx          # Component-level conditional rendering
│   └── ProtectedRoute.jsx     # Route-level protection
└── contexts/
    └── GlobalStateContext.jsx  # User state management
```

---

## Common Scenarios

### Scenario 1: Hide Admin Panel from Community Managers

```jsx
<ManagerAndAbove>
  <AdminPanel />
</ManagerAndAbove>
```

### Scenario 2: Community Manager Can Only See Their Clients

```jsx
const { isCommunityManager, communityPlanId } = usePermissions()

const filteredClients = useMemo(() => {
  if (isCommunityManager()) {
    return clients.filter(c => c.plan_id === communityPlanId)
  }
  return clients
}, [clients, isCommunityManager, communityPlanId])
```

### Scenario 3: Only Super Admin Can Delete Users

```jsx
<SuperAdminOnly>
  <button onClick={handleDelete}>
    <Trash className="w-4 h-4" /> מחק משתמש
  </button>
</SuperAdminOnly>
```

### Scenario 4: Managers Can Edit But Not Delete

```jsx
const { hasPermission, PERMISSIONS } = usePermissions()

<div>
  {hasPermission(PERMISSIONS.EDIT_CLIENT) && (
    <button onClick={handleEdit}>ערוך</button>
  )}

  {hasPermission(PERMISSIONS.DELETE_CLIENT) && (
    <button onClick={handleDelete}>מחק</button>
  )}
</div>
```

---

## Troubleshooting

### Issue: Role not detected after login

**Solution:** Check that the backend returns `user_type` and `community_plan_unique_id` in the login response.

### Issue: Permission checks always return false

**Solution:** Ensure user data is stored in localStorage as `userData` with proper structure:

```json
{
  "id": 1,
  "username": "admin",
  "user_type": "super_admin",
  "community_plan_unique_id": null
}
```

### Issue: RoleGuard not hiding content

**Solution:** Import and use the correct permission constants:

```jsx
import { usePermissions } from './hooks/usePermissions'

const { PERMISSIONS } = usePermissions()

<RoleGuard allowedPermissions={[PERMISSIONS.EDIT_CLIENT]}>
  {/* Content */}
</RoleGuard>
```

---

## Summary

The RBAC system provides a flexible, scalable way to control access throughout the application:

- ✅ **Role-based**: Define user roles (super_admin, manager, community_manager)
- ✅ **Permission-based**: Granular control with specific permissions
- ✅ **Component-level**: Show/hide UI elements with `<RoleGuard>`
- ✅ **Route-level**: Protect entire pages with `<ProtectedRoute>`
- ✅ **Programmatic**: Check permissions in code with `usePermissions()`
- ✅ **Type-safe**: Use constants for roles and permissions
- ✅ **Maintainable**: Centralized permission definitions
- ✅ **Scalable**: Easy to add new roles and permissions

For questions or issues, refer to the inline JSDoc documentation in each file.
