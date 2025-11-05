<?php
require_once __DIR__ . '/../core/BaseAPI.php';
require_once __DIR__ . '/../core/APIResponse.php';
require_once __DIR__ . '/../core/FilterBuilder.php';

class ClientsAPI extends BaseAPI {
    public function __construct() {
        parent::__construct('clients', 'client_unique_id');
    }
    
    public function handleRequest() {
        $method = $_SERVER['REQUEST_METHOD'];
        $action = $_GET['action'] ?? '';
        
        // Handle URL path for individual client operations
        $request = $_SERVER['REQUEST_URI'];
        $path = parse_url($request, PHP_URL_PATH);
        $pathSegments = explode('/', trim($path, '/'));
        
        // Find the clients segment and get the client ID
        $clientsIndex = array_search('clients', $pathSegments);
        $clientId = ($clientsIndex !== false && isset($pathSegments[$clientsIndex + 1])) ? $pathSegments[$clientsIndex + 1] : null;
        
        // Set PATH_INFO for BaseAPI if we have a client ID
        if ($clientId && empty($action)) {
            $_SERVER['PATH_INFO'] = '/' . $clientId;
        }
        
        switch ($action) {
            case 'with_details':
                $this->getClientsWithDetails();
                break;
            case 'by_status':
                $this->getClientsByStatus();
                break;
            case 'statistics':
                $this->getClientStatistics();
                break;
            case 'update_status':
                $this->updateClientStatus();
                break;
            case 'update_plan':
                $this->updateClientPlan();
                break;
            case 'sync_status':
                $this->updateSyncStatus();
                break;
            case 'extend_subscription':
                $this->extendSubscription();
                break;
            case 'device_data':
                $this->getClientDeviceData();
                break;
            default:
                parent::handleRequest();
        }
    }
    
