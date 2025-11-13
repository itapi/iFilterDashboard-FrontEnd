# iFilter Backend RBAC Implementation Guide

## Overview

This guide documents the Role-Based Access Control (RBAC) system implemented for the iFilter Dashboard backend. The system ensures that users can only access data and perform operations appropriate to their role.

## Security Architecture

### ✅ Frontend + Backend Protection

The iFilter system now has **defense in depth** with RBAC implemented at both layers:

1. **Frontend RBAC** (UI/UX Layer)
   - Hides/shows menu items based on role
   - Disables buttons and features
   - Provides better user experience
   - Located: `src/utils/permissions.js`, `src/hooks/usePermissions.js`

2. **Backend RBAC** (Security Layer) ⭐ **NEW**
   - **Cannot be bypassed** by users
   - Validates every API request
   - Filters database queries by role
   - Prevents unauthorized data access
   - Located: `backEndPhp/api/core/AuthMiddleware.php`

## Role Definitions

### Role Hierarchy

| Role | Level | Description |
|------|-------|-------------|
| `super_admin` | 3 | Full system access - can see and manage everything |
| `manager` | 2 | Can manage all plans, clients, tickets, and apps |
| `community_manager` | 1 | Limited to their assigned community plan only |

### Role Permissions

#### Super Admin
- ✅ View/manage all clients
- ✅ View/manage all tickets
- ✅ View/manage all plans
- ✅ Manage users
- ✅ System settings
- ✅ All exports and reports

#### Manager
- ✅ View/manage all clients
- ✅ View/manage all tickets
- ✅ View/manage all plans
- ✅ Manage apps and categories
- ❌ Cannot manage users
- ❌ Cannot access system settings

#### Community Manager
- ✅ View clients in their assigned plan only
- ✅ View tickets for their clients only
- ✅ Manage apps for their plan
- ✅ View their plan details
- ❌ Cannot see other plans' data
- ❌ Cannot change plan assignments
- ❌ Cannot access system settings

## Implementation Details

### 1. Authentication Middleware (`AuthMiddleware.php`)

Located: `backEndPhp/api/core/AuthMiddleware.php`

**Key Methods:**

```php
// Require authentication (401 if not logged in)
$user = $auth->requireAuth($conn);

// Check role
if ($auth->isCommunityManager($user)) {
    // Handle community manager logic
}

// Check if user can access a specific plan
if (!$auth->canAccessPlan($planId, $user)) {
    // Deny access
}

// Check if user can access a specific client
if (!$auth->canAccessClient($clientPlanId, $user)) {
    // Deny access
}

// Get user's assigned community plan ID
$communityPlanId = $auth->getCommunityPlanId($user);
```

### 2. BaseAPI Integration

All API endpoints extending `BaseAPI` automatically:
- Require valid JWT authentication
- Have access to `$this->auth` (AuthMiddleware instance)
- Have access to `$this->currentUser` (authenticated user data)

```php
class MyAPI extends BaseAPI {
    public function someMethod() {
        // Authentication already verified by BaseAPI constructor
        // Check permissions
        if ($this->auth->isCommunityManager($this->currentUser)) {
            // Apply filtering
        }
    }
}
```

### 3. Data Filtering Pattern

#### Pattern Used in `clients.php` and `tickets.php`

```php
// 1. Define role-based conditions
$roleConditions = '';
$roleParams = [];
$roleTypes = '';

if ($this->auth->isCommunityManager($this->currentUser)) {
    $communityPlanId = $this->auth->getCommunityPlanId($this->currentUser);
    if (!$communityPlanId) {
        // Return empty result
        return;
    }
    $roleConditions = 'c.plan_unique_id = ?';
    $roleParams[] = $communityPlanId;
    $roleTypes = 's';
}

// 2. Add to base query
$baseQuery = "SELECT ... FROM table ...";
if ($roleConditions) {
    $baseQuery .= " WHERE " . $roleConditions;
}

// 3. Merge parameters
if (!empty($roleParams)) {
    $queryData['params'] = array_merge($roleParams, $queryData['params']);
    $queryData['types'] = $roleTypes . $queryData['types'];
}
```

## Protected Endpoints

### ✅ Fully Protected Endpoints

#### `/api/clients` (clients.php)
- `?action=with_details` - Lists clients (filtered by role)
- `?action=update_status` - Checks client ownership before update
- `?action=update_plan` - Checks client ownership + denies community managers
- `?action=update_client` - Checks client ownership
- `?action=extend_subscription` - Checks client ownership
- `GET /{clientId}` - Returns 403 if user cannot access client