    private function getClientsWithDetails() {
        try {
            // Initialize filter builder
            $filterBuilder = new FilterBuilder();
            
            // Set searchable fields
            $filterBuilder->setSearchableFields([
                'c.first_name',
                'c.last_name',
                'c.email',
                'c.phone',
                'c.imei',
                'fp.plan_name',
                'cl.level_name'
            ]);
            
            // Set sort options
            // addSortOption($field, $alias) - where $field is SQL field, $alias is frontend key
            $filterBuilder->addSortOption('c.client_unique_id', 'client_unique_id')
                         ->addSortOption("CONCAT(c.first_name, ' ', c.last_name)", 'name')
                         ->addSortOption("CONCAT(c.first_name, ' ', c.last_name)", 'full_name')
                         ->addSortOption('c.email', 'email')
                         ->addSortOption('c.phone', 'phone')
                         ->addSortOption('c.plan_status', 'plan_status')
                         ->addSortOption('c.trial_status', 'trial_status')
                         ->addSortOption('c.registration_date', 'registration_date')
                         ->addSortOption('c.last_sync', 'last_sync')
                         ->addSortOption('c.last_sync', 'sync_status')
                         ->addSortOption('c.plan_expiry_date', 'plan_expiry')
                         ->addSortOption('fp.plan_name', 'plan_name')
                         ->addSortOption('cl.level_name', 'level_name')
                         ->addSortOption('c.model', 'model')
                         ->setDefaultSort('c.registration_date', 'DESC');

            // Parse filters from request with proper field mapping
            $filters = $_GET;
            
            // Map plan_status filter
            if (isset($filters['plan_status']) && !empty($filters['plan_status'])) {
                if (is_array($filters['plan_status'])) {
                    $filterBuilder->addFilter('c.plan_status', $filters['plan_status'], 'in');
                } else {
                    $filterBuilder->addFilter('c.plan_status', $filters['plan_status']);
                }
                unset($filters['plan_status']);
            }
            
            // Map trial_status filter
            if (isset($filters['trial_status']) && !empty($filters['trial_status'])) {
                if (is_array($filters['trial_status'])) {
                    $filterBuilder->addFilter('c.trial_status', $filters['trial_status'], 'in');
                } else {
                    $filterBuilder->addFilter('c.trial_status', $filters['trial_status']);
                }
                unset($filters['trial_status']);
            }
            
            // Map plan_unique_id filter
            if (isset($filters['plan_unique_id']) && !empty($filters['plan_unique_id'])) {
                if (is_array($filters['plan_unique_id'])) {
                    $filterBuilder->addFilter('c.plan_unique_id', $filters['plan_unique_id'], 'in');
                } else {
                    $filterBuilder->addFilter('c.plan_unique_id', $filters['plan_unique_id']);
                }
                unset($filters['plan_unique_id']);
            }
            
            // Handle expiry filters
            if (isset($filters['expiring_soon']) && $filters['expiring_soon'] == '1') {
                $filterBuilder->addFilter('c.plan_expiry_date', date('Y-m-d', strtotime('+7 days')), 'lte');
                $filterBuilder->addFilter('c.plan_expiry_date', date('Y-m-d'), 'gte');
                unset($filters['expiring_soon']);
            }
            
            // Handle sync status
            if (isset($filters['sync_status'])) {
                if ($filters['sync_status'] === 'recent') {
                    $filterBuilder->addFilter('c.last_sync', date('Y-m-d H:i:s', strtotime('-1 day')), 'gte');
                } elseif ($filters['sync_status'] === 'stale') {
                    $filterBuilder->addFilter('c.last_sync', date('Y-m-d H:i:s', strtotime('-7 day')), 'lt');
                } elseif ($filters['sync_status'] === 'never') {
                    $filterBuilder->addFilter('c.last_sync', null, 'is_null');
                }
                unset($filters['sync_status']);
            }
            
            // Parse remaining filters
            $filterBuilder->parseFilters($filters);
            
            // Base count query
            $baseCountQuery = "
                SELECT COUNT(DISTINCT c.client_unique_id) as total
                FROM clients c
                LEFT JOIN filtering_plans fp ON c.plan_unique_id = fp.plan_unique_id
                LEFT JOIN client_levels cl ON c.client_level_id = cl.id
            ";
            
            // Build count query with filters
            $countQuery = $filterBuilder->buildCountQuery($baseCountQuery);
            
            // Execute count query
            if (!empty($countQuery['params'])) {
                $countStmt = $this->conn->prepare($countQuery['query']);
                if (!empty($countQuery['types'])) {
                    $countStmt->bind_param($countQuery['types'], ...$countQuery['params']);
                }
                $countStmt->execute();
                $totalCount = $countStmt->get_result()->fetch_assoc()['total'];
            } else {
                $countResult = $this->conn->query($countQuery['query']);
                $totalCount = $countResult->fetch_assoc()['total'];
            }
            
            // Base clients query
    // Base clients query 
$baseQuery = " 
    SELECT  
        c.*, 
        CONCAT(c.first_name, ' ', c.last_name) as full_name, 
        fp.plan_name, 
 
        cl.level_name, 
        CASE  
            WHEN c.last_sync > DATE_SUB(NOW(), INTERVAL 1 DAY) THEN 'recent' 
            WHEN c.last_sync > DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 'normal' 
            WHEN c.last_sync IS NOT NULL THEN 'stale' 
            ELSE 'never' 
        END as sync_status, 
        CASE
            WHEN (CASE WHEN c.plan_status = 'trial' THEN c.trial_expiry_date ELSE c.plan_expiry_date END) < NOW() THEN 'expired'
            WHEN (CASE WHEN c.plan_status = 'trial' THEN c.trial_expiry_date ELSE c.plan_expiry_date END) < DATE_ADD(NOW(), INTERVAL 7 DAY) THEN 'expiring_soon'
            WHEN (CASE WHEN c.plan_status = 'trial' THEN c.trial_expiry_date ELSE c.plan_expiry_date END) < DATE_ADD(NOW(), INTERVAL 30 DAY) THEN 'expiring_month'
            ELSE 'active'
        END as expiry_status,
        DATEDIFF(
            CASE WHEN c.plan_status = 'trial' THEN c.trial_expiry_date ELSE c.plan_expiry_date END,
            NOW()
        ) as days_until_expiry 
    FROM clients c
    LEFT JOIN filtering_plans fp ON c.plan_unique_id = fp.plan_unique_id
    LEFT JOIN client_levels cl ON c.client_level_id = cl.id 
"; 

            
            // Build main query with filters and pagination
            $queryData = $filterBuilder->buildQuery($baseQuery, $_GET);

            // Execute main query
            if (!empty($queryData['params'])) {
                $stmt = $this->conn->prepare($queryData['query']);
                if (!empty($queryData['types'])) {
                    $stmt->bind_param($queryData['types'], ...$queryData['params']);
                }
                $stmt->execute();
                $clients = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
            } else {
                $result = $this->conn->query($queryData['query']);
                $clients = $result->fetch_all(MYSQLI_ASSOC);
            }
            
            // Calculate pagination info
            $pagination = $queryData['pagination'];
            $totalPages = ceil($totalCount / $pagination['limit']);
            $hasMore = $pagination['page'] < $totalPages;
            
            APIResponse::success([
                'data' => $clients,
                'pagination' => [
                    'current_page' => $pagination['page'],
                    'per_page' => $pagination['limit'],
                    'total' => (int)$totalCount,
                    'total_pages' => $totalPages,
                    'has_more' => $hasMore
                ]
            ], 'Clients with details fetched successfully');
        } catch (Exception $e) {
            APIResponse::error('Failed to fetch clients: ' . $e->getMessage(), 500);
        }
    }
    
    private function getClientStatistics() {
        try {
            $stats = [];
            
            // Plan status distribution
            $planStatusSql = "
                SELECT 
                    plan_status,
                    COUNT(*) as count
                FROM clients
                GROUP BY plan_status
            ";
            $planStatusResult = $this->conn->query($planStatusSql);
            $stats['plan_status'] = [];
            while ($row = $planStatusResult->fetch_assoc()) {
                $stats['plan_status'][$row['plan_status']] = (int)$row['count'];
            }
            
            // Trial status distribution
            $trialStatusSql = "
                SELECT 
                    trial_status,
                    COUNT(*) as count
                FROM clients
                GROUP BY trial_status
            ";
            $trialStatusResult = $this->conn->query($trialStatusSql);
            $stats['trial_status'] = [];
            while ($row = $trialStatusResult->fetch_assoc()) {
                $stats['trial_status'][$row['trial_status']] = (int)$row['count'];
            }
            
            // Sync status
            $syncSql = "
                SELECT 
                    CASE 
                        WHEN last_sync > DATE_SUB(NOW(), INTERVAL 1 DAY) THEN 'recent'
                        WHEN last_sync > DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 'normal'
                        WHEN last_sync IS NOT NULL THEN 'stale'
                        ELSE 'never'
                    END as sync_status,
                    COUNT(*) as count
                FROM clients
                GROUP BY sync_status
            ";
            $syncResult = $this->conn->query($syncSql);
            $stats['sync_status'] = [];
            while ($row = $syncResult->fetch_assoc()) {
                $stats['sync_status'][$row['sync_status']] = (int)$row['count'];
            }
            
            // Expiry status
            $expirySql = "
                SELECT 
                    CASE 
                        WHEN plan_expiry_date < NOW() THEN 'expired'
                        WHEN plan_expiry_date < DATE_ADD(NOW(), INTERVAL 7 DAY) THEN 'expiring_soon'
                        WHEN plan_expiry_date < DATE_ADD(NOW(), INTERVAL 30 DAY) THEN 'expiring_month'
                        ELSE 'active'
                    END as expiry_status,
                    COUNT(*) as count
                FROM clients
                WHERE plan_expiry_date IS NOT NULL
                GROUP BY expiry_status
            ";
            $expiryResult = $this->conn->query($expirySql);
            $stats['expiry_status'] = [];
            while ($row = $expiryResult->fetch_assoc()) {
                $stats['expiry_status'][$row['expiry_status']] = (int)$row['count'];
            }
            
            // Total counts
            $totalSql = "SELECT COUNT(*) as total FROM clients";
            $totalResult = $this->conn->query($totalSql);
            $stats['totals'] = [
                'all_clients' => (int)$totalResult->fetch_assoc()['total']
            ];
            
            APIResponse::success($stats, 'Client statistics fetched successfully');
        } catch (Exception $e) {
            APIResponse::error('Failed to fetch client statistics: ' . $e->getMessage(), 500);
        }
    }
    