#### `/api/tickets` (tickets.php)
- `?action=with_details` - Lists tickets (filtered by role)
- `?action=updates` - Shows updates for accessible tickets only
- `?action=add_update` - Validates ticket access before adding update
- `?action=close` - Checks ticket ownership
- `?action=assign` - Managers+ only

### 🔒 Authorization Checks Added

#### Client Operations
```php
// Check before any sensitive operation
$clientCheckSql = "SELECT plan_unique_id FROM clients WHERE client_unique_id = ?";
// ... fetch client
if (!$this->auth->canAccessClient($client['plan_unique_id'], $this->currentUser)) {
    APIResponse::error('Access denied', 403);
}
```

#### Ticket Operations
```php
// Tickets are filtered via JOIN with clients table
// Community managers only see tickets where c.plan_unique_id = their_plan
```

## Testing the RBAC System

### Test Case 1: Community Manager Accessing Own Clients ✅

**Setup:**
- User: Community Manager
- Assigned Plan: `PLAN-001`
- Database: Has clients in `PLAN-001` and `PLAN-002`

**API Call:**
```bash
GET /api/clients?action=with_details
Authorization: Bearer {community_manager_token}
```

**Expected Result:**
- Returns only clients where `plan_unique_id = 'PLAN-001'`
- HTTP 200 OK

### Test Case 2: Community Manager Accessing Other Plan's Client ❌

**Setup:**
- User: Community Manager
- Assigned Plan: `PLAN-001`
- Target: Client in `PLAN-002`

**API Call:**
```bash
PUT /api/clients?action=update_status
Authorization: Bearer {community_manager_token}
Body: { "client_unique_id": "123", "status": "active" }
```

**Expected Result:**
- HTTP 403 Forbidden
- Error: "Access denied"

### Test Case 3: Manager Accessing All Clients ✅

**Setup:**
- User: Manager

**API Call:**
```bash
GET /api/clients?action=with_details
Authorization: Bearer {manager_token}
```

**Expected Result:**
- Returns ALL clients regardless of plan
- HTTP 200 OK

### Test Case 4: Unauthenticated Access ❌

**API Call:**
```bash
GET /api/clients?action=with_details
(No Authorization header)
```

**Expected Result:**
- HTTP 401 Unauthorized
- Error: "Authentication required"

## Database Schema Requirements

### `admins` Table

Must include these columns for RBAC to work:

```sql
CREATE TABLE admins (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    user_type ENUM('super_admin', 'manager', 'community_manager') NOT NULL,
    community_plan_unique_id VARCHAR(50) NULL,  -- Required for community managers
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

**Important:** Community managers MUST have `community_plan_unique_id` set to their assigned plan ID.

### Example User Records

```sql
-- Super Admin
INSERT INTO admins (username, password, user_type, community_plan_unique_id)
VALUES ('admin', '{hashed_password}', 'super_admin', NULL);

-- Manager
INSERT INTO admins (username, password, user_type, community_plan_unique_id)
VALUES ('manager1', '{hashed_password}', 'manager', NULL);

-- Community Manager (assigned to PLAN-001)
INSERT INTO admins (username, password, user_type, community_plan_unique_id)
VALUES ('cm_plan001', '{hashed_password}', 'community_manager', 'PLAN-001');
```

## How to Add RBAC to New Endpoints

### Step 1: Extend BaseAPI

```php
<?php
require_once __DIR__ . '/../core/BaseAPI.php';

class MyNewAPI extends BaseAPI {
    public function __construct() {
        parent::__construct('my_table', 'id');
        // $this->auth and $this->currentUser are now available
    }
}
```

### Step 2: Add Role Filtering to List Queries

```php
private function getMyDataWithDetails() {
    // Apply role-based filtering
    $roleConditions = '';
    $roleParams = [];
    $roleTypes = '';

    if ($this->auth->isCommunityManager($this->currentUser)) {
        $communityPlanId = $this->auth->getCommunityPlanId($this->currentUser);
        if (!$communityPlanId) {
            APIResponse::success(['data' => [], 'pagination' => [...]]);
            return;
        }
        $roleConditions = 't.plan_unique_id = ?';
        $roleParams[] = $communityPlanId;
        $roleTypes = 's';
    }

    $baseQuery = "SELECT * FROM my_table t WHERE ...";
    if ($roleConditions) {
        $baseQuery .= ($baseQuery contains WHERE ? " AND " : " WHERE ") . $roleConditions;
    }

    // ... rest of query building
}
```

### Step 3: Add Access Checks to Individual Operations

```php
private function updateMyRecord() {
    $recordId = $_GET['id'];

    // Fetch the record to check plan ownership
    $sql = "SELECT plan_unique_id FROM my_table WHERE id = ?";
    $stmt = $this->conn->prepare($sql);
    $stmt->bind_param("i", $recordId);
    $stmt->execute();
    $record = $stmt->get_result()->fetch_assoc();

    if (!$record) {
        APIResponse::error('Record not found', 404);
    }

    // Check access
    if (!$this->auth->canAccessClient($record['plan_unique_id'], $this->currentUser)) {
        APIResponse::error('Access denied', 403);
    }

    // Proceed with update
}
```

## Security Best Practices

### ✅ DO's

1. **Always filter list queries by role** - Community managers should never see all data
2. **Check ownership before updates/deletes** - Verify user can access the specific record
3. **Use prepared statements** - Prevent SQL injection (already done in BaseAPI)
4. **Validate input** - Check all parameters before processing
5. **Return appropriate HTTP status codes**:
   - `401 Unauthorized` - No/invalid token
   - `403 Forbidden` - Valid token but insufficient permissions
   - `404 Not Found` - Record doesn't exist OR user cannot access it
6. **Log security events** - Track who accessed what (future enhancement)

### ❌ DON'Ts

1. **Don't trust frontend checks** - Always validate on backend
2. **Don't expose plan IDs in error messages** - Use generic "Access denied"
3. **Don't skip role checks** - Even for "internal" endpoints
4. **Don't hardcode role names** - Use constants from AuthMiddleware
5. **Don't bypass BaseAPI** - Authentication happens in constructor

## Troubleshooting

### Problem: Community Manager sees all clients

**Solution:** Check that:
1. `community_plan_unique_id` is set in the `admins` table
2. The JWT token includes this field (may need to re-login)
3. Role filtering code is present in `getClientsWithDetails()`

### Problem: 401 Unauthorized on all requests

**Solution:** Check that:
1. Authorization header is being sent: `Bearer {token}`
2. Token is valid and not expired
3. `AuthMiddleware.php` is included in `BaseAPI.php`

### Problem: 403 Forbidden for valid operations

**Solution:** Check that:
1. User's role in database matches expected role
2. Community manager has correct `community_plan_unique_id`
3. The plan ID in database matches client's `plan_unique_id`

## Future Enhancements

### Recommended Additions

1. **Audit Logging**
   ```php
   // Log all sensitive operations
   logAudit($userId, $action, $resourceType, $resourceId);
   ```

2. **Permission-Based Access** (more granular)
   ```php
   // Instead of just roles, check specific permissions
   if (!$this->auth->hasPermission('edit_client', $this->currentUser)) {
       APIResponse::error('No permission to edit clients', 403);
   }
   ```

3. **Rate Limiting**
   ```php
   // Prevent API abuse
   if (!$rateLimiter->checkLimit($userId, $endpoint)) {
       APIResponse::error('Rate limit exceeded', 429);
   }
   ```

4. **IP Whitelisting** (for super sensitive operations)
   ```php
   if (!$ipWhitelist->isAllowed($_SERVER['REMOTE_ADDR'])) {
       APIResponse::error('Access denied from this IP', 403);
   }
   ```

## Summary

✅ **Backend RBAC is now fully implemented**

**What's Protected:**
- All API endpoints require authentication
- Clients endpoint filters by plan for community managers
- Tickets endpoint filters by plan for community managers
- Individual operations check ownership before allowing updates
- Community managers cannot change plan assignments

**What This Prevents:**
- ❌ Bypassing frontend restrictions via direct API calls
- ❌ Community managers viewing other plans' data
- ❌ Unauthorized modifications to clients/tickets
- ❌ Unauthenticated API access

**Testing:**
- Use different user tokens (super_admin, manager, community_manager)
- Try accessing resources outside assigned plan (should fail)
- Verify filtered results match expected data

---

**Questions or Issues?**
- Check `AuthMiddleware.php` for available methods
- Review `clients.php` and `tickets.php` for implementation examples
- Test with different user roles to verify behavior