    private function updateClientStatus() {
        if ($_SERVER['REQUEST_METHOD'] !== 'PUT') {
            APIResponse::error('Method not allowed', 405);
        }
        
        $input = $this->getJsonInput();
        $clientUniqueId = $input['client_unique_id'] ?? null;
        $status = $input['status'] ?? null;
        
        if (!$clientUniqueId || !$status) {
            APIResponse::error('Client unique ID and status are required', 400);
        }
        
        $validStatuses = ['active', 'trial', 'inactive'];
        if (!in_array($status, $validStatuses)) {
            APIResponse::error('Invalid status provided', 400);
        }
        
        try {
            $sql = "UPDATE clients SET plan_status = ? WHERE client_unique_id = ?";
            $stmt = $this->conn->prepare($sql);
            $stmt->bind_param("si", $status, $clientUniqueId);
            
            if ($stmt->execute()) {
                if ($stmt->affected_rows > 0) {
                    APIResponse::success([
                        'client_unique_id' => $clientUniqueId,
                        'new_status' => $status
                    ], 'Client status updated successfully');
                } else {
                    APIResponse::error('Client not found or no changes made', 404);
                }
            } else {
                APIResponse::error('Failed to update client status', 500);
            }
        } catch (Exception $e) {
            APIResponse::error('Failed to update client status: ' . $e->getMessage(), 500);
        }
    }
    
    private function updateClientPlan() {
        if ($_SERVER['REQUEST_METHOD'] !== 'PUT') {
            APIResponse::error('Method not allowed', 405);
        }
        
        $input = $this->getJsonInput();
        $clientUniqueId = $input['client_unique_id'] ?? null;
        $planUniqueId = $input['plan_unique_id'] ?? null;
        $startDate = $input['start_date'] ?? date('Y-m-d H:i:s');
        $expiryDate = $input['expiry_date'] ?? null;

        if (!$clientUniqueId || !$planUniqueId) {
            APIResponse::error('Client unique ID and Plan unique ID are required', 400);
        }
        
        try {
            $sql = "
                UPDATE clients
                SET
                    plan_unique_id = ?,
                    plan_start_date = ?,
                    plan_expiry_date = ?,
                    plan_status = 'active'
                WHERE client_unique_id = ?
            ";
            $stmt = $this->conn->prepare($sql);
            $stmt->bind_param("ssss", $planUniqueId, $startDate, $expiryDate, $clientUniqueId);
            
            if ($stmt->execute()) {
                if ($stmt->affected_rows > 0) {
                    APIResponse::success([
                        'client_unique_id' => $clientUniqueId,
                        'plan_unique_id' => $planUniqueId,
                        'start_date' => $startDate,
                        'expiry_date' => $expiryDate
                    ], 'Client plan updated successfully');
                } else {
                    APIResponse::error('Client not found or no changes made', 404);
                }
            } else {
                APIResponse::error('Failed to update client plan', 500);
            }
        } catch (Exception $e) {
            APIResponse::error('Failed to update client plan: ' . $e->getMessage(), 500);
        }
    }
    
    private function updateSyncStatus() {
        if ($_SERVER['REQUEST_METHOD'] !== 'PUT') {
            APIResponse::error('Method not allowed', 405);
        }
        
        $input = $this->getJsonInput();
        $clientUniqueId = $input['client_unique_id'] ?? null;
        
        if (!$clientUniqueId) {
            APIResponse::error('Client unique ID is required', 400);
        }
        
        try {
            $sql = "UPDATE clients SET last_sync = NOW() WHERE client_unique_id = ?";
            $stmt = $this->conn->prepare($sql);
            $stmt->bind_param("i", $clientUniqueId);
            
            if ($stmt->execute()) {
                if ($stmt->affected_rows > 0) {
                    APIResponse::success([
                        'client_unique_id' => $clientUniqueId,
                        'last_sync' => date('Y-m-d H:i:s')
                    ], 'Client sync status updated successfully');
                } else {
                    APIResponse::error('Client not found', 404);
                }
            } else {
                APIResponse::error('Failed to update sync status', 500);
            }
        } catch (Exception $e) {
            APIResponse::error('Failed to update sync status: ' . $e->getMessage(), 500);
        }
    }
    
    private function extendSubscription() {
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            APIResponse::error('Method not allowed', 405);
        }
        
        $input = $this->getJsonInput();
        $clientUniqueId = $input['client_unique_id'] ?? null;
        $extendBy = $input['extend_by'] ?? null;
        
        if (!$clientUniqueId) {
            APIResponse::error('Client unique ID is required', 400);
        }
        
        if (!$extendBy) {
            APIResponse::error('Extension period is required', 400);
        }
        
        // Validate extend_by parameter
        $validPeriods = ['week', 'month', 'year'];
        if (!in_array($extendBy, $validPeriods)) {
            APIResponse::error('Invalid extension period. Must be: week, month, or year', 400);
        }
        
        try {
            // First, get the current client data
            $sql = "SELECT plan_expiry_date, trial_expiry_date, plan_status FROM clients WHERE client_unique_id = ?";
            $stmt = $this->conn->prepare($sql);
            $stmt->bind_param("i", $clientUniqueId);
            $stmt->execute();
            $result = $stmt->get_result();

            if ($result->num_rows === 0) {
                APIResponse::error('Client not found', 404);
            }

            $client = $result->fetch_assoc();
            $planStatus = $client['plan_status'];

            // Determine which expiry date to extend based on plan_status
            if ($planStatus === 'trial') {
                $currentExpiry = $client['trial_expiry_date'];
                $dateField = 'trial_expiry_date';
            } else {
                $currentExpiry = $client['plan_expiry_date'];
                $dateField = 'plan_expiry_date';
            }

            // Calculate new expiry date based on current expiry or today (whichever is later)
            $baseDate = $currentExpiry ? max(date('Y-m-d'), $currentExpiry) : date('Y-m-d');
            $newExpiryDate = $this->calculateNewExpiryDate($baseDate, $extendBy);

            // Update the appropriate expiry date field
            $updateSql = "UPDATE clients SET $dateField = ? WHERE client_unique_id = ?";
            $updateStmt = $this->conn->prepare($updateSql);
            $updateStmt->bind_param("si", $newExpiryDate, $clientUniqueId);

            if ($updateStmt->execute()) {
                if ($updateStmt->affected_rows > 0) {
                    // Calculate days until expiry
                    $daysUntilExpiry = $this->calculateDaysUntilExpiry($newExpiryDate);

                    APIResponse::success([
                        'client_unique_id' => $clientUniqueId,
                        'new_expiry_date' => $newExpiryDate,
                        'days_until_expiry' => $daysUntilExpiry,
                        'extended_by' => $extendBy,
                        'date_field_updated' => $dateField
                    ], 'Subscription extended successfully');
                } else {
                    APIResponse::error('No changes made', 400);
                }
            } else {
                APIResponse::error('Failed to extend subscription', 500);
            }
        } catch (Exception $e) {
            APIResponse::error('Failed to extend subscription: ' . $e->getMessage(), 500);
        }
    }
    
    private function calculateNewExpiryDate($baseDate, $extendBy) {
        $date = new DateTime($baseDate);
        
        switch ($extendBy) {
            case 'week':
                $date->add(new DateInterval('P7D'));
                break;
            case 'month':
                $date->add(new DateInterval('P1M'));
                break;
            case 'year':
                $date->add(new DateInterval('P1Y'));
                break;
        }
        
        return $date->format('Y-m-d');
    }
    
    private function calculateDaysUntilExpiry($expiryDate) {
        $today = new DateTime();
        $expiry = new DateTime($expiryDate);
        $interval = $today->diff($expiry);

        return $interval->invert ? -$interval->days : $interval->days;
    }

    private function getClientDeviceData() {
        if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
            APIResponse::error('Method not allowed', 405);
        }

        $clientUniqueId = $_GET['client_unique_id'] ?? null;

        if (!$clientUniqueId) {
            APIResponse::error('Client unique ID is required', 400);
        }

        try {
            $sql = "
                SELECT
                    cdd.client_unique_id,
                    cdd.device_id,
                    cdd.android_version,
                    cdd.model,
                    cdd.magisk_modules,
                    cdd.xposed_modules,
                    cdd.cpu_architecture,
                    cdd.manufacturer,
                    cdd.last_sync,
                    c.imei,
                    CASE
                        WHEN cdd.last_sync > DATE_SUB(NOW(), INTERVAL 1 DAY) THEN 'recent'
                        WHEN cdd.last_sync > DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 'normal'
                        WHEN cdd.last_sync IS NOT NULL THEN 'stale'
                        ELSE 'never'
                    END as sync_status
                FROM client_device_data cdd
                LEFT JOIN clients c ON cdd.client_unique_id = c.client_unique_id
                WHERE cdd.client_unique_id = ?
            ";

            $stmt = $this->conn->prepare($sql);
            $stmt->bind_param("i", $clientUniqueId);
            $stmt->execute();
            $result = $stmt->get_result();

            if ($result->num_rows === 0) {
                // Return empty device data structure if no device data exists
                APIResponse::success([
                    'client_unique_id' => $clientUniqueId,
                    'device_id' => null,
                    'android_version' => null,
                    'model' => null,
                    'magisk_modules' => null,
                    'xposed_modules' => null,
                    'cpu_architecture' => null,
                    'manufacturer' => null,
                    'last_sync' => null,
                    'imei' => null,
                    'sync_status' => 'never',
                    'has_magisk' => false,
                    'has_xposed' => false,
                    'is_rooted' => false
                ], 'No device data available for this client');
            }

            $deviceData = $result->fetch_assoc();

            // Parse JSON fields
            $magiskModules = null;
            $xposedModules = null;

            if ($deviceData['magisk_modules']) {
                $magiskModules = json_decode($deviceData['magisk_modules'], true);
            }

            if ($deviceData['xposed_modules']) {
                $xposedModules = json_decode($deviceData['xposed_modules'], true);
            }

            // Add computed fields
            $deviceData['magisk_modules'] = $magiskModules;
            $deviceData['xposed_modules'] = $xposedModules;
            $deviceData['has_magisk'] = !empty($magiskModules);
            $deviceData['has_xposed'] = !empty($xposedModules);
            $deviceData['is_rooted'] = !empty($magiskModules) || !empty($xposedModules);
            $deviceData['magisk_module_count'] = is_array($magiskModules) ? count($magiskModules) : 0;
            $deviceData['xposed_module_count'] = is_array($xposedModules) ? count($xposedModules) : 0;

            APIResponse::success($deviceData, 'Device data fetched successfully');
        } catch (Exception $e) {
            APIResponse::error('Failed to fetch device data: ' . $e->getMessage(), 500);
        }
    }
}

$api = new ClientsAPI();
$api->handleRequest();
?>